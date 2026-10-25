#!/usr/bin/env bash
#
# Isolated, local test of scripts/production/rad-activation-prep.sh.
# Never touches any real host, database, or the actual repo's broker/test
# suites: builds a fully fake "reviewed repo", "installed broker",
# "activation dir", env file, and fake pg_dump/pg_restore/psql/timeout on a
# throwaway PATH (same technique as scripts/test/fake-systemctl.sh), then
# runs the real rad-activation-prep.sh against that sandbox with
# RAD_PREP_ALLOW_NON_ROOT=1 (test-only - a real run still requires root).
#
# This exercises rad-activation-prep.sh's OWN logic (path wiring, the
# database-host safety guard, PostgreSQL-16 check, candidate-flag
# preservation, trusted-root hashing, cleanup-on-interrupt) - it does not
# re-validate the real broker test suites' content, which are already
# covered by their own test files.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SCRIPT="$ROOT/scripts/production/rad-activation-prep.sh"

PASS=0
FAIL=0
check() {
  local desc="$1" ok="$2"
  if [[ "$ok" == "true" ]]; then echo "  [PASS] $desc"; PASS=$(( PASS + 1 ))
  else echo "  [FAIL] $desc"; FAIL=$(( FAIL + 1 )); fi
}

TMPROOT="$(mktemp -d)"
trap 'rm -rf "$TMPROOT"' EXIT

# --- Fake "reviewed repo": just enough to exercise step 5's wiring --------
REVIEWED="$TMPROOT/reviewed-repo"
mkdir -p "$REVIEWED/scripts/production" "$REVIEWED/scripts/test"
printf 'fake broker v1\n' > "$REVIEWED/scripts/production/rad_release.py"
cat > "$REVIEWED/scripts/production/test_fake.py" <<'PY'
import unittest
class FakeBrokerTests(unittest.TestCase):
    def test_ok(self):
        self.assertTrue(True)
PY
cat > "$REVIEWED/scripts/test/test-rad-deploy-ssh.sh" <<'SH'
#!/usr/bin/env bash
exit "${FAKE_SSH_SUITE_EXIT:-0}"
SH
cat > "$REVIEWED/scripts/test/test-release-pipeline.sh" <<'SH'
#!/usr/bin/env bash
exit "${FAKE_PIPELINE_SUITE_EXIT:-0}"
SH
chmod +x "$REVIEWED/scripts/test/test-rad-deploy-ssh.sh" "$REVIEWED/scripts/test/test-release-pipeline.sh"

INSTALLED_DIR="$TMPROOT/installed"
mkdir -p "$INSTALLED_DIR"
cp "$REVIEWED/scripts/production/rad_release.py" "$INSTALLED_DIR/rad-release.py"

ACTIVATION_DIR="$TMPROOT/etc-rad-release"
mkdir -p "$ACTIVATION_DIR"
TRUSTED_ROOT="$ACTIVATION_DIR/trusted_root.jsonl"
printf '{"mediaType":"fixture"}\n' > "$TRUSTED_ROOT"
chmod 0644 "$TRUSTED_ROOT"
TRUSTED_ROOT_SHA="$(sha256sum "$TRUSTED_ROOT" | awk '{print $1}')"
BROKER_SHA="$(sha256sum "$INSTALLED_DIR/rad-release.py" | awk '{print $1}')"

ACTIVATION_LIVE="$ACTIVATION_DIR/activation.json"

ETC_RAD="$TMPROOT/etc-rad"
mkdir -p "$ETC_RAD"
ENV_FILE="$ETC_RAD/api.env"
printf 'DATABASE_URL="postgresql://prod-user@prod-host:5432/raddb"\n' > "$ENV_FILE"

BACKUP_DIR="$TMPROOT/backups"
RESTORE_DATABASE_URL="postgresql://iso-user@isolated-host:5432/raddb"

# --- Fake pg_dump / pg_restore / psql / timeout ----------------------------
FAKEBIN="$TMPROOT/fakebin"
mkdir -p "$FAKEBIN"

cat > "$FAKEBIN/timeout" <<'SH'
#!/usr/bin/env bash
shift            # drop the duration argument; no real deadline in tests
exec "$@"
SH

cat > "$FAKEBIN/pg_dump" <<'SH'
#!/usr/bin/env bash
[[ "${FAKE_DUMP_FAIL:-}" == "1" ]] && exit 1
for arg in "$@"; do
  case "$arg" in
    --file=*) printf 'fake dump\n' > "${arg#--file=}" ;;
  esac
done
exit 0
SH

cat > "$FAKEBIN/pg_restore" <<'SH'
#!/usr/bin/env bash
[[ "${FAKE_RESTORE_FAIL:-}" == "1" ]] && exit 1
exit 0
SH

cat > "$FAKEBIN/psql" <<'SH'
#!/usr/bin/env bash
url="$1"; shift
mode="" query=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -tAc|-c) mode="$1"; query="$2"; shift 2 ;;
    *) shift ;;
  esac
done
case "$query" in
  *version*)
    if [[ "${FAKE_RESTORE_WRONG_VERSION:-}" == "1" ]]; then
      printf 'PostgreSQL 14.9 on x86_64-pc-linux-gnu\n'
    else
      printf 'PostgreSQL 16.4 on x86_64-pc-linux-gnu\n'
    fi
    ;;
  *Product*)
    if [[ "$url" == *isolated-host* ]]; then
      printf '%s\n' "${FAKE_RESTORE_PRODUCT_COUNT:-5}"
    else
      printf '%s\n' "${FAKE_PROD_PRODUCT_COUNT:-5}"
    fi
    ;;
  *Order*)
    if [[ "$url" == *isolated-host* ]]; then
      printf '%s\n' "${FAKE_RESTORE_ORDER_COUNT:-7}"
    else
      printf '%s\n' "${FAKE_PROD_ORDER_COUNT:-7}"
    fi
    ;;
  *)
    [[ "${FAKE_SCHEMA_RESET_FAIL:-}" == "1" ]] && exit 1
    ;;
esac
exit 0
SH
chmod +x "$FAKEBIN/timeout" "$FAKEBIN/pg_dump" "$FAKEBIN/pg_restore" "$FAKEBIN/psql"

REAL_PATH="$(dirname "$(command -v python3)"):/usr/bin:/bin:/usr/sbin:/sbin"

run_prep() {
  local activation_seed="$1" keep_candidate="${2:-}"
  printf '%s' "$activation_seed" > "$ACTIVATION_LIVE"
  chmod 0600 "$ACTIVATION_LIVE"
  [[ "$keep_candidate" == "keep-candidate" ]] || rm -f "$ACTIVATION_DIR/activation.json.candidate"
  # env -i wipes everything, so any FAKE_* var a caller set via a prefix
  # assignment (e.g. `FAKE_RESTORE_WRONG_VERSION=1 run_prep ...`) must be
  # explicitly forwarded here, or the fake binaries never see it.
  env -i \
    PATH="$FAKEBIN:$REAL_PATH" \
    RAD_PREP_ALLOW_NON_ROOT=1 \
    REVIEWED_REPO="$REVIEWED" \
    BROKER_INSTALLED="$INSTALLED_DIR/rad-release.py" \
    ACTIVATION_DIR="$ACTIVATION_DIR" \
    ACTIVATION_LIVE="$ACTIVATION_LIVE" \
    TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT" \
    ENV_FILE="$ENV_FILE" \
    BACKUP_DIR="$BACKUP_DIR" \
    RESTORE_DATABASE_URL="$RESTORE_DATABASE_URL" \
    DUMP_TIMEOUT=30 RESTORE_TIMEOUT=30 TEST_TIMEOUT=30 \
    FAKE_RESTORE_WRONG_VERSION="${FAKE_RESTORE_WRONG_VERSION:-}" \
    FAKE_DUMP_FAIL="${FAKE_DUMP_FAIL:-}" \
    FAKE_RESTORE_FAIL="${FAKE_RESTORE_FAIL:-}" \
    FAKE_SCHEMA_RESET_FAIL="${FAKE_SCHEMA_RESET_FAIL:-}" \
    FAKE_PROD_PRODUCT_COUNT="${FAKE_PROD_PRODUCT_COUNT:-}" \
    FAKE_PROD_ORDER_COUNT="${FAKE_PROD_ORDER_COUNT:-}" \
    FAKE_RESTORE_PRODUCT_COUNT="${FAKE_RESTORE_PRODUCT_COUNT:-}" \
    FAKE_RESTORE_ORDER_COUNT="${FAKE_RESTORE_ORDER_COUNT:-}" \
    bash "$SCRIPT"
}

disabled_policy() {
  printf '{"schema":1,"repository":"mahdiyehnorouzi/RAD","enabled":false,"runner_workflow_policy_verified":%s,"production_environments_verified":%s,"host_preflight_verified":false,"nonproduction_rehearsal_verified":false,"broker_sha256":"%s","trusted_root_sha256":"%s"}' \
    "${1:-false}" "${2:-false}" "$BROKER_SHA" "$TRUSTED_ROOT_SHA"
}

echo "== Scenario: happy path =="
if OUT="$(run_prep "$(disabled_policy false false)" 2>&1)"; then EXIT=0; else EXIT=$?; fi
[[ $EXIT -eq 0 ]] || { echo "--- happy-path output (unexpected failure) ---"; echo "$OUT"; echo "---"; }
check "happy path exits 0" "$([[ $EXIT -eq 0 ]] && echo true || echo false)"
CANDIDATE_JSON="$(cat "$ACTIVATION_DIR/activation.json.candidate" 2>/dev/null || echo '{}')"
check "candidate sets host_preflight_verified=true" \
  "$(python3 -c "import json,sys;print(str(json.loads('''$CANDIDATE_JSON''').get('host_preflight_verified')==True).lower())")"
check "candidate sets nonproduction_rehearsal_verified=true" \
  "$(python3 -c "import json,sys;print(str(json.loads('''$CANDIDATE_JSON''').get('nonproduction_rehearsal_verified')==True).lower())")"
check "candidate pins trusted_root_sha256 to the installed file's real hash" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('trusted_root_sha256')=='$TRUSTED_ROOT_SHA').lower())")"
check "candidate never sets enabled=true" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('enabled')==False).lower())")"
check "live activation.json is untouched (still enabled:false)" \
  "$(python3 -c "import json;print(str(json.loads(open('$ACTIVATION_LIVE').read()).get('enabled')==False).lower())")"

echo
echo "== Scenario: prior GitHub-side approvals are preserved, not reset or auto-approved =="
# Seed a PRIOR candidate where the operator already approved the two
# GitHub-side flags by hand. A re-run (e.g. just to refresh trusted_root
# pinning) must carry those forward exactly, not wipe them to false.
cat > "$ACTIVATION_DIR/activation.json.candidate" <<JSON
{"schema":1,"repository":"mahdiyehnorouzi/RAD","enabled":false,"runner_workflow_policy_verified":true,"production_environments_verified":true,"host_preflight_verified":false,"nonproduction_rehearsal_verified":false,"migrations_verified":true,"broker_sha256":"stale","trusted_root_sha256":"stale"}
JSON
run_prep "$(disabled_policy false false)" keep-candidate >/dev/null 2>&1 || true
CANDIDATE_JSON="$(cat "$ACTIVATION_DIR/activation.json.candidate")"
check "runner_workflow_policy_verified=true is preserved across a re-run" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('runner_workflow_policy_verified')==True).lower())")"
check "production_environments_verified=true is preserved across a re-run" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('production_environments_verified')==True).lower())")"
check "migrations_verified=true is preserved across a re-run" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('migrations_verified')==True).lower())")"

echo
echo "== Scenario: no prior candidate -> GitHub-side/migration flags start false, never auto-approved =="
rm -f "$ACTIVATION_DIR/activation.json.candidate"
run_prep "$(disabled_policy false false)" >/dev/null 2>&1 || true
CANDIDATE_JSON="$(cat "$ACTIVATION_DIR/activation.json.candidate")"
check "runner_workflow_policy_verified defaults to false, not auto-approved" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('runner_workflow_policy_verified')==False).lower())")"
check "production_environments_verified defaults to false, not auto-approved" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('production_environments_verified')==False).lower())")"
check "migrations_verified defaults to false, not auto-approved" \
  "$(python3 -c "import json;print(str(json.loads('''$CANDIDATE_JSON''').get('migrations_verified')==False).lower())")"

echo
echo "== Scenario: refuses to use the same host for production and restore =="
SAME_HOST_URL="postgresql://iso-user@prod-host:5432/raddb"
OUT="$(env -i PATH="$FAKEBIN:$REAL_PATH" RAD_PREP_ALLOW_NON_ROOT=1 \
  REVIEWED_REPO="$REVIEWED" BROKER_INSTALLED="$INSTALLED_DIR/rad-release.py" \
  ACTIVATION_DIR="$ACTIVATION_DIR" ACTIVATION_LIVE="$ACTIVATION_LIVE" \
  TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT" ENV_FILE="$ENV_FILE" BACKUP_DIR="$BACKUP_DIR" \
  RESTORE_DATABASE_URL="$SAME_HOST_URL" DUMP_TIMEOUT=30 RESTORE_TIMEOUT=30 TEST_TIMEOUT=30 \
  bash "$SCRIPT" 2>&1)" && SAME_HOST_EXIT=0 || SAME_HOST_EXIT=$?
check "same-host RESTORE_DATABASE_URL is refused" "$([[ $SAME_HOST_EXIT -ne 0 ]] && echo true || echo false)"
check "refusal names the actual reason, not a generic error" \
  "$(echo "$OUT" | grep -q "genuinely separate host" && echo true || echo false)"

echo
echo "== Scenario: refuses a non-PostgreSQL-16 isolated instance =="
OUT="$(FAKE_RESTORE_WRONG_VERSION=1 run_prep "$(disabled_policy false false)" 2>&1)" && WRONGVER_EXIT=0 || WRONGVER_EXIT=$?
check "wrong Postgres version on the isolated instance is refused" "$([[ $WRONGVER_EXIT -ne 0 ]] && echo true || echo false)"
check "refusal explains it expects PostgreSQL 16" \
  "$(echo "$OUT" | grep -q "PostgreSQL 16" && echo true || echo false)"

echo
echo "== Scenario: RESTORE_DATABASE_URL is required, not defaulted from production =="
OUT="$(env -i PATH="$FAKEBIN:$REAL_PATH" RAD_PREP_ALLOW_NON_ROOT=1 \
  REVIEWED_REPO="$REVIEWED" BROKER_INSTALLED="$INSTALLED_DIR/rad-release.py" \
  ACTIVATION_DIR="$ACTIVATION_DIR" ACTIVATION_LIVE="$ACTIVATION_LIVE" \
  TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT" ENV_FILE="$ENV_FILE" BACKUP_DIR="$BACKUP_DIR" \
  DUMP_TIMEOUT=30 RESTORE_TIMEOUT=30 TEST_TIMEOUT=30 \
  bash "$SCRIPT" 2>&1)" && NOURL_EXIT=0 || NOURL_EXIT=$?
check "missing RESTORE_DATABASE_URL aborts rather than guessing a target" "$([[ $NOURL_EXIT -ne 0 ]] && echo true || echo false)"
check "refusal explicitly says createdb/dropdb against production is not attempted" \
  "$(echo "$OUT" | grep -q "RESTORE_DATABASE_URL is not set" && echo true || echo false)"

echo
echo "== Scenario: cleanup runs even when the script is interrupted mid-restore =="
cat > "$FAKEBIN/pg_restore" <<'SH'
#!/usr/bin/env bash
sleep 5
SH
chmod +x "$FAKEBIN/pg_restore"
RESET_COUNT_FILE="$TMPROOT/schema-reset-count"
: > "$RESET_COUNT_FILE"
cat > "$FAKEBIN/psql" <<SH
#!/usr/bin/env bash
url="\$1"; shift
mode="" query=""
while [[ \$# -gt 0 ]]; do
  case "\$1" in
    -tAc|-c) mode="\$1"; query="\$2"; shift 2 ;;
    *) shift ;;
  esac
done
case "\$query" in
  *version*) printf 'PostgreSQL 16.4 on x86_64-pc-linux-gnu\n' ;;
  *Product*) printf '5\n' ;;
  *Order*) printf '7\n' ;;
  *) printf 'x\n' >> "$RESET_COUNT_FILE" ;;
esac
exit 0
SH
chmod +x "$FAKEBIN/psql"
printf '%s' "$(disabled_policy false false)" > "$ACTIVATION_LIVE"
chmod 0600 "$ACTIVATION_LIVE"
rm -f "$ACTIVATION_DIR/activation.json.candidate"
env -i \
  PATH="$FAKEBIN:$REAL_PATH" RAD_PREP_ALLOW_NON_ROOT=1 \
  REVIEWED_REPO="$REVIEWED" BROKER_INSTALLED="$INSTALLED_DIR/rad-release.py" \
  ACTIVATION_DIR="$ACTIVATION_DIR" ACTIVATION_LIVE="$ACTIVATION_LIVE" \
  TRUSTED_ROOT_INSTALLED="$TRUSTED_ROOT" ENV_FILE="$ENV_FILE" BACKUP_DIR="$BACKUP_DIR" \
  RESTORE_DATABASE_URL="$RESTORE_DATABASE_URL" DUMP_TIMEOUT=30 RESTORE_TIMEOUT=30 TEST_TIMEOUT=30 \
  bash "$SCRIPT" >/dev/null 2>&1 &
PREP_PID=$!
sleep 0.5
kill -TERM "$PREP_PID" 2>/dev/null || true
wait "$PREP_PID" 2>/dev/null || true
# The reset ran once before the restore attempt (pre-restore reset) and
# again on interruption (the EXIT/INT/TERM trap) — at least two, proving
# the trap fired rather than only the pre-restore reset.
RESET_COUNT="$(wc -l < "$RESET_COUNT_FILE" | tr -d ' ')"
check "interrupted restore still runs the schema-reset cleanup trap (resets: $RESET_COUNT)" \
  "$([[ "$RESET_COUNT" -ge 2 ]] && echo true || echo false)"

echo
echo "== Result: $PASS passed, $FAIL failed =="
exit $(( FAIL > 0 ? 1 : 0 ))
