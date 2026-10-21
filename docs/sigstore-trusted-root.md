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

```bash
scripts/production/fetch-trusted-root.sh /some/local/dir
```

This shells out to `gh attestation trusted-root` — GitHub CLI's own command
for this, which performs real TUF verification against the live root of
trust — and writes `trusted_root-<timestamp>.jsonl` plus its SHA256. Run it
on a machine with normal internet access (a laptop, CI, anywhere that isn't
the VPS — the VPS is specifically the host that can't reach the CDN).

Verified locally for this PR: the fetched file successfully verifies RAD's
real signed release artifact (run `39565872506`) with `--custom-trusted-root`,
and correctly rejects both a tampered manifest and a wrong `--source-digest`
(fail-closed, not just "accepts everything offline"). See the PR description
for exact commands and output.

## Installing on the VPS (atomic)

```bash
# As root, after transferring trusted_root-<timestamp>.jsonl to the VPS
# out-of-band (e.g. scp over the existing Tailscale path):
install -d -o root -g root -m 0700 /etc/rad-release
install -o root -g root -m 0644 trusted_root-<timestamp>.jsonl /etc/rad-release/trusted_root.jsonl.new
sha256sum /etc/rad-release/trusted_root.jsonl.new   # confirm this matches the value
                                                      # fetch-trusted-root.sh printed
mv -f /etc/rad-release/trusted_root.jsonl.new /etc/rad-release/trusted_root.jsonl   # same filesystem -> atomic rename
```

Then, in `activation.json` (edit the candidate, never the live file directly —
see the activation prep procedure already in use): set `trusted_root_sha256`
to that exact hash, and get it root-approved along with the file's
installation. The broker will refuse to run (`validate_activation()`) until
both match.

## Rollback

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

- **Routine refresh**: re-run `fetch-trusted-root.sh` every 3 months, or
  immediately if Sigstore or GitHub announce a key rotation
  (https://blog.sigstore.dev or the `sigstore/root-signing` repo).
- Each refresh is a full repeat of "Producing the file" → "Installing on the
  VPS" → updating `trusted_root_sha256` in `activation.json` → root
  re-approval. There is no partial/automatic update path by design — this is
  the same deliberate friction as a broker code change.
- Before replacing the installed file, re-run the validation in "Producing
  the file" against the *then-current* real signed artifact, not just trust
  that the fetch succeeded.
