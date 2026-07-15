# Velora Decisions Log

Last verified: 2026-07-15

Append-only. A later decision supersedes an earlier entry; do not rewrite history.

## VEL-ADR-001 — Preserve the existing visual system

- Date: 2026-07-15
- Status: approved
- Decision: No redesign or replacement of the current UI without explicit owner approval.
- Reason: Repeated owner instructions require preservation of theme, layout, colors, animation, branding, and working UX.
- Alternatives considered: opportunistic redesign or broad cleanup; rejected.
- Impact: all application/UI work.
- Files/specs affected: `context/ui-context.md`, all future UI specs.
- Owner approval source: explicit project instructions supplied across current tasks.
- Follow-up required: document any future approved design change before implementation.

## VEL-ADR-002 — One centralized browser Maps loader

- Date: 2026-07-15
- Status: approved
- Decision: Browser Maps initialization is centralized in `lib/googleMaps.ts`; do not mix provider/script/loader architectures.
- Reason: duplicate initialization previously caused provider/runtime risk.
- Alternatives considered: `@vis.gl` APIProvider alongside JS API Loader; rejected by the approved consistency requirement and current repository state.
- Impact: booking autocomplete/map and driver live map.
- Files/specs affected: `lib/googleMaps.ts`, Maps components, `context/architecture.md`.
- Owner approval source: explicit Maps architecture instructions and implemented repository state.
- Follow-up required: verify future Maps changes against Next.js and loader docs.

## VEL-ADR-003 — Privileged operations use Firebase Admin

- Date: 2026-07-15
- Status: approved
- Decision: approvals, trusted roles/records, dispatch lifecycle, notifications, and payments use authenticated server operations.
- Reason: clients cannot be trusted with roles, approvals, payment, or protected ride state.
- Alternatives considered: direct broad client writes; rejected for security.
- Impact: `app/api/`, `lib/server/`, Firestore rules.
- Owner approval source: explicit security requirements and current code.
- Follow-up required: add emulator/API regression tests.

## VEL-ADR-004 — Estimate and payable fare are separate

- Date: 2026-07-15
- Status: approved
- Decision: booking UI stores/displays an estimate; payment routes recalculate payable fare server-side with trusted pricing and Directions data.
- Reason: browser-supplied amount is untrusted.
- Alternatives considered: charge the client estimate directly; rejected.
- Impact: booking schema, pricing helper, payment APIs.
- Owner approval source: explicit payment hardening requirements and current implementation.
- Follow-up required: webhook reconciliation and live test-mode verification.

## VEL-ADR-005 — Supply approval is mandatory

- Date: 2026-07-15
- Status: approved
- Decision: users cannot self-assign driver status; driver approval creates the trusted driver record. Vehicle approval creates an approved but inactive, dispatch-disabled vehicle.
- Reason: operational and security control.
- Alternatives considered: automatic activation on application; rejected.
- Impact: onboarding, review APIs, `users`, `drivers`, `vehicles`, rules.
- Owner approval source: onboarding requirements and current implementation.
- Follow-up required: define operational vehicle activation workflow if needed.

## VEL-ADR-006 — Project Bible is the permanent source of truth

- Date: 2026-07-15
- Status: approved
- Decision: `AGENTS.md`, all eight `context/` files, and feature specs govern future work and must be updated after tasks.
- Reason: preserve repository truth, decisions, progress, and AI context across sessions.
- Alternatives considered: rely on chat history; rejected as incomplete and transient.
- Impact: all future tasks.
- Files/specs affected: `AGENTS.md`, `context/`, `specs/`.
- Owner approval source: attached Project Bible request.
- Follow-up required: enforce PLAN → IMPLEMENT → VERIFY and append session history.

## VEL-ADR-007 — Corporate remains lead generation pending definition

- Date: 2026-07-15
- Status: approved for current-state documentation; future scope proposed
- Decision: Treat current corporate functionality as enquiry/admin lead handling, not a full corporate SaaS product.
- Reason: repository contains `corporate_requests` form/admin handling but no company portal, policy, billing, invoice, or employee system.
- Alternatives considered: infer full functionality from marketing page; rejected.
- Impact: product claims and Unit 002.
- Owner approval source: request to document repository truth.
- Follow-up required: owner decisions in Unit 002.

## VEL-ADR-008 — In-app notifications precede WhatsApp/push

- Date: 2026-07-15
- Status: approved
- Decision: Firestore-backed in-app notification/broadcast functionality is current scope; WhatsApp and fake browser push are deferred.
- Reason: explicit owner notification requirements.
- Alternatives considered: WhatsApp or browser push first; rejected/deferred.
- Impact: notifications and future communications roadmap.
- Owner approval source: explicit notification task instructions.
- Follow-up required: define provider/scheduler before any external messaging.

## VEL-ADR-009 — WhatsApp OTP is deferred

- Date: 2026-07-15
- Status: proposed/deferred
- Decision: Do not infer or implement WhatsApp OTP; current phone auth uses Firebase SMS OTP.
- Reason: no WhatsApp provider/business decision exists in repository or approved tasks.
- Alternatives considered: Firebase SMS remains current implementation.
- Impact: authentication roadmap.
- Owner approval source: no approval for WhatsApp implementation; notification scope explicitly excluded it.
- Follow-up required: owner/provider/security decision before spec creation.

## VEL-ADR-010 — Pin Firebase Admin 13.10.0 for the current Next/Vercel runtime

- Date: 2026-07-15
- Status: approved by implementation evidence
- Decision: Pin `firebase-admin` exactly to `13.10.0` until Firebase Admin 14's `jwks-rsa`/ESM dependency path loads correctly through the Next.js 16 Vercel server externalization runtime.
- Reason: Live Vercel logs proved Firebase Admin 14.1.0 crashes every protected route at module load with `ERR_REQUIRE_ESM` before token verification or dispatch. Version 13.10.0 resolves `jwks-rsa` 3.2.2/`jose` 4.15.9 and loaded successfully locally and on Vercel preview.
- Alternatives considered: keep a broken 14.1.0 deployment; force an unsupported major transitive override from `jwks-rsa` 4 to 3; both rejected.
- Impact: all Firebase Admin APIs; restores route execution but retains moderate transitive audit advisories reported by npm.
- Files/specs affected: `package.json`, `package-lock.json`, `context/architecture.md`, Unit 001.
- Owner approval source: Unit 001 instruction to fix the proven root cause and verify server delivery.
- Follow-up required: monitor official Firebase Admin/Next compatibility, upgrade in a dedicated tested unit, and rerun security audit before production-readiness claims.
