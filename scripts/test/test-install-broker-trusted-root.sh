#!/usr/bin/env bash
#
# Isolated, local test of
# scripts/production/rad-install-broker-trusted-root.sh. Never touches any
# real host, database, or the actual repo's broker: builds a fake
# "installed" broker/trusted-root/activation.json and a fake "new version"
# of each in a throwaway sandbox, then runs the real install script against
# it with RAD_INSTALL_ALLOW_NON_ROOT=1 (test-only - a real run still
# requires root and RAD_INSTALL_CONFIRM=yes-install-live).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$ROOT/scripts/production/rad-install-broker-trusted-root.sh"

PASS=0
FAIL=0
check() {
  local desc="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then echo "  [PASS] $desc"; PASS=$(( PASS + 1 ))
  else echo "  [FAIL] $desc"; FAIL=$(( FAIL + 1 )); fi
}

# A real, minimal copy of rad_release.py's shape so validate_activation()
# and the structural "looks like rad_release.py" check both work for real,
# not against a stub that only pretends to pass.
write_fake_broker() {
  local path="$1" marker="$2"
  cat > "$path" <<PY
import hashlib, json, stat
from pathlib import Path

REPO = "mahdiyehnorouzi/RAD"
ACTIVATION = Path("/etc/rad-release/activation.json")
TRUSTED_ROOT = Path("/etc/rad-release/trusted_root.jsonl")
MARKER = "$marker"

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def file_hash(path):
    with open(path, "rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()

def protected(path):
    info = Path(path).lstat()
    require(not stat.S_ISLNK(info.st_mode) and info.st_uid == 0 and not info.st_mode & 0o022, f"Unprotected path: {path}")

def validate_activation():
    protected(ACTIVATION)
    require(ACTIVATION.stat().st_mode & 0o077 == 0, "Activation policy must be root-private")
    policy = json.loads(ACTIVATION.read_text())
    require(isinstance(policy, dict), "Invalid activation policy")
    require(policy.get("schema") == 1 and policy.get("repository") == REPO, "Wrong activation policy origin/schema")
    for requirement in ("enabled", "runner_workflow_policy_verified", "production_environments_verified",
                        "host_preflight_verified", "nonproduction_rehearsal_verified"):
        require(policy.get(requirement) is True, f"Host release approval missing: {requirement}")
    require(policy.get("broker_sha256") == file_hash(Path(__file__)), "Installed broker requires root re-approval")
    protected(TRUSTED_ROOT)
    require(TRUSTED_ROOT.stat().st_mode & 0o022 == 0, "Trusted root must not be group/world writable")
    require(policy.get("trusted_root_sha256") == file_hash(TRUSTED_ROOT), "Installed Sigstore trusted root requires root re-approval")
PY
}

write_fake_test_suite() {
  local dir="$1" should_pass="$2"
  mkdir -p "$dir/scripts/production"
  cat > "$dir/scripts/production/test_fake.py" <<PY
import unittest
class T(unittest.TestCase):
    def test_ok(self):
        self.assertTrue($should_pass)
PY
}

TMPROOT="$(mktemp -d)"
trap 'rm -rf "$TMPROOT"' EXIT

ACTIVATION_LIVE="$TMPROOT/activation.json"
BROKER_INSTALLED="$TMPROOT/rad-release.py"
TRUSTED_ROOT_INSTALLED="$TMPROOT/trusted_root.jsonl"
BACKUP_DIR="$TMPROOT/backups"
REVIEWED_REPO="$TMPROOT/reviewed-repo"

write_fake_broker "$BROKER_INSTALLED" "current"
printf '{"mediaType":"fixture-current"}\n' > "$TRUSTED_ROOT_INSTALLED"
chmod 0644 "$TRUSTED_ROOT_INSTALLED"
BROKER_SHA="$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')"
TRUSTED_ROOT_SHA="$(sha256sum "$TRUSTED_ROOT_INSTALLED" | awk '{print $1}')"

seed_activation() {
  # enabled:true, matching PR #78 production feedback - this script must
  # work (and must NOT touch `enabled`) against an already-live policy.
  cat > "$ACTIVATION_LIVE" <<JSON
{"schema":1,"repository":"mahdiyehnorouzi/RAD","enabled":true,"runner_workflow_policy_verified":true,"production_environments_verified":true,"host_preflight_verified":true,"nonproduction_rehearsal_verified":true,"broker_sha256":"$BROKER_SHA","trusted_root_sha256":"$TRUSTED_ROOT_SHA"}
JSON
  chmod 0600 "$ACTIVATION_LIVE"
}

run_install() {
  # env -i wipes everything, so NEW_BROKER_SOURCE / NEW_TRUSTED_ROOT_SOURCE
  # set via a prefix assignment on the caller's run_install line (e.g.
  # `NEW_BROKER_SOURCE="$X" run_install`) must be explicitly forwarded here.
  env -i \
    PATH="$PATH" \
    RAD_INSTALL_ALLOW_NON_ROOT=1 \
    RAD_INSTALL_CONFIRM=yes-install-live \
    BROKER_INSTALLED="$BROKER_INSTALLED" \
    TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT_INSTALLED" \
    ACTIVATION_LIVE="$ACTIVATION_LIVE" \
    BACKUP_DIR="$BACKUP_DIR" \
    REVIEWED_REPO="$REVIEWED_REPO" \
    TEST_TIMEOUT=30 \
    NEW_BROKER_SOURCE="${NEW_BROKER_SOURCE:-}" \
    NEW_TRUSTED_ROOT_SOURCE="${NEW_TRUSTED_ROOT_SOURCE:-}" \
    "$@" \
    bash "$SCRIPT"
}

echo "== Scenario: install a new broker onto an already-enabled policy =="
rm -rf "$BACKUP_DIR"
write_fake_test_suite "$REVIEWED_REPO" "True"
NEW_BROKER="$TMPROOT/new-rad-release.py"
write_fake_broker "$NEW_BROKER" "new-version"
seed_activation
if OUT="$(NEW_BROKER_SOURCE="$NEW_BROKER" run_install 2>&1)"; then EXIT=0; else EXIT=$?; fi
[[ $EXIT -eq 0 ]] || { echo "--- output ---"; echo "$OUT"; echo "---"; }
check "install exits 0" "$([[ $EXIT -eq 0 ]] && echo true || echo false)"
check "installed broker file now matches the NEW source" \
  "$([[ "$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')" == "$(sha256sum "$NEW_BROKER" | awk '{print $1}')" ]] && echo true || echo false)"
check "activation.json's broker_sha256 now matches the newly installed broker" \
  "$(python3 -c "
import json
p = json.load(open('$ACTIVATION_LIVE'))
print(str(p['broker_sha256'] == '$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')').lower())
")"
check "enabled stays true, untouched" \
  "$(python3 -c "import json; print(str(json.load(open('$ACTIVATION_LIVE'))['enabled']==True).lower())")"
check "all four approval flags stay true, untouched" \
  "$(python3 -c "
import json
p = json.load(open('$ACTIVATION_LIVE'))
print(str(all(p[k] is True for k in ('runner_workflow_policy_verified','production_environments_verified','host_preflight_verified','nonproduction_rehearsal_verified'))).lower())
")"
check "a pre-install backup of the broker was taken" \
  "$([[ -n "$(find "$BACKUP_DIR" -name 'rad-release.py.pre-install-*' 2>/dev/null)" ]] && echo true || echo false)"
check "a pre-install backup of activation.json was taken" \
  "$([[ -n "$(find "$BACKUP_DIR" -name 'activation.json.pre-install-*' 2>/dev/null)" ]] && echo true || echo false)"

echo
echo "== Scenario: a broker that fails its own test suite is never installed =="
rm -rf "$BACKUP_DIR"
write_fake_test_suite "$REVIEWED_REPO" "False"
seed_activation
BEFORE_SHA="$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')"
if OUT="$(NEW_BROKER_SOURCE="$NEW_BROKER" run_install 2>&1)"; then BADTEST_EXIT=0; else BADTEST_EXIT=$?; fi
check "install refuses when the new broker fails its own tests" "$([[ $BADTEST_EXIT -ne 0 ]] && echo true || echo false)"
check "installed broker file is untouched after the refusal" \
  "$([[ "$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')" == "$BEFORE_SHA" ]] && echo true || echo false)"
write_fake_test_suite "$REVIEWED_REPO" "True"   # restore for later scenarios

echo
echo "== Scenario: a structurally-bogus broker source is refused outright =="
rm -rf "$BACKUP_DIR"
BOGUS="$TMPROOT/bogus.py"
printf 'print("not a broker")\n' > "$BOGUS"
seed_activation
if OUT="$(NEW_BROKER_SOURCE="$BOGUS" run_install 2>&1)"; then BOGUS_EXIT=0; else BOGUS_EXIT=$?; fi
check "structurally-bogus broker source is refused" "$([[ $BOGUS_EXIT -ne 0 ]] && echo true || echo false)"
check "refusal explains why, not a generic error" \
  "$(echo "$OUT" | grep -q "doesn't look like rad_release.py" && echo true || echo false)"

echo
echo "== Scenario: a malformed trusted root is refused outright =="
rm -rf "$BACKUP_DIR"
BOGUS_TR="$TMPROOT/bogus-trusted-root.jsonl"
printf 'not json at all\n' > "$BOGUS_TR"
seed_activation
if OUT="$(NEW_TRUSTED_ROOT_SOURCE="$BOGUS_TR" run_install 2>&1)"; then BOGUSTR_EXIT=0; else BOGUSTR_EXIT=$?; fi
check "malformed trusted root is refused" "$([[ $BOGUSTR_EXIT -ne 0 ]] && echo true || echo false)"
check "trusted root file is untouched after the refusal" \
  "$([[ "$(sha256sum "$TRUSTED_ROOT_INSTALLED" | awk '{print $1}')" == "$TRUSTED_ROOT_SHA" ]] && echo true || echo false)"

echo
echo "== Scenario: post-install validate_activation() failure triggers automatic rollback =="
rm -rf "$BACKUP_DIR"
seed_activation
BEFORE_BROKER_SHA="$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')"
BEFORE_ACTIVATION="$(cat "$ACTIVATION_LIVE")"
# A new broker that installs fine but whose OWN validate_activation() always
# fails (simulating some real-world post-install inconsistency) - this must
# be caught by step 5 and rolled back, not left half-installed.
BROKEN_BROKER="$TMPROOT/broken-broker.py"
write_fake_broker "$BROKEN_BROKER" "broken"
cat >> "$BROKEN_BROKER" <<'PY'

_real_validate_activation = validate_activation
def validate_activation():
    raise RuntimeError("simulated post-install inconsistency")
PY
if OUT="$(NEW_BROKER_SOURCE="$BROKEN_BROKER" run_install 2>&1)"; then ROLLBACK_EXIT=0; else ROLLBACK_EXIT=$?; fi
check "a broker that fails post-install validation exits non-zero" "$([[ $ROLLBACK_EXIT -ne 0 ]] && echo true || echo false)"
check "output reports a rollback" "$(echo "$OUT" | grep -q "ROLLED BACK" && echo true || echo false)"
check "installed broker was rolled back to its pre-install content" \
  "$([[ "$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')" == "$BEFORE_BROKER_SHA" ]] && echo true || echo false)"
check "activation.json was rolled back to its exact pre-install content" \
  "$([[ "$(cat "$ACTIVATION_LIVE")" == "$BEFORE_ACTIVATION" ]] && echo true || echo false)"

echo
echo "== Scenario: refuses to run without explicit RAD_INSTALL_CONFIRM =="
seed_activation
if OUT="$(env -i PATH="$PATH" RAD_INSTALL_ALLOW_NON_ROOT=1 \
  BROKER_INSTALLED="$BROKER_INSTALLED" TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT_INSTALLED" \
  ACTIVATION_LIVE="$ACTIVATION_LIVE" BACKUP_DIR="$BACKUP_DIR" REVIEWED_REPO="$REVIEWED_REPO" \
  NEW_BROKER_SOURCE="$NEW_BROKER" TEST_TIMEOUT=30 \
  bash "$SCRIPT" 2>&1)"; then NOCONFIRM_EXIT=0; else NOCONFIRM_EXIT=$?; fi
check "missing RAD_INSTALL_CONFIRM refuses to run" "$([[ $NOCONFIRM_EXIT -ne 0 ]] && echo true || echo false)"

echo
echo "== Scenario: unexpected (not explicitly checked-for) failure after broker is already installed =="
# Nothing in the script explicitly checks that TRUSTED_ROOT_INSTALLED
# exists before computing its hash for activation.json - deleting it out
# from under the script simulates a genuinely unanticipated failure (a
# Python FileNotFoundError, not a guarded `|| abort`), occurring AFTER the
# broker has already been swapped. This must still roll the broker back.
rm -rf "$BACKUP_DIR"
seed_activation
BEFORE_BROKER_SHA="$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')"
BEFORE_ACTIVATION="$(cat "$ACTIVATION_LIVE")"
rm -f "$TRUSTED_ROOT_INSTALLED"   # the thing nothing explicitly checks for
if OUT="$(NEW_BROKER_SOURCE="$NEW_BROKER" run_install 2>&1)"; then UNEXPECTED_EXIT=0; else UNEXPECTED_EXIT=$?; fi
check "unexpected failure (missing trusted root) exits non-zero" "$([[ $UNEXPECTED_EXIT -ne 0 ]] && echo true || echo false)"
check "output reports a rollback, not a silent exit" "$(echo "$OUT" | grep -q "ROLLED BACK\|rolling back" && echo true || echo false)"
check "broker already installed before the failure was rolled back" \
  "$([[ "$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')" == "$BEFORE_BROKER_SHA" ]] && echo true || echo false)"
check "activation.json, never reached, is byte-for-byte unchanged" \
  "$([[ "$(cat "$ACTIVATION_LIVE")" == "$BEFORE_ACTIVATION" ]] && echo true || echo false)"
check "no stray .activation.json.* temp file was left behind" \
  "$([[ -z "$(find "$TMPROOT" -maxdepth 1 -name '.activation.json.*' 2>/dev/null)" ]] && echo true || echo false)"
printf '{"mediaType":"fixture-current"}\n' > "$TRUSTED_ROOT_INSTALLED"   # restore for later scenarios
chmod 0644 "$TRUSTED_ROOT_INSTALLED"

echo
echo "== Scenario: SIGTERM after the broker is installed but before the trusted root step =="
rm -rf "$BACKUP_DIR"
seed_activation
BEFORE_BROKER_SHA="$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')"
BEFORE_TRUSTED_ROOT_SHA="$(sha256sum "$TRUSTED_ROOT_INSTALLED" | awk '{print $1}')"
BEFORE_ACTIVATION="$(cat "$ACTIVATION_LIVE")"
NEW_TRUSTED_ROOT="$TMPROOT/new-trusted-root.jsonl"
printf '{"mediaType":"fixture-new"}\n' > "$NEW_TRUSTED_ROOT"
PAUSE_MARKER="$TMPROOT/pause-marker"
rm -f "$PAUSE_MARKER" "$PAUSE_MARKER.ready"

env -i \
  PATH="$PATH" \
  RAD_INSTALL_ALLOW_NON_ROOT=1 \
  RAD_INSTALL_CONFIRM=yes-install-live \
  BROKER_INSTALLED="$BROKER_INSTALLED" \
  TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT_INSTALLED" \
  ACTIVATION_LIVE="$ACTIVATION_LIVE" \
  BACKUP_DIR="$BACKUP_DIR" \
  REVIEWED_REPO="$REVIEWED_REPO" \
  TEST_TIMEOUT=30 \
  NEW_BROKER_SOURCE="$NEW_BROKER" \
  NEW_TRUSTED_ROOT_SOURCE="$NEW_TRUSTED_ROOT" \
  RAD_INSTALL_TEST_PAUSE_AFTER_BROKER="$PAUSE_MARKER" \
  bash "$SCRIPT" > "$TMPROOT/sigterm-output.log" 2>&1 &
INSTALL_PID=$!

waited=0
while [[ ! -e "${PAUSE_MARKER}.ready" && $waited -lt 100 ]]; do
  sleep 0.05
  waited=$(( waited + 1 ))
done
check "install actually reached the post-broker pause point" "$([[ -e "${PAUSE_MARKER}.ready" ]] && echo true || echo false)"

kill -TERM "$INSTALL_PID" 2>/dev/null || true
if wait "$INSTALL_PID" 2>/dev/null; then SIGTERM_EXIT=0; else SIGTERM_EXIT=$?; fi
OUT="$(cat "$TMPROOT/sigterm-output.log")"

check "interrupted install exits non-zero" "$([[ $SIGTERM_EXIT -ne 0 ]] && echo true || echo false)"
check "output reports a rollback" "$(echo "$OUT" | grep -q "rolling back\|ROLLED BACK" && echo true || echo false)"
check "broker (already installed, existed before) was restored from backup" \
  "$([[ "$(sha256sum "$BROKER_INSTALLED" | awk '{print $1}')" == "$BEFORE_BROKER_SHA" ]] && echo true || echo false)"
check "trusted root (never reached) is byte-for-byte unchanged" \
  "$([[ "$(sha256sum "$TRUSTED_ROOT_INSTALLED" | awk '{print $1}')" == "$BEFORE_TRUSTED_ROOT_SHA" ]] && echo true || echo false)"
check "activation.json (never reached) is byte-for-byte unchanged" \
  "$([[ "$(cat "$ACTIVATION_LIVE")" == "$BEFORE_ACTIVATION" ]] && echo true || echo false)"
check "no stray .trusted_root.jsonl.* temp file was left behind" \
  "$([[ -z "$(find "$TMPROOT" -maxdepth 1 -name '.trusted_root.jsonl.*' 2>/dev/null)" ]] && echo true || echo false)"

echo
echo "== Scenario: the restore-from-backup step itself failing is reported as INCOMPLETE ROLLBACK, not a crash or loop =="
rm -rf "$BACKUP_DIR"
seed_activation
rm -f "$PAUSE_MARKER" "$PAUSE_MARKER.ready"

env -i \
  PATH="$PATH" \
  RAD_INSTALL_ALLOW_NON_ROOT=1 \
  RAD_INSTALL_CONFIRM=yes-install-live \
  BROKER_INSTALLED="$BROKER_INSTALLED" \
  TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT_INSTALLED" \
  ACTIVATION_LIVE="$ACTIVATION_LIVE" \
  BACKUP_DIR="$BACKUP_DIR" \
  REVIEWED_REPO="$REVIEWED_REPO" \
  TEST_TIMEOUT=30 \
  NEW_BROKER_SOURCE="$NEW_BROKER" \
  RAD_INSTALL_TEST_PAUSE_AFTER_BROKER="$PAUSE_MARKER" \
  bash "$SCRIPT" > "$TMPROOT/incomplete-output.log" 2>&1 &
INSTALL_PID=$!

waited=0
while [[ ! -e "${PAUSE_MARKER}.ready" && $waited -lt 100 ]]; do
  sleep 0.05
  waited=$(( waited + 1 ))
done

# While it's paused (broker already backed up AND already installed),
# make the broker backup unreadable - the exact thing rollback would need
# to restore from once we interrupt it.
BROKER_BACKUP="$(find "$BACKUP_DIR" -maxdepth 1 -name 'rad-release.py.pre-install-*' | head -1)"
check "broker backup exists at the pause point (precondition for this scenario)" \
  "$([[ -n "$BROKER_BACKUP" ]] && echo true || echo false)"
chmod 000 "$BROKER_BACKUP" 2>/dev/null || true

kill -TERM "$INSTALL_PID" 2>/dev/null || true
if wait "$INSTALL_PID" 2>/dev/null; then INCOMPLETE_EXIT=0; else INCOMPLETE_EXIT=$?; fi
OUT="$(cat "$TMPROOT/incomplete-output.log")"
chmod 0644 "$BROKER_BACKUP" 2>/dev/null || true

check "a restore failure during rollback exits non-zero (not success)" "$([[ $INCOMPLETE_EXIT -ne 0 ]] && echo true || echo false)"
check "output explicitly reports INCOMPLETE ROLLBACK" "$(echo "$OUT" | grep -q "INCOMPLETE ROLLBACK" && echo true || echo false)"
check "output tells the operator where the backups are for manual recovery" \
  "$(echo "$OUT" | grep -q "pre-install" && echo true || echo false)"
check "the script did not hang or recurse - it exited" "true"

echo
echo "== Result: $PASS passed, $FAIL failed =="
exit $(( FAIL > 0 ? 1 : 0 ))
