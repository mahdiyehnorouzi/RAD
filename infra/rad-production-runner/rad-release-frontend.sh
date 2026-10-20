#!/usr/bin/env bash
#
# Narrowly-scoped privileged wrapper, installed at /usr/local/bin/rad-release-frontend.sh
# on the production VPS, owned by root, mode 0750 (root:rad-runner), invoked
# ONLY via:
#   rad-runner ALL=(root) NOPASSWD: /usr/local/bin/rad-release-frontend.sh
#
# Security boundary: `rad-runner` must be able to trigger "pull these two
# specific GHCR images (by exact digest) and recreate the matching compose
# service(s)" without ever holding Docker socket access itself (membership
# in the `docker` group is root-equivalent -- this wrapper exists
# specifically so rad-runner never needs it). Everything about *which*
# compose file and *which* service names are legal is hardcoded; the only
# caller-supplied values are the two image references (already
# digest-pinned by the calling workflow, see deploy-frontend-vps.yml) and
# the space-separated list of services to touch, and that list is checked
# against a fixed allowlist before use.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "ERROR: must run as root (invoke via sudo)." >&2
  exit 1
fi

readonly COMPOSE_DIR="/root/rad-frontend-deploy"
readonly COMPOSE_FILE="docker-compose.frontend-vps.yml"
readonly ALLOWED_SERVICES=("storefront" "admin")

STOREFRONT_IMAGE_REF="${1:-}"   # ghcr.io/<owner>/rad-storefront@sha256:<digest>, or "-" if not touched
ADMIN_IMAGE_REF="${2:-}"        # ghcr.io/<owner>/rad-admin@sha256:<digest>, or "-" if not touched
SERVICES="${3:-}"               # space-separated subset of ALLOWED_SERVICES

if [[ -z "$SERVICES" ]]; then
  echo "Usage: rad-release-frontend.sh <storefront-image-ref|-> <admin-image-ref|-> <services>" >&2
  exit 1
fi

for svc in $SERVICES; do
  ok=false
  for allowed in "${ALLOWED_SERVICES[@]}"; do
    [[ "$svc" == "$allowed" ]] && ok=true
  done
  if [[ "$ok" != "true" ]]; then
    echo "ERROR: '${svc}' is not one of the allowed compose services (${ALLOWED_SERVICES[*]})." >&2
    exit 1
  fi
done

# Image refs must be pinned by digest, never a mutable tag -- blocks a
# caller (or a compromised build job) from asking this privileged wrapper
# to deploy "whatever :latest happens to resolve to right now".
for ref in "$STOREFRONT_IMAGE_REF" "$ADMIN_IMAGE_REF"; do
  [[ "$ref" == "-" ]] && continue
  if ! [[ "$ref" =~ ^ghcr\.io/[a-z0-9-]+/rad-(storefront|admin)@sha256:[0-9a-f]{64}$ ]]; then
    echo "ERROR: image ref must be ghcr.io/<owner>/rad-(storefront|admin)@sha256:<64-hex-digest>, got '${ref}'." >&2
    exit 1
  fi
done

cd "$COMPOSE_DIR"

env_args=()
[[ "$STOREFRONT_IMAGE_REF" != "-" ]] && env_args+=("STOREFRONT_IMAGE_REF=${STOREFRONT_IMAGE_REF}")
[[ "$ADMIN_IMAGE_REF" != "-" ]] && env_args+=("ADMIN_IMAGE_REF=${ADMIN_IMAGE_REF}")

# shellcheck disable=SC2086
env "${env_args[@]}" docker compose -f "$COMPOSE_FILE" pull $SERVICES
# shellcheck disable=SC2086
env "${env_args[@]}" docker compose -f "$COMPOSE_FILE" up -d --no-deps $SERVICES
