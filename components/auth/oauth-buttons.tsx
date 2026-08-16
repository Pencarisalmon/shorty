"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const PROVIDERS = [
  {
    id: "google",
    label: "GOOGLE PASS",
    altLabel: "sign in with google",
    svg: (
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
    ),
  },
  {
    id: "github",
    label: "GITHUB PASS",
    altLabel: "sign in with github",
    svg: (
      <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.35.96.11-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
      </svg>
    ),
  },
] as const;

type Provider = (typeof PROVIDERS)[number]["id"];

const FAILED_MSG = "Couldn't start sign-in — try again.";

export function OAuthButtons() {
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");

  async function start(provider: Provider) {
    setError("");
    setBusy(provider);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: "/",
        errorCallbackURL: "/sign-in",
      });
      if (res?.error) {
        setError(res.error.message ?? FAILED_MSG);
      }
    } catch {
      setError(FAILED_MSG);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {PROVIDERS.map(({ id, label, altLabel, svg }) => (
        <button
          key={id}
          type="button"
          aria-label={altLabel}
          onClick={() => void start(id)}
          disabled={busy !== null}
          className="flex h-auto cursor-pointer items-center justify-center gap-2 border-2 border-ink bg-white py-2.5 px-3 text-[13px] font-bold shadow-[2px_2px_0_0_var(--ink)] hover:bg-ink hover:text-paper transition-colors disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60"
        >
          {svg}
          <span>{busy === id ? "STARTING…" : label}</span>
        </button>
      ))}
      {error && (
        <div
          role="alert"
          className="p-2.5 border-2 border-stamp bg-stamp/10 text-stamp text-[12px] font-bold tracking-tight"
        >
          [!] {error}
        </div>
      )}
    </div>
  );
}