# Phase 2 (unified auth) rollout runbook

Covers rollout/rollback for three stacked draft PRs — #106 (SMS OTP
backend), #107 (`User.phone` + account linking), #108 (auth UI) — and how
they interact with the separate, independent PR #96 (Google sign-in).
Written for the operator who will actually run this; no code change here,
and nothing in this doc authorizes merging, deploying, or configuring real
credentials by itself.

## 1. Migrations

Two new migrations ship in this work, both purely additive (verified
`up()`/`down()` against an isolated scratch Postgres — see each file's own
docstring):

| Migration | Adds | Touches existing data? |
|---|---|---|
| `1793190798704-AddOtpCode` (#106) | `OtpCode` table | No |
| `1793191807252-AddUserPhone` (#107) | `User.phone` (nullable, unique); drops NOT NULL on `User.email` | No existing row is modified — email stays set on every current account |

Run them exactly like every other migration in this repo
([`db-migration-runbook.md`](db-migration-runbook.md),
[`automated-migrations.md`](automated-migrations.md)): per-migration
operator approval in `/etc/rad-release/activation.json`'s
`approved_migrations`, keyed on exact name + sha256 of the real built
release artifact — never trust a sha256 quoted in a PR description or this
doc; recompute it from the artifact being approved.

**Ordering with #96's migration** (`1793080351394-AddUserGoogleAuth`,
adds `User.googleId` and makes `passwordHash` nullable): the three
migrations touch non-overlapping column sets on `User`
(`email`/`phone` here, `googleId`/`passwordHash` in #96) — `ALTER TABLE`
statements on different columns of the same table don't conflict in
Postgres, so these are safe to run in either order, whichever PR merges
first. No migration here needs to wait on #96, and #96 doesn't need to
wait on these.

**Rollback**: `AddUserPhone`'s `down()` will refuse (fails closed, by
design) if any row has a NULL `email` by then — i.e. once a real
phone-only account exists. At that point the only safe rollback is
restoring the pre-migration backup, same philosophy as every other
migration in this repo; `migration:revert` is not the recovery path once
real rows depend on the new shape.

## 2. SMS (Melipayamak) configuration

Set in the API's production env (never committed):

```
MELIPAYAMAK_USERNAME=<panel username>
MELIPAYAMAK_PASSWORD=<panel password>
MELIPAYAMAK_SENDER=<the approved sender line for this account>
```

Until all three are set, `POST /auth/otp/request` fails closed with a
coded `melipayamak_not_configured` error (verified: renders as clean
Persian text in the UI, never a raw technical message) — nothing else in
the API is affected, same pattern as `SMTP_*` for email.

Contract was verified against the current live documentation at
`api.payamak-panel.com` (the user-supplied doc, dated within this
quarter) and cross-checked against the official but largely inactive
`melipayamak-node` SDK (last pushed 2020; its README explicitly doesn't
cover `SendOtp` at all — only plain `sms.send()` — so it cannot by itself
prove the OTP contract, and its own `rest.js` doesn't even return/parse a
response, consistent with being a thin, unmaintained example). Confirmed
matching: base URL (`https://rest.payamak-panel.com/api/SendSMS/<Method>`),
`application/x-www-form-urlencoded` POST, field names
(`username`/`password`/`to`/`from`/`code`), and the plain-numeric-string
`ReturnValue` response (not JSON) — a positive number is the receipt id,
`0` or negative is a documented failure code.

**Two account-specific things only the operator can confirm**, not
visible from code:
- **ApiKey mode**: Melipayamak's own error code `110` means "this account
  requires ApiKey auth, not username+password." If the panel is configured
  that way, `MelipayamakService` needs a small follow-up (send `apikey`
  instead of `username`/`password`) before OTP will work at all — check
  this before assuming a `110` response means bad credentials.
- **Sender line**: error code `5` ("شماره فرستنده معتبر نمی‌باشد") means
  `MELIPAYAMAK_SENDER` isn't a line actually assigned to this account for
  OTP sends. Confirm the exact sender number in the panel, not guessed.

Never log the raw code, `MELIPAYAMAK_PASSWORD`, or the full provider
response body — `MelipayamakService` only logs the HTTP status and the
trimmed `ReturnValue` string on failure, never the request body or a
successful payload's content.

## 3. Google OAuth (#96) — separate PR, separate checklist

Unrelated to #106/#107/#108 except that both eventually touch the same
`User` table and the same login page. #96's own PR description already
lists its blockers (real Google Cloud credentials, migration approval,
confirming no other migration is stuck pending in production, a rollback
compatibility note, and a live OAuth round-trip test) — repeated here only
because it affects sequencing:

**Real overlap found during this review, not yet resolved**: #96
independently added its own "Continue with Google" button, icon, error
handling (`authError` query param from the OAuth callback,
`google_only_account` for the reverse case), and i18n keys to
`account-login.tsx` — the same file #108 rewrote for the OTP-first
redesign. These are two different implementations of the same button in
the same file; merging both as-is **will** textually conflict, and more
importantly the designs differ (e.g. #108's current button doesn't
preserve `returnTo` through the redirect or surface `authError` the way
#96's does). **Resolve this explicitly — pick a design and reconcile the
two, don't merge both and let whichever lands second silently overwrite
the other's error handling.** Recommend: once #96 is ready to merge,
rebase #108 on top of it and fold #96's more complete Google button/error
handling into the OTP-first layout, rather than keeping #108's simpler
version.

The two are schema-compatible otherwise (confirmed above) and
identity-linking is structurally safe in both directions: Google's
`WHERE email = <verified email>` lookup can never match a phone-only row
(`email IS NULL` never equals a string in SQL), and OTP's
`WHERE phone = <verified phone>` lookup can never match a Google-created
row (`phone IS NULL` the same way) — so neither sign-in path can
accidentally auto-link to an account created by the other, regardless of
merge order.

## 4. Rollout order (recommended)

1. #106 (SMS backend) — safe alone, nothing public consumes it yet.
2. #107 (account linking) — safe alone, still no UI calls
   `/auth/otp/signin`.
3. Configure real Melipayamak credentials in production, confirm a real
   SMS arrives (manual operator test, not something this session can do).
4. #108 (UI) — **only after** resolving the Google-button overlap with
   #96 above, whichever order #96 itself merges in.
5. #96, whenever its own checklist is complete, independently.

## 5. Rollback

Each PR's migration rolls back independently per the table in §1. No
service depends on #106/#107's tables/columns existing except the code in
those same PRs — rolling back the API artifact to before them (without
reverting the migration) is safe in the narrow sense that old code simply
never reads `OtpCode`/`User.phone`; it does **not** retroactively break
any phone-only account already created, which simply becomes
unreachable by any sign-in method until the artifact rolls forward again
(it still has no email or usable password, by design) — same category of
narrow, non-corrupting rollback gap #96's own description already flags
for Google-only accounts.

## 6. What this review did not and could not verify

- A real SMS actually arriving (no live credentials in this session).
- A real Google OAuth round trip (separate PR, separate blockers).
- Production environment variables, `/etc/rad-release/activation.json`
  contents, or anything else only an operator with VPS/panel access can
  see.
