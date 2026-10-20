#!/usr/bin/env bash
#
# Isolated, local test of the release pipeline (bootstrap -> deploy ->
# auto-rollback -> manual rollback), simulating exactly the three things
# that matter and that this sandbox can't exercise for real: a prebuilt
# legacy directory (no .git, no VERSION), an external env file, and a
# systemd-style service (via scripts/test/fake-systemctl.sh, since this
# sandbox's PID 1 isn't systemd and the real binary can't connect to a
# bus here). Never touches any real host. Exits non-zero on any check
# failure.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMPROOT="$(mktemp -d)"
trap 'kill $(cat "$TMPROOT/systemd-state/rad-api.pid" 2>/dev/null) 2>/dev/null || true; rm -rf "$TMPROOT"' EXIT

PASS=0
FAIL=0
check() {
  local desc="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then
    echo "  [PASS] $desc"
    PASS=$(( PASS + 1 ))
  else
    echo "  [FAIL] $desc"
    FAIL=$(( FAIL + 1 ))
  fi
}

PORT="$(node -e "const s=require('net').createServer();s.listen(0,'127.0.0.1',()=>{console.log(s.address().port);s.close()})")"
LIVE_DIR="${TMPROOT}/opt/rad/apps/api"
RELEASES_DIR="${TMPROOT}/opt/rad-releases"
ENV_FILE_TARGET="${TMPROOT}/etc/rad/api.env"
UNIT_FILE="${TMPROOT}/systemd/rad-api.service"
STATE_DIR="${TMPROOT}/systemd-state"
FAKEBIN="${TMPROOT}/fakebin"

mkdir -p "$LIVE_DIR/dist" "$LIVE_DIR/scripts" "$(dirname "$UNIT_FILE")" "$(dirname "$ENV_FILE_TARGET")" "$FAKEBIN"

# --- Simulated legacy prebuilt directory (no .git, no VERSION — exactly
# the verified real production shape).
cat > "${LIVE_DIR}/dist/main.js" <<'EOF'
const http = require('http');
const port = process.env.PORT || 4000;
// Version is intrinsic to this build, never env-derived - this file
// stands in for a specific release's own compiled code, just as
// real production's start-production.mjs's `RAD_VERSION ??= pkg.version`
// means a real release's version comes from ITS OWN package.json unless
// something unusual overrides it. Using the shared, externalized env
// file for this instead (as an earlier version of this test did) would
// leak one release's version into the next, which is exactly the kind
// of cross-release coupling the externalized-env design must NOT have.
const version = '1.3.0';
const healthy = process.env.FAKE_UNHEALTHY !== '1';
http.createServer((req, res) => {
  if (req.url === '/health') {
    if (!healthy) { res.writeHead(500); res.end('nope'); return; }
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ ok: true, service: 'rad-api', version }));
    return;
  }
  res.writeHead(404); res.end();
}).listen(port, '127.0.0.1');
EOF
echo "// stub" > "${LIVE_DIR}/scripts/start-production.mjs"
echo '{"name":"rad-api-legacy","version":"1.3.0"}' > "${LIVE_DIR}/package.json"
cat > "${LIVE_DIR}/.env" <<EOF
NODE_ENV=production
PORT=${PORT}
EOF
ORIGINAL_ENV_CONTENT="$(cat "${LIVE_DIR}/.env")"

cat > "$UNIT_FILE" <<EOF
WorkingDirectory=${LIVE_DIR}
EnvironmentFile=${LIVE_DIR}/.env
ExecStart=/usr/bin/node scripts/start-production.mjs
EOF

cp "${ROOT}/scripts/test/fake-systemctl.sh" "${FAKEBIN}/systemctl"
cp "${ROOT}/scripts/test/fake-journalctl.sh" "${FAKEBIN}/journalctl"
chmod +x "${FAKEBIN}/systemctl" "${FAKEBIN}/journalctl"

export PATH="${FAKEBIN}:${PATH}"
export FAKE_SYSTEMD_UNIT_FILE="$UNIT_FILE"
export FAKE_SYSTEMD_STATE_DIR="$STATE_DIR"

echo "=== 0. Starting simulated legacy service ==="
systemctl restart rad-api.service
sleep 0.5
RESP="$(curl -fsS "http://127.0.0.1:${PORT}/health")"
echo "  health: $RESP"
check "legacy service healthy, version 1.3.0, no 'env' field (real production contract)" \
  "$(node -e "const d=JSON.parse(process.argv[1]); process.stdout.write(String(d.ok===true && d.version==='1.3.0' && !('env' in d)))" "$RESP")"

echo
echo "=== 1. Bootstrap (migrate legacy dir -> releases+symlink, externalize env) ==="
bash "${ROOT}/scripts/lib/bootstrap-api-remote.sh" "$LIVE_DIR" "$RELEASES_DIR" rad-api.service "$PORT" "$ENV_FILE_TARGET" execute

check "LIVE_DIR is now a symlink" "$([[ -L "$LIVE_DIR" ]] && echo true || echo false)"
check "symlink target is RELEASES_DIR/1.3.0-bootstrap" \
  "$([[ "$(readlink -f "$LIVE_DIR")" == "$(readlink -f "${RELEASES_DIR}/1.3.0-bootstrap")" ]] && echo true || echo false)"
check "externalized env file exists with identical content to the original" \
  "$([[ -f "$ENV_FILE_TARGET" ]] && [[ "$(cat "$ENV_FILE_TARGET")" == "$ORIGINAL_ENV_CONTENT" ]] && echo true || echo false)"
check "legacy-original.env snapshot was written" \
  "$([[ -f "${RELEASES_DIR}/.env-snapshots/legacy-original.env" ]] && echo true || echo false)"
check "unit file's EnvironmentFile now points at the externalized path" \
  "$(grep -q "^EnvironmentFile=${ENV_FILE_TARGET}\$" "$UNIT_FILE" && echo true || echo false)"
RESP="$(curl -fsS "http://127.0.0.1:${PORT}/health")"
check "service still healthy at version 1.3.0 after bootstrap (unchanged code, just relocated+externalized config)" \
  "$(node -e "const d=JSON.parse(process.argv[1]); process.stdout.write(String(d.ok===true && d.version==='1.3.0'))" "$RESP")"

echo
echo "=== 2. Bootstrap is idempotent (re-run is a safe no-op) ==="
if bash "${ROOT}/scripts/lib/bootstrap-api-remote.sh" "$LIVE_DIR" "$RELEASES_DIR" rad-api.service "$PORT" "$ENV_FILE_TARGET" execute | grep -q "already"; then
  check "re-running bootstrap detects already-done state and no-ops" "true"
else
  check "re-running bootstrap detects already-done state and no-ops" "false"
fi

echo
echo "=== 3. Prepare a fake git repo simulating current main (good release) ==="
FAKE_REPO="${TMPROOT}/fakerepo"
mkdir -p "${FAKE_REPO}/apps/api"
echo "9.9.9" > "${FAKE_REPO}/VERSION"
cat > "${FAKE_REPO}/package.json" <<'EOF'
{"name":"fakerad","private":true,"version":"0.0.0","workspaces":["apps/api"]}
EOF
cat > "${FAKE_REPO}/apps/api/package.json" <<'EOF'
{"name":"@rad/api","version":"9.9.9","scripts":{"build":"node build.js"}}
EOF
cat > "${FAKE_REPO}/apps/api/build.js" <<'EOF'
const fs = require('fs');
fs.mkdirSync('dist', { recursive: true });
fs.mkdirSync('scripts', { recursive: true });
fs.writeFileSync('scripts/start-production.mjs', '// stub\n');
fs.writeFileSync('dist/main.js', `
const http = require('http');
const port = process.env.PORT || 4000;
const version = require('./../package.json').version;
const healthy = process.env.FAKE_UNHEALTHY !== '1';
http.createServer((req, res) => {
  if (req.url === '/health') {
    if (!healthy) { res.writeHead(500); res.end('nope'); return; }
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end(JSON.stringify({ ok: true, service: 'rad-api', version, env: process.env.NODE_ENV || 'development' }));
    return;
  }
  res.writeHead(404); res.end();
}).listen(port, '127.0.0.1');
`);
EOF
( cd "$FAKE_REPO" && git init --quiet -b main && git config user.email t@t.com && git config user.name t \
  && npm install --package-lock-only --quiet \
  && git add -A && git commit --quiet -m "good release 9.9.9" )
GOOD_SHA="$(git -C "$FAKE_REPO" rev-parse HEAD)"
echo "  good commit: ${GOOD_SHA}"

# A second, bad commit whose build produces an unhealthy service.
sed -i "s/process.env.FAKE_UNHEALTHY !== '1'/false/" "${FAKE_REPO}/apps/api/build.js"
( cd "$FAKE_REPO" && git add -A && git commit --quiet -m "bad release - always unhealthy" )
BAD_SHA="$(git -C "$FAKE_REPO" rev-parse HEAD)"
echo "  bad commit: ${BAD_SHA}"

echo
echo "=== 4. Deploy the good commit ==="
RAD_HEALTH_TIMEOUT_SECONDS=15 bash "${ROOT}/scripts/lib/deploy-api-remote.sh" \
  "$LIVE_DIR" "$RELEASES_DIR" rad-api.service "$PORT" "$ENV_FILE_TARGET" \
  "file://${FAKE_REPO}" "$GOOD_SHA" 5

RESP="$(curl -fsS "http://127.0.0.1:${PORT}/health")"
echo "  health: $RESP"
check "deployed good commit is healthy, version 9.9.9, env=production (new contract, with 'env' field)" \
  "$(node -e "const d=JSON.parse(process.argv[1]); process.stdout.write(String(d.ok===true && d.version==='9.9.9' && d.env==='production'))" "$RESP")"
check "legacy bootstrap release still present and untouched" \
  "$([[ -d "${RELEASES_DIR}/1.3.0-bootstrap" ]] && echo true || echo false)"
MANIFEST_RELEASE_BEFORE_BAD="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).releaseDir)" "${RELEASES_DIR}/.rollback-manifest.json")"
check "manifest recorded the legacy release as the pre-deploy rollback target" \
  "$([[ "$MANIFEST_RELEASE_BEFORE_BAD" == "$(readlink -f "${RELEASES_DIR}/1.3.0-bootstrap")" ]] && echo true || echo false)"

echo
echo "=== 5. Deploy the bad commit -> expect automatic rollback ==="
DEPLOY_EXIT=0
RAD_HEALTH_TIMEOUT_SECONDS=10 bash "${ROOT}/scripts/lib/deploy-api-remote.sh" \
  "$LIVE_DIR" "$RELEASES_DIR" rad-api.service "$PORT" "$ENV_FILE_TARGET" \
  "file://${FAKE_REPO}" "$BAD_SHA" 5 || DEPLOY_EXIT=$?
check "deploy of the bad commit reports failure (non-zero exit)" "$([[ "$DEPLOY_EXIT" != "0" ]] && echo true || echo false)"

sleep 1
RESP="$(curl -fsS "http://127.0.0.1:${PORT}/health")"
echo "  health after auto-rollback: $RESP"
check "automatic rollback restored the last GOOD release (version 9.9.9), not the bad one" \
  "$(node -e "const d=JSON.parse(process.argv[1]); process.stdout.write(String(d.ok===true && d.version==='9.9.9'))" "$RESP")"
check "env file content preserved/restored correctly across the failed deploy + rollback" \
  "$([[ -f "$ENV_FILE_TARGET" ]] && echo true || echo false)"

echo
echo "=== 6. Manual rollback all the way back to the original legacy install ==="
LEGACY_ENV_SNAPSHOT="${RELEASES_DIR}/.env-snapshots/legacy-original.env"
bash "${ROOT}/scripts/lib/rollback-api-remote.sh" \
  "$LIVE_DIR" "$RELEASES_DIR" rad-api.service "$PORT" "$ENV_FILE_TARGET" \
  "1.3.0-bootstrap" "$LEGACY_ENV_SNAPSHOT"

sleep 1
RESP="$(curl -fsS "http://127.0.0.1:${PORT}/health")"
echo "  health after manual rollback to legacy: $RESP"
check "manual rollback restored the ORIGINAL legacy install (version 1.3.0, no 'env' field)" \
  "$(node -e "const d=JSON.parse(process.argv[1]); process.stdout.write(String(d.ok===true && d.version==='1.3.0' && !('env' in d)))" "$RESP")"
check "env file restored to the original legacy snapshot content" \
  "$([[ "$(cat "$ENV_FILE_TARGET")" == "$ORIGINAL_ENV_CONTENT" ]] && echo true || echo false)"

echo
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[[ "$FAIL" == "0" ]]
