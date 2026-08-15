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
- `pnpm test:e2e` — Playwright e2e in `e2e/` (mocks auth HTTP endpoints; webServer builds + starts prod). No unit tests, no CI.

## Architecture

- **Storage: Neon Postgres via Drizzle ORM** (neon-http driver), not a JSON file anymore (migrated in commit a12325f). `lib/db.ts` = `drizzle(neon(process.env.DATABASE_URL!))`; `.env` (gitignored) must contain `DATABASE_URL`.
- `lib/schema.ts` — `links` table: `code` text PK, `url` text, `ownerId` text nullable FK → `user.id` (`ON DELETE SET NULL`), `createdAt` timestamptz. `drizzle/` migrations are committed.
- `lib/auth-schema.ts` — Better Auth tables (`user`, `session`, `account`, `verification`), CLI-generated; regenerate with `pnpm dlx @better-auth/cli generate --config <temp-config> --output lib/auth-schema.ts --yes` (CLI's jiti loader can't resolve the `@/` alias, so use a temp config with relative imports).
- `lib/auth.ts` — Better Auth instance: Drizzle adapter on the existing `db`, email-OTP plugin (Resend delivery; without `RESEND_API_KEY` the OTP is logged to the server console as a dev fallback), sessions 30-day sliding with a 90-day absolute cap enforced by an adapter wrapper.
- Auth endpoints mount at `app/api/auth/[...all]/route.ts` (standard Better Auth catch-all). No custom auth endpoints yet.
- Auth UI (client-side): `lib/auth-client.ts` = `createAuthClient` + `emailOTPClient` plugin. Custom receipt-styled pages `app/sign-in/` + `app/sign-up/` share `components/auth/one-time-code-form.tsx` (send code → enter code → `signIn.emailOtp`). Home page uses `authClient.useSession()`: sign-in nudge after anonymous shorten + signed-in strip with SIGN OUT. Client flow: `emailOtp.sendVerificationOtp({email,type:"sign-in"})` auto-creates the account on first sign-in (no separate sign-up semantics); e2e mocks the auth HTTP endpoints via Playwright route interception.
- Env for auth: `BETTER_AUTH_SECRET` (required), `RESEND_API_KEY` + optional `RESEND_FROM` (OTP email), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` + `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` (OAuth; providers 500 with `CLIENT_ID_AND_SECRET_REQUIRED` when unset). OAuth redirect URIs (exact-match, set in provider console): `<BETTER_AUTH_URL>/api/auth/callback/google|github`. Account linking: `account.accountLinking.trustedProviders: ["google","github"]` — OAuth and email-OTP identities with the same email resolve to one account. OAuth UI: `components/auth/oauth-buttons.tsx` on sign-in/sign-up pages; e2e in `e2e/oauth.spec.ts` mocks the `sign-in/social` redirect.
- `lib/store.ts` exports async `createShort(url, ownerId?)` / `getUrl(code)`. `genCode()` = 6-char base62 with alphabet `0-9A-Z-a-z` (order: digits, uppercase, lowercase), inserts with `onConflictDoNothing` + 5 retries.
- Route handlers: `app/api/shorten/route.ts` (POST → 201 `{code, shortUrl}` / 400; stores session user as `ownerId` when signed in, `auth.api.getSession`), `app/[code]/route.ts` (GET → 307 `NextResponse.redirect` / 404; ignores ownership).
- `params` is a **Promise** in route handlers (Next 15+): `await params` before use.
- `shortUrl` base comes from `process.env.BASE_URL ?? request origin`.
- No `src/` dir; code lives in `app/` + `lib/`. Import alias `@/*` → repo root. `CLAUDE.md` is just a pointer to this file.
- `opencode.json` enables the remote Neon MCP server (mcp.neon.tech).

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues (repo: Pencarisalmon/shorty); use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles; label strings equal to role names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
