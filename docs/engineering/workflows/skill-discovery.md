# Agent Skill Discovery and Session Initialization

**Status:** Engineering procedure; complements [ADR-008](../adr/adr-008-agent-engineering-system.md), [ADR-007](../adr/adr-007-test-first-refactoring.md), and the [Task-to-PR workflow](./task-to-pr.md) (currently a separate stacked PR). No tool discovery behavior is assumed from file presence alone.

## 1. Preflight before an agent task

Record the current working directory, Git branch, HEAD commit, and `git status --short`. Check the task's intended base branch against the current working tree. On a stacked PR, use an isolated worktree whose branch contains the necessary rules and skills; do **not** switch or overwrite an unrelated active feature worktree.

Read root `AGENTS.md` plus applicable app-specific rules and ADRs from **the current worktree**. Determine what the task requires before attempting a skill. Do not silently assume that skills available in another worktree are loaded into this session.

## 2. Native discovery and invocation

When an applicable skill is required:

1. Check the tool's actual available-skills listing or native discovery interface in **this session**.
2. Attempt native invocation using the mechanism supported by that tool (for Claude Code, the native Skill mechanism where available).
3. Record the observed result, loaded skill name, and reported base directory.
4. **Do not** count `cat SKILL.md`, a direct file read, or viewing a mirrored copy as successful native invocation. Manual use of the contents is permitted only if explicitly labeled **manual fallback**, not as a native Skill test.
5. Never claim that all agents discover a skill merely because its Markdown exists in `.claude/skills/`, `.agents/skills/`, and `.cursor/skills/`.

The `rad-safe-refactor` skill has been **natively discovered and invoked in a Claude Code session started from the isolated Foundation worktree**, according to an operator-supplied session transcript. A different Claude Code session rooted in a feature worktree lacking the file returned `Unknown skill: rad-safe-refactor`. These are environment-specific observations, not contradictory global claims.

Cursor, Codex, Kilo and any other tools require separate verification in their own environment; do not mark them verified by analogy.

## 3. Evidence-based reporting

Report separately for each tool/session:

| Field | Required evidence |
| --- | --- |
| Worktree | Working-directory path, branch, and commit |
| File presence | Relevant skill file path exists in that worktree |
| Native discovery | Observed listing or tool discovery result |
| Invocation | Exact native skill call and success/failure |
| Loaded content | Confirmation that the expected skill sections loaded |
| Changes | Explicit yes/no for files, commits, PRs and deployment |

Use these statuses:
- **VERIFIED:** native discovery **and** invocation succeeded in the stated environment.
- **FAILED:** native invocation was attempted and failed; identify the mechanical cause if confirmed.
- **UNVERIFIED:** no conclusive native invocation test in that environment.
- **MANUAL FALLBACK:** read and applied skill content without a successful native invocation; report separately from VERIFIED.

If the session is on the wrong branch or the skill is not natively available, stop the claimed native test and recommend a new session in the intended worktree. Do not invent a success or copy the skill into unrelated feature branches just to make the status green.

## 4. Refactor dry-run acceptance

An invocation-only test checks discovery, **not** successful refactoring. A planning dry run checks task judgment and should be able to conclude **NO REFACTOR** for cohesive code. Only a separately authorized, isolated, test-backed implementation-and-review PR can demonstrate the full workflow. Record which milestone was actually achieved.

## 5. Mirror consistency and future automation

`.claude/skills/rad-safe-refactor/SKILL.md` is the canonical skill file under ADR-008; `.agents/` and `.cursor/` copies are mirrors. Before accepting edits to this skill, compare copies byte-for-byte. This procedure does **not** add a CI gate or promise automated synchronization. A later CI PR should enforce mirror drift and valid skill metadata, without changing business logic.

## 6. Example read-only validation prompt

> Verify native discovery and invocation of `rad-safe-refactor` in this exact agent session. Report current working directory, Git branch, skill listing, actual invocation result, and loaded directory. Do not substitute reading SKILL.md for native invocation; do not modify repository files or merge anything.
