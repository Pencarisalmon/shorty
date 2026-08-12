"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PrototypeSwitcher,
  VariantA,
  VariantB,
  VariantC,
  type LinkRow,
  type ShortyProps,
} from "./design-prototypes";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeShell />
    </Suspense>
  );
}

function HomeShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [key, setKey] = useState(() => searchParams.get("variant") ?? "A");

  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validation, setValidation] = useState<string | null>(null);
  const [shortUrl, setShortUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [linksLoading, setLinksLoading] = useState(true);
  const [linksError, setLinksError] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadLinks(): Promise<LinkRow[] | null> {
    try {
      const res = await fetch("/api/links");
      if (!res.ok) throw new Error("fetch failed");
      return (await res.json()).links as LinkRow[];
    } catch {
      return null;
    }
  }

  function applyLinks(rows: LinkRow[] | null) {
    setLinksLoading(false);
    if (rows) {
      setLinks(rows);
      setLinksError("");
    } else {
      setLinksError("Couldn't load recent links.");
    }
  }

  useEffect(() => {
    let ignore = false;
    loadLinks().then((rows) => {
      if (!ignore) applyLinks(rows);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const onShorten = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      setValidation(null);
      setShortUrl("");
      setCopied(false);
      const target = url.trim();
      if (!target) {
        setValidation("Paste a URL to shorten it.");
        return;
      }
      let parsed: URL | null = null;
      try {
        parsed = new URL(target);
      } catch {
        parsed = null;
      }
      if (!parsed || !/^https?:$/.test(parsed.protocol)) {
        setValidation("That doesn't look like a valid link — it should start with http:// or https://.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch("/api/shorten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: target }),
        });
        const data = await res.json();
        if (!res.ok) {
          setValidation(data.error ?? "Something went wrong — please try again.");
          return;
        }
        setShortUrl(data.shortUrl as string);
        applyLinks(await loadLinks());
      } finally {
        setSubmitting(false);
      }
    },
    [url, submitting]
  );

  const onCopy = useCallback(() => {
    if (!shortUrl) return;
    navigator.clipboard?.writeText(shortUrl);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [shortUrl]);

  function changeVariant(nextKey: string) {
    setKey(nextKey);
    router.replace(`/?variant=${nextKey}`);
  }

  const props: ShortyProps = {
    url,
    onUrl: setUrl,
    submitting,
    validation,
    shortUrl,
    copied,
    onCopy,
    onShorten,
    links,
    linksLoading,
    linksError,
  };

  const Variant = key === "B" ? VariantB : key === "C" ? VariantC : VariantA;

  return (
    <>
      <Variant {...props} />
      <PrototypeSwitcher current={key} onChange={changeVariant} />
    </>
  );
}
