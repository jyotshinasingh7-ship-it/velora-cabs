# Velora Progress Tracker

- Last verified: 2026-07-17
- Current branch: `unit-003a-staging-verification`; Unit 003A implementation baseline `587fe32509e0ebaa0dc22d4dd6db97eca72b2eb8`; production `main` remains unchanged
- Current phase: Unit 003A local/emulator validation and coordinated staging application/rules deployment complete; authenticated data/API/browser verification remains pending; Unit 002A remains an independent active plan
- Current goal: verify Unit 003A in a safe non-production staging environment without adding settlement, wallet, webhook, withdrawal, refund, scheduler, or corporate invoicing scope
- Current release status: deployed for client testing; not production-ready by the Bible definition

## Completed and verified

- TypeScript and Next.js production build passed locally and on Vercel on 2026-07-14.
- Vercel generated 43 static pages and aliased production to `https://velora-cabs.vercel.app`; the repository audit found 34 page files and 19 API route handlers.
- Anonymous HTTP 200 smoke checks passed for home, login, booking, driver/admin login, onboarding, admin notifications, and legal pages.
- Firestore rules compiled and deployed to Firebase project `velora-cabs` on 2026-07-14.
- Git commit `13a19bb` was pushed to `origin/main` before this Bible task.
- Unit 001 commit `3166ffb398657045aef4e7ae00d041031ab980ef` was deployed to Vercel production on 2026-07-15 as deployment `dpl_Dyf7KkW8tEMJQMrWzSVWNapAiHWS` and was aliased to `https://velora-cabs.vercel.app`.
- Production anonymous smoke checks passed for `/`, `/login`, `/book`, `/driver/login`, and `/admin/login`; unauthenticated `POST /api/rides/dispatch` returned safe JSON `401` with `{"message":"Please login again."}`.
- Unit 001 production browser verification passed: immediate booking reached the approved online driver; popup, countdown, sound, acceptance, both dashboard transitions, and operational ride completion worked.
- Unit 002 corporate business definition completed with all launch defaults, document, tax-order/place-of-supply, overdue, guest OTP, invoice-authority, and eight-year retention decisions approved.
- Unit 003 post-ride finance business/architecture definition completed with commission basis/defaults, holds, cash eligibility, payout methods, refund recovery, tip exclusion, tax boundaries, schemas/flows, and Units 003A–003H approved.

## Implemented but not fully tested

- Email/password verification, Google auth, phone OTP, persistence, logout, reset, and role redirects.
- Customer booking for local/airport/outstation, Places/Directions, estimates, scheduling, dashboard/history.
- Driver/fleet onboarding and privileged admin review.
- Driver online/location/request/accept/reject/OTP/completion lifecycle.
- Cash and Razorpay payment paths with server payable recalculation.
- Notifications, admin broadcasts, application/lifecycle notifications, and driver sound controls.
- Intercity ride publishing/search/seat requests.
- Admin pricing, customers, bookings, drivers, applications, corporate leads, analytics, and settings pages.
- Unit 003A integer-paise fare snapshot, trusted stop-OTP lock, separated payment/settlement/corporate states, cash-not-paid completion, post-ride shell, legacy normalization/audit tooling, fail-closed payment boundary, and focused booking rules. Local tests/build and the Firestore emulator command pass; staging/browser verification does not yet.

## In progress

- Unit 002A planning for authenticated application, private documents, secure admin review, trusted corporate account creation, initial corporate-admin association, audit, notifications, rules, idempotency, legacy lead compatibility, and staging tests.
- Unit 003A VERIFY: execute customer/driver stop-OTP completion for online/undecided and cash on the Ready Preview, trusted corporate exclusion, replay, dedicated authorization cases, the guarded read-only legacy audit, and owner browser confirmation.

## Resolved bugs

- Unit 001 root cause proved: protected Vercel APIs crashed while loading Firebase Admin 14.1.0 because `jwks-rsa` attempted CommonJS `require()` of ESM-only `jose` (`ERR_REQUIRE_ESM`).
- Fix implemented and preview integration verified with TEST ONLY records using Firebase Admin 13.10.0.
- The fixed server build is now deployed at the production alias; the former Firebase Admin module-load HTML 500 is no longer reproduced by the unauthenticated dispatch smoke test.
- A second proven recovery defect was fixed: one malformed legacy pending booking previously aborted the entire driver-online scan.
- Production browser verification subsequently confirmed the complete scoped Unit 001 flow through ride completion; the specification is now completed.

## Pending product modules

- Corporate currently provides enquiry form plus admin lead handling only. Unit 002 business definition is complete and Unit 002A is planned, but no corporate portal implementation exists yet.
- Firebase Storage-backed driver/vehicle document uploads.
- Razorpay webhook reconciliation.
- Actual post-ride settlement, commission, driver wallet, cash due, withdrawals, receipts, refunds, and release automation remain unimplemented. Unit 003A only establishes the fare/lifecycle boundary.
- Trusted scheduled dispatch, reminder, and notification-campaign jobs.

## External owner actions

- Confirm Firebase Authorized Domain and browser Maps referrer settings for `velora-cabs.vercel.app` if not already completed.
- Before Unit 002A document-upload completion, enable/confirm a staging Firebase Storage bucket and approve a private upload/retention/malware-scanning operating boundary.
- Obtain qualified Indian tax/legal review before corporate production invoicing; no further Unit 002 product decision is currently unresolved.
- Before Unit 003 online-settlement completion, configure a server-only Razorpay webhook secret and provider dashboard callback/events in staging; never provide secret values in chat.
- Before automatic earning release can be claimed, select/configure trusted scheduled infrastructure and staging-test the 24-hour release/hold exceptions in Unit 003D.
- Obtain qualified Indian tax/accounting review before production financial/tax compliance claims; Unit 003 product decisions are complete.
- Provide staging/test accounts and permission for live role-based testing when desired; never send credentials in chat.

## Production blockers

- Authenticated production journeys and real Maps/payment/lifecycle behavior not fully tested.
- Ride completion works, but post-ride payment, commission, and driver-wallet settlement are only planned and not implemented/verified as a complete financial lifecycle.
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
- Generic root README remains create-next-app boilerplate.

## Current environment/deployment state

- Firebase production project: `velora-cabs`; Firestore rules deployed. Unit 003A rules are also compiled/released on separate staging project `velora-cabs-staging`. Storage is not configured.
- Vercel project linked; the latest `main` state is deployed to the production alias `https://velora-cabs.vercel.app`.
- Vercel Preview deployment `dpl_ApZUDpiKziLzuULDLPDy6uTRoxrh` is Ready at `https://velora-cabs-mcdrugm8q-jyotshinasingh7-ship-its-projects.vercel.app`, with all six public staging values verified and remote Next.js 16.2.10 build passing. Local Windows adapter builds still fail after valid compilation with `Unable to find lambda for route: /admin/analytics`; use remote Preview builds for staging evidence.
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
- 2026-07-15 Unit 001 production deployment: typecheck passed; lint passed with the same four warnings; local and Vercel production builds passed with 43 static pages; `git diff --check` passed. Production alias and anonymous route/API smoke checks passed.
- 2026-07-15 Unit 001 closure / Unit 002 definition: documentation link and secret scans passed; no application source changed; typecheck passed; lint passed with the same four warnings; production build passed with 43 static pages; `git diff --check` passed.
- 2026-07-16 Unit 002 completion / Unit 002A planning: documentation links, secret safety, whitespace, file placement, and application-code scope passed; typecheck passed; lint passed with the same four warnings; production build passed with 43 static pages; `git diff --check` passed.
- 2026-07-16 Unit 003 planning: specification completeness, Markdown links, documentation secret safety, and documentation-only scope passed; `npx.cmd tsc --noEmit` passed; lint passed with zero errors and the same four warnings; Next.js 16.2.10 production build passed with 43 static pages; `git diff --check` passed with only existing line-ending notices.
- 2026-07-16 Unit 003 completion / Unit 003A planning: twelve-decision/spec placement/completeness, Markdown links, secret safety, and documentation-only scope passed; `npx.cmd tsc --noEmit` passed; lint passed with zero errors and the same four warnings; Next.js 16.2.10 production build passed with 43 static pages; `git diff --check` passed with only existing line-ending notices.
- 2026-07-16 Unit 003A local implementation: focused unit/structural tests passed; typecheck passed; lint passed with zero errors and the same four warnings; Next.js 16.2.10 production build passed with 43 static pages; `git diff --check` passed; Markdown links and secret scan passed. The audit production safeguard refused before connection as designed. Firestore emulator startup failed with `spawn java ENOENT`; staging/API/browser and live audit were not run.
- 2026-07-16 Unit 003A owner emulator evidence: OpenJDK 21.0.11 and Firestore Emulator v1.21.0 started successfully; `firebase.cmd emulators:exec --only firestore --project demo-velora-cabs "npm.cmd run test:unit003a"` passed and exited code 0. This supersedes the prior missing-Java blocker. Dedicated rules allow/deny tests are still absent from the repository.
- 2026-07-17 Unit 003A staging gate: focused test and emulator command passed; typecheck/local build passed; lint had zero errors and the four pre-existing warnings. Firebase CLI confirms `velora-cabs-staging`; all six public Preview values are now verified. Clean Windows Vercel CLI 54.20.1 and 56.3.1 builds both fail in adapter packaging despite a valid static analytics route, so remote Preview proof is the next gate and rules remain undeployed.
- 2026-07-17 Unit 003A remote Preview: Vercel Linux build passed with 43 static pages and analytics present; deployment `dpl_ApZUDpiKziLzuULDLPDy6uTRoxrh` is Ready. Matching Firestore rules compiled and deployed only to `velora-cabs-staging`. Anonymous home/analytics returned 200 and dispatch returned expected 401. Authenticated lifecycle/browser and legacy audit remain pending.

## Active specs

- [`Unit 002A — Corporate application and admin approval`](../specs/active/unit-002a-corporate-application-admin-approval.md)
- [`Unit 003A — Final fare lock and payment lifecycle separation`](../specs/active/unit-003a-final-fare-payment-lifecycle.md)

## Completed specs

- [`Unit 001 — Dispatch driver delivery bug`](../specs/completed/unit-001-dispatch-driver-delivery-bug.md)
- [`Unit 002 — Corporate module definition`](../specs/completed/unit-002-corporate-module-definition.md)
- [`Unit 003 — Post-ride payment, platform commission, driver wallet, and settlement`](../specs/completed/unit-003-post-ride-payment-driver-wallet.md)

## Next recommended unit

Run the authenticated stop-OTP/payment-due/cash/corporate/replay browser matrix on the Ready Preview and execute the guarded staging legacy audit. Keep actual Razorpay settlement, commission/wallet posting, cash due, withdrawals, refunds, scheduler, and corporate invoicing out of scope.

## Session log

- 2026-07-15 — Project Bible — Created governance/context/spec documentation from repository audit. Files affected: `AGENTS.md`, `context/`, `specs/`. Validation: typecheck passed; lint passed with four pre-existing warnings; production build passed; diff check and documentation link/secret checks passed. Remaining: Unit 001 dispatch trace and Unit 002 owner decisions.
- 2026-07-15 — Unit 001 dispatch delivery — Proved the Vercel Firebase Admin module-load crash, pinned Admin 13.10.0, hardened driver eligibility, added safe development diagnostics, isolated malformed pending bookings, improved customer failure messaging, and verified delivery/accept/reject/expiry/cancel/recovery on a Vercel preview with seeded TEST ONLY accounts. Browser popup/countdown/sound verification and final production deployment status are recorded in the unit spec/final report.
- 2026-07-15 — Unit 001 production deployment — Committed and pushed the validated dispatch fix and Project Bible as `3166ffb398657045aef4e7ae00d041031ab980ef`, deployed it to Vercel production as `dpl_Dyf7KkW8tEMJQMrWzSVWNapAiHWS`, confirmed the `https://velora-cabs.vercel.app` alias, and passed anonymous page/API smoke tests. Unit 001 remains active pending authenticated browser verification of the driver popup, countdown, sound, and both dashboard transitions.
- 2026-07-15 — Unit 001 completion — Owner production-browser verification confirmed immediate booking delivery, popup, countdown, sound, acceptance, customer/driver dashboard transitions, and ride completion. Moved Unit 001 to completed. Payment, commission, and driver-wallet settlement remain separate pending scope.
- 2026-07-15 — Unit 002 corporate definition — Recorded the approved authenticated single-company portal, company-paid postpaid model, trusted roles, policy/approval, percentage discount, transactional credit, monthly GST invoice/manual reconciliation, reporting, security, existing-booking reuse, planned routes/collections, MVP exclusions, and Units 002A–002J. Unit 002 remains active for eight genuine owner decisions; no corporate application code was changed.
- 2026-07-16 — Unit 002 completion / Unit 002A planning — Approved the final company/employee limits, discount-before-GST/place-of-supply policy, required private documents, overdue grace/blocking, guest OTP, Velora-admin invoice authority, and eight-year retention. Moved Unit 002 to completed and created planning-only Unit 002A covering lead compatibility, application/documents, review, account/admin association, audit, notifications, Admin APIs, rules, idempotency, duplicates, staging seed/tests, completion, and rollback. No application code or cloud configuration changed.
- 2026-07-16 — Unit 003 finance planning — Audited the current cash/Razorpay, fare recalculation, stop-OTP completion, driver wallet display, admin finance visibility, rules, and missing webhook/ledger/withdrawal paths. Recorded the approved online/cash commission model, proposed paise schemas/atomic flows, corporate exclusion, Units 003A–003H, and twelve genuine owner decisions. Documentation only; no application code, rules, API, UI, dependency, or configuration changed.
- 2026-07-16 — Unit 003 completion / Unit 003A planning — Approved the final commissionable-fare/toll/parking basis, separate incentive funding, 24-hour automatic hold release boundary, no split cash, controlled method changes, cash threshold, bank/UPI withdrawals, trusted defaults, recoverable refund dues, no MVP tips, and tax-record boundaries. Moved Unit 003 to completed and created active Unit 003A for fare lock/lifecycle separation only. No application code, UI, API, rule, dependency, or configuration changed.
- 2026-07-16 — Unit 003A implementation — Added paise primitives/snapshot calculation, trusted stop-OTP fare lock and idempotency, separate customer/cash/corporate lifecycle state, fail-closed payment routes, completed-unpaid dashboard shell, legacy normalization/read-only audit tooling, admin completion guard, and focused rules. Local unit/type/lint/build/diff validation passed. Emulator was blocked by missing Java; no staging/browser/provider charge/live audit occurred, so Unit 003A remains active.
- 2026-07-16 — Unit 003A staging continuation — Recorded owner-confirmed OpenJDK 21.0.11 / Firestore Emulator v1.21.0 evidence and successful emulator command exit 0. Fresh local test/type/lint/build/diff validation passed. Deployment failed closed before mutation: Firebase CLI exposes only production `velora-cabs`, no staging project; pulled Vercel Preview configuration has no staging Firebase project ID and several required client/server values are empty. No preview, rules deployment, API/data mutation, live audit, provider charge, or browser verification occurred. Unit 003B was not started and Unit 003A remains active.
- 2026-07-17 — Unit 003A staging deployment gate — Confirmed branch `unit-003a-staging-verification` and baseline commit `587fe32509e0ebaa0dc22d4dd6db97eca72b2eb8`. Firebase CLI now exposes `velora-cabs-staging`; Vercel metadata contains all required Preview names, but the pulled environment is empty and the Preview build fails because all six public Firebase variables are missing. Local/emulator/type/lint/build checks passed as recorded. Coordinated deployment failed closed: no Firestore rules deployment, branch push, Vercel Preview, staging data/API test, legacy audit, browser test, production mutation, or Unit 003B work occurred.
- 2026-07-17 — Unit 003A Vercel adapter diagnosis — Updated only the six public Preview variables as readable client configuration and verified non-empty staging identity without exposing values. `/admin/analytics` exists in the clean Next server tree, app/static/prerender manifests, HTML/RSC/trace/segment output. Clean Windows Vercel adapters 4.20.2 and 4.20.4 both fail before functions/static packaging with a false missing-lambda error. No route/application workaround, dependency change, rules deployment, staging data mutation, production mutation, or Unit 003B work occurred; remote Preview build is the next safe gate.
- 2026-07-17 — Unit 003A coordinated staging deployment — Pushed documentation/implementation branch after secret safety checks, then remote Vercel Linux build passed and produced Ready Preview `dpl_ApZUDpiKziLzuULDLPDy6uTRoxrh`. Deployed matching Firestore rules only to `velora-cabs-staging` after application success. Anonymous home/analytics/dispatch smoke checks passed. Production was untouched, no real payment occurred, Unit 003B was not started, and Unit 003A remains active for authenticated owner verification.
