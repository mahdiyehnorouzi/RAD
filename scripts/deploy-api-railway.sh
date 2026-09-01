#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

echo "Creating PostgreSQL database (skip if it already exists)..."
railway add --database postgres || true

railway variables set \
  NODE_ENV=production \
  RUN_SEED=true \
  ADMIN_ORIGIN="${ADMIN_ORIGIN:-https://rad-admin.rad-studio-admin.workers.dev}" \
  STOREFRONT_ORIGIN="${STOREFRONT_ORIGIN:-https://rad-studio-ceramic.rad-studio-admin.workers.dev}"

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

railway up --detach

if [[ -z "${API_URL:-}" ]]; then
  API_URL="$(railway domain list --json 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);const row=(Array.isArray(j)?j:j.domains||[]).find(x=>x.serviceName==='rad-api-web'||x.type==='service');const url=row?.domain||row?.url||'';if(url)console.log(url.startsWith('http')?url:'https://'+url)}catch{}})")"
fi

if [[ -n "${API_URL:-}" ]]; then
  echo ""
  echo "API deployed at: ${API_URL}"
  echo "Update apps/admin/wrangler.jsonc:"
  echo "  \"API_URL\": \"${API_URL}\""
  echo ""
  echo "Then redeploy admin:"
  echo "  npm run deploy:admin"
else
  echo ""
  echo "Deployment started. Run 'railway domain' to get the public URL,"
  echo "then set API_URL in apps/admin/wrangler.jsonc and redeploy admin."
fi
