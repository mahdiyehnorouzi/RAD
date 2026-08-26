# RAD architecture

RAD is an npm-workspaces monorepo with two independently runnable Next.js applications. The customer storefront and all of its routes live in `apps/storefront`; the operations application and its routes live in `apps/admin`. Shared contracts live in `packages/types`, reusable UI in `packages/ui`, persisted client state in `packages/state`, and locale-owned copy in `packages/i18n`.

## Security boundary

- Passwords are never persisted in browser storage. Production authentication must use a server-side identity provider, password hashing, secure HTTP-only sessions, rate limiting, and recovery flows.
- Payment UI must call a server-side gateway adapter. Merchant credentials and callback verification never run in the browser.
- One-of-one inventory must be reserved atomically by the backend before payment redirection.
- Guest-artist products require admin review and expose a verified vendor badge in the storefront.

## Applications

- `apps/storefront`: customer-facing bilingual archive, custom design and commerce experience.
- `apps/admin`: product, guest-artist, order and AI-concept review experience.

Each application owns its own `app`, app-specific components, hooks, local data, public assets, Next.js configuration, and TypeScript configuration. Only code that is consumed by more than one application belongs in `packages`.
