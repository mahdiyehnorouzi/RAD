# CI/CD pipeline: merge to `main` → automatic production deploy

## What this is

`main` pushes automatically deploy. `.github/workflows/deploy.yml` is the single automatic
entry point: it waits for CI, works out which of API / Storefront / Admin the push actually
affects (dependency-aware, not naive path matching — see below), then releases API first (if
affected), and only once that's healthy, Storefront/Admin (if affected). Nothing else in this
repo deploys on its own.

Day-to-day workflow is now exactly:

1. Work on a feature branch, open a PR.
2. Wait for CI (`ci.yml`, required on the PR).
3. Merge to `main`.
4. `deploy.yml` fires, deploys whatever changed, runs health checks + smoke tests, and
   automatically rolls back on failure. You watch the Actions tab; you do not SSH in, run a
   script, or click "Run workflow" for a routine release.

This document is the one-time setup checklist, the dependency map the automatic path uses,
and the emergency manual-recovery procedures — not a description of application behavior.

## Correctness fixes from review (read this if you're re-reviewing)

Three bugs were found and fixed in the initial version of this pipeline, before any of it had
been exercised against the real VPS:

1. **`github.event_name == 'workflow_call'` doesn't mean what it looks like it means.** Inside a
   workflow invoked via `workflow_call`, `github.event_name` is NOT `"workflow_call"` — it's
   *inherited* from whatever triggered the top-level caller (here, `deploy.yml`'s own `push`
   trigger). The original `release` job conditions checked for `== 'workflow_call'` directly,
   which never matches — the job would have silently shown as **skipped**, and because a
   skipped job doesn't fail a GitHub Actions run by default, `deploy.yml` would have reported
   **success** on every single push, having deployed nothing. Fixed by keying every `if:`
   condition off the `inputs` context instead (verified genuinely reliable — a bare `push` event
   carries no `inputs` context at all, so a required `workflow_call` input reads as empty/false
   there, while an actual `workflow_call` invocation always supplies it as a real boolean) and,
   for the one workflow where it's unambiguous (`deploy-api-vps.yml` has no direct `push`
   trigger of its own), `github.event_name == 'workflow_dispatch'` to detect the manual path.
   Both decisions are now centralized in a single `should-release`/`should-deploy` job per
   workflow, reused everywhere else, instead of re-derived (and risking drifting out of sync) in
   multiple places.
2. **A silently-skipped required release wasn't failing the run.** Added a `verify-outcome` job
   to both `deploy-api-vps.yml` and `deploy-frontend-vps.yml` that independently recomputes
   "was a release required" and explicitly fails if `release`'s result isn't `success` when it
   was. This is deliberately a second, simple check of the same question the (now-fixed)
   `release` job's own condition already answers — not because duplicating the predicate is
   elegant, but because a condition that goes silently wrong again in the future should still be
   caught here.
3. **The API's automatic rollback didn't cover the new external smoke test.** The release
   script's own internal rollback only triggered on its own (VPS-local) health-check failure.
   Added a separate "Roll back after failed smoke test" step that fires when the release script
   itself succeeded but the subsequent public smoke test failed — it reuses the exact same
   rollback mechanics as the existing manual rollback tooling
   (`scripts/lib/rollback-api-remote.sh`, invoked non-interactively, bypassing only its
   interactive confirmation wrapper), restoring whatever the deploy's own manifest recorded as
   the pre-deploy release.

All three were verified by simulating the exact decision logic (push-direct, workflow_call-via-
push, workflow_dispatch-deploy, workflow_dispatch-build-only) standalone and confirming each
produces the intended boolean outcome — see "Validation performed" below for the exact cases
checked.

## Artifact-packaging bugs found by actually extracting and running the artifact

Before the artifact-based deploy could be trusted, the exact tarball the `build-artifact` job
produces was built, extracted into an isolated directory, and actually run — `node
dist/main.js` first, then the real production entrypoint
(`scripts/start-production.mjs`) — against a disposable, throwaway local Postgres instance (never
anything shared or persistent). This surfaced three real defects a "does the tarball contain
`dist/` and `node_modules`" check would have missed entirely:

1. **Broken workspace symlinks.** `node_modules/@rad/*` are symlinks to sibling workspace
   directories (`packages/artworks`, `packages/types`, ...); the original package list never
   included `packages/` at all, so every one of those was left dangling after extraction. Fixed
   by including `packages/` in the tarball. `@rad/admin` and `@rad/storefront` are hoisted into
   `node_modules/@rad/` purely because the OTHER two workspaces need them — api's own
   `package.json` depends on none of the workspace packages except `@rad/artworks` — so those two
   symlinks are removed explicitly before archiving rather than shipped (wasteful) or left
   dangling (the thing being fixed).
2. **A dependency hoisted outside the root `node_modules`.** npm workspaces doesn't guarantee
   every dependency lands in the shared root — `@aws-sdk/client-s3` (a real, directly-used
   dependency of `apps/api`) was hoisted into `apps/api/node_modules` instead, which Node checks
   *before* the root when resolving a `require()` from `apps/api/dist/...`. Shipping only the root
   `node_modules` produced `Error: Cannot find module '@aws-sdk/client-s3'` the moment the storage
   module loaded — confirmed by actually running the extracted artifact, not by inspecting the
   tarball's contents. Fixed by including `apps/api/node_modules` in the tarball whenever it
   exists (it's a lockfile-dependent hoisting outcome, not guaranteed to exist on every future
   lockfile change, so this is included opportunistically rather than required).
3. **`start-production.mjs` runs against TypeScript source, not `dist/`.** Its
   `sync-schema.ts`/`seed/ensure-staff.ts` steps run via `tsx` directly against
   `apps/api/src/...` and `apps/api/seed/...` — neither of which the original artifact shipped at
   all — and `tsx`'s own module resolution for a dependency that ships raw `.ts` alongside its
   compiled `.js` (TypeORM does) silently misresolved without the real `tsconfig.json`/
   `tsconfig.build.json` (api's own and the repo root's) present, throwing an opaque
   `Reflect.getMetadata` `TypeError` with no mention of a missing file. Fixed by shipping
   `apps/api/src`, `apps/api/seed`, and both sets of tsconfig files.

With all three fixed, `scripts/start-production.mjs` was re-run end to end from the corrected,
extracted artifact against a fresh disposable Postgres with its schema already applied (matching
real production's "schema already exists, never auto-synced" state — `TYPEORM_SYNCHRONIZE` was
deliberately left unset, exactly as the deploy script's own guard requires): schema sync correctly
reported skipped, `ensure-staff.ts` succeeded, NestJS mapped every route, and `/health` reported
`{"ok":true,...,"db":true}`. (Pointed at a genuinely schema-less database instead — no tables at
all — `ensure-staff.ts` fails fast with `relation "User" does not exist` and the whole process
exits; this is correct, pre-existing, intentional behavior matching this repo's own rule against
ever auto-provisioning a production schema, not a packaging bug, and was confirmed to be
identical regardless of whether the code arrived via this artifact or the original git-clone path
— it would never occur against the real production database, which already has its schema.)

`scripts/lib/rollback-api-remote.sh` (unchanged by this PR, reused as-is by the post-smoke-test
rollback step) was separately verified by staging two fake "releases" and a manifest recording
the first as pre-deploy, running the script non-interactively with `systemctl`/`curl` stubbed out,
and confirming it read the manifest, swapped the symlink back to exactly the release the manifest
named, and restored the matching env snapshot.

## Phase A — what was already there vs. what this adds

**Already working, reused as-is (per the mission's "reuse existing scripts/workflows"):**

- `rad-api.service` (systemd), `/opt/rad-releases/*`, `/opt/rad/apps/api` symlink —
  `scripts/deploy-api-systemd.sh` / `scripts/lib/deploy-api-remote.sh` already implement the
  full clone → build → atomic swap → health-check → automatic rollback cycle for the API,
  including the snapshot/manifest used for rollback, and refuse to run unless
  `scripts/bootstrap-api-release-layout.sh` has already migrated the host to the symlink
  layout (see `docs/opt-rad-release-bootstrap.md` — **verify this bootstrap has actually run
  on the VPS**; it's a prerequisite this pipeline depends on, not something it does for you).
- `scripts/rollback-api-systemd.sh` / `scripts/lib/rollback-api-remote.sh` — manual, further-back
  rollback, untouched.
- `docker-compose.frontend-vps.yml` + both Dockerfiles — untouched. Images are still built off-VPS
  and pulled from GHCR; nothing is ever built on the VPS itself.
- `ci.yml` — untouched; still the one required status check PRs gate on.
- The Liara/Cloudflare workflows (`deploy-admin-liara.yml`, `deploy-storefront-liara.yml`,
  `release.yml`) — untouched, kept only as the documented historical fallback. This pipeline
  does not touch, replace, or race with them.

**What was missing, now added:**

- Both `deploy-api-vps.yml` and `deploy-frontend-vps.yml` previously **only** deployed via a
  human clicking "Run workflow" (`workflow_dispatch`) — a push to `main` built artifacts but
  never released them. Both now also accept `workflow_call`, so `deploy.yml` can trigger a real
  release programmatically, with no human in the loop, while the manual `workflow_dispatch`
  path is kept byte-for-byte as the emergency/recovery entry point.
- No change-detection existed at all. `deploy.yml`'s `detect` job is new.
- Frontend releases always recreated **both** `storefront` and `admin` containers regardless of
  which one actually changed. The release job now takes `deploy_storefront`/`deploy_admin`
  booleans and only touches (build-tag, pull, recreate, health-poll, and — if needed —
  roll back) the container(s) that are actually affected.
- Smoke tests beyond the containers' own `/api/health`/`/health` endpoint (which only proves the
  process is up on the VPS itself) didn't exist. Both release workflows now run a further,
  independent, read-only check against the real **public** domain after the internal health
  check passes: API's `/health`, `/session`, and a live `/artworks` catalog read (checked for
  `ok:true`, `env:production`, and — directly enforcing this repo's own production-data
  guarantee — that no returned image `src` points at the bundled static-registry path
  (`/catalog/photos/...`), since that would mean stale demo media is reaching a real customer);
  Storefront's homepage, PLP, a PDP discovered from the PLP's own HTML, and `/backend/session`;
  Admin's `/login` page. None of this writes anything or touches a database.
- **Routine API deploys cloned the whole monorepo and ran a full `npm ci && npm run build` on
  the VPS itself** (`scripts/deploy-api-remote.sh`), every single release. The API's release job
  now has a `build-artifact` job that checks out the exact requested commit, builds it, and
  packages a production-only `node_modules` + `dist/` + `VERSION` into a single tarball **on the
  GitHub Actions runner** (`scripts/lib/deploy-api-remote-artifact.sh` +
  `scripts/deploy-api-systemd-artifact.sh`); the VPS only ever receives that already-built,
  already-verified, commit-SHA-named artifact over the existing SSH connection and extracts it —
  no git, no npm, no TypeScript compiler, no network access to the npm registry on the VPS, ever,
  for a routine release. The systemd service, the atomic release/symlink swap, the environment
  guard checks (`TYPEORM_SYNCHRONIZE`, `NODE_ENV=production`), the pre-deploy
  manifest/env-snapshot, and the auto-rollback-on-failed-health-check are all otherwise
  byte-for-byte the same mechanics as before, just fed a prebuilt artifact instead of a fresh
  clone. The original clone-and-build script (`scripts/deploy-api-systemd.sh`) is kept, unused by
  the automatic path, as the disaster-recovery fallback for when a pre-built artifact genuinely
  isn't an option (e.g. GitHub Actions itself is unavailable).

## Known infra gaps this pipeline does **not** attempt to resolve

- `docker-compose.frontend-vps.yml`'s own header comment says the API is "PM2-run" and Postgres
  "stays on Liara", while `deploy-api-vps.yml`/the bootstrap doc describe a systemd+releases
  model and a VPS-local Postgres. These two documents disagree about current production
  topology. This pipeline follows the systemd/releases model (per the task's own stated "known
  infrastructure"), but **this inconsistency should be resolved by someone who can inspect the
  live VPS** — it was flagged, not silently assumed away.
- `packages/state`'s actual consumers weren't fully traced (it isn't declared as a dependency in
  any app's `package.json` yet); the change-detection map conservatively treats a change to it as
  affecting both Storefront and Admin. Narrow this once real usage is confirmed.

## Dependency map the `detect` job uses

| Changed path | Deploys |
|---|---|
| `apps/api/**` | API |
| `apps/storefront/**` | Storefront |
| `apps/admin/**` | Admin |
| `packages/artworks/**` | API, Storefront |
| `packages/types/**` | Storefront, Admin |
| `packages/ui/**` | Storefront, Admin |
| `packages/i18n/**` | Storefront |
| `packages/state/**` | Storefront, Admin (conservative — see above) |
| Root `package.json`/`package-lock.json`, any `tsconfig*.json`, either Dockerfile, `docker-compose.frontend-vps.yml`, the API deploy scripts, or any of the three deploy workflow files themselves | API, Storefront, Admin (shared infra — conservative) |
| Anything else (docs, `*.md`, unrelated config) | nothing |

If a brand-new dependency is added between an app and a package not in this table, update this
map — the job is intentionally explicit grep patterns, not automatic graph analysis (no Nx or
equivalent is installed in this monorepo; this is "a reliable equivalent" per the mission,
scoped to what this repo's actual dependency graph currently is).

## One-time setup required before this is actually hands-off

Everything above is implemented and will run automatically once the following exists. **None of
it can be done from a CI workflow or from this coding session** — it needs direct VPS access
and/or GitHub repository admin access.

### 1. Fix SSH authentication (`Permission denied (publickey,password)`) — **superseded, see Phase F**

**Superseded by Phase F below.** This section described provisioning SSH keys so a
GitHub-hosted runner could reach the VPS; that approach is what's actually broken (GitHub-hosted
runners cannot reach the VPS on port 22 at all) and has been replaced by moving the release jobs
to the self-hosted `rad-production` runner, which needs no inbound SSH. Kept here only as
historical context for why the workflows looked the way they did; do not provision these SSH
keys/secrets as part of the current setup — follow "Phase F — self-hosted `rad-production` runner
migration" instead.

<details>
<summary>Original (superseded) SSH-based instructions</summary>


Do this **on the VPS itself**, so the private key never has to be typed, pasted, or transit
through anything other than the VPS → GitHub Secrets:

```bash
# On the VPS, as the user the deploy already runs as (root, per RAD_API_USER/
# the frontend workflow's REMOTE_TARGET — see "harden further" below if you'd
# rather use a dedicated low-privilege user instead):
ssh-keygen -t ed25519 -C "github-actions-deploy@rad" -N "" -f ~/.ssh/rad_deploy_ed25519
cat ~/.ssh/rad_deploy_ed25519.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Print the private key ONCE to copy into GitHub — then scroll it out of
# your terminal history/scrollback immediately after pasting it into the
# GitHub secret in the next step.
cat ~/.ssh/rad_deploy_ed25519
```

From any machine that already has a known-good connection to the VPS (or from the VPS loopback
itself: `ssh-keyscan -t ed25519 127.0.0.1`, then replace the host part), pin the host key so SSH
host verification is never disabled:

```bash
ssh-keyscan -t ed25519 46.34.163.16
```

In the GitHub repo → **Settings → Secrets and variables → Actions**, set (both the API and
Frontend workflows currently expect **separate** secret names — reuse the same key for both if
you only provisioned one, or provision two separate keypairs/`authorized_keys` entries for
tighter isolation between the two deploy paths):

- `RAD_API_SSH_PRIVATE_KEY` — the private key printed above
- `RAD_API_SSH_KNOWN_HOSTS` — the `ssh-keyscan` output above
- `RAD_FRONTEND_SSH_PRIVATE_KEY` — same (or a second keypair's) private key
- `RAD_FRONTEND_SSH_KNOWN_HOSTS` — same `ssh-keyscan` output

No plaintext key is ever committed to the repo; both workflows already write it to a
runner-local `~/.ssh/id_ed25519` only for the duration of the job and delete it in an
`if: always()` step, and already use `StrictHostKeyChecking=yes` against the pinned
`known_hosts` above — host verification is never disabled.

**Harden further (optional, recommended, not required to get this working):** create a
dedicated `deploy` system user on the VPS instead of using `root`, grant it passwordless `sudo`
only for the exact commands it needs (`systemctl restart rad-api.service`,
`docker compose -f /root/rad-frontend-deploy/docker-compose.frontend-vps.yml ...` — whatever the
real minimal set turns out to be), and set `RAD_API_USER` (repository/environment variable) to
that user. This is a meaningful hardening step but a separate piece of work from "fix the
failing deploy", since it requires deciding and testing the exact sudo rule set against a real
host. (This is now exactly what Phase F's scoped sudo wrappers do.)

</details>

### 2. Make the two GitHub Environments hands-off

`deploy-api-vps.yml` and `deploy-frontend-vps.yml`'s release jobs run under the
`production-api-vps` / `production-frontend-vps` GitHub Environments. If either currently has
**Required reviewers** configured, every release — including this pipeline's fully automatic
one — will sit waiting for a human to click Approve in the Actions UI, which directly
contradicts "no manual approval per release". In **Settings → Environments → (each
environment)**:

- Remove **Required reviewers** if set.
- Keep (or add) **Deployment branches → Selected branches → `main`** — this is what actually
  keeps a stray branch or a bad actor from deploying, without needing a human to click anything
  on every legitimate merge.

If you want a human checkpoint for a specific high-risk change, that's a PR review decision
(require the PR itself to be reviewed before merge), not an environment approval gate — once
something is merged to `main`, this pipeline's whole point is that it ships without further
clicking.

### 3. Verify the API bootstrap has run

`scripts/deploy-api-systemd.sh` refuses to do anything unless `/opt/rad/apps/api` is already a
symlink (see `docs/opt-rad-release-bootstrap.md`). If that one-time migration hasn't run yet on
the real VPS, run it (interactively, as documented there) before relying on the automatic path —
otherwise the very first automatic API deploy will fail fast with a clear error, not silently.

### 4. Confirm repository/environment variables match reality

Both workflows default `RAD_API_HOST`, `RAD_API_USER`, ports, paths, the storefront/admin public
URLs, etc. to the values given in the task's own "known infrastructure" — if any of these differ
on the actual VPS, set the corresponding repository or environment **variable** (not secret) to
override, rather than editing the workflow files.

## What this pipeline deliberately will not do

- Run tests, seeds, or schema sync against production Postgres (CI's DB-backed suites always
  provision their own ephemeral, localhost-only `embedded-postgres` — see `ci.yml`'s
  `test-media-db` job comment).
- Apply a destructive or automatic database migration. If a schema change needs one, that stays
  a manual, explicit, reviewed step — this pipeline only ever releases application code.
- Delete or overwrite SeaweedFS media, or seed/replace production data.
- Deploy `latest` as a moving target — every release is built from, tagged with, and verified
  against an exact commit SHA (API: the real git commit, checked out fresh and verified post-checkout;
  Frontend: the Docker image tag, which **is** the commit SHA).
- Silently swallow a failed rollback — every failure path in both release workflows says, in the
  job log, in one explicit `::error::` line, whether the automatic rollback itself also
  succeeded or failed, and tells you exactly what to check by hand if it did.

## Emergency manual recovery

Both release workflows keep their original `workflow_dispatch` trigger, completely unchanged in
behavior, for exactly this purpose — use when the automatic path can't run (e.g. CI is broken in
a way that's blocking a hotfix) or you need to re-release an older, already-merged commit:

- **API**: Actions → "API VPS release" → Run workflow → type `deploy` into `confirm`, and give
  the exact commit SHA to release (never "whatever main is").
- **Frontend**: Actions → "Frontend VPS release" → Run workflow → `operation: deploy`, and choose
  `deploy_storefront`/`deploy_admin` (both default to `true`).
- **Further-back API rollback**: `scripts/rollback-api-systemd.sh` (interactive, run against the
  VPS over SSH from an operator machine with access) — restores a named earlier release + its
  env snapshot from the manifest/history. Never touches the database; if a schema change
  genuinely isn't backward-compatible with an older release, that needs explicit human
  sign-off first (see `docs/db-schema-compatibility-v1.3.0.md`).
- **Further-back frontend rollback**: redeploy the desired image tag directly —
  `docker compose -f docker-compose.frontend-vps.yml pull <service>` /
  `up -d --no-deps <service>` with `STOREFRONT_IMAGE_TAG`/`ADMIN_IMAGE_TAG` set to the older
  commit SHA you want, run directly on the VPS (or via the same manual `workflow_dispatch` path
  if that commit's images are still in GHCR, which they are unless GHCR's own retention has
  pruned them).

## Phase F — self-hosted `rad-production` runner migration (SSH removal)

**Problem this fixes:** GitHub-hosted runners cannot reach the VPS on port 22 (no inbound
SSH), so both release workflows' `release` jobs failed outright. **Fix:** only the release
stage (the job that actually touches production) moves to the already-registered self-hosted
runner (`rad-production`, user `rad-runner`, `/opt/actions-runner`) — CI, build, and
artifact/image publishing stay on GitHub-hosted `ubuntu-latest` runners, unchanged. The runner
already lives on the VPS and reaches GitHub over an **outbound** connection (the same mechanism
it already uses to report Idle); nothing about inbound firewall rules changes, and no port is
opened.

### What changed

- `deploy-api-vps.yml`'s and `deploy-frontend-vps.yml`'s `release` jobs: `runs-on` changed from
  `ubuntu-latest` to `[self-hosted, rad-production]`. Every other job in both workflows
  (`checks`, `should-release`/`should-deploy`, `build-artifact`/`build-images`,
  `verify-outcome`) is unchanged and still runs on `ubuntu-latest`.
- All SSH steps (`Configure pinned SSH identity`, `Remove runner SSH credentials`, and every
  `ssh`/`scp` invocation) are removed from both workflows. The release steps now run as **local**
  shell commands on the runner, since the runner already is the production host.
- The one privileged operation each release job needs (extract-and-restart for the API;
  `docker compose pull`/`up` for the frontend) is delegated to a narrowly-scoped, root-owned
  wrapper script invoked via a sudoers rule restricted to that exact script path — see
  `infra/rad-production-runner/` (three wrapper scripts, a sudoers file, and a setup `README.md`).
  `rad-runner` itself is granted **no** general sudo rule, **no** Docker-socket/`docker`-group
  membership, and no ability to modify the wrapper scripts it's allowed to invoke (root-owned,
  mode `0750`).
- Artifact integrity: the API artifact's SHA-256 checksum is computed and uploaded alongside the
  tarball, and re-verified on the runner (`sha256sum -c`) before the privileged extraction step
  runs. Both the API artifact and both frontend images now get a GitHub-native **build
  provenance attestation** (`actions/attest-build-provenance`), independently re-verified
  (`gh attestation verify`) on the self-hosted runner before anything privileged touches them —
  this is the "validate artifact integrity and image provenance before release" requirement.
- Frontend images are deployed by **digest**, not by the mutable `:<sha>`/`:latest` tags alone —
  `build-images` now exposes `storefront_ref`/`admin_ref` (`ghcr.io/.../rad-storefront@sha256:...`)
  and `docker-compose.frontend-vps.yml` was changed to accept `STOREFRONT_IMAGE_REF`/
  `ADMIN_IMAGE_REF` (falling back to the old `:latest` tag only for a manual, interactive
  `docker compose up`). The frontend wrapper script refuses any ref that isn't a
  `ghcr.io/<owner>/rad-(storefront|admin)@sha256:<64-hex>` reference.
- Everything this task's requirement 5 names — exact commit SHA deployment, affected-service
  detection, API-first sequencing, health checks, automatic rollback, concurrency protection — is
  **unchanged in behavior**, only in *where* it runs (local commands on `rad-production` instead
  of commands sent over SSH from `ubuntu-latest`). The concurrency groups
  (`rad-api-vps-production`, `rad-frontend-vps-production`), `should-release`/`should-deploy`
  logic, `verify-outcome` jobs, and all three deploy scripts' actual release/rollback mechanics
  are untouched.
- Database/environment files: still never touched by any part of this migration — the wrapper
  scripts only ever call the pre-existing `deploy-api-remote-artifact.sh`/`rollback-api-remote.sh`
  (pinned at a root-owned path outside the git workspace, see below) and `docker compose`; neither
  runs a migration, a seed, or any destructive database operation. No change here.

### Why untrusted PR code can never reach `rad-production`

- `ci.yml` (the only workflow any `pull_request` trigger runs) uses `runs-on: ubuntu-latest`
  everywhere — grepped and confirmed; it never references the `rad-production` label.
- Both release workflows' `release` jobs are reached only via `workflow_call` from `deploy.yml`
  (triggered by `push` to `main`, never `pull_request`) or a manual `workflow_dispatch` — both
  require the change to already be on `main` or require a human with repository write access to
  dispatch it explicitly with the exact commit SHA.
- The `production-api-vps`/`production-frontend-vps` GitHub Environments' **Deployment branches**
  restriction (`main` only) is a second, independent gate on top of the label match.
- **Recommended, requires a paid plan:** a dedicated runner group scoped to this repository and to
  exactly these two workflow files (see `infra/rad-production-runner/README.md` §1) — defense in
  depth beyond the label/environment checks above, which are sufficient on their own but don't
  rely on a single mechanism.

### Why `rad-runner` never gets unrestricted sudo, root, or the Docker socket

Docker-socket access (via the `docker` group) is root-equivalent — a process that can talk to the
Docker daemon can bind-mount the host filesystem into a container and read/write anything as
root. Unrestricted `sudo` is root, full stop. Neither is granted. Instead:

- `rad-runner` can run exactly three fixed, root-owned scripts via `sudo`, each accepting only the
  specific arguments it independently re-validates (see each script's own header comment in
  `infra/rad-production-runner/`): `rad-release-api.sh` (artifact path must resolve under a fixed
  staging directory; commit SHA must be 40 hex chars), `rad-rollback-api.sh` (no arguments at
  all — always restores whatever the deploy manifest recorded), `rad-release-frontend.sh` (image
  refs must be digest-pinned GHCR references matching a fixed pattern; services must be a subset
  of `{storefront, admin}`).
- The scripts these wrappers `exec` (`deploy-api-remote-artifact.sh`, `rollback-api-remote.sh`)
  are pinned at `/opt/rad-releases/.bin/`, **not** inside the runner's own git-workspace checkout
  — root only ever executes code a human with VPS access explicitly reviewed and installed there,
  never whatever happens to be in the latest `main` checkout the CI job pulled.
- `docker compose pull`/`up` only ever run inside the root-owned `rad-release-frontend.sh`
  wrapper; `rad-runner` itself never touches Docker directly for any mutating operation (reading
  container health via `docker inspect` is safe and unprivileged, and is the only Docker command
  `rad-runner` runs directly).

See `infra/rad-production-runner/README.md` for the complete one-time setup this depends on
(runner labels/group, the unprivileged `rad-runner` account, installing the three wrapper
scripts + sudoers rule + pinned release-script copies, the GHCR pull-credential setup, and the
GitHub Environment settings).

### Migration plan (order of operations)

This session **did not** touch the live VPS or GitHub repository settings — all of the following
is a one-time setup a human with VPS root access and GitHub repository admin access must perform,
in this order, before merging/relying on this PR's workflow changes:

1. Confirm/create the dedicated `rad-runner` account (not root, not in the `docker` group) and
   confirm the runner service runs as that user (`infra/rad-production-runner/README.md` §2).
2. Install the three wrapper scripts (§3) and the sudoers rule (§4).
3. Pin `deploy-api-remote-artifact.sh`/`rollback-api-remote.sh` at `/opt/rad-releases/.bin/` (§5)
   and create the `rad-runner`-owned `/opt/rad-releases/.incoming` staging directory (§6).
4. Provision read-only GHCR pull credentials and `docker login` as root (§7).
5. Confirm the runner's labels include `rad-production` (and, if available, scope its runner
   group to this repo + these two workflow files) (§1).
6. Merge this PR's workflow changes to `main`.
7. Trigger one real release of each workflow (a real push that touches `apps/api/**` for the API
   path; one that touches `apps/storefront/**`/`apps/admin/**` for the frontend path, or the
   `workflow_dispatch` emergency path for either) and watch it end-to-end in the Actions tab.
8. Only once both have been verified healthy: delete the now-unused
   `RAD_API_SSH_PRIVATE_KEY`/`RAD_API_SSH_KNOWN_HOSTS`/`RAD_FRONTEND_SSH_PRIVATE_KEY`/
   `RAD_FRONTEND_SSH_KNOWN_HOSTS` secrets from **Settings → Secrets and variables → Actions** — a
   stale, unused private key is still a credential someone could leak, and keeping it serves no
   purpose once nothing reads it.

### Rollback plan (for this migration itself)

If the self-hosted release path misbehaves after cutover, reverting is a single `git revert` of
the commit(s) in this PR — the previous SSH-based workflows still worked mechanically (the only
thing broken was GitHub-hosted runners' inbound SSH being blocked), so a revert restores them
exactly, **as long as the SSH secrets from step 8 above have not yet been deleted**. For that
reason: do not delete the SSH keys/secrets until the self-hosted path has had at least one fully
verified real release on *each* workflow (API and frontend) — keep both paths viable until this
migration is proven, then clean up.

If only the self-hosted *runner* itself is unhealthy (not the workflow logic) while a release is
in-flight, nothing about the existing automatic/manual rollback behavior changes: `release_script`
failing still triggers the artifact script's own internal rollback; a failed smoke test still
triggers `rad-rollback-api.sh`/the frontend rollback step, exactly as before this migration.

## What still needs a real, live verification (Phase E)

This implementation was built and syntax-checked in a sandboxed environment with no access to
the production VPS, GitHub Secrets, or GitHub Environment settings, and no SSH connectivity to
anything. That means:

- The workflow YAML has been validated for syntax (`python3 -c "import yaml; ..."` against all
  three files) and reviewed step-by-step for logic, but **has not been run end-to-end against
  the real VPS**.
- The `should-release`/`should-deploy` decision logic (the thing that was actually broken in the
  first version of this PR) was additionally checked by extracting its exact boolean logic into
  a standalone shell simulation and running it against every realistic caller context: a direct
  push to `main` (must not deploy), `workflow_call` from `deploy.yml` with only storefront
  affected, with both affected, and with neither (must not deploy), a manual
  `workflow_dispatch` with `confirm=deploy`/`operation=deploy`, and a manual
  `workflow_dispatch` left at its build-only default (must not deploy even though the
  `deploy_storefront`/`deploy_admin` checkboxes still default to true). All six produced the
  intended outcome. This is not the same as GitHub Actions actually evaluating the real `${{ }}`
  expressions, which still only happens on a real run.
- The SSH authentication fix above is written as exact one-time instructions because it
  **requires direct VPS/GitHub-admin access this session doesn't have** — generating a keypair
  and pretending it was installed would be fabricating success, which this was explicitly told
  not to do.
- Once the one-time setup above is done, the very next push to `main` that touches, say,
  `apps/api/**` is the real end-to-end test: watch the `Deploy (automatic, on push to main)` run
  in the Actions tab. If anything in the logic above doesn't match the real VPS's exact state,
  the failure will show up there, with the same loud `::error::` reporting described above — not
  as a silent partial deploy.
