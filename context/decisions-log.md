# Velora Decisions Log

Last verified: 2026-07-17

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

## VEL-ADR-011 — Corporate is an approved, single-company, postpaid portal

- Date: 2026-07-15
- Status: approved for planned implementation
- Decision: Corporate becomes an authenticated portal activated after Velora admin approval. MVP roles are trusted server-managed `corporate_admin` and `corporate_employee`; an employee belongs to one approved company. Eligible rides are company-paid/postpaid, and employees or guests do not enter customer cash/Razorpay checkout.
- Reason: The owner approved company-account billing and strict tenant/role administration rather than extending the public lead form into an untrusted client workflow.
- Alternatives considered: remain lead-only; employee-paid rides; client-selected company membership; multi-company membership. The first is superseded as the future direction and the others are outside the MVP.
- Impact: corporate applications/accounts/memberships, auth routing, booking ownership, payment UI/API gating, rules, and audit requirements.
- Files/specs affected: Unit 002, `context/project-overview.md`, `context/architecture.md`, `context/glossary.md`.
- Owner approval source: explicit Unit 002 business decisions supplied on 2026-07-15.
- Follow-up required: resolve required application documents and create the bounded Unit 002A implementation spec.

## VEL-ADR-012 — Corporate rides reuse bookings and reserve server-authoritative credit

- Date: 2026-07-15
- Status: approved for planned implementation
- Decision: Corporate rides remain in the existing `bookings` collection and reuse the current dispatch/lifecycle engine. Protected corporate fields identify company, passenger/guest, actor, policy approval, pricing, credit, and invoice linkage. Estimated credit is transactionally reserved when a booking is approved/confirmed and atomically replaced by the final charge on ride completion; cancellations release the reservation or convert only an authoritative cancellation fee.
- Reason: A second ride engine would duplicate dispatch/lifecycle behavior and break current readers. Transactional paise-denominated reservations prevent overspending and double counting.
- Alternatives considered: separate corporate bookings collection; browser-calculated credit; reserve and final-charge simultaneously. Rejected for compatibility, security, and accounting correctness.
- Impact: future corporate booking APIs, existing booking aliases/readers, credit ledger, cancellation, pricing, rules, indexes, and lifecycle tests.
- Files/specs affected: Unit 002 and planned Units 002D–002F; `context/architecture.md`.
- Owner approval source: explicit Unit 002 booking and credit decisions supplied on 2026-07-15.
- Follow-up required: finalize customer ownership alias mapping, corporate billing state compatibility, default limits, and idempotent ledger contracts in bounded implementation specs.

## VEL-ADR-013 — Monthly GST invoicing with manual reconciliation is the corporate MVP settlement model

- Date: 2026-07-15
- Status: approved for planned implementation
- Decision: Corporate charges are consolidated into monthly GST invoice drafts, reviewed before issue, with Net 15 default terms configurable to Net 7/15/30. Initial settlement is bank transfer recorded through a trusted admin reconciliation API with partial-payment support and immutable audit history. Online invoice payment is future scope.
- Reason: The owner selected company postpaid billing and controlled finance operations for the MVP.
- Alternatives considered: customer checkout per ride, automatic bank settlement, and immediate online invoice payment. Rejected or deferred from the MVP.
- Impact: corporate invoice/payment collections, credit release, admin/company views, reporting, tax design, retention, and audit controls.
- Files/specs affected: Unit 002 and planned Units 002G–002I; `context/project-overview.md`, `context/architecture.md`, `context/glossary.md`.
- Owner approval source: explicit Unit 002 invoicing and settlement decisions supplied on 2026-07-15.
- Follow-up required: owner must decide place-of-supply tax logic, invoice authority, overdue suspension/grace policy, and financial record retention.

## VEL-ADR-014 — Corporate launch defaults, document, tax, overdue, guest, authority, and retention policy

- Date: 2026-07-16
- Status: approved for planned implementation; completes Unit 002 business definition
- Decision: Set default company credit to `10000000` paise (₹1,00,000), default employee per-ride limit to `500000` paise (₹5,000), and default employee monthly limit to `2500000` paise (₹25,000). Corporate admins may lower employee limits; increases above the company ceiling and company credit changes require trusted Velora action/policy and audit history. Apply corporate discount before GST; determine same-state CGST/SGST versus inter-state IGST server-side in integer paise under configurable, professionally reviewed place-of-supply rules. Require PAN, applicable GST certificate, incorporation/registration proof, address proof, authorized-representative identity/designation/contact, and only operationally necessary bank/billing evidence through private validated/scanned storage. Apply Net 15 plus seven-calendar-day grace, then block new bookings without interrupting active rides; audited extensions/overrides and repeated-overdue suspension are supported. Guest rides require phone OTP and remain linked to company/admin/business purpose without granting portal access. Only Velora admin may issue/cancel invoices or reconcile payments in the MVP. Retain invoices, payments, financial audits, and applicable corporate ride reports for at least eight years using archival rather than client deletion.
- Reason: These were the final owner-approved choices required to close Unit 002 and bound the first implementation unit safely.
- Alternatives considered: unlimited/default-zero credit; client-raised limits; GST-before-discount; public document access; no grace/immediate ride interruption; guest rides without verification; corporate-admin invoice authority; normal client deletion or shorter undefined retention. Rejected for approved business, security, accounting, and audit requirements.
- Impact: corporate applications/storage, memberships/policies, pricing/tax, credit, booking confirmation, overdue blocking, guest handling, invoicing, reconciliation, audit, retention, rules, APIs, tests, and operational setup.
- Files/specs affected: completed Unit 002, active Unit 002A, `context/architecture.md`, `context/project-overview.md`, `context/progress-tracker.md`, `context/glossary.md`.
- Owner approval source: explicit eight Unit 002 decisions supplied on 2026-07-16.
- Follow-up required: implement each concern only in its bounded Unit 002A–002J spec; obtain qualified Indian tax/legal review before production invoicing and configure protected Storage/malware scanning before Unit 002A document uploads are complete.

## VEL-ADR-015 — Velora-led online settlement and driver-collected cash commission accounting

- Date: 2026-07-16
- Status: approved financial model; implementation details pending Unit 003 owner decisions
- Decision: For ordinary online rides, Velora receives the full server-verified final fare through Razorpay, records platform commission as Velora revenue, and records the driver net as an internal wallet liability before manual withdrawal settlement. For cash rides, the driver receives the full fare directly, receives no duplicate wallet credit, and accrues platform commission due to Velora; the due offsets future online earnings/withdrawals and may be cleared by a separately verified provider payment. At the configured due threshold, cash rides are blocked while online rides may remain available. All new finance authority uses integer paise, immutable idempotent ledger events, trusted server transactions, and separate ride/payment/settlement states. Corporate postpaid rides bypass this checkout.
- Reason: The existing ride completion and payment routes do not account for Velora revenue, driver liabilities, cash commission, or payout and currently conflate cash ride completion with paid status.
- Alternatives considered: credit the cash earning digitally as well as letting the driver collect cash; treat wallet balance as bank payout; client-authoritative commission/payment; automatic provider payout in MVP; corporate employee checkout. Rejected for double accounting, security, or approved business scope.
- Impact: Unit 003A–003H, fare locking, Razorpay/webhook reconciliation, finance settings, wallets/ledger, cash eligibility, withdrawals, refunds, customer/driver/admin UI, rules, migration, notifications, and corporate exclusion.
- Files/specs affected: Unit 003, `context/project-overview.md`, `context/architecture.md`, `context/progress-tracker.md`, `context/glossary.md`.
- Owner approval source: explicit Unit 003 financial model supplied on 2026-07-16.
- Follow-up required: resolve the commission/tax basis, charge inclusion, incentive funding, hold release, partial cash/method switching, cash threshold behavior, payout methods/default values, refund recovery, tips, and qualified accounting treatment before their bounded implementation units.

## VEL-ADR-016 — Post-ride commission basis, holds, cash eligibility, payout, recovery, and Unit 003A boundary

- Date: 2026-07-16
- Status: approved for planned implementation; completes Unit 003 business definition
- Decision: Platform commission applies to non-negative pre-tax base, distance, time, waiting, night, and surge charges after discount; GST, toll, and parking are excluded. Percentage calculation uses integer basis points with round-half-up to the nearest paise and is capped at commissionable fare after the minimum. Toll/parking remain pass-through items. Driver incentives use a separate Velora expense pool/ledger and do not reduce recorded commission. Online earnings enter a 24-hour pending hold and release automatically through trusted scheduling unless payment/refund/dispute/fraud/support/admin holds apply. Split/partial cash is outside MVP; method changes are allowed only before processing/final settlement. Cash due below threshold permits cash rides, while at/above threshold blocks only new cash rides. MVP withdrawals support verified bank and UPI with masked data/manual audited payout. Defaults are 15% commission, `1000` paise minimum commission, 24-hour hold, `50000` paise minimum withdrawal, `100000` paise maximum cash due, cash enabled, and withdrawals enabled; audited server actions change them and settled rides retain snapshots. Refund shortfalls may create explicit recoverable driver dues without a negative available balance. Tips are outside MVP and default non-commissionable if later approved. Finance records separately represent commissionable fare, pass-throughs, discount, taxable value/tax components, customer total, commission, and driver earning; server-configured tax still requires professional review.
- Reason: These approvals eliminate the remaining Unit 003 business ambiguity and make the immediate fare-lock/lifecycle unit implementable without prematurely building settlement.
- Alternatives considered: commission on GST/toll/parking; incentives netted invisibly from commission; manual release for every clean ride; split cash; method changes during processing; blocking online/active rides for cash due; unverified payout destinations; browser-hardcoded defaults; silent negative balances; tips in MVP. Rejected by the owner-approved financial and audit model.
- Impact: completed Unit 003, active Unit 003A, future Units 003B–003H, fare snapshots, finance settings, commission/ledger, scheduler, dispatch cash eligibility, withdrawals, refunds/recoverable dues, tax boundaries, UI, rules, tests, and operations.
- Files/specs affected: completed Unit 003, active Unit 003A, `context/architecture.md`, `context/project-overview.md`, `context/progress-tracker.md`, `context/glossary.md`.
- Owner approval source: explicit twelve Unit 003 decisions supplied on 2026-07-16.
- Follow-up required: implement only the bounded Unit 003A fare-lock/lifecycle scope first; obtain qualified Indian tax/accounting review before production financial claims, configure/test Razorpay webhook in Unit 003B, and configure/test trusted scheduled release infrastructure in Unit 003D.

## VEL-ADR-017 — Stop OTP is the atomic version-1 fare-lock boundary

- Date: 2026-07-16
- Status: implemented and emulator-verified; coordinated staging/browser verification pending
- Decision: Keep authenticated assigned-driver `POST /api/rides/otp` with `action: verify_end` as the only normal Unit 003A completion/fare-lock authority. Prepare the server Directions/current-pricing candidate before the transaction, then transactionally revalidate booking inputs and commit completion, immutable `fareSnapshot`, canonical payment/settlement/corporate state, driver release, OTP cleanup, and deterministic notification. Use `fare-lock:{bookingDocumentId}:v1` for replay identity. New customer bookings use `billingMode: customer_pay`; current payment endpoints fail closed until Unit 003B.
- Reason: Ride completion and fare authority must not be split across browser calls or permit cash-paid/payment success before trusted settlement. Reusing the existing OTP authority preserves the production-verified ride lifecycle while making the finance initialization atomic.
- Alternatives considered: separate client-callable fare-lock endpoint; copy the browser estimate; continue cash auto-paid; permit current Razorpay/cash routes for new schema; direct admin completed mutation. Rejected for race, authority, false-settlement, or audit risks.
- Impact: booking creation/rules, stop-OTP completion, customer completed-unpaid selection/payment shell, legacy normalization/audit, admin operational status mutation, and future Unit 003B settlement preconditions.
- Files/specs affected: active Unit 003A, `app/api/rides/otp/route.ts`, finance helpers/types, payment routes, customer dashboard/payment card, `firestore.rules`, Project Bible.
- Owner approval source: explicit Unit 003A implementation instruction supplied on 2026-07-16.
- Follow-up required: Preview values now resolve to `velora-cabs-staging`. Because clean Windows Vercel adapters 4.20.2/4.20.4 fail packaging a valid static route, use a normal remote Vercel Preview build as the application gate; deploy matching staging rules only after success, then test online/undecided, cash, corporate, replay, driver release, and customer shell before moving Unit 003A to completed.
