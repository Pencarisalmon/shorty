# Shorty

Aplikasi web perpendek URL berbasis Next.js (App Router). Masukkan URL panjang di halaman `/`, dapatkan short link, buka short link untuk diarahkan ke tujuan.

## Setup

```bash
pnpm install
# buat file .env berisi DATABASE_URL (connection string Neon Postgres)
pnpm db:migrate        # jalankan migration yang ada di drizzle/
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Build produksi

```bash
pnpm build   # build + typecheck
pnpm start   # serve hasil build
```

## API

- `POST /api/shorten` — body `{"url": "https://..."}` → `201` `{code, shortUrl}`; URL invalid → `400`.
- `GET /<code>` — redirect `307` ke URL tujuan; kode tidak ada → `404`.

## Konfigurasi

- `DATABASE_URL` (env, wajib) — connection string Neon Postgres.
- `BASE_URL` (env, opsional) — base URL untuk shortUrl yang dihasilkan. Default: origin dari request.

## Penyimpanan

Data disimpan di **Neon Postgres** lewat Drizzle ORM (driver `neon-http`). Schema ada di `lib/schema.ts`, migration di `drizzle/` (di-commit). Perubahan schema:

```bash
pnpm db:generate   # generate migration dari lib/schema.ts
pnpm db:migrate    # terapkan ke database
```
