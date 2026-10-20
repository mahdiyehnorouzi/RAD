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

### 1. Fix SSH authentication (`Permission denied (publickey,password)`)

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
host.

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

## What still needs a real, live verification (Phase E)

This implementation was built and syntax-checked in a sandboxed environment with no access to
the production VPS, GitHub Secrets, or GitHub Environment settings, and no SSH connectivity to
anything. That means:

- The workflow YAML has been validated for syntax and reviewed step-by-step for logic, but **has
  not been run end-to-end against the real VPS**.
- The SSH authentication fix above is written as exact one-time instructions because it
  **requires direct VPS/GitHub-admin access this session doesn't have** — generating a keypair
  and pretending it was installed would be fabricating success, which this was explicitly told
  not to do.
- Once the one-time setup above is done, the very next push to `main` that touches, say,
  `apps/api/**` is the real end-to-end test: watch the `Deploy (automatic, on push to main)` run
  in the Actions tab. If anything in the logic above doesn't match the real VPS's exact state,
  the failure will show up there, with the same loud `::error::` reporting described above — not
  as a silent partial deploy.
