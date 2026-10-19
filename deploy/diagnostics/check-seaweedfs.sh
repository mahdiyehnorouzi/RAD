#!/usr/bin/env bash
#
# Read-only, idempotent diagnostic for RAD's self-hosted SeaweedFS media
# storage on the production VPS. Makes NO writes to any container, volume,
# compose file, Nginx config, or DNS record — every command below is an
# inspection (docker inspect/logs/stats, curl against existing endpoints,
# dig, openssl s_client, read-only `ls`/`df`/`stat`). Safe to run any
# number of times.
#
# Usage (on the VPS, as a user that can run `docker`):
#   bash check-seaweedfs.sh 2>&1 | tee seaweedfs-diagnostic-report.txt
#
# Then send back ONLY seaweedfs-diagnostic-report.txt. It intentionally
# never prints: access keys/secret keys, presigned URLs/signatures,
# container environment variables, or file contents — only status,
# headers, and small structural facts (sizes, counts, response codes).
# Skim it yourself before sharing if you've renamed anything sensitively
# into a container name/label, since this script can't know about that.
#
# Known container names, per docs/vps-frontend-deployment-plan.md's own
# record of this host's SeaweedFS stack: seaweedfs_master_1,
# seaweedfs_volume_1, seaweedfs_filer_1, seaweedfs_s3_1, seaweedfs_webdav_1.
# Every lookup below also falls back to matching by image name, in case
# the actual container names on this host differ.
set -uo pipefail

SECTION() { printf '\n========== %s ==========\n' "$1"; }
INFO()    { printf '[info] %s\n' "$1"; }
WARN()    { printf '[warn] %s\n' "$1"; }
FAIL()    { printf '[FAIL] %s\n' "$1"; }
SKIP()    { printf '[skip, needs auth/credentials — not checked here] %s\n' "$1"; }

EXPECTED_CONTAINERS=(seaweedfs_master_1 seaweedfs_volume_1 seaweedfs_filer_1 seaweedfs_s3_1 seaweedfs_webdav_1)

find_container() {
  local wanted="$1"
  if docker inspect "$wanted" >/dev/null 2>&1; then
    echo "$wanted"
    return 0
  fi
  docker ps -a --format '{{.Names}}\t{{.Image}}' 2>/dev/null \
    | awk -F'\t' -v w="$wanted" 'tolower($2) ~ tolower(w) {print $1; exit}'
}

echo "RAD SeaweedFS diagnostic — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Host: $(hostname) | $(uname -sr)"

SECTION "1. SeaweedFS containers/processes and health"
if ! command -v docker >/dev/null 2>&1; then
  FAIL "docker CLI not found on this host — cannot inspect containers."
else
  for base in "${EXPECTED_CONTAINERS[@]}"; do
    name=$(find_container "$base")
    if [[ -z "${name:-}" ]]; then
      WARN "No container found matching '$base' (by name or image)."
      continue
    fi
    status=$(docker inspect -f '{{.State.Status}}' "$name" 2>/dev/null)
    health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}(no healthcheck defined){{end}}' "$name" 2>/dev/null)
    started=$(docker inspect -f '{{.State.StartedAt}}' "$name" 2>/dev/null)
    restarts=$(docker inspect -f '{{.RestartCount}}' "$name" 2>/dev/null)
    image=$(docker inspect -f '{{.Config.Image}}' "$name" 2>/dev/null)
    INFO "$name — image=$image status=$status health=$health restarts=$restarts startedAt=$started"
    if [[ "$status" != "running" ]]; then
      FAIL "$name is not running (status=$status)."
    fi
  done
  echo
  INFO "docker stats (one-shot, no streaming):"
  docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}' 2>/dev/null \
    | grep -iE 'seaweedfs|NAME' || WARN "No seaweedfs_* containers matched docker stats."
fi

SECTION "2. S3 gateway availability (internal)"
s3_container=$(find_container seaweedfs_s3_1)
s3_internal_port=""
if [[ -n "${s3_container:-}" ]]; then
  # Only reads published port mappings — never env vars (which could hold
  # credentials) and never the container's filesystem.
  s3_internal_port=$(docker port "$s3_container" 2>/dev/null | head -n1 | sed -E 's/.*:([0-9]+)$/\1/')
fi
s3_internal_port=${s3_internal_port:-8333}
INFO "Probing http://127.0.0.1:${s3_internal_port}/ (internal, loopback only)"
if command -v curl >/dev/null 2>&1; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${s3_internal_port}/" || echo "000")
  INFO "HTTP status from internal S3 gateway root: $code (any response, even 403/404, means the gateway is up and speaking HTTP; 000 means connection failed)"
else
  WARN "curl not found — cannot probe the gateway."
fi

SECTION "3. Internal vs public endpoints"
INFO "Internal endpoint checked above: 127.0.0.1:${s3_internal_port}"
read -r -p "Public upload/media hostname to check (e.g. media.rad-object.com or api.rad-object.com) [skip if none]: " PUBLIC_HOST || PUBLIC_HOST=""
if [[ -n "${PUBLIC_HOST:-}" ]]; then
  INFO "Resolving and probing https://${PUBLIC_HOST}/"
  if command -v curl >/dev/null 2>&1; then
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "https://${PUBLIC_HOST}/" || echo "000")
    INFO "HTTP status from public endpoint root: $code"
  fi
else
  WARN "No public hostname given — skipped public-endpoint probe. Re-run and provide one to check it."
fi

SECTION "4. DNS and HTTPS"
if [[ -n "${PUBLIC_HOST:-}" ]]; then
  if command -v dig >/dev/null 2>&1; then
    INFO "DNS A/AAAA records for ${PUBLIC_HOST}:"
    dig +short A "$PUBLIC_HOST" 2>/dev/null
    dig +short AAAA "$PUBLIC_HOST" 2>/dev/null
  elif command -v getent >/dev/null 2>&1; then
    INFO "Resolved address (dig unavailable, using getent):"
    getent hosts "$PUBLIC_HOST" 2>/dev/null
  else
    WARN "Neither dig nor getent available — cannot check DNS."
  fi
  if command -v openssl >/dev/null 2>&1; then
    INFO "TLS certificate summary for ${PUBLIC_HOST}:443 (dates/issuer only, no key material):"
    echo | timeout 8 openssl s_client -connect "${PUBLIC_HOST}:443" -servername "$PUBLIC_HOST" 2>/dev/null \
      | openssl x509 -noout -subject -issuer -dates 2>/dev/null \
      || WARN "Could not retrieve a TLS certificate on :443 for ${PUBLIC_HOST}."
  else
    WARN "openssl not available — cannot check the TLS certificate."
  fi
else
  WARN "No public hostname given — skipped DNS/HTTPS checks."
fi

SECTION "5. Nginx proxy configuration (structure only, no secrets expected in these files)"
if command -v nginx >/dev/null 2>&1; then
  INFO "nginx -t (config syntax check only, does not reload anything):"
  nginx -t 2>&1 || WARN "nginx -t reported a problem — see above."
else
  WARN "nginx binary not found directly on this host (it may run in a container) — skipped nginx -t."
fi
for conf_dir in /etc/nginx/sites-enabled /etc/nginx/conf.d; do
  if [[ -d "$conf_dir" ]]; then
    INFO "Server blocks under $conf_dir mentioning the media/API hostnames:"
    grep -l -iE 'media|rad-object|api\.' "$conf_dir"/* 2>/dev/null | while read -r f; do
      echo "  - $f"
      grep -nE 'server_name|location|client_max_body_size|add_header.*Access-Control|proxy_pass' "$f" 2>/dev/null | sed 's/^/      /'
    done
  fi
done
echo
WARN "If no 'Access-Control-Allow-Origin' line appears above for the SeaweedFS S3 gateway's own server block, CORS for direct browser uploads is likely not configured in Nginx — confirm with section 6 below."

SECTION "6. Browser upload CORS, including OPTIONS preflight"
if [[ -n "${PUBLIC_HOST:-}" ]] && command -v curl >/dev/null 2>&1; then
  ADMIN_ORIGIN="https://admin.rad-object.com"
  INFO "Simulating the browser's CORS preflight for a POST upload from ${ADMIN_ORIGIN} to https://${PUBLIC_HOST}/"
  curl -s -D - -o /dev/null --max-time 8 \
    -X OPTIONS "https://${PUBLIC_HOST}/" \
    -H "Origin: ${ADMIN_ORIGIN}" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: content-type" \
    | grep -iE '^HTTP|access-control-' || WARN "No Access-Control-* headers in the OPTIONS response — CORS preflight would fail in a real browser."
else
  WARN "No public hostname given, or curl unavailable — skipped the CORS preflight check."
fi
SKIP "A real signed-POST upload from the admin app's actual origin (not curl) — only a live browser test or an authenticated test upload (section 9) proves this end-to-end."

SECTION "7. Presigned PUT/POST request compatibility"
INFO "This checks that the gateway responds to S3 POST-policy requests structurally; it does NOT mint or use a real presigned URL (that requires the API's SEAWEEDFS_ACCESS_KEY/SECRET_KEY, which this script never has)."
if command -v curl >/dev/null 2>&1; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 -X POST "http://127.0.0.1:${s3_internal_port}/" || echo "000")
  INFO "HTTP status for an unsigned POST to the internal gateway root: $code (a real signed POST from the API would carry a valid policy+signature; an unsigned one is expected to be rejected — this just confirms POST is reachable and handled, not silently dropped)"
fi
SKIP "Whether a REAL presigned POST policy (as apps/api/src/storage/seaweedfs-storage.service.ts actually generates) succeeds end-to-end — requires an authenticated test upload (section 9)."

SECTION "8. Public GET access, size limits, and Content-Type handling"
INFO "These need an existing object key to probe. If you have one (e.g. from the bucket/filer), paste it below; otherwise skip."
read -r -p "A known existing object key under the media bucket to GET (blank to skip): " SAMPLE_KEY || SAMPLE_KEY=""
if [[ -n "${SAMPLE_KEY:-}" && -n "${PUBLIC_HOST:-}" ]]; then
  INFO "HEAD https://${PUBLIC_HOST}/<bucket>/${SAMPLE_KEY} (structure only, no body saved):"
  curl -s -I --max-time 8 "https://${PUBLIC_HOST}/${SAMPLE_KEY}" | grep -iE '^HTTP|content-type|content-length|cache-control' \
    || WARN "No response headers — GET path may be misconfigured or the key doesn't exist at that path."
else
  WARN "No sample key/public host given — skipped the public GET check."
fi
INFO "Configured size limits are enforced application-side (apps/api/src/storage/media-policy.ts), not by this script; checking the actual configured ceiling requires reading the API's running config, not this diagnostic."
SKIP "Confirming an actual image AND an actual video GET back with correct Content-Type — requires an authenticated test upload (section 9) to have a known-good object to fetch."

SECTION "9. What requires an authenticated test upload (NOT performed by this script)"
cat <<'EOF'
This script deliberately never uploads anything or uses any credential —
it is read-only by design, per RAD's safety rules (no destructive testing
against production). The following can only be confirmed with a real,
signed upload/download round trip through the actual API (ideally against
a disposable test product, never a real listing):
  - A real presigned POST actually succeeds from a browser context.
  - An uploaded image/video is byte-for-byte retrievable afterward.
  - The API's own byte-signature validation (media-signature.ts) accepts
    a genuine file and rejects a mislabeled one, against the REAL bucket.
  - The real configured upload size ceiling actually rejects an oversized
    file against the live gateway (not just in a unit test).
This is Admin-panel / API-level work, not a VPS shell diagnostic — do this
once CORS and endpoint reachability above look clean.
EOF

SECTION "10. Storage persistence and volume mounts"
if command -v docker >/dev/null 2>&1; then
  for base in seaweedfs_master_1 seaweedfs_volume_1 seaweedfs_filer_1; do
    name=$(find_container "$base")
    [[ -z "${name:-}" ]] && continue
    INFO "$name mounts:"
    docker inspect -f '{{range .Mounts}}  {{.Type}} {{.Source}} -> {{.Destination}} (RW={{.RW}}){{"\n"}}{{end}}' "$name" 2>/dev/null
  done
  echo
  INFO "Disk usage of SeaweedFS-related Docker volumes (sizes only):"
  for vol in $(docker volume ls --format '{{.Name}}' 2>/dev/null | grep -i seaweed); do
    mp=$(docker volume inspect -f '{{.Mountpoint}}' "$vol" 2>/dev/null)
    size=$(du -sh "$mp" 2>/dev/null | awk '{print $1}')
    echo "  $vol -> $mp (${size:-unknown size})"
  done
  echo
  INFO "Host filesystem free space:"
  df -h / 2>/dev/null
else
  WARN "docker not available — skipped volume/mount inspection."
fi

SECTION "Done"
echo "Review the output above, then share ONLY the saved report file (seaweedfs-diagnostic-report.txt if you used the 'tee' command from the usage note)."
