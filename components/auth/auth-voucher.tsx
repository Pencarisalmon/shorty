"use client";

import { useState, useEffect } from "react";
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
import { authClient } from "@/lib/auth-client";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export type AuthMode = "sign-in" | "sign-up";

const BAD_EMAIL_MSG = "That doesn't look like an email address.";
const SEND_FAILED_MSG = "Couldn't send the code — try again.";
const SIGN_IN_FAILED_MSG = "That code didn't work — check it and try again.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthVoucher({ mode }: { mode: AuthMode }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function dispatchOtp(targetEmail: string): Promise<boolean> {
    const value = targetEmail.trim();
    if (!EMAIL_RE.test(value)) {
      setError(BAD_EMAIL_MSG);
      return false;
    }
    setError("");
    setBusy(true);
    try {
      const { error: sendError } =
        await authClient.emailOtp.sendVerificationOtp({
          email: value,
          type: "sign-in",
        });
      if (sendError) {
        setError(sendError.message ?? SEND_FAILED_MSG);
        return false;
      }
      return true;
    } catch {
      setError(SEND_FAILED_MSG);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSendCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const success = await dispatchOtp(email);
    if (success) {
      setStep("otp");
    }
  }

  async function handleResend() {
    if (cooldown > 0 || busy) return;
    const success = await dispatchOtp(email);
    if (success) {
      setCooldown(30);
    }
  }

  async function verifyCode(codeToVerify: string) {
    const value = codeToVerify.trim();
    if (value.length < 6) {
      setError("Enter the code from your inbox.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { error: signInError } = await authClient.signIn.emailOtp({
        email: email.trim(),
        otp: value,
      });
      if (signInError) {
        setError(signInError.message ?? SIGN_IN_FAILED_MSG);
        return;
      }
      window.location.assign("/");
    } catch {
      setError(SIGN_IN_FAILED_MSG);
    } finally {
      setBusy(false);
    }
  }

  function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    void verifyCode(otp);
  }

  function handleChangeEmail() {
    setOtp("");
    setError("");
    setStep("email");
  }

  return (
    <div className="min-h-svh bg-paper flex flex-col justify-between">
      <div className="mx-auto flex w-full max-w-[720px] flex-col px-4 pb-12 pt-6 sm:pt-8">
        {/* Global Shorty App Header */}
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b-[3px] border-ink pb-2 text-[13px]">
          <Link href="/" className="text-[20px] font-bold tracking-[0.12em] hover:opacity-80">
            SHORTY
          </Link>
          <p className="text-muted-foreground tracking-[0.04em] text-[12px] sm:text-[13px]">
            receipt printer for the web
          </p>
        </header>

        {/* Outer Two-Part Ticket Voucher Card */}
        <main className="w-full flex justify-center">
          <div className="w-full max-w-[660px] bg-surface border-2 border-ink shadow-[6px_6px_0_0_var(--ink)]">
            {/* Main Top Header Strip */}
            <div className="flex flex-wrap items-center justify-between border-b-2 border-ink px-5 py-3 bg-surface">
              <div className="flex items-center gap-3">
                <div className="border-2 border-stamp px-2 py-0.5 text-[11px] font-bold tracking-widest text-stamp uppercase">
                  VOUCHER #2026
                </div>
                <h1 className="text-[14px] font-bold tracking-[0.1em] text-ink uppercase">
                  {mode === "sign-in" ? "SESSION PASS" : "IDENTITY PASS"}
                </h1>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                GATE: AUTH-01
              </span>
            </div>

            {/* Two-Part Split Body with Dashed Perforation Divider */}
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] divide-y-2 md:divide-y-0 md:divide-x-2 divide-dashed divide-ink">
              {/* Left / Side Voucher Stub: Express Social Pass */}
              <div className="p-5 flex flex-col justify-between bg-paper relative">
                {/* Circular Cutout Notches on Desktop Divider */}
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

                  <OAuthButtons />
                </div>

                <div className="mt-4 pt-3 border-t border-dashed border-line text-[10px] font-mono text-muted-foreground">
                  ⚡ No one-time code needed for express sign-in
                </div>
              </div>

              {/* Right / Main Section: One-Time Code Verification */}
              <div className="p-5 flex flex-col justify-between bg-surface">
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
                    <form onSubmit={handleSendCode} noValidate className="flex flex-col gap-3.5 mt-2">
                      <p className="text-[12px] text-muted-foreground">
                        We will email a 6-digit one-time pass code valid for 5 minutes.
                      </p>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="voucher-email"
                          className="text-[11px] font-bold uppercase tracking-wider text-ink"
                        >
                          Email Destination:
                        </label>
                        <Input
                          id="voucher-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError("");
                          }}
                          placeholder="user@example.com"
                          autoComplete="email"
                          aria-invalid={error ? true : undefined}
                          className="h-auto rounded-none border-2 border-ink bg-paper/40 px-3.5 py-2.5 text-[15px] font-mono shadow-[2px_2px_0_0_var(--ink)] focus-visible:outline-stamp focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-offset-1 aria-invalid:border-stamp"
                        />
                      </div>

                      {error && (
                        <div
                          role="alert"
                          className="p-2.5 border-2 border-stamp bg-stamp/10 text-stamp text-[12px] font-bold tracking-tight"
                        >
                          [!] {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={busy}
                        className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[14px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90 disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60"
                      >
                        {busy ? "DISPATCHING…" : "REQUEST ONE-TIME CODE →"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifySubmit} noValidate className="flex flex-col gap-3.5 mt-2">
                      <div className="flex items-center justify-between bg-paper/60 p-2 border border-ink/30">
                        <span className="text-[11px] text-muted-foreground">Code sent to:</span>
                        <span className="text-[12px] font-bold text-ink truncate max-w-[180px]">
                          {email.trim()}
                        </span>
                      </div>

                      <label htmlFor="otp-code" className="sr-only">
                        One-time code
                      </label>

                      <div className="flex justify-center py-2">
                        <InputOTP
                          id="otp-code"
                          maxLength={6}
                          pattern={REGEXP_ONLY_DIGITS}
                          value={otp}
                          onChange={(value) => {
                            setOtp(value);
                            if (error) setError("");
                          }}
                          onComplete={(value) => {
                            void verifyCode(value);
                          }}
                          autoFocus
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          aria-invalid={error ? true : undefined}
                          disabled={busy}
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

                      {error && (
                        <div
                          role="alert"
                          className="p-2.5 border-2 border-stamp bg-stamp/10 text-stamp text-[12px] font-bold text-center tracking-tight"
                        >
                          [!] {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={busy || otp.length < 6}
                        className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink py-3 text-[14px] font-bold tracking-[0.08em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink/90 disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60"
                      >
                        {busy
                          ? "CONFIRMING…"
                          : mode === "sign-up"
                            ? "VALIDATE & SIGN UP"
                            : "VALIDATE & SIGN IN"}
                      </Button>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={handleChangeEmail}
                          className="text-muted-foreground underline underline-offset-2 hover:text-ink cursor-pointer"
                        >
                          ← change email
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleResend()}
                          disabled={cooldown > 0 || busy}
                          className="font-bold text-stamp underline underline-offset-2 hover:text-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline disabled:text-muted-foreground"
                        >
                          {cooldown > 0 ? `resend in ${cooldown}s` : "resend code"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Footer Reciprocal Links */}
                <div className="mt-4 pt-3 border-t border-dashed border-line flex items-center justify-between text-[11px]">
                  <Link href="/" className="font-bold text-stamp hover:underline underline-offset-2">
                    ← printer home
                  </Link>
                  <Link
                    href={mode === "sign-in" ? "/sign-up" : "/sign-in"}
                    className="text-muted-foreground hover:text-ink underline underline-offset-2"
                  >
                    {mode === "sign-in"
                      ? "need an account? sign up →"
                      : "already registered? sign in →"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
