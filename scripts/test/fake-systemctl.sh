#!/usr/bin/env bash
#
# Minimal fake `systemctl` for exercising scripts/lib/*.sh locally, without
# a real systemd (this sandbox's PID 1 isn't systemd, so the real binary
# just fails with "Host is down"). Reads/writes a plain-text fake unit
# file whose path comes from $FAKE_SYSTEMD_UNIT_FILE, and tracks a single
# fake service's PID/log under $FAKE_SYSTEMD_STATE_DIR. Only implements
# the exact subcommands scripts/lib/*.sh actually calls.
set -euo pipefail

UNIT_FILE="${FAKE_SYSTEMD_UNIT_FILE:?set FAKE_SYSTEMD_UNIT_FILE}"
STATE_DIR="${FAKE_SYSTEMD_STATE_DIR:?set FAKE_SYSTEMD_STATE_DIR}"
mkdir -p "$STATE_DIR"
PIDFILE="${STATE_DIR}/rad-api.pid"
LOGFILE="${STATE_DIR}/rad-api.log"

get_prop() {
  local key="$1"
  grep -E "^${key}=" "$UNIT_FILE" 2>/dev/null | head -1 | cut -d= -f2-
}

is_running() {
  [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null
}

cmd="${1:-}"; shift || true
case "$cmd" in
  list-unit-files)
    # scripts call: list-unit-files <service> --no-legend
    echo "rad-api.service"
    ;;
  show)
    # scripts call: show -p <Prop> --value <service>  (order: -p PROP then --value then unit)
    prop=""
    for a in "$@"; do
      if [[ "$a" == "-p" ]]; then shift_next_is_prop=1; continue; fi
      if [[ "${shift_next_is_prop:-0}" == "1" ]]; then prop="$a"; shift_next_is_prop=0; fi
    done
    case "$prop" in
      EnvironmentFiles) get_prop "EnvironmentFile" ;;
      WorkingDirectory) get_prop "WorkingDirectory" ;;
      FragmentPath) echo "$UNIT_FILE" ;;
      MainPID|ExecMainPID) [[ -f "$PIDFILE" ]] && cat "$PIDFILE" || echo 0 ;;
      *) echo "" ;;
    esac
    ;;
  daemon-reload)
    : # no-op; fake always re-reads the unit file live
    ;;
  restart)
    if is_running; then
      kill "$(cat "$PIDFILE")" 2>/dev/null || true
      for _ in 1 2 3 4 5; do is_running || break; sleep 0.2; done
    fi
    WORKDIR="$(get_prop WorkingDirectory)"
    ENVFILE="$(get_prop EnvironmentFile)"
    if [[ ! -d "$WORKDIR" ]]; then
      echo "fake-systemctl: WorkingDirectory ${WORKDIR} does not exist" >&2
      exit 1
    fi
    if [[ ! -f "${WORKDIR}/dist/main.js" ]]; then
      echo "fake-systemctl: ${WORKDIR}/dist/main.js missing" >&2
      exit 1
    fi
    (
      cd "$WORKDIR"
      if [[ -f "$ENVFILE" ]]; then
        set -a
        # shellcheck disable=SC1090
        source "$ENVFILE"
        set +a
      fi
      exec node dist/main.js
    ) >"$LOGFILE" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 0.3
    ;;
  is-active)
    if is_running; then echo "active"; else echo "inactive"; exit 3; fi
    ;;
  status)
    if is_running; then
      echo "● rad-api.service - fake (pid $(cat "$PIDFILE"))"
    else
      echo "○ rad-api.service - fake (not running)"
    fi
    tail -n 20 "$LOGFILE" 2>/dev/null || true
    ;;
  *)
    echo "fake-systemctl: unhandled subcommand '$cmd $*'" >&2
    exit 1
    ;;
esac
