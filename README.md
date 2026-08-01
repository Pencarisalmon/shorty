# Shorty

Aplikasi web perpendek URL berbasis Next.js (App Router). Masukkan URL panjang di halaman `/`, dapatkan short link, buka short link untuk diarahkan ke tujuan.

## Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Build produksi

```bash
npm run build   # build + typecheck
npm run start   # serve hasil build
```

## API

- `POST /api/shorten` — body `{"url": "https://..."}` → `201` `{code, shortUrl}`; URL invalid → `400`.
- `GET /<code>` — redirect `307` ke URL tujuan; kode tidak ada → `404`.

## Konfigurasi

- `BASE_URL` (env, opsional) — base URL untuk shortUrl yang dihasilkan. Default: origin dari request.

## Penyimpanan

Data disimpan sebagai file JSON di `data/links.json` (bukan database; file ini digitignore). Cocok untuk volume rendah / lokal. Untuk produksi dengan traffic, ganti penyimpanan dengan SQLite/database — file JSON rawan race pada tulis bersamaan, dan `data/` tidak persisten di Vercel.
