"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type ShortResult = {
  code: string;
  url: string;
  shortUrl: string;
};

type LinkRow = ShortResult & { createdAt: string; ownerId?: string | null };

const EMPTY_MSG = "Paste a URL to shorten it.";
const PROTOCOL_MSG =
  "That doesn't look like a valid link — it should start with http:// or https://.";
const EMPTY_TAPE = "// no receipts yet — your first link prints here.";
const DISMISSED_STORAGE_KEY = "shorty_dismissed_receipts";

function getDismissedCodes(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    // Ignore storage parse errors
  }
  return [];
}

function saveDismissedCode(code: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getDismissedCodes();
    if (!current.includes(code)) {
      current.push(code);
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // Ignore storage write errors
  }
}

function validateUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return EMPTY_MSG;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return PROTOCOL_MSG;
    }
  } catch {
    return PROTOCOL_MSG;
  }
  return "";
}

function formatTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    .toLowerCase();
}

function CopyIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="14" height="14" x="8" y="8" rx="0" ry="0" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DismissIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TrashIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function useCopy(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), timeoutMs);
    } catch {
      // Graceful clipboard failure handling
    }
  };

  return [copied, copy] as const;
}

function TapeRow({
  link,
  isOwner,
  onDismiss,
  onDelete,
  isExiting,
}: {
  link: LinkRow;
  isOwner: boolean;
  onDismiss: (code: string) => void;
  onDelete: (code: string) => void;
  isExiting?: boolean;
}) {
  const [copied, copy] = useCopy();

  return (
    <li
      className={`grid grid-cols-[64px_1fr_auto] items-center gap-x-3 border-t border-dashed border-line py-3 transition-all duration-200 ease-out motion-reduce:transition-none min-[560px]:grid-cols-[74px_1fr_auto] ${
        isExiting ? "pointer-events-none opacity-0 -translate-x-2" : ""
      }`}
    >
      <a
        href={link.shortUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-[14px] font-bold text-stamp underline-offset-4 hover:underline"
      >
        {link.code}
      </a>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-[14px] underline-offset-4 hover:underline"
        title={link.url}
      >
        {link.url}
      </a>
      <div className="flex items-center gap-2">
        <time
          dateTime={link.createdAt}
          className="text-[12px] text-muted-foreground"
        >
          {formatTime(link.createdAt)}
        </time>
        <button
          type="button"
          onClick={() => void copy(link.shortUrl)}
          aria-label={copied ? `Copied ${link.code}` : `Copy ${link.code}`}
          title={copied ? "Copied!" : `Copy ${link.shortUrl}`}
          className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-none border border-ink bg-white text-ink shadow-[1px_1px_0_0_var(--ink)] transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-1 ${
            copied
              ? "border-stamp bg-white text-stamp shadow-[1px_1px_0_0_var(--stamp)] hover:bg-white hover:text-stamp"
              : ""
          }`}
        >
          {copied ? (
            <CheckIcon className="size-3.5" />
          ) : (
            <CopyIcon className="size-3.5" />
          )}
        </button>
        {isOwner ? (
          <button
            type="button"
            onClick={() => onDelete(link.code)}
            aria-label={`Delete ${link.code}`}
            title="Delete"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-none border border-ink bg-white text-ink shadow-[1px_1px_0_0_var(--ink)] transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-1"
          >
            <TrashIcon className="size-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onDismiss(link.code)}
            aria-label={`Dismiss ${link.code}`}
            title="Dismiss"
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-none border border-ink bg-white text-ink shadow-[1px_1px_0_0_var(--ink)] transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-1"
          >
            <DismissIcon className="size-3.5" />
          </button>
        )}
      </div>
    </li>
  );
}

export default function Home() {
  const { data: session } = authClient.useSession();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [pasteHint, setPasteHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [short, setShort] = useState<ShortResult | null>(null);
  const [justShortened, setJustShortened] = useState(false);
  const [copied, copy] = useCopy();
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [linksError, setLinksError] = useState("");
  const [signOutError, setSignOutError] = useState("");
  const [dismissedCodes, setDismissedCodes] = useState<string[]>(getDismissedCodes);
  const [exitingCodes, setExitingCodes] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/links")
      .then((res) => {
        if (!res.ok) throw new Error("links fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!ignore) {
          setLinks(data.links);
          setLinksError("");
        }
      })
      .catch(() => {
        if (!ignore) setLinksError("Couldn't load recent links.");
      });
    return () => {
      ignore = true;
    };
  }, []);

  function onDismiss(code: string) {
    setExitingCodes((prev) => [...prev, code]);
    saveDismissedCode(code);
    setTimeout(() => {
      setDismissedCodes((prev) => [...prev, code]);
      setExitingCodes((prev) => prev.filter((c) => c !== code));
    }, 200);
  }

  async function onDelete(code: string) {
    setExitingCodes((prev) => [...prev, code]);

    try {
      const res = await fetch(`/api/links/${code}`, { method: "DELETE" });
      if (!res.ok) {
        setExitingCodes((prev) => prev.filter((c) => c !== code));
        setLinksError("Couldn't delete link.");
        return;
      }
      setTimeout(() => {
        setLinks((rows) => (rows ? rows.filter((r) => r.code !== code) : rows));
        setExitingCodes((prev) => prev.filter((c) => c !== code));
      }, 200);
    } catch {
      setExitingCodes((prev) => prev.filter((c) => c !== code));
      setLinksError("Couldn't delete link — check your connection.");
    }
  }

  function onChangeUrl(value: string) {
    setUrl(value);
    if (pasteHint) setPasteHint("");
    if (error) setError(validateUrl(value));
  }

  async function onPaste() {
    try {
      if (!navigator.clipboard?.readText) {
        throw new Error("Clipboard read not supported");
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        onChangeUrl(text);
      }
    } catch {
      const isMac =
        typeof navigator !== "undefined" &&
        /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
      setPasteHint(isMac ? "Press ⌘V to paste" : "Press Ctrl+V to paste");
    } finally {
      inputRef.current?.focus();
    }
  }

  function onClear() {
    setUrl("");
    setError("");
    setPasteHint("");
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClear();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasteHint("");
    const message = validateUrl(url);
    setError(message);
    if (message) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't shorten the link.");
        setJustShortened(false);
        return;
      }
      setShort({ code: data.code, url: url.trim(), shortUrl: data.shortUrl });
      setJustShortened(true);
      setLinks((rows) =>
        rows
          ? [
              {
                code: data.code,
                url: url.trim(),
                shortUrl: data.shortUrl,
                createdAt: new Date().toISOString(),
                ownerId: data.ownerId ?? session?.user?.id ?? null,
              },
              ...rows,
            ]
          : rows
      );
    } catch {
      setError("Couldn't shorten the link.");
      setJustShortened(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function onSignOut() {
    try {
      await authClient.signOut();
      setJustShortened(false);
      setSignOutError("");
    } catch {
      setSignOutError("Couldn't sign out — check your connection.");
    }
  }

  return (
    <div className="min-h-svh bg-paper">
      <div className="mx-auto flex w-full max-w-[680px] flex-col px-5 pb-[100px] pt-7">
        <h1 className="sr-only">Shorty — receipt printer for the web</h1>
        <header className="mb-[22px] flex flex-wrap items-baseline justify-between gap-3 border-b-[3px] border-ink pb-[10px] text-[13px]">
          <p className="text-[20px] font-bold tracking-[0.12em]">SHORTY</p>
          <p className="text-muted-foreground tracking-[0.04em]">
            receipt printer for the web
          </p>
        </header>
        {session?.user && (
          <div className="mb-[22px] flex items-center justify-between gap-3 border-b-2 border-dashed border-line pb-[10px] text-[12px]">
            <p className="min-w-0 truncate text-muted-foreground">
              signed in as{" "}
              <span className="font-bold text-ink">{session.user.email}</span>
            </p>
            <Button
              type="button"
              onClick={() => void onSignOut()}
              className="h-auto shrink-0 cursor-pointer rounded-none border-2 border-ink bg-white px-[10px] py-[6px] text-[12px] font-bold tracking-[0.08em] text-ink shadow-[2px_2px_0_0_var(--ink)] hover:bg-primary/80 hover:text-paper"
            >
              SIGN OUT
            </Button>
          </div>
        )}
        {signOutError && (
          <p role="alert" className="mb-[16px] text-[13px] font-bold text-error">
            {signOutError}
          </p>
        )}
        <main className="flex flex-col">
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex gap-2 max-[560px]:flex-col"
          >
            <label htmlFor="target-url" className="sr-only">
              Target URL
            </label>
            <div className="relative flex min-w-0 flex-1 items-center max-[560px]:w-full">
              <Input
                ref={inputRef}
                autoFocus
                id="target-url"
                type="text"
                value={url}
                onChange={(e) => onChangeUrl(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="https://example.com/a-very-long-link"
                aria-invalid={error ? true : undefined}
                autoComplete="off"
                className="h-auto w-full min-w-0 rounded-none border-2 border-ink bg-[#fdfdfb] py-3 pl-[14px] pr-[72px] text-[15px] shadow-[3px_3px_0_0_var(--ink)] placeholder:text-[#88887e] focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-stamp focus-visible:outline-offset-1 aria-invalid:border-stamp aria-invalid:ring-0 md:text-[15px]"
              />
              <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center">
                {!url ? (
                  <button
                    type="button"
                    onClick={() => void onPaste()}
                    className="cursor-pointer rounded-none border border-ink bg-white px-2 py-1 text-[11px] font-bold tracking-[0.08em] text-ink shadow-[1px_1px_0_0_var(--ink)] transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-stamp"
                  >
                    PASTE
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClear}
                    aria-label="Clear target URL"
                    title="Clear"
                    className="flex size-6 cursor-pointer items-center justify-center rounded-none border border-ink bg-white text-[12px] font-bold text-ink shadow-[1px_1px_0_0_var(--ink)] transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-stamp"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                )}
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="h-auto rounded-none border-2 border-ink bg-ink px-[18px] py-3 text-[16px] font-bold tracking-[0.06em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60 disabled:hover:bg-ink max-[560px]:w-full cursor-pointer"
            >
              {submitting ? "PRINTING…" : "SHORTEN"}
            </Button>
          </form>
          {pasteHint && (
            <p
              role="status"
              className="mx-[2px] mt-[8px] text-[12px] font-medium text-muted-foreground"
            >
              {pasteHint}
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mx-[2px] mt-[10px] text-[13px] font-bold text-error"
            >
              {error}
            </p>
          )}
          {short && (
            <section
              aria-live="polite"
              className="mt-[18px] rounded-none border-2 border-dashed border-ink bg-[#fdfdfb] px-4 py-[14px] motion-safe:animate-[ticket-in_0.25s_ease]"
            >
              <p className="text-[34px] font-bold leading-none tracking-[0.1em]">
                {short.code}
              </p>
              <div className="mt-2 flex min-w-0 items-center justify-between gap-3">
                <p
                  className="min-w-0 truncate text-[13px] text-muted-foreground"
                  title={short.url}
                >
                  {short.url}
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    if (short) void copy(short.shortUrl);
                  }}
                  className="flex h-auto shrink-0 cursor-pointer items-center gap-1.5 rounded-none border-2 border-ink bg-white px-[10px] py-[6px] text-[12px] font-bold tracking-[0.08em] text-ink shadow-[2px_2px_0_0_var(--ink)] hover:bg-primary/80 hover:text-paper"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="size-3.5" />
                      <span>COPIED ✓</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="size-3.5" />
                      <span>COPY</span>
                    </>
                  )}
                </Button>
              </div>
              <a
                href={short.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-[10px] inline-block text-[12px] font-bold tracking-[0.1em] text-stamp underline underline-offset-[3px]"
              >
                OPEN ↗
              </a>
            </section>
          )}
          {justShortened && !session?.user && (
            <p className="mt-[10px] text-[12px] tracking-[0.1em] text-muted-foreground">
              {"// want to keep your receipts? "}
              <Link
                href="/sign-in"
                className="font-bold text-stamp underline underline-offset-[3px]"
              >
                sign in →
              </Link>
            </p>
          )}
        </main>
        <section
          aria-label="Recent short links"
          className="mt-7 flex flex-col gap-3"
        >
          <h2 className="text-[12px] tracking-[0.12em] text-muted-foreground">
            {"// RECENTLY PRINTED"}
          </h2>
          {linksError && (
            <p role="alert" className="text-[14px] text-error">
              {linksError}
            </p>
          )}
          {!linksError && links === null && (
            <ul className="flex flex-col">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="border-t border-dashed border-line py-3"
                >
                  <div className="h-[16px] w-3/5 border border-dashed border-line bg-stripe" />
                </li>
              ))}
            </ul>
          )}
          {(() => {
            const visibleLinks = links
              ? links.filter((l) => !dismissedCodes.includes(l.code))
              : null;
            return (
              <>
                {visibleLinks !== null && visibleLinks.length === 0 && (
                  <p className="text-[14px] text-muted-foreground">{EMPTY_TAPE}</p>
                )}
                {visibleLinks !== null && visibleLinks.length > 0 && (
                  <ul className="flex flex-col">
                    {visibleLinks.map((link) => (
                      <TapeRow
                        key={link.code}
                        link={link}
                        isOwner={Boolean(
                          session?.user?.id && link.ownerId === session.user.id
                        )}
                        onDismiss={onDismiss}
                        onDelete={onDelete}
                        isExiting={exitingCodes.includes(link.code)}
                      />
                    ))}
                  </ul>
                )}
              </>
            );
          })()}
        </section>
      </div>
    </div>
  );
}