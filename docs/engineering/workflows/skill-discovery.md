# Agent skill discovery and session initialization

**Status:** procedure for reporting how a skill was found. It does not install tools, change global agent configuration, add a CI check, or make file presence into discovery. Branching, risk, and merge rules are in the [task-to-PR workflow](./task-to-pr.md). Structural refactors follow `rad-safe-refactor` and [ADR-007](../adr/adr-007-test-first-refactoring.md). Placement and mirrors follow [ADR-008](../adr/adr-008-agent-engineering-system.md).

The default base is the latest `origin/main`. Do not require a historical foundation branch.

## 1. Preflight

Before a skill test or a task that depends on one, record:

- current working directory
- branch
- HEAD commit
- `git status --short`
- whether this worktree is the task branch or an unrelated checkout

Read root [`AGENTS.md`](../../../AGENTS.md), the touched app's `AGENTS.md`, and the relevant ADRs from **this worktree**. Skills present in another checkout are not loaded here.

Use an isolated worktree. Do not switch, reset, or commit on an unrelated feature checkout. A stacked PR follows [task-to-PR workflow](./task-to-pr.md): branch from the dependency only when the work cannot be reviewed without it, then retarget to `main` after that dependency merges.

If the required skill file is absent from this worktree, stop the native test. Report **UNVERIFIED** or **FAILED**. Do not copy the skill into the active feature branch to produce a green result. Open a new session from a worktree that already contains the file.

## 2. File presence is not discovery

Tracked skill files live in three directories that are not the same set:

- `.claude/skills/`
- `.agents/skills/`
- `.cursor/skills/`

For `rad-safe-refactor`, ADR-008 names `.claude/skills/rad-safe-refactor/SKILL.md` as the canonical file. The `.agents/skills/` and `.cursor/skills/` copies must be byte-identical. Confirm with `git rev-parse` or `diff` at the current commit. On the `main` used for this review, those three blobs matched.

That rule does not cover every skill. `api-module-structure` is not in `.claude/skills/`. `storefront-component-structure` is not byte-identical between `.agents/skills/` and `.cursor/skills/`. Report a missing or drifted copy. Do not fix it inside an unrelated task, and do not describe a future mirror checker as already required. This document does not add one.

## 3. Statuses

Use one status per tool and per session. **VERIFIED** requires both native discovery and native invocation in that session. Reading `SKILL.md` is **MANUAL FALLBACK**, including when the session instructions say to open that file.

| Status | Meaning |
| --- | --- |
| **VERIFIED** | This session's own listing showed the skill, and this session's native invoke action succeeded. Record the listing, the invoke action, the loaded name, and the directory. |
| **FAILED** | A native invoke was attempted in this session and failed. Quote the error. |
| **UNVERIFIED** | This session did not complete both listing and native invoke. Absence of a tool, a missing file, or a second-hand transcript all stay here. |
| **MANUAL FALLBACK** | The file was read and followed without a successful native invoke. Report it separately from VERIFIED. |

Also record whether the session changed files, commits, pull requests, or a deploy. A discovery test should change none of them.

An invocation test does not prove a refactor. A planning dry run may conclude **NO REFACTOR**. Only a separate, authorized, test-backed PR demonstrates the full workflow. Say which of those happened.

## 4. Tools are not interchangeable

Do not mark a tool verified because another tool was, or because the Markdown file exists.

**Claude Code.** The repository convention is `.claude/skills/<name>/SKILL.md`. Native evidence is that session's skill listing plus its Skill invoke, not a file read. An older operator transcript reported success in a foundation worktree and `Unknown skill: rad-safe-refactor` in a checkout that lacked the file. That transcript was not rerun for this review, and that worktree is gone. Claude Code on current `main`: **UNVERIFIED**.

**Cursor.** Project skills are catalogued from `.cursor/skills/<name>/SKILL.md` when the session starts in a tree that contains them. This Cursor session listed `rad-safe-refactor` at `.cursor/skills/rad-safe-refactor/SKILL.md`. That is discovery of the catalog entry only. Cursor's follow-through is to read `SKILL.md`. That read is manual fallback, and no separate invoke result was returned. Cursor invocation: **UNVERIFIED**.

**Codex.** No Codex session was run. `.agents/skills/` is a directory in the repo. ADR-008 does not identify a Codex loader for it. Codex: **UNVERIFIED**.

**Kilo.** This repository has no Kilo skill directory, config, or session, and none was installed for this review. Kilo: **UNVERIFIED**. That is not a finding that Kilo is unsupported.

## 5. Read-only check

> In this session only, report working directory, branch, HEAD, and short git status. Report whether `rad-safe-refactor` appears in the native skill listing and whether a native invoke succeeded. If the only action available is reading `SKILL.md`, label that manual fallback and mark invocation UNVERIFIED. Do not edit files, switch branches, merge, or deploy.
