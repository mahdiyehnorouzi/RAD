<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Storefront Engineering Rules

Hand-maintained content below this line — never edited by `next dev`, which only owns the block above. See `../../docs/engineering/adr/adr-001-state-management-selection.md` for rationale.

## State management

Pick the state tool by **ownership and lifetime**, not by copying the
nearest existing file:

- **Server-owned or cross-navigation state** (mirrors a backend resource,
  or must survive route changes within a session) → **React Context**,
  following `features/cart/cart-provider.tsx`. The cart itself is
  server-owned — `apps/api/src/cart/cart.service.ts` persists it and
  couples it to inventory holds; the Context provider is a client cache,
  not the source of truth.
- **Ephemeral, client-only UI state** scoped to one feature → **Zustand**,
  following `features/product-detail/transition/product-transition-store.ts`
  and `hooks/use-making-workspace.tsx`.

Do not migrate existing cart/transition/workspace code to "unify" on one
tool — both already follow this rule.
