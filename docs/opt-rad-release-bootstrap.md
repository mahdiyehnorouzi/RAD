# One-time bootstrap: /opt/rad/apps/api → releases + symlink layout

`scripts/deploy-api-systemd.sh` requires `/opt/rad/apps/api` (the exact
`WorkingDirectory=` of `rad-api.service`, verified directly on the VPS) to
be a **symlink** into `/opt/rad-releases/<release>/`. Production is
currently a **prebuilt application directory** there instead — no `.git`,
no `VERSION` file, just `dist/`, `node_modules/`, `scripts/`, `package.json`
and `.env` — and `rad-api.service`'s `EnvironmentFile=` points at
`/opt/rad/apps/api/.env`, **inside** that same directory.

`scripts/bootstrap-api-release-layout.sh` performs this one-time migration.
It is:

- **Idempotent** — re-running it after a successful bootstrap is a safe
  no-op (it detects the existing symlink and exits immediately).
- **Preflight-validated** — every assumption (the directory's shape, the
  unit's actual `WorkingDirectory`/`EnvironmentFile`, current health) is
  checked and printed *before* anything changes; a mismatch aborts with no
  changes made.
- **Explicit-approval-gated** — it always runs in read-only "plan" mode
  first, prints exactly what it is about to do, and only proceeds after
  you type `bootstrap` at an interactive prompt. There is no flag to skip
  this.
- **Non-destructive** — nothing is ever deleted. The original prebuilt
  directory is *moved* (not copied) into `/opt/rad-releases/<captured
  version>-bootstrap/` and kept there **permanently** (the deploy script's
  own pruning logic never removes anything named `*-bootstrap`) as the
  guaranteed way back to the exact state production was in before this
  ran. The original `.env` is copied — never read, parsed, or regenerated
  — to both a permanent snapshot and the new externalized location.
- **Version/Git-metadata-free** — it reads the running version from the
  live `/health` endpoint, not a `VERSION` file (which doesn't exist in
  this prebuilt layout), and never assumes or needs a `.git` directory.

## What it actually does, in order

1. Reads the current version from `GET /health` (no file needed).
2. Snapshots `/opt/rad/apps/api/.env` byte-for-byte to
   `/opt/rad-releases/.env-snapshots/legacy-original.env` (mode 600).
3. Copies that same `.env` to the new externalized path (`/etc/rad/api.env`
   by default — configurable via `RAD_API_ENV_FILE`).
4. **Moves** `/opt/rad/apps/api` to
   `/opt/rad-releases/<captured-version>-bootstrap/` (a rename on the same
   filesystem — the already-running process keeps working via its open
   file descriptors throughout this and the next step; nothing needs to
   stop first).
5. Creates the symlink `/opt/rad/apps/api` → that same directory.
6. Edits `rad-api.service`'s unit file to point `EnvironmentFile=` at the
   externalized path, runs `systemctl daemon-reload`, restarts the
   service, and verifies `/health` reports `ok:true` at the **same**
   version as step 1 (nothing about the running code should have changed
   — this step only changes where its config comes from).
7. If step 6's health check fails, it **automatically reverts** the unit
   file change, reloads, restarts, and re-verifies against the original
   in-place `.env` (still physically present and untouched inside the now
   relocated/symlinked directory) — so a failure here never leaves the
   service down or confused about which env file to use.

Steps 4–5 are not themselves reverted automatically if step 6 fails, since
they are not what step 6's failure would be caused by — the directory move
and symlink are inert with respect to `EnvironmentFile=`, and leaving them
in place while retrying step 6 is simpler and equally safe than reverting
and redoing them.

## Running it

```bash
scripts/bootstrap-api-release-layout.sh
```

It SSHs in, runs the read-only plan, prints it, and — only after you
confirm — re-connects and executes. Nothing happens non-interactively; you
will not be asked to pre-approve this in any other way (a chat approval to
"prepare" this tooling is not the same as approving this run — the script
itself always asks, on the host, at the moment it would act).

## After this succeeds

`scripts/deploy-api-systemd.sh` and `scripts/rollback-api-systemd.sh`
(and `deploy-api-vps.yml`) can be used for all future releases. The very
first `scripts/rollback-api-systemd.sh` target available afterward is
`<captured-version>-bootstrap` — the original installation, completely
intact.
