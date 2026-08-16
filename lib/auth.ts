import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/auth-schema";
import { consumeEmailOtpLimit, OTP_MAX, OTP_WINDOW_S, type OtpSendBody } from "@/lib/rate-limit";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30-day sliding window
const ABSOLUTE_CAP_MS = 90 * 24 * 60 * 60 * 1000; // 90-day absolute cap

async function sendOtpEmail(email: string, otp: string) {
  if (!process.env.RESEND_API_KEY) {
    // ponytail: dev fallback — no Resend key, print OTP to server log. Remove
    // once a real key is wired; never log OTPs in production.
    console.log(`[auth] OTP for ${email}: ${otp}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "Shorty <onboarding@resend.dev>",
      to: [email],
      subject: "Your Shorty sign-in code",
      html: `<p>Your Shorty sign-in code:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${otp}</p><p>It expires in 5 minutes.</p>`,
    }),
  });
  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`Resend failed: ${res.status}${errorBody ? ` - ${errorBody}` : ""}`);
  }
}

// better-auth has no absolute session cap; wrap the adapter so a session whose
// createdAt is >= 90 days old dies on its next refresh instead of sliding again.
const makeAdapter = (options: BetterAuthOptions) => {
  const base = drizzleAdapter(db, { provider: "pg", schema })(options);
  return {
    ...base,
    async update(args: Parameters<typeof base.update>[0]) {
      if (args.model === "session" && args.update.expiresAt) {
        const existing = (await base.findOne({
          model: "session",
          where: args.where,
        })) as { createdAt?: Date | string } | null;
        const createdAt = existing?.createdAt
          ? new Date(existing.createdAt).getTime()
          : 0;
        if (createdAt && Date.now() - createdAt >= ABSOLUTE_CAP_MS) {
          args.update.expiresAt = new Date();
        }
      }
      return base.update(args);
    },
  };
};

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: makeAdapter,
  session: {
    expiresIn: SESSION_MS / 1000,
    updateAge: 24 * 60 * 60, // slide daily on use
  },
  // Per-client (IP) throttling, DB-backed so it survives serverless cold
  // starts. Window/max defaults (10s/100 per IP per path) are a safety net for
  // the rest of the auth API; OTP paths get the stricter 60s/5 from the
  // emailOTP plugin rules below, so normal use never trips this.
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/email-otp/send-verification-otp") return;
      // Per-email throttle on top of better-auth's per-IP limiter: an abuser
      // rotating IPs must not be able to burn the quota for one inbox.
      const email = (ctx.body as OtpSendBody | null)?.email;
      if (!email) return;
      const { allowed, retryAfter } = await consumeEmailOtpLimit(email.toLowerCase());
      if (!allowed) {
        return {
          response: new Response(
            JSON.stringify({ message: "Too many requests. Please try again later." }),
            {
              status: 429,
              statusText: "Too Many Requests",
              headers: { "X-Retry-After": String(retryAfter) },
            }
          ),
        };
      }
    }),
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      // Link Google/GitHub identities to the existing email-OTP account even
      // when the IdP reports email_verified: false — receipts must never split.
      trustedProviders: ["google", "github"],
    },
  },
  plugins: [
    emailOTP({
      rateLimit: { window: OTP_WINDOW_S, max: OTP_MAX },
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});