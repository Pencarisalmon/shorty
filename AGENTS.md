<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (e.g. `01-app/`) before writing any code. Heed deprecation notices. In this repo: Next.js **16.2.12**, React **19.2.4**, TypeScript **5**, ESLint **9** flat config.
<!-- END:nextjs-agent-rules -->

# Project: project1

URL shortener app: form at `/`, `POST /api/shorten` creates short links, `GET /<code>` redirects (307).

## Commands

- Package manager is **pnpm** (only `pnpm-lock.yaml`; `package-lock.json` was deleted).
- `pnpm dev` — dev server (Turbopack)
- `pnpm build` — production build; also runs the typecheck (no separate `typecheck` script)
- `pnpm lint` — plain `eslint` (flat config `eslint.config.mjs`)
- `pnpm db:generate` / `pnpm db:migrate` — drizzle-kit; schema changes: edit `lib/schema.ts` → generate → migrate
- No tests, no CI. Manual verification: build, then `pnpm start` + curl POST/GET.

## Architecture

- **Storage: Neon Postgres via Drizzle ORM** (neon-http driver), not a JSON file anymore (migrated in commit a12325f). `lib/db.ts` = `drizzle(neon(process.env.DATABASE_URL!))`; `.env` (gitignored) must contain `DATABASE_URL`.
- `lib/schema.ts` — `links` table: `code` text PK, `url` text, `createdAt` timestamptz. `drizzle/` migrations are committed.
- `lib/store.ts` exports async `createShort(url)` / `getUrl(code)`. `genCode()` = 6-char base62 with alphabet `0-9A-Z-a-z` (order: digits, uppercase, lowercase), inserts with `onConflictDoNothing` + 5 retries.
- Route handlers: `app/api/shorten/route.ts` (POST → 201 `{code, shortUrl}` / 400), `app/[code]/route.ts` (GET → 307 `NextResponse.redirect` / 404).
- `params` is a **Promise** in route handlers (Next 15+): `await params` before use.
- `shortUrl` base comes from `process.env.BASE_URL ?? request origin`.
- No `src/` dir; code lives in `app/` + `lib/`. Import alias `@/*` → repo root. `CLAUDE.md` is just a pointer to this file.
- `opencode.json` enables the remote Neon MCP server (mcp.neon.tech).
