# `rad-production` self-hosted runner — setup

This directory holds the files that must be installed **on the production VPS
(46.34.163.16) by someone with direct VPS/root access**, as part of migrating
the release stage of `deploy-api-vps.yml` / `deploy-frontend-vps.yml` off
GitHub-hosted runners (which need inbound SSH on port 22, currently blocked)
onto the existing self-hosted runner (`rad-production`, user `rad-runner`,
`/opt/actions-runner`, already registered and Idle).

None of this can be done from a CI workflow or from a coding session — it
needs direct VPS access and GitHub repository admin access. See
`docs/cicd-pipeline.md` for the full migration/rollback plan this supports.

## Why no inbound SSH is needed

The self-hosted runner already *is* a process running on the VPS. Instead of
a GitHub-hosted runner SSHing *in* to the VPS (which requires an open,
internet-reachable port 22), the runner's own agent makes an **outbound**
HTTPS long-poll connection to GitHub to pick up jobs — the same connection
model it already uses today to report Idle. The release job's steps then run
as **local** commands on the host the runner is already on. No port needs to
be opened; nothing changes about inbound firewall rules.

## 1. Runner identity and labels

The existing runner should already be registered; if its labels need
updating (Settings → Actions → Runners → rad-production → Labels), ensure it
carries:

```
self-hosted, rad-production
```

Both deploy workflows' `release` jobs target `runs-on: [self-hosted, rad-production]`
exactly — no other job in this repo uses that label, so no PR/CI job (which
only ever runs on `ubuntu-latest`) can ever be scheduled onto this runner.

**Recommended (requires a paid plan for repo-level runner groups, or an
org/enterprise account):** put this runner in a dedicated **runner group**
(Settings → Actions → Runner groups) restricted to:
- This repository only.
- "Allow specific workflows" → `.github/workflows/deploy-api-vps.yml`,
  `.github/workflows/deploy-frontend-vps.yml` only.

This is defense in depth on top of the label match and the GitHub
Environment restriction below — even a future workflow that accidentally
typos the right label can't land a job on this runner unless it's also one
of the two explicitly allowed workflow files.

## 2. Create the unprivileged `rad-runner` service account (if not already dedicated)

The runner service must run as a low-privilege user, **not** root, and must
**not** be a member of the `docker` group (membership there is
root-equivalent — it grants full host control via the Docker API). If the
existing `rad-runner` account doesn't already meet this:

```bash
# As root on the VPS:
id rad-runner || useradd --system --create-home --shell /usr/sbin/nologin rad-runner
gpasswd -d rad-runner docker 2>/dev/null || true   # ensure NOT in the docker group
groups rad-runner                                   # confirm: no docker, no sudo group
```

Re-register/restart the runner service under this user if it currently runs
as root or as a `docker`-group member — check
`/opt/actions-runner/.service` or `systemctl cat actions.runner.*` for the
current `User=`.

## 3. Install the three wrapper scripts

```bash
# As root, from a checkout of this repo (or copy these three files over):
install -o root -g rad-runner -m 0750 infra/rad-production-runner/rad-release-api.sh      /usr/local/bin/rad-release-api.sh
install -o root -g rad-runner -m 0750 infra/rad-production-runner/rad-rollback-api.sh     /usr/local/bin/rad-rollback-api.sh
install -o root -g rad-runner -m 0750 infra/rad-production-runner/rad-release-frontend.sh /usr/local/bin/rad-release-frontend.sh
```

Mode `0750` + group `rad-runner`: the runner account can execute (via sudo,
see next step) but never read-write-modify these scripts itself — only root
can edit them. This closes the obvious hole of "a wrapper script meant to
limit a low-privilege account, but which that same account can overwrite".

## 4. Install the sudoers rule

```bash
visudo -cf infra/rad-production-runner/rad-runner.sudoers   # validate first
install -o root -g root -m 0440 infra/rad-production-runner/rad-runner.sudoers /etc/sudoers.d/rad-runner
visudo -c   # validate the whole sudoers tree after installing
```

This is the entire privilege rad-runner ever gets: three fixed scripts, no
arguments beyond what each script itself validates, no shell, no other
command.

## 5. Pin the release scripts themselves at a root-owned path

The wrapper scripts exec `/opt/rad-releases/.bin/deploy-api-remote-artifact.sh`
and `/opt/rad-releases/.bin/rollback-api-remote.sh` — NOT a path inside the
runner's own (rad-runner-writable) workspace checkout. This matters: if the
wrapper instead executed a script from the git workspace the runner just
checked out, a compromised GitHub Actions job (or a future accidental change
to what that job checks out) could smuggle in a modified release script that
then runs as root. Pinning them outside the workspace, owned by root,
world-non-writable, is what keeps "root only ever runs code root already
reviewed and installed" true regardless of what the CI job's checkout
contains.

```bash
mkdir -p /opt/rad-releases/.bin
install -o root -g root -m 0750 scripts/lib/deploy-api-remote-artifact.sh /opt/rad-releases/.bin/deploy-api-remote-artifact.sh
install -o root -g root -m 0750 scripts/lib/rollback-api-remote.sh        /opt/rad-releases/.bin/rollback-api-remote.sh
```

**Update procedure:** whenever either script changes in the repo (reviewed
and merged like any other code change), a human with VPS root access
re-runs the two `install` commands above. This is intentionally a manual,
reviewed step — the automated release pipeline must never be able to
silently update the privileged code it itself runs as root.

## 6. Create the staging directory the API wrapper reads from

```bash
mkdir -p /opt/rad-releases/.incoming
chown rad-runner:rad-runner /opt/rad-releases/.incoming
chmod 0750 /opt/rad-releases/.incoming
```

The CI job downloads the GitHub Actions artifact into this directory as the
unprivileged `rad-runner` user; `rad-release-api.sh` (run as root via sudo)
refuses to touch anything outside it.

## 7. GHCR pull credentials for the frontend release (read-only, scoped)

The frontend release job needs to `docker pull` from GHCR as the `rad-runner`
account (unprivileged — but `docker pull`/`docker compose pull` DOES need
Docker CLI access; the design choice here is to let `rad-runner` run
`docker pull`/`docker compose pull` directly — read-only registry
operations, no socket-level container-management capability beyond that
granted by being in a minimal, pull-only context) **or**, preferably, to run
`pull`/`up` only through the same `rad-release-frontend.sh` root wrapper so
`rad-runner` needs no Docker CLI access at all. The workflow below takes the
second approach — `rad-runner` never touches Docker directly; only the root
wrapper does, and only for the two fixed compose services.

Provision a GHCR **read-only** personal access token (classic PAT, scope
`read:packages` only — no `write:packages`, no `delete:packages`) or a fine-
grained token scoped to this repository's packages only, and store it where
root (not rad-runner) can read it, e.g.:

```bash
install -m 0600 -o root -g root /dev/stdin /root/.ghcr-pull-credentials <<'EOF'
GHCR_USER=<github-username-or-bot-account>
GHCR_TOKEN=<the read:packages-only token>
EOF
```

`rad-release-frontend.sh` (or a one-time `docker login` run as root during
setup, since GHCR credentials persist in root's own Docker config) uses this
to authenticate `docker pull` — this credential is never passed into, or
visible from, the CI job itself; the GitHub Actions workflow only ever
builds and pushes images using the already-scoped, repo-local
`GITHUB_TOKEN` (which already has `packages: write` for the build job and
no access to anything on the VPS).

```bash
# One-time, as root:
source /root/.ghcr-pull-credentials
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

## 8. GitHub Environments

Both `production-api-vps` and `production-frontend-vps` environments
(Settings → Environments) should have:
- **Deployment branches** → Selected branches → `main` only.
- No **Required reviewers** (keeps the automatic push-to-main path
  hands-off, per the existing design — see `docs/cicd-pipeline.md`).
- Confirm no environment secret named `RAD_API_SSH_PRIVATE_KEY` /
  `RAD_FRONTEND_SSH_PRIVATE_KEY` / `*_KNOWN_HOSTS` is still referenced
  anywhere after this migration — they are removed from both workflows by
  this change and should be deleted from
  **Settings → Secrets and variables → Actions** once this is live (a
  stale, unused secret is still a credential someone could leak).

## Rollback plan for this migration itself

If the self-hosted release path misbehaves after cutover, revert is a single
`git revert` of the workflow-file commit — the previous SSH-based
`deploy-api-vps.yml`/`deploy-frontend-vps.yml` still worked mechanically
(the only thing broken was GitHub-hosted runners' inbound SSH), so reverting
restores it exactly. Until the SSH secrets are deleted (step 8), that
revert does not require re-provisioning anything. Do not delete the SSH
keys/secrets until the self-hosted path has had at least one fully verified
real release on each workflow.
