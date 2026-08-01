<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (e.g. `01-app/`) before writing any code. Heed deprecation notices. In this repo: Next.js **16.2.12**, React **19.2.4**, TypeScript **5**, ESLint **9** flat config.
<!-- END:nextjs-agent-rules -->

# Project: project1

URL shortener app: form at `/`, `POST /api/shorten` creates short links, `GET /<code>` redirects (307).

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build; also runs the typecheck (no separate `typecheck` script)
- `npm run lint` — plain `eslint` (flat config `eslint.config.mjs`)
- No tests, no CI. Manual verification: build, then `npm run start` + curl POST/GET as in dev workflow.

## Architecture

- Storage: `lib/store.ts` — sync fs JSON file at `data/links.json` (gitignored). **Not** SQLite/DB; single-file read+write races under concurrent writes — keep writes low-volume or upgrade to SQLite.
- `lib/store.ts` exports `createShort(url)` and `getUrl(code)`; `genCode()` = 6-char base62 from `crypto.randomBytes` with collision retry. URL validation lives in the API route, not the store.
- Route handlers: `app/api/shorten/route.ts` (POST → 201 `{code, shortUrl}` / 400), `app/[code]/route.ts` (GET → 307 `NextResponse.redirect` / 404).
- `params` is a **Promise** in route handlers (Next 15+): `await params` before use.
- `shortUrl` base comes from `process.env.BASE_URL ?? request origin`.
- No `src/` dir; code lives in `app/` + `lib/`. Import alias `@/*` → repo root. `CLAUDE.md` is just a pointer to this file.
