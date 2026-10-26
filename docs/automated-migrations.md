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

1. Extracts the signed artifact (same checksum verification `release`
   itself does) and runs TypeORM's own `migration:show` CLI command against
   it, over the live production database — not a counter or a flag CI
   controls, and not purely this broker's own derived guess either (see
   "Detection is cross-checked, not trusted from one source" below).
2. Reconciles that output against the signed manifest's migration list
   (now bound by content hash, not just filename — see point 2 below) and
   **fails closed on any disagreement**: a different count, an unrecognized
   name, anything this broker cannot map cleanly back to a signed file.
   Nothing proceeds past this point on ambiguous state.
3. If nothing is pending, it's a fast no-op: no backup, no lock held beyond
   the brief check, no change to anything. This is the common case for most
   deploys (frontend-only changes, or any commit after a migration has
   already landed).
4. If something is pending, it requires that **every** pending migration is
   individually present in `approved_migrations` in the root-private
   `/etc/rad-release/activation.json`, keyed by filename **and pinned to its
   exact content sha256** — and that `offsite_backup_pipeline_verified` is
   also `true`. Missing or mismatched approval refuses, never silently
   skips.
5. With both approvals: takes a verified `pg_dump` backup
   (`/var/lib/rad-release/backups/`, root-private), proves it structurally
   via `pg_restore --list`, and — when the operator has configured a
   dedicated isolated verification database — actually restores it and
   compares row counts against the live source (see point 4 below). Then
   runs `npm run migration:run` from the **exact same extracted artifact**
   `release` would deploy, under the same database-host guard
   (`RAD_ALLOW_REMOTE_DB_WRITE`) the manual runbook always required.
6. Re-runs `migration:show` and re-reconciles afterward; if anything it
   expected is still missing, it fails loudly rather than reporting success.
7. `release` (the actual API deploy) only runs if `migrate` succeeded —
   `deploy.yml`'s existing "API first, then frontend only if API succeeded"
   ordering is unchanged; `migrate` is simply a new, earlier gate in front
   of the API leg specifically.

Nothing about `release_api`/`release_frontend`, the systemd/Docker release
logic, health checks, or rollback changed. `migrate` never touches
`rad-api.service`, the `/opt/rad/apps/api` symlink, or any container — it
only ever runs `pg_dump`, `pg_restore`, `psql`, and `npm run
migration:show`/`migration:run`, all read/backup/forward-only.

## How the four production-safety concerns raised in review are addressed

### 1. Never run `migration:run` on inconsistent/uncertain detection

Detection is **cross-checked from two independent angles, not trusted from
one source**:　`reconcile_migrations()` compares the signed manifest's
migration list against `migration_show()`'s output — the actual, live
answer from TypeORM's own CLI (`migration:show`), run against the real
extracted artifact and the real database, not re-derived from scratch by
this broker's guesswork. If the two disagree in any way — a different
total count, a name on one side that doesn't map to the other, anything
`migration:show` itself fails to produce parseable output for (including a
non-zero/unexpected exit code with no entries at all) — the whole `migrate`
action refuses outright. There is no fallback path that proceeds on
ambiguous state; see `test_migrate_fails_closed_when_typeorm_state_disagrees
_with_manifest` and `test_migration_show_fails_closed_on_unparseable_output`
in `scripts/production/test_rad_release.py`.

This replaces the earlier design, which trusted a filename→TypeORM-class-
name derivation (`migration_record_name`) as the *sole* source of pending
state. That derivation still exists (it's how `reconcile_migrations` maps a
signed filename to the name `migration:show` reports), but it is no longer
trusted blindly — any place it would be wrong now shows up as a reconcile
mismatch and refuses, rather than silently producing a wrong pending list.

### 2. Narrowly scoped approval, tied to the exact signed migration set

There is no single broad `migrations_verified: true` switch anymore.
`make-manifest.py` now binds each migration file into the signed manifest as
`{"name": "<file>", "sha256": "<content hash>"}`, and
`/etc/rad-release/activation.json`'s `approved_migrations` is a
`{name: sha256}` map the operator maintains by hand, one entry per migration
file they have actually reviewed. `migrate_api()` requires, for **every**
migration it would run, that `approved_migrations[name] == sha256` exactly —
pinned to content, not just filename:

- A **new** migration (new filename) has no entry at all → refused until the
  operator adds one.
- A migration file whose **content changes** after being approved (edited,
  or a filename reused for a different migration) no longer matches its old
  approval entry's hash → refused until re-approved.
- An **already-applied** migration never needs approval again on a later
  deploy: once it's applied, `migration:show` reports it as such and it
  simply isn't in the pending list the approval check even looks at.

`scripts/production/rad-activation-prep.sh` preserves this map verbatim
across re-runs (never adds, removes, or "upgrades" an entry on its own),
exactly like it already does for the two GitHub-side approval flags.

### 3. Integration tests against a real, isolated PostgreSQL 16 instance

`scripts/production/test_rad_release_integration.py` (new) starts a
throwaway `postgres:16-alpine` container via Docker, points the **real**
`apps/api` checkout's TypeORM CLI at it (`cli-data-source.ts`, unmodified),
and exercises the actual, unmocked broker functions end to end:
`migration_show` before and after, `backup_database` (`pg_dump` +
`pg_restore --list`, both via the real `psql`/`pg_dump`/`pg_restore`
installed inside that same container through a thin `docker exec`
indirection — see the test file's own header for exactly how), and
`run_pending_migrations` actually running `npm run migration:run` against
real tables. It asserts: the real `AddProductAttributes` migration starts
pending, gets detected correctly, backs up, runs, creates the four real
tables, and `migration:show` reports it applied afterward — then runs it
again to prove idempotency (second pass: nothing pending, no second
backup). It skips (not fails) when Docker or this repository's own
`node_modules` aren't available, so it never blocks a CI/dev environment
that genuinely can't run it, but **does** run wherever those prerequisites
already exist — which `ci.yml`'s "Release broker and workflow policy" job
now provides (an added `npm ci` step; see "What changed in CI" below).

### 4. Backup usability beyond `pg_restore --list`, and the off-server process

`pg_restore --list` (unchanged) proves the dump's table of contents parses
— structural, not a real restore. `verify_restore()` (new) goes further
whenever the operator configures a dedicated, isolated verification
database (`RAD_MIGRATION_BACKUP_VERIFY_DATABASE_URL` in the same env file,
naming its exact host, never production — the identical "separate host,
not just a different string" convention `rad-activation-prep.sh` already
uses for its own `RESTORE_DATABASE_URL`): it actually restores the exact
dump into it, compares the source and restored `Product` row count, and
resets that database's schema afterward. Without that configuration, the
skip is explicit (logged, not silent), and the integration test above
exercises exactly this restore path for real against the ephemeral Postgres
container.

**The off-server process itself is enforced as an explicit gate, not a
one-time documentation note**: `offsite_backup_pipeline_verified` in
activation.json must be `true` before `migrate_api` will run *anything*
unattended — this is the operator's attestation that the existing,
already-established off-server backup pipeline (the one that, per this
PR's own originating context, already produces a SHA256-verified off-server
copy of production backups) actually covers
`/var/lib/rad-release/backups/`. It is checked independently of, and in
addition to, per-migration approval — both must hold. The broker itself
still does not gain any new network-destination credentials to push backups
off-host directly; see "What is not automated" below for why that remains a
deliberate boundary, not an oversight.

### 5. Broker-upgrade / activation-transition safety

`test_old_shaped_activation_policy_still_validates_after_broker_upgrade` in
`scripts/production/test_rad_release.py` proves the specific invariant this
depends on: a policy written **before this feature existed at all** (no
`approved_migrations`, no `offsite_backup_pipeline_verified` keys present)
still passes `validate_activation()` once its `broker_sha256` is updated to
this new broker version. Neither new field is in `validate_activation()`'s
own required-fields loop — both are read defensively with `.get()`, only at
the point `migrate_api` actually needs them, and only when a migration is
actually pending. Concretely: **installing this broker upgrade cannot, by
itself, break or block a routine (non-migrating) production deploy** —
`release`/`deploy-frontend` work exactly as they did before, with or
without those two fields present, as long as `broker_sha256` is re-approved
(which every broker code change — this one included — already requires,
unchanged from before this PR). Only a deploy that actually ships a pending
migration is affected by whether those two fields are set, and if they
aren't, that specific deploy's `migrate` job fails closed with a specific,
actionable error — not a crash, not a silent skip, and not a block on
unrelated releases.

## Why the rest of this is safe by construction

- **The broker still refuses to release with `TYPEORM_SYNCHRONIZE=true`** or
  any systemd startup hook (`api_preflight`, unchanged). This feature does
  not add a sync-on-boot path; it adds an explicit, reviewed, pre-deploy
  migration step that is the *opposite* of implicit schema sync.
- **The migrations list is signed**, inside the same `release.json` /
  `release.sigstore.json` bundle `gh attestation verify` already checks for
  every release — now by content hash per file, not just name (point 2).
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
  (root-private, local to the VPS). Shipping that file off-host, encrypting
  it at rest, and long-term retention are **not** added here — they remain
  this repo's existing, already-established backup pipeline's job.
  `offsite_backup_pipeline_verified` (point 4 above) is how this PR makes
  that dependency an explicit, checked gate rather than an assumption.
  Wiring the broker itself to push backups off-host would mean giving the
  root-owned broker new, permanent, broad network-destination credentials —
  exactly the kind of new privileged credential this repo's security model
  avoids by design (see `docs/self-hosted-production-release.md`'s
  trust/privilege section).
- **Non-additive / destructive migrations.** This PR does not add schema-
  change classification. A migration that would be destructive (dropping/
  renaming a populated column, etc.) must still be reviewed by a human as
  carefully as it always has been — `approved_migrations`' per-migration,
  per-content-hash approval (point 2) is exactly where that review is
  recorded, one migration at a time; it is never a blanket rubber stamp.
- **The release broker's rollback command still does not touch the
  database.** `rad-release rollback <transaction>` (unchanged) reverts code
  only, per the existing, explicit split between code rollback and database
  recovery this repo has used for every migration so far.

## What changed in CI

`ci.yml`'s "Release broker and workflow policy" job now runs `npm ci`
(Node 22, matching every other job) before the existing
`python3 -B -m unittest discover -s scripts/production -p 'test_*.py'`
step, so the real `apps/api` TypeORM CLI (`tsx`, `typeorm`) is available to
`scripts/production/test_rad_release_integration.py`'s Docker-backed
Postgres test. The pre-existing broker unit tests
(`test_rad_release.py`) are unaffected and still run with everything mocked,
needing neither Docker nor installed dependencies.

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
   path, same ownership/permission requirements as today). As proven by
   concern #5's test above, this step alone changes nothing about routine
   deploys — it is the prerequisite for the next steps, not itself a risk
   to them.
2. **Re-run the existing `scripts/production/rad-activation-prep.sh`** (now
   updated to also preserve any existing `approved_migrations` map and
   `offsite_backup_pipeline_verified` value, never silently resetting or
   auto-approving either) to produce a candidate policy with the new
   `broker_sha256`.
3. **Separately decide whether to set `offsite_backup_pipeline_verified:
   true`.** This is an attestation that the existing off-server backup
   pipeline actually covers `/var/lib/rad-release/backups/` — confirm that
   concretely (check the pipeline's own config/logs for that path) before
   setting it, not as a formality.
4. **Review and approve each migration individually** by adding it to
   `approved_migrations` as `{"<exact filename>": "<its real sha256>"}` —
   the broker's own error message on a refused migrate gives you both
   values exactly, or compute the hash yourself
   (`sha256sum apps/api/src/database/migrations/<file>.ts`) against the
   reviewed file before approving it.
5. **Rehearse once against an isolated database before relying on it in
   production** — `scripts/production/test_rad_release_integration.py`
   (new, this PR) already does this against an ephemeral container as part
   of CI; additionally running it, or the manual procedure in
   `docs/db-migration-runbook-product-attributes.md`, against a disposable
   Postgres 16 instance that more closely mirrors the real VPS is still
   worth doing once before the first real unattended migration.
6. Only after 1–5: set `enabled: true` (if it wasn't already) in the live,
   root-private `/etc/rad-release/activation.json`.

Until that happens, this PR changes nothing about how production actually
releases — it is dormant code behind the same fail-closed activation gate
every other capability in this broker already uses, and (per concern #5)
cannot regress any deploy that doesn't ship a pending migration.

## Tests

`scripts/production/test_rad_release.py` (run via
`python3 -B -m unittest discover -s scripts/production -p 'test_*.py'`,
the same suite `npm run test`/`rad-activation-prep.sh` already run) covers,
with every external call mocked:

- a deploy with no pending migrations (fast no-op, no backup)
- pending migrations with no approval entry at all (refused)
- pending migrations approved by **name but with a stale/wrong content
  hash** (refused — proves approval is pinned to content, not filename)
- approved migrations but no `offsite_backup_pipeline_verified` (refused)
- both approvals present (backup → run → verify, succeeds)
- a tampered/mismatched artifact (checksum fails before anything runs)
- migration failure (stops before the state file is marked `applied`,
  `release` never starts)
- backup failure (stops before `migration:run` is ever invoked)
- `migration:show` and the manifest disagreeing on count or on an
  unrecognized name (refused, fails closed — concern #1)
- `migration:show` producing no parseable output at all, in several shapes
  (refused rather than guessed at)
- a migration that reports success but isn't actually present afterward
  (treated as a failure, not a success)
- idempotent retry (a second check against an already-migrated database is
  a no-op and does not re-run `migration:run` or take a second backup)
- the manifest's `migrations` list format, including per-entry sha256 and
  duplicate-name rejection
- an old-shaped activation policy (predating this feature) still validating
  cleanly after a broker-hash update — concern #5

`scripts/production/test_rad_release_integration.py` (new) covers, against
a real, ephemeral PostgreSQL 16 container and the real `apps/api` TypeORM
CLI — concern #3:

- initial state: the real migration starts pending, correctly detected
- backup: a real `pg_dump` is produced and its table of contents is real
  and non-empty via `pg_restore --list`
- a real `npm run migration:run` actually creates the four real tables
- `migration:show` reports the migration applied afterward
- a second pass against the now-migrated database is a true no-op (no
  second backup, no second `migration:run` invocation)
- (when `RAD_MIGRATION_BACKUP_VERIFY_DATABASE_URL` is additionally
  configured in the test environment) a real restore of that backup into a
  second ephemeral container, with a row-count comparison — concern #4

`scripts/test/test-rad-deploy-ssh.sh` covers the `migrate` SSH grammar: a
well-formed `migrate commit=... run_id=... run_attempt=...` request reaches
the broker with `action: "migrate"` and `kind` forced to `"api"`, and a
`migrate kind=...` request (trying to smuggle an unexpected field) is
rejected before it ever reaches the broker.

`scripts/test/test-activation-prep.sh` covers `approved_migrations` and
`offsite_backup_pipeline_verified` being preserved across re-runs and
defaulting to empty/false for a first-time candidate, exactly like the two
existing GitHub-side flags.

## Remaining risks

- `reconcile_migrations()`'s fail-closed cross-check (concern #1) removes
  the single point of failure the earlier design had, but it is still
  possible for *both* sides to agree on something wrong in a way this
  broker cannot detect — e.g. if TypeORM itself were misconfigured to point
  `migration:show` at the wrong database. This is bounded by the existing
  `assertSafeScriptTarget`/`RAD_ALLOW_REMOTE_DB_WRITE` host-naming guard
  (unchanged, already required before this PR) rather than anything new
  here.
- Off-server encrypted backup retention remains an operator/existing-
  pipeline responsibility gated by attestation
  (`offsite_backup_pipeline_verified`), not verified independently by the
  broker itself — see "What is not automated" above.
- `verify_restore()`'s real-restore proof only runs when
  `RAD_MIGRATION_BACKUP_VERIFY_DATABASE_URL` is configured; without it,
  per-deploy backup verification is structural (`pg_restore --list`) only.
  The integration test exercises the real-restore path, but a production
  VPS still needs that variable configured for the same proof to run
  against real backups, not just the test's ephemeral container.
- This has not been rehearsed against the real production VPS by this
  change — only via the unit/integration tests listed above and structural
  review. Step 5 of the transition (an isolated rehearsal closer to the
  real VPS shape) is a hard prerequisite, not optional, before approving
  any migration for real.
