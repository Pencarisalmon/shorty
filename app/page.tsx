"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [url, setUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [error, setError] = useState("");

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
    </main>
  );
}
