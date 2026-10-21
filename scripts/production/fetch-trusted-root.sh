#!/usr/bin/env bash
#
# Produce a fresh, authentic Sigstore trusted_root.jsonl for the RAD release
# broker's offline attestation verification.
#
# Run this on a machine with normal internet access — NOT on the production
# VPS. The VPS's egress to tuf-repo-cdn.sigstore.dev returns HTTP 403
# upstream of the host (confirmed: iptables OUTPUT policy ACCEPT, ufw allows
# outgoing, no local proxy configured) — that is the exact problem this file
# exists to work around, so fetching it from the VPS would fail the same way.
#
# This never invents trust material: it shells out to `gh attestation
# trusted-root`, the official GitHub CLI command for exactly this purpose,
# which performs real TUF verification against the live Sigstore/GitHub
# root of trust. Nothing here signs or fabricates a trust root.
#
# Usage:
#   scripts/production/fetch-trusted-root.sh [output-dir]
#
# Writes <output-dir>/trusted_root.jsonl and prints its SHA256 — the exact
# value that must go into activation.json's trusted_root_sha256 field (see
# docs/sigstore-trusted-root.md) before the broker will accept it.

set -euo pipefail

OUT_DIR="${1:-.}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT_FILE="$OUT_DIR/trusted_root-$STAMP.jsonl"

command -v gh >/dev/null || { echo "gh CLI not found on PATH." >&2; exit 1; }

echo "Fetching trusted_root.jsonl via 'gh attestation trusted-root' (live TUF, both Sigstore public-good and GitHub instances)..."
gh attestation trusted-root > "$OUT_FILE"

LINES="$(wc -l < "$OUT_FILE" | tr -d ' ')"
[[ "$LINES" -ge 1 ]] || { echo "Fetched file is empty — refusing to treat this as valid output." >&2; rm -f "$OUT_FILE"; exit 1; }

SHA256="$(shasum -a 256 "$OUT_FILE" 2>/dev/null | awk '{print $1}')"
[[ -n "$SHA256" ]] || SHA256="$(sha256sum "$OUT_FILE" | awk '{print $1}')"

echo
echo "Wrote: $OUT_FILE ($LINES entries)"
echo "SHA256: $SHA256"
echo
echo "Next steps (see docs/sigstore-trusted-root.md for the full procedure):"
echo "  1. Review this file's content: it must list both the Sigstore public-good"
echo "     and GitHub Sigstore trust bundles ('gh attestation trusted-root' with"
echo "     no flags always fetches both — do not re-run with --tuf-url/--tuf-root"
echo "     unless you specifically intend to pin a different, out-of-band TUF root)."
echo "  2. Transfer $OUT_FILE to the VPS out-of-band (e.g. scp over the existing"
echo "     Tailscale path), NOT by having the VPS fetch it itself."
echo "  3. Install it at /etc/rad-release/trusted_root.jsonl (root:root, mode 0644)"
echo "     using the atomic procedure in docs/sigstore-trusted-root.md."
echo "  4. Put SHA256 above into activation.json's trusted_root_sha256 field and"
echo "     get it root-approved — the broker refuses to run until this matches"
echo "     the installed file exactly (validate_activation() in rad_release.py)."
