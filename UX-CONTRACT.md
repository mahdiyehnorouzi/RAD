# RAD UX Contract

RAD is a bilingual hybrid storefront. Persian is the default RTL locale; English is LTR. All navigation labels, status messages, numbers, accessible names, and commerce copy follow the active locale.

## Canonical owners

- Admin operations: `apps/admin/components/admin-dashboard.tsx`; overview, catalog, orders, and access management share one application shell and reusable dialog/field/status primitives.
- Admin prototype state: `apps/admin/hooks/use-admin-workspace.ts`; products, orders, and invitations persist locally for evaluation. Browser-stored roles are never an authorization boundary.
- Admin data contracts: `apps/admin/lib/admin-data.ts`; product image arrays, one-of-one inventory status, ceramic order stages, roles, and permission labels are defined centrally.
- Admin select ownership: native `select` controls are intentional for compact role, status and category editing; they retain visible labels and accessible names.

- Header utilities: `components/layout/header.tsx`; search, favourites, and basket remain available on every route. Profile and orders live in the account route and mobile menu so the brand header stays quiet.
- Header overlays: search, notifications, and the mobile navigation are mutually exclusive; opening one closes the others.
- Route back navigation: every non-home storefront route renders the shared back control below the header; it uses browser history when available and falls back to Home.
- Local session, favourites, notification history, orders, and reviews: `components/commerce/`. This prototype stores only profile name/email and never stores passwords.
- Basket: `components/cart/`; one-of-one products appear only once and persist locally.
- Product media: `components/product/listing/product-media.tsx`; products may expose multiple images, while missing, explicitly empty, or failed backend images render the fantasy fallback owned by the product category.
- Local catalog recovery: when the product API is unavailable during development, the catalog and product-detail routes use `lib/catalog/products.ts` so local visual work remains testable. Production never presents mock inventory after an API failure.
- Sold media state: `components/product/listing/product-media.tsx`; every `ProductMedia` rendering of a sold work carries the same localized, non-interactive sold badge.
- Product categories: `lib/products.ts` owns explicit category membership; `components/catalog.tsx` filters only by that field rather than visual shape heuristics.
- Storefront mock content: `apps/storefront/lib/mock-data.ts` owns the temporary brand descriptor, canonical cross-discipline category list, featured product order, and category-specific custom-design options. Storefront surfaces consume this mock until a backend content contract replaces it.
- Custom design: `components/custom-designer.tsx` requires a category first, then reveals options owned by that category's mock configuration; changing category clears incompatible choices. The studio also owns a required “permission for surprise” control (`faithful`, `artist’s hand`, `material decides`) and an optional memory field. After generation, the same route presents a four-stage Difference Portrait (described / imagined / artist / material) with intervention notes, a private reveal, and a material-fingerprint certificate. Submitting the design opens a structured making path rather than a generic chat.
- Making biography: `lib/making-commission.ts` owns production stages, next-actor rules, quotes, approvals, payments, and the Record of Making. `hooks/use-making-workspace.ts` persists prototype commissions locally. Customer workspace is `/making`; Artist Workshop is `/workshop` (separate from store administration). Every commission always answers stage, who acts next, and what happens after that action.
- Beautiful Difference archive: `lib/beautiful-difference.ts` owns sample portraits; `app/differences` is the public Museum of Differences; `app/differences/[id]` is the full annotated portrait and certificate. Home shows one transformation story before the making-film.
- Reviews: `components/reviews.tsx`; signed-in users can add one-to-five-star ratings, text, and an optional JPEG/PNG/WebP image up to 1 MB.
- Orders: `components/orders-page.tsx`; locally completed checkout orders remain available from the account area.
- Pricing: Persian uses stored toman prices; English uses explicit product-level USD prices. Totals never convert a localized display string.
- PWA and device notifications remain technical capabilities but are not promoted in the MVP interface. Installation guidance and permission requests stay absent until the user has demonstrated meaningful intent.
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
| Add to basket | PDP action | Available work: disable add, increment persistent header badge, notify | Sold work: show a localized disabled sold label; storage failure keeps in-memory basket |
| Submit review | PDP review form | Add review immediately and show confirmation toast | Inline rating/comment/media validation; preserve entered text |
| Checkout | Basket summary | Details → review → local demo success, save order, then clear basket | Field-specific inline validation; no payment is attempted |
| Track order | Header/account/order-success link | Show received → processing → shipped → delivered progress | Existing prototype orders derive USD totals from their saved products |
| Custom studio | Category, brief, memory, permission for surprise, generate | Show AI image plus Difference Portrait with reveal and fingerprint | Inline error; preserve prompt |
| Submit design for making | Studio submit after generation | Create local commission at Design submitted; open customer workspace | Preserve generated image and brief |
| Making approval | Customer accepts quote/deposit, pre-kiln, or balance | Advance stage; lock approved snapshot; kiln is irreversible | Prototype records the decision locally; no payment is attempted |
| Artist Workshop action | Feasibility, quote, update, firing, ship | Update the biography, messages on that stage, and audit trail | Internal notes stay invisible to the customer |
| Open Museum of Differences | Footer, home story, or studio trail | Show public annotated portraits | Missing id shows localized empty state |

## Release boundary

Authentication, cross-device sync, real orders, payments, and remote push delivery require a secure backend, database, verified session provider, HTTPS, and current commerce/privacy policy before production release. The current implementation is explicitly a local functional prototype.
