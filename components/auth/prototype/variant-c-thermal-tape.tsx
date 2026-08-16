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

export function VariantCThermalTape({
  mode,
  simulatedStep,
  showSimulatedError,
}: {
  mode: "sign-in" | "sign-up";
  simulatedStep: "email" | "otp";
  showSimulatedError: boolean;
}) {
  const [internalStep, setInternalStep] = useState<"email" | "otp">(simulatedStep);
  const [authMethod, setAuthMethod] = useState<"email" | "social">("email");
  const [email, setEmail] = useState("taylor@example.com");
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
      alert(`[Prototype C] Verified with code: ${otp || "123456"}`);
    }, 400);
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Outer Continuous Thermal Tape */}
      <div className="w-full max-w-[500px] bg-[#fafaf7] border-2 border-ink shadow-[4px_4px_0_0_var(--ink)]">
        {/* Top Paper Feed Slot (Printer mechanism simulation) */}
        <div className="bg-ink px-4 py-2 flex items-center justify-between text-paper text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 bg-stamp animate-pulse" />
            <span className="font-bold tracking-widest uppercase">
              SHORTY FEED // AUTH-UNIT
            </span>
          </div>
          <span className="opacity-70">TAPE v2.0</span>
        </div>

        {/* Paper Tape Body */}
        <div className="p-6 flex flex-col gap-5 bg-[#fefefa]">
          {/* Main Title & Stamp */}
          <div className="flex items-start justify-between border-b-2 border-ink pb-4">
            <div>
              <h1 className="text-[20px] font-bold tracking-[0.1em] text-ink uppercase">
                {mode === "sign-in" ? "SIGN IN TAPE" : "REGISTRATION TAPE"}
              </h1>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {mode === "sign-in"
                  ? "Access your saved links and ownership permissions."
                  : "Instant setup via email verification or social identity."}
              </p>
            </div>
            <div className="border-2 border-stamp text-stamp px-2 py-1 text-[11px] font-bold -rotate-3 select-none">
              {mode === "sign-in" ? "VERIFIED" : "NEW ENTRY"}
            </div>
          </div>

          {/* Auth Method Selector (Tabbed Segmented Pill) */}
          <div className="flex border-2 border-ink bg-white">
            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`flex-1 py-2 text-[12px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                authMethod === "email"
                  ? "bg-ink text-paper"
                  : "bg-white text-ink hover:bg-paper"
              }`}
            >
              ✉ EMAIL ONE-TIME CODE
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("social")}
              className={`flex-1 py-2 border-l-2 border-ink text-[12px] font-bold tracking-wider uppercase transition-colors cursor-pointer ${
                authMethod === "social"
                  ? "bg-ink text-paper"
                  : "bg-white text-ink hover:bg-paper"
              }`}
            >
              ⚡ SOCIAL ID (OAUTH)
            </button>
          </div>

          {authMethod === "social" ? (
            /* Social / OAuth Flow */
            <div className="flex flex-col gap-3 py-2">
              <p className="text-[12px] text-muted-foreground text-center">
                Authenticate instantly with your developer or personal account:
              </p>

              <button
                type="button"
                className="flex items-center justify-center gap-3 border-2 border-ink bg-white py-3 text-[14px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
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
                <span>CONTINUE WITH GOOGLE</span>
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-3 border-2 border-ink bg-white py-3 text-[14px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.11-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
                <span>CONTINUE WITH GITHUB</span>
              </button>
            </div>
          ) : (
            /* Email / One-Time Code Flow */
            <div>
              {step === "email" ? (
                <form onSubmit={handleSendCode} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tape-email" className="text-[12px] font-bold text-ink flex items-center justify-between">
                      <span>EMAIL ADDRESS:</span>
                      <span className="text-[10px] text-muted-foreground">SECURE LINKLESS AUTH</span>
                    </label>
                    <Input
                      id="tape-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-auto rounded-none border-2 border-ink bg-white px-3.5 py-3 text-[15px] shadow-[2px_2px_0_0_var(--ink)] focus-visible:outline-stamp"
                    />
                  </div>

                  {showSimulatedError && (
                    <div className="p-2.5 border-2 border-error bg-error/10 text-error text-[12px] font-bold">
                      [X] ERROR: Invalid email syntax. Try again.
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[15px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90"
                  >
                    {busy ? "TRANSMITTING…" : "SEND 6-DIGIT CODE ↵"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-dashed border-line pb-2">
                    <div className="text-[12px] text-muted-foreground">
                      Recipient: <span className="font-bold text-ink">{email}</span>
                    </div>
                    <span className="border border-stamp text-stamp text-[10px] font-bold px-1.5 py-0.5">
                      EXP: 05:00
                    </span>
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
                    <div className="p-2.5 border-2 border-error bg-error/10 text-error text-[12px] font-bold text-center">
                      [X] CODE REJECTED // PLEASE RETRY
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={busy || otp.length < 6}
                    className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[15px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90"
                  >
                    {busy ? "CHECKING…" : mode === "sign-up" ? "COMPLETE SIGN UP" : "COMPLETE SIGN IN"}
                  </Button>

                  <div className="flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInternalStep("email")}
                      className="text-muted-foreground underline underline-offset-2 hover:text-ink cursor-pointer"
                    >
                      ← re-enter email
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
          )}

          {/* Tape Footer */}
          <div className="border-t-2 border-dashed border-ink/40 pt-3 flex flex-wrap items-center justify-between text-[12px]">
            <Link
              href="/"
              className="font-bold text-stamp underline underline-offset-[3px] hover:text-ink"
            >
              ← printer console
            </Link>
            <Link
              href={mode === "sign-in" ? "/sign-up" : "/sign-in"}
              className="text-muted-foreground underline underline-offset-[3px] hover:text-ink"
            >
              {mode === "sign-in" ? "new here? sign up →" : "have a code? sign in →"}
            </Link>
          </div>
        </div>

        {/* Paper Tear Zig-Zag Edge */}
        <div className="h-3 w-full bg-[linear-gradient(-45deg,transparent_4px,#1b1b18_4px,#1b1b18_6px,transparent_6px),linear-gradient(45deg,transparent_4px,#1b1b18_4px,#1b1b18_6px,transparent_6px)] [background-size:12px_12px] bg-repeat-x opacity-60" />
      </div>
    </div>
  );
}
