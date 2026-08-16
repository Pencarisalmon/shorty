"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export function VariantBVoucherCard({
  mode,
  simulatedStep,
  showSimulatedError,
}: {
  mode: "sign-in" | "sign-up";
  simulatedStep: "email" | "otp";
  showSimulatedError: boolean;
}) {
  const [internalStep, setInternalStep] = useState<"email" | "otp">(simulatedStep);
  const [email, setEmail] = useState("sam@shorty.dev");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const step = simulatedStep || internalStep;

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      setInternalStep("otp");
    }, 400);
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      alert(`[Prototype B] Verified with code: ${otp || "123456"}`);
    }, 400);
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer Two-Part Ticket Voucher Card */}
      <div className="w-full max-w-[660px] bg-[#fdfdfb] border-2 border-ink shadow-[6px_6px_0_0_var(--ink)]">
        {/* Main Top Header Strip */}
        <div className="flex flex-wrap items-center justify-between border-b-2 border-ink px-5 py-3 bg-white">
          <div className="flex items-center gap-3">
            <div className="border-2 border-stamp px-2 py-0.5 text-[11px] font-bold tracking-widest text-stamp uppercase">
              VOUCHER #2026
            </div>
            <span className="text-[14px] font-bold tracking-[0.1em] text-ink uppercase">
              {mode === "sign-in" ? "SESSION PASS" : "IDENTITY PASS"}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            GATE: AUTH-01
          </span>
        </div>

        {/* Two-Part Split Body */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] divide-y-2 md:divide-y-0 md:divide-x-2 md:divide-dashed divide-ink">
          {/* Left / Side Voucher Stub: Express Social Pass */}
          <div className="p-5 flex flex-col justify-between bg-[#fbfbf7] relative">
            {/* Cutout Notch on Top and Bottom Divider (desktop) */}
            <div className="hidden md:block absolute -right-2.5 -top-2.5 size-5 rounded-full bg-paper border-2 border-ink z-10" />
            <div className="hidden md:block absolute -right-2.5 -bottom-2.5 size-5 rounded-full bg-paper border-2 border-ink z-10" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-stamp tracking-wider">
                  [PASS A] EXPRESS
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  INSTANT
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug mb-4">
                Instant verification via your existing linked provider.
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 border-2 border-ink bg-white py-2.5 px-3 text-[13px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.57-5.17 3.57-8.81Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.27a12 12 0 0 0 0 10.76l4.01-3.1Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.45A11.98 11.98 0 0 0 1.27 6.62l4.01 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
                    />
                  </svg>
                  <span>GOOGLE PASS</span>
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-2 border-2 border-ink bg-white py-2.5 px-3 text-[13px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.11-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                  </svg>
                  <span>GITHUB PASS</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-line text-[10px] text-muted-foreground">
              ⚡ No code entry needed for express sign-in
            </div>
          </div>

          {/* Right / Main Section: One-Time Code Verification */}
          <div className="p-5 flex flex-col justify-between bg-[#ffffff]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-ink tracking-wider">
                  [PASS B] EMAIL ONE-TIME CODE
                </span>
                <span className="text-[10px] font-mono border border-ink/40 px-1.5 py-0.5">
                  {step === "email" ? "STEP 01" : "STEP 02"}
                </span>
              </div>

              {step === "email" ? (
                <form onSubmit={handleSendCode} className="flex flex-col gap-3.5 mt-2">
                  <p className="text-[12px] text-muted-foreground">
                    We will email a 6-digit one-time pass code valid for 5 minutes.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="voucher-email" className="text-[11px] font-bold uppercase tracking-wider text-ink">
                      Email Destination:
                    </label>
                    <Input
                      id="voucher-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="h-auto rounded-none border-2 border-ink bg-paper/40 px-3.5 py-2.5 text-[15px] font-mono shadow-[2px_2px_0_0_var(--ink)] focus-visible:outline-stamp"
                    />
                  </div>

                  {showSimulatedError && (
                    <div className="p-2 border-2 border-error bg-error/10 text-error text-[12px] font-bold tracking-tight">
                      [!] INVALID EMAIL: Please verify your address formatting.
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[14px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90"
                  >
                    {busy ? "DISPATCHING…" : "REQUEST ONE-TIME CODE →"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="flex flex-col gap-3.5 mt-2">
                  <div className="flex items-center justify-between bg-paper/60 p-2 border border-ink/30">
                    <span className="text-[11px] text-muted-foreground">Code sent to:</span>
                    <span className="text-[12px] font-bold text-ink truncate max-w-[180px]">{email}</span>
                  </div>

                  <div className="flex justify-center py-2">
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={otp}
                      onChange={setOtp}
                      autoFocus
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {showSimulatedError && (
                    <div className="p-2 border-2 border-error bg-error/10 text-error text-[12px] font-bold text-center">
                      [!] CODE MISMATCH / EXPIRED
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={busy || otp.length < 6}
                    className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[14px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90"
                  >
                    {busy ? "CONFIRMING…" : mode === "sign-up" ? "VALIDATE & SIGN UP" : "VALIDATE & SIGN IN"}
                  </Button>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={() => setInternalStep("email")}
                      className="text-muted-foreground underline underline-offset-2 hover:text-ink cursor-pointer"
                    >
                      ← change email
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Resent code to " + email)}
                      className="font-bold text-stamp underline underline-offset-2 hover:text-ink cursor-pointer"
                    >
                      resend code
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-line flex items-center justify-between text-[11px]">
              <Link href="/" className="font-bold text-stamp hover:underline underline-offset-2">
                ← printer home
              </Link>
              <Link
                href={mode === "sign-in" ? "/sign-up" : "/sign-in"}
                className="text-muted-foreground hover:text-ink underline underline-offset-2"
              >
                {mode === "sign-in" ? "need an account? sign up →" : "already registered? sign in →"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
