# Velora Code Standards

Last verified: 2026-07-15

## Type and validation rules

- Keep TypeScript strict. Avoid `any`; narrow `unknown` from requests, Firebase, SDKs, and browser APIs.
- Use typed models for bookings, applications, notifications, pricing, and intercity records.
- Validate request bodies, query/path parameters, dates, coordinates, enumerations, and Firestore values at trust boundaries.
- Use normalized lowercase status enums in trusted server workflows. Preserve legacy casing aliases only where current readers/rules require them.
- Use Firestore `Timestamp` for normalized scheduled instants and `serverTimestamp`/Admin `FieldValue.serverTimestamp()` for authoritative audit times.

## Authentication and authorization

- Protected APIs verify Firebase bearer ID tokens with `requireUser`; privileged APIs load the trusted role from Firestore.
- Never accept a client role, approval result, driver assignment, payable amount, or payment state as authoritative.
- Firebase Admin imports remain server-only. Never expose Admin credentials through `NEXT_PUBLIC_*`.
- Redirect parameters must be local paths; reject protocol-relative, external, backslash, control-character, and `javascript:` values.

## Firestore and workflow safety

- Use transactions/batches for approvals, dispatch, payments, notification campaigns, and multi-document lifecycle transitions.
- Preserve idempotency keys for bookings, orders, verifications, campaigns, notifications, and approvals.
- Applicants cannot approve themselves. Trusted `drivers` and `vehicles` records are created server-side; approved vehicles stay inactive until operational activation.
- Preserve existing compatibility aliases such as `customerId`/`userId`, normalized location fields plus legacy readers, and `rideStatus`/`status` until a migration spec is approved.
- Unknown collections remain denied by rules.

## Maps, pricing, and payments

- Use only [`lib/googleMaps.ts`](../lib/googleMaps.ts) for browser Maps loading. Never mix loaders or initialize Maps twice.
- Reuse [`lib/ride/pricing.ts`](../lib/ride/pricing.ts); do not duplicate fare formulas.
- Browser fare is an estimate. Payable fare is recomputed server-side using trusted settings and server Directions data.
- Currency API values use integer paise. Razorpay signatures must be verified with the server secret. Never log secrets/signatures.

## Components and UX

- Use PascalCase component files, camelCase utilities, and Next App Router `route.ts` handlers in resource-oriented folders.
- Create shared utilities when two or more security/business paths must share one invariant; avoid abstraction for a single simple use.
- Every asynchronous UI needs appropriate loading, error, empty, success, and duplicate-submit states.
- Keep forms labelled, keyboard usable, focus-visible, mobile responsive, and errors readable/announced. Avoid intrusive `alert()` patterns.
- Preserve the current design; observations in `ui-context.md` are not cleanup authorization.

## Errors and logging

- Return stable, user-safe API messages and suitable HTTP statuses. Do not return raw internal errors.
- Development diagnostics must avoid tokens, secrets, payment signatures, precise private location history, and sensitive user details.

## Change discipline

- No speculative rewrites, unrelated cleanup, dependency additions without justification, or architecture changes without Bible updates.
- Assets must have clear licensing. Reject executable/SVG uploads for future document flows; validate MIME, extension, and size server-side.

## Checklists

### Firestore rules change

- Identify creator/readers/updaters and protected fields.
- Test ownership, role escalation, protected-field mutation, and unknown collection denial.
- Confirm Admin SDK bypass is intentional and server route authorization is present.

### Environment variable addition

- Classify public/server/test/optional; document the name only.
- Add no secret defaults or logs. Configure Preview/Production separately.

### Schema migration

- Document old/new shapes, compatibility aliases, backfill, reader order, rules/index impact, rollback, and live verification.

### Backward compatibility

- Audit customer/admin/driver readers, APIs, rules, seeds, and existing documents before removing aliases.

## Required validation

```text
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Add relevant tests and state exactly which testing level was executed.
