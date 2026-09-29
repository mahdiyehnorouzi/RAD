---
name: storefront-component-structure
description: >-
  Enforces RAD storefront structure: features live in apps/storefront/features/<name>/
  with CSS Modules per component, nested parent/child folders, named component
  files (never index.tsx), colocated type/, const/ and hooks/ folders, and
  index.ts barrels only. Use when creating, moving, renaming, styling, or
  reviewing storefront components, styles, types, or UI folders under
  apps/storefront/features or apps/storefront/components.
---

# Storefront component structure

Every developer and agent must follow this when adding or changing storefront UI.

Canonical example: `apps/storefront/features/cart/`.

## Where code lives

| Folder | Holds |
| --- | --- |
| `features/<name>/` | A product feature: its components, CSS Modules, `type/`, `const/`, `hooks/` |
| `components/ui/` | Flat primitives with no feature parent |
| `components/<name>/` | Features not migrated yet. Move one into `features/` when you next change it substantially, in its own pull request, converting its styles to modules at the same time |
| `styles/` | `tokens.css` (design values and named breakpoints), `fonts.css` |
| `app/globals.css` | Cascade layers, reset, element defaults, shared helpers |
| `hooks/`, `lib/` | App-wide hooks; data, API and domain helpers (no UI types) |

## Layout

```
features/cart/
  index.ts                      # public API of the feature
  cart-provider.tsx             # leaf: no folder
  cart-empty.tsx
  cart-empty.module.css         # styles sit next to their component
  cart-palette.module.css       # feature-wide custom properties, shared via composes
  const/
    index.ts
    cart-copy.ts
  cart-page/                    # folder only because it has children
    index.ts                    # re-export only
    cart-page.tsx
    cart-page.module.css
    cart-line.tsx               # leaf child: no extra folder
    cart-line.module.css
```

## Rules

1. **Nest by ownership.** A file used only by one parent lives inside that parent's folder. Files used by two parents in the same feature go in a named shared folder (e.g. `making/record/`), not the feature root.
2. **Folder only when there are children.** A leaf is `feature/name.tsx`. Create `name/name.tsx` only when `name/` also holds child files.
3. **Never put a component in `index.tsx`.** `index.ts` only re-exports.
4. **Feature-local types go in `type/`, constants in `const/`, hooks in the owning parent's `hooks/`.** App-wide hooks stay in `apps/storefront/hooks/`.
5. **Shared types stay shared.** `Product`, `Order`, `AuthUser` come from `@rad/types`; the bilingual copy helper from `@/types/locale`; cross-feature API DTOs from `@/types/api`.
6. **Import from the feature's public path.** `app/` and other features import `@/features/cart`, never a grandchild. Inside a feature, use relative imports.

## Styles

1. **One `name.module.css` per component that has styles**, imported as `styles`. Class names are camelCase (`styles.line`, `styles.blocked`).
2. **Design values come from `styles/tokens.css`** (`var(--ink)`, `var(--page)`, `var(--text-body)`). Add a token there instead of repeating a raw value across features.
3. **Feature-only values** (a palette used by several components) go in a feature module and are shared with `composes: palette from "../cart-palette.module.css";`.
4. **Breakpoints use the names from `tokens.css`:** `@media (--phone)`, `(--tablet)`, `(--desktop)`, `(--wide)`, `(--reduced-motion)`, `(--motion-ok)`, `(--fine-pointer)`. Never write raw pixel widths.
5. **Classes owned by someone else are wrapped in `:global()`**: shared helpers (`.section`, `.button`) and other components' classes, e.g. `.actions :global(.button.outline)`. Modules are "pure": every selector needs at least one local class, so no bare element, `:root` or `html` selectors.
6. **Check what the shared `.section` rules already set.** `.section h2`, `.section h3` and `.section p` set font size (and paragraph line height) for everything inside a section. Don't redeclare them in a module unless the change is meant to be visible.
7. **Avoid `!important`.** Only use it to beat a shared rule that is itself `!important`, and say which rule in a one-line comment.
8. **No new global stylesheets for features.** `globals.css` layers are `reset`, `defaults` and `helpers`; component styles stay unlayered, so they win over those.
9. **`@counter-style` rules go in `app/globals.css`.** Turbopack renames them inside a module but not the `counter()` calls that use them. Keyframes are fine in a module when the animation that uses them is in the same file.
10. **A parent sizing a child component uses a custom property the child reads** (`--stroke-width`, `--swatch-size`), or passes a `className`. Don't rely on which module's CSS loads first.

## Checklist

- [ ] Feature lives in `features/<name>/` with a public `index.ts`
- [ ] Leaf component is `name.tsx`; a parent with children gets `name/name.tsx` plus an `index.ts` barrel
- [ ] Each styled component has a colocated `name.module.css`; no feature CSS in global files
- [ ] Values come from tokens, breakpoints use the named media queries
- [ ] Other components' classes are wrapped in `:global()`
- [ ] Unshared types, constants and hooks are in `type/`, `const/`, `hooks/`
- [ ] `app/` imports the feature barrel, not grandchildren
- [ ] Computed styles match before and after when the move is meant to be visual-only

## Anti-patterns

```
# BAD — component in index.tsx
features/foo/index.tsx

# BAD — wrapping a leaf with no children
features/cart/cart-provider/cart-provider.tsx

# BAD — raw breakpoint and repeated raw color
@media (max-width: 600px) { .line { color: #18231f; } }
# GOOD
@media (--phone) { .line { color: var(--ink); } }

# BAD — styling another component's class as if it were local
.actions .button { ... }      # becomes a hashed .button that matches nothing
# GOOD
.actions :global(.button) { ... }

# BAD — app importing a grandchild
import { CartLine } from "@/features/cart/cart-page/cart-line"
```
