# Velora AI Workflow Rules

Last verified: 2026-07-15

## Stage 1 — Plan

1. Read `AGENTS.md`, every context file, current progress, decisions, and the relevant active spec.
2. Read the relevant Next.js 16 guide before application code changes.
3. Audit repository implementation and identify exact behavior/root cause. Do not infer runtime success from code presence.
4. Create or update one active feature-unit spec.
5. List intended files, external dependencies, risks, compatibility constraints, and what will not change.

## Stage 2 — Implement

1. Make only scoped changes; preserve UI unless approved.
2. Maintain security invariants, schemas, aliases, and dirty-worktree changes.
3. Add only safe diagnostics needed to prove the issue.
4. Update implementation notes in the active spec.
5. Do not stop at an explanation when implementation is requested.

## Stage 3 — Verify

1. Run typecheck, lint, build, and `git diff --check`.
2. Run relevant automated tests; use emulators/live systems only when configured and authorized.
3. Clearly distinguish unexecuted, local, emulator, staging, and production testing.
4. Update the progress tracker and affected Bible files.
5. Append decisions when decisions occurred.
6. Move a spec to completed only after its criteria pass; blocked/incomplete work stays active.

## Permanent rules

- Work on one feature unit at a time. Do no unrelated work, invented behavior, fake placeholders, or silent scope changes.
- Ask the owner only for external console actions, credentials placement, payment/business decisions, ambiguous requirements, or irreversible actions. Never request secret values in chat.
- Preserve user changes and never delete or reset a dirty worktree.
- A successful build is not completion evidence by itself.

## New ideas and permanent updates

After every task update `progress-tracker.md`; update architecture, overview, UI, glossary, decisions, and the active spec when their subject changed. Never alter documentation to exaggerate readiness.

For a new owner idea: log it as proposed, add it to future scope, obtain approval and clear scope/UX/security/data/completion criteria, then create an active spec. Rejected work moves to `specs/rejected/` with the reason.

## Required final response

```text
CODEX UNIT REPORT

1. UNIT
2. AUDIT FINDINGS
3. WORK COMPLETED
4. FILES CREATED
5. FILES MODIFIED
6. DATA/API/RULE CHANGES
7. VALIDATION RESULTS
8. TESTING LEVEL
9. REMAINING ISSUES
10. OWNER ACTION
11. BIBLE FILES UPDATED
12. NEXT RECOMMENDED UNIT
```
