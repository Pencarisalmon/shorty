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

export function VariantARegisterSlip({
  mode,
  simulatedStep,
  showSimulatedError,
}: {
  mode: "sign-in" | "sign-up";
  simulatedStep: "email" | "otp";
  showSimulatedError: boolean;
}) {
  const [internalStep, setInternalStep] = useState<"email" | "otp">(simulatedStep);
  const [email, setEmail] = useState("alex@example.com");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  // Sync with simulation controls
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
      alert(`[Prototype A] Verified with code: ${otp || "123456"}`);
    }, 400);
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer physical receipt container with drop shadow */}
      <div className="relative w-full max-w-[420px] bg-[#fdfdfb] border-2 border-ink shadow-[6px_6px_0_0_var(--ink)]">
        {/* Top Jagged Receipt Edge (CSS simulated serration) */}
        <div className="h-2 w-full bg-[radial-gradient(#1b1b18_1.5px,transparent_1.5px)] [background-size:8px_8px] border-b border-ink/20 opacity-40" />

        {/* Receipt Header */}
        <div className="px-5 pt-4 pb-3 text-center border-b-2 border-dashed border-ink/40">
          <div className="flex items-center justify-between text-[11px] font-bold tracking-widest text-muted-foreground">
            <span>TERMINAL #01</span>
            <span className="text-stamp">REC-AUTH</span>
            <span>SHORTY.PW</span>
          </div>
          <h1 className="mt-2 text-[22px] font-bold tracking-[0.14em] text-ink">
            {mode === "sign-in" ? "SIGN IN SLIP" : "NEW ACCOUNT SLIP"}
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground tracking-tight">
            {mode === "sign-in"
              ? "Fast access pass to your short link tape"
              : "No password required — code creates account"}
          </p>
        </div>

        {/* Section 1: Express Tender / OAuth */}
        <div className="p-5 bg-paper/30">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-[0.1em] text-ink">
              [1] EXPRESS TENDER (OAUTH)
            </span>
            <span className="text-[10px] text-muted-foreground">1-CLICK</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="flex items-center justify-center gap-2 border-2 border-ink bg-white py-2.5 px-3 text-[13px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper active:translate-x-[1px] active:translate-y-[1px] transition-colors cursor-pointer"
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
              <span>GOOGLE</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 border-2 border-ink bg-white py-2.5 px-3 text-[13px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper active:translate-x-[1px] active:translate-y-[1px] transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.11-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
              <span>GITHUB</span>
            </button>
          </div>
        </div>

        {/* Perforated Divider with Hole Punches */}
        <div className="relative flex items-center justify-center my-0 py-2 border-y border-dashed border-ink/40 bg-[#f8f8f2]">
          {/* Left circle cut notch */}
          <div className="absolute -left-3 size-5 rounded-full bg-paper border-2 border-ink z-10" />
          <span className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            OR DISPATCH ONE-TIME CODE
          </span>
          {/* Right circle cut notch */}
          <div className="absolute -right-3 size-5 rounded-full bg-paper border-2 border-ink z-10" />
        </div>

        {/* Section 2: One-Time Code Flow */}
        <div className="p-5">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="register-email"
                  className="text-[11px] font-bold tracking-widest text-ink flex items-center justify-between"
                >
                  <span>[2] VISITOR EMAIL:</span>
                  <span className="text-muted-foreground text-[10px]">NO PASSWORD</span>
                </label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="h-auto rounded-none border-2 border-ink bg-white px-3.5 py-2.5 text-[15px] font-mono shadow-[3px_3px_0_0_var(--ink)] focus-visible:outline-stamp"
                />
              </div>

              {showSimulatedError && (
                <div className="p-2 border-2 border-error bg-error/10 text-error text-[12px] font-bold tracking-tight">
                  [!] ERROR: That doesn&apos;t look like a valid email address.
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="mt-1 h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[15px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90 active:translate-x-[1px] active:translate-y-[1px]"
              >
                {busy ? "PRINTING CODE…" : "PRINT 6-DIGIT CODE ↵"}
              </Button>
            </form>
          ) : (
            /* OTP Step */
            <form onSubmit={handleVerify} className="flex flex-col gap-3">
              <div className="text-center pb-1">
                <div className="inline-block border border-stamp text-stamp text-[10px] font-bold px-2 py-0.5 mb-1 tracking-widest uppercase">
                  DISPATCHED // EXPIRES 5 MIN
                </div>
                <p className="text-[12px] text-muted-foreground">
                  Sent to <span className="font-bold text-ink">{email}</span>
                </p>
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
                <div className="p-2 border-2 border-error bg-error/10 text-error text-[12px] font-bold tracking-tight text-center">
                  [!] INVALID CODE: Check your inbox or request a new code.
                </div>
              )}

              <Button
                type="submit"
                disabled={busy || otp.length < 6}
                className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[15px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90"
              >
                {busy ? "CHECKING…" : mode === "sign-up" ? "VERIFY & SIGN UP" : "VERIFY & SIGN IN"}
              </Button>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={() => setInternalStep("email")}
                  className="text-muted-foreground underline underline-offset-2 hover:text-ink cursor-pointer"
                >
                  ← edit email
                </button>
                <button
                  type="button"
                  onClick={() => alert("Resent one-time code to " + email)}
                  className="font-bold text-stamp underline underline-offset-2 hover:text-ink cursor-pointer"
                >
                  resend code
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Perforated Cut-Off Line with Scissors */}
        <div className="flex items-center justify-between px-3 text-[11px] text-muted-foreground border-t-2 border-dashed border-ink/40 bg-[#f4f4ec] py-1.5 font-mono select-none">
          <span>✂ - - - - - - - - - -</span>
          <span className="font-bold text-ink">TEAR HERE</span>
          <span>- - - - - - - - - - ✂</span>
        </div>

        {/* Tear-Off Customer Stub */}
        <div className="p-4 bg-[#fafaf6] text-center flex flex-col gap-2">
          <p className="text-[10px] tracking-widest text-muted-foreground uppercase">
            KEEP THIS RECEIPT STUB
          </p>
          <div className="flex items-center justify-between text-[12px] pt-1">
            <Link
              href="/"
              className="font-bold text-stamp underline underline-offset-[3px] hover:text-ink"
            >
              ← back to printer
            </Link>
            <Link
              href={mode === "sign-in" ? "/sign-up" : "/sign-in"}
              className="text-muted-foreground underline underline-offset-[3px] hover:text-ink font-medium"
            >
              {mode === "sign-in" ? "first time? sign up →" : "have a code? sign in →"}
            </Link>
          </div>
        </div>

        {/* Bottom Serration */}
        <div className="h-2 w-full bg-[radial-gradient(#1b1b18_1.5px,transparent_1.5px)] [background-size:8px_8px] border-t border-ink/20 opacity-40" />
      </div>
    </div>
  );
}
