# RAD architecture

RAD is an npm-workspaces monorepo. The production storefront remains at the repository root to preserve the existing Sites deployment. `apps/admin` is the operations prototype. Shared contracts live in `packages/types`, reusable UI in `packages/ui`, persisted client state in `packages/state`, and locale-owned copy in `packages/i18n`.

## Security boundary

- Passwords are never persisted in browser storage. Production authentication must use a server-side identity provider, password hashing, secure HTTP-only sessions, rate limiting, and recovery flows.
- Payment UI must call a server-side gateway adapter. Merchant credentials and callback verification never run in the browser.
- One-of-one inventory must be reserved atomically by the backend before payment redirection.
- Guest-artist products require admin review and expose a verified vendor badge in the storefront.

## Applications

- Storefront: customer-facing bilingual archive, custom design and commerce prototype.
- Admin: product, guest-artist, order and AI-concept review prototype.
