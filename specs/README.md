# Velora Feature Units

Last verified: 2026-07-15

A **unit** is one bounded product/technical outcome with its own repository truth, scope, security constraints, implementation plan, and completion evidence. One unit at a time limits regressions and prevents giant prompts from mixing unrelated decisions.

## Naming and lifecycle

- Name files `unit-001-feature-name.md`, incrementing IDs without reuse.
- `specs/active/`: approved work being planned, implemented, verified, or blocked.
- `specs/completed/`: criteria satisfied with validation evidence.
- `specs/rejected/`: rejected/cancelled work retaining decision and reason.
- `specs/template.md`: starting structure; replace every generic field with project truth.

Every unit follows **PLAN → IMPLEMENT → VERIFY**. Owner decisions and relevant decision IDs are recorded in the spec. A unit is not completed merely because code exists or builds. Blocked units remain active with the blocker, evidence, and exact owner/external action.

## Working rules

- Read the Bible and audit current routes/files/collections before writing the spec.
- Reference exact paths, route handlers, collections, rules, and aliases.
- Keep prompts/specs bounded; move durable facts to context files rather than repeating project history.
- Record implementation deviations and actual validation results.
- Update progress after every task and update architecture/overview/UI/glossary/decisions when their subject changed.
- To supersede a spec, mark it superseded, link the replacement unit/decision, and retain the original file/history.
- No completed status without all completion criteria and truthful evidence.
