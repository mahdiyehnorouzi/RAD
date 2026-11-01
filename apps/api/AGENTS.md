# API Engineering Rules

These rules supplement the repository root `AGENTS.md`. Read [API architecture](../../docs/engineering/architecture/api.md), [ADR-004](../../docs/engineering/adr/adr-004-orders-gateway-extraction.md), [ADR-006](../../docs/engineering/adr/adr-006-shared-contract-ownership.md), and [ADR-007](../../docs/engineering/adr/adr-007-test-first-refactoring.md) for affected work. Root security and production-safety rules always apply. When an audit note and the current source disagree, the current source and its tests win.

File layout (`type/`, `dto/`, one concern per file) belongs to the `api-module-structure` skill. This file does not restate it.

## Ownership and boundaries

- NestJS modules under `src/` own their domain. Controllers handle HTTP adaptation and guards; DTOs validate request shape; services own business operations; TypeORM entities live under `src/database/entities/`.
- Trace an operation through controller, guard, DTO, service, entity, and related callers before modifying it. Do not bypass module boundaries by importing another module's internals merely to avoid proper dependency injection.
- Shared, framework-independent contracts used by multiple workspace apps belong in the approved shared-contract source (ADR-006). Keep database access, authorization decisions, secrets, and request-specific checks in the API.
- Never infer behavior solely from an audit's file paths or line numbers: verify the current source and tests at the current commit. The linked architecture note is the October 2026 audit. It omits `src/product-attributes/` and still says `src/cart/` has zero specs. Re-list `src/` before relying on that module list.

## High-risk write paths

- Orders, gateway payment, inventory reservation, cart holds, authentication, admin permissions, media authorization, and pricing are high risk. Preserve lock scope, transaction boundaries, idempotency, status transitions, and fail-closed authorization unless a separately approved behavior change requires otherwise.
- Receipt approval and rejection are orders-module behavior. On current `main` that service is `src/orders/payment-review.service.ts`, called from admin. Confirm the file before editing. Do not assume the logic is still inlined only in `admin.service.ts` or only in `orders.service.ts`.
- ADR-004's gateway extraction has not landed: verification and retry still live in `src/orders/orders.service.ts`. The branch named in that ADR, `feat/checkout-redesign-zarinpal`, is already contained in `main`. Do not start the extraction on top of other unmerged payment work, and do not relocate `checkout()`'s post-commit gateway startup in the first extraction.
- `src/cart/` is the inventory-hold trigger. Read the specs that exist before any structural change. On current `main`, `cart-reliability.spec.ts` covers concurrent holds, idempotent add, checkout handoff, and expiry. The October 2026 "zero cart specs" sentence in root `AGENTS.md` §10, the API architecture note, and ADR-007 is historical. Characterize paths those specs do not cover — remove, clear, controller and DTO validation, and any owner-isolation case beyond the existing hold tests — against the current implementation.
- Media upload authorization must never treat a plausible object-key shape as proof of ownership. Preserve issued-upload checks and durable `ProductImage` ownership verification.

## Workflow

1. Inspect current code, working-tree status, existing tests, and the affected end-to-end flow.
2. Identify source of truth, downstream clients, and transaction/permission boundaries.
3. Classify refactor readiness; use `rad-safe-refactor` for behavior-preserving structural changes.
4. Write and run baseline characterization tests first for critical write paths. Run existing repository test scripts; do not invent commands.
5. Make one focused change in an isolated branch/worktree, validate as far as the environment permits, and report skipped checks explicitly.
6. Prepare a PR with impact, tests, rollback considerations, and required human sign-off. Do not merge or deploy without authorization.

Do not add a new top-level module, dependency, migration, or shared package solely for cosmetic organization. ADRs approve a target direction, not an unreviewed production behavior change.
