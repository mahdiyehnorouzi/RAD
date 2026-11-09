# RAD agent automation pilot

## What this pilot does

A repository owner prepares a GitHub issue with a clear task and acceptance criteria, then adds the `agent-ready` label. The workflow runs Cursor Agent in an isolated GitHub Actions runner, asks it to follow the repository's existing `AGENTS.md` and skills (including `rad-testing`), and creates a draft PR on a separate branch. The normal RAD `CI passed` workflow then runs the repository's existing lint, typecheck, tests, builds, and release-policy checks.

The agent is restricted by prompt to non-sensitive work. It must stop without changing files when the task is ambiguous or touches authentication, authorization, payment, inventory, order ownership, pricing, file authorization, or database behavior. It cannot merge or deploy. Every generated PR needs human review.

## One-time setup

1. In Cursor, create an API key for CLI use.
2. In GitHub, add it as repository secret `CURSOR_API_KEY` under **Settings → Secrets and variables → Actions**.
3. Configure a Cursor usage/spend limit before enabling the workflow. Cursor CLI usage in CI is metered; it is not an unlimited extension of the editor subscription.
4. Add the `agent-ready` label to the repository if it does not already exist.

A missing secret fails with a clear error. The workflow only starts for an issue authored by the repository owner and only when that label is added. Do not put secrets in issue text.

## Operating procedure

1. Create or select a GitHub issue and include: objective, current behavior, desired behavior, acceptance criteria, scope exclusions, and relevant RAD task ID.
2. Confirm the issue is ready for implementation. Add `agent-ready`.
3. Review the workflow run. If it creates no PR, read its log: the agent may have found missing acceptance criteria or a sensitive-area gate.
4. Review the draft PR and its test evidence. The existing CI must pass on the PR head. Handle flaky or infrastructure failures separately from product regressions.
5. Mark ready or merge only after human review and required project approvals.

## Cost and limits

- GitHub Actions still runs the existing deterministic CI on each PR.
- Cursor Agent runs only for an owner-authored issue that receives the opt-in label; model usage is billed at Cursor's metered agent rates. Set the spend limit in Cursor before use.
- No Anthropic API key or additional AI provider is required for this pilot.
- Task selection from the RAD spreadsheet is still a human step. This avoids adding a new integration, paid API, or a brittle browser-based spreadsheet bot before the implementation handoff is proven.

## Rollback

Remove the workflow file and this guide in a follow-up PR. Existing CI and deploy workflows are independent of this pilot.
