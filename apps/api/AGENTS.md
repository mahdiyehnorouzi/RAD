# API Engineering Rules

These rules supplement the repository root `AGENTS.md`. Read [API architecture](../../docs/engineering/architecture/api.md), [ADR-004](../../docs/engineering/adr/adr-004-orders-gateway-extraction.md), [ADR-006](../../docs/engineering/adr/adr-006-shared-contract-ownership.md), and [ADR-007](../../docs/engineering/adr/adr-007-test-first-refactoring.md) for affected work. Root security and production-safety rules always apply.

## Ownership and boundaries

- NestJS modules under `src/` own their domain. Controllers handle HTTP adaptation and guards; DTOs validate request shape; services own business operations; TypeORM entities live under `src/database/entities/`.
- Trace an operation through controller, guard, DTO, service, entity, and related callers before modifying it. Do not bypass module boundaries by importing another module's internals merely to avoid proper dependency injection.
- Shared, framework-independent contracts used by multiple workspace apps belong in the approved shared-contract source (ADR-006). Keep database access, authorization decisions, secrets, and request-specific checks in the API.
- Never infer behavior solely from an audit's file paths or line numbers: verify the current source and tests at the current commit.

## High-risk write paths

- Orders, gateway payment, inventory reservation, cart holds, authentication, admin permissions, media authorization, and pricing are high risk. Preserve lock scope, transaction boundaries, idempotency, status transitions, and fail-closed authorization unless a separately approved behavior change requires otherwise.
- For `src/orders/orders.service.ts`, apply ADR-004's incremental extraction only after checking that active payment work has landed. Do not relocate post-commit gateway startup in the first extraction.
- `src/cart/` had no dedicated specs at the October 2026 audit. Before structural changes, characterize add/remove/clear, hold/release behavior, owner isolation, and failure paths against the actual current implementation.
- Media upload authorization must never treat a plausible object-key shape as proof of ownership. Preserve issued-upload checks and durable `ProductImage` ownership verification.

## Workflow

1. Inspect current code, working-tree status, existing tests, and the affected end-to-end flow.
2. Identify source of truth, downstream clients, and transaction/permission boundaries.
3. Classify refactor readiness; use `rad-safe-refactor` for behavior-preserving structural changes.
4. Write and run baseline characterization tests first for critical write paths. Run existing repository test scripts; do not invent commands.
5. Make one focused change in an isolated branch/worktree, validate as far as the environment permits, and report skipped checks explicitly.
6. Prepare a PR with impact, tests, rollback considerations, and required human sign-off. Do not merge or deploy without authorization.

Do not add a new top-level module, dependency, migration, or shared package solely for cosmetic organization. ADRs approve a target direction, not an unreviewed production behavior change.
