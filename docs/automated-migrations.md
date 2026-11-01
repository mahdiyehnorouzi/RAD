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
   exact content sha256**. `offsite_backup_pipeline_verified` must also be
   `true`, unless a `migration_exception` object matches this exact commit,
   GitHub run, attempt, migration filename, and digest and has not expired.
   Missing or mismatched approval refuses, never silently skips. The
   exception does not set the offsite flag and does not skip the local dump.
5. With that authorization: takes a verified `pg_dump` backup
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
- approved migrations but no `offsite_backup_pipeline_verified` and no exception (refused)
- a malformed, expired, or non-matching `migration_exception` (refused, no backup)
- an exception that names one migration while another is also pending (refused)
- an exact-match exception with the offsite flag false (local backup, then `migration:run`; the result records that the dump is not offsite)
- the same `(run_id, run_attempt)` migrate transaction a second time (refused before `migrate_api`)
- both approvals present (backup → run → verify, succeeds; a stale exception object is ignored)
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

## One-time migration exception

`migration_exception` is a single optional object in `activation.json`. It
waives only the offsite attestation, and only for one pending migration on
one signed release. The broker still verifies the Sigstore bundle, still
requires `approved_migrations` to pin the same digest, still takes the
local `pg_dump` under `/var/lib/rad-release/backups/`, and still holds
`release.lock`. That dump is on the VPS disk. It is not an offsite backup.
If the VPS disk or the database host is lost after the migration, the
pre-migration state may be unrecoverable.

The object is not tied to a particular filename in code. The next time a
single migration is pending, root can replace the object with a new commit,
run id, attempt, filename, digest, expiry, reason, and `authorized_by`.
That does not require another broker change. Two pending migrations at once
are refused. A second GitHub attempt does not match. The same attempt cannot
enter twice: the broker creates
`/var/lib/rad-release/transactions/<run_id>-<run_attempt>-migrate` without
replacing it. After a successful migrate, delete the object. Leaving it in
place does not authorize a different release, but deleting that transaction
directory while the object is still present and unexpired would allow the
same attempt to match again — do not delete the directory.

`offsite_backup_pipeline_verified` stays false until a real offsite pipeline
has been restored and checked. When that flag is true, the broker does not
consult `migration_exception`.

### Installing this broker without moving the application release

The broker is `/usr/local/libexec/rad-release.py`. It is not inside the API
artifact. Deploy run `41281465243` built commit
`b7fe164c7a58d29686bf866953a26880f4ff1bc0`. Its migrate job checks that
`main` is still that SHA (`deploy-api-vps.yml`). Merging this change into
`main` moves that SHA, and a re-run of `41281465243` then fails that check.
Do not merge this pull request before that re-run.

Install the broker from the reviewed, unmerged commit:

1. On a trusted machine, check out that exact commit. `git rev-parse HEAD`
   must equal the commit recorded on the pull request.
2. `sha256sum scripts/production/rad_release.py` must equal the digest
   published on that pull request. A mismatch means the file is not the
   reviewed broker. Stop.
3. Copy that checkout to the VPS as `/root/rad-reviewed-release` (mode
   private to root). Do not copy it into the live API tree.
4. As root, install only that file with
   `scripts/production/rad-install-broker-trusted-root.sh`, setting
   `NEW_BROKER_SOURCE` to the file inside the reviewed checkout and
   `RAD_INSTALL_CONFIRM=yes-install-live`. The script hashes the file it
   installs and writes that digest to `broker_sha256`. It does not create
   `migration_exception` and it does not change the offsite flag. It does
   not touch the database.
5. Confirm `sha256sum /usr/local/libexec/rad-release.py` equals the same
   digest. Confirm `offsite_backup_pipeline_verified` is still false.

This step makes the new broker live for the next release. It does not
migrate anything. Stop here until the activation edit below is a separate,
explicit decision.

### Authorizing deploy 41281465243

Do this only after the installed broker hash matches, and only while `main`
is still `b7fe164c7a58d29686bf866953a26880f4ff1bc0`. Check free disk first.
The local dump has to fit.

Copy `/etc/rad-release/activation.json` to
`/root/activation.json.bak-41281465243`. Edit the live file so that it
gains only:

- `approved_migrations["1793510000000-AddUserContactPhone.ts"]` =
  `bd5cb2eb1664db86d8a6339ca033ccd0e3536a1823740847b7da53a8dbcc86bd`
  Recompute that digest from the signed artifact on the VPS and require an
  exact match before saving.
- `migration_exception` with `commit`
  `b7fe164c7a58d29686bf866953a26880f4ff1bc0`, `run_id` `41281465243`,
  `run_attempt` set to the attempt you are about to launch (the failed run
  is attempt 1, so a first full re-run is attempt 2 — read
  `gh run view 41281465243` and do not guess if a re-run already happened),
  `migration` `1793510000000-AddUserContactPhone.ts`, `sha256` the same
  digest,   `expires_at` an UTC `YYYY-MM-DDTHH:MM:SSZ` no more than 24 hours
  ahead (the broker rejects a longer window), `reason` a short explanation, and `authorized_by` the operator
  name. Root ownership of the file is the authorization; `authorized_by`
  is the audit label.

Leave `offsite_backup_pipeline_verified` false. `chmod 0600` the file.
Do not restart services.

Re-run **all** jobs of run `41281465243`. Re-running only the failed job
does not rebuild the artifact. The broker log must contain
`MIGRATION_EXCEPTION` with `local_dump_is_not_offsite=true`, then a
non-empty dump path, then `Migration check complete`, then a healthy API
release. The transaction directory
`41281465243-<attempt>-migrate/migrate-result.json` must record
`local_dump_is_not_offsite: true`.

Then delete `migration_exception` from `activation.json`. Leave the offsite
flag false. Leave the transaction directory and the dump in place.

A failed attempt burns that `run_attempt` even when PostgreSQL rolls the
migration back. The next attempt needs a new `run_attempt` and a new
`expires_at`. Application rollback does not drop `"User"."phone"`. The
database undo is restoring the pre-migration dump into a new database.
Do not run `migration:revert`. Do not restore that dump over the live
database without a separate decision.

After that release has succeeded, this pull request can be merged. The
installed file's bytes stay valid as long as the merged `rad_release.py`
is byte-for-byte the same file that was hashed.

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
