#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_SERVICE="${RAILWAY_API_SERVICE:-rad-api-web}"
API_URL="${API_URL:-}"

if ! command -v railway >/dev/null 2>&1; then
  echo "Installing Railway CLI..."
  npm install -g @railway/cli
fi

if ! railway whoami >/dev/null 2>&1; then
  echo "Log in to Railway first:"
  railway login
fi

if [[ ! -f .railway/project.json ]]; then
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
  ADMIN_ORIGIN="${ADMIN_ORIGIN:-https://rad-admin.rad-studio.workers.dev}" \
  STOREFRONT_ORIGIN="${STOREFRONT_ORIGIN:-https://rad-studio.rad-studio.workers.dev}" \
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
