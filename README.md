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
- `BETTER_AUTH_SECRET` (env, wajib) — secret untuk Better Auth (session cookie signing).
- `RESEND_API_KEY` (env, opsional) — untuk pengiriman kode OTP via Resend. Tanpa ini, OTP dicetak ke console server (fallback dev).
- `RESEND_FROM` (env, opsional) — alamat pengirim email OTP. Default: `Shorty <onboarding@resend.dev>`.
- `BASE_URL` (env, opsional) — base URL untuk shortUrl yang dihasilkan. Default: origin dari request.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (env, opsional) — kredensial OAuth Google (untuk sign-in via Google). Tanpa ini, tombol Google di halaman sign-in/sign-up mengembalikan error.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` (env, opsional) — kredensial OAuth GitHub (untuk sign-in via GitHub). Tanpa ini, tombol GitHub di halaman sign-in/sign-up mengembalikan error.

## Autentikasi

Better Auth di `/api/auth/*` (catch-all). Sign-in via email OTP:

- `POST /api/auth/email-otp/send-verification-otp` — body `{"email": "...", "type": "sign-in"}` → kirim kode.
- `POST /api/auth/sign-in/email-otp` — body `{"email": "...", "otp": "123456"}` → set session cookie.
- `GET /api/auth/get-session` — status sign-in (dengan cookie).

Sign-in via OAuth (Google / GitHub, Authorization Code + PKCE):

- `POST /api/auth/sign-in/social` — body `{"provider": "google" | "github", "callbackURL": "/"}` → mengembalikan URL otorisasi provider; browser diarahkan ke sana, lalu kembali ke callback.
- Callback: `GET /api/auth/callback/{provider}` — redirect URI **exact-match** yang harus didaftarkan di konsol provider: `<BETTER_AUTH_URL>/api/auth/callback/google` dan `<BETTER_AUTH_URL>/api/auth/callback/github`.

Account linking: sign-in via OAuth dan via email OTP dengan email yang sama otomatis terhubung ke satu akun (Better Auth implicit linking; Google dan GitHub diperlakukan sebagai trusted providers).

Session cookie: httpOnly, SameSite=Lax, Secure di produksi (https). Lifetime 30 hari sliding, cap absolut 90 hari.

## Penyimpanan

Data disimpan di **Neon Postgres** lewat Drizzle ORM (driver `neon-http`). Schema ada di `lib/schema.ts`, migration di `drizzle/` (di-commit). Perubahan schema:

```bash
pnpm db:generate   # generate migration dari lib/schema.ts
pnpm db:migrate    # terapkan ke database
```
