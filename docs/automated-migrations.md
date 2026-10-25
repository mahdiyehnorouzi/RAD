# Automated production migrations

Status: **code reviewed and tested here; not active in production.** Nothing
in this document grants itself permission to migrate the real database — see
"One-time operator transition" below for the single step that activates it,
which only a root operator on the VPS can perform.

## What changed, and what didn't

Before this change, `scripts/production/rad_release.py` (the root-owned
release broker — see `docs/db-migration-runbook-product-attributes.md` and
`docs/self-hosted-production-release.md` for its full trust model) had **no
migration path at all**. Every migration, including the product-attributes
one, was applied by a human operator running `npm run migration:run` by hand
against `DATABASE_URL`, before manually triggering `deploy-api-vps.yml`.
That manual runbook is not being replaced — it remains the correct procedure
for a migration an operator wants to run ahead of time, or for recovery.

This change adds a second, automatic path that most releases will use
instead: `deploy-api-vps.yml` gains a `migrate` job that runs **before**
`release`, over the exact same signed artifact, through the exact same
Tailscale/SSH transport and the exact same root-owned broker. It:

1. Reads which migration files this artifact ships from the same signed
   `release.json` manifest the broker already verifies (`make-manifest.py`
   now records them at build time — `manifest["migrations"]`).
2. Compares that list against what the **live production database's own
   `migrations` table** already reports as applied — never a counter or a
   flag CI controls, so a check against stale/wrong state is not possible by
   construction.
3. If nothing is pending, it's a fast no-op: no backup, no lock held beyond
   the brief check, no change to anything. This is the common case for most
   deploys (frontend-only changes, or any commit after a migration has
   already landed).
4. If something is pending, it requires `migrations_verified: true` in the
   root-private `/etc/rad-release/activation.json` (see below) — refusing,
   not silently skipping, if that approval is missing.
5. With approval: takes a verified `pg_dump` backup
   (`/var/lib/rad-release/backups/`, root-private, proven at least
   structurally restorable via `pg_restore --list` before anything else
   happens), then runs `npm run migration:run` from the **exact same
   extracted artifact** `release` would deploy, under the same database-host
   guard (`RAD_ALLOW_REMOTE_DB_WRITE`) the manual runbook always required.
6. Re-checks the migrations table afterward; if anything it expected is
   still missing, it fails loudly rather than reporting success.
7. `release` (the actual API deploy) only runs if `migrate` succeeded —
   `deploy.yml`'s existing "API first, then frontend only if API succeeded"
   ordering is unchanged; `migrate` is simply a new, earlier gate in front
   of the API leg specifically.

Nothing about `release_api`/`release_frontend`, the systemd/Docker release
logic, health checks, or rollback changed. `migrate` never touches
`rad-api.service`, the `/opt/rad/apps/api` symlink, or any container — it
only ever runs `pg_dump`, `pg_restore --list`, and `npm run migration:run`,
all read/backup/forward-only.

## Why this is safe by construction, not just by convention

- **The broker still refuses to release with `TYPEORM_SYNCHRONIZE=true`** or
  any systemd startup hook (`api_preflight`, unchanged). This feature does
  not add a sync-on-boot path; it adds an explicit, reviewed, pre-deploy
  migration step that is the *opposite* of implicit schema sync.
- **The migrations list is signed**, inside the same `release.json` /
  `release.sigstore.json` bundle `gh attestation verify` already checks for
  every release. A compromised runner cannot invent a migration to run —
  only what the attested build actually produced from `apps/api/src/database
  /migrations/*.ts` in the repository at that commit is ever considered.
- **"Pending" is derived from the live database, not trusted input.**
  `pending_migrations()` queries `SELECT name FROM migrations` on the actual
  target and only ever runs what that query says is missing — the same
  table TypeORM's own `migration:run` already treats as authoritative, so
  this is not a new source of truth, just an automated read of the existing
  one.
- **`migrations_verified` is a separate, root-private, explicitly-false-by-
  default flag** (`/etc/rad-release/activation.json`), exactly like
  `runner_workflow_policy_verified` and `production_environments_verified`
  already are. A code change to the broker (this one included) requires its
  own `broker_sha256` re-approval before *any* release/migrate works at all
  — `migrations_verified` is an additional, independent gate on top of that,
  specifically for letting migrations run unattended. Routine (no pending
  migration) deploys are **not** gated by this flag at all — only a deploy
  that actually needs to change the schema is.
- **Migration failures never reach the API deploy.** `release` depends on
  `migrate`'s job result; the broker's own flock (`release.lock`) also
  means a migrate and a release — this run's or any other's — can never run
  concurrently on the host.
- **Nothing here performs a destructive rollback.** Consistent with every
  migration in this repo so far (`docs/db-migration-runbook.md`,
  `docs/db-migration-runbook-product-attributes.md`): `migration:revert`'s
  unconditional `DROP TABLE` is never invoked by any of this. The only
  database "undo" this feature or the manual process offers is restoring
  the pre-migration backup — a human decision, never automatic.

## What is *not* automated (and why)

- **Off-server/encrypted long-term retention of the backup.** The broker
  writes a verified `pg_dump` into `/var/lib/rad-release/backups/`
  (root-private, local to the VPS) and proves it parses with
  `pg_restore --list` before touching anything else — that's the "verified
  pre-migration backup" and "migration lock" this PR implements end to end.
  Shipping that file off-host, encrypting it at rest, and long-term
  retention are **not** added here: this repo's existing backup/restore
  procedure already produces an off-server, SHA256-verified copy (see the
  task context this PR was built from — a production backup was restored
  into an isolated container and its SHA256 matched an off-server copy
  independently of this change). Wiring the broker itself to push backups
  off-host would mean giving the root-owned broker new, permanent, broad
  network-destination credentials — exactly the kind of new privileged
  credential this repo's security model avoids by design (see
  `docs/self-hosted-production-release.md`'s trust/privilege section). The
  operator-owned backup pipeline picking up `/var/lib/rad-release/backups/`
  is the integration point; this PR does not invent a replacement for it.
- **Non-additive / destructive migrations.** `pending_migrations()` and
  `migrate_api()` apply whatever migration files the artifact ships,
  unconditionally — this PR does not add schema-change classification. A
  migration that would be destructive (dropping/renaming a populated
  column, etc.) must still be reviewed by a human as carefully as it always
  has been; this automation changes *where* a reviewed, already-merged
  migration runs, not what gets reviewed before merging it. Treat
  `migrations_verified: true` as "I have reviewed every migration file that
  could ship between now and when I next revisit this flag," not a
  one-time rubber stamp — see the transition section below.
- **The release broker's rollback command still does not touch the
  database.** `rad-release rollback <transaction>` (unchanged) reverts code
  only, per the existing, explicit split between code rollback and database
  recovery this repo has used for every migration so far.

## One-time operator transition

This is new, privileged behavior the root-owned broker did not have before.
Per `docs/self-hosted-production-release.md`'s own stated policy
("`scripts/production/rad_release.py` is a root-owned, hash-pinned file that
requires its own separate re-approval for any change — adding automatic
migration execution to it is a larger, separate decision, not bundled into
a feature PR"), activating it requires the same kind of explicit root action
every other broker change already requires:

1. **Merge and review this PR normally first.** Nothing activates on merge.
   `release`/`migrate` both still require the installed broker's
   `broker_sha256` to match what's approved in
   `/etc/rad-release/activation.json` — so until an operator installs this
   new broker version and re-approves its hash, **every** release (not just
   migrations) will fail closed with "Installed broker requires root
   re-approval," the same way any other broker code change already behaves.
   Install it with the existing documented procedure (same file, same
   path, same ownership/permission requirements as today — this PR adds
   functions to the existing file, it does not change how it's installed).
2. **Re-run the existing `scripts/production/rad-activation-prep.sh`** (now
   updated to also preserve any existing `migrations_verified` value, never
   silently reset it to `false` or auto-approve it to `true`) to produce a
   candidate policy with the new `broker_sha256`.
3. **Separately decide whether to set `migrations_verified: true`.** This is
   the one new judgment call: the operator is approving "this host may run
   `npm run migration:run` against production, backed up and locked, for
   any migration file that ships in a signed, attested API artifact,
   without a human watching it happen." Until that's set, the `migrate` job
   will keep failing closed with an explicit "Pending migrations require
   operator approval" error for any commit that actually has one — routine
   deploys with no pending migration are unaffected either way.
4. **Rehearse once against an isolated database before relying on it in
   production** — point a disposable Postgres 16 instance (not production)
   at a copy of this repo's `migrate_preflight`/`backup_database`/
   `run_pending_migrations` path the same way
   `docs/db-migration-runbook-product-attributes.md` already rehearsed the
   manual procedure, so the first time this automated path actually runs
   isn't against the real database.
5. Only after 1–4: flip `migrations_verified` (and, separately, `enabled`
   if it wasn't already `true`) in the live, root-private
   `/etc/rad-release/activation.json`.

Until that happens, this PR changes nothing about how production actually
releases — it is dormant code behind the same fail-closed activation gate
every other capability in this broker already uses.

## Tests

`scripts/production/test_rad_release.py` adds coverage (run via
`python3 -B -m unittest discover -s scripts/production -p 'test_*.py'`,
the same suite `npm run test`/`rad-activation-prep.sh` already run) for:

- a deploy with no pending migrations (fast no-op, no backup)
- a deploy with pending migrations, approved (backup → run → verify)
- pending migrations without `migrations_verified` (refused, nothing runs)
- a tampered/mismatched artifact (checksum fails before anything runs)
- migration failure (stops before the state file is marked `applied`,
  `release` never starts)
- backup failure (stops before `migration:run` is ever invoked)
- a migration that reports success but isn't actually present afterward
  (treated as a failure, not a success)
- idempotent retry (a second check against an already-migrated database is
  a no-op and does not re-run `migration:run` or take a second backup)
- the manifest's `migrations` list format (rejects anything that isn't a
  well-formed `<timestamp>-<ClassName>.ts` list)

`scripts/test/test-rad-deploy-ssh.sh` adds coverage for the new `migrate`
SSH grammar: a well-formed `migrate commit=... run_id=... run_attempt=...`
request reaches the broker with `action: "migrate"` and `kind` forced to
`"api"`, and a `migrate kind=...` request (trying to smuggle an unexpected
field) is rejected before it ever reaches the broker.

`scripts/test/test-activation-prep.sh` adds coverage confirming
`migrations_verified` is preserved across re-runs and defaults to `false`
for a first-time candidate, exactly like the two existing GitHub-side flags.

What is **not** covered by this test suite, because it requires a real
Postgres instance and real production secrets this environment deliberately
cannot and must not have: a live `pg_dump`/`pg_restore --list` against a real
database, and a live `npm run migration:run` against a real database. Those
are exactly what step 4 of the transition above (an isolated rehearsal) is
for, and what the existing manual runbook
(`docs/db-migration-runbook-product-attributes.md`) already proved works
for this repo's one real migration so far.

## Remaining risks

- The pending/applied comparison derives TypeORM's stored migration name
  from the filename (`<timestamp>-<ClassName>.ts` → `<ClassName><timestamp>`)
  rather than querying TypeORM itself for that mapping. This matches
  TypeORM's own `migration:generate` convention and this repo's one existing
  migration file, but a future migration created by hand with an unusual
  name, or a future TypeORM version that changes this convention, could
  make `pending_migrations()` wrong. The failure mode is fail-safe either
  way: wrongly computing "nothing pending" when something is would make
  `migration:run` still apply it (idempotent, just noticed slightly later
  and without a fresh-for-this-change backup — mitigated by the operator's
  own existing out-of-band backup cadence), while wrongly computing
  "something pending" merely costs an unnecessary backup, never a bad
  write.
- Off-server encrypted backup retention remains an operator/existing-
  pipeline responsibility, not something this PR automates end-to-end — see
  "What is not automated" above.
- This has not been rehearsed against a real production-shaped VPS/Postgres
  instance by this change — only via the unit tests listed above and
  structural review. Step 4 of the transition is a hard prerequisite, not
  optional, before setting `migrations_verified: true` for real.
