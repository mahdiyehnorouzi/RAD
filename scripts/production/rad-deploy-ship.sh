#!/usr/bin/env bash
#
# Client half of the VPS release transport. Runs on the GitHub-hosted
# runner, never on the VPS. The remote forced command is unchanged: this
# only replaces the unbounded `tar | ssh` pipeline with a byte-deadline
# copier. See scripts/production/rad_deploy_transport.py.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec python3 -B "${ROOT}/scripts/production/rad_deploy_transport.py" ship "$@"
