# RAD Architecture Decision Records

This directory records decisions approved by the Tech Lead following the
2026-10 repository audit (Phases 01–03). Each ADR is **documentation of a
decision already made** — these files do not implement the decisions
themselves. Implementation happens in separate, independently reviewed PRs
that reference the relevant ADR number.

| ADR | Title | Status |
|---|---|---|
| [ADR-001](./adr-001-state-management-selection.md) | State management selection by ownership/scope | Accepted |
| [ADR-002](./adr-002-admin-route-architecture.md) | Independent Next.js routes for major Admin domains | Accepted |
| [ADR-003](./adr-003-admin-feature-organization.md) | Feature-based organization for Admin implementation | Accepted |
| [ADR-004](./adr-004-orders-gateway-extraction.md) | Incremental Orders/Gateway Payment extraction | Accepted |
| [ADR-005](./adr-005-shared-package-extraction.md) | Evidence-based shared-package extraction | Accepted |
| [ADR-006](./adr-006-shared-contract-ownership.md) | Single source of truth for shared contracts | Accepted |
| [ADR-007](./adr-007-test-first-refactoring.md) | Risk-based, test-first refactoring | Accepted |
| [ADR-008](./adr-008-agent-engineering-system.md) | Layered, tool-portable agent engineering system | Accepted |

ADRs do not supersede `AGENTS.md`. `AGENTS.md` and its per-app counterparts
state the operative rules agents must follow day to day; an ADR explains
*why* a rule exists and what was considered. Where the two conflict, the
most recently accepted ADR wins, and the relevant `AGENTS.md` must be
updated to match in the same PR.
