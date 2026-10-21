#!/usr/bin/env bash
#
# RAD production activation PREP (read-only against production data).
# Run as ROOT, ON THE VPS, by the operator. Never run by Claude/CI - there
# is no network path to the VPS from a dev machine, and flipping activation
# is a security-setting change that stays a human, explicit action.
#
# CAUTION (per PR #78 production review, 2026-10-21): this script's
# RESTORE_DATABASE_URL / DROP SCHEMA step is NOT currently in use and has a
# known gap - comparing hostnames alone does not prove the target is
# actually isolated (DNS aliases, a proxy, or mistaken credentials could
# all share a hostname with something that isn't disposable). The backup/
# restore for the current activation cycle already succeeded separately,
# against a one-off `docker run --network none` container that was deleted
# after the test (Product=38, Order=9) - there is no persistent, verified
# RESTORE_DATABASE_URL to point this at, and this script must NOT be
# pointed at any shared/persistent database to satisfy that requirement.
# Do not use the database-restore steps below (sections 4) until a
# disposable target with verifiable identity (e.g. a freshly `docker run`
# container, checked by container ID, not by hostname string comparison)
# is provisioned again for a future cycle. For installing an updated
# broker/trusted root onto an already-`enabled:true` activation policy,
# use scripts/production/rad-install-broker-trusted-root.sh instead - it
# does not touch the database at all.
#
# What it does:
#   1. Aborts immediately if any prerequisite it can check from the host
#      doesn't hold.
#   2. Takes a FRESH pg_dump from production, then proves it restores by
#      restoring into an ALREADY-EXISTING, SEPARATE, isolated PostgreSQL 16
#      instance ($RESTORE_DATABASE_URL - never created or dropped by this
#      script). Production's role is intentionally restricted and cannot
#      CREATE/DROP DATABASE, so this script never attempts to: it only
#      pg_dumps from DATABASE_URL and resets/restores within the schema of
#      an isolated database the operator has already provisioned.
#   3. Runs the repository's own isolated release/rollback test suites
#      (these touch no real host - see their own headers).
#   4. Backs up the CURRENT (disabled) activation.json untouched, with a
#      timestamp, before anything else happens.
#   5. Computes the installed broker's SHA256 AND the installed, validated
#      Sigstore trusted root's SHA256 (see docs/sigstore-trusted-root.md).
#   6. Writes a CANDIDATE policy to a side file - never the live path.
#      Only host_preflight_verified and nonproduction_rehearsal_verified are
#      (re)computed by this run's own checks. runner_workflow_policy_verified
#      and production_environments_verified are GitHub-side settings this
#      host cannot verify - if an existing candidate already has either of
#      them set true by a prior, separate operator review, that value is
#      PRESERVED across this run, never silently reset to false and never
#      silently auto-approved. `enabled` is always false; this script never
#      flips it.
#   7. Prints a PASS/FAIL report and stops. It never writes the live
#      activation.json, never restarts any service, and never triggers any
#      deployment.
#
# NOTE on trusted-root freshness: this script only checks that the
# INSTALLED trusted_root.jsonl's hash matches what's pinned in the
# candidate/activation policy. It does NOT check the file's age. Routine
# quarterly refresh (docs/sigstore-trusted-root.md) is a manual operator
# procedure - there is no automatic staleness check here, by design (same
# deliberate friction as every other approval in this file).
#
# Usage:
#   sudo ./rad-activation-prep.sh
#
# Required env:
#   RESTORE_DATABASE_URL   Connection string for the already-provisioned,
#                          separate, isolated PostgreSQL 16 instance used to
#                          prove the backup restores. Must not be production.
#
# Optional env overrides (defaults match real production paths; tests
# override every one of these - see scripts/test/test-activation-prep.sh):
#   REVIEWED_REPO, BROKER_INSTALLED, ACTIVATION_LIVE, ACTIVATION_DIR,
#   ENV_FILE, BACKUP_DIR, TRUSTED_ROOT_INSTALLED, DUMP_TIMEOUT,
#   RESTORE_TIMEOUT, TEST_TIMEOUT, RAD_PREP_ALLOW_NON_ROOT (test-only - never
#   set this for a real run; it skips the root check so the suite below can
#   exercise this script without sudo).

set -euo pipefail

REVIEWED_REPO="${REVIEWED_REPO:-/root/rad-reviewed-release}"
BROKER_INSTALLED="${BROKER_INSTALLED:-/usr/local/libexec/rad-release.py}"
ACTIVATION_DIR="${ACTIVATION_DIR:-/etc/rad-release}"
ACTIVATION_LIVE="${ACTIVATION_LIVE:-$ACTIVATION_DIR/activation.json}"
TRUSTED_ROOT_INSTALLED="${TRUSTED_ROOT_INSTALLED:-$ACTIVATION_DIR/trusted_root.jsonl}"
ENV_FILE="${ENV_FILE:-/etc/rad/api.env}"
BACKUP_DIR="${BACKUP_DIR:-/root/rad-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

DUMP_TIMEOUT="${DUMP_TIMEOUT:-1200}"       # 20 min
RESTORE_TIMEOUT="${RESTORE_TIMEOUT:-1200}" # 20 min
TEST_TIMEOUT="${TEST_TIMEOUT:-600}"        # 10 min per suite

PASS=0
FAIL=0
check() {
  local desc="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then echo "  [PASS] $desc"; PASS=$(( PASS + 1 ))
  else echo "  [FAIL] $desc"; FAIL=$(( FAIL + 1 )); fi
}
abort() { echo "ABORT: $1" >&2; exit 1; }

# Real runs are always root, so root:root ownership is trivially correct.
# RAD_PREP_ALLOW_NON_ROOT (test-only) runs as whatever user invoked the
# test harness, which cannot chown to root - skip the ownership flags in
# that case rather than failing on something irrelevant to what's tested.
# (Deliberately not an array: an empty array under `set -u` is unbound on
# bash 3.2, which is still /bin/bash on macOS test machines.)
install_dir() {
  if [[ "${RAD_PREP_ALLOW_NON_ROOT:-}" == "1" ]]; then
    install -d -m 0700 "$1"
  else
    install -d -o root -g root -m 0700 "$1"
  fi
}

echo "== RAD activation prep — $STAMP =="

# --- 0. Basic environment sanity -------------------------------------------
if [[ "${RAD_PREP_ALLOW_NON_ROOT:-}" != "1" ]]; then
  [[ "$(id -u)" == "0" ]] || abort "must run as root (sudo)."
fi
[[ -f "$BROKER_INSTALLED" ]] || abort "installed broker not found at $BROKER_INSTALLED."
[[ -d "$REVIEWED_REPO" ]] || abort "reviewed repo checkout not found at $REVIEWED_REPO (set REVIEWED_REPO=...)."
[[ -f "$ENV_FILE" ]] || abort "production env file not found at $ENV_FILE."
[[ -n "${RESTORE_DATABASE_URL:-}" ]] || abort "RESTORE_DATABASE_URL is not set. This must point at an already-provisioned, separate, isolated PostgreSQL 16 instance - this script will not create or drop a database for you (production's role is intentionally restricted and cannot CREATE/DROP DATABASE)."
for bin in pg_dump pg_restore psql timeout sha256sum; do
  command -v "$bin" >/dev/null || abort "$bin not on PATH."
done

DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"')"
[[ -n "$DATABASE_URL" ]] || abort "DATABASE_URL not found in $ENV_FILE."

PROD_HOST="$(python3 -c "from urllib.parse import urlsplit; print(urlsplit('$DATABASE_URL').hostname or '')")"
RESTORE_HOST="$(python3 -c "from urllib.parse import urlsplit; print(urlsplit('$RESTORE_DATABASE_URL').hostname or '')")"
[[ -n "$PROD_HOST" && "$PROD_HOST" != "$RESTORE_HOST" ]] || abort "RESTORE_DATABASE_URL must be a genuinely separate host from production DATABASE_URL (got the same host: '$PROD_HOST') - refusing to restore anywhere near production."
echo "Production DB host:   $PROD_HOST"
echo "Isolated restore host: $RESTORE_HOST"

RESTORE_VERSION="$(psql "$RESTORE_DATABASE_URL" -tAc 'SELECT version();' 2>/dev/null || echo "")"
case "$RESTORE_VERSION" in
  *"PostgreSQL 16"*) : ;;
  *) abort "RESTORE_DATABASE_URL does not report PostgreSQL 16 (got: '${RESTORE_VERSION:-<unreadable>}') - this procedure is approved against an isolated PostgreSQL 16 instance specifically; point RESTORE_DATABASE_URL at that, not something else." ;;
esac

# Guaranteed cleanup of the isolated database's restored content, however
# this script exits - reset the schema, never CREATE/DROP the database.
reset_restore_schema() {
  psql "$RESTORE_DATABASE_URL" -c 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;' >/dev/null 2>&1 || true
}
trap reset_restore_schema EXIT INT TERM

# --- 1. Preserve the existing (disabled) activation policy, untouched -----
[[ -e "$ACTIVATION_LIVE" ]] || abort "no existing $ACTIVATION_LIVE found to preserve/compare against."
install_dir "$BACKUP_DIR"
cp -p "$ACTIVATION_LIVE" "$BACKUP_DIR/activation.json.pre-prep-$STAMP"
chmod 0600 "$BACKUP_DIR/activation.json.pre-prep-$STAMP"
CURRENT_ENABLED="$(python3 -c "import json;print(json.load(open('$ACTIVATION_LIVE')).get('enabled'))" 2>/dev/null || echo "unreadable")"
[[ "$CURRENT_ENABLED" == "False" ]] || abort "live activation policy is not currently disabled (enabled=$CURRENT_ENABLED) — stopping rather than touch it."
echo "Preserved current activation policy -> $BACKUP_DIR/activation.json.pre-prep-$STAMP (enabled=False confirmed)"

# --- 2. Broker SHA256 must match the reviewed repo's copy ------------------
INSTALLED_SHA="$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')"
REVIEWED_SHA="$(sha256sum "$REVIEWED_REPO/scripts/production/rad_release.py" | awk '{print $1}')"
BROKER_OK=false
[[ "$INSTALLED_SHA" == "$REVIEWED_SHA" ]] && BROKER_OK=true
check "installed broker SHA256 matches reviewed repo copy" "$BROKER_OK"

# --- 3. Installed, validated Sigstore trusted root -------------------------
# "Validated" means: present, root-protected, not group/world-writable.
# This script does NOT re-run gh attestation verify here - that already
# happens on every real release via the broker itself; this just computes
# the hash that activation.json must pin (docs/sigstore-trusted-root.md
# covers how the file is produced and proven against a real artifact).
TRUSTED_ROOT_OK=false
if [[ -f "$TRUSTED_ROOT_INSTALLED" ]]; then
  if python3 -c "
import os, stat, sys
info = os.lstat('$TRUSTED_ROOT_INSTALLED')
sys.exit(0 if not stat.S_ISLNK(info.st_mode) and not info.st_mode & 0o022 else 1)
"; then
    TRUSTED_ROOT_OK=true
  fi
fi
check "installed trusted root present and not group/world-writable ($TRUSTED_ROOT_INSTALLED)" "$TRUSTED_ROOT_OK"
[[ "$TRUSTED_ROOT_OK" == "true" ]] || abort "fix $TRUSTED_ROOT_INSTALLED's permissions/presence before re-running (see docs/sigstore-trusted-root.md)."
TRUSTED_ROOT_SHA="$(sha256sum "$TRUSTED_ROOT_INSTALLED" | awk '{print $1}')"

# --- 4. Fresh backup + isolated restore proof (production DB never written) -
install_dir "$BACKUP_DIR"
DUMP_FILE="$BACKUP_DIR/rad-activation-prep-$STAMP.dump"

BACKUP_OK=false
RESTORE_OK=false
COUNT_MATCH=false
if timeout "$DUMP_TIMEOUT" pg_dump "$DATABASE_URL" --format=custom --file="$DUMP_FILE"; then
  BACKUP_OK=true
  LIVE_PRODUCT_COUNT="$(psql "$DATABASE_URL" -tAc 'SELECT count(*) FROM "Product";' || echo "")"
  LIVE_ORDER_COUNT="$(psql "$DATABASE_URL" -tAc 'SELECT count(*) FROM "Order";' || echo "")"
  reset_restore_schema
  if timeout "$RESTORE_TIMEOUT" pg_restore --dbname="$RESTORE_DATABASE_URL" "$DUMP_FILE"; then
    RESTORE_OK=true
    RESTORED_PRODUCT_COUNT="$(psql "$RESTORE_DATABASE_URL" -tAc 'SELECT count(*) FROM "Product";' || echo "")"
    RESTORED_ORDER_COUNT="$(psql "$RESTORE_DATABASE_URL" -tAc 'SELECT count(*) FROM "Order";' || echo "")"
    if [[ "$LIVE_PRODUCT_COUNT" == "$RESTORED_PRODUCT_COUNT" && "$LIVE_ORDER_COUNT" == "$RESTORED_ORDER_COUNT" && -n "$LIVE_PRODUCT_COUNT" ]]; then
      COUNT_MATCH=true
    fi
  fi
fi
# trap (reset_restore_schema) wipes the isolated DB's restored content
# unconditionally from here on, including on interruption.
check "fresh pg_dump created within ${DUMP_TIMEOUT}s ($DUMP_FILE)" "$BACKUP_OK"
check "dump restores within ${RESTORE_TIMEOUT}s into the isolated PostgreSQL 16 instance ($RESTORE_HOST)" "$RESTORE_OK"
check "restored Product/Order counts match live counts (Product=${LIVE_PRODUCT_COUNT:-}, Order=${LIVE_ORDER_COUNT:-})" "$COUNT_MATCH"

# --- 5. Repo's own isolated release/rollback test suites -------------------
TESTS_OK=true
( cd "$REVIEWED_REPO" && timeout "$TEST_TIMEOUT" python3 -B -m unittest discover -s scripts/production -p 'test_*.py' ) || TESTS_OK=false
( cd "$REVIEWED_REPO" && timeout "$TEST_TIMEOUT" bash scripts/test/test-rad-deploy-ssh.sh ) || TESTS_OK=false
( cd "$REVIEWED_REPO" && timeout "$TEST_TIMEOUT" bash scripts/test/test-release-pipeline.sh ) || TESTS_OK=false
check "isolated release/rollback/SSH-entrypoint test suites pass" "$TESTS_OK"

HOST_PREFLIGHT_OK=$BROKER_OK
[[ "$TRUSTED_ROOT_OK" == "true" && "$BACKUP_OK" == "true" && "$RESTORE_OK" == "true" && "$COUNT_MATCH" == "true" ]] || HOST_PREFLIGHT_OK=false
REHEARSAL_OK=$TESTS_OK

# --- 6. Write a CANDIDATE policy next to (never over) the live file --------
# runner_workflow_policy_verified / production_environments_verified are
# GitHub-side settings this host cannot check. If a candidate from a prior,
# separate operator review already exists, its values for those two flags
# are PRESERVED here - never silently reset to false, and never silently
# flipped to true by this script. A first run (no prior candidate) starts
# both false, same as before.
CANDIDATE="$ACTIVATION_DIR/activation.json.candidate"
python3 - "$BROKER_INSTALLED" "$CANDIDATE" "$HOST_PREFLIGHT_OK" "$REHEARSAL_OK" "$TRUSTED_ROOT_SHA" <<'PY'
import hashlib, json, sys
from pathlib import Path
broker, candidate, host_ok, rehearsal_ok, trusted_root_sha = sys.argv[1:6]
with open(broker, "rb") as source:
    digest = hashlib.file_digest(source, "sha256").hexdigest()

runner_workflow_policy_verified = False
production_environments_verified = False
existing = Path(candidate)
if existing.exists():
    try:
        prior = json.loads(existing.read_text())
        if isinstance(prior, dict):
            runner_workflow_policy_verified = prior.get("runner_workflow_policy_verified") is True
            production_environments_verified = prior.get("production_environments_verified") is True
    except (json.JSONDecodeError, OSError):
        pass  # no prior candidate to preserve from — start false, as before.

policy = dict(
    schema=1, repository="mahdiyehnorouzi/RAD", broker_sha256=digest,
    trusted_root_sha256=trusted_root_sha,
    enabled=False,
    runner_workflow_policy_verified=runner_workflow_policy_verified,
    production_environments_verified=production_environments_verified,
    host_preflight_verified=(host_ok == "true"),
    nonproduction_rehearsal_verified=(rehearsal_ok == "true"),
)
with open(candidate, "w") as out:
    json.dump(policy, out, indent=2); out.write("\n")
PY
chmod 0600 "$CANDIDATE"
chown root:root "$CANDIDATE" 2>/dev/null || true

echo
echo "== Result: $PASS passed, $FAIL failed =="
echo "Backup dump:        $DUMP_FILE"
echo "Policy preserved:   $BACKUP_DIR/activation.json.pre-prep-$STAMP"
echo "Candidate policy:   $CANDIDATE"
echo
echo "NOTE: trusted_root_sha256 reflects whatever is CURRENTLY installed at"
echo "$TRUSTED_ROOT_INSTALLED. This script does not check its age. Routine"
echo "refresh is a manual quarterly operator procedure - see"
echo "docs/sigstore-trusted-root.md. There is no automatic staleness check."
[[ $FAIL -eq 0 ]] || { echo "One or more checks FAILED — do not hand-edit the candidate's verified flags to true."; exit 1; }
echo "All host-checkable prerequisites passed. Nothing live was changed."
