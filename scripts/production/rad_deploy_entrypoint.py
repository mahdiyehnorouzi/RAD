#!/usr/bin/env python3
"""Validates and safely extracts the rad-deploy SSH transport tar.

Called by scripts/production/rad-deploy-ssh-entrypoint.sh (the forced SSH
command for the restricted, unprivileged `rad-deploy` account) to turn an
untrusted tar stream into a small, fixed set of flat files inside a staging
directory - without ever running `tar -x`, or Python's
`tarfile.extractall()`, directly against data nobody has inspected yet.

Every member is checked - type, name, size, count - and the WHOLE upload is
rejected, before a single byte is written to disk, if anything doesn't match
exactly what is expected: no subdirectories, no symlinks, no hard links, no
device/FIFO/other special files, no path traversal, no absolute paths, no
duplicate names, no unexpected entries, no oversized members, no oversized
archive. This is fail-closed: the default for anything not explicitly
recognized is "reject", not "allow".

This module runs as the unprivileged `rad-deploy` account and grants no
privilege itself - it only decides whether the broker
(scripts/production/rad_release.py, root-owned, invoked separately via the
narrow `rad-deploy` sudoers rule) ever gets to see a staging directory. It
does not perform, weaken, or duplicate the broker's own signature/manifest
verification; that remains entirely inside the broker, unchanged.
"""
import argparse
import sys
import tarfile
from pathlib import Path

MAX_MEMBERS = 3

# Exactly what scripts/production/rad_release.py itself accepts and caps
# (snapshot_input calls in rad_release.py's main()) - kept in sync with it
# on purpose, so an oversized or unexpected upload is rejected here, at the
# unprivileged layer, before the broker ever runs.
MAX_SIZES = {
    "release.json": 65536,
    "release.sigstore.json": 4 * 1024 * 1024,
    "api-release.tar.gz": 2 * 1024 * 1024 * 1024,
}
REQUIRED_FOR_ALL = frozenset({"release.json", "release.sigstore.json"})
ALLOWED_BY_KIND = {
    "api": frozenset({"release.json", "release.sigstore.json", "api-release.tar.gz"}),
    "frontend": frozenset({"release.json", "release.sigstore.json"}),
}


class RejectedUpload(Exception):
    """Raised for any reason the upload must be rejected. Always fail-closed."""


def validate_and_extract(tar_path: Path, stage_dir: Path, kind: str) -> None:
    allowed = ALLOWED_BY_KIND.get(kind)
    if allowed is None:
        raise RejectedUpload(f"unknown kind: {kind!r}")

    try:
        archive = tarfile.open(tar_path, mode="r:*")
    except (tarfile.TarError, OSError) as exc:
        raise RejectedUpload(f"not a readable tar stream: {exc}") from None

    with archive:
        try:
            members = archive.getmembers()
        except (tarfile.TarError, OSError) as exc:
            raise RejectedUpload(f"could not list tar members: {exc}") from None

        if not members:
            raise RejectedUpload("empty archive")
        if len(members) > MAX_MEMBERS:
            raise RejectedUpload(f"too many entries ({len(members)} > {MAX_MEMBERS})")

        seen = set()
        for member in members:
            name = member.name
            # Regular-file check first and foremost: this alone already excludes
            # directories, symlinks, hard links, devices, FIFOs and sockets.
            # The explicit symlink/hardlink checks below are deliberate
            # defense-in-depth, not the primary control - kept in case a future
            # Python version's isfile() semantics ever change.
            if not member.isfile():
                raise RejectedUpload(f"entry {name!r} is not a regular file (type={member.type!r})")
            if member.issym() or member.islnk():
                raise RejectedUpload(f"entry {name!r} is a symlink or hard link")
            if member.size < 0:
                raise RejectedUpload(f"entry {name!r} has a negative size")
            if name in seen:
                raise RejectedUpload(f"duplicate entry: {name!r}")
            seen.add(name)
            # Name checked against the fixed literal allow-list, not a pattern:
            # no "/", no "..", no absolute path, no leading "-" is possible
            # once every accepted value is one of these exact three strings.
            if name not in allowed:
                raise RejectedUpload(f"unexpected entry: {name!r}")
            cap = MAX_SIZES[name]
            if member.size > cap:
                raise RejectedUpload(f"entry {name!r} size {member.size} exceeds cap {cap}")

        missing_always = REQUIRED_FOR_ALL - seen
        if missing_always:
            raise RejectedUpload(f"missing required entries: {sorted(missing_always)}")
        if kind == "api" and "api-release.tar.gz" not in seen:
            raise RejectedUpload("missing required entry: api-release.tar.gz")
        if kind == "frontend" and "api-release.tar.gz" in seen:
            raise RejectedUpload("api-release.tar.gz not expected for kind=frontend")

        stage_dir.mkdir(parents=True, exist_ok=True)
        resolved_stage = stage_dir.resolve()
        for member in members:
            cap = MAX_SIZES[member.name]
            destination = stage_dir / member.name
            # member.name is one of the three fixed literals checked above
            # (never containing "/" or ".."), so this can never resolve outside
            # stage_dir - but check it explicitly anyway: exactly the class of
            # archive-traversal bug CVE-2007-4559 describes, and this is the
            # one place a mistake above would turn into an actual write.
            if destination.resolve().parent != resolved_stage:
                raise RejectedUpload(f"entry {member.name!r} resolves outside the staging directory")
            source = archive.extractfile(member)
            if source is None:
                raise RejectedUpload(f"could not read entry: {member.name!r}")
            written = 0
            with open(destination, "wb") as out:
                while True:
                    chunk = source.read(65536)
                    if not chunk:
                        break
                    written += len(chunk)
                    if written > cap:
                        raise RejectedUpload(
                            f"entry {member.name!r} exceeded its declared size while extracting"
                        )
                    out.write(chunk)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tar-path", required=True, help="Path to the already-bounded tar file to validate/extract.")
    parser.add_argument("--stage-dir", required=True, help="Destination directory (created if missing).")
    parser.add_argument("--kind", required=True, choices=sorted(ALLOWED_BY_KIND))
    args = parser.parse_args()
    try:
        validate_and_extract(Path(args.tar_path), Path(args.stage_dir), args.kind)
    except RejectedUpload as exc:
        print(f"rejected: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
