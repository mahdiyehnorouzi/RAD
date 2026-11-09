# RAD-030 — Unique identity on the PDP

Recommendation only. No identity UI was changed, because RAD-031 is blocked on the choice below.

## What the PDP does today

On `origin/main` (same content files as production storefront `8ceafad`, deployed 2026-11-02):

- The title row shows the archive number. The 1/1 mark is a separate edition fact, not the identity document.
- `ProductRecordCards` renders two peer cards:
  - Passport card links to `/passport/{code}`, shows the fingerprint and stamp (code, “تنها یک نسخه”, year), and repeats the product photo.
  - QR card links to `/products/{slug}/qr` and shows a QR (or a QR icon) plus another fingerprint.
- The passport page and the QR page are the two places that already carry the readable number. Scanning a QR is only useful from another device, or from a printed label. On the phone that is already showing the PDP, the QR is a picture of a URL the visitor is one tap away from.

## Recommendation

Treat the readable archive / passport number as the identity, and the passport page as the document.

- Keep the number visible as text on the PDP (archive line and passport stamp).
- Keep one action: open the passport.
- Do not ask the visitor to scan a code that points back at the work they are looking at.
- Leave `/products/{slug}/qr` available for a printed label or a share from another device. It does not need a second card beside the passport.

## Decision still required

RAD-031 (remove the QR card, remove the duplicate photo, merge the two cards) should not ship until one of these is chosen:

1. **Passport only.** Remove the QR card from the PDP. Remove the duplicate product photo from the passport card. One card: number, stamp, link to the passport.
2. **Passport card, QR as a secondary control.** Same single card, plus a small “show code” control that opens the existing QR page. Not a second card.
3. **Keep both cards.** No merge. QR stays a peer of the passport.

Option 1 matches the acceptance text for RAD-031. It is the recommendation. It is not approved until someone picks it.
