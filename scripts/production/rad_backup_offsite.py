#!/usr/bin/env python3
"""Synchronous offsite copy of a pre-migration database dump.

Installed as a separate, root-owned executable
(/usr/local/libexec/rad-backup-offsite.py — see docs/automated-migrations.md)
so the privileged release broker (rad_release.py) never has to hold S3/rclone
credentials itself. All of that configuration — the rclone remote's access
key/secret for "liara-rad" — lives solely in rclone's own config file for the
invoking user (HOME=/root, so /root/.config/rclone/rclone.conf by default),
read by rclone itself. Nothing in this script parses, prints, or forwards it.

Usage: rad-backup-offsite.py DUMP_PATH

Exits 0 only once the exact local dump has been uploaded to the configured
bucket AND the remote object has been confirmed to match it (size, and
checksum when the remote reports one). Any missing config, upload error, or
verification mismatch exits non-zero with a message on stderr — never a
credential value.
"""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

REMOTE = "liara-rad"
BUCKET = "ad-prod-db-backups"
RCLONE = "/usr/bin/rclone"
SAFE_ENV = {"PATH": "/usr/local/bin:/usr/bin:/bin", "HOME": "/root", "LANG": "C.UTF-8"}


def fail(message):
    print(f"rad-backup-offsite: {message}", file=sys.stderr)
    sys.exit(1)


def run(*args, timeout=600):
    return subprocess.run([str(a) for a in args], env=SAFE_ENV, capture_output=True, text=True, timeout=timeout)


def local_sha256(path):
    with open(path, "rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def main(argv):
    if len(argv) != 2:
        fail("usage: rad-backup-offsite.py DUMP_PATH")
    dump = Path(argv[1])
    if not dump.is_file():
        fail(f"dump path does not exist or is not a regular file: {dump}")
    size = dump.stat().st_size
    if size <= 0:
        fail("refusing to upload an empty dump")

    listed = run(RCLONE, "listremotes")
    if listed.returncode != 0:
        fail("rclone is not available or failed to list configured remotes")
    if f"{REMOTE}:" not in listed.stdout.split():
        fail(f"rclone remote '{REMOTE}' is not configured")

    remote_path = f"{REMOTE}:{BUCKET}/{dump.name}"
    upload = run(RCLONE, "copyto", dump, remote_path, "--s3-no-check-bucket", "--checksum", timeout=1800)
    if upload.returncode != 0:
        fail(f"upload to the offsite bucket failed (exit {upload.returncode})")

    size_check = run(RCLONE, "size", "--json", remote_path)
    if size_check.returncode != 0:
        fail("could not confirm the remote object was written")
    try:
        remote_size = json.loads(size_check.stdout)["bytes"]
    except (ValueError, KeyError, TypeError):
        fail("could not parse remote object size")
    if remote_size != size:
        fail(f"remote object size ({remote_size}) does not match local dump size ({size})")

    hash_check = run(RCLONE, "hashsum", "sha256", remote_path)
    if hash_check.returncode == 0 and hash_check.stdout.strip():
        remote_hash = hash_check.stdout.strip().split()[0]
        if remote_hash != local_sha256(dump):
            fail("remote checksum does not match the local dump")
    else:
        print(f"rad-backup-offsite: remote does not report a checksum for {dump.name}; "
              "verified by size only", file=sys.stderr)

    print(f"rad-backup-offsite: verified offsite copy of {dump.name} ({size} bytes)")


if __name__ == "__main__":
    main(sys.argv)
