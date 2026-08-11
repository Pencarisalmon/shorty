"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type LinkRow = {
  code: string;
  url: string;
  shortUrl: string;
  createdAt: string;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");
  const [links, setLinks] = useState<LinkRow[] | null>(null);
  const [linksError, setLinksError] = useState("");

  async function loadLinks(): Promise<LinkRow[] | null> {
    try {
      const res = await fetch("/api/links");
      if (!res.ok) throw new Error("fetch failed");
      return (await res.json()).links;
    } catch {
      return null;
    }
  }

  function applyLinks(rows: LinkRow[] | null) {
    if (rows) {
      setLinks(rows);
      setLinksError("");
    } else {
      setLinksError("Gagal memuat daftar tautan");
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShortUrl("");
    const res = await fetch("/api/shorten", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Terjadi kesalahan");
      return;
    }
    setShortUrl(data.shortUrl);
    applyLinks(await loadLinks());
  }

  return (
    <main className={styles.main}>
      <h1>URL Shortener</h1>
      <form onSubmit={onSubmit} className={styles.form}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://contoh.com/halaman-panjang"
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Shorten
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {shortUrl && (
        <p className={styles.result}>
          <a href={shortUrl} target="_blank" rel="noopener noreferrer">
            {shortUrl}
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(shortUrl)}
            className={styles.copy}
          >
            Salin
          </button>
        </p>
      )}
      <section className={styles.list} aria-label="Tautan terbaru">
        <h2 className={styles.listTitle}>Tautan Terbaru</h2>
        {linksError && <p className={styles.listError}>{linksError}</p>}
        {!linksError && links !== null && links.length === 0 && (
          <p className={styles.empty}>Belum ada tautan. Buat tautan pertama di atas.</p>
        )}
        {links !== null && links.length > 0 && (
          <ul className={styles.rows}>
            {links.map((link) => (
              <li key={link.code} className={styles.row}>
                <span className={styles.code}>{link.code}</span>
                <a
                  href={link.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.shortLink}
                >
                  {link.shortUrl}
                </a>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.targetUrl}
                  title={link.url}
                >
                  {link.url}
                </a>
                <time className={styles.date} dateTime={link.createdAt}>
                  {new Date(link.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
