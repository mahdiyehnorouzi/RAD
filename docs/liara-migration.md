# Liara and Cloudflare frontend deploys — removed

Storefront and admin production hosting moved to the self-hosted VPS.
The repository no longer contains the Liara or Cloudflare Workers deploy
automation.

Removed:

- `.github/workflows/deploy-storefront-liara.yml`
- `.github/workflows/deploy-admin-liara.yml`
- `.github/workflows/release.yml` (Cloudflare deploy on version tags)
- `scripts/deploy-storefront-liara.sh`, `scripts/deploy-admin-liara.sh`
- `scripts/deploy-storefront-cloudflare.sh`, `scripts/deploy-admin-cloudflare.sh`
- `scripts/deploy-release.sh`
- `apps/storefront/liara.json`, `apps/admin/liara.json`
- `apps/*/.env.production.liara.example`

Production releases are `.github/workflows/deploy.yml`, which calls
`deploy-api-vps.yml` and `deploy-frontend-vps.yml`. See
`docs/cicd-pipeline.md`.

This cleanup did not change the VPS, database host, GitHub secrets, or
GitHub environments. `LIARA_BUILD=1` is still the Dockerfiles' switch for
Next.js `output: "standalone"`. The name is unchanged so the image build
stays the same. `npm run build:vinext` and the Workers config files are
still in the repo and still run in CI; they are not a deploy path.

Do not recreate `LIARA_API_TOKEN` or `CLOUDFLARE_API_TOKEN` usage from this
document. Those secrets were not deleted.
