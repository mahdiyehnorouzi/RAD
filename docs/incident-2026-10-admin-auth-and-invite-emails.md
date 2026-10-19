# Incident: admin login resets & missing emails — fix, deploy, rollback, recovery

Root-cause fixes for the 2026-10 incident: a fresh admin login failed with
wrong-password-style errors while an already-open session kept working,
and invite/forgot-password emails were never received. Investigated
read-only on the production VPS first (no changes made during that pass),
then fixed and tested on branch `fix/admin-auth-and-invite-emails`.
**Nothing in this document has been applied to production.**

## 1. Root causes (confirmed)

1. **`ensure-staff.ts` ran on every production boot and overwrote the
   admin/editor password hash** with `hash(ADMIN_PASSWORD)` /
   `hash(EDITOR_PASSWORD)` unconditionally, even for an account that
   already existed. Those env vars are effectively static across
   deploys/restarts, so any password changed through the app (or via a
   prior recovery) was silently reverted on the next boot. An
   already-open session kept working because a JWT isn't re-validated
   against the current password — only a fresh login re-checks it. This
   also incidentally force-reset `status` to `"active"` on the same two
   accounts every boot.
2. **Admin invitations never sent an email and never issued a token.**
   `AdminService.inviteMember` created a `status: "invited"` user with an
   unguessable random password and stopped there — there was no way for
   the invitee to ever learn an account existed, let alone set a
   password.
3. **SMTP was not configured in the production runtime at all** (not
   failing — entirely absent), so even features that do attempt email
   (password reset) would fail every time, invisibly, until a user hit it.

## 2. What changed (this branch)

| Area | File(s) | Change |
|---|---|---|
| Password-reset-on-boot bug | [`apps/api/seed/ensure-staff.ts`](../apps/api/seed/ensure-staff.ts) | Bootstrap password now applies only when the account doesn't exist yet. An existing account's `passwordHash` is never touched by this script again. Non-security fields (name/role/adminRole) still upsert every boot; `status` is no longer forced. |
| Admin invitations | [`apps/api/src/admin/admin.service.ts`](../apps/api/src/admin/admin.service.ts), [`admin.controller.ts`](../apps/api/src/admin/admin.controller.ts) | `inviteMember` now issues a single-use, 7-day code (reusing `PasswordResetToken`, same mechanism as forgot-password) and emails it. A failed send rolls back the created account. New `POST /admin/members/:id/resend-invite`. |
| Shared token helper | [`apps/api/src/auth/reset-token.util.ts`](../apps/api/src/auth/reset-token.util.ts) | Extracted code-generation/hash used by invites (kept `AuthService`'s existing forgot-password code untouched, to avoid risking a working flow). |
| Mail service | [`apps/api/src/mail/mail.service.ts`](../apps/api/src/mail/mail.service.ts) | Added `sendAdminInvite`, an injectable transport factory (for tests), and `logConfigurationStatus()`. |
| Boot-time SMTP check | [`apps/api/src/main.ts`](../apps/api/src/main.ts) | Logs a clear, loud warning at boot if SMTP isn't configured (never blocks startup). |
| Break-glass recovery | [`apps/api/seed/recover-admin-password.ts`](../apps/api/seed/recover-admin-password.ts) | New, not wired into any boot path. See §6. |

No database schema change. No existing production credential was read,
logged, or changed by any of this work.

## 3. Tests

Run from `apps/api`:

```bash
npm run test:mail   # 9 tests, no network/DB — executed, all pass
npm run test:seed   # ensure-staff + recover-admin-password specs
npm run test:auth   # invite-member spec
npm run typecheck   # whole API, clean
```

**Genuinely executed and passing in this sandbox:**
- `test:mail` — 9/9 (missing-config detection, transport-failure
  surfacing, no-credential-leak, successful-send content).
- `recover-admin-password.spec.ts`'s 4 guard-rail tests — real
  subprocess runs, no DB needed (validation happens before any DB
  connection).
- Full API `typecheck` — clean.
- Pre-existing non-DB suites re-run for regressions (`sign-auth`,
  `orphan-upload`, storage, pricing, catalog, compression, database,
  health, artist-applications) — all pass, confirming the `AdminService`
  constructor signature change (two new params: `PasswordResetToken`
  repo, `MailService`) didn't break anything already using it.

**Written but NOT executable in this sandbox:**
`ensure-staff.spec.ts` and `invite-member.spec.ts` use this repo's
existing embedded-postgres test harness (same pattern as
`replace-images.spec.ts`). This sandbox cannot spawn the embedded
Postgres binary — confirmed by reproducing the identical `EACCES` on a
bare, unmodified embedded-postgres script unrelated to this change
(`initdb` fails to `spawn` under a uid/gid drop that this container
doesn't permit). This is the same limitation `replace-images.spec.ts`
already documents, not a regression. Note also: when embedded-postgres
fails this way, Node's test runner misreports the whole file as a single
trivial "pass" instead of a failure — confirmed this already happens for
the repo's own pre-existing `purchase-flow.spec.ts` / `inventory.spec.ts`
here too. Worth a separate look at some point (flag, don't fix now): a
broken DB-dependent spec in CI could currently look green.
**Run `test:seed`/`test:auth` for real in CI or a dev machine where
embedded-postgres can start** before trusting their result.

## 4. Production environment configuration checklist

Set in `/etc/rad/api.env` (the file `rad-api.service` actually loads —
**not** `/root/RAD/apps/api/.env`, which is a separate, unused checkout):

- [ ] `ADMIN_EMAIL`, `ADMIN_PASSWORD` — **only matter on first boot ever**
      now. Leave them set (harmless) or remove them once the owner account
      exists; either way they will never again overwrite a real password.
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
      `SMTP_FROM` — currently **absent**. Must be set for password-reset
      and invite emails to work at all. After deploy, confirm via the
      boot log line from `logConfigurationStatus()`:
      `journalctl -u rad-api.service | grep -i smtp` should show
      `"SMTP is configured"`, not the "NOT configured" warning.
- [ ] `HOST=127.0.0.1`, `TRUST_PROXY=1` — already correctly set; no
      change needed (confirmed in the read-only investigation).
- [ ] `DATABASE_URL` — unchanged; already confirmed reachable
      (local Postgres).

## 5. Safe deployment procedure (systemd + the real release pipeline)

Production is `/opt/rad` via systemd unit `rad-api.service`, releases
tracked under `/opt/rad-releases`. **Do not** use `/root/RAD` or PM2 for
production operations — that checkout/process is stale and unused.

1. Merge this branch into the branch the release pipeline builds from.
2. Let the existing release pipeline cut a new checkout under
   `/opt/rad-releases` as it already does (it already snapshots
   `/etc/rad/api.env` before each deploy — keep that).
3. Before cutting over, confirm the new checkout's
   `apps/api/scripts/start-production.mjs` still calls
   `seed/ensure-staff.ts` (it should — this fix doesn't touch that call,
   only what the script does internally).
4. Add the SMTP env vars to `/etc/rad/api.env` (§4) as part of this same
   deploy, or in a deploy immediately after — either order is safe now,
   since `ensure-staff` can no longer reset anyone's password.
5. Restart `rad-api.service` (via the pipeline, not manually) and verify:
   - `systemctl status rad-api` → active, `NRestarts` not climbing.
   - `curl -s http://127.0.0.1:4000/health` → `{"ok":true,...,"db":true}`.
   - `journalctl -u rad-api.service -n 50` shows one `"Staff ensured..."`
     line and the SMTP boot-check line, no stack traces.
   - A fresh login with the **current** (not bootstrap) admin password
     succeeds from a new/incognito session, while any already-open
     session keeps working too.
   - Trigger one real admin invite and one real forgot-password request
     end-to-end; confirm the email arrives.

## 6. Rollback plan

- **Code**: this is a single feature branch; if anything regresses,
  `git revert` the two commits on `fix/admin-auth-and-invite-emails` (or
  redeploy the previous release directory already kept under
  `/opt/rad-releases`) and restart `rad-api.service`. No migration to
  undo — no schema changed.
- **Env**: adding SMTP vars is additive and reversible — remove them from
  `/etc/rad/api.env` and restart to go back to "email disabled" (not
  "broken", since the app never assumed SMTP was configured).
- **Data**: nothing in this fix writes to the database differently for
  existing rows except intentionally *not* overwriting `passwordHash`
  anymore — there is no data migration and nothing to roll back there.

## 7. Step-by-step admin access recovery plan

Try these **in order** — stop as soon as one works:

1. **If the admin has any working session** (the "old session still
   works" one from the incident): use the in-app "change password"
   screen (`PATCH /auth/password`, requires the current password). This
   already existed and was not touched by this fix.
2. **If the admin doesn't have a session but can receive email** (once
   SMTP is configured per §4): use "forgot password" on the login screen
   (`POST /auth/password/forgot` → emails a 6-digit code → `POST
   /auth/password/reset`). This already existed; not touched by this fix
   except that it will now actually be reachable once SMTP is set.
3. **Only if neither works** (no session, SMTP still not configured, or
   the account is otherwise locked out): the break-glass script,
   `apps/api/seed/recover-admin-password.ts`, run on the host with the
   real `DATABASE_URL`:

   ```bash
   cd /opt/rad/apps/api   # the real deploy, not /root/RAD
   RAD_RECOVERY_EMAIL="owner@example.com" \
   RAD_RECOVERY_NEW_PASSWORD="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(18).toString("base64url"))')" \
   RAD_RECOVERY_CONFIRM="yes-recover-owner@example.com" \
   npx tsx seed/recover-admin-password.ts
   ```

   Replace the password generation with whatever the operator actually
   wants to type in afterward — the command above is just one way to
   pick one without typing it on the command line in cleartext; a
   `read -rs` prompt into the env var works just as well. The script:
   - never prints, logs, or stores the password anywhere but the one
     row's hash;
   - requires the email, the password, **and** a confirm phrase that
     repeats the exact email, so it can't fire against the wrong account
     or from a stale copied command;
   - refuses to run against a non-local `DATABASE_URL` unless
     `RAD_ALLOW_REMOTE_DB_WRITE` explicitly names that host (same guard
     every other seed script here uses).
   - Sign in with the new password immediately, then rotate it again via
     the in-app change-password screen (§7.1) so the one-time value
     chosen during recovery isn't left as the long-term password.

**This procedure has not been executed against production.** Running it
requires explicit approval and should happen only once this branch is
deployed (so a subsequent restart can't reset it again).
