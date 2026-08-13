"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ShortResult = {
  code: string;
  url: string;
  shortUrl: string;
};

type LinkRow = ShortResult & { createdAt: string };

const EMPTY_MSG = "Paste a URL to shorten it.";
const PROTOCOL_MSG =
  "That doesn't look like a valid link — it should start with http:// or https://.";
const EMPTY_TAPE = "// no receipts yet — your first link prints here.";

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
  return new Date(iso).toLocaleString();
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [short, setShort] = useState<ShortResult | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [linksError, setLinksError] = useState("");

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

  function onChangeUrl(value: string) {
    setUrl(value);
    if (error) setError(validateUrl(value));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        return;
      }
      setShort({ code: data.code, url: url.trim(), shortUrl: data.shortUrl });
      setLinks((rows) =>
        rows
          ? [
              {
                code: data.code,
                url: url.trim(),
                shortUrl: data.shortUrl,
                createdAt: new Date().toISOString(),
              },
              ...rows,
            ]
          : rows
      );
    } catch {
      setError("Couldn't shorten the link.");
    } finally {
      setSubmitting(false);
    }
  }

  function onCopy() {
    if (!short) return;
    navigator.clipboard.writeText(short.shortUrl).then(() => {
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    });
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
        <main className="flex flex-col">
          <form
            onSubmit={onSubmit}
            noValidate
            className="flex gap-2 max-[560px]:flex-col"
          >
            <label htmlFor="target-url" className="sr-only">
              Target URL
            </label>
            <Input
              id="target-url"
              type="text"
              value={url}
              onChange={(e) => onChangeUrl(e.target.value)}
              placeholder="paste a long URL…"
              aria-invalid={error ? true : undefined}
              autoComplete="off"
              className="h-auto flex-1 min-w-0 rounded-none border-2 border-ink bg-[#fdfdfb] px-[14px] py-3 text-[15px] shadow-[3px_3px_0_0_var(--ink)] placeholder:text-[#88887e] focus-visible:border-ink focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-solid focus-visible:outline-stamp focus-visible:outline-offset-1 aria-invalid:border-stamp aria-invalid:ring-0 max-[560px]:w-full md:text-[15px]"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-auto rounded-none border-2 border-ink bg-ink px-[18px] py-3 text-[16px] font-bold tracking-[0.06em] text-paper shadow-[3px_3px_0_0_var(--ink)] hover:bg-ink disabled:pointer-events-auto disabled:cursor-progress disabled:opacity-60 disabled:hover:bg-ink max-[560px]:w-full"
            >
              {submitting ? "PRINTING…" : "SHORTEN"}
            </Button>
          </form>
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
                  onClick={onCopy}
                  className="h-auto shrink-0 rounded-none border-2 border-ink bg-white px-[10px] py-[6px] text-[12px] font-bold tracking-[0.08em] text-ink shadow-[2px_2px_0_0_var(--ink)] hover:bg-primary/80"
                >
                  {copied ? "COPIED ✓" : "COPY"}
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
        </main>
        <section
          aria-label="Recent short links"
          className="mt-7 flex flex-col gap-3"
        >
          <h2 className="text-[12px] tracking-[0.12em] text-muted-foreground">
            {"// RECENTLY PRINTED"}
          </h2>
          {linksError && <p className="text-[14px] text-error">{linksError}</p>}
          {!linksError && links === null && (
            <ul className="flex flex-col">
              {[0, 1, 2].map((i) => (
                <li
                  key={i}
                  className="border-b border-dashed border-line py-3"
                >
                  <div className="h-[16px] w-3/5 border border-dashed border-line bg-stripe" />
                </li>
              ))}
            </ul>
          )}
          {!linksError && links !== null && links.length === 0 && (
            <p className="text-[14px] text-muted-foreground">{EMPTY_TAPE}</p>
          )}
          {!linksError && links !== null && links.length > 0 && (
            <ul className="flex flex-col">
              {links.map((link) => (
                <li
                  key={link.code}
                  className="grid grid-cols-[64px_1fr_auto] items-center gap-x-3 border-b border-dashed border-line py-3 min-[560px]:grid-cols-[74px_1fr_auto]"
                >
                  <a
                    href={link.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-[14px] text-stamp underline-offset-4 hover:underline"
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
                  <time
                    dateTime={link.createdAt}
                    className="text-[12px] text-muted-foreground"
                  >
                    {formatTime(link.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}