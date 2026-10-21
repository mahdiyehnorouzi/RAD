#!/usr/bin/env bash
#
# Atomic, reversible installation of an updated release broker and/or
# Sigstore trusted root onto an ALREADY-APPROVED activation.json.
#
# Run as ROOT, ON THE VPS, by the operator. Never run by Claude/CI.
#
# This is deliberately NOT the general activation-prep script
# (rad-activation-prep.sh). It assumes production's activation.json is
# already enabled:true and already validated by a separate, prior human
# review (per PR #78 production feedback, 2026-10-21) - it does not
# require, assume, or toggle `enabled`, does not touch any database, and
# does not re-run the four approval flags' verification. It only:
#
#   1. Pre-install checks: both new files exist, look structurally sane,
#      and the repo's own isolated broker test suite passes against the
#      NEW broker before anything is installed.
#   2. Backs up the CURRENTLY installed broker, trusted root, and
#      activation.json, timestamped, before writing anything.
#   3. Installs the new broker and/or trusted root atomically (write to a
#      sibling temp file on the same filesystem, verify its hash, then
#      `mv -f` into place - never a partial file at the live path).
#   4. Updates ONLY broker_sha256 and/or trusted_root_sha256 in
#      activation.json to match what was just installed. Every other
#      field - enabled, runner_workflow_policy_verified,
#      production_environments_verified, host_preflight_verified,
#      nonproduction_rehearsal_verified, schema, repository - is copied
#      through byte-for-byte unchanged. This script never sets, clears,
#      or re-derives any approval flag.
#   5. Post-install validation: loads the INSTALLED broker as a Python
#      module and calls its own validate_activation() against the real,
#      installed activation.json - the same fail-closed check a real
#      release would hit. If that raises, or any step above fails, this
#      script automatically rolls back every file it touched, from the
#      backups taken in step 2, and reports ROLLED BACK.
#
# WARNING: if activation.json's `enabled` is already true (as it is on
# RAD's production VPS right now), a successful run of this script makes
# the new broker/trusted root IMMEDIATELY live for the next real release -
# there is no separate "candidate" stage, because there is nothing left to
# approve: the four approval flags are being preserved exactly as a human
# already approved them. This is why RAD_INSTALL_CONFIRM is required
# below, and why this script is never run by Claude/CI.
#
# Usage:
#   sudo RAD_INSTALL_CONFIRM=yes-install-live \
#     NEW_BROKER_SOURCE=/root/rad-reviewed-release/scripts/production/rad_release.py \
#     NEW_TRUSTED_ROOT_SOURCE=/root/trusted_root-<timestamp>.jsonl \
#     ./rad-install-broker-trusted-root.sh
#
# Either NEW_BROKER_SOURCE or NEW_TRUSTED_ROOT_SOURCE (or both) may be set;
# unset means "leave that file as installed, update nothing about it."
#
# Optional env overrides (defaults match real production paths; tests
# override every one - see scripts/test/test-install-broker-trusted-root.sh):
#   BROKER_INSTALLED, TRUSTED_ROOT_INSTALLED, ACTIVATION_LIVE, BACKUP_DIR,
#   REVIEWED_REPO (for the pre-install test suite), TEST_TIMEOUT,
#   RAD_INSTALL_ALLOW_NON_ROOT (test-only - never for a real run).

set -euo pipefail

BROKER_INSTALLED="${BROKER_INSTALLED:-/usr/local/libexec/rad-release.py}"
TRUSTED_ROOT_INSTALLED="${TRUSTED_ROOT_INSTALLED:-/etc/rad-release/trusted_root.jsonl}"
ACTIVATION_LIVE="${ACTIVATION_LIVE:-/etc/rad-release/activation.json}"
BACKUP_DIR="${BACKUP_DIR:-/root/rad-backups}"
REVIEWED_REPO="${REVIEWED_REPO:-/root/rad-reviewed-release}"
TEST_TIMEOUT="${TEST_TIMEOUT:-600}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

PASS=0
FAIL=0
check() {
  local desc="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then echo "  [PASS] $desc"; PASS=$(( PASS + 1 ))
  else echo "  [FAIL] $desc"; FAIL=$(( FAIL + 1 )); fi
}
abort() { echo "ABORT: $1" >&2; exit 1; }

echo "== RAD broker/trusted-root install — $STAMP =="

# --- 0. Basic sanity --------------------------------------------------------
if [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" != "1" ]]; then
  [[ "$(id -u)" == "0" ]] || abort "must run as root (sudo)."
fi
[[ "${RAD_INSTALL_CONFIRM:-}" == "yes-install-live" ]] || abort "RAD_INSTALL_CONFIRM=yes-install-live is required. This installs onto an activation.json that may already be enabled:true - read this script's header before setting it."
[[ -n "${NEW_BROKER_SOURCE:-}" || -n "${NEW_TRUSTED_ROOT_SOURCE:-}" ]] || abort "set NEW_BROKER_SOURCE and/or NEW_TRUSTED_ROOT_SOURCE - nothing to install otherwise."
[[ -f "$ACTIVATION_LIVE" ]] || abort "no existing $ACTIVATION_LIVE - this script updates an existing, already-approved policy, it does not create one."
command -v sha256sum >/dev/null || abort "sha256sum not on PATH."
command -v python3 >/dev/null || abort "python3 not on PATH."

install_root() {
  if [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]]; then
    install -m "$1" "$2" "$3"
  else
    install -o root -g root -m "$1" "$2" "$3"
  fi
}

install_dir_root() {
  if [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]]; then
    install -d -m "$1" "$2"
  else
    install -d -o root -g root -m "$1" "$2"
  fi
}

# --- 1. Pre-install checks --------------------------------------------------
if [[ -n "${NEW_BROKER_SOURCE:-}" ]]; then
  [[ -f "$NEW_BROKER_SOURCE" ]] || abort "NEW_BROKER_SOURCE not found: $NEW_BROKER_SOURCE"
  grep -q "ACTIVATION = Path" "$NEW_BROKER_SOURCE" && grep -q "def validate_activation" "$NEW_BROKER_SOURCE" \
    || abort "NEW_BROKER_SOURCE doesn't look like rad_release.py (missing expected markers) - refusing to install."
  if [[ -d "$REVIEWED_REPO" ]]; then
    TEST_STAGE="$(mktemp -d)"
    cp -r "$REVIEWED_REPO/scripts" "$TEST_STAGE/scripts"
    cp "$NEW_BROKER_SOURCE" "$TEST_STAGE/scripts/production/rad_release.py"
    PRE_TESTS_OK=true
    if command -v timeout >/dev/null 2>&1; then
      ( cd "$TEST_STAGE" && timeout "$TEST_TIMEOUT" python3 -B -m unittest discover -s scripts/production -p 'test_*.py' ) || PRE_TESTS_OK=false
    else
      ( cd "$TEST_STAGE" && python3 -B -m unittest discover -s scripts/production -p 'test_*.py' ) || PRE_TESTS_OK=false
    fi
    rm -rf "$TEST_STAGE"
    check "new broker's own isolated test suite passes before install" "$PRE_TESTS_OK"
    [[ "$PRE_TESTS_OK" == "true" ]] || abort "new broker fails its own test suite - not installing."
  else
    echo "  [SKIP] new broker test suite (REVIEWED_REPO not found at $REVIEWED_REPO)"
  fi
fi
if [[ -n "${NEW_TRUSTED_ROOT_SOURCE:-}" ]]; then
  [[ -f "$NEW_TRUSTED_ROOT_SOURCE" ]] || abort "NEW_TRUSTED_ROOT_SOURCE not found: $NEW_TRUSTED_ROOT_SOURCE"
  TR_SANE=true
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    python3 -c "import json,sys; d=json.loads(sys.argv[1]); sys.exit(0 if 'mediaType' in d else 1)" "$line" || TR_SANE=false
  done < "$NEW_TRUSTED_ROOT_SOURCE"
  check "NEW_TRUSTED_ROOT_SOURCE parses as trusted_root.jsonl (one JSON object per line with mediaType)" "$TR_SANE"
  [[ "$TR_SANE" == "true" ]] || abort "NEW_TRUSTED_ROOT_SOURCE doesn't look like a real trusted_root.jsonl - not installing."
fi
[[ -e "$ACTIVATION_LIVE" ]] || abort "no existing $ACTIVATION_LIVE found."
python3 -c "
import json, sys
policy = json.load(open(sys.argv[1]))
assert isinstance(policy, dict) and policy.get('schema') == 1 and policy.get('repository') == 'mahdiyehnorouzi/RAD'
" "$ACTIVATION_LIVE" || abort "$ACTIVATION_LIVE doesn't look like a valid RAD activation policy - not touching it."

# --- 2. Backup everything this run could touch, before writing anything ---
install_dir_root 0700 "$BACKUP_DIR"
[[ -f "$BROKER_INSTALLED" ]] && cp -p "$BROKER_INSTALLED" "$BACKUP_DIR/rad-release.py.pre-install-$STAMP"
[[ -f "$TRUSTED_ROOT_INSTALLED" ]] && cp -p "$TRUSTED_ROOT_INSTALLED" "$BACKUP_DIR/trusted_root.jsonl.pre-install-$STAMP"
cp -p "$ACTIVATION_LIVE" "$BACKUP_DIR/activation.json.pre-install-$STAMP"
echo "Backed up current state with suffix: pre-install-$STAMP"

ROLLBACK_NEEDED=false
rollback() {
  echo "Rolling back to pre-install-$STAMP ..." >&2
  [[ -f "$BACKUP_DIR/rad-release.py.pre-install-$STAMP" ]] && install_root 0755 "$BACKUP_DIR/rad-release.py.pre-install-$STAMP" "$BROKER_INSTALLED"
  [[ -f "$BACKUP_DIR/trusted_root.jsonl.pre-install-$STAMP" ]] && install_root 0644 "$BACKUP_DIR/trusted_root.jsonl.pre-install-$STAMP" "$TRUSTED_ROOT_INSTALLED"
  install_root 0600 "$BACKUP_DIR/activation.json.pre-install-$STAMP" "$ACTIVATION_LIVE"
  echo "ROLLED BACK to pre-install-$STAMP state." >&2
}

fail_and_rollback() {
  echo "ABORT: $1" >&2
  rollback
  exit 1
}

# --- 3. Atomic install of whichever files were requested ------------------
if [[ -n "${NEW_BROKER_SOURCE:-}" ]]; then
  NEW_BROKER_SHA="$(sha256sum "$NEW_BROKER_SOURCE" | awk '{print $1}')"
  TMP="$(mktemp "$(dirname "$BROKER_INSTALLED")/.rad-release.py.XXXXXX")"
  cp "$NEW_BROKER_SOURCE" "$TMP"
  [[ "$(sha256sum "$TMP" | awk '{print $1}')" == "$NEW_BROKER_SHA" ]] || fail_and_rollback "copied broker hash mismatch before install - refusing."
  chmod 0755 "$TMP"; [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]] || chown root:root "$TMP"
  mv -f "$TMP" "$BROKER_INSTALLED"
  echo "Installed broker: $BROKER_INSTALLED (sha256 $NEW_BROKER_SHA)"
fi
if [[ -n "${NEW_TRUSTED_ROOT_SOURCE:-}" ]]; then
  NEW_TRUSTED_ROOT_SHA="$(sha256sum "$NEW_TRUSTED_ROOT_SOURCE" | awk '{print $1}')"
  TMP="$(mktemp "$(dirname "$TRUSTED_ROOT_INSTALLED")/.trusted_root.jsonl.XXXXXX")"
  cp "$NEW_TRUSTED_ROOT_SOURCE" "$TMP"
  [[ "$(sha256sum "$TMP" | awk '{print $1}')" == "$NEW_TRUSTED_ROOT_SHA" ]] || fail_and_rollback "copied trusted root hash mismatch before install - refusing."
  chmod 0644 "$TMP"; [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]] || chown root:root "$TMP"
  mv -f "$TMP" "$TRUSTED_ROOT_INSTALLED"
  echo "Installed trusted root: $TRUSTED_ROOT_INSTALLED (sha256 $NEW_TRUSTED_ROOT_SHA)"
fi

# --- 4. Update ONLY the two hash fields in activation.json, atomically -----
ACTIVATION_TMP="$(mktemp "$(dirname "$ACTIVATION_LIVE")/.activation.json.XXXXXX")"
python3 - "$ACTIVATION_LIVE" "$ACTIVATION_TMP" "$BROKER_INSTALLED" "$TRUSTED_ROOT_INSTALLED" <<'PY' || fail_and_rollback "failed to write updated activation.json."
import hashlib, json, sys
live_path, tmp_path, broker_path, trusted_root_path = sys.argv[1:5]

def file_hash(path):
    with open(path, "rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()

policy = json.load(open(live_path))
# Every field except the two hashes is copied through untouched - this
# never sets, clears, or re-derives enabled or any approval flag.
policy["broker_sha256"] = file_hash(broker_path)
policy["trusted_root_sha256"] = file_hash(trusted_root_path)
with open(tmp_path, "w") as out:
    json.dump(policy, out, sort_keys=True)
    out.write("\n")
PY
chmod 0600 "$ACTIVATION_TMP"; [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]] || chown root:root "$ACTIVATION_TMP"
mv -f "$ACTIVATION_TMP" "$ACTIVATION_LIVE"
echo "Updated activation.json: broker_sha256/trusted_root_sha256 only, every other field unchanged."

# --- 5. Post-install validation: the broker's OWN fail-closed check -------
VALIDATE_OK=true
python3 - "$BROKER_INSTALLED" "$ACTIVATION_LIVE" "$TRUSTED_ROOT_INSTALLED" <<'PY' || VALIDATE_OK=false
import importlib.util, os, pathlib, sys
broker_path, activation_path, trusted_root_path = sys.argv[1:4]
spec = importlib.util.spec_from_file_location("rad_release", broker_path)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
# Point the loaded module at the paths this run actually used (matters for
# the test harness; in a real run these already equal the module's own
# hardcoded constants).
module.ACTIVATION = pathlib.Path(activation_path)
module.TRUSTED_ROOT = pathlib.Path(trusted_root_path)
if os.environ.get("RAD_INSTALL_ALLOW_NON_ROOT") == "1":
    # Test-only: protected() requires uid==0 ownership, which a non-root
    # test harness can never have. A real run (root, real /etc paths) does
    # not take this branch and gets the real, unweakened check.
    module.protected = lambda path: None
module.validate_activation()
print("validate_activation(): OK")
PY
check "installed broker's own validate_activation() passes against the real installed files" "$VALIDATE_OK"
[[ "$VALIDATE_OK" == "true" ]] || fail_and_rollback "post-install validate_activation() failed - rolling back."

echo
echo "== Result: $PASS passed, $FAIL failed =="
echo "Backups:  $BACKUP_DIR/{rad-release.py,trusted_root.jsonl,activation.json}.pre-install-$STAMP"
echo "Installed and validated. No service was restarted and no deployment was triggered by this script."
