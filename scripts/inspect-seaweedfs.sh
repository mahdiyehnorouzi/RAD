#!/usr/bin/env bash
set -euo pipefail

# Read-only inspection of the production VPS's SeaweedFS/S3 setup, run
# BEFORE flipping MEDIA_STORAGE_PROVIDER=s3 anywhere. Changes nothing.
# Run this ON the VPS (46.34.163.16) — it talks to 127.0.0.1:8333, which
# is only reachable from the VPS itself. Needs AWS CLI v2 configured with
# throwaway/test credentials (never the ones meant for production use),
# and a TEST bucket name that is NOT "rad-public".
#
# Usage:
#   S3_TEST_BUCKET=rad-test S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... \
#     ./scripts/inspect-seaweedfs.sh

S3_ENDPOINT="${S3_ENDPOINT:-http://127.0.0.1:8333}"
S3_TEST_BUCKET="${S3_TEST_BUCKET:-rad-test}"
S3_PRODUCTION_BUCKET="rad-public"

if [[ "$S3_TEST_BUCKET" == "$S3_PRODUCTION_BUCKET" ]]; then
  echo "ERROR: S3_TEST_BUCKET must not be '${S3_PRODUCTION_BUCKET}' (the production bucket)."
  echo "This script is read-only against the bucket itself, but refuses to even point at production as a safety net."
  exit 1
fi

echo "=== 1. Docker containers ==="
docker ps --filter "name=seaweedfs" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || echo "docker not available or no seaweedfs containers found"

echo
echo "=== 2. Restart count / health (containers that have restarted repeatedly are suspect) ==="
for name in seaweedfs_master_1 seaweedfs_volume_1 seaweedfs_filer_1 seaweedfs_s3_1 seaweedfs_webdav_1; do
  if docker inspect "$name" >/dev/null 2>&1; then
    restarts="$(docker inspect -f '{{.RestartCount}}' "$name" 2>/dev/null || echo "?")"
    status="$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null || echo "?")"
    echo "${name}: status=${status} restarts=${restarts}"
  else
    echo "${name}: not found"
  fi
done

echo
echo "=== 3. Published ports (flag anything bound to 0.0.0.0 that should be internal-only) ==="
docker ps --format "{{.Names}}: {{.Ports}}" | grep -i seaweedfs || true
echo "Expect only the S3 gateway (8333) reachable at all, and ideally only on 127.0.0.1, not 0.0.0.0."

echo
echo "=== 4. Image digests (confirm whether pinned to an immutable version) ==="
docker ps --filter "name=seaweedfs" --format "{{.Names}}: {{.Image}}" | while read -r line; do
  name="${line%%:*}"
  image="$(docker inspect -f '{{.Config.Image}}' "$name" 2>/dev/null || echo unknown)"
  digest="$(docker inspect -f '{{index .RepoDigests 0}}' "$name" 2>/dev/null || echo "(no digest — not pulled by digest/tag immutably)")"
  echo "${name}: image=${image} digest=${digest}"
done

echo
echo "=== 5. Disk and memory ==="
df -h / 2>/dev/null | tail -n +1
echo "---"
free -h 2>/dev/null

echo
echo "=== 6. S3 API reachability + credential check (AWS CLI) ==="
if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found — install awscli v2 to run this section, or inspect manually with curl."
else
  echo "Listing buckets (confirms endpoint + credentials work)..."
  aws --endpoint-url "$S3_ENDPOINT" s3 ls || echo "FAILED — check S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY and S3_ENDPOINT"

  echo
  echo "Checking for rad-public and rad-private buckets specifically..."
  aws --endpoint-url "$S3_ENDPOINT" s3api head-bucket --bucket rad-public 2>&1 | head -5 && echo "rad-public: exists" || echo "rad-public: NOT FOUND or inaccessible"
  aws --endpoint-url "$S3_ENDPOINT" s3api head-bucket --bucket rad-private 2>&1 | head -5 && echo "rad-private: exists" || echo "rad-private: NOT FOUND or inaccessible"

  echo
  echo "=== 7. Authenticated upload/download round trip against the TEST bucket (${S3_TEST_BUCKET}) ==="
  tmp_file="$(mktemp)"
  echo "seaweedfs-inspect-$(date +%s)" > "$tmp_file"
  test_key="inspect-test/$(basename "$tmp_file")"
  if aws --endpoint-url "$S3_ENDPOINT" s3api create-bucket --bucket "$S3_TEST_BUCKET" >/dev/null 2>&1; then
    echo "(created ${S3_TEST_BUCKET} — did not exist yet)"
  fi
  if aws --endpoint-url "$S3_ENDPOINT" s3 cp "$tmp_file" "s3://${S3_TEST_BUCKET}/${test_key}" >/dev/null 2>&1; then
    echo "upload to ${S3_TEST_BUCKET}: OK"
    if aws --endpoint-url "$S3_ENDPOINT" s3 cp "s3://${S3_TEST_BUCKET}/${test_key}" "${tmp_file}.download" >/dev/null 2>&1 \
      && diff -q "$tmp_file" "${tmp_file}.download" >/dev/null 2>&1; then
      echo "download from ${S3_TEST_BUCKET}: OK (content matches)"
    else
      echo "download from ${S3_TEST_BUCKET}: FAILED or content mismatch"
    fi
    aws --endpoint-url "$S3_ENDPOINT" s3 rm "s3://${S3_TEST_BUCKET}/${test_key}" >/dev/null 2>&1 || true
    rm -f "${tmp_file}.download"
  else
    echo "upload to ${S3_TEST_BUCKET}: FAILED"
  fi
  rm -f "$tmp_file"

  echo
  echo "=== 8. Anonymous/unauthenticated read check (should FAIL for a correctly private bucket) ==="
  echo "(skipped here — run manually: curl -i ${S3_ENDPOINT}/${S3_TEST_BUCKET}/some-known-key — a 200 with no auth header means the bucket is public, which is only intended for rad-public's read path via the reverse proxy, never rad-private)"
fi

echo
echo "=== 9. Data persistence check (run once, wait, run again after a container restart) ==="
echo "This script does not restart anything itself (read-only). To verify persistence manually:"
echo "  1. Note a known object's content above."
echo "  2. docker restart seaweedfs_volume_1 seaweedfs_filer_1 seaweedfs_s3_1"
echo "  3. Re-run this script — the same object must still download with the same content."

echo
echo "=== Done. Review restart counts, port bindings, and the upload/download results above before proceeding. ==="
