# Velora Codex Entry Point

Last verified: 2026-07-15

This file is mandatory for every AI/Codex session in this repository.

<!-- BEGIN:nextjs-agent-rules -->
## This is not the Next.js you know

This project uses Next.js 16, whose APIs and conventions may differ from training data. Before writing application code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Required reading before editing

1. Read this file.
2. Read every file in [`context/`](context/), especially [`progress-tracker.md`](context/progress-tracker.md) and [`decisions-log.md`](context/decisions-log.md).
3. Read the relevant specification in [`specs/active/`](specs/active/).
4. Inspect the actual implementation. Repository truth outranks chat summaries and reports.
5. A route or component proves only that code exists. A build pass does not prove runtime behavior.

## Non-negotiable rules

- Never redesign, rewrite, reset, clean up, or change product scope without explicit owner approval.
- Modify only files required by the active unit. Preserve design, architecture, APIs, schemas, compatibility aliases, and dirty-worktree changes.
- Never expose secrets or ask for secrets in chat. Direct the owner to `.env.local` or the hosting console.
- Never trust client-supplied roles, fares, payment state, admin state, driver assignment, or protected ride statuses.
- Use Firebase Admin in server-only code for privileged operations and verify Firebase ID tokens plus trusted role data.
- Maintain one centralized Google Maps loader: [`lib/googleMaps.ts`](lib/googleMaps.ts). Do not add a second loader/provider.
- Preserve backward-compatible Firestore aliases unless an approved, documented migration exists.
- Never claim a test that was not executed. Distinguish code implemented, build validated, local runtime tested, emulator tested, staging tested, production tested, blocked, and needs verification.
- Do not stop at an explanation when implementation was requested. Stop only for genuine external owner action or unresolved business decisions.

## Feature-unit workflow

- Create or update an active spec before major implementation.
- Follow PLAN → IMPLEMENT → VERIFY as defined in [`context/ai-workflow-rules.md`](context/ai-workflow-rules.md).
- Move a spec to `specs/completed/` only when its completion criteria and validation evidence pass.
- Move rejected/cancelled work to `specs/rejected/` and retain the reason.

## Permanent Bible update policy

After every future task:

1. Update [`context/progress-tracker.md`](context/progress-tracker.md), appending a session entry without erasing history.
2. Append [`context/decisions-log.md`](context/decisions-log.md) if a meaningful decision was made.
3. Update [`context/architecture.md`](context/architecture.md) after architecture or schema changes.
4. Update [`context/project-overview.md`](context/project-overview.md) after product or business-scope changes.
5. Update [`context/ui-context.md`](context/ui-context.md) only after an approved UI change.
6. Update [`context/glossary.md`](context/glossary.md) when project-specific terms or statuses are introduced.
7. Record the actual result in the active spec; never edit the Bible to make the project look more complete.

When the owner proposes a new idea, record it as proposed in the decisions log and future scope. Create an active implementation spec only after approval and after scope, UX, security, data, and completion criteria are clear. Rejected ideas retain their rationale in `specs/rejected/`.

## Validation

After meaningful code changes run:

```text
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Run relevant automated, emulator, and manual tests when available. Documentation-only tasks must run `git diff --check`, verify Markdown links/paths and secret safety, confirm no application source changed, and run the four commands above when requested or when project-wide governance changes are made.

## Mandatory final checklist

Every final response must answer:

- What changed and why?
- Which files were created or modified?
- What was actually tested, and at what level?
- What remains incomplete or uncertain?
- Which Bible files were updated?
- Is owner action required?

Use the `CODEX UNIT REPORT` structure in [`context/ai-workflow-rules.md`](context/ai-workflow-rules.md).
