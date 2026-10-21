# VPS release transport: GitHub-hosted runner + Tailscale + restricted SSH

Status: **VPS-side setup is done and verified working end to end for both
Environments; production release is still not activated.** The `rad-deploy`
account, entrypoint, shell, and sudoers rule described below are installed on
the real VPS and have been exercised against both `production-api-vps` and
`production-frontend-vps` (see §8) — real Tailscale OIDC, real SSH auth, real
forced command, real broker invocation, correctly rejected only by the
still-disabled activation gate. Nothing in this repository flips the
activation gate or merges/activates a real release — that remains a
deliberate, separate operator action.

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

- `rad-deploy` is a dedicated, non-root, SSH-only account with its password
  locked (no password authentication to this account at all - key-based
  only). Its login shell is **not** `/usr/sbin/nologin` -
  `nologin` ignores its arguments and refuses unconditionally, and OpenSSH's
  `command=` forced-command restriction works by re-invoking the account's
  *own login shell* as `<shell> -c "<forced command>"` (this is documented
  sshd behaviour, not an implementation detail of this design) - so with
  `nologin` as the shell, the forced command would **never actually run** and
  every deploy would fail. Instead, `rad-deploy`'s shell is a small,
  purpose-built restricted shell,
  [`scripts/production/rad-deploy-shell.sh`](../scripts/production/rad-deploy-shell.sh)
  (the same idea as `git-shell`): it accepts being invoked as exactly
  `-c /usr/local/libexec/rad-deploy-ssh-entrypoint.sh` and nothing else -
  no interactive shell, no other command, no extra arguments. This is
  deliberate defense-in-depth on top of the `authorized_keys` restriction
  below, not a replacement for it: if that restriction were ever accidentally
  dropped from the key, this shell alone would still only run the one fixed
  entrypoint.
- Its `authorized_keys` entry is pinned with `command=` (plus `restrict`,
  which implies `no-pty`, `no-port-forwarding`, `no-X11-forwarding`,
  `no-agent-forwarding`, `no-user-rc`) to one fixed script:
  [`scripts/production/rad-deploy-ssh-entrypoint.sh`](../scripts/production/rad-deploy-ssh-entrypoint.sh).
  `command=` overrides whatever command the SSH client asks for — the client's
  request only reaches the forced script as the `$SSH_ORIGINAL_COMMAND`
  environment variable, which the script treats as untrusted input and
  validates against one fixed grammar (`deploy kind=(api|frontend)
  commit=<40 hex> run_id=<int> run_attempt=<int>`) before using any part of it.
  There is no mode in which this key can run an arbitrary remote command.
- The entrypoint script is root-owned, mode `0750`, **group-owned by
  `rad-deploy`** (so the account can read+execute it but never write to it —
  root remains the only account that can modify it), and lives in a
  root-owned, non-group/world-writable directory (`/usr/local/libexec`, mode
  `0755`) so `rad-deploy` cannot delete or replace it either, even though it
  can't write the file itself.
- The entrypoint reads a **size-bounded** copy of its own stdin to a temp
  file, then hands it to
  [`scripts/production/rad_deploy_entrypoint.py`](../scripts/production/rad_deploy_entrypoint.py)
  for member-by-member validation *before* extracting anything: every member
  must be an ordinary regular file (no symlinks, hard links, directories,
  devices, or FIFOs), with one of exactly the expected flat names
  (`release.json`, `release.sigstore.json`, and `api-release.tar.gz` only for
  the API path), no duplicates, no path traversal, and under the broker's own
  per-file size caps — the whole upload is rejected, with nothing written to
  disk, if any member doesn't match exactly. Only after that does the fixed
  set of files land in a fresh `/var/lib/rad-release/incoming/release-*`
  directory — the exact convention the broker already expects. The entrypoint
  then builds the broker's JSON request from the *validated*
  `SSH_ORIGINAL_COMMAND` fields (never from anything else the client sent) and
  pipes it to `sudo -n /usr/local/sbin/rad-release` — **with no trailing
  argument**. (The `""` in `rad-deploy.sudoers` is sudoers' own syntax for
  "this command must be invoked with zero arguments"; it is not a literal
  argument to pass on the command line. Passing a literal empty-string
  argument there, which an earlier draft of this entrypoint did, would make
  both the sudoers argument-count match *and* `rad_release.py`'s own
  `len(sys.argv) == 1` check reject every single release attempt.) See
  [`scripts/test/test-rad-deploy-ssh.sh`](../scripts/test/test-rad-deploy-ssh.sh)
  for a regression test of this exact invocation shape.
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

## Testing this locally (no VPS, no root/sudo required)

```bash
python3 -B -m unittest discover -s scripts/production -p 'test_*.py'
bash scripts/test/test-rad-deploy-ssh.sh
```

The first covers `rad_deploy_entrypoint.py`'s tar validation (traversal,
symlinks, hard links, directories, FIFOs, duplicates, oversized/undersized
uploads, wrong kind, etc.) as pure unit tests. The second drives
`rad-deploy-shell.sh` and `rad-deploy-ssh-entrypoint.sh` together, using the
*exact* invocation shape OpenSSH's sshd actually uses for a `command=`
restriction (`<shell> -c "<forced command>"`), with a fake `sudo` on `PATH`
(same technique as `scripts/test/fake-systemctl.sh`) standing in for the real
privilege boundary so it can run as an ordinary user. It does not start a
real sshd — that is the one part of this design a disposable sshd instance
would otherwise be needed to prove, and isn't available in this environment.

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

Its shell is the restricted shell installed in step 2 below, not
`/usr/sbin/nologin` — see "Trust model" above for why `nologin` silently
breaks the forced command entirely.

```bash
useradd --system --create-home --home-dir /home/rad-deploy --user-group \
  --shell /usr/local/libexec/rad-deploy-shell.sh rad-deploy
install -m 700 -d -o rad-deploy -g rad-deploy /home/rad-deploy/.ssh
passwd -l rad-deploy   # lock the password outright: key-based auth only
echo "/usr/local/libexec/rad-deploy-shell.sh" >> /etc/shells
```

Separately, confirm `PasswordAuthentication no` is set in `/etc/ssh/sshd_config`
(global or at minimum via a `Match User rad-deploy` block) — a locked password
plus a restricted shell is strong, but password auth being disabled at the
sshd level entirely is what actually guarantees there is no other way into
this account.

### 2. Install the forced-command entrypoint, its Python validator, and the restricted shell

All three must be **root-owned and not writable by `rad-deploy`** — only
readable/executable by it (via the `rad-deploy` group), so the account that
is reachable over the network can run them but never modify them. The
containing directory must not be group/world-writable either, so
`rad-deploy` can't delete or replace them that way instead.

```bash
install -d -o root -g root -m 0755 /usr/local/libexec
install -o root -g rad-deploy -m 0750 scripts/production/rad-deploy-ssh-entrypoint.sh \
  /usr/local/libexec/rad-deploy-ssh-entrypoint.sh
install -o root -g rad-deploy -m 0640 scripts/production/rad_deploy_entrypoint.py \
  /usr/local/libexec/rad_deploy_entrypoint.py
install -o root -g rad-deploy -m 0750 scripts/production/rad-deploy-shell.sh \
  /usr/local/libexec/rad-deploy-shell.sh
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
restrict,command="/usr/local/libexec/rad-deploy-ssh-entrypoint.sh" ssh-ed25519 AAAA...REPLACE-WITH-rad-deploy-key.pub-CONTENTS... github-actions-rad-deploy
EOF
chown rad-deploy:rad-deploy /home/rad-deploy/.ssh/authorized_keys
chmod 600 /home/rad-deploy/.ssh/authorized_keys
```

Replace the `ssh-ed25519 AAAA...` portion with the exact contents of
`rad-deploy-key.pub`, keeping the `restrict,command="..."` prefix exactly as
shown. `restrict` (OpenSSH 7.2+) disables pty allocation, port/X11/agent
forwarding, and `~/.ssh/rc` execution in one keyword; `command=` is what
makes the key unable to do anything except invoke the one entrypoint script
regardless of what the connecting client asks for.

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

### 8. Tailscale OIDC grant for both Environments — CONFIRMED WORKING

Verified for real, against the actual Tailscale tenant and the actual VPS,
via [`verify-rad-deploy-ssh.yml`](../.github/workflows/verify-rad-deploy-ssh.yml)
(manual-dispatch, no production effect) run on main:

- **`production-api-vps`** ([run](https://github.com/mahdiyehnorouzi/RAD/actions/runs/39562354537)):
  Tailscale OIDC connected, SSH authenticated as `rad-deploy`, the forced
  command and tar validation ran, and the broker gave its own real response:
  `Release failed (RuntimeError): Host release approval missing: enabled` -
  the exact, expected rejection while `/etc/rad-release/activation.json`
  stays disabled.
- **`production-frontend-vps`**: first attempt
  ([run](https://github.com/mahdiyehnorouzi/RAD/actions/runs/39562354537))
  failed at the Tailscale OIDC token exchange itself (403 Unauthorized - the
  OAuth client's trust grant didn't yet cover this Environment's GitHub OIDC
  subject). After the operator broadened that trust credential in the
  Tailscale admin console, a re-run
  ([run](https://github.com/mahdiyehnorouzi/RAD/actions/runs/39563734814))
  succeeded identically to the API path: real Tailscale OIDC, real SSH auth,
  real forced command, and the same `Host release approval missing: enabled`
  broker rejection.

Both production Environments' full chain - OIDC trust, SSH authentication,
the forced command, tar validation, and the broker itself - are now
confirmed working against the real VPS. The only thing stopping a real
release is the activation gate, deliberately left disabled.

## Not done by this change

- No workflow here merges to `main`, flips `RAD_SELF_HOSTED_RELEASE_ENABLED`
  (removed outright — see "What stays exactly as reviewed" above), or touches
  `/etc/rad-release/activation.json`.
- The self-hosted runner registration on the VPS is left exactly as found:
  stopped and disabled. Nothing here re-registers, restarts, or re-enables it.
- No production secret, account, or sudoers rule is created, changed, or
  removed by anything in this repository — only by an operator following the
  numbered steps above, after review.
