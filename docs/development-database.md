# Local development database

## The problem this fixes

`apps/api/.env` (gitignored, machine-local) was configured with a
`DATABASE_URL` pointing at a remote Postgres instance hosted on Liara
(`olympus.liara.cloud`). Per `docs/liara-migration.md`, **Liara is where the
real backend API and database already live in production** — this is not a
staging/scratch database, it is the one serving `https://api.rad-object.com`
today (confirmed by cross-checking a product slug against the live API
during this audit).

Running `npm run dev:api` (or any other local script that reads
`DATABASE_URL`) with `.env` configured this way means **local development
was talking directly to the live production database** — any admin-panel
click, test upload, or manual script run locally was a real write against
real data. This is almost certainly a deliberate-but-risky personal habit
(pointing local dev at real data to debug something against it), not a bug
in application code — but it has no guard rail, so it's easy to forget it's
switched on.

## The fix: `.env.local`

`app.module.ts`'s `ConfigModule.forRoot` now loads `.env.local` **before**
`.env`, with `.env.local`'s values taking precedence for any key both files
define (NestJS/`dotenv`'s documented array-precedence behavior — see its
`loadEnvFile`, first array entry wins per key). `.env.local` is already
gitignored (`.gitignore` already listed it) and is never committed.

This repo now ships `apps/api/.env.local.example` (committed, no secrets)
with the two lines that point local dev at the Docker Postgres:

```
DATABASE_URL="postgresql://rad:rad@localhost:5432/rad"
TYPEORM_SYNCHRONIZE=true
```

**Setup** (one-time per machine):

```bash
cp apps/api/.env.local.example apps/api/.env.local
npm run db:up        # starts the Docker Postgres (docker-compose.yml)
npm run dev:api       # now connects to localhost:5432, not .env's remote URL
```

`.env` itself was **not modified** — whatever it points at (including the
real database, if you deliberately want to point there for a specific debug
session) still works exactly as before when `.env.local` doesn't exist or
doesn't define `DATABASE_URL`. Deleting `.env.local` reverts to whatever
`.env` says, with no other change needed.

## Synthetic seed data, not production data

The Docker Postgres was already independently seeded (by this project's
existing `npm run db:seed` / `seed/seed.ts`, which is itself guarded — see
below) with the synthetic fixtures from `@rad/artworks`'s registry: fake
product names, fake commission messages, and the repo's own
publicly-documented local-only staff logins (`ensure-staff.ts`'s
`DEV_LOGINS` — intentionally public, never valid against a real deploy).
No real customer records were copied from the remote database to make this
work; local dev is fully self-contained.

## Automated tests were already isolated

The two `node:test` spec files that touch a real database
(`src/admin/replace-images.spec.ts`, `src/catalog/catalog-image-select.spec.ts`)
already spin up their own disposable `embedded-postgres` instance per run
and hardcode its `localhost` connection string — they never read
`process.env.DATABASE_URL` at all, regardless of what `.env`/`.env.local`
say. A new `isLocalDatabaseUrl` assertion was added to both as defense in
depth (see `src/database/safe-target.ts`), so a future edit that
accidentally wires in a real connection string fails immediately instead of
silently running tests against it.

## Guarding the scripts that DO read `DATABASE_URL`

Seed/bootstrap scripts (`seed/seed.ts`, `seed/ensure-staff.ts`,
`seed/import-uploaded-products.ts`) legitimately need to connect using
whatever `DATABASE_URL` is configured — including, intentionally, a real
deploy's database when run as part of an ops workflow (e.g. bootstrapping
the owner account after a fresh deploy). They now call
`assertSafeScriptTarget()` (`src/database/safe-target.ts`) before
connecting:

- Passes silently for `localhost`/`127.0.0.1`/`::1`.
- Otherwise refuses to run (`UnsafeDatabaseTargetError`) **unless**
  `RAD_ALLOW_REMOTE_DB_WRITE` is set to the *exact hostname* being
  connected to — naming the host (not just "yes") means a stale/copied env
  var can't silently authorize a different target later.
- Does **not** key off `NODE_ENV` — a local script run rarely sets
  `NODE_ENV=production`, so that alone proves nothing about which database
  `DATABASE_URL` points at.

This preserves the legitimate ops workflow (an operator who really does
mean to run `npm run db:ensure-staff` against a live deploy just sets
`RAD_ALLOW_REMOTE_DB_WRITE=<that host>` for that one invocation) while
failing closed for the accidental case this document exists because of.

`src/database/safe-target.spec.ts` covers the guard itself.
