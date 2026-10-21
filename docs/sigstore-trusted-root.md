# Offline Sigstore trust root for the release broker

Status: implemented, not yet installed on the VPS. The broker code and tests
are in this PR; the actual `/etc/rad-release/trusted_root.jsonl` file and its
hash in `activation.json` still need a root operator to install them.

## The problem

`scripts/production/rad_release.py`'s `verify_manifest()` calls
`gh attestation verify` to check every release's signed provenance before the
broker will touch anything. By default this fetches live TUF trust metadata
from `tuf-repo-cdn.sigstore.dev`. On the production VPS, that specific CDN
returns **HTTP 403**, while GitHub's own TUF endpoint returns 200.

This was diagnosed on the VPS itself, not assumed:
- `iptables` `OUTPUT` chain policy is `ACCEPT`.
- `ufw` allows outgoing traffic.
- No proxy environment variables are set, and `--noproxy '*'` makes no
  difference.
- DNS resolves the CDN correctly (`34.117.62.14` at time of writing).

So the block is **upstream of this host** (most likely the CDN/Fastly
blocking requests from this VPS provider's IP range) — not something a local
firewall or proxy change can fix. Two things were considered and rejected
first:

- **`--no-public-good`**: tested directly against this repo's real signed
  release artifact (run `39565872506`, commit `c39ae72c`). It **fails** —
  `gh` reports `detected public good instance but requested verification
  without public good instance`. RAD's attestations (via
  `actions/attest-build-provenance` on a normal github.com repo, not GHES)
  are signed through Sigstore's public-good Fulcio CA, even though the OIDC
  issuer bound into the certificate is correctly `token.actions.githubusercontent.com`.
  This flag is for orgs running their own private Sigstore instance; using it
  here would make the broker reject every real release, permanently.
- **Opening egress**: not applicable — nothing on this host is actually
  blocking the request (see diagnosis above).

## The fix: a pinned, hash-approved offline trust root

`gh attestation verify --custom-trusted-root <path>` verifies against a
`trusted_root.jsonl` file instead of fetching live TUF metadata. The broker
now:

- Requires `/etc/rad-release/trusted_root.jsonl` to exist, be root-owned, and
  not be group/world-writable (`protected()`, the same check already used for
  `/etc/rad-release/activation.json`).
- Requires `activation.json`'s new `trusted_root_sha256` field to match that
  file's actual SHA256 exactly (`validate_activation()`). Replacing the file
  without updating this field — or vice versa — fails closed, the same way a
  broker code update already forces re-approval via `broker_sha256`.
- Passes `--custom-trusted-root` to `gh attestation verify` alongside every
  existing check (`--signer-workflow`, `--source-ref`, `--source-digest`,
  `--signer-digest`, `--deny-self-hosted-runners`) — none of those are
  relaxed. This only changes *where the trust root comes from*, not what
  identity/provenance is enforced.

## Producing the file (never on the VPS)

### Option A — GitHub Actions, no laptop/`gh` auth required (recommended)

Run **Actions → "Fetch Sigstore trusted root (offline broker verification)" →
Run workflow** (`.github/workflows/fetch-trusted-root.yml`). This runs the
exact same `scripts/production/fetch-trusted-root.sh` on a GitHub-hosted
runner — which has normal internet egress and an already-authenticated `gh`
CLI via the job's own `GITHUB_TOKEN` — so it needs neither a laptop with `gh
auth login` done nor any credential stored anywhere. It:

- Fetches `trusted_root.jsonl` the same way the local script does, computes
  its SHA256, and validates every line is well-formed JSON.
- Publishes a GitHub build-provenance attestation **for the trusted-root
  file itself** (`actions/attest-build-provenance`), so anyone with `gh` and
  normal internet access (any machine except the VPS) can independently
  confirm the downloaded file came from this exact workflow run on this
  exact commit — `gh attestation verify trusted_root-<timestamp>.jsonl
  --repo <owner>/RAD` — before transferring it anywhere.
- Uploads `trusted_root-<timestamp>.jsonl` + its `.sha256` as a workflow run
  artifact (14-day retention), downloadable from the Actions UI or via
  `gh run download <run-id>` from any authenticated machine.

This workflow only **produces** the file — it never touches the VPS, never
installs anything, and is not part of any deploy/release path. Installing
and root-approving it is still the separate manual procedure in "Installing
on the VPS" below.

**It deliberately does NOT verify the fetched trust root against any real RAD
release artifact.** An earlier draft of this workflow included an automated
"self-check" step, which was removed before merge because it was wrong in
exactly the ways that matter for a trust-root verification step: it never
actually bound the check to the operator-supplied commit (it queried a
generic, unparameterized image reference regardless of which commit was
given), it checked a generic OCI reference rather than a specific RAD release
manifest, and — worst — a verification **failure** only printed a warning and
still let the artifact publish, i.e. it was fail-open exactly where this kind
of check must be fail-closed. Rather than ship a half-correct check that
looks like real verification but isn't, that step was deleted outright. See
"Independent verification required before installing" immediately below for
what to do instead.

### Option B — a local machine with `gh` auth (laptop, bastion, anywhere but the VPS)

```bash
scripts/production/fetch-trusted-root.sh /some/local/dir
```

This shells out to `gh attestation trusted-root` — GitHub CLI's own command
for this, which performs real TUF verification against the live root of
trust — and writes `trusted_root-<timestamp>.jsonl` plus its SHA256. Run it
on a machine with normal internet access and `gh` already authenticated
(a laptop, CI, anywhere that isn't the VPS — the VPS is specifically the
host that can't reach the CDN AND has no `gh` login).

Verified locally for this PR: the fetched file successfully verifies RAD's
real signed release artifact (run `39565872506`) with `--custom-trusted-root`,
and correctly rejects both a tampered manifest and a wrong `--source-digest`
(fail-closed, not just "accepts everything offline"). See the PR description
for exact commands and output.

## Independent verification required before installing

**Neither production method above verifies the fetched trust root against a
real RAD release artifact for you.** Whichever option produced the file
(Option A's GitHub Actions run, or Option B's local `fetch-trusted-root.sh`),
before it goes anywhere near `scripts/production/rad-install-broker-trusted-root.sh`
the operator installing it MUST independently confirm it against one
specific, real, already-published RAD release — commit-bound and
fail-closed, exactly the two properties a correct check needs:

```bash
# Pick ONE exact commit/run you already trust is a genuine RAD release
# (e.g. one you just watched deploy-api-vps.yml or deploy-frontend-vps.yml
# publish), and bind the verification to it explicitly — never a bare
# "does some attestation exist for this image name" check:
gh attestation verify "oci://ghcr.io/<owner>/rad-api@sha256:<digest-from-that-exact-build>" \
  --repo <owner>/RAD \
  --custom-trusted-root /path/to/trusted_root-<timestamp>.jsonl \
  --predicate-type https://slsa.dev/provenance/v1 \
  --source-ref refs/heads/main \
  --source-digest <the-same-commit-sha> \
  --signer-workflow <owner>/RAD/.github/workflows/deploy-frontend-vps.yml
```

(Use the API artifact's own tarball + checksum, or any image/commit you can
name exactly, in place of `rad-api` above — what matters is that the subject
is one specific digest you already know is a real release, not a bare image
repository reference.) The command must **exit non-zero and print a clear
failure** if you deliberately corrupt the trust-root file, change the digest
by one character, or point `--source-digest` at a different commit — if it
doesn't, something is wrong with the trust root (or the command), and it
must not be installed. A command that only warns on failure is not
verification; treat anything short of a hard, non-zero exit on a bad input
as disqualifying.

Only once this independent, fail-closed check passes against a real
artifact should the file be transferred to the VPS and installed via
`rad-install-broker-trusted-root.sh` below. This step is intentionally
manual and not automated into either production method above — see Option
A's note on why an automated version of this check was removed rather than
shipped half-correct.

## Installing on the VPS (atomic, with automatic rollback)

**Update, 2026-10-21 (PR #78 production review):** `activation.json` on
RAD's production VPS is already `enabled:true` and already approved by a
separate, prior human review. The install procedure below does **not**
assume or require `enabled:false`, does not touch the database, and does
not re-derive any of the four approval flags — it only installs the new
broker and/or trusted root and updates `broker_sha256`/`trusted_root_sha256`
to match, preserving every other field exactly as already approved. Use
[`scripts/production/rad-install-broker-trusted-root.sh`](../scripts/production/rad-install-broker-trusted-root.sh)
rather than hand-running `install`/`mv` — it backs up every file it's about
to touch first, verifies the copied hash before swapping anything into
place, and **automatically rolls back every file it touched** if the new
broker fails its own test suite beforehand or fails
`validate_activation()` against the real installed files afterward.

```bash
# As root, after transferring the new trusted_root-<timestamp>.jsonl
# and/or reviewed rad_release.py to the VPS out-of-band (e.g. scp over the
# existing Tailscale path):
sudo RAD_INSTALL_CONFIRM=yes-install-live \
  NEW_BROKER_SOURCE=/root/rad-reviewed-release/scripts/production/rad_release.py \
  NEW_TRUSTED_ROOT_SOURCE=/root/trusted_root-<timestamp>.jsonl \
  scripts/production/rad-install-broker-trusted-root.sh
```

Either `NEW_BROKER_SOURCE` or `NEW_TRUSTED_ROOT_SOURCE` may be omitted to
leave that file as currently installed. `RAD_INSTALL_CONFIRM=yes-install-live`
is required and is not a rubber stamp: because `enabled` is already true,
a successful run makes the new file(s) live for the very next real release —
there is no further approval stage after this script exits 0.

See `scripts/production/rad-install-broker-trusted-root.sh`'s own header
for exactly what it checks and in what order, and
`scripts/test/test-install-broker-trusted-root.sh` for the isolated test
proving the rollback path actually fires on failure.

### If you still need the database-restore / full activation-prep flow

[`rad-activation-prep.sh`](../scripts/production/rad-activation-prep.sh)
(the fuller procedure, including a fresh backup/restore-check) is for a
*future* activation cycle starting from `enabled:false` — not for installing
an update onto an already-approved, already-enabled policy. Its
`RESTORE_DATABASE_URL` / schema-reset step currently has a known gap
(hostname-string inequality doesn't prove real isolation) and must not be
pointed at any shared or persistent database; see that script's own header
for the full caution.

## Manual rollback (if you installed by hand instead)

Keep the previous `trusted_root.jsonl` and the `activation.json` that
referenced it, timestamped, before replacing either:

```bash
cp -p /etc/rad-release/trusted_root.jsonl /root/rad-backups/trusted_root.jsonl.pre-rotate-<timestamp>
cp -p /etc/rad-release/activation.json /root/rad-backups/activation.json.pre-rotate-<timestamp>
```

To roll back: restore both files together from the same timestamp (the
broker requires `trusted_root_sha256` to match the *installed* file — restoring
one without the other fails closed rather than silently verifying against a
mismatched pair):

```bash
install -o root -g root -m 0644 /root/rad-backups/trusted_root.jsonl.pre-rotate-<timestamp> /etc/rad-release/trusted_root.jsonl
install -o root -g root -m 0600 /root/rad-backups/activation.json.pre-rotate-<timestamp> /etc/rad-release/activation.json
```

## Refresh / rotation procedure

Sigstore's TUF root rotates infrequently (key material, not every release),
but the pinned file should still be refreshed periodically rather than left
to go stale indefinitely:

- **Routine refresh**: re-run the "Fetch Sigstore trusted root" GitHub Actions
  workflow (Option A above; or `fetch-trusted-root.sh` from any authenticated
  machine, Option B) every 3 months, or immediately if Sigstore or GitHub
  announce a key rotation (https://blog.sigstore.dev or the
  `sigstore/root-signing` repo).
- Each refresh is a full repeat of "Producing the file" → "Installing on the
  VPS" → updating `trusted_root_sha256` in `activation.json` → root
  re-approval. There is no partial/automatic update path by design — this is
  the same deliberate friction as a broker code change.
- Before replacing the installed file, re-run the validation in "Producing
  the file" against the *then-current* real signed artifact, not just trust
  that the fetch succeeded.
