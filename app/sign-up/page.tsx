import Link from "next/link";
import { OneTimeCodeForm } from "@/components/auth/one-time-code-form";

export default function SignUpPage() {
  return (
    <div className="min-h-svh bg-paper">
      <div className="mx-auto flex w-full max-w-[680px] flex-col px-5 pb-[100px] pt-7">
        <header className="mb-[22px] flex flex-wrap items-baseline justify-between gap-3 border-b-[3px] border-ink pb-[10px] text-[13px]">
          <p className="text-[20px] font-bold tracking-[0.12em]">SHORTY</p>
          <p className="text-muted-foreground tracking-[0.04em]">
            receipt printer for the web
          </p>
        </header>
        <main className="flex flex-col gap-4">
          <h1 className="text-[22px] font-bold tracking-[0.12em]">SIGN UP</h1>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            No password, no sign-up form — your first code creates your account
            and signs you in.
          </p>
          <OneTimeCodeForm mode="sign-up" />
          <div className="flex flex-wrap items-center justify-between gap-3 text-[12px]">
            <Link
              href="/"
              className="font-bold tracking-[0.08em] text-stamp underline underline-offset-[3px]"
            >
              ← back to the printer
            </Link>
            <Link
              href="/sign-in"
              className="text-muted-foreground underline underline-offset-[3px] hover:text-ink"
            >
              have a code? sign in →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}