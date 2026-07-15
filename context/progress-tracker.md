# Velora Progress Tracker

- Last verified: 2026-07-15
- Current branch: `main` (clean and synchronized with `origin/main` before this documentation task)
- Current phase: client testing / runtime hardening
- Current goal: complete Unit 001 browser verification after the dispatch server fix
- Current release status: deployed for client testing; not production-ready by the Bible definition

## Completed and verified

- TypeScript and Next.js production build passed locally and on Vercel on 2026-07-14.
- Vercel generated 43 static pages and aliased production to `https://velora-cabs.vercel.app`; the repository audit found 34 page files and 19 API route handlers.
- Anonymous HTTP 200 smoke checks passed for home, login, booking, driver/admin login, onboarding, admin notifications, and legal pages.
- Firestore rules compiled and deployed to Firebase project `velora-cabs` on 2026-07-14.
- Git commit `13a19bb` was pushed to `origin/main` before this Bible task.

## Implemented but not fully tested

- Email/password verification, Google auth, phone OTP, persistence, logout, reset, and role redirects.
- Customer booking for local/airport/outstation, Places/Directions, estimates, scheduling, dashboard/history.
- Driver/fleet onboarding and privileged admin review.
- Driver online/location/request/accept/reject/OTP/completion lifecycle.
- Cash and Razorpay payment paths with server payable recalculation.
- Notifications, admin broadcasts, application/lifecycle notifications, and driver sound controls.
- Intercity ride publishing/search/seat requests.
- Admin pricing, customers, bookings, drivers, applications, corporate leads, analytics, and settings pages.

## In progress

- Project Bible/governance documentation.
- Client manual testing preparation.

## Confirmed bugs

- Unit 001 root cause proved: protected Vercel APIs crashed while loading Firebase Admin 14.1.0 because `jwks-rsa` attempted CommonJS `require()` of ESM-only `jose` (`ERR_REQUIRE_ESM`).
- Fix implemented and preview integration verified with TEST ONLY records using Firebase Admin 13.10.0.
- A second proven recovery defect was fixed: one malformed legacy pending booking previously aborted the entire driver-online scan.
- Remaining verification: visible driver dashboard popup/countdown/sound in an authenticated browser. Unit 001 remains active until this is witnessed.

## Pending product modules

- Corporate currently provides enquiry form plus admin lead handling only. Full corporate SaaS workflow is pending definition.
- Firebase Storage-backed driver/vehicle document uploads.
- Razorpay webhook reconciliation.
- Trusted scheduled dispatch, reminder, and notification-campaign jobs.

## External owner actions

- Confirm Firebase Authorized Domain and browser Maps referrer settings for `velora-cabs.vercel.app` if not already completed.
- Provide corporate product decisions for Unit 002.
- Provide staging/test accounts and permission for live role-based testing when desired; never send credentials in chat.

## Production blockers

- Dispatch bug unresolved.
- Authenticated production journeys and real Maps/payment/lifecycle behavior not fully tested.
- No Razorpay webhook/reconciliation.
- Storage/document compliance flow absent if documents are a launch requirement.
- No automated rules/emulator regression suite.
- Firebase Admin 13.10.0 avoids the current runtime crash but `npm audit --omit=dev` reports moderate transitive advisories; no high or critical advisories were reported. Re-evaluate Firebase Admin 14 after its `jwks-rsa`/Next externalization path is compatible.

## Known warnings

`npm run lint` most recently passed with four warnings in `app/driver/dashboard/page.tsx`:

- Hook dependency warning for `handleRejectRide` around line 737.
- Unused `handleDriverArrived` around line 1180.
- Unused `handleStartRide` around line 1356.
- Unused `handleCompleteRide` around line 1446.

Line numbers may move; confirm before work.

## Known technical debt

- Initial booking status is written as `Pending` while canonical types use lowercase.
- Compatibility aliases remain across booking readers and must not be removed without migration.
- Scheduled jobs have storage/helper code but no scheduler.
- Large client modules contain mixed concerns.
- Ride alert asset/playback needs browser verification.
- Generic root README remains create-next-app boilerplate.

## Current environment/deployment state

- Firebase project: `velora-cabs`; Firestore rules deployed. Storage not configured.
- Vercel project linked and production deployed at `https://velora-cabs.vercel.app`.
- Required Vercel variable names are documented in architecture/DEPLOYMENT; secret values are never documented.
- Emulator configuration exists for Auth/Firestore/UI; no executed rules tests recorded.
- Test seed script exists with dry-run and cleanup safeguards; no live seed result recorded.

## Last validation results

- 2026-07-14: `npx tsc --noEmit` passed.
- 2026-07-14: `npm run lint` passed with four warnings above.
- 2026-07-14: `npm run build` passed locally and on Vercel.
- 2026-07-14: `git diff --check` passed.
- 2026-07-15 Bible task: `npx tsc --noEmit` passed; `npm run lint` passed with the same four warnings; `npm run build` passed and generated 43 static pages; `git diff --check` passed.
- 2026-07-15 Unit 001: typecheck passed; lint passed with the same four warnings; local production build passed with 43 static pages; Vercel preview build passed; `git diff --check` passed. `npm audit --omit=dev` reported 10 moderate, 0 high, and 0 critical vulnerabilities.

## Active specs

- [`Unit 001 — Dispatch driver delivery bug`](../specs/active/unit-001-dispatch-driver-delivery-bug.md)
- [`Unit 002 — Corporate module definition`](../specs/active/unit-002-corporate-module-definition.md)

## Next recommended unit

Unit 001: instrument and trace booking submission through server dispatch, driver eligibility/state, Firestore updates, expiry, and dashboard listener; fix only the confirmed root cause.

## Session log

- 2026-07-15 — Project Bible — Created governance/context/spec documentation from repository audit. Files affected: `AGENTS.md`, `context/`, `specs/`. Validation: typecheck passed; lint passed with four pre-existing warnings; production build passed; diff check and documentation link/secret checks passed. Remaining: Unit 001 dispatch trace and Unit 002 owner decisions.
- 2026-07-15 — Unit 001 dispatch delivery — Proved the Vercel Firebase Admin module-load crash, pinned Admin 13.10.0, hardened driver eligibility, added safe development diagnostics, isolated malformed pending bookings, improved customer failure messaging, and verified delivery/accept/reject/expiry/cancel/recovery on a Vercel preview with seeded TEST ONLY accounts. Browser popup/countdown/sound verification and final production deployment status are recorded in the unit spec/final report.
