# Storefront + Admin: Liara -> VPS deployment plan

Branch: `feat/vps-frontend-migration`. Status: **design only — nothing deployed,
no DNS changed, no production service touched.**

## 1. Fact classification

Per request, every infrastructure claim below is tagged:

- **(1) Verified from repository** — read directly from committed/working-tree code in this session.
- **(2) Previously observed on VPS** — reported by the user from direct VPS inspection (`docker ps`, a prior S3 test); not independently re-checked by this session (no SSH/VPS tool available here).
- **(3) Historical documentation** — from `docs/backend-vps-deployment-audit.md`, dated 2026-10-18. A snapshot, not current state.
- **(4) Currently unverified** — no source in this session confirms this either way; must be checked on the VPS before cutover.

| Fact | Status |
|---|---|
| Storefront/admin are Next.js 16.3.2, App Router, with `apps/storefront/Dockerfile` and `apps/admin/Dockerfile` already producing standalone-server images | (1) |
| Frontends talk to the API via server-side `API_URL` only; no secrets in frontend env vars; CORS is exact-origin-matched; cookies are host-only (no domain attr) | (1) |
| No live payment gateway exists in `apps/api` (manual card + receipt-upload + admin review); `PAYMENT_MODE=gateway` throws today | (1) |
| Existing GHCR build-and-push pattern for both apps (`deploy-storefront-liara.yml`, `deploy-admin-liara.yml`) and for the API (`deploy-api-vps.yml`'s SSH stage/deploy/rollback pattern) | (1) |
| SeaweedFS is running on the VPS as 5 containers: `seaweedfs_master_1`, `seaweedfs_volume_1`, `seaweedfs_filer_1`, `seaweedfs_s3_1`, `seaweedfs_webdav_1` | (2) |
| An authenticated S3 upload/download test against that SeaweedFS succeeded at some point, prior to a subsequent storage reconfiguration | (2) — the *current* post-reconfiguration state of that path is (4) |
| PostgreSQL stays on Liara (`rad-db`, `olympus.liara.cloud:31444`) and must not move | (3) + user instruction — treated as a hard constraint regardless of current verification |
| The NestJS API is already reachable from both frontend domains via `/backend/health` in production | (3) — likely still true but not re-checked this session; (4) for *current* status |
| API was running under PM2 in dev/watch mode with known hardening gaps (short JWT secret, schema drift, missing Cloudinary env) as of 2026-10-18 | (3) — explicitly **not** assumed current per your correction; treated as "may or may not still be true" |
| VPS has ~2GB RAM / 4GB swap / 18GB disk / ~5GB free, as stated in the original task brief | (4) — brief itself says "these may have changed, recheck" |
| Current actual free RAM/disk/CPU, current `docker stats` for the SeaweedFS containers, current PM2 process mode for the API, current Nginx config contents for the frontend domains, current DNS records | (4) — all require direct VPS access this session does not have |

**Net effect on this design:** I designed the frontend Compose/Nginx/CI to be self-contained and additive — it assumes nothing about SeaweedFS's health, doesn't touch Postgres, and doesn't touch the API's existing PM2 process or Nginx server block for `api.rad-object.com`. But the capacity numbers in §2 are explicitly conditional on (4) items — **someone with VPS access must run the commands in §2 before approving cutover.**

## 2. Resource & capacity assessment (conditional — verify before cutover)

Budget per service (based on this repo's actual standalone-build Next.js apps, not generic estimates):

| Service | Expected RSS | Compose limit set |
|---|---|---|
| `rad-storefront` container | ~120–250MB idle, bursts under load | `mem_limit: 384m` |
| `rad-admin` container | ~100–200MB idle (lighter app, staff-only traffic) | `mem_limit: 384m` |
| Existing API (PM2) | per `docs/backend-vps-deployment-audit.md`: one Node process | not managed by this Compose file |
| Existing SeaweedFS (5 containers) | unknown — (4), must be read from `docker stats` | not managed by this Compose file |
| Existing Nginx | small, <50MB typically | n/a |

On a host with the brief's stated 2GB RAM, adding ~500–750MB of frontend containers on top of an already-running API + 5 SeaweedFS containers is **plausible but tight**, and swap must not be relied on for steady-state (per your own rule — swap masks the problem, it doesn't fix it).

**Before approving cutover, run on the VPS and report back:**
```bash
free -h
df -h /
docker stats --no-stream
```
If free RAM after `storefront`+`admin` start is consistently <300MB with the SeaweedFS stack and API running, the minimum recommended action is a **RAM upgrade (4GB)** rather than deploying anyway — this matches the brief's own instruction not to deploy under-resourced. I am not claiming this upgrade is needed; I'm flagging it as the decision gate once real numbers come back, since the VPS tool isn't available in this session to get them myself.

## 3. Files added in this change

- `docker-compose.frontend-vps.yml` — storefront + admin services, images pulled from GHCR, ports bound to `127.0.0.1` only, per-container memory/CPU limits, health checks, log rotation. Does not define `postgres`/`seaweedfs`/`api` — those are managed separately and untouched.
- `deploy/nginx/rad-storefront.conf` — reference server blocks for `rad-object.com` (apex -> `www` redirect) and `www.rad-object.com`, reverse-proxying to `127.0.0.1:3100`. Immutable `_next/static/` cached hard; everything else `no-store`.
- `deploy/nginx/rad-admin.conf` — reference server block for `admin.rad-object.com` -> `127.0.0.1:3101`, with `noindex` and stricter frame/referrer headers since it's staff-only.
- `.github/workflows/deploy-frontend-vps.yml` — builds both images on GitHub-hosted runners (reusing the existing GHCR build pattern, since Liara's own remote build already timed out on this monorepo) and, only on manual dispatch with `operation: deploy` against a new `production-frontend-vps` environment, SSHes in to `docker compose pull && up -d` and verifies container health. Push-to-main only builds/publishes — never auto-deploys.

Neither Nginx file is installed or reloaded by anything in this repo. Neither existing Liara workflow is modified, disabled, or raced against.

## 4. Required environment variables (names only — no values here)

**Storefront** (`.env.storefront.production` on the VPS, not committed):
- `API_URL` — server-only, points at `https://api.rad-object.com`
- `CATALOG_SOURCE`, `RAD_PROXY_TIMING` — as today
- `NODE_ENV=production`

**Baked in at build time (GitHub Actions `vars`, not secrets — they're public by design)**:
- `NEXT_PUBLIC_SITE_URL` — must become `https://www.rad-object.com`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

**Admin** (`.env.admin.production`): `API_URL`, `NODE_ENV=production`. Build-time: `NEXT_PUBLIC_STOREFRONT_URL=https://www.rad-object.com`.

**New GitHub secrets needed** (mirroring the API's pattern): `RAD_FRONTEND_SSH_PRIVATE_KEY`, `RAD_FRONTEND_SSH_KNOWN_HOSTS` — can reuse the same VPS host key already verified for the API deploy if the same deploy user/key is reused, or a dedicated key if you want separation of blast radius (recommended: dedicated, least-privilege user that can only `docker compose` in `/root/rad-frontend-deploy`, not root — this is a recommendation, not implemented, since it requires VPS-side user provisioning I can't do from here).

**API side** — `apps/api/.env.production.vps.example` already has `STOREFRONT_ORIGIN`/`ADMIN_ORIGIN` placeholders for CORS; these need to be set to `https://www.rad-object.com` / `https://admin.rad-object.com` once the VPS frontends are live, matching whatever the API's actual CORS allowlist is at cutover time (unverified current state, see §1).

## 5. Pre-cutover verification (no DNS change yet)

Once images are built and a human has started the containers manually on the VPS for the first time (this workflow's `deploy` dispatch, or by hand), verify with `curl --resolve` against the VPS IP without touching public DNS:
```bash
curl --resolve www.rad-object.com:443:46.34.163.16 https://www.rad-object.com/ -I
curl --resolve admin.rad-object.com:443:46.34.163.16 https://admin.rad-object.com/ -I
```
Then walk the checklist in the original task brief (homepage, PDP, cart, checkout, admin login/dashboard, image/video loading, mobile viewport, auth persistence) against those `--resolve`'d requests before changing any A/CNAME record.

## 6. Rollback

Containers are stateless and disposable: `docker compose -f docker-compose.frontend-vps.yml down` removes them without touching Postgres, SeaweedFS, or the API. DNS is the actual cutover switch and is **not changed by this workflow at all** — reverting to Liara is simply "don't repoint DNS" or "repoint it back," which stays entirely manual and outside CI, exactly as the brief requires ("preserve the ability to revert to Liara until the new infrastructure is stable").

## 7. What this plan deliberately does not do

- Does not modify `apps/api/src/*` or touch the payment flow — Part 2 of the audit found no gateway exists to fix, so no change is proposed there.
- Does not install, reconfigure, or validate SeaweedFS — that's (2)/(4) territory this session can't verify directly; it's treated as an existing, out-of-scope dependency.
- Does not change `/etc/nginx/sites-enabled/rad-api` or any existing server block.
- Does not run `nginx -t`/reload, start containers, or touch DNS — all of that needs explicit approval plus the real capacity numbers from §2.
