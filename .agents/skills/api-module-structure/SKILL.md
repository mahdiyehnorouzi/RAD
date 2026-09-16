---
name: api-module-structure
description: >-
  Enforces RAD NestJS API module structure: colocated type/ and dto/ folders,
  one file per concern, and single-responsibility controllers, services,
  mappers, factories, and helpers under apps/api/src. Use when creating,
  moving, renaming, or reviewing API modules, DTOs, types, or services.
---

# API module structure

Every developer and agent must follow this when adding or changing anything under `apps/api/src`.

Canonical small example: `apps/api/src/content/` (`type/` + `*.data.ts` + thin service/controller). Target layout for larger modules: `apps/api/src/commissions/`. Closest current split-by-task example: `apps/api/src/pricing/`.

## Layout

```
feature/
  type/                         # interfaces & types owned by this module
    index.ts                    # re-export only
    commission.ts
    row.ts
  dto/                          # request validation classes
    index.ts                    # optional barrel
    create-commission.dto.ts    # one DTO (or tightly related pair) per file
    decide-commission.dto.ts
  const/                        # constants / enums / static maps (optional)
    index.ts
    stages.ts
  feature.module.ts
  feature.controller.ts         # HTTP only
  feature.service.ts            # orchestration + persistence coordination
  feature.mapper.ts             # shape transforms only (optional)
  feature.factory.ts            # construct domain objects only (optional)
  feature.mutate.ts             # pure domain mutations only (optional)
  feature.data.ts               # static seed / FAQ-style data only (optional)
```

Nest wires the module; folders do not change import paths for Nest providers. Prefer named files (`create-commission.dto.ts`), never dump unrelated exports into one catch-all file.

## Rules

1. **Separate types from runtime code.** Module-owned `type` / `interface` / type-only aliases live in `type/`. Do not declare exported types inside `.service.ts`, `.controller.ts`, `.mapper.ts`, or `.data.ts`. Private one-off types used in a single function may stay local; anything reused or exported goes in `type/`.
2. **`type/` is shapes only.** No functions, no Prisma queries, no class-validator DTOs. Helpers like `loc()` or `newEntityId()` belong in a dedicated util file (e.g. `commission.ids.ts`), not in `type/`.
3. **DTOs live in `dto/`.** One request DTO per file (or a tightly related request/response pair). Do not use a monolithic `dto.ts` that mixes unrelated endpoints. Prefer the existing auth/orders style: `dto/create-review.dto.ts`.
4. **Constants in `const/` (or `*.data.ts` for static content).** Status lists, permission maps, FAQ copy, notice kind tables — not inlined in services.
5. **One job per file.**
   - `*.controller.ts` — routes, guards, parse params, call service, return. No business rules, no Prisma.
   - `*.service.ts` — use-case orchestration and persistence. If a service grows multiple unrelated domains, split into focused services or extract `*.mutate.ts` / `*.factory.ts` / `*.mapper.ts`.
   - `*.mapper.ts` — record ↔ API/domain shape only.
   - `*.factory.ts` — create initial domain objects only.
   - `*.mutate.ts` — pure in-memory domain transitions only.
   - `*.data.ts` — static datasets only.
6. **Shared cross-app contracts stay shared.** Types consumed by storefront/admin → `@rad/types`. Cross-module API internals → `apps/api/src/common/` (e.g. `identity.ts`). Do not re-declare `AuthUser` / `Product` inside a feature.
7. **Import from the owning module path.** Controllers import DTOs from `./dto/...` or `./dto`; services import types from `./type`. Do not reach into another feature’s private files when a shared package or `common/` exists.
8. **`common/` is shared infrastructure only** (guards, cookies, identity, filters) — not a dumping ground for feature types.
9. **Prisma stays in `prisma/`.** Feature modules inject `PrismaService`; they do not own the Prisma client module.

## Module map

| Folder | Role |
| --- | --- |
| `auth/` | Session, register, password flows; DTOs already in `dto/` |
| `admin/` | Ops products/orders/members; split DTOs and permissions into `dto/` + `type/` / `const/` |
| `catalog/` | Product listing + media; mapper stays mapping-only |
| `cart/` | Cart mutations |
| `orders/` | Checkout + payment confirm; status consts in dedicated file |
| `commissions/` | Making commissions — factory / mutate / type / dto split |
| `notices/` | User notices; kinds in dedicated file under `const/` or `type/` |
| `content/` | Public content (FAQ); types in `type/`, copy in `*.data.ts` |
| `design/` | Design generation |
| `favorites/` | Favorites |
| `reviews/` | Reviews |
| `pricing/` | Price crawl/match/policy — already one task per file |
| `payment/` | Payment session helpers |
| `mail/` | Mail delivery |
| `health/` | Health check only |
| `common/` | Cross-cutting auth identity, guards, cookies |
| `prisma/` | Prisma client module |

## Checklist for a new module or file

- [ ] Exported types/interfaces in `feature/type/` (barrel `index.ts`)
- [ ] Each DTO in its own `feature/dto/*.dto.ts` file
- [ ] Constants / static data not mixed into services
- [ ] Controller does HTTP only
- [ ] Service does not also define public types or unrelated helpers
- [ ] Mapper / factory / mutate extracted when the service would otherwise mix concerns
- [ ] Shared contracts use `@rad/types` or `common/`, not copy-pasted
- [ ] No monolithic `dto.ts` / `types.ts` dumping unrelated exports

## Anti-patterns

```
# BAD — types inside the service
// commissions.service.ts
export type LocalizedFaq = { ... }
type CommissionRow = { ... }   # if reused → type/row.ts

# BAD — helpers mixed into type files
// commission.types.ts
export type MakingBrief = { ... }
export function loc(fa, en) { ... }   # → commission.ids.ts or similar

# BAD — monolithic DTO dump
// admin/dto.ts  (SaveProductDto + UpdateOrderDto + InviteMemberDto)
# → dto/save-product.dto.ts, dto/update-order.dto.ts, dto/invite-member.dto.ts

# BAD — controller with business logic / Prisma
async create(@Body() body) {
  return this.prisma.product.create({ data: body });
}

# BAD — one service owning unrelated domains
// AdminService doing products + orders + members + commissions
# with no extracted mappers/helpers — split by task or extract files

# BAD — feature type in global dump
apps/api/src/types/foo.ts       # only used by one module

# BAD — re-declaring shared contracts
type AuthUser = { id: string }  # use common/identity or @rad/types
```

## Migration

When touching an existing module, move types into `type/` and split monolithic `dto.ts` in the same change when practical. Do not rewrite unrelated modules in the same PR.
