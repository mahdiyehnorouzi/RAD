<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Storefront Engineering Rules

Hand-maintained content below this line — never edited by `next dev`, which only owns the block above. See `../../docs/engineering/adr/adr-001-state-management-selection.md` for rationale.

## State management

Pick the state tool by **type, ownership, scope, and lifetime** — not by
copying the nearest existing file, and not by defaulting to Context or
Zustand for everything:

- **Local UI state** (one component, e.g. an open/closed flag) →
  `useState`/`useReducer`.
- **Subtree-shared state** (shared across a branch of the tree, not the
  whole app) → **React Context** when appropriate, following
  `features/cart/cart-provider.tsx` — note the cart's actual data is
  server-owned (`apps/api/src/cart/cart.service.ts` persists it and
  couples it to inventory holds); the Context provider holds a
  client-side view of that data for the checkout subtree, it is not
  itself the server-state cache.
- **Shared client-only state** with no server counterpart → **Zustand**
  when justified, following
  `features/product-detail/transition/product-transition-store.ts` and
  `hooks/use-making-workspace.tsx`.
- **Server state** → the existing data-fetching/cache code in `lib/`.
  Do not reach for Context as a general server-state cache.
- **URL state** (filters, pagination, selected tab — anything that should
  survive a reload or be shareable) → route params/search params.
- **Form state** → form-local state, not global state.

Do not migrate existing cart/transition/workspace code to "unify" on one
tool, and do not add a new state-management dependency — all of the
above uses what's already installed. See
`../../docs/engineering/adr/adr-001-state-management-selection.md`.
