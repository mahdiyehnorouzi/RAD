# Production Incident Assessment — QA Automation Run Against Production DB

Investigation date: 2026-10-14. All queries were read-only `SELECT`s executed inside a Postgres `READ ONLY` transaction (`BEGIN; SET TRANSACTION READ ONLY; ... ROLLBACK;`) against the production database at `olympus.liara.cloud:31444/postgres` (credentials redacted). No `INSERT`/`UPDATE`/`DELETE`/DDL was executed, no mutating HTTP endpoint was called, and no seed/test script was run. DB server time at investigation: `2026-10-14T11:29:20Z` (TimeZone `Etc/UTC`).

## Executive Summary

A tight, ~3-minute cluster of activity between **11:16:06Z and 11:19:54Z on 2026-10-14** created **10 new guest orders**, **2 submitted payment receipts**, **2 new contact-message threads (3 messages)**, and **1 new commission**, and drove **11 unique products** into a held/`sold` inventory state. All of this activity carries strong, consistent QA fixture fingerprints (fixed test name/phone, `*.e2e-test@example.com` / `owner-e2e@example.com` contacts, sequential/placeholder tracking numbers like `TRK1234567`, random guest UUIDs, sub-second-apart timestamps). No admin ever approved or rejected any of these test orders — none reached `confirmed`/`verified`/product-`sold`-permanent state. One additional commission and one older contact thread sit on the real account holder's own user ID but predate or sit outside the tight incident cluster; these are flagged as ambiguous rather than classified as QA pollution.

**No real-customer data was found to have been mutated.** The only pre-existing (non-QA-window) record touched by anything resembling test content is a contact thread from the day before (2026-10-13) attached to the account owner's own order (`RAD-939825`) — same email as the account owner [REDACTED] — which looks like manual dev/QA testing on her own account rather than the automated incident, and falls outside the stated "last 1–2 hours" window.

## Confirmed QA Impact (high confidence)

- **10 orders**, all `ownerKey` = random `guest:<uuid>`, `name` = "Mahdiyeh Test", `phone` = [REDACTED, matches account-owner test pattern], created 2026-10-14 between 11:16:17Z and 11:19:08Z.
- **2 of those orders** progressed to `pending_verification` with a submitted receipt bearing a placeholder tracking number (`TRK1234567`, `TRKMV80OOZG`).
- **2 contact-message threads** (root + reply, 3 messages total) from guest UUIDs using `*-e2e-test@example.com` / `owner-e2e@example.com` addresses, created 11:19:53–11:19:54Z.
- **1 commission** (`RAD-M-1405-830`, owner `user:xm08rvypiuzbt259bmbqsu1u`) created 11:16:06Z, directly inside the cluster window.
- **11 products** flipped to the held/`sold` inventory state (see table below), all `heldBy` one of the 10 guest UUIDs above, all with `updatedAt` in the 11:16–11:19Z window.

## Suspected / Probable Impact (needs human judgment)

- **Commission `RAD-M-1405-722`**, created 2026-10-14T10:00:45Z, owner `user:p139js6aky17n9e6xk1c27hl` — this is the **real account holder's own user ID** (same user ID that owns her real orders/name/phone/email elsewhere in the data). It is ~75 minutes before the tight cluster, so it may be unrelated manual testing by the account owner rather than the automated QA run. Flag for the user to confirm whether she created it herself.
- **Contact thread on order `RAD-939825`** (3 messages, 2026-10-13T08:59–10:40Z — the day before the stated incident window): body text explicitly reads "Test message from customer — checking the admin reply flow" / "Admin reply: thanks, we confirmed your receipt.", attached to the account owner's own real order/email. This predates the 1–2-hour incident window in the brief, so it is likely earlier, separate manual QA on her own account — not the Playwright/API incident — but it is the one case where test-flavored content sits on a pre-existing, real-owner order. No tracking number or receipt hash was altered on this order's actual `PaymentIntent`.

## Affected Record IDs

| Type | ID | Created At (UTC) | Current Status | Confidence |
|---|---|---|---|---|
| Order | RAD-868727 | 11:19:08.502 | pending_payment | Confirmed QA |
| Order | RAD-683109 | 11:19:05.586 | pending_payment | Confirmed QA |
| Order | RAD-296463 | 11:19:04.045 | pending_verification | Confirmed QA |
| Order | RAD-243642 | 11:18:08.410 | pending_payment | Confirmed QA |
| Order | RAD-312277 | 11:17:38.180 | pending_payment | Confirmed QA |
| Order | RAD-584856 | 11:17:36.088 | pending_payment | Confirmed QA |
| Order | RAD-609632 | 11:17:34.375 | pending_payment | Confirmed QA |
| Order | RAD-103816 | 11:16:20.618 | pending_payment | Confirmed QA |
| Order | RAD-763188 | 11:16:18.964 | pending_payment | Confirmed QA |
| Order | RAD-485310 | 11:16:17.465 | pending_verification | Confirmed QA |
| PaymentIntent | cvjwwxazkn4yfh9tsupkzgwy (order RAD-296463) | submittedAt 11:19:04.176 | submitted, tracking `TRKMV80OOZG` | Confirmed QA |
| PaymentIntent | owgaa1sla0qle16gvi93q83l (order RAD-485310) | submittedAt 11:16:17.700 | submitted, tracking `TRK1234567` | Confirmed QA |
| Commission | RAD-M-1405-830 | 11:16:06.432 | — | Confirmed QA |
| Commission | RAD-M-1405-722 | 10:00:45.978 | — | Probable / ambiguous (real user ID) |
| ContactMessage | rt99gv1d1aw6oi82bwxjn3fo (root) | 11:19:53.860 | new | Confirmed QA |
| ContactMessage | uczgmwceniuv0qlde5f1oibf (reply) | 11:19:53.941 | new | Confirmed QA |
| ContactMessage | yau1c9ax6l8sazi3loz0nut9 | 11:19:54.144 | new | Confirmed QA |
| ContactMessage thread on RAD-939825 (3 msgs) | sgdtksr0py25voz4v2jvj3jw, gvp9e930sx2vml4xlb5vyr18, jl7ndicyzk6538nn9quganl1 | 2026-10-13 08:59–10:40 | new | Uncertain — predates window, on real user's own order |

## Product Inventory Impact

Current status breakdown (38 products total): `sold` = 32, `archived` = 2, `in_workshop` = 2, `ready` = 2. **There are zero products with status `available` right now** — this matches the reported symptom.

Of the 32 `sold`:
- **11 were changed in the incident window** (2026-10-14, 11:16:17–11:19:08Z), each `heldBy` one of the 10 QA guest UUIDs, each with a live `holdExpiresAt` ~30 minutes out (consistent with the checkout hold window) or already past: `woven-garden`, `quiet-weight`, `walnut-tide`, `blue-window`, `pomegranate-bowl`, `lut-line`, `olive-memory`, `cobalt-fold-bowl`, `speckled-cup`, `orange-boat-sculpture`, `red-vessel-27`. **None of these have a confirmed/paid `PaymentIntent` — their "sold" state is only a checkout-time hold, not a completed sale.**
- **9 more `sold` rows have `heldBy`/`holdExpiresAt` = null and `updatedAt` on 2026-09-27**, i.e. baseline seed/catalog sales from weeks before the incident — not QA-correlated, do not touch.
- **12 more `sold` rows are held (`heldBy` set, `holdExpiresAt` null) by real-looking user/guest IDs with `updatedAt` between 2026-09-29 and 2026-10-13** — these predate the stated 1–2 hour incident window and are **not caused by today's run**; several belong to the real account holder (`user:p139js6aky17n9e6xk1c27hl`, `user:xicmhus3jsi2lmzde379wb1d`). **These must not be reset as "QA cleanup" — flagging explicitly as likely real/legitimate activity**, or at minimum older activity outside this incident's scope.

So the catalog already had 0 `available` products before today's QA run started (the 21 non-incident `sold`/held rows account for that on their own); today's run additionally consumed 11 more units into held state on top of that pre-existing state.

## Payment & Messaging Impact

- Neither of the 2 QA-submitted receipts (`TRK1234567`, `TRKMV80OOZG`) or their SHA-256 `receiptHash` values collide with any receipt hash on a pre-existing order — they are net-new rows, not reused/duplicated against real orders.
- No admin action (`reviewedAt`/`reviewedBy`) was recorded on any of today's QA orders or payment intents; the only `verified` PaymentIntents in the whole table belong to the `RAD-S-1405-0x` seed orders, untouched.
- The only test-flavored content touching a pre-existing record is the 2026-10-13 contact thread on order `RAD-939825`, which belongs to the real account owner herself (same identity as the authenticated user in this session) — not a different, unrelated real customer. No other real customer's order, payment, or conversation shows any QA-pattern value attached.

## Evidence & Timestamps

- DB "now" at investigation: `2026-10-14T11:29:20.340Z`.
- Tight QA cluster: `11:16:06.432Z` (first commission) → `11:19:54.144Z` (last contact message) — **≈3 minutes 48 seconds**, consistent with an automated test run rather than manual clicking.
- Fixture fingerprints observed: fixed name "Mahdiyeh Test", fixed phone "09121234567", placeholder tracking numbers (`TRK1234567`, `TRKMV80OOZG`), `*-e2e-test@example.com` / `owner-e2e@example.com` contact addresses, sub-second-interval `createdAt` values across unrelated tables.

## Customer-Facing Risks

- 11 real, unique (1/1) products are currently shown as unavailable/sold to real customers due to QA holds, even though no real sale occurred. If any hold has not yet expired, a real customer could be blocked from buying a genuinely available 1/1 artwork until the hold lapses or is cleared.
- No real customer's order, payment, or contact history was altered — risk is limited to inventory availability/visibility, not data integrity of real records.
- The 2 QA contact threads will surface in the admin "new messages" queue and could be mistaken for real inquiries if not identified before staff respond.

## Recommended Recovery Actions (proposed only — not executed)

1. Restore the 11 incident-window products to `available` and clear `heldBy`/`holdExpiresAt`, **only if no other real hold legitimately covers them now**: `woven-garden`, `quiet-weight`, `walnut-tide`, `blue-window`, `pomegranate-bowl`, `lut-line`, `olive-memory`, `cobalt-fold-bowl`, `speckled-cup`, `orange-boat-sculpture`, `red-vessel-27`.
2. Cancel/soft-delete (or mark `cancelled`) the 10 QA orders (`RAD-868727`, `RAD-683109`, `RAD-296463`, `RAD-243642`, `RAD-312277`, `RAD-584856`, `RAD-609632`, `RAD-103816`, `RAD-763188`, `RAD-485310`) and their 2 submitted `PaymentIntent`s, rather than letting them auto-expire, to avoid any accidental admin review.
3. Soft-delete/mark-resolved the 3 QA `ContactMessage` rows (`rt99gv1d1aw6oi82bwxjn3fo`, `uczgmwceniuv0qlde5f1oibf`, `yau1c9ax6l8sazi3loz0nut9`) so they don't appear as live customer inquiries.
4. Soft-delete commission `RAD-M-1405-830`.
5. For commission `RAD-M-1405-722` and the 2026-10-13 contact thread on `RAD-939825`: **ask the account owner directly** whether she created these herself before deciding whether to clean them up — do not delete by default.
6. Do not touch the 9 baseline (`2026-09-27`) sold products or the 12 pre-incident-window held products — they are outside this incident's scope.

## Recovery Risks & Dependencies

- Restoring product availability must go through `InventoryService`/the existing release path (not a raw UPDATE) to avoid bypassing the pessimistic-lock/reservation logic described in `AGENTS.md` §5 — any cleanup script must re-check `OrdersService.checkout`'s locking model first.
- Cancelling orders that already have a `submitted` `PaymentIntent` should go through the same path the admin "reject" action uses, so `Product.status` is correctly restocked and `PaymentIntent.status` transitions consistently, rather than being special-cased.
- Because `receiptHash`/`trackingNumber` indexes exist, deleting rather than soft-deleting the QA PaymentIntents could free up those exact hash/tracking values for reuse — if real customers could plausibly submit the same placeholder values (unlikely, but `TRK1234567` is a very guessable string), prefer soft-delete/status change over hard delete.

## Unknowns Requiring Further Investigation

- Whether the suspected automation is still running/scheduled to re-run (would re-create the same pattern); not observable from the DB alone — check CI/QA runner logs.
- Whether `RAD-M-1405-722` and the `RAD-939825` contact thread were created by the account owner's own manual testing or by an earlier, separate automation run — only the user can confirm.
- The original incident report mentioned "~3 payment receipts submitted" — only 2 were found in the tight cluster; the third may not have completed, may be one of the two counted twice in the original report, or may exist outside the exact window queried (only the 50 most recent rows per table were inspected, which comfortably covers the stated catalog size, but a wider/older scan was not performed).
