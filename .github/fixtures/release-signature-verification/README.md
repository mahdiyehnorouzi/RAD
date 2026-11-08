# Release signature verification fixtures

`signed.whl` and `signed.jsonl` are GitHub's own official, publicly
published Sigstore-signed test fixtures from the `cli/cli` repository
(`pkg/cmd/attestation/test/data/`, pinned to commit
`560ea94fc7d63ab1f56ca47713599be5e8966fd3`). They are vendored here
byte-for-byte, not re-created or re-signed, so the `release-signatures`
CI job (`.github/workflows/ci.yml`) can verify a real, independently-issued
Sigstore signature without re-downloading these two small files from
`raw.githubusercontent.com` on every run, which was an observed source of
transient CI failures.

The workflow still re-checks both files' SHA-256 before use (the same
checksums it already pinned when it downloaded them directly) as a
defense against any accidental local corruption — vendoring does not
relax that check.

Do not edit these files. If they ever need to change (e.g. the upstream
fixture commit is rotated), re-download both from the pinned commit above
and verify the new checksums out-of-band before updating this directory
and the checksums in `ci.yml`.
