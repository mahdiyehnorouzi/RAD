# Database catch-up migration: runbook

Covers `apps/api/scripts/db-schema-diff.ts` (read-only comparison),
`apps/api/scripts/db-migrate-seaweedfs-catchup.ts` (the additive migration),
and where this fits relative to the API release process in
`docs/opt-rad-release-bootstrap.md` / `scripts/deploy-api-systemd.sh`.

**Database rollback and application rollback are two separate concerns,
on purpose.** `scripts/rollback-api-systemd.sh` only ever changes which
release symlink `rad-api.service` runs and which env file it reads — it
NEVER touches the database, by design (see its own header). If something
goes wrong with the database side specifically, you restore from the
backup taken in step 2 below; you do not "roll back" the database by
re-running application tooling.

## What this migration actually does

Verified (not assumed) that production's live database is missing exactly
what synchronizing this repo's entities as of commit `b84d85d` (the
Prisma→TypeORM migration) would have left out of HEAD's current entities:
5 entirely new tables and a set of new nullable columns/indexes on the 13
tables that already exist, plus two NOT-NULL relaxations. See
`apps/api/scripts/db-migrate-seaweedfs-catchup.ts`'s header for the exact,
reviewed list and how it was derived (TypeORM's own schema builder, used
read-only, diffing a scratch copy of the hypothesized production schema
against current entities — not guessed by hand). Every statement is
additive: no table, column, row, or constraint that currently exists in
production is dropped, narrowed, or rewritten.

`Order.status` values written under old business logic (e.g.
`"payment_pending"`) are NOT touched by this migration — that is already
handled, safely, idempotently, and non-fatally, by the application itself
on every boot (`OrdersService.onModuleInit` →
`migrateLegacyOrderStatuses`). Nothing new is needed there.

## Step 0 — Preflight (read-only, any time, as many times as you want)

```bash
DATABASE_URL="postgresql://.../rad" npx tsx apps/api/scripts/db-schema-diff.ts
```

Prints every statement TypeORM's synchronize would still need to run —
and executes none of them. Expect it to list (at least) the statements in
`db-migrate-seaweedfs-catchup.ts`. If it lists something ELSE too, STOP:
that's drift this task didn't anticipate, and needs review before
touching anything.

## Step 1 — Verify you're pointed at the right database

```bash
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"Product\";"
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"Order\";"
```

Confirm table/row counts look like the production database you expect,
not a stray local/staging one. (`db-migrate-seaweedfs-catchup.ts` also
refuses to run against anything but `localhost`/`127.0.0.1` unless you
explicitly pass `RAD_ALLOW_REMOTE_DB_WRITE=<exact-hostname>` — naming the
host, not just "yes", so a copied env var can't silently authorize a
different target later.)

## Step 2 — Backup (always, before any DDL, no exceptions)

```bash
# On the DB host or anywhere with network access to it:
PGPASSWORD=... pg_dump \
  --host=<host> --port=5432 --username=<user> --format=custom \
  --file="rad-pre-seaweedfs-migration-$(date -u +%Y%m%dT%H%M%SZ).dump" \
  rad

# Verify the dump is actually restorable BEFORE trusting it (into a
# throwaway local database, never back into production):
createdb rad_restore_check
pg_restore --dbname=rad_restore_check "rad-pre-seaweedfs-migration-....dump"
psql rad_restore_check -c "SELECT count(*) FROM \"Product\";"   # compare to step 1's count
dropdb rad_restore_check
```

Store the `.dump` file somewhere durable (off the DB host) before
proceeding. This is the ONLY database rollback path for this migration —
there is no automated "undo" script, because every statement here is
additive and the only way to meaningfully "undo" an additive migration
that real traffic may have already written new rows into is to restore
from a point-in-time backup, not to run `DROP COLUMN`.

## Step 3 — Run the migration

```bash
DATABASE_URL="postgresql://.../rad" npx tsx apps/api/scripts/db-migrate-seaweedfs-catchup.ts
```

Runs its own read-only preflight first (aborting with nothing executed if
the live schema doesn't look like what it expects), then everything else
inside one transaction. A failure at any point rolls back the entire
transaction — Postgres DDL is transactional, so this is a real guarantee,
not a best-effort one.

## Step 4 — Postflight (read-only verification)

```bash
DATABASE_URL="postgresql://.../rad" npx tsx apps/api/scripts/db-schema-diff.ts
```

Expect "No diff." If anything still shows up, STOP and investigate before
deploying API code that depends on it.

## Step 5 — Spot-check real data survived untouched

```bash
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"Product\";"   # same as step 1
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"Order\";"      # same as step 1
psql "$DATABASE_URL" -c "SELECT id, storage, \"objectKey\" FROM \"ProductImage\" LIMIT 5;"  # new columns, all NULL on existing rows
```

## If something goes wrong

- **During step 3** (migration errors out): nothing was committed (see
  above) — the database is exactly as it was in step 1. Fix whatever
  preflight or Postgres complained about and re-run; the script is
  idempotent.
- **After step 3, before deploying new API code**: if you decide not to
  proceed for any reason, the added columns/tables are inert — nothing
  reads or writes them until the new API code is actually running. No
  action needed; they can simply stay.
- **After deploying new API code, and something is wrong with the data
  itself** (not the code): restore the step 2 backup into a fresh
  database and point a diagnostic session at it; do NOT restore it over
  the live database without a separate, explicit decision about the
  writes that happened in between (this migration does not, and cannot,
  make that call for you).

## Deployment order (full picture)

This is the order approved for the FIRST production rollout of the
SeaweedFS/media work, combining this migration with the earlier release
tooling:

1. **Backup** (Step 2 above).
2. **Database migration** (Steps 0, 1, 3, 4, 5 above) — code that depends
   on the new columns/tables is not running yet, so there is no window
   where half-migrated schema meets code that needs it.
3. **`scripts/bootstrap-api-release-layout.sh`** (one-time, if not already
   done) — migrates `/opt/rad/apps/api` to the releases+symlink layout.
   Independent of the database migration; order between this and step 2
   doesn't matter, but both must be done before step 4.
4. **Populate `/etc/rad/api.env`** with `MEDIA_STORAGE_PROVIDER=seaweedfs`
   and the real `SEAWEEDFS_*` values (endpoint, bucket `rad-public`,
   access/secret keys, public URL/upload URL — see the previous report's
   exact values).
5. **API deploy** (`scripts/deploy-api-systemd.sh` / `deploy-api-vps.yml`,
   pinned to the reviewed commit SHA) — only now does code that reads the
   new columns/SeaweedFS config actually run, against a database and env
   that are both already ready for it.
6. **Admin deploy** — already compatible with both Cloudinary and
   SeaweedFS signed-upload flows with no env changes needed (verified in
   an earlier pass of this work); redeploy only to pick up any other
   pending changes on `main`.
7. **Storefront deploy** — same: already renders absolute SeaweedFS
   delivery URLs via its generic `identityLoader()` bypass, no env
   changes needed; redeploy only to pick up any other pending changes.
8. **Verify**: a real image/video upload through Admin, and that it
   renders on Storefront — the actual goal this whole effort has been
   building toward.

Admin and Storefront do not strictly need to redeploy for THIS change (they
were already compatible), but are listed for completeness since "the
final deployment order" was asked for explicitly.
