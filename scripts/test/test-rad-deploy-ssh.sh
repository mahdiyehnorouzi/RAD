#!/usr/bin/env bash
#
# Local, isolated test of the rad-deploy forced-command SSH path:
# rad-deploy-shell.sh (the restricted login shell) and
# rad-deploy-ssh-entrypoint.sh (the forced command itself), exercised with
# the EXACT invocation shape OpenSSH's sshd actually uses for an
# authorized_keys `command=` restriction - re-execing the account's login
# shell as `<shell> -c "<forced command>"`, with the client's original
# request available only via $SSH_ORIGINAL_COMMAND.
#
# This does not start a real sshd (not available/safe to configure in this
# sandbox) - it drives the two scripts the same way sshd's documented
# behavior would, which is the one part of this design a real sshd
# instance would otherwise be needed to prove. A fake `sudo` on PATH (same
# technique as scripts/test/fake-systemctl.sh for a fake systemctl) strips
# the real privilege boundary so this can run as an ordinary user; it does
# not change rad-deploy-ssh-entrypoint.sh's own invocation of
# `sudo -n "$BROKER"` in any way - only what "sudo" resolves to in PATH.
set -euo pipefail

# macOS's bsdtar otherwise embeds AppleDouble/xattr metadata as extra tar
# members for any file that has resource-fork/xattr data, which would make
# this test's own fixture archives fail the entrypoint's own "exactly the
# expected entries" check for reasons that have nothing to do with the
# behavior under test. No-op on Linux (where the real production transport
# tar is actually built, by a GitHub-hosted ubuntu-latest runner).
export COPYFILE_DISABLE=1

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SHELL_SCRIPT="${ROOT}/scripts/production/rad-deploy-shell.sh"
ENTRYPOINT="${ROOT}/scripts/production/rad-deploy-ssh-entrypoint.sh"
TMPROOT="$(mktemp -d)"
trap 'rm -rf "$TMPROOT"' EXIT

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

FAKEBIN="${TMPROOT}/fakebin"
mkdir -p "$FAKEBIN"
cat > "${FAKEBIN}/sudo" <<'EOF'
#!/usr/bin/env bash
# Fake sudo for this test only: strips a leading "-n" and execs the rest
# directly as the current (unprivileged) user. rad-deploy-ssh-entrypoint.sh
# is not changed in any way by this - only what "sudo" resolves to on PATH.
if [[ "${1:-}" == "-n" ]]; then shift; fi
exec "$@"
EOF
chmod +x "${FAKEBIN}/sudo"
export PATH="${FAKEBIN}:${PATH}"

INCOMING_BASE="${TMPROOT}/incoming"
mkdir -p "$INCOMING_BASE"
export RAD_DEPLOY_INCOMING_BASE="$INCOMING_BASE"
export RAD_DEPLOY_VALIDATOR="${ROOT}/scripts/production/rad_deploy_entrypoint.py"
export RAD_DEPLOY_MAX_TRANSPORT_BYTES=20000 # small but big enough for tar's own block padding on a two/three-file archive

BROKER_RECEIVED="${TMPROOT}/broker-received.json"
FAKE_BROKER="${TMPROOT}/fake-rad-release"
cat > "$FAKE_BROKER" <<EOF
#!/usr/bin/env bash
set -euo pipefail
# scripts/production/rad_release.py itself requires len(sys.argv) == 1 (no
# arguments at all) for this exact invocation shape, and rad-deploy.sudoers'
# trailing "" is sudoers syntax for "zero arguments required", not a literal
# argument - assert that here so a regression back to "sudo -n \$BROKER ''"
# (passing a real, if empty, extra argv entry) fails this test loudly
# instead of silently rejecting every real deploy in production.
if [[ \$# -ne 0 ]]; then
  echo "fake broker: expected zero arguments, got \$# (\$*)" >&2
  exit 1
fi
cat > "${BROKER_RECEIVED}"
if [[ -n "\${FAKE_BROKER_FAIL:-}" ]]; then
  echo "fake broker: simulated rejection" >&2
  exit 1
fi
echo "fake broker: release verified healthy"
EOF
chmod +x "$FAKE_BROKER"
export RAD_DEPLOY_BROKER="$FAKE_BROKER"
export RAD_DEPLOY_ENTRYPOINT_PATH="$ENTRYPOINT"

make_valid_tar() {
  local out="$1" kind="$2"
  local work
  work="$(mktemp -d)"
  echo '{"ok":true}' > "${work}/release.json"
  echo 'sigstore-bundle' > "${work}/release.sigstore.json"
  local files=(release.json release.sigstore.json)
  if [[ "$kind" == "api" ]]; then
    echo 'fake-gzip-bytes' > "${work}/api-release.tar.gz"
    files+=(api-release.tar.gz)
  fi
  tar -cf "$out" -C "$work" "${files[@]}"
  rm -rf "$work"
}

reset_markers() { rm -f "$BROKER_RECEIVED"; unset FAKE_BROKER_FAIL || true; }

### --- rad-deploy-shell.sh: the restricted login shell on its own ---

run_shell() {
  # $1 = SSH_ORIGINAL_COMMAND to export, $2.. = argv for rad-deploy-shell.sh
  local original_command="$1"; shift
  SSH_ORIGINAL_COMMAND="$original_command" "$SHELL_SCRIPT" "$@"
}

reset_markers
VALID_COMMAND="deploy kind=frontend commit=$(printf '%040d' 1) run_id=11 run_attempt=1"
if make_valid_tar "${TMPROOT}/valid-frontend.tar" frontend \
  && run_shell "$VALID_COMMAND" -c "$ENTRYPOINT" < "${TMPROOT}/valid-frontend.tar" > "${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=true
else
  ok=false
fi
check "shell execs the entrypoint for the exact '-c <entrypoint>' invocation sshd uses" "$ok"
check "  ...and the entrypoint actually ran (broker received a request)" "$( [[ -f "$BROKER_RECEIVED" ]] && echo true || echo false )"

reset_markers
if run_shell "$VALID_COMMAND" -c "/bin/sh" </dev/null >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "shell refuses -c with any path other than the fixed entrypoint" "$ok"
check "  ...and never ran the entrypoint" "$( [[ ! -f "$BROKER_RECEIVED" ]] && echo true || echo false )"

reset_markers
if run_shell "$VALID_COMMAND" </dev/null >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "shell refuses a bare interactive invocation (no -c at all)" "$ok"

reset_markers
if run_shell "$VALID_COMMAND" -c "$ENTRYPOINT" "extra-arg" </dev/null >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "shell refuses extra arguments beyond -c <entrypoint>" "$ok"

### --- rad-deploy-ssh-entrypoint.sh: the forced command on its own ---

reset_markers
if make_valid_tar "${TMPROOT}/valid-api.tar" api \
  && SSH_ORIGINAL_COMMAND="deploy kind=api commit=$(printf '%040d' 2) run_id=42 run_attempt=3" \
     "$ENTRYPOINT" < "${TMPROOT}/valid-api.tar" > "${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=true
else
  ok=false
fi
check "entrypoint accepts a well-formed kind=api request and invokes the broker" "$ok"
if [[ -f "$BROKER_RECEIVED" ]]; then
  check "  ...broker request has the expected kind/commit/run_id/run_attempt" \
    "$(node -e "
      const r = JSON.parse(require('fs').readFileSync('${BROKER_RECEIVED}', 'utf8'));
      const ok = r.kind === 'api' && r.commit === '$(printf '%040d' 2)' && r.run_id === 42 && r.run_attempt === 3 && /^release-/.test(r.stage);
      console.log(ok);
    ")"
else
  check "  ...broker request has the expected kind/commit/run_id/run_attempt" "false"
fi

reset_markers
if SSH_ORIGINAL_COMMAND="rm -rf /" "$ENTRYPOINT" </dev/null >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "entrypoint rejects a command that doesn't match the fixed grammar" "$ok"
check "  ...and never invoked the broker" "$( [[ ! -f "$BROKER_RECEIVED" ]] && echo true || echo false )"

reset_markers
if SSH_ORIGINAL_COMMAND="" "$ENTRYPOINT" </dev/null >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "entrypoint rejects a missing/empty SSH_ORIGINAL_COMMAND" "$ok"

reset_markers
# Built directly with Python's tarfile (not the system `tar` binary) so this
# exact malicious shape - release.sigstore.json present, plus one entry
# trying to traverse outside the staging directory - is unambiguous and
# portable across GNU/BSD tar differences.
TRAVERSAL_TAR="${TMPROOT}/traversal.tar"
python3 - "$TRAVERSAL_TAR" <<'PY'
import sys, tarfile, io
path = sys.argv[1]
with tarfile.open(path, "w") as archive:
    info = tarfile.TarInfo(name="../../etc/passwd")
    info.size = 1
    archive.addfile(info, io.BytesIO(b"x"))
    info2 = tarfile.TarInfo(name="release.sigstore.json")
    info2.size = 1
    archive.addfile(info2, io.BytesIO(b"x"))
PY
if SSH_ORIGINAL_COMMAND="deploy kind=frontend commit=$(printf '%040d' 3) run_id=1 run_attempt=1" \
   "$ENTRYPOINT" < "$TRAVERSAL_TAR" >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "entrypoint rejects a path-traversal entry inside the upload" "$ok"
check "  ...and never invoked the broker" "$( [[ ! -f "$BROKER_RECEIVED" ]] && echo true || echo false )"

reset_markers
head -c 40000 /dev/zero > "${TMPROOT}/oversized.tar" # bigger than RAD_DEPLOY_MAX_TRANSPORT_BYTES=20000
if SSH_ORIGINAL_COMMAND="deploy kind=frontend commit=$(printf '%040d' 4) run_id=1 run_attempt=1" \
   "$ENTRYPOINT" < "${TMPROOT}/oversized.tar" >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
check "entrypoint rejects an upload larger than the transport size cap" "$ok"

reset_markers
export FAKE_BROKER_FAIL=1
if make_valid_tar "${TMPROOT}/valid-frontend-2.tar" frontend \
  && SSH_ORIGINAL_COMMAND="deploy kind=frontend commit=$(printf '%040d' 5) run_id=1 run_attempt=1" \
     "$ENTRYPOINT" < "${TMPROOT}/valid-frontend-2.tar" >"${TMPROOT}/out.log" 2>"${TMPROOT}/err.log"; then
  ok=false
else
  ok=true
fi
unset FAKE_BROKER_FAIL
check "entrypoint propagates the broker's own failure/rejection as its own exit code" "$ok"

echo
echo "rad-deploy SSH path: ${PASS} passed, ${FAIL} failed."
[[ "$FAIL" -eq 0 ]]
