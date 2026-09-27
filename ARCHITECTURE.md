# RAD architecture

RAD is an npm-workspaces monorepo with two independently runnable Next.js applications. The customer storefront and all of its routes live in `apps/storefront`; the operations application and its routes live in `apps/admin`. Shared contracts live in `packages/types`, the artwork registry in `packages/artworks`, reusable UI in `packages/ui`, persisted client state in `packages/state`, and locale-owned copy in `packages/i18n`.

## Artwork source of truth

- Every work is one `Artwork` (`packages/types/src/artwork.ts`): `radNumber`, slug, title, artist, category, status, price, year, materials, dimensions, description, story, care, images, passport, difference and owner. The API stores it as the `products` row and serves it at `GET /artworks` and `GET /artworks/:radNumber|slug`.
- `radNumber` is permanent and unique. It is never derived from list position; new works get `MAX(radNumber) + 1`.
- `packages/artworks` is the authoring registry. The API seed writes it to the database; the storefront uses it only as an offline fallback and for static params. `registryProblems()` rejects duplicate numbers or slugs and dangling links, and the seed refuses to run while any exist.
- Catalog cards, product pages, cart, passports, families, the difference museum, the workshop journals and home sections are projections of `Artwork` (`apps/storefront/lib/artworks`, `lib/passport`, `lib/difference`, `lib/now`). None of them may define a title, maker, number, material or story of their own.
- Home concept pieces (hero polaroids) are not archive works and never carry a RAD number.

## Security boundary

- Passwords are never persisted in browser storage. Production authentication must use a server-side identity provider, password hashing, secure HTTP-only sessions, rate limiting, and recovery flows.
- Payment UI must call a server-side gateway adapter. Merchant credentials and callback verification never run in the browser.
- Product status has one source of truth: `Product.status` in the API, following `draft → in_workshop → ready → available → sold → archived` (`PRODUCT_STATUSES` in `packages/types`). Storefront pages only render it; static data never carries a status.
- Adding a work to the cart holds it atomically as `sold` for 15 minutes (`holdExpiresAt`, `heldBy`). If payment is not submitted in time, the API returns it to `available`, removes it from the cart, and cancels the unpaid order. There is no `reserved` state.
- Until the bank gateway is live, `PAYMENT_MODE=manual_card` starts the same payment session but returns card-transfer instructions instead of a redirect. Flip to `gateway` and implement `PaymentGateway` in `services/payment/contracts.ts` when credentials are ready.
- Guest-artist products require admin review and expose a verified vendor badge in the storefront.

## Applications

- `apps/storefront`: customer-facing bilingual archive, custom design and commerce experience.
- `apps/admin`: product, guest-artist, order and AI-concept review experience.

Each application owns its own `app`, app-specific components, hooks, local data, public assets, Next.js configuration, and TypeScript configuration. Only code that is consumed by more than one application belongs in `packages`.
