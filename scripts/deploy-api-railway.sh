#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_SERVICE="${RAILWAY_API_SERVICE:-rad-api-web}"
API_URL="${API_URL:-}"
RAD_VERSION="${RAD_VERSION:-$(tr -d '[:space:]' < "$ROOT/VERSION")}"

if ! command -v railway >/dev/null 2>&1; then
  echo "Installing Railway CLI..."
  npm install -g @railway/cli
fi

# GitHub Actions injects empty strings for missing secrets. Railway treats those as invalid tokens.
if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  unset RAILWAY_TOKEN
fi
if [[ -z "${RAILWAY_API_TOKEN:-}" ]]; then
  unset RAILWAY_API_TOKEN
fi

in_ci() { [[ -n "${CI:-}${GITHUB_ACTIONS:-}" ]]; }

# Project tokens (RAILWAY_TOKEN) are enough for railway up. If both are set, keep the project token
# so a leftover unauthorized account token cannot take over the job.
if [[ -n "${RAILWAY_TOKEN:-}" && -n "${RAILWAY_API_TOKEN:-}" ]]; then
  echo "Using RAILWAY_TOKEN (project token) and ignoring RAILWAY_API_TOKEN."
  unset RAILWAY_API_TOKEN
fi

if in_ci; then
  if [[ -z "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]]; then
    echo "Railway auth is missing."
    echo "Add a GitHub Actions secret, then re-run Release:"
    echo "  RAILWAY_TOKEN     — project token (Project → Settings → Tokens). Deploys with railway up only."
    echo "  RAILWAY_API_TOKEN — account/workspace token (https://railway.com/account/tokens). Needed for link and variables."
    echo "Do not put an account token in RAILWAY_TOKEN; the CLI rejects it."
    exit 1
  fi
elif [[ -z "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]] && ! railway whoami >/dev/null 2>&1; then
  echo "Log in to Railway first:"
  railway login
fi

# Project tokens are bound to one project/environment and only support deploy commands.
if [[ -n "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]]; then
  echo "Deploying API ${RAD_VERSION} to Railway with project token (railway up)..."
  railway up --detach -s "${API_SERVICE}"
  if [[ -n "${API_URL}" ]]; then
    echo ""
    echo "API deploy started at: ${API_URL}"
  else
    echo ""
    echo "API deploy started. Project tokens cannot list domains; API_URL stays as configured."
  fi
  exit 0
fi

if [[ -n "${RAILWAY_PROJECT_ID:-}" ]]; then
  if [[ -n "${RAILWAY_ENVIRONMENT:-}" ]]; then
    railway link --project "${RAILWAY_PROJECT_ID}" --environment "${RAILWAY_ENVIRONMENT}" >/dev/null
  else
    railway link --project "${RAILWAY_PROJECT_ID}" >/dev/null
  fi
elif [[ ! -f .railway/project.json ]]; then
  if in_ci; then
    echo "Set GitHub secret RAILWAY_PROJECT_ID to this Railway project's ID, then re-run."
    echo "Railway dashboard → project → Settings → General → Project ID."
    exit 1
  fi
  railway init --name rad-api
fi

if ! railway service list 2>/dev/null | grep -q "${API_SERVICE}"; then
  echo "Creating API service ${API_SERVICE}..."
  railway add --service "${API_SERVICE}" --json >/dev/null
fi

railway service "${API_SERVICE}"

if ! railway service list 2>/dev/null | grep -qi "postgres"; then
  echo "Creating PostgreSQL database..."
  railway add --database postgres || true
fi

POSTGRES_REF="${RAILWAY_POSTGRES_REF:-Postgres-tb28.DATABASE_URL}"
if railway service list 2>/dev/null | grep -q "Postgres-tb28"; then
  POSTGRES_REF="Postgres-tb28.DATABASE_URL"
elif railway service list 2>/dev/null | grep -q "Postgres"; then
  POSTGRES_REF="Postgres.DATABASE_URL"
fi

railway variables set \
  NODE_ENV=production \
  RUN_SEED=true \
  RAD_VERSION="${RAD_VERSION}" \
  ADMIN_ORIGIN="${ADMIN_ORIGIN:-https://admin.rad-object.com}" \
  STOREFRONT_ORIGIN="${STOREFRONT_ORIGIN:-https://rad-object.com}" \
  "DATABASE_URL=\${{${POSTGRES_REF}}}"

if [[ -n "${JWT_SECRET:-}" ]]; then
  railway variables set "JWT_SECRET=${JWT_SECRET}"
fi

if [[ -n "${ADMIN_EMAIL:-}" ]]; then
  railway variables set "ADMIN_EMAIL=${ADMIN_EMAIL}"
fi

if [[ -n "${ADMIN_PASSWORD:-}" ]]; then
  railway variables set "ADMIN_PASSWORD=${ADMIN_PASSWORD}"
fi

for key in SMTP_HOST SMTP_PORT SMTP_SECURE SMTP_USER SMTP_PASS SMTP_FROM; do
  if [[ -n "${!key:-}" ]]; then
    railway variables set "${key}=${!key}"
  fi
done

echo "Deploying API ${RAD_VERSION} to Railway service ${API_SERVICE}..."
railway up --detach -s "${API_SERVICE}"

if [[ -z "${API_URL}" ]]; then
  API_URL="$(railway domain list --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const rows=Array.isArray(j)?j:(j.domains||[]);const row=rows.find(x=>x.serviceName==='${API_SERVICE}'||x.type==='service');const url=row?.domain||row?.url||'';if(url)console.log(url.startsWith('http')?url:'https://'+url)}catch{}})")"
fi

if [[ -n "${API_URL}" ]]; then
  echo ""
  echo "API deployed at: ${API_URL}"
  echo "Update apps/storefront/wrangler.jsonc and apps/admin/wrangler.jsonc:"
  echo "  \"API_URL\": \"${API_URL}\""
  echo ""
  echo "Then redeploy storefront and admin."
else
  echo ""
  echo "Deployment started. Run 'railway domain -s ${API_SERVICE}' to get the public URL,"
  echo "then set API_URL in wrangler configs and redeploy."
fi
