#!/usr/bin/env bash
# Run only on an isolated build runner, after API build and npm prune --omit=dev.
set -euo pipefail
for required in \
  node_modules packages \
  apps/api/dist/main.js apps/api/src apps/api/seed/ensure-staff.ts \
  apps/api/package.json apps/api/scripts/start-production.mjs \
  apps/api/tsconfig.json apps/api/tsconfig.build.json tsconfig.json \
  VERSION; do
  if [[ ! -e "$required" ]]; then
    echo "::error::${required} missing before packaging — build or prune step above did not produce what was expected."
    exit 1
  fi
done
# Hoisted purely for OTHER workspaces (admin/storefront) — api
# depends on neither, and their targets are intentionally not
# shipped, so remove these two specific symlinks rather than
# leave them dangling in the artifact.
rm -f node_modules/@rad/admin node_modules/@rad/storefront
# apps/api/node_modules is npm workspace hoisting's overflow —
# present whenever the lockfile puts one of api's own
# dependencies there instead of the shared root (confirmed for
# @aws-sdk/client-s3 as of this writing); included whenever it
# exists, never required to, since a future lockfile change
# could legitimately hoist everything to the root instead.
tar_paths=(node_modules apps/api/dist apps/api/src apps/api/seed \
  apps/api/package.json apps/api/scripts \
  apps/api/tsconfig.json apps/api/tsconfig.build.json tsconfig.json \
  packages VERSION)
[[ -d apps/api/node_modules ]] && tar_paths+=(apps/api/node_modules)
# npm/esbuild can use hard links; store those as regular files so the
# privileged extractor never has to create archive-supplied hard links.
tar --hard-dereference -czf api-release.tar.gz "${tar_paths[@]}"
ls -lh api-release.tar.gz
