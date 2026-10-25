#!/usr/bin/env python3
"""Executed only in a hosted build job; attested release.json binds all inputs."""
import hashlib
import json
import os
from pathlib import Path
import re

kind = os.environ["RELEASE_KIND"]
assert kind in ("api", "frontend")
assert os.environ["GITHUB_REPOSITORY"] == "mahdiyehnorouzi/RAD"
assert os.environ["GITHUB_REF"] == "refs/heads/main"
commit = os.environ["GITHUB_SHA"]
assert re.fullmatch(r"[0-9a-f]{40}", commit)
manifest = dict(schema=1, repository=os.environ["GITHUB_REPOSITORY"], kind=kind,
                commit=commit, run_id=int(os.environ["GITHUB_RUN_ID"]),
                run_attempt=int(os.environ["GITHUB_RUN_ATTEMPT"]))
if kind == "api":
    with open("api-release.tar.gz", "rb") as archive:
        manifest["archive_sha256"] = hashlib.file_digest(archive, "sha256").hexdigest()
    manifest["version"] = Path("VERSION").read_text().strip()
    # The exact migration files this artifact ships, bound into the same
    # signed manifest as the release itself — the migrate broker action
    # (scripts/production/rad_release.py) verifies the production database's
    # applied-migrations history against this list before touching anything,
    # so "which migrations are pending" is never computed from unsigned,
    # runner-supplied input.
    migrations_dir = Path("apps/api/src/database/migrations")
    manifest["migrations"] = sorted(
        p.name for p in migrations_dir.glob("*.ts") if not p.name.endswith(".spec.ts")
    ) if migrations_dir.is_dir() else []
else:
    manifest["images"] = {}
    for service in ("storefront", "admin"):
        digest = os.environ.get(f"{service.upper()}_DIGEST", "")
        if digest:
            assert re.fullmatch(r"sha256:[0-9a-f]{64}", digest)
            manifest["images"][service] = f"ghcr.io/mahdiyehnorouzi/rad-{service}@{digest}"
    assert manifest["images"]
Path("release.json").write_text(json.dumps(manifest, sort_keys=True) + "\n")
