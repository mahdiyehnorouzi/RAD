---
name: storefront-component-structure
description: >-
  Enforces RAD storefront component folder structure: nested parent/child
  folders, named component files (never index.tsx), colocated type/ and const/
  folders for feature-local types, constants, and hooks, and index.ts barrels only. Use when
  creating, moving, renaming, or reviewing storefront components, types, or
  UI folders under apps/storefront/components.
---

# Storefront component structure

Every developer and agent must follow this when adding or changing anything under `apps/storefront/components`.

Canonical example: `apps/storefront/components/difference/`.

## Layout

```
feature/
  type/                         # types owned by this feature
    index.ts
    permission.ts
  const/                        # constants owned by this feature
    index.ts
    photo-label.ts
  hooks/                        # hooks owned by this parent/feature
    index.ts
    use-designer.ts
  record/                       # shared pieces used by more than one parent
    index.ts
    biography-rail.tsx
  parent-name/                  # folder only because it has children
    parent-name.tsx
    index.ts                    # re-export only
    child-a.tsx                 # leaf child — no extra folder
    child-b/
      child-b.tsx
      grandchild.tsx
      index.ts
  leaf-sibling.tsx              # only if it is a true feature-level component
  index.ts                      # public API of the feature
```

`@/components/feature/parent-name` still resolves when `parent-name/` has `index.ts`. Do not also keep `parent-name.tsx` next to that folder.

## Rules

1. **Nest by ownership.** A file used only by one parent lives inside that parent's folder. Files used by two parents in the same feature go in a named shared folder, not the feature root (see `making/record/` for biography rail, quote card, and the other commission-record pieces reused by workshop).
2. **Folder only when there are children.** A leaf component is `feature/name.tsx` (e.g. `catalog/catalog-provider.tsx`, `cart/cart-provider.tsx`). Create `name/name.tsx` only when `name/` also contains child files (e.g. `commerce/commerce-provider/` because it owns `commerce-toast.tsx`).
3. **Never put a component in `index.tsx`.** When a folder is needed: `portrait-view/portrait-view.tsx`. `index.ts` only re-exports. Relative imports from `index.tsx` resolve as if they came from the parent folder and break.
4. **Feature-local types go in `type/`.** Feature-local constants go in `const/`. Feature-local hooks go in `hooks/` (e.g. `useDesigner` in `studio/custom-designer/hooks/`). Do not dump them in `apps/storefront/types/` or `lib/`. App-wide hooks stay in `apps/storefront/hooks/`.
5. **Shared types stay shared.** `Product`, `Order`, `AuthUser` → `@rad/types`. Bilingual copy helper → `@/types/locale`. API DTOs used across features → `@/types/api`. Making domain types live in `@/components/making/type` because making owns them; workshop imports from there.
6. **Import from the feature public path.** `app/` pages import `@/components/making`, `@/components/home`, `@/components/commerce` — not grandchildren. Inside a parent folder, use relative imports (`./child`, `../sibling`).
7. **`components/ui/` stays flat** (primitives with no feature parent).
8. **`lib/` is not for UI types.** `lib/api/` HTTP, `lib/making/` domain helpers/seed, `lib/catalog/` fixtures.

## Feature map

| Folder | Role |
| --- | --- |
| `difference/` | `type/`, `const/`, `portrait-view/`, `trail-strip.tsx` |
| `making/` | `customer-detail/`, `customer-list/`, `record/`, `type/`, `const/` |
| `workshop/` | `workshop-board/`, `workshop-detail/` |
| `studio/` | `custom-designer/` (includes `hooks/`), `type/` |
| `catalog/` | `catalog/` + `catalog-provider.tsx` |
| `commerce/` | `commerce-provider/`, `type/`, `notification-center.tsx` |
| `cart/` | `cart-provider.tsx`, `cart-page/` |
| `checkout/` | `checkout-page/` |
| `account/` | `account-page/` |
| `orders/` | `orders-page/` |
| `favorites/` | `favorites-page.tsx` |
| `reviews/` | `reviews/` |
| `product/` | `listing/`, `artwork-visual/`, `product-detail/` |
| `home/` | `sections/`, `home-banner.tsx` |
| `layout/` | `header/`, `chrome/` |
| `i18n.tsx` | Locale provider (must stay a file, not a folder) |
| `ui/` | Flat primitives |

## Checklist for a new component

- [ ] Leaf component is `feature/name.tsx` (no extra folder)
- [ ] Parent with children: folder + `name/name.tsx` + `index.ts` barrel
- [ ] Children nested under the parent; intra-folder imports are relative
- [ ] Unshared types in `feature/type/`
- [ ] Unshared constants in `feature/const/`
- [ ] Unshared hooks in the parent’s `hooks/` folder
- [ ] No `index.tsx` component entry
- [ ] `app/` pages import the feature barrel or the parent, not grandchildren

## Anti-patterns

```
# BAD — shared pieces dumped at the feature root
components/making/biography-rail.tsx
components/making/quote-card.tsx
# put them in making/record/ so ownership is obvious

# BAD — component in index.tsx
components/foo/index.tsx
import { Child } from "./child";   # TypeScript looks for components/child

# BAD — folder and file with the same name
components/i18n.tsx
components/i18n/index.ts
# TypeScript cannot resolve @/components/i18n

# BAD — wrapping a leaf with no children
components/cart/cart-provider/cart-provider.tsx
components/cart/cart-provider/index.ts
# cart-provider has no children — keep cart/cart-provider.tsx

# BAD — local type in global dump
apps/storefront/types/foo.ts       # only used by one feature

# BAD — app importing a grandchild
import { CartLine } from "@/components/cart/cart-page/cart-line"
```
