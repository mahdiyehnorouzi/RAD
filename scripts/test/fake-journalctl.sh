#!/usr/bin/env bash
# Minimal fake `journalctl` for local testing — just tails the fake service's log.
set -euo pipefail
STATE_DIR="${FAKE_SYSTEMD_STATE_DIR:?set FAKE_SYSTEMD_STATE_DIR}"
tail -n 100 "${STATE_DIR}/rad-api.log" 2>/dev/null || true
