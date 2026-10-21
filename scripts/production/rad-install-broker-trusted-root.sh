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
# Rollback is a single trap on EXIT/INT/TERM/ERR (set -E propagates ERR
# into functions and command substitutions), not scattered explicit calls:
# any unexpected failing command, or Ctrl-C/SIGTERM at any point after
# modifications begin, runs the exact same handler a planned failure does.
# The handler is a no-op if nothing was written yet (a pre-install check
# failing just exits cleanly). Per file it tracks whether that file
# existed before this run: if it did, rollback restores it from the
# backup taken in step 2; if it didn't (a brand-new install), rollback
# removes it instead of leaving an orphaned new file. The handler disarms
# itself (`trap -`) as its first line, so a second failure or signal
# during rollback itself cannot recurse into it - it is instead reported
# as an INCOMPLETE ROLLBACK with the exact backup paths for manual
# recovery, never silently swallowed. A normal, successful run disarms the
# trap entirely before exiting, so success never triggers rollback.
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

set -Eeuo pipefail

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
BROKER_EXISTED_BEFORE=false
TRUSTED_ROOT_EXISTED_BEFORE=false
[[ -f "$BROKER_INSTALLED" ]] && { cp -p "$BROKER_INSTALLED" "$BACKUP_DIR/rad-release.py.pre-install-$STAMP"; BROKER_EXISTED_BEFORE=true; }
[[ -f "$TRUSTED_ROOT_INSTALLED" ]] && { cp -p "$TRUSTED_ROOT_INSTALLED" "$BACKUP_DIR/trusted_root.jsonl.pre-install-$STAMP"; TRUSTED_ROOT_EXISTED_BEFORE=true; }
cp -p "$ACTIVATION_LIVE" "$BACKUP_DIR/activation.json.pre-install-$STAMP"
echo "Backed up current state with suffix: pre-install-$STAMP"

# --- Unified rollback: one trap, covers unexpected errors and signals -----
# alike, from the moment modifications begin. See the header comment for
# the design; this is intentionally the ONLY place rollback happens -
# every install step below just does its work (or calls abort), and lets
# this handler decide what to roll back based on what actually changed.
MODIFICATIONS_STARTED=false
ROLLBACK_IN_PROGRESS=false
BROKER_TOUCHED=false
TRUSTED_ROOT_TOUCHED=false
ACTIVATION_TOUCHED=false
BROKER_TMP=""
TRUSTED_ROOT_TMP=""
ACTIVATION_TMP=""

cleanup_on_signal() {
  # $? is only meaningful for EXIT/ERR (the failing command's own status);
  # INT/TERM are asynchronous signals with no such status, so the trap
  # registrations below pass the conventional 128+signum explicitly rather
  # than relying on whatever $? happened to be at the moment the signal
  # arrived.
  local exit_code="${1:-$?}"
  # Disarm immediately: prevents this handler from recursing into itself
  # if a command inside it fails, or if a second signal arrives mid-rollback.
  trap - EXIT INT TERM ERR

  # Always remove our own stray temp files, even if nothing was swapped
  # into a live path yet - harmless either way, never partial/live state.
  [[ -n "$BROKER_TMP" && -e "$BROKER_TMP" ]] && rm -f "$BROKER_TMP" 2>/dev/null
  [[ -n "$TRUSTED_ROOT_TMP" && -e "$TRUSTED_ROOT_TMP" ]] && rm -f "$TRUSTED_ROOT_TMP" 2>/dev/null
  [[ -n "$ACTIVATION_TMP" && -e "$ACTIVATION_TMP" ]] && rm -f "$ACTIVATION_TMP" 2>/dev/null

  if [[ "$MODIFICATIONS_STARTED" != "true" ]]; then
    # Pre-install check failed, or we were interrupted before touching any
    # live path - nothing to roll back.
    exit "$exit_code"
  fi

  if [[ "$ROLLBACK_IN_PROGRESS" == "true" ]]; then
    # We were already rolling back when this fired again - do not recurse.
    echo "FATAL: failure during rollback itself. Manual recovery required from:" >&2
    echo "  $BACKUP_DIR/{rad-release.py,trusted_root.jsonl,activation.json}.pre-install-$STAMP" >&2
    exit 3
  fi
  ROLLBACK_IN_PROGRESS=true

  echo "Interrupted or failed after modifications began - rolling back..." >&2
  local rollback_failed=false

  if [[ "$BROKER_TOUCHED" == "true" ]]; then
    if [[ "$BROKER_EXISTED_BEFORE" == "true" ]]; then
      if install_root 0755 "$BACKUP_DIR/rad-release.py.pre-install-$STAMP" "$BROKER_INSTALLED" 2>/dev/null; then
        echo "  Restored broker from backup." >&2
      else
        echo "  FAILED to restore broker from backup." >&2
        rollback_failed=true
      fi
    else
      if rm -f "$BROKER_INSTALLED" 2>/dev/null; then
        echo "  Removed newly-installed broker (none existed before this run)." >&2
      else
        echo "  FAILED to remove newly-installed broker." >&2
        rollback_failed=true
      fi
    fi
  fi

  if [[ "$TRUSTED_ROOT_TOUCHED" == "true" ]]; then
    if [[ "$TRUSTED_ROOT_EXISTED_BEFORE" == "true" ]]; then
      if install_root 0644 "$BACKUP_DIR/trusted_root.jsonl.pre-install-$STAMP" "$TRUSTED_ROOT_INSTALLED" 2>/dev/null; then
        echo "  Restored trusted root from backup." >&2
      else
        echo "  FAILED to restore trusted root from backup." >&2
        rollback_failed=true
      fi
    else
      if rm -f "$TRUSTED_ROOT_INSTALLED" 2>/dev/null; then
        echo "  Removed newly-installed trusted root (none existed before this run)." >&2
      else
        echo "  FAILED to remove newly-installed trusted root." >&2
        rollback_failed=true
      fi
    fi
  fi

  if [[ "$ACTIVATION_TOUCHED" == "true" ]]; then
    # activation.json is required to already exist (checked in step 1), so
    # it is always "restore from backup," never "remove."
    if install_root 0600 "$BACKUP_DIR/activation.json.pre-install-$STAMP" "$ACTIVATION_LIVE" 2>/dev/null; then
      echo "  Restored activation.json from backup." >&2
    else
      echo "  FAILED to restore activation.json from backup." >&2
      rollback_failed=true
    fi
  fi

  if [[ "$rollback_failed" == "true" ]]; then
    echo "INCOMPLETE ROLLBACK: one or more files could not be restored automatically." >&2
    echo "Backups remain at: $BACKUP_DIR/{rad-release.py,trusted_root.jsonl,activation.json}.pre-install-$STAMP" >&2
    echo "Compare current state against those backups and restore by hand." >&2
    exit 2
  fi

  echo "ROLLED BACK to pre-install-$STAMP state." >&2
  exit "$exit_code"
}
trap 'cleanup_on_signal "$?"' EXIT
trap 'cleanup_on_signal "$?"' ERR
trap 'cleanup_on_signal 130' INT
trap 'cleanup_on_signal 143' TERM

MODIFICATIONS_STARTED=true

# --- 3. Atomic install of whichever files were requested ------------------
if [[ -n "${NEW_BROKER_SOURCE:-}" ]]; then
  NEW_BROKER_SHA="$(sha256sum "$NEW_BROKER_SOURCE" | awk '{print $1}')"
  BROKER_TMP="$(mktemp "$(dirname "$BROKER_INSTALLED")/.rad-release.py.XXXXXX")"
  cp "$NEW_BROKER_SOURCE" "$BROKER_TMP"
  [[ "$(sha256sum "$BROKER_TMP" | awk '{print $1}')" == "$NEW_BROKER_SHA" ]] || abort "copied broker hash mismatch before install - refusing."
  chmod 0755 "$BROKER_TMP"; [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]] || chown root:root "$BROKER_TMP"
  mv -f "$BROKER_TMP" "$BROKER_INSTALLED"
  BROKER_TOUCHED=true
  BROKER_TMP=""
  echo "Installed broker: $BROKER_INSTALLED (sha256 $NEW_BROKER_SHA)"
fi

# Test-only synchronization point (never set in a real run): lets the test
# harness send a signal at a precise, deterministic moment - right after
# the broker is installed but before the trusted root step - instead of
# racing against real timing. See scripts/test/test-install-broker-trusted-root.sh.
if [[ -n "${RAD_INSTALL_TEST_PAUSE_AFTER_BROKER:-}" ]]; then
  touch "${RAD_INSTALL_TEST_PAUSE_AFTER_BROKER}.ready"
  waited=0
  while [[ ! -e "$RAD_INSTALL_TEST_PAUSE_AFTER_BROKER" && $waited -lt 50 ]]; do
    sleep 0.1
    waited=$(( waited + 1 ))
  done
fi
if [[ -n "${NEW_TRUSTED_ROOT_SOURCE:-}" ]]; then
  NEW_TRUSTED_ROOT_SHA="$(sha256sum "$NEW_TRUSTED_ROOT_SOURCE" | awk '{print $1}')"
  TRUSTED_ROOT_TMP="$(mktemp "$(dirname "$TRUSTED_ROOT_INSTALLED")/.trusted_root.jsonl.XXXXXX")"
  cp "$NEW_TRUSTED_ROOT_SOURCE" "$TRUSTED_ROOT_TMP"
  [[ "$(sha256sum "$TRUSTED_ROOT_TMP" | awk '{print $1}')" == "$NEW_TRUSTED_ROOT_SHA" ]] || abort "copied trusted root hash mismatch before install - refusing."
  chmod 0644 "$TRUSTED_ROOT_TMP"; [[ "${RAD_INSTALL_ALLOW_NON_ROOT:-}" == "1" ]] || chown root:root "$TRUSTED_ROOT_TMP"
  mv -f "$TRUSTED_ROOT_TMP" "$TRUSTED_ROOT_INSTALLED"
  TRUSTED_ROOT_TOUCHED=true
  TRUSTED_ROOT_TMP=""
  echo "Installed trusted root: $TRUSTED_ROOT_INSTALLED (sha256 $NEW_TRUSTED_ROOT_SHA)"
fi

# --- 4. Update ONLY the two hash fields in activation.json, atomically -----
ACTIVATION_TMP="$(mktemp "$(dirname "$ACTIVATION_LIVE")/.activation.json.XXXXXX")"
python3 - "$ACTIVATION_LIVE" "$ACTIVATION_TMP" "$BROKER_INSTALLED" "$TRUSTED_ROOT_INSTALLED" <<'PY'
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
ACTIVATION_TOUCHED=true
ACTIVATION_TMP=""
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
[[ "$VALIDATE_OK" == "true" ]] || abort "post-install validate_activation() failed."

# Success: disarm the trap BEFORE exiting, so this clean exit can never be
# mistaken for a failure and trigger a rollback of a successful install.
trap - EXIT INT TERM ERR

echo
echo "== Result: $PASS passed, $FAIL failed =="
echo "Backups:  $BACKUP_DIR/{rad-release.py,trusted_root.jsonl,activation.json}.pre-install-$STAMP"
echo "Installed and validated. No service was restarted and no deployment was triggered by this script."
