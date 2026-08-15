import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import type { BetterAuthOptions } from "better-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/auth-schema";

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
  if (!res.ok) throw new Error(`Resend failed: ${res.status}`);
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
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],
});