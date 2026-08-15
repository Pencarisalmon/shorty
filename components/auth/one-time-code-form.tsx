"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

const BAD_EMAIL_MSG = "That doesn't look like an email address.";
const SEND_FAILED_MSG = "Couldn't send the code — try again.";
const SIGN_IN_FAILED_MSG = "That code didn't work — check it and try again.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OneTimeCodeForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError(BAD_EMAIL_MSG);
      return;
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
        return;
      }
      setStep("otp");
    } catch {
      setError(SEND_FAILED_MSG);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    const value = otp.trim();
    if (!value) {
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

  if (step === "otp") {
    return (
      <form
        onSubmit={submitCode}
        noValidate
        className="flex flex-col gap-3 rounded-none border-2 border-ink bg-[#fdfdfb] px-4 py-[14px] shadow-[3px_3px_0_0_var(--ink)]"
      >
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Code sent to <span className="font-bold text-ink">{email.trim()}</span>
          {" — it expires in 5 minutes."}
        </p>
        <label htmlFor="otp-code" className="sr-only">
          Code
        </label>
        <Input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="000000"
          aria-invalid={error ? true : undefined}
          className="h-auto rounded-none border-2 border-ink bg-[#fdfdfb] px-[14px] py-3 text-[20px] font-bold tracking-[0.3em] shadow-[3px_3px_0_0_var(--ink)] placeholder:text-[#88887e] focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-stamp focus-visible:outline-offset-1 aria-invalid:border-stamp aria-invalid:ring-0"
        />
        <Button
          type="submit"
          disabled={busy}
          className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink px-[18px] py-3 text-[16px] font-bold tracking-[0.06em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60"
        >
          {busy ? "CHECKING…" : mode === "sign-up" ? "SIGN UP" : "SIGN IN"}
        </Button>
        {error && (
          <p role="alert" className="mx-[2px] text-[13px] font-bold text-error">
            {error}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 text-[12px]">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
            }}
            className="cursor-pointer text-muted-foreground underline underline-offset-[3px] hover:text-ink"
          >
            use a different email
          </button>
          <button
            type="button"
            onClick={() => void sendCode()}
            className="cursor-pointer font-bold text-stamp underline underline-offset-[3px] hover:text-ink"
          >
            resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void sendCode();
      }}
      noValidate
      className="flex flex-col gap-3 rounded-none border-2 border-ink bg-[#fdfdfb] px-4 py-[14px] shadow-[3px_3px_0_0_var(--ink)]"
    >
      <label htmlFor="auth-email" className="sr-only">
        Email
      </label>
      <Input
        id="auth-email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) setError("");
        }}
        placeholder="you@example.com"
        autoComplete="email"
        aria-invalid={error ? true : undefined}
        className="h-auto rounded-none border-2 border-ink bg-[#fdfdfb] px-[14px] py-3 text-[15px] shadow-[3px_3px_0_0_var(--ink)] placeholder:text-[#88887e] focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-stamp focus-visible:outline-offset-1 aria-invalid:border-stamp aria-invalid:ring-0"
      />
      <Button
        type="submit"
        disabled={busy}
        className="h-auto cursor-pointer rounded-none border-2 border-ink bg-ink px-[18px] py-3 text-[16px] font-bold tracking-[0.06em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60"
      >
        {busy ? "SENDING…" : "GET CODE"}
      </Button>
      {error && (
        <p role="alert" className="mx-[2px] text-[13px] font-bold text-error">
          {error}
        </p>
      )}
    </form>
  );
}