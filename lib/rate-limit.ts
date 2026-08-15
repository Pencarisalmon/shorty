import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/auth-schema";

export const OTP_WINDOW_S = Number(process.env.OTP_RATE_LIMIT_WINDOW ?? 60);
export const OTP_MAX = Number(process.env.OTP_RATE_LIMIT_MAX ?? 5);

export type OtpSendBody = { email?: string };

const WINDOW_MS = OTP_WINDOW_S * 1000;

// Sliding-window limiter keyed by email, same shape as better-auth's own
// rateLimit rows (key/count/lastRequest) so both share one table. Rolling
// window: a request counts if it lands within WINDOW_MS of the last one.
// ponytail: read-modify-write is not atomic, so a concurrent burst can slip
// past the email bucket. The per-IP limiter is atomic and covers same-IP
// hammering; make the count update conditional (WHERE count < OTP_MAX) if
// distributed concurrent abuse ever matters.
export async function consumeEmailOtpLimit(
  email: string
): Promise<{ allowed: boolean; retryAfter: number }> {
  const key = `otp-email:${email}`;
  const now = Date.now();
  const row = (await db.select().from(rateLimit).where(eq(rateLimit.key, key)).limit(1))[0];

  if (!row) {
    await db
      .insert(rateLimit)
      .values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
      .onConflictDoNothing();
    return { allowed: true, retryAfter: 0 };
  }
  if (now - row.lastRequest > WINDOW_MS) {
    await db.update(rateLimit).set({ count: 1, lastRequest: now }).where(eq(rateLimit.key, key));
    return { allowed: true, retryAfter: 0 };
  }
  if (row.count >= OTP_MAX) {
    return {
      allowed: false,
      retryAfter: Math.ceil((row.lastRequest + WINDOW_MS - now) / 1000),
    };
  }
  await db
    .update(rateLimit)
    .set({ count: row.count + 1, lastRequest: now })
    .where(eq(rateLimit.key, key));
  return { allowed: true, retryAfter: 0 };
}