# RAD UX Contract

RAD is a bilingual hybrid storefront. Persian is the default RTL locale; English is LTR. All navigation labels, status messages, numbers, accessible names, and commerce copy follow the active locale.

## Canonical owners

- Header utilities: `components/site.tsx`; basket, favourites, account, search, and notifications remain available on every route. On narrow screens labels collapse but controls remain visible.
- Header overlays: search, notifications, and the mobile navigation are mutually exclusive; opening one closes the others.
- Local session, favourites, notification history, orders, and reviews: `components/commerce.tsx`. This prototype stores only profile name/email and never stores passwords.
- Basket: `components/cart.tsx`; one-of-one products appear only once and persist locally.
- Product media: `components/site.tsx`; products may expose multiple images and an explicitly empty image list renders the localized default placeholder.
- Product categories: `lib/products.ts` owns explicit category membership; `components/catalog.tsx` filters only by that field rather than visual shape heuristics.
- Reviews: `components/reviews.tsx`; signed-in users can add one-to-five-star ratings, text, and an optional JPEG/PNG/WebP image up to 1 MB.
- Orders: `components/orders-page.tsx`; locally completed checkout orders remain available from the account area.
- Pricing: Persian uses stored toman prices; English uses explicit product-level USD prices. Totals never convert a localized display string.
- PWA and device notifications: `components/pwa.tsx` owns install guidance and permission requests; `public/sw.js` owns notification display/click routing. Permission is requested only after a user action.
- Offline navigation: the Service Worker may reuse the exact requested route only. It must never render cached Home content under a different URL.
- Forms: app-owned validation with `noValidate`, inline errors, first-invalid focus, masked passwords, and duplicate-safe native buttons.
- Notifications: the shared centre is a non-modal popover with localized history, unread count, Escape close, and mark-all-read.
- Toasts: favourite and review actions always return localized, dismissible feedback without navigating away.
- Scrollbar: global ownership in `app/globals.css`.

## Flow ledger

| Operation | Trigger | Success | Failure/recovery |
| --- | --- | --- | --- |
| Sign in | Account form | Show profile; preserve local favourites/basket | Inline generic error; preserve entered values |
| Sign out | Profile action | Return to signed-out account view; basket/favourites remain local | No remote failure in prototype |
| Save favourite | Heart control | Toggle in place; show a localized toast for save or removal | Storage failure keeps current in-memory state |
| Share favourites | Share action | Native share sheet or copied URL with public product slugs | Cancellation leaves list unchanged |
| Add to basket | PDP action | Disable add, increment persistent header badge, notify | Storage failure keeps in-memory basket |
| Quick add | Product-card artwork action | Add the one-of-one work in place, show a localized toast, switch to an explicit remove action, update the icon badge | A second click removes the work without leaving the listing and restores the initial outline state |
| Submit review | PDP review form | Add review immediately and show confirmation toast | Inline rating/comment/media validation; preserve entered text |
| Checkout | Basket summary | Details → review → local demo success, save order, then clear basket | Field-specific inline validation; no payment is attempted |
| Track order | Header/account/order-success link | Show received → processing → shipped → delivered progress | Existing prototype orders derive USD totals from their saved products |

## Release boundary

Authentication, cross-device sync, real orders, payments, and remote push delivery require a secure backend, database, verified session provider, HTTPS, and current commerce/privacy policy before production release. The current implementation is explicitly a local functional prototype.
