# ADR-008: Use a layered, tool-portable agent engineering system built from repository rules, app-specific guidance, reusable skills, execution workflows, and CI guardrails

**Status:** Accepted

## Context

This repository already has, independent of this audit, a partial
tool-portable agent-instruction system:

- A real, substantive root `AGENTS.md` (181 lines).
- `apps/storefront/AGENTS.md` and `apps/admin/AGENTS.md` are **only** the
  9-line Next.js-regenerated boilerplate block (`<!-- BEGIN:nextjs-agent-rules -->`
  / `<!-- END -->`, written by `node_modules/next/dist/server/lib/generate-agent-files.js`)
  — confirmed by direct read, Phase 02/03. No real app-specific content
  exists at either path today. `apps/api` has no `AGENTS.md`/`CLAUDE.md`
  at all.
- Three parallel skill directories already exist: `.claude/skills/`
  (generic skills only — animation, design, etc.), `.agents/skills/`
  (the same generic skills **plus** two project-specific ones:
  `api-module-structure` and `storefront-component-structure`), and
  `.cursor/skills/` (only the two project-specific skills). These are
  independent copies, not symlinks (confirmed by `diff`/`ls` during this
  PR's Step 1 inspection) — meaning the repository already has, in
  practice, an inconsistent multi-tool mirroring problem for skills.
- Real CI exists (`.github/workflows/ci.yml`): env-file guard → lint →
  `knip` (storefront-only) → changed-file-only Prettier check →
  `typecheck:all` → tests.

The root `AGENTS.md`'s own regenerated Next.js block already establishes
the durable pattern this ADR extends: a framework-owned marker block
(`BEGIN`/`END` comments) coexists with hand-maintained content in the same
file, and the generator only ever rewrites what's between its own
markers. This is the existing, working answer to "where do we put rules in
a file a framework regenerates."

## Approved Decision

Layer agent instructions as follows:

1. **Repository-wide instructions** (`AGENTS.md`, root): cross-cutting
   rules that must always apply — business rules, security-sensitive
   areas, testing-infrastructure truth, scope discipline. Stays the
   authoritative top layer.
2. **App-specific instructions** (`apps/*/AGENTS.md`): rules specific to
   one app's conventions (e.g. ADR-001's state-management rule for
   storefront, ADR-002/003's route/feature conventions for admin once
   implemented, a module-ownership map for API). Added **after** each
   app's existing regenerated block, using the same marker-coexistence
   pattern the Next.js generator already demonstrates — never by
   replacing or editing inside the generator's own `BEGIN`/`END` markers.
   `apps/api/AGENTS.md` does not yet exist and has no generator to
   coexist with; it is a plain new file.
3. **Reusable skills**: procedural, triggerable workflows that apply
   across many tasks of the same shape (e.g. `rad-safe-refactor`). Skills
   are not a place to restate AGENTS.md rules — they reference them.
4. **CI enforcement**: anything that can be checked mechanically (tests
   passing, lint, format, and in a future PR, dependency-boundary and
   dead-package checks per ADR-005) belongs in CI, not in prose that an
   agent might skip reading.

**Tool portability**: because this repository already maintains three
separate skill directories for different tools, the canonical source for
any new skill is written once and the existing mirroring convention
(copy, not symlink, since the host filesystem copies observed are not
symlinks) is followed for any tool that needs its own copy — but **this
PR only adds the skill to the location(s) this execution environment
actually supports** (see Step 5); extending it to every tool directory is
explicitly deferred, not assumed to be free or automatic.

## Rationale

This formalizes what the repository was already doing inconsistently
(regenerated-block coexistence, multi-directory skill mirroring) rather
than inventing a new mechanism, and it assigns each existing artifact
(AGENTS.md, skills, CI) a clear, non-overlapping job so that future
contributors don't have to guess where a new rule belongs.

## Trade-offs

- Not every AI tool in use discovers skills the same way; this ADR
  explicitly does not assume parity, and the current PR limits itself to
  one skill in one or more directories it can verify are actually
  discoverable, rather than guessing at every tool's mechanism.
- Keeping app-level AGENTS.md content minimal (per the audit's Step 4
  instruction not to duplicate large rule sets) means some judgment calls
  will still require consulting the root file; this is accepted as better
  than duplicated, driftable copies.

## Consequences

- `apps/api/AGENTS.md` will be created for the first time in a near-term
  follow-up PR (not this one, since this PR's Step 4 is scoped to minimal
  root updates — see PR summary) with a module-ownership map, per the
  audit's own module list (`admin`, `artist-applications`, `auth`, `cart`,
  `catalog`, `commissions`, `common`, `contact`, `content`, `damage`,
  `database`, `design`, `favorites`, `health`, `help`, `inventory`,
  `mail`, `notices`, `orders`, `payment`, `policies`, `pricing`,
  `reviews`, `session`, `shape`, `storage`).
- `apps/storefront/AGENTS.md` and `apps/admin/AGENTS.md` gain a short,
  hand-maintained section below the regenerated block (this PR adds the
  storefront one now, per ADR-001; the admin one is deferred to the
  ADR-002/003 implementation PR, per ADR-003's own reasoning about not
  documenting a structure that doesn't exist yet).

## Implementation Constraints

- Never edit content between a framework's own `BEGIN`/`END` markers by
  hand; never delete those markers to "clean up" a diff, per the existing
  root `AGENTS.md`'s own documented warning.
- No new CI gates in this PR (per the audit's Step 6 instruction); CI
  enforcement is explicitly a separately reviewed follow-up.

## Verification Expectations

- Any new app-level `AGENTS.md` content must be reviewed by a human
  before merge — it is not auto-generated from this audit without
  review, per the audit's own Step 2 instruction ("do not invent
  architectural facts").
- The `rad-safe-refactor` skill (Step 5) must be checked for actual
  discoverability in at least one supported tool before being considered
  complete, not merely written to match a format.
