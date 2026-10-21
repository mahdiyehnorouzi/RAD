> **Superseded as the release transport.** The self-hosted runner this
> document migrates releases onto is stopped and disabled, and stays that
> way — see [`vps-tailscale-ssh-deploy.md`](vps-tailscale-ssh-deploy.md) for
> the transport actually wired into `deploy-api-vps.yml` /
> `deploy-frontend-vps.yml` now (GitHub-hosted runner + Tailscale + a
> narrowly-restricted SSH account). Everything in this document about the
> release/health-check/rollback broker itself
> (`scripts/production/rad_release.py`) is unchanged and still accurate — only
> "runs on a self-hosted runner on the VPS" is replaced by "reached over SSH
> from a GitHub-hosted runner." Read this document for the broker's trust
> model and the VPS prerequisites that are not runner-specific; read the
> other one for how the VPS is actually reached today.

# Self-hosted production release migration — review and operations

Status: gated implementation authorized for Draft PR review; **not deployed, merged, or host-configured**.
The feature requires both `RAD_SELF_HOSTED_RELEASE_ENABLED=true` and a separately
installed root-private host activation policy. Merging code or setting a GitHub
variable alone cannot grant production release authority.
An unexpected skipped requested release fails the workflow; it never reports a
successful deployment. Complete the prerequisites below before enabling it.

## 1. Workspace, branch, and recovery evidence

Inspected `/workspace/RAD`, initially clean on branch `work`, at
`3f9d900d61a20fc18757c4198e313674286a9178` (also the fetched `origin/main`).
Created `feat/self-hosted-production-release` from that exact `origin/main`.
This is an isolated cloud checkout, not `/Users/mahdiyeh/Projects/RAD`.

Inspected `git status`, branches, `git worktree list`, reflog, `.claude/launch.json`,
all published branch refs (fetched read-only), and reachable history filenames.
Only this cloud worktree exists here. The published Claude performance branch
`6e2ea9d3` is accessible, but neither its history nor other published refs contain
`rad-release-api.sh`, `rad-rollback-api.sh`, or `rad-release-frontend.sh`.
The `.claude` directory here contains launch configuration, not recoverable edits.
Claude's reported nine-file migration **was not recovered**. Mac-only worktrees,
uncommitted files, deleted/unpublished refs, and the interrupted session filesystem
remain inaccessible. The user was informed before this replacement was implemented.
No existing user changes, branches, worktrees, or unrelated files were discarded.

## 2. Problems found in the existing path

- Both release jobs used GitHub-hosted runners plus inbound SSH. The reported
  connection timeout is consistent with a transport failure, not evidence of a bad
  key. No SSH/firewall configuration was changed or weakened.
- API arbitrary historical `commit_sha` dispatch could check CI for one SHA while
  building another. The new path requires the workflow source, checkout, manifest,
  and requested commit to match, and checks the main tip before building.
- Frontend rollback appeared **before** the public smoke-test step. A later smoke
  failure could not cause an earlier skipped rollback step to run retroactively.
- Frontend rollback used mutable tags and even `latest` fallback, and successful
  releases overwrote both services' history even when only one was affected.
- Frontend images were built twice through overlapping push/reusable triggers.
- Existing remote archive extraction assumed trusted root execution and did not
  provide a safe privilege boundary for an unprivileged production runner.
- Existing `start-production.mjs` invokes schema/staff initialization (and optional
  seed). It is unsuitable for the no-migration/no-seed release boundary here.
- Labels, main-only conditions, and Environments alone do not prevent a different
  workflow in the same public repository from scheduling a self-hosted job.

## 3. Files and implementation

| Path | Change |
| --- | --- |
| `.github/workflows/deploy.yml` | Preserve dependency-aware detection and API-first order; no inherited production secrets; explicit token scopes; detect broker changes; reject cancelled/failed detection |
| `.github/workflows/deploy-api-vps.yml` | Hosted artifact build and attested manifest, same-run download, minimal self-hosted release job, no SSH/checkout/build on VPS |
| `.github/workflows/deploy-frontend-vps.yml` | Build selected services once, attest immutable GHCR digests, release selected services without SSH |
| `.github/workflows/ci.yml` | Hosted broker regression and workflow-policy checks required by `ci-passed` |
| `.github/actionlint.yaml` | Declare the custom `rad-production` label for linting; does not assign a runner label |
| `scripts/production/package-api.sh` | Retain complete workspace/runtime packaging, normalize hard links into regular archive files |
| `scripts/production/make-manifest.py` | Bind source SHA, run/attempt, archive SHA256/version or selected image digests |
| `scripts/production/rad_release.py` | Installed privileged verifier, fixed release operations, locking, health checks, audit transactions, rollback |
| `scripts/production/rad-release` | Root-owned Python isolated-mode launcher |
| `scripts/production/rad-runner.sudoers` | Exact no-argument launcher permission, no shell/Docker/systemctl/general sudo grant |
| `scripts/production/test_rad_release.py` | Local isolated policy, extraction, failure and rollback regression tests |
| `docs/cicd-pipeline.md` | Point readers to this replacement path; retain historical SSH documentation |

## 4. Trust and privilege model

Builds/tests run on `ubuntu-latest` with Node 22. Production release jobs require
all of: the exact repository, `refs/heads/main`, push/manual event, successful
checks/build, explicit selected services/confirmation, the GitHub enable setting,
and a separate root-owned activation policy enforced by the installed broker.
The self-hosted runner selectors are `[self-hosted, Linux, X64, rad-production]`.
**Runner name is not a custom label**: verify that label exists before enabling.
Dispatch from a branch/tag, arbitrary historical SHA, PR event, or an untrusted
reusable caller cannot use these release jobs. Older emergency releases use the
root operator rollback procedure, not unchecked dispatch inputs.

The build uploads an immutable artifact within the current workflow run/attempt.
No cross-run artifact IDs, workflow-run triggering, user-selected image tags, or
checkout content enter the release job. Actions in the new release path are pinned
to full upstream commits. Production secrets are not inherited by build jobs;
`github.token` is used only for scoped GitHub/GHCR operations. Put production
credentials in production Environments/host files, never repository-wide secrets.

`actions/attest-build-provenance` signs `release.json`. That signed subject binds
all API bytes by SHA256 or all selected image bytes by GHCR digest. The installed
root broker copies incoming files to root-private staging through no-follow file
descriptors, then independently runs modern `gh attestation verify` with:

- exact repository and reusable signer workflow path;
- `--source-ref refs/heads/main`, `--source-digest <exact SHA>`, and the same `--signer-digest`;
- `--deny-self-hosted-runners`;
- the signed bundle and the copied manifest as subject.

Checksums alone are not authentication. A changed manifest/bundle/archive,
incorrect source, forged or self-hosted signature, wrong image namespace, mutable
reference, invalid run identity, or replay fails closed before activation.
Root-maintained run/attempt high-water marks reject stale/out-of-order attempts
per deployment kind, including already failed attempts. Rerun the **whole workflow**
so checks/build/signing run again with a fresh attempt; do not rerun only the failed
release job against old-attempt artifacts.

Only the installed, reviewed broker is allowed through sudo. It does not import,
source, or execute repository files as root. Archives permit contained workspace
symlinks but reject traversal, hard links, devices, FIFOs, duplicate paths,
symlink-parent writes and escaping link chains. File counts and compressed/expanded
sizes are bounded. Files are root-owned and not group/world writable; application
code executes only as the separate non-root systemd user. No shell evaluation is
used for broker subprocess arguments. Docker and systemctl targets are fixed.
Runner-supplied paths, commands, Compose definitions, service names and env values
are never accepted as privileged instructions.

Requests are size/time bounded before locking; a concurrent broker invocation fails
immediately instead of accumulating privileged waiters. The host broker's `flock` spans verification, activation, smoke checks, recording
and rollback for both API/frontend. GitHub also serializes production release jobs
with `rad-production-release`, and the orchestrator retains `rad-deploy-main`.
`cancel-in-progress` is false. SIGTERM/SIGINT during activation enter rollback;
SIGKILL/power loss needs protected transaction recovery. GitHub concurrency is not
FIFO and can replace a pending run; the host high-water mark prevents a late older
attempt overwriting a newer attempt. This is service release serialization, not a
cross-service database transaction; a healthy API is not reverted merely because
a later frontend release fails.

## 5. Production prerequisites — do not execute without approval

No production access or configuration was assumed or exercised. These are commands
for a human operator to review after the code review, **not commands run by Codex**.
Do not reinstall/re-register/restart the existing runner or add it to Docker/sudo
administrative groups.

### Scheduling policy is a hard prerequisite

Before enabling, enforce a platform-level runner restriction allowing **only**
these release workflows from their reviewed main refs. Where supported, use an
organization runner group with selected-workflow restrictions for:

```
mahdiyehnorouzi/RAD/.github/workflows/deploy-api-vps.yml@refs/heads/main
mahdiyehnorouzi/RAD/.github/workflows/deploy-frontend-vps.yml@refs/heads/main
```

Configure the group to deny all other workflows/repositories and verify reusable
workflow eligibility with GitHub's runner-group policy. Repository-level runners
on personal repositories generally cannot enforce that selected-workflow policy.
If that applies, **do not enable this same-host runner architecture**: obtain a
supported restricted group or move execution into a dedicated isolated release
machine/VM with an independently authenticated production broker. Do not rely on
labels, YAML `if`, fork-approval settings, or Environment approval to protect the
host from arbitrary runner scheduling. This scheduling restriction is not configured
by these files. An ephemeral runner on the production host alone still shares the
host network/kernel and is insufficient isolation.

Require branch protection/CODEOWNERS review of `.github/workflows/**`,
`scripts/production/**`, and production deployment configuration. Disallow unreviewed
workflow changes, protect main, and restrict both `production-api-vps` and
`production-frontend-vps` to main. Keep existing reviewers/protections; do not remove
reviews to make deployment automatic. If reviews are required, releases wait for
those reviews as designed. Verify actual settings in GitHub; they were not readable
through the cloud Git proxy. Runner policy must also cover internal branch workflows,
not only external fork PRs.

### Read-only host inventory

```bash
id rad-runner
sudo -l -U rad-runner
systemctl is-active actions.runner.mahdiyehnorouzi-RAD.rad-production.service
# Every property api_preflight() in rad_release.py actually checks before it
# will release - not a subset. SupplementaryGroups, Type, KillMode,
# ExecStartPre/Post/Condition, and Environment were missing from an earlier
# version of this inventory command; a passing release attempt is the only
# other way these get checked, which is not something to find out from a
# production deploy.
systemctl show rad-api.service -p User -p Group -p SupplementaryGroups \
  -p WorkingDirectory -p ExecStart -p Type -p KillMode \
  -p ExecStartPre -p ExecStartPost -p ExecCondition -p Environment \
  -p EnvironmentFiles -p NoNewPrivileges -p CapabilityBoundingSet -p AmbientCapabilities
getent group docker sudo root | grep -F "$(systemctl show rad-api.service -p User --value)" || true
readlink -f /opt/rad/apps/api
stat -c '%U:%G %a %n' /opt/rad-releases /opt/rad/apps /etc/rad/api.env \
  /root/rad-frontend-deploy/docker-compose.frontend-vps.yml
/usr/bin/node --version
python3 -c 'import sys; assert sys.version_info >= (3, 11)'
uname -m
/usr/local/bin/gh attestation verify --help
docker inspect -f '{{.Name}} {{.Config.Image}} {{.Image}} {{.State.Health.Status}}' \
  rad-storefront rad-admin
```

Do not print environment contents, credential files, `docker compose config`, or
whole service environment properties to CI/chat. Inventory the names/presence and
host access permissions only. The broker captures Compose output privately and
never prints it, because it includes resolved production env values.

### Install reviewed helper files (root operator, after approval)

Transfer a reviewed copy to `/root/rad-reviewed-release`; do not install privileged
scripts from the runner workspace. Use Python 3.11+, Node 22+ at `/usr/bin/node`,
and a maintained GitHub CLI supporting all verifier flags at `/usr/local/bin/gh`.
The local validation used checksum-verified CLI 2.83.2; install a reviewed supported
version from official GitHub CLI releases with its published checksum/signature.
Do not disable TLS/checksum verification. `gh` and all parent directories must be
root-owned, non-symlinked and not group/world writable.

```bash
cd /root/rad-reviewed-release
install -d -o root -g root -m 0755 /usr/local/libexec /usr/local/sbin
install -o root -g root -m 0755 scripts/production/rad_release.py /usr/local/libexec/rad-release.py
install -o root -g root -m 0755 scripts/production/rad-release /usr/local/sbin/rad-release
install -d -o root -g root -m 0711 /var/lib/rad-release
install -d -o root -g root -m 0700 /var/lib/rad-release/transactions
install -d -o root -g rad-runner -m 0730 /var/lib/rad-release/incoming
visudo -cf scripts/production/rad-runner.sudoers
install -o root -g root -m 0440 scripts/production/rad-runner.sudoers /etc/sudoers.d/rad-release
visudo -cf /etc/sudoers.d/rad-release
```

All helper/state paths and ancestors must be root-owned/non-writable by runner or
application users. Incoming staging is the sole group-writable exception, and
files there are untrusted data. Review existing sudo rules for `rad-runner` and the
API account; this narrow rule does not revoke any unsafe pre-existing permissions.

### Separate host activation approval (disabled by default)

The installed broker refuses every runner-requested deployment unless
`/etc/rad-release/activation.json` is root-owned, root-private (0600), and all its
ancestors are root-owned and not group/world writable. It requires explicit
approval for runner workflow scheduling policy, production Environment restrictions,
host preflight and a nonproduction rehearsal. It also pins the installed broker's
SHA256: updating privileged code invalidates previous host approval. Manual
root-only rollback remains available when release activation is disabled.

After the helper install, the operator can prepare a **disabled** candidate in the
review directory (these are review commands, not commands executed by Codex):

```bash
cd /root/rad-reviewed-release
python3 - <<'PY_POLICY'
import hashlib, json
from pathlib import Path
broker = Path('/usr/local/libexec/rad-release.py')
with broker.open('rb') as source:
    digest = hashlib.file_digest(source, 'sha256').hexdigest()
policy = dict(schema=1, repository='mahdiyehnorouzi/RAD', broker_sha256=digest,
              enabled=False, runner_workflow_policy_verified=False,
              production_environments_verified=False, host_preflight_verified=False,
              nonproduction_rehearsal_verified=False)
with Path('reviewed-activation.json').open('x') as output:
    output.write(json.dumps(policy, indent=2) + '\n')
PY_POLICY
install -d -o root -g root -m 0700 /etc/rad-release
if test -e /etc/rad-release/activation.json || test -L /etc/rad-release/activation.json; then
  echo 'Existing host policy: preserve it and review separately; not overwriting.' >&2
else
  install -o root -g root -m 0600 reviewed-activation.json /etc/rad-release/activation.json
fi
```

**This candidate cannot activate deployments.** Only after independently verifying
each prerequisite and receiving production authorization may the root operator
change its corresponding approvals and `enabled` to true, review the final file,
and install it with the same root-owned permissions. No workflow, repository
variable, build artifact or runner-writable path supplies these approvals.
Do not overwrite an already-existing host policy blindly; preserve and review it.
Actual scheduling and Environment settings cannot be inferred from this file:
the root operator must verify them in GitHub before approving it.

### Review API service compatibility separately

The broker refuses root/runner API users, privileged groups, startup hooks, inline
Environment overrides, unexpected EnvironmentFiles/WorkingDirectory, or a start
command invoking the legacy schema/seed wrapper. It requires explicit
`NODE_ENV=production` and `TYPEORM_SYNCHRONIZE=false` in the existing env file,
no capabilities, NoNewPrivileges, a simple/exec service type, and control-group termination. It will **not** edit env values to meet these
requirements. Missing settings are a blocker for a separately approved host change.

If needed, prepare this drop-in for operator review. Verify `rad-api` is an existing,
separate unprivileged service account and has precisely the runtime file access it
needs; substitute the actual reviewed account, not `rad-runner`. Do not recursively
chown code to it or grant root/Docker permissions. Creating/changing users and
applying this drop-in require separate production authorization.

```ini
# /etc/systemd/system/rad-api.service.d/20-reviewed-runtime.conf
[Service]
User=rad-api
Group=rad-api
WorkingDirectory=/opt/rad/apps/api
ExecStart=
ExecStart=/usr/bin/node dist/main.js
ExecStartPre=
ExecStartPost=
ExecCondition=
NoNewPrivileges=true
CapabilityBoundingSet=
AmbientCapabilities=
```

This draft does not override EnvironmentFile or production credentials. Do not
blindly apply it: confirm the full merged unit, existing inline environment,
capabilities, hooks, and account/group permissions first. After explicit approval,
the operator applies the approved drop-in with `systemctl daemon-reload`; a service
restart is a separate authorized maintenance operation. No such operation was
performed here. Validate previous release compatibility before enabling rollback.
The API application's own existing startup hooks still run; the broker introduces
no SQL, migration, schema-sync, seed or staff-bootstrap command.

### Verify frontend and supply-chain prerequisites

Keep `/root/rad-frontend-deploy` and its existing Compose/env files. Do not copy the
repository Compose file over production blindly. The broker adds a root-private
image-only Compose override and checks the existing project owns each target
container. It requires already-healthy containers; there is no first-install or
`latest` rollback fallback. Keep root's existing read-only GHCR pull authentication
outside the runner, with access only to these image repositories. No registry
credential is sent from CI to the privileged broker. No Docker group/socket access
is granted to the runner.

GitHub artifact attestations must be available for this repository/plan (private
repository support may require GitHub Enterprise Cloud). Hosted build jobs need
`id-token: write` and `attestations: write`. Confirm Sigstore/GitHub trust-root
access, GitHub Actions artifact access, and GHCR access. Depending on public/private
attestation support, outbound trust services include GitHub's documented Actions
endpoints and Sigstore TUF endpoints, as well as `ghcr.io` and its blob endpoints.
Use only supported TLS/trust configuration; attestation failure is a blocker, never
a reason to bypass authentication. Bundle verification does not detect repository
renames/name reuse; re-review trust configuration after an ownership/name change.

Review host free space: the broker limits input tarballs to 2 GiB and expanded
archives to 4 GiB but does not automatically delete old releases, image IDs,
transaction manifests, or env snapshots. Preserve previous versions until retention
is explicitly reviewed. Do not run Docker image prune or legacy deploy/rollback
scripts concurrently with this path; those legacy tools do not acquire this lock.

Only after all of the above and an approved nonproduction rehearsal: assign/verify
the custom runner label in GitHub, retain Environment restrictions, and explicitly
approve and install the root-private activation policy, then set repository
variable `RAD_SELF_HOSTED_RELEASE_ENABLED=true`. Both actions require explicit
production authorization and neither has been done here. A missing, disabled,
incorrectly permissioned or broker-hash-mismatched host policy blocks activation
even if that GitHub variable already exists with value true.

## 6. Deployment and rollback procedure

1. Review/approve this branch, host helper, scheduling restrictions and prerequisites.
   Commit/push/Draft PR publication is explicitly authorized with the fail-closed
   host gate retained. Remaining verification blocks production activation, not
   Draft PR publication. No merge, production settings change or deployment is authorized.
2. After an authorized merge to main, CI and dependency-aware change detection run.
   API artifacts build/sign off-VPS, then the release job consumes that same run's
   artifact. Frontend builds/releases follow only if the required API release
   succeeded. Docs-only pushes do not deploy.
3. API: verify signature and checksum, preflight the service and healthy previous
   release, snapshot env without changing it, extract a new immutable release,
   atomically switch `/opt/rad/apps/api`, restart `rad-api.service`, validate local
   health/version/DB, then public health/session/catalog/media. No npm/git/build or
   database-management command runs on the production release path.
4. Frontend: verify signature and selected image digests; capture actual healthy
   running local image IDs; pull all selected digests before activation; recreate
   only selected services with `--no-deps --no-build --pull never`; verify expected
   image IDs and container health; check homepage/PLP/PDP (when discoverable),
   `/backend/session`, and/or admin login. Merge only selected healthy image history.
5. Any activation, local health or public smoke failure restores the previous
   release/image IDs and verifies health **and public smoke** on rollback. It then
   fails the workflow even if recovery succeeds. A rollback failure never reports
   the deployment successful; inspect protected host state immediately.
6. API env is never modified by deployment/rollback. Its pre-deploy snapshot/hash
   is retained. An unexpected concurrent env change stops automatic recovery for
   operator reconciliation, rather than overwriting credentials/configuration.
   Database migrations/data changes are not reversed by code rollback.

Root-only manual recovery after operator approval (select an actual transaction,
not this literal placeholder):

```bash
# Contains paths/digests/status only; never cat api.env.snapshot into logs.
ls /var/lib/rad-release/transactions
# Verify the chosen transaction's release.json/rollback.json locally as root.
# Not sudo-authorized for rad-runner; runs under the same broker lock.
/usr/local/sbin/rad-release rollback RUN_ID-ATTEMPT-api
# Or:
/usr/local/sbin/rad-release rollback RUN_ID-ATTEMPT-frontend
```

API manual rollback rejects a stale transaction whose target is no longer active.
Frontend rollback uses exact locally retained image IDs for that transaction's
selected services and does not pull mutable tags. The root operator must choose
an appropriate current transaction. The broker protects records and does not
accept arbitrary rollback paths from a runner. After a SIGKILL/power failure,
inspect the `attempting` state, current symlink/image IDs and transaction record
before deciding whether rollback is appropriate; automatic crash recovery is not
claimed. Update the installed helper only through a separate reviewed root action.

## 7. Local validation and limits

Validation is recorded below; no production commands were executed. Local Docker,
temporary fake systemd, and local PostgreSQL were used where applicable.

```bash
python3 -B -m unittest discover -s scripts/production -p 'test_*.py' -v
bash -n scripts/production/package-api.sh
sh -n scripts/production/rad-release
actionlint -shellcheck= .github/workflows/ci.yml .github/workflows/deploy.yml \
  .github/workflows/deploy-api-vps.yml .github/workflows/deploy-frontend-vps.yml
bash scripts/test/test-release-pipeline.sh
git diff --check
```

- Broker suite: 25 tests passed, including manifest/ref/run restrictions,
  exact digest namespaces, verifier fail-closed policy, replay, archive attacks,
  no-follow input copies, root-service rejection, checksum failure before
  activation, API restart/public-smoke rollback, partial frontend activation,
  frontend public-smoke rollback, unchanged sibling history and rollback failure.
- Existing isolated release-pipeline simulator: 16 checks passed.
- `actionlint` 1.7.7: all four edited workflows pass. Download checksum verified
  against the official release; CI pins the checksum. Shell syntax passes.
- Real API package: production dependencies pruned in a disposable copy outside
  the checkout; package built, securely extracted, and compiled API started with
  `TYPEORM_SYNCHRONIZE=false` against local PostgreSQL. The extracted runtime reported healthy database connectivity, version 1.5.1,
  production mode and 30 catalog products. Source dependencies were not
  pruned/modified. Normalizing the esbuild hard link avoids an unsafe extractor
  exception without permitting arbitrary archive hard links.
- The checksum-verified GitHub CLI could not initialize a live Sigstore verifier
  in this cloud sandbox, including after configuring writable cache paths. This
  The proxy rejects HTTPS CONNECT to both `tuf-repo.github.com` and
  `tuf-repo-cdn.sigstore.dev` with HTTP 403. This blocks authenticated live TUF
  refresh and successful verification of a valid signature. It is a security-critical
  activation-verification blocker in this environment, not a successful negative-signature test.
  No verification bypass or custom untrusted root was used.
- Cryptographic **acceptance of an actual new main build**, actual GitHub
  Environment/runner settings, host ownership/service compatibility, registry
  pulls, live systemd/Docker operations and live rollback are **not verified**.
  OIDC signing is only available in the trusted GitHub job after an approved push.
  Tests substitute host operations and do not establish production readiness.
- No new frontend image was built/published locally; existing Dockerfiles and
  application source were unchanged. Production image compatibility still needs
  the approved hosted build and nonproduction rehearsal.

## 8. Readiness assessment

Ready for engineering review and local validation of the migration code. **Not
ready to enable production deployment** until scheduling isolation, attestation
availability, root helper installation, service/runtime compatibility, immutable
rollback ownership, registry access and a nonproduction rehearsal are verified.
The existing runner registration/service, live services, production env/data,
SSH/firewall/DNS/Nginx configuration remain untouched. There is no claim of a
successful production deployment or recovered Mac-only work.

## 9. Git diff summary and remaining review

Five existing files changed: four GitHub workflows and the existing CI/CD guide.
Eight files added: the actionlint label configuration, this review/runbook, and six
production helper/test files. No application code, dependency declaration, lockfile,
production Compose definition, or production data/configuration was changed.
Changes are prepared on `feat/self-hosted-production-release` for an explicitly
authorized Draft PR. GitHub records the published commit and PR status. The accompanying patch includes new files as well
as tracked edits. Review the root broker and scheduling prerequisite together;
merging YAML alone does not establish a secure or operational production runner.

Re-audit: all 13 paths remain migration-specific. No private-key/token patterns,
credential literals, tracked file-mode changes, or changes to production Compose,
service/env files or application source were found. The host approval gate and
streamed archive limits were strengthened; the API caller no longer requests
unneeded `packages: write`.

`visudo` is unavailable in the cloud image, so sudoers validation remains an explicit
host-side prerequisite using the documented `visudo -cf` commands. The legacy
Cloudflare/Liara/tag workflows and emergency SSH scripts remain unchanged; do not
use them concurrently with the VPS broker or assume their locks are shared.


## 10. Pre-publication re-audit outcome

Production activation is **blocked**. The user subsequently authorized publishing
a safely gated Draft PR before Work-environment Sigstore access is restored.
Cryptographic verification will run on GitHub-hosted infrastructure; production
settings changes, merge and deployment still require explicit approval.

- All 13 paths were inspected and checked against an explicit migration file list:
  five modified files, eight new files, no unrelated changes. The full tracked
  diff (including removals) and new files passed credential-pattern scanning;
  manual inspection found no credential literals or accidental production config
  modifications. No source files are group/world writable or setuid/setgid.
- The root broker now requires a separate root-private activation policy,
  prerequisite approvals and the installed broker hash. Missing/disabled approvals
  reject runner-requested releases before privileged release operations. Root-only
  emergency rollback does not require an enabled deployment policy.
- Hosted CI/build and production token scopes were reviewed. CI remains hosted;
  release jobs have only contents/actions read, no checkout, no general sudo or
  Docker access, no production credentials inherited by builds. The API caller's
  unused package-write scope was removed. External runner/Environment policy is
  still **unverified**; a YAML label or approval variable is not evidence of it.
- Re-run results: **267 application tests passed**, **25 broker tests passed**,
  **16 legacy simulator checks passed**. All four edited workflows passed
  actionlint; YAML parsing, 40 inline shell syntax checks, helper shell syntax,
  and `git diff --check` passed. The real extracted API artifact again ran against
  local PostgreSQL with schema sync disabled, reporting production mode, healthy
  database connectivity, the expected version and 30 products.
- Sigstore diagnosis: proxy `CONNECT` requests to both `tuf-repo.github.com` and
  `tuf-repo-cdn.sigstore.dev` fail with HTTP 403. The authentic CLI cannot refresh
  its authenticated TUF trust data. Successful verification of a valid signature,
  and actual cryptographic rejection of tampered/unsigned subjects, are therefore
  **not demonstrated**. Unit checksum/policy tests and an initialization failure
  are not substitutes. No trust-root replacement, expiry override, TLS exception
  or signature-verification bypass was introduced.
- Required before activation: complete genuine positive/negative signature
  verification on GitHub-hosted infrastructure (or restore supported HTTPS access
  to the two official TUF endpoints here);
  obtain read-only confirmation of runner workflow restrictions and production
  Environment/main-branch restrictions (or resolve the same-host isolation issue).
  `visudo -cf` also remains a host prerequisite because no sudoers parser is
  installed in this cloud image. No production settings were changed or tested.
