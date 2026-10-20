# VPS release transport: GitHub-hosted runner + Tailscale + restricted SSH

Status: **code only, not installed, not activated.** This document and the
workflow changes it describes do not deploy anything, grant anything, or
change anything on the VPS by themselves. Everything under "VPS one-time
preparation" below is for a human operator to read, adapt if needed, and run
themselves after review — nothing in this repository executes it.

## Why this exists

[`self-hosted-production-release.md`](self-hosted-production-release.md) migrated
VPS releases onto a self-hosted GitHub Actions runner living on the production
host itself, specifically to avoid a GitHub-hosted runner having to reach the
VPS over the public internet (the previous SSH path's connection kept timing
out). That migration was reviewed in depth but explicitly left **not ready to
enable**: it has no verified runner-group scheduling restriction (so nothing
stops an unrelated workflow in this repository from being scheduled onto the
same self-hosted runner), and its cryptographic verification step couldn't be
exercised end-to-end in the review environment.

Per the current engineering request: **the self-hosted runner is stopped and
disabled, and stays that way.** Tailscale (already verified working — see
[the connectivity check](../.github/workflows/verify-rad-tailscale.yml) and its
[successful run](https://github.com/mahdiyehnorouzi/RAD/actions/runs/39503564430))
gives a GitHub-hosted `ubuntu-latest` runner a private, OIDC-authenticated path
to the VPS's Tailscale address, which removes the original reason for moving
execution onto the host in the first place. This document replaces the
self-hosted runner as the *transport* only:

- **Unchanged:** `ci.yml`, the artifact/image build and signing steps in
  `deploy-api-vps.yml` / `deploy-frontend-vps.yml`, API-first ordering in
  `deploy.yml`, and — most importantly — `scripts/production/rad_release.py`,
  the root-owned broker that does every privileged thing (manifest/signature
  verification, the atomic release, health checks, rollback, the transaction
  log, the `/etc/rad-release/activation.json` enable gate). None of that was
  reviewed under a self-hosted-runner assumption that this change breaks: the
  broker only ever received a staging directory name and a JSON request over
  stdin, run as root via one fixed sudoers rule. It does not care whether the
  process that invoked it is a self-hosted runner or an SSH session.
- **Changed:** how the signed release payload and the trigger reach the VPS.
  Previously: a self-hosted runner process on the VPS itself downloaded the
  GitHub Actions artifact directly. Now: a GitHub-hosted `ubuntu-latest`
  runner joins the tailnet (`tailscale/github-action@v4`, OIDC, `tag:rad-deploy`
  — no long-lived Tailscale credential in this repository) and reaches
  `100.103.104.79` over SSH as a brand-new, narrowly-restricted account,
  `rad-deploy`, whose key can run exactly one fixed command and nothing else.

## Trust model for the new `rad-deploy` SSH path

- `rad-deploy` is a dedicated, non-root, SSH-only account. It cannot log in
  interactively (no usable shell, no port/agent/X11 forwarding), and its
  `authorized_keys` entry is pinned with `command=` to one fixed script:
  [`scripts/production/rad-deploy-ssh-entrypoint.sh`](../scripts/production/rad-deploy-ssh-entrypoint.sh).
  `command=` overrides whatever command the SSH client asks for — the client's
  request only reaches the forced script as the `$SSH_ORIGINAL_COMMAND`
  environment variable, which the script treats as untrusted input and
  validates against one fixed grammar (`deploy kind=(api|frontend)
  commit=<40 hex> run_id=<int> run_attempt=<int>`) before using any part of it.
  There is no mode in which this key can run an arbitrary remote command.
- That entrypoint extracts a tar stream (the signed `release.json` +
  `release.sigstore.json`, plus `api-release.tar.gz` for the API path) from
  its own stdin into a fresh `/var/lib/rad-release/incoming/release-*`
  directory — the exact convention the broker already expects — rejecting
  anything other than the fixed, flat file set it validates by name. It then
  builds the broker's JSON request from the *validated* `SSH_ORIGINAL_COMMAND*
  fields (never from anything else the client sent) and pipes it to
  `sudo -n /usr/local/sbin/rad-release ""`, the exact same invocation the
  self-hosted-runner design used.
- The `rad-deploy` → root privilege boundary is the same narrow sudoers rule
  already reviewed for `rad-runner`
  ([`rad-runner.sudoers`](../scripts/production/rad-runner.sudoers)), now also
  granted to `rad-deploy` via
  [`rad-deploy.sudoers`](../scripts/production/rad-deploy.sudoers): no
  arguments accepted, so every invocation goes through the broker's stdin-JSON
  path; the separate `rollback <transaction>` argv mode stays sudoers-forbidden
  (reserved for a root operator typing it directly).
- The host key for `100.103.104.79` is pinned from a GitHub secret
  (`RAD_VPS_SSH_HOST_KEY`), not auto-accepted (`StrictHostKeyChecking=yes`).
  There is no separate unrestricted SSH key for this path — the old
  `RAD_API_SSH_PRIVATE_KEY` / `RAD_FRONTEND_SSH_PRIVATE_KEY` environment
  secrets (root@46.34.163.16, public IP, no forced command) predate this
  change and are **not reused**. See "Cleanup of the old SSH secrets" below.

## What stays exactly as reviewed

- Release activation gate: `/etc/rad-release/activation.json` on the VPS,
  root-owned and root-private. The broker refuses every release request until
  an operator has completed the prerequisites in
  [`self-hosted-production-release.md`](self-hosted-production-release.md#5-production-prerequisites--do-not-execute-without-approval)
  (minus the runner-group scheduling step, which no longer applies — nothing
  schedules onto the VPS as a runner anymore) and set `enabled: true` there.
  This repository no longer has any separate "is VPS release enabled"
  repository variable: with the self-hosted gate removed, the **only** switch
  left is that root-private host file, and a release attempt against a host
  that hasn't completed activation now **fails the workflow with the broker's
  own rejection message** — it is never silently skipped, which was flagged
  as a requirement for this change.
- Attestation/signature verification, manifest/run-identity binding, API-first
  ordering, atomic symlink swap, health polling, and automatic rollback: all
  unchanged, all inside `rad_release.py`.

## VPS one-time preparation — for an operator to review and run, not executed here

Everything below assumes the host prerequisites in
[`self-hosted-production-release.md`](self-hosted-production-release.md) that
are *not* runner-specific are already satisfied (broker installed at
`/usr/local/sbin/rad-release`, `/var/lib/rad-release` laid out, GHCR pull auth
in place, etc.). If the broker has not been installed at all yet, do that
first using that document's "Install reviewed helper files" section — it is
unchanged by this document.

### 1. Create the restricted `rad-deploy` account

```bash
useradd --system --create-home --home-dir /home/rad-deploy --shell /usr/sbin/nologin rad-deploy
install -m 700 -d -o rad-deploy -g rad-deploy /home/rad-deploy/.ssh
```

### 2. Install the forced-command entrypoint (root-owned, not writable by rad-deploy)

```bash
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g root -m 0750 scripts/production/rad-deploy-ssh-entrypoint.sh \
  /usr/local/libexec/rad-deploy-ssh-entrypoint.sh
```

### 3. Grant the same narrow sudo rule already reviewed for `rad-runner`

```bash
visudo -cf scripts/production/rad-deploy.sudoers
install -o root -g root -m 0440 scripts/production/rad-deploy.sudoers /etc/sudoers.d/rad-deploy
visudo -cf /etc/sudoers.d/rad-deploy
```

### 4. Generate the deploy keypair (on your own machine, not the VPS) and install the public half

```bash
ssh-keygen -t ed25519 -C "github-actions-rad-deploy" -N "" -f rad-deploy-key
```

On the VPS:

```bash
cat <<'EOF' > /home/rad-deploy/.ssh/authorized_keys
command="/usr/local/libexec/rad-deploy-ssh-entrypoint.sh",no-pty,no-agent-forwarding,no-X11-forwarding,no-port-forwarding,no-user-rc,restrict ssh-ed25519 AAAA...REPLACE-WITH-rad-deploy-key.pub-CONTENTS... github-actions-rad-deploy
EOF
chown rad-deploy:rad-deploy /home/rad-deploy/.ssh/authorized_keys
chmod 600 /home/rad-deploy/.ssh/authorized_keys
```

Replace the `ssh-ed25519 AAAA...` portion with the exact contents of
`rad-deploy-key.pub`, keeping the `command="..."` prefix and all the `no-*`
options exactly as shown — those are what make the key unable to do anything
except invoke the one entrypoint script.

### 5. Pin the host key

From any machine already on the tailnet (or from the VPS itself):

```bash
ssh-keyscan -t ed25519 100.103.104.79
```

Take the key field (third column) from that output — this is the value for
the `RAD_VPS_SSH_HOST_KEY` secret below (format: `<key-type> <base64-key>`,
e.g. `ssh-ed25519 AAAA...`).

### 6. Add the GitHub repository/environment secrets (run yourself — not something this session does)

```bash
gh secret set RAD_DEPLOY_SSH_PRIVATE_KEY --env production-api-vps --repo mahdiyehnorouzi/RAD < rad-deploy-key
gh secret set RAD_DEPLOY_SSH_PRIVATE_KEY --env production-frontend-vps --repo mahdiyehnorouzi/RAD < rad-deploy-key
gh secret set RAD_VPS_SSH_HOST_KEY --env production-api-vps --repo mahdiyehnorouzi/RAD --body "ssh-ed25519 AAAA...<from step 5>"
gh secret set RAD_VPS_SSH_HOST_KEY --env production-frontend-vps --repo mahdiyehnorouzi/RAD --body "ssh-ed25519 AAAA...<from step 5>"
```

Then delete `rad-deploy-key` (the private key file) from wherever you
generated it — it only needs to exist in the two GitHub Environment secrets
above.

### 7. Cleanup of the old SSH secrets (recommended, your call)

`RAD_API_SSH_PRIVATE_KEY`, `RAD_API_SSH_KNOWN_HOSTS`,
`RAD_FRONTEND_SSH_PRIVATE_KEY`, and `RAD_FRONTEND_SSH_KNOWN_HOSTS` already
exist on the `production-api-vps` / `production-frontend-vps` environments
from before the self-hosted-runner migration. They are **not referenced by
any workflow in this repository anymore** (neither the self-hosted design nor
this one uses them) and, per what could be read from the workflow history
that provisioned them, they authenticated as `root@46.34.163.16` — a public
IP, unrestricted root key, no forced command. Nothing in this repository will
read or delete them. Recommended: once the `rad-deploy` path above is
confirmed working, remove those four secrets and revoke/rotate the
corresponding key on the VPS (`authorized_keys` for whichever account that
old key logged into), since an unused unrestricted root key sitting in
secrets storage is pure residual risk with no corresponding benefit anymore.

### 8. Confirm the Tailscale OIDC grant covers both GitHub Environments — true blocker if not verified

`TS_OAUTH_CLIENT_ID` / `TS_AUDIENCE` are plain repository secrets (not scoped
to an Environment), and the already-verified connectivity run used no
`environment:` at all beyond `production-api-vps` for its own job. This
repository's two release jobs run under **two different** GitHub Environments
(`production-api-vps`, `production-frontend-vps`), which GitHub's OIDC token
expresses as two different `environment:` claims in the token subject. If the
Tailscale admin console's OAuth client grant for `TS_OAUTH_CLIENT_ID` is scoped
to accept only one specific subject pattern (for example one that names
`environment:production-api-vps` explicitly, rather than matching the
repository generally), the frontend release job will fail to authenticate to
Tailscale even with every other step correct.

**This needs manual confirmation in the Tailscale admin console** (OAuth
clients → the client behind `TS_OAUTH_CLIENT_ID` → its grant's subject
condition) before relying on this for the frontend path — it cannot be
verified from this repository or from a workflow run.

## Not done by this change

- No workflow here merges to `main`, flips `RAD_SELF_HOSTED_RELEASE_ENABLED`
  (removed outright — see "What stays exactly as reviewed" above), or touches
  `/etc/rad-release/activation.json`.
- The self-hosted runner registration on the VPS is left exactly as found:
  stopped and disabled. Nothing here re-registers, restarts, or re-enables it.
- No production secret, account, or sudoers rule is created, changed, or
  removed by anything in this repository — only by an operator following the
  numbered steps above, after review.
