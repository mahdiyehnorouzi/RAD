#!/usr/bin/env bash
#
# Remote body of scripts/bootstrap-api-release-layout.sh — runs ON the
# target host (via SSH from the wrapper, or directly for local testing;
# see scripts/test/). Idempotent: safe to re-run, and a no-op if the
# layout is already bootstrapped.
#
# Migrates /opt/rad/apps/api (a PREBUILT application directory — no .git,
# no VERSION file, just dist/ + node_modules/ + scripts/ + package.json +
# .env, exactly as verified on the real host) into a releases+symlink
# layout, and externalizes its EnvironmentFile, WITHOUT requiring any Git
# metadata or VERSION file to exist — both were wrongly assumed by an
# earlier draft of this tooling and are corrected here.
#
# Nothing is deleted. The original prebuilt directory is MOVED (not
# copied) into the releases directory and kept there permanently (never
# pruned by deploy-api-systemd.sh — see its "-bootstrap" suffix exclusion)
# as the guaranteed rollback target to the exact state production was in
# before this ever ran. The original .env is copied (not moved, not
# parsed, not regenerated) to the externalized path; nothing reads or
# prints its contents beyond the specific presence/safety checks every
# script in this family performs.
set -euo pipefail

LIVE_DIR="$1"               # e.g. /opt/rad/apps/api
RELEASES_DIR="$2"           # e.g. /opt/rad-releases
SERVICE="$3"                # e.g. rad-api.service
APP_PORT="$4"               # e.g. 4000
ENV_FILE_TARGET="$5"        # e.g. /etc/rad/api.env
MODE="${6:-plan}"           # "plan" (preflight + print plan, change nothing, exit 0) or "execute" (the wrapper only passes this after ITS OWN interactive confirmation — see scripts/bootstrap-api-release-layout.sh for why the prompt lives there, not here)

poll_health() {
  # Lenient, version-contract-tolerant health check: requires ok===true
  # and (if an "env" field is present at all) that it equals "production";
  # a response with NO "env" field (the real, verified production
  # contract for the legacy 1.3.0 build) is accepted on ok+version alone.
  # expected version, if non-empty, must match exactly.
  local port="$1" expected_version="${2:-}" timeout_seconds="${3:-120}" interval=5
  local elapsed=0 healthy=false
  while (( elapsed < timeout_seconds )); do
    local body_file http_code
    body_file="$(mktemp)"
    http_code="$(curl -fsS -o "$body_file" -w '%{http_code}' "http://127.0.0.1:${port}/health" 2>/dev/null || echo "000")"
    if [[ "$http_code" == "200" ]]; then
      local resp_ok resp_version resp_env
      resp_ok="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.ok===true))}catch(e){process.stdout.write('false')}" "$body_file")"
      resp_version="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(String(d.version||''))}catch(e){process.stdout.write('')}" "$body_file")"
      resp_env="$(node -e "try{const d=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write('env' in d ? String(d.env) : '')}catch(e){process.stdout.write('')}" "$body_file")"
      rm -f "$body_file"
      local version_ok=true
      [[ -n "$expected_version" && "$resp_version" != "$expected_version" ]] && version_ok=false
      local env_ok=true
      [[ -n "$resp_env" && "$resp_env" != "production" ]] && env_ok=false
      if [[ "$resp_ok" == "true" && "$version_ok" == "true" && "$env_ok" == "true" ]]; then
        echo "Healthy: ok=true version=${resp_version} env=${resp_env:-<absent>}"
        healthy=true
        break
      fi
      echo "Responded but not ready (ok=${resp_ok} version=${resp_version} env=${resp_env:-<absent>})..."
    else
      rm -f "$body_file"
      echo "Not reachable yet (http_code=${http_code})..."
    fi
    sleep "$interval"
    elapsed=$(( elapsed + interval ))
  done
  [[ "$healthy" == "true" ]]
}

# --- Idempotency: already bootstrapped -> no-op success.
if [[ -L "$LIVE_DIR" ]]; then
  echo "${LIVE_DIR} is already a symlink -> $(readlink -f "$LIVE_DIR"). Bootstrap already done; nothing to do."
  exit 0
fi

# --- Preflight (read-only, no changes yet).
if [[ ! -d "$LIVE_DIR" ]]; then
  echo "ERROR: ${LIVE_DIR} does not exist as a directory or symlink. Nothing to bootstrap."
  exit 1
fi
for required in dist/main.js scripts/start-production.mjs package.json .env; do
  if [[ ! -e "${LIVE_DIR}/${required}" ]]; then
    echo "ERROR: ${LIVE_DIR}/${required} missing. This does not look like the expected prebuilt layout. Aborting without changing anything."
    exit 1
  fi
done

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "$SERVICE" --no-legend 2>/dev/null | grep -q "$SERVICE"; then
  UNIT_ENV_FILE="$(systemctl show -p EnvironmentFiles --value "$SERVICE" 2>/dev/null | awk '{print $1}')"
  UNIT_WORKDIR="$(systemctl show -p WorkingDirectory --value "$SERVICE" 2>/dev/null)"
  echo "Verified via systemctl: WorkingDirectory=${UNIT_WORKDIR:-<unset>} EnvironmentFile=${UNIT_ENV_FILE:-<unset>}"
  if [[ -n "$UNIT_WORKDIR" && "$UNIT_WORKDIR" != "$LIVE_DIR" ]]; then
    echo "ERROR: ${SERVICE}'s WorkingDirectory (${UNIT_WORKDIR}) does not match the expected ${LIVE_DIR}. Refusing to guess which is right."
    exit 1
  fi
  if [[ -n "$UNIT_ENV_FILE" && "$UNIT_ENV_FILE" != "${LIVE_DIR}/.env" ]]; then
    echo "NOTICE: ${SERVICE}'s EnvironmentFile (${UNIT_ENV_FILE}) is not ${LIVE_DIR}/.env as expected — if it's already externalized, this bootstrap may be partially done or unnecessary. Investigate before proceeding."
    exit 1
  fi
else
  echo "NOTICE: systemctl cannot see ${SERVICE} on this host (expected in a local test harness; see scripts/test/). Continuing with filesystem-only steps where the harness provides a stand-in."
fi

CAPTURED_VERSION="$(curl -fsS "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null | node -e "try{const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(String(d.version||'unknown'))}catch(e){process.stdout.write('unknown')}" || echo unknown)"
echo "Captured current live version from /health (no VERSION file needed): ${CAPTURED_VERSION}"

mkdir -p "${RELEASES_DIR}/.env-snapshots"
if [[ -f "${RELEASES_DIR}/.env-snapshots/legacy-original.env" ]]; then
  echo "NOTICE: a legacy-original.env snapshot already exists — not overwriting it. If this is a genuine re-bootstrap attempt after a prior partial failure, investigate ${RELEASES_DIR} manually first."
  exit 1
fi
if [[ -f "$ENV_FILE_TARGET" ]]; then
  echo "ERROR: ${ENV_FILE_TARGET} already exists. Refusing to overwrite an existing externalized env file blindly. Remove/rename it first if this is intentional, after reviewing its contents yourself."
  exit 1
fi

echo
echo "=== Bootstrap plan ==="
echo "  1. Snapshot ${LIVE_DIR}/.env -> ${RELEASES_DIR}/.env-snapshots/legacy-original.env (chmod 600, byte-for-byte, never read/parsed)"
echo "  2. Externalize: copy ${LIVE_DIR}/.env -> ${ENV_FILE_TARGET} (chmod 600)"
echo "  3. Move ${LIVE_DIR} -> ${RELEASES_DIR}/${CAPTURED_VERSION}-bootstrap (permanent rollback target, never pruned)"
echo "  4. Symlink ${LIVE_DIR} -> ${RELEASES_DIR}/${CAPTURED_VERSION}-bootstrap"
echo "  5. Update ${SERVICE}'s EnvironmentFile to ${ENV_FILE_TARGET}, daemon-reload, restart, verify health (expecting version ${CAPTURED_VERSION}, unchanged)"
echo "  6. On any failure in step 5: revert the EnvironmentFile change, daemon-reload, restart, re-verify — the symlink itself is never reverted since it is not the cause of a step-5 failure"
echo "======================="
echo

if [[ "$MODE" != "execute" ]]; then
  echo "Plan-only mode (no changes made). Re-run via scripts/bootstrap-api-release-layout.sh, which shows you this exact plan and asks for confirmation BEFORE invoking this script in 'execute' mode."
  exit 0
fi

install -m 600 "${LIVE_DIR}/.env" "${RELEASES_DIR}/.env-snapshots/legacy-original.env"
echo "Step 1 done: legacy env snapshotted."

install -m 600 "${LIVE_DIR}/.env" "$ENV_FILE_TARGET"
echo "Step 2 done: env externalized to ${ENV_FILE_TARGET}."

LEGACY_RELEASE="${RELEASES_DIR}/${CAPTURED_VERSION}-bootstrap"
mv "$LIVE_DIR" "$LEGACY_RELEASE"
echo "Step 3 done: ${LIVE_DIR} moved to ${LEGACY_RELEASE} (original .env copy left inside it, now vestigial but untouched)."

ln -s "$LEGACY_RELEASE" "$LIVE_DIR"
echo "Step 4 done: ${LIVE_DIR} -> ${LEGACY_RELEASE}."

if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files "$SERVICE" --no-legend 2>/dev/null | grep -q "$SERVICE"; then
  UNIT_FILE="$(systemctl show -p FragmentPath --value "$SERVICE" 2>/dev/null)"
  if [[ -z "$UNIT_FILE" || ! -f "$UNIT_FILE" ]]; then
    echo "ERROR: could not resolve ${SERVICE}'s unit file path. The symlink swap (steps 3-4) is already done and safe to leave as-is — the service still works via ${LIVE_DIR}/.env until you fix the unit file manually."
    exit 1
  fi
  ORIGINAL_ENV_LINE="$(grep -E '^EnvironmentFile=' "$UNIT_FILE" || true)"
  sed -i "s#^EnvironmentFile=.*#EnvironmentFile=${ENV_FILE_TARGET}#" "$UNIT_FILE"
  systemctl daemon-reload
  echo "Step 5a done: ${UNIT_FILE} now points EnvironmentFile at ${ENV_FILE_TARGET}."

  systemctl restart "$SERVICE"
  if poll_health "$APP_PORT" "$CAPTURED_VERSION" "${RAD_HEALTH_TIMEOUT_SECONDS:-120}"; then
    echo "Step 5 done: ${SERVICE} healthy at version ${CAPTURED_VERSION} using the externalized env file."
  else
    echo "ERROR: ${SERVICE} did not become healthy after externalizing the env file. Reverting the unit file change..."
    if [[ -n "$ORIGINAL_ENV_LINE" ]]; then
      sed -i "s#^EnvironmentFile=.*#${ORIGINAL_ENV_LINE}#" "$UNIT_FILE"
    fi
    systemctl daemon-reload
    systemctl restart "$SERVICE"
    if poll_health "$APP_PORT" "$CAPTURED_VERSION" "${RAD_HEALTH_TIMEOUT_SECONDS:-120}"; then
      echo "Reverted successfully: ${SERVICE} healthy again using ${LIVE_DIR}/.env (the original, still-intact in-release copy). The symlink migration (steps 3-4) is still in place and is NOT itself the cause of this failure."
      exit 1
    else
      echo "ERROR: REVERT ALSO FAILED. Manual intervention required NOW."
      systemctl status "$SERVICE" --no-pager || true
      journalctl -u "$SERVICE" -n 100 --no-pager || true
      exit 1
    fi
  fi
else
  echo "NOTICE: no systemctl-visible unit for ${SERVICE} — skipping step 5's unit-file edit (local test harness should perform its own equivalent and call poll_health itself)."
fi

echo
echo "Bootstrap complete. ${LIVE_DIR} -> ${LEGACY_RELEASE}. Env externalized to ${ENV_FILE_TARGET}."
echo "scripts/deploy-api-systemd.sh can now be used for future releases."
