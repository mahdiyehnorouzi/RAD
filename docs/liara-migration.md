# Storefront & Admin migration: Cloudflare Workers → Liara

This covers everything needed to move `rad-object.com` (storefront) and
`admin.rad-object.com` (admin) off Cloudflare Workers/vinext onto Liara's
Docker platform, while the backend API and database stay on Liara exactly
as they are today.

All repository-side work (Dockerfiles, `liara.json`, health checks, CI
workflows, config) is done and validated (see **Validation** below). The
steps below that touch Liara's console, DNS, or GitHub secrets need your
credentials and have **not** been executed — nothing here claims a live
deployment has happened.

## 1. What changed in the repo

- `apps/storefront/Dockerfile`, `apps/admin/Dockerfile` — multi-stage
  builds producing a Next.js `output: "standalone"` server, built from the
  **repo root** (so npm workspace deps resolve). Run on the Node.js
  runtime — no Wrangler, no Workers.
- `apps/storefront/liara.json`, `apps/admin/liara.json` — Liara's Docker
  platform config (`app`, `port`, `build.dockerfile`, `healthCheck`).
- `apps/storefront/app/api/health/route.ts`, `apps/admin/app/api/health/route.ts`
  — a minimal, auth-free, API-free `GET` returning `{ok:true}`, used by
  Liara's health check so a slow/unreachable backend API is never mistaken
  for a dead frontend container.
- `apps/storefront/next.config.mjs`, `apps/admin/next.config.mjs` — gained
  `output: "standalone"`, but **only** when `LIARA_BUILD=1` is set, so
  `vinext build` (the existing Cloudflare path) is completely unaffected.
- `apps/storefront/package.json` — added `sharp` as a real dependency.
  Next's built-in image optimizer requires it when self-hosted on Node;
  Cloudflare's Workers build instead used Cloudflare's own Image Resizing
  binding (`wrangler.jsonc`'s `images.binding`), so this was never needed
  there.
- `.dockerignore` (repo root).
- `scripts/deploy-storefront-liara.sh`, `scripts/deploy-admin-liara.sh` —
  thin wrappers around `liara deploy`, mirroring the existing
  `deploy-*-cloudflare.sh` scripts' style.
- `.github/workflows/deploy-storefront-liara.yml`,
  `.github/workflows/deploy-admin-liara.yml` — independent workflows, each
  gated on the existing CI checks, each only triggered by changes to its
  own app (plus shared `packages/`), with `workflow_dispatch` for manual
  runs.
- `.github/workflows/ci.yml` — added two build-matrix entries that run the
  plain `next build` (Docker/Liara path) for storefront and admin, so this
  path is validated on every PR too, independent of the vinext build.
- `.env.production.liara.example` in each app — documents the required
  runtime vars (set in Liara's env panel) vs. build-time
  `NEXT_PUBLIC_*` vars (set via `liara.json`'s `build.args`).

**Nothing Cloudflare-related was removed.** `vinext`, `wrangler.jsonc`,
`build:vinext`/`deploy:cloudflare` scripts, and the existing
`deploy-*-cloudflare.sh` / `release.yml` workflow are all untouched and
still deployable, so Cloudflare remains available as a rollback path until
the Liara deployment is verified in production.

## 2. What did NOT need to change (verified by inspection + a live test)

- **The `/backend` proxy, `client.ts`/`api.ts`, timeouts, request IDs,
  diagnostics**: all standard Fetch API (`Request`/`Response`/
  `AbortController`/`crypto.randomUUID()`), no Cloudflare-specific API
  anywhere. I built both Docker images and ran them locally — `/backend/ok`
  proxied correctly (with `x-request-id` and, with `RAD_PROXY_TIMING=1`,
  `server-timing`), and the hung-upstream case returned `504` after the
  same 20s timeout, verified under the plain Node.js runtime exactly like
  it was under `wrangler dev`/workerd in the earlier stabilization pass.
- **Cookies**: `apps/api/src/common/cookies.ts`'s `sessionCookieOptions()`
  sets no `Domain` attribute, so the session cookie is already host-only,
  scoped to whichever origin served the `/backend` request. This was
  already host-agnostic and needs no change for the new domains.
- **CORS**: `apps/api/src/common/cors-origins.ts` is an explicit allowlist
  of origins (`rad-object.com`, `www.rad-object.com`, `admin.rad-object.com`,
  plus the `*.workers.dev` Cloudflare subdomains) — unaffected by where the
  frontend *runs*, since it matches on the request's `Origin` header, not
  on infrastructure. The `*.workers.dev` entries can be removed once the
  Cloudflare deployment is retired, but leave them until then (rollback
  path).
- **Workspace packages** (`@rad/types`, `@rad/ui`, `@rad/i18n`,
  `@rad/artworks`): consumed as source via `transpilePackages`, no separate
  build step — confirmed by inspecting their `package.json` and by the
  Docker builds succeeding.

## 3. Ambiguity I'm flagging, not deciding

**`rad-object.com` vs `www.rad-object.com`.** Your target architecture says
`rad-object.com → Liara Storefront`. But
[`apps/storefront/next.config.mjs`](../apps/storefront/next.config.mjs)
has an existing, deliberate redirect (`rad-object.com` → `https://www.rad-object.com/...`,
permanent), and the existing Cloudflare deploy script defaults
`NEXT_PUBLIC_SITE_URL` to `https://www.rad-object.com`. I did not touch
this redirect — changing the canonical domain is a product/SEO decision
(it affects every indexed URL, every shared link, and the existing 301s
Google has already cached), not an infrastructure one, so I'm not making
it silently. Two options, your call:

- **Keep `www` as canonical** (recommended if you want zero SEO disruption):
  point Liara's custom domain at `rad-object.com`, keep the existing
  redirect, and the app still ultimately serves from `www.rad-object.com`.
  No code change needed beyond what's already here.
- **Make the bare domain canonical**: remove the redirect in
  `next.config.mjs` and update `NEXT_PUBLIC_SITE_URL`/the liara.json build
  arg to `https://rad-object.com`. I can do this on request, but it's a
  one-way SEO change I won't make without explicit sign-off.

The `liara.json` and `.env.production.liara.example` I wrote default to the
bare domain to match your stated target — adjust before deploying if you
choose to keep `www`.

## 4. DNS and domain setup (do this after each app is deployed and verified on its default `*.liara.run` subdomain)

For **each** app (storefront and admin are separate Liara apps, separate
domains, separate DNS setup):

1. In the Liara console, open the app → **دامنه‌ها** (Domains) → **افزودن
   دامنه** (Add domain) → enter `rad-object.com` (storefront) or
   `admin.rad-object.com` (admin).
2. Liara gives you three DNS records to create:
   - `ALIAS`/`CNAME` — points the domain at Liara's serving infrastructure.
   - `TXT` — proves ownership for the initial domain connection.
   - `CNAME` (ACME DNS-01 challenge) — lets Liara issue/renew your SSL
     certificate automatically via Let's Encrypt, without needing port
     80/443 reachable during issuance.
3. **If Cloudflare stays as your DNS provider** (just DNS, not proxying):
   add exactly these three records in Cloudflare's dashboard, and set each
   to **DNS only** (grey cloud, not the orange "Proxied" cloud). Do **not**
   enable Cloudflare's proxy/CDN in front of Liara — that would silently
   reintroduce a Cloudflare hop in the request path, which is the entire
   thing this migration is trying to remove. Liara's own docs note that
   *if* you keep Cloudflare's proxy on, you must set Cloudflare's SSL mode
   to "Flexible" — but that mode terminates TLS at Cloudflare and talks
   plain HTTP to Liara, which is a step backward for security, and still
   puts Cloudflare back in the path. Recommendation: DNS-only (grey cloud),
   not proxied.
4. Click **بررسی وضعیت رکوردها** (check record status) until all three go
   green.
5. Once connected, go to the domain's **تهیه گواهی SSL** (Issue SSL
   certificate) button — one click, free, auto-renewing. Do this for both
   `rad-object.com` and `admin.rad-object.com` independently.

**Callback URLs**: grep found no OAuth/webhook callback URLs hardcoded to
a Cloudflare-specific host anywhere in `apps/storefront` or `apps/admin` —
the only cross-origin references are the CORS allowlist above and the
`NEXT_PUBLIC_SITE_URL`/canonical-URL config already covered. If you have
any third-party integration (payment gateway webhook, OAuth app, etc.)
configured with a `*.workers.dev` or Cloudflare-specific callback URL
outside this repo, update it separately — I can't see what isn't in the
codebase.

## 5. Cutover procedure

1. Deploy both apps to Liara (manually via `npm run deploy:storefront:liara`
   / `npm run deploy:admin:liara`, or trigger the new GitHub Actions
   workflows) and verify them on their default `https://<app>.liara.run`
   subdomains first — confirm `/api/health`, the homepage, login, cart,
   and checkout all work against the real production API before touching
   DNS.
2. Connect the custom domains (section 4) and issue SSL — this does not
   cut traffic over yet, Cloudflare/the current DNS target keeps serving
   `rad-object.com`/`admin.rad-object.com` until you change the records
   that actually route traffic.
3. Lower DNS TTLs on the production records an hour or so ahead of cutover
   if your current DNS provider allows it, so the eventual change
   propagates fast.
4. Switch the production DNS records (the ones currently pointing at
   Cloudflare Workers' routes) to the records Liara gave you in step 4
   above.
5. Watch traffic hit the new Liara apps (Liara's own request logs/metrics,
   plus application-level logs) and watch for elevated error rates.
6. Once stable (recommend at least 24–48h, through a full day of Iranian
   daytime traffic), you can retire the Cloudflare Worker deployments.

## 6. Rollback procedure

Because the Cloudflare deployment is untouched:

1. Revert the DNS records changed in cutover step 4 back to Cloudflare's
   values (keep a copy of the exact pre-cutover records before you change
   anything).
2. The Cloudflare Workers (`rad-studio`, admin's worker) are still deployed
   and live at their `workers_dev` URLs the whole time — no redeploy
   needed to roll back, only the DNS change needs reverting.
3. If a code change was made *after* cutover that only exists in a commit
   deployed to Liara (not re-deployed to Cloudflare), redeploy that same
   commit to Cloudflare via the existing `npm run deploy:vinext` /
   `deploy:admin` scripts before relying on it for rollback traffic.

## 7. Remaining steps that need your credentials (not done here)

- [ ] Create the two Liara apps (`rad-storefront`, `rad-admin` — or your
      chosen names; update `apps/*/liara.json`'s `"app"` field to match) on
      the Docker platform, in your Liara account/team.
- [ ] Add `LIARA_API_TOKEN` as a GitHub Actions repository secret (Liara
      console → your profile → API tokens).
- [ ] Set each app's runtime env vars in the Liara console per
      `apps/*/.env.production.liara.example`.
- [ ] Decide the `www` vs bare-domain question (section 3) and adjust
      `NEXT_PUBLIC_SITE_URL`/`liara.json`'s `build.args` if you choose the
      bare domain.
- [ ] Run `npm run deploy:storefront:liara` / `npm run deploy:admin:liara`
      (or the GitHub Actions workflows) and verify on the `*.liara.run`
      subdomains.
- [ ] Carry out DNS/SSL setup (section 4) and the cutover (section 5).
- [ ] Decide whether to keep the `*.workers.dev` entries in
      `apps/api/src/common/cors-origins.ts` until Cloudflare is fully
      retired, then remove them.

## 8. Validation performed

- **Tested**: `npm run build --workspace @rad/storefront` and
  `--workspace @rad/admin` with `LIARA_BUILD=1 NODE_ENV=production` —
  both succeed, both include the new `/api/health` route.
- **Tested**: `docker build` for both `apps/storefront/Dockerfile` and
  `apps/admin/Dockerfile` from the repo root — both succeed.
- **Tested** (live container, Node.js runtime, no Cloudflare/Workers
  involved at all): `docker run` for both images —
  `/api/health` → `200 {"ok":true}`; homepage → `200`; `/backend/<path>`
  proxy → forwards correctly with `x-request-id`, and against a real
  backend, a passed-through `Set-Cookie`; the proxy's 20s upstream timeout
  → `504` with `code: "timeout"`, measured.
- **Tested**: `npm run typecheck:all`, `npm run lint`, `npm run test`
  (all workspaces) — all pass after these changes.
- **Not tested** (needs your Liara account): an actual `liara deploy`,
  DNS cutover, or anything on the live `rad-object.com`/
  `admin.rad-object.com` domains.
