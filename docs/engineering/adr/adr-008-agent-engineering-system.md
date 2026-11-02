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
separate skill directories (`.claude/skills/`, `.agents/skills/`,
`.cursor/skills/`), each new skill has one **canonical source** and is
mirrored as byte-identical copies into every directory this repository
already uses for skills — matching the existing, pre-audit convention of
plain file copies, not symlinks (confirmed by `diff`: the existing
`api-module-structure`/`storefront-component-structure` files in
`.agents/skills/` and `.cursor/skills/` are not symlinked to one
location).

Canonical source and sync method for `rad-safe-refactor`:
`.claude/skills/rad-safe-refactor/SKILL.md` is the canonical file; the
`.agents/skills/` and `.cursor/skills/` copies are produced by copying it
verbatim. There is no build step or script that keeps them in sync
automatically — **whoever edits this skill must re-copy it to all three
directories in the same commit**, and a reviewer should diff the three
files before approving any future change to this skill. This PR's own
copies were verified identical by direct `diff` and matching checksums
(see Step 6 of the PR this ADR accompanies).

**Discoverability is reported, not assumed**, per target tool:
- **Claude Code** (this execution environment): **unverified**. The
  skill file is placed at the path this tool's own skill-loading
  convention uses (`.claude/skills/<name>/SKILL.md`, matching the format
  of other skills already in that directory), but no observation in this
  session confirmed `rad-safe-refactor` actually appears in a skill
  listing — the existing project-specific skills
  (`api-module-structure`, `storefront-component-structure`) were not
  observed in this session's own skill listing either, despite existing
  in `.agents/skills/` and `.cursor/skills/`. Placement follows
  convention; it is not proof of discovery.
- **The generic `.agents/skills/` convention**: **unverified**. No tool
  in this audit's execution environment reads this path; it is mirrored
  because two existing project skills already live there, on the
  assumption that whatever tool created them discovers skills from that
  location — an assumption carried over from the existing repository
  convention, not independently confirmed by this PR.
- **Cursor** (`.cursor/skills/`): **unverified**, for the same reason —
  mirrored to match the existing convention, not confirmed by running
  Cursor against this file.
- No tool was found in this audit to be definitively **unsupported** for
  this skill format; "unverified" is the honest status for all three
  targets, not "verified," and this ADR does not claim otherwise.

## Rationale

This formalizes what the repository was already doing inconsistently
(regenerated-block coexistence, multi-directory skill mirroring) rather
than inventing a new mechanism, and it assigns each existing artifact
(AGENTS.md, skills, CI) a clear, non-overlapping job so that future
contributors don't have to guess where a new rule belongs.

## Trade-offs

- Not every AI tool in use discovers skills the same way, and this ADR
  does not assume parity: the current PR mirrors `rad-safe-refactor`
  into all three existing skill directories to match the repository's
  own pre-existing convention, but reports discoverability in each as
  **unverified** rather than claiming the mirroring itself proves any
  tool will find the file.
- Mirroring by hand (no sync script) means a future edit to one copy
  and not the others is a real risk; this PR accepts that risk now
  (consistent with not adding new tooling/CI in this PR) and states the
  manual-sync expectation explicitly rather than silently relying on
  reviewers to notice drift.
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
- Before any PR that edits `rad-safe-refactor` (or any future mirrored
  skill) is merged, the reviewer must confirm all mirrored copies are
  byte-identical (e.g. `diff`/checksum across `.claude/`, `.agents/`,
  `.cursor/`) — drift between copies is a documentation defect, not a
  cosmetic one, since different tools may load different copies.
- A future PR that actually exercises this skill end-to-end in a given
  tool (Claude Code, or any other) should update this ADR's
  discoverability table from "unverified" to "verified" for that tool,
  with a note on how it was confirmed — this ADR does not pre-claim that
  outcome.
