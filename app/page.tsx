"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
const receiptButton =
  "h-auto rounded-none border border-ink px-3 py-2 text-[14px] font-bold tracking-[0.06em] hover:bg-primary/80 focus-visible:ring-ring focus-visible:ring-offset-1 max-[560px]:w-full";

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
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8 px-4 py-10 leading-[1.6]">
        <h1 className="sr-only">Shorty — receipt printer for the web</h1>
        <header className="flex flex-col gap-1">
          <p className="text-[20px] font-bold tracking-[0.12em]">SHORTY</p>
          <p className="text-[13px] tracking-[0.04em] text-muted-foreground">
            receipt printer for the web
          </p>
        </header>
        <main className="flex flex-col gap-5">
          <form onSubmit={onSubmit} noValidate>
            <div
              className={`bg-surface p-3 shadow-[3px_3px_0_0_var(--ink)] ${
                error ? "border-[2px] border-stamp" : "border border-ink"
              }`}
            >
              <div className="flex max-[560px]:flex-col max-[560px]:gap-2">
                <label htmlFor="target-url" className="sr-only">
                  Target URL
                </label>
                <Input
                  id="target-url"
                  type="text"
                  value={url}
                  onChange={(e) => onChangeUrl(e.target.value)}
                  placeholder="https://example.com/a-very-long-link"
                  aria-invalid={error ? true : undefined}
                  autoComplete="off"
                  className="h-auto rounded-none border-0 bg-transparent px-1 py-2 text-[15px] shadow-none focus-visible:ring-ring focus-visible:ring-offset-1 max-[560px]:w-full"
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className={`${receiptButton} self-stretch shadow-none disabled:cursor-progress disabled:opacity-100`}
                >
                  {submitting ? "PRINTING…" : "SHORTEN"}
                </Button>
              </div>
            </div>
          </form>
          {error && (
            <p role="alert" className="text-[13px] text-error">
              {error}
            </p>
          )}
          {short && (
            <Card
              aria-live="polite"
              className="gap-4 rounded-none border border-ink shadow-none motion-safe:animate-[ticket-in_0.25s_ease-out] max-[560px]:gap-3"
            >
              <p className="px-4 text-[34px] font-bold tracking-[0.1em] text-stamp">
                {short.code}
              </p>
              <p
                className="max-w-full truncate px-4 text-[14px] text-muted-foreground"
                title={short.url}
              >
                {short.url}
              </p>
              <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3 max-[560px]:flex-col">
                <Button
                  type="button"
                  onClick={onCopy}
                  className={`${receiptButton} bg-primary shadow-[3px_3px_0_0_var(--ink)]`}
                >
                  {copied ? "COPIED ✓" : "COPY"}
                </Button>
                <a
                  href={short.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-center px-2 text-[14px] font-bold tracking-[0.06em] text-stamp underline-offset-4 hover:underline max-[560px]:self-start"
                >
                  OPEN ↗
                </a>
              </div>
            </Card>
          )}
        </main>
        <section aria-label="Recent short links" className="flex flex-col gap-3">
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