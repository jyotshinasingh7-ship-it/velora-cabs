# Unit 003A — Final Fare Lock and Payment Lifecycle Separation

- Status: implemented and deployed to staging; VERIFY remains blocked on authenticated staging fixtures/browser evidence
- Owner: Velora project owner
- Created: 2026-07-16
- Last updated: 2026-07-17
- Parent definition: [`Unit 003 — Post-Ride Payment, Platform Commission, Driver Wallet and Settlement`](../completed/unit-003-post-ride-payment-driver-wallet.md)
- Related decision IDs: VEL-ADR-003, VEL-ADR-004, VEL-ADR-012, VEL-ADR-015, VEL-ADR-016
- Related Bible sections: `context/architecture.md` (Pricing and payments), `context/project-overview.md` (Planned post-ride finance model), `context/progress-tracker.md` (Unit 003A)

## Owner goal

Make ride completion produce one immutable, server-authoritative final-fare snapshot and an honest payment-due state, without yet implementing Razorpay settlement, platform commission posting, driver wallet credit, cash commission posting, withdrawals, refunds, or scheduled earning release.

## Bounded outcome

After successful stop OTP, an ordinary ride is `completed` with a locked integer-paise fare. Online rides become `payment_pending`; cash rides become `cash_pending_confirmation`; trusted corporate-postpaid rides bypass customer checkout. No cash ride is automatically marked paid, and no settlement or driver earning is created.

The customer sees that the ride is complete but payment remains due. Existing payment actions are fail-closed/disabled for the new finance schema until Unit 003B supplies a complete exactly-once online settlement path.

## Current repository truth

- `app/api/rides/otp/route.ts` is the trusted Node route for arrival, start/end OTP creation, and OTP verification. On successful stop OTP it transactionally marks the ride completed and resets the driver.
- That stop-OTP transaction currently marks any preselected cash booking `paymentStatus: "paid"`, sets amount/timestamps, and sends a payment-success notification without assigned-driver cash confirmation or finance accounting.
- `lib/server/paymentAmount.ts` already performs a server Directions lookup and reads trusted `settings/{vehicleType}`, but calculates in rupee `number` values, uses current settings, sets toll/parking/waiting to zero, and does not create an immutable fare lock.
- `components/dashboard/ActiveBooking.tsx` normalizes legacy booking fields and shows `RidePayment` during both `stop_otp_pending` and `completed`. It already renders a payment-pending message for completed unpaid rides.
- `components/ride/RidePayment.tsx` directly exposes cash/Razorpay actions. Existing payment APIs accept `stop_otp_pending` as well as `completed`, so payment may start before a final fare lock.
- `types/booking.ts` models only legacy payment statuses and rupee fare fields; it has no settlement state or immutable snapshot type.
- Booking creation writes legacy `Pending`, rupee estimates, `finalFare == estimatedFare`, and a chosen payment method. The direct client create path currently has no trusted corporate marker.
- Firestore rules allow owners/assigned drivers/admins to read a booking; customer updates are denied, driver acceptance is narrowly allowed, but admin client updates are broad. Unknown collections are denied.
- No automated unit/rules test harness is present. Emulator ports exist, but no executed Firestore rules suite is recorded.

## Scope

1. Integer-paise money primitives and checked round-half-up helpers.
2. A canonical immutable final-fare snapshot/version.
3. Fare locking as part of trusted stop-OTP completion.
4. Canonical payment, payment-method-lock, settlement, due, cash, corporate-billing, and finance-schema fields.
5. Removal of stop-OTP automatic cash-paid behavior and false payment-success notification.
6. Fail-closed boundary around existing payment APIs for new finance-schema rides.
7. Corporate-postpaid checkout exclusion using a protected billing marker.
8. Customer post-ride payment shell that shows locked fare/status without claiming settlement.
9. Legacy read normalization and a read-only dry-run finance audit report.
10. Focused Firestore rules preventing client mutation of protected fare/payment/settlement fields and direct client completion without a lock.
11. Regression coverage for the production-verified customer/driver lifecycle through completion.

## Explicitly out of scope

- Razorpay order/capture settlement, webhook, receipt, or provider reconciliation.
- Platform commission calculation/posting, finance settings persistence, or commission snapshots.
- Driver wallet/ledger creation or credit.
- Assigned-driver cash collection confirmation or cash commission due posting.
- Withdrawal methods/requests/payouts.
- Refunds, disputes, recoverable dues, incentives, penalties, or manual adjustments.
- Admin finance dashboard.
- Automatic 24-hour pending-earning release or scheduler infrastructure.
- Full GST/place-of-supply engine or tax-compliance certification.
- Corporate credit, invoice, or reconciliation implementation.
- Historical production mutation/backfill.
- Intercity payments, tips, split payments, final-meter redesign, or unrelated lifecycle cleanup.

## Roles and authorization

### Assigned driver

- Authenticates through a Firebase bearer ID token.
- Must match the booking's trusted `driverId` and a trusted driver/user record appropriate for the existing active ride.
- May submit the existing stop OTP through the trusted route.
- Cannot supply or override fare components, payment state, corporate state, or lock metadata.

An already-assigned active ride must not be stranded merely because online status changed. Implementation must preserve current approved-driver lifecycle semantics while rejecting unrelated users.

### Customer

- Reads the booking/fare/payment state only through existing owner access.
- Cannot lock/relock fare, mark paid/cash-collected, select a protected corporate billing mode, or write settlement fields directly.
- Sees payment actions only when the locked normal-customer state permits them; Unit 003A keeps actual new-schema settlement disabled.

### Velora admin

- May read operational details through existing access.
- Browser/admin client writes cannot authoritatively lock fare or set protected finance fields.
- A direct admin status change to `completed` must not bypass the trusted fare-lock path. Any future repair/override API is outside Unit 003A and requires an audited specification.

## Canonical booking finance contract

Unit 003A keeps `bookings/{clientRequestId}` as the ride source of truth. Canonical finance lifecycle fields are top-level for stable querying/guards; the component amounts are held in one immutable `fareSnapshot` map.

### Canonical top-level fields

- `billingMode`: `customer_pay` or trusted future `corporate_postpaid`.
- `fareLocked`: boolean.
- `fareVersion`: positive integer, initially `1`.
- `fareLockedAt`: server timestamp.
- `fareLockedBy`: `system` for normal completion.
- `fareLockTriggeredByUid`: authenticated assigned-driver UID.
- `fareLockIdempotencyKey`: deterministic `fare-lock:{bookingDocumentId}:v1`.
- `paymentStatus`: canonical Unit 003 status.
- `paymentMethod`: `cash`, `upi`, `razorpay`, or empty/unselected where legacy normalization requires it.
- `paymentMethodLocked`: boolean.
- `settlementStatus`: Unit 003 settlement status, initially `not_settled`.
- `paymentDueAt`: server timestamp for normal completed rides, otherwise null.
- `paidAt`: null in Unit 003A unless preserving an already-paid legacy record read-only.
- `cashCollectedAt`: null in Unit 003A unless preserving an already-paid legacy record read-only.
- `corporateBillingStatus`: `not_applicable` for customer rides or `pending_company_billing` for trusted corporate postpaid.
- `financeSchemaVersion`: initially `1` for newly locked rides.

### Immutable `fareSnapshot`

- `currency: "INR"`
- `schemaVersion`
- `fareVersion`
- `estimatedFarePaise`
- `baseFarePaise`
- `distanceFarePaise`
- `timeFarePaise`
- `waitingChargePaise`
- `nightChargePaise`
- `surgeChargePaise`
- `discountPaise`
- `commissionableFarePaise`
- `tollChargePaise`
- `parkingChargePaise`
- `passThroughChargesPaise`
- `driverAllowancePaise`
- `bookingPlatformChargePaise` for the existing fare component, distinct from future settlement commission
- `taxableValuePaise`
- `taxPaise`
- tax component placeholders needed for later configurable CGST/SGST/IGST boundaries without claiming tax certification
- `totalPayablePaise`
- `routeDistanceMeters`
- `routeDurationSeconds`
- `pricingSourceId`
- `pricingSourceVersion` or deterministic hash of the trusted values when no version exists
- `calculationBasis`
- `unsupportedChargeReasons`
- `lockedAt`
- `lockedBy`
- `idempotencyKey`

`fareSnapshot` is replaced only by a later approved adjustment/version workflow, not an ordinary update. Unit 003A creates version 1 only.

### Compatibility projections

- Existing rupee `estimatedFare`, `finalFare`, `payableFare`, `fare`, and `fareBreakdown` aliases remain readable for current customer/admin/driver components.
- For a newly locked booking, server code may write the minimum compatible rupee projections derived from `fareSnapshot.totalPayablePaise`; `fareSnapshot` is authoritative.
- No reader treats the legacy `finalFare` written at booking creation as a locked final fare.
- Removing aliases or bulk-normalizing old documents requires a later approved migration.

## Integer-paise primitives

- Accept only finite safe integers for authoritative paise values.
- Convert a trusted rupee value to paise with one documented round-half-up boundary; do not repeatedly convert between rupees and paise.
- Use integer basis-point arithmetic when a percentage boundary is needed later.
- Reject negative amounts except where a future explicit signed adjustment type allows them.
- Sum components with safe-integer overflow checks.
- Format paise for UI display without converting the stored authority back into a floating-point business calculation.

Unit 003A does not calculate or post platform commission. Its paise primitives must be compatible with the approved formula boundary from completed Unit 003 and must not introduce a competing commission formula.

## Server-authoritative fare sources

The lock candidate is calculated before the Firestore transaction, then the transaction re-reads and validates the booking before committing it atomically with completion.

Trusted sources:

- Booking route place IDs and service/vehicle/trip identifiers, validated against the stored booking.
- Server Directions distance/duration using `GOOGLE_MAPS_SERVER_API_KEY`.
- Current trusted `settings/{vehicleType}` fare configuration, snapshotted/hash-versioned into the lock.
- Server ride timestamps where a component is safely supported.
- Existing server-side night-ride policy and service/trip multiplier, preserved until separately changed.

Unit 003A locks only components that can be proven from these sources. Current unsupported toll, parking, surge, manual waiting, or evidence-based adjustments are zero with explicit `unsupportedChargeReasons`; browser-supplied amounts are not copied. Existing `platformCharge` and `driverAllowance` remain separately named components and are not confused with future platform commission.

Tax remains an itemized server-calculated/configured component using the existing trusted setting for compatibility. Unit 003A records taxable-value/tax boundaries but does not certify GST rate or place-of-supply correctness.

## Secure fare-lock API and transaction

### Canonical API

`POST /api/rides/otp` with `action: "verify_end"` remains the single normal completion/fare-lock API. It uses Node runtime, `requireUser`, the existing stop-OTP hash/attempt controls, and a shared server-only fare-lock helper. No second browser-callable lock endpoint is introduced in Unit 003A.

### Preconditions

- Valid Firebase ID token.
- Booking and trusted driver records exist.
- Authenticated UID equals `booking.driverId`.
- Ride is `stop_otp_pending`, or is an idempotent repeat of the same already-completed version-1 lock.
- Stop OTP is valid and within attempt limits for the first completion.
- Required route, vehicle, service, pricing, and final-fare inputs are valid.
- Booking is not already paid under an incompatible unlocked/legacy state.

### Atomic commit

After building the trusted candidate, one Firestore transaction re-reads booking/driver and:

1. Revalidates assignment, state, OTP hash/attempts, and absence/idempotency of the lock.
2. Writes `rideStatus` and legacy `status` as `completed`.
3. Writes authoritative completion timestamps.
4. Writes the immutable fare snapshot and top-level lock metadata.
5. Applies the correct payment/corporate state transition.
6. Clears the driver active ride and preserves the existing trip counters/online behavior.
7. Removes the stop OTP secret and records verification.
8. Sends only truthful ride-completed/payment-due or corporate-billing notifications.

The transaction performs no wallet, commission, cash-due, withdrawal, refund, or settlement posting.

### Idempotency and repeat behavior

- Deterministic key: `fare-lock:{bookingDocumentId}:v1`.
- A repeat by the same assigned driver after successful completion returns the existing version-1 result without changing amounts/timestamps/counters or duplicating notifications.
- If version/key exists but candidate-critical data conflicts, return a safe `409` and do not overwrite.
- An already-paid and correctly locked booking returns its existing snapshot read-only.
- A paid but unlocked legacy booking is not relocked; return a classified legacy conflict requiring the dry-run/admin migration process.
- A completed but unlocked/malformed legacy ride is not silently repaired by the normal driver endpoint.
- Missing route/pricing/fare data fails closed before completion mutation with a safe operational error and no leaked data. Support/admin remediation requires a later audited route/spec.

## Stop-OTP state transitions

### Normal customer online/undecided method

```text
rideStatus: stop_otp_pending -> completed
paymentStatus: legacy/pending -> payment_pending
paymentMethodLocked: false
settlementStatus: not_settled
paymentDueAt: completedAt
corporateBillingStatus: not_applicable
```

### Normal customer cash method

```text
rideStatus: stop_otp_pending -> completed
paymentStatus: legacy/pending -> cash_pending_confirmation
paymentMethod: cash
paymentMethodLocked: false
settlementStatus: not_settled
cashCollectedAt: null
```

The old `paymentStatus: paid`, `paidAt`, `cashCollectedAt`, and cash payment-success notification are removed from stop-OTP completion.

### Trusted corporate postpaid

```text
rideStatus: stop_otp_pending -> completed
billingMode: corporate_postpaid
paymentStatus: not_due
settlementStatus: not_settled
corporateBillingStatus: pending_company_billing
paymentDueAt: null
```

No customer cash/Razorpay UI or API is available. Unit 003A does not create credit, charge, invoice, or corporate payment records.

## Corporate marker protection

- Canonical `billingMode` is server-authoritative.
- Existing direct customer booking creation is constrained to `billingMode: customer_pay` and initial unlocked finance fields; clients cannot create `corporate_postpaid` rides or protected lock fields.
- Future corporate booking APIs may create the trusted corporate marker through Firebase Admin after verifying company/membership/policy/credit.
- All existing payment APIs and the customer shell fail closed for `corporate_postpaid`.
- A missing marker on a legacy booking normalizes to customer only for display; the normal lock path must ensure the document is not otherwise a corporate record before committing.

## Existing payment API boundary

Until Unit 003B is implemented:

- New `financeSchemaVersion: 1` rides cannot be settled by the existing Razorpay order/verify or cash routes.
- Existing endpoints return a safe conflict/unavailable response rather than mark paid without ledger/wallet settlement.
- Payment cannot begin during `stop_otp_pending`.
- Legacy records are read/displayed conservatively; Unit 003A does not silently continue unsafe settlement for an unlocked historical booking.
- The UI may show enabled/known methods and the selected state, but online action is visibly disabled with truthful availability text. Cash state indicates that assigned-driver confirmation will be supplied by a later bounded unit; it does not claim collection.

Unit 003B must replace this boundary with the complete provider/webhook/commission/wallet transaction before online payment is re-enabled for the new schema.

## Customer post-ride payment shell

For a completed normal ride:

- Clearly show “Ride completed” separately from “Payment due”.
- Render the locked total from integer paise and the itemized snapshot.
- Show payment status and currently known/enabled method choices.
- Show online payment as unavailable/disabled until Unit 003B rather than a working placeholder.
- Show cash selected/awaiting-driver-confirmation state without marking it paid.
- Provide safe refresh/retry of booking state, with loading/error/empty handling.
- Preserve the existing dark-and-gold dashboard design and responsive/accessibility conventions.
- Do not expose commission, wallet, driver dues, internal pricing hashes, or protected audit metadata.

For corporate postpaid, show a concise company-billing/postpaid state and no customer checkout. No corporate invoice claim is shown.

## Legacy normalization and dry-run audit

Reader normalizers classify without mutating:

- `Paid`/`paid` completed bookings.
- `Pending`/`pending` and other legacy casing.
- Previously auto-paid cash completions.
- Missing/unknown payment methods.
- Missing `finalFare` or nested fare values.
- Rupee-only fares and mixed rupee/paise records.
- Completed rides with unpaid, paid, contradictory, or missing finance state.
- Existing Razorpay IDs without a fare lock.

Add a read-only, production-safe dry-run audit command if implementation audit confirms it can be scoped safely. It reports counts, booking IDs, normalized classifications, and exclusion reasons only—no customer PII, tokens, exact locations, or secrets. It has no mutation mode. Any production backfill/repair requires a separate owner-approved migration unit.

Legacy auto-paid cash bookings remain historical paid records for display unless separately reconciled; Unit 003A must not generate commission/wallet settlement retroactively.

## Firestore rules plan

- Preserve customer and assigned-driver/admin read access needed for the existing booking UI.
- Require direct customer-created bookings to identify normal customer billing and an initial unlocked/non-settled state; reject client-supplied corporate or locked finance authority.
- Customers and drivers cannot change fare snapshot/lock, payment status/method lock, paid/cash timestamps, settlement, corporate billing, or finance schema fields.
- Narrow admin client updates so they cannot write protected finance fields or directly transition an unlocked booking to `completed`.
- Firebase Admin completion writes intentionally bypass rules after server authorization.
- Do not add broad collection access or weaken booking ownership/driver assignment.
- Unknown collections remain denied.

If field-existence compatibility makes a rule unsafe for legacy documents, use explicit `diff().affectedKeys()` protection and emulator cases rather than broad allowance.

## Expected implementation files

Exact paths must be rechecked before coding. Expected scope:

### Create

- `types/finance.ts` — paise, fare snapshot, payment/settlement/billing types.
- `lib/finance/money.ts` — safe integer conversion, addition, and formatting boundaries.
- `lib/server/finalFare.ts` — server-only fare candidate, lock validation, and transaction payload helper.
- Focused tests and, if safe, `scripts/audit-legacy-booking-finance.mjs` read-only report.

### Modify only as required

- `app/api/rides/otp/route.ts`
- `lib/server/paymentAmount.ts`
- `lib/ride/pricing.ts` only if needed to share trusted component output without changing estimate behavior
- `types/booking.ts`
- `components/BookingForm.tsx` for initial protected-compatible normal billing fields
- `components/dashboard/ActiveBooking.tsx`
- `components/ride/RidePayment.tsx`
- `app/api/payments/cash/route.ts`
- `app/api/payments/razorpay/order/route.ts`
- `app/api/payments/razorpay/verify/route.ts`
- `firestore.rules`
- Test/emulator scripts and package scripts only if a minimal test harness is justified
- Relevant Project Bible files and this specification

Do not touch driver wallet components, admin finance pages, notification campaigns, corporate application code, Maps loader, dependencies, or unrelated lifecycle files unless implementation discovers a proven scoped requirement and records it first.

## Test requirements

1. Successful stop OTP produces `completed`, immutable version-1 lock, and `payment_pending` for online/undecided normal rides.
2. Cash completion produces `cash_pending_confirmation`, null cash/paid timestamps, and no payment-success notification.
3. Trusted corporate postpaid completion produces `not_due`/company billing and no checkout.
4. Every snapshot amount is integer paise; unsafe/negative/overflow inputs fail.
5. Trusted rupee-to-paise conversion uses its documented round-half-up boundary consistently; Unit 003A does not calculate commission.
6. Repeated completion/fare lock returns the same snapshot without duplicate counters/notifications.
7. Client rules deny lock/fare/payment/cash/settlement/corporate protected changes.
8. A paid fare cannot be silently relocked or overwritten.
9. Missing/malformed legacy fare/route/payment data is classified safely with no mutation.
10. Customer shell distinguishes completed from payment due and reads paise snapshot.
11. New-schema payment routes fail closed until Unit 003B; stop-OTP-pending payment is unavailable.
12. Existing dispatch, popup, acceptance, arrival, start OTP, in-progress, stop OTP, driver release, customer dashboard, and rating gating do not regress.
13. No wallet, commission, cash due, withdrawal, refund, receipt, or settlement document/credit is created.
14. Corporate/customer cross-boundary and unknown-collection denial pass.
15. `npx.cmd tsc --noEmit`, lint, build, and `git diff --check` pass with no new warning.

### Required testing levels

- Unit tests for money helpers, normalization, fare candidate, transitions, and idempotency.
- Firestore emulator tests for protected booking fields, owner/driver/admin boundaries, corporate marker, and unknown denial.
- Local API integration tests for stop OTP success/repeat/failure and payment-route fail-closed behavior.
- Staging browser test with one verified customer and approved active driver through ride completion.
- Staging corporate-marker fixture test without implementing the corporate portal.
- No production deployment/completion claim until staging evidence and rollback review pass.

## Failure and edge cases

Missing server Maps key, Directions failure, missing place IDs/vehicle settings, settings changed during ride, invalid timestamps, zero/overflow fare, duplicate stop OTP, concurrent completion, stale driver active state, paid-but-unlocked legacy record, auto-paid legacy cash, missing method, conflicting billing marker, payment request racing completion, admin direct completion attempt, corporate marker spoof, notification failure, and unconfigured emulator/test harness.

The implementation must decide whether notification failure participates in the completion transaction based on the existing deterministic helper behavior; it must not duplicate completion or fare lock on retry.

## Security and logging

- No secrets, OTP values/hashes, Razorpay signatures, customer PII, exact unnecessary location data, or full booking payloads in logs.
- Development diagnostics may contain booking/driver IDs, normalized statuses, counts, fare version, and safe failure codes.
- Fare calculation uses server-only Maps key and Firebase Admin.
- Error responses are stable and user-safe; internal calculation/provider details remain server-side.
- No client-authoritative fare, corporate marker, payment, or settlement transition.

## Completion criteria

- [x] Integer-paise primitives and immutable fare snapshot are implemented and locally unit-tested.
- [ ] Stop-OTP completion atomically locks fare and completes the ride.
- [x] Cash completion code no longer marks paid or sends payment success; runtime staging verification remains pending.
- [x] Canonical transition helper sets online/undecided to `payment_pending`, cash to `cash_pending_confirmation`, and corporate to company billing without checkout.
- [x] Existing unsafe payment routes fail closed for finance schema version 1 until Unit 003B.
- [x] Customer shell distinguishes completed ride from payment due and preserves the existing design; browser verification remains pending.
- [x] Legacy records normalize/read safely, the audit tool is read-only, and no production history was mutated.
- [ ] Focused Firestore rules/emulator tests protect all finance fields without weakening existing ownership/unknown denial.
- [ ] Existing driver/customer lifecycle regression tests pass.
- [x] Focused structural tests prove Unit 003A completion adds no wallet, commission, cash-due, withdrawal, refund, receipt, or settlement posting.
- [x] Typecheck, lint, production build, and diff checks pass without introduced errors/warnings (four unrelated pre-existing driver-dashboard lint warnings remain).
- [ ] Staging ride-completion and corporate-exclusion browser tests pass with evidence.
- [ ] Rollback and deployment steps are documented and reviewed.

Unit 003A remains active until all criteria pass. A build pass alone is insufficient.

## Rollback plan

- Disable/revert the Unit 003A completion/shell/rule changes as one bounded release.
- Restore the previous stop-OTP code only if no new-schema ride has been completed in the target environment; otherwise retain snapshots and deploy a compatibility reader rather than deleting finance evidence.
- Never convert `cash_pending_confirmation` to paid during rollback.
- Preserve all version-1 fare snapshots for audit; do not destructively remove them.
- Restore prior rules only after confirming they do not expose protected fields or permit unsafe new-schema mutation.
- Re-run the production-verified Unit 001 lifecycle regression and customer dashboard smoke path.

## External setup and owner action

- `GOOGLE_MAPS_SERVER_API_KEY` must be available in the staging server environment for authoritative route calculation.
- Firebase Emulator Suite/test project access is required for rules/API tests.
- Provide staging test identities through existing safe seed tooling; never send credentials in chat.
- No Razorpay webhook secret or scheduler is needed to complete Unit 003A because actual settlement/release is out of scope.
- Qualified tax review remains a later production finance gate; Unit 003A only creates configurable data boundaries.

## Documentation/Bible updates

During implementation, record exact schemas/API/rule changes, tests, staging evidence, remaining limitations, and rollback result in this spec and the affected Bible files. Move to completed only after every completion criterion passes.

## Planning-task validation

Executed on 2026-07-16:

- Unit 003A scope/completeness and parent-link checks: passed.
- Markdown links/paths, documentation secret scan, and documentation-only scope: passed.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: passed with zero errors and the same four pre-existing driver-dashboard warnings.
- `npm.cmd run build`: passed on Next.js 16.2.10 and generated 43 static pages.
- `git diff --check`: passed with only existing line-ending notices.

These checks validate the specification and unchanged application build only. No Unit 003A code, rule, emulator, API integration, staging, or browser test was executed.

## Planning result

Unit 003A is specified and ready for a separate implementation session. This document creates no runtime route, field, rule, UI, helper, test, dependency, or configuration by itself.

## Implementation result — 2026-07-16

This section supersedes the earlier planning-only result above.

- Added checked integer-paise conversion/addition/division helpers and a pure snapshot amount builder. Rupee conversion is decimal round-half-up at the third decimal place; canonical calculations remain integer paise.
- Added `lib/server/finalFare.ts`. It recalculates route distance/duration using the server Maps key, reads trusted `settings/{vehicleType}`, versions the pricing inputs with a deterministic hash, zeros unsupported adjustments with explicit reasons, and returns a version-1 candidate.
- Kept `POST /api/rides/otp` with `action: verify_end` as the only normal lock authority. The assigned driver, ride/OTP state, candidate input fingerprint, finalized-payment guard, and deterministic lock identity are revalidated. Completion, snapshot, lifecycle state, driver release, OTP cleanup, and notification are committed in the existing Firestore transaction.
- A repeat of the same completed version-1 lock returns success without changing counters, timestamps, snapshot, or notifications. Completed malformed/legacy and finalized-but-unlocked records fail closed.
- Removed stop-OTP cash `paid`, `paidAt`, `cashCollectedAt`, and payment-success behavior. Cash now becomes `cash_pending_confirmation`; ordinary online/undecided becomes `payment_pending`; corporate postpaid becomes `not_due` plus `pending_company_billing`.
- New customer bookings initialize `billingMode: customer_pay`, `financeSchemaVersion: 1`, unlocked fare fields, `not_due`, and `not_settled`. Firestore creation rules require that unprivileged initial state.
- Current cash/order/verify routes authenticate and verify booking ownership/identity, then apply a shared fail-closed Unit 003A boundary. They cannot settle a pre-completion, corporate, unlocked, legacy-review, or new-schema ride.
- The dashboard now retains a completed unpaid/ambiguous booking as the visible post-ride item. The existing dark/gold payment card renders the locked paise breakdown, due/cash/corporate/legacy-review state, and disabled provider boundary; it no longer loads Razorpay or calls settlement APIs.
- Legacy read normalization treats prior paid records as legacy paid, identifies old auto-paid cash, and marks ambiguous completed records for review rather than inferring success. `scripts/audit-legacy-booking-finance.mjs` is read-only, guarded by environment/production confirmation, reports counts and document IDs only, and has no mutation mode.
- Admin direct `completed` selection is rejected in the UI. Rules restrict admin browser booking updates to known non-completed operational states or an unchanged already-completed state and protect canonical/compatibility finance fields. Firebase Admin server writes remain trusted and rules continue denying unknown collections.

### Exact implemented snapshot fields

`currency`, `estimatedFarePaise`, `baseFarePaise`, `distanceFarePaise`, `timeFarePaise`, `waitingChargePaise`, `tollChargePaise`, `parkingChargePaise`, `nightChargePaise`, `surgeChargePaise`, `platformChargePaise`, `driverAllowancePaise`, `discountPaise`, `cancellationChargePaise`, `taxPaise`, `commissionableFarePaise`, `taxableValuePaise`, `minimumFareAdjustmentPaise`, `totalPayablePaise`, `source`, `pricingVersion`, `distanceMeters`, `durationSeconds`, `unsupportedComponents`, `lockedAt`, and `lockedBy`.

The existing booking `platformCharge` is snapshotted as `platformChargePaise`; it is not Unit 003 platform commission. Tax uses the current trusted pricing setting only for compatibility and is not a compliance certification.

### Verification evidence

- `npm.cmd run test:unit003a`: passed. It covers round-half-up/invalid/unsafe money, snapshot calculation, cash/online/corporate transitions, lock identity/replay/finalized guards, legacy paid/ambiguous normalization, route boundary presence, removal of automatic cash-paid behavior, and absence of wallet/commission posting in completion.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: zero errors; four pre-existing warnings remain in `app/driver/dashboard/page.tsx` at lines 737, 1180, 1356, and 1446.
- `npm.cmd run build`: passed on Next.js 16.2.10; 43 static pages generated.
- `git diff --check`: passed; line-ending notices only.
- Firestore emulator execution: owner-verified on 2026-07-16 with OpenJDK `21.0.11` and Firestore Emulator `v1.21.0`. `firebase.cmd emulators:exec --only firestore --project demo-velora-cabs "npm.cmd run test:unit003a"` started successfully, ran the Unit 003A finance primitive/lifecycle/legacy-normalization suite, and exited successfully with code `0`.
- Audit safety check: passed by running with a production environment marker; it refused before Firebase initialization with `Refusing to audit a production-like project without explicit owner approval.` A live legacy audit was not executed because no staging audit environment was selected.
- Local API integration and staging/browser ride completion: not executed because safe staging credentials/environment and local `GOOGLE_MAPS_SERVER_API_KEY` were unavailable to this session.

### Active completion blockers

- Add and execute dedicated Firestore authorization cases when the repository gains `@firebase/rules-unit-testing`; the current emulator evidence proves startup/rule loading plus the existing Unit 003A suite, not per-role allow/deny assertions.
- Deploy rules and code to a staging Firebase/Vercel target with `GOOGLE_MAPS_SERVER_API_KEY` configured.
- Execute the verified-customer/approved-driver lifecycle through stop OTP for undecided/online and cash, plus a trusted corporate fixture; verify replay, customer shell, driver release, and no false settlement.
- Run the guarded read-only legacy audit against that staging project.

Unit 003A remains in `specs/active/`; build success does not satisfy these runtime completion gates.

## Staging verification continuation — 2026-07-16

Owner-supplied emulator evidence is accepted and recorded: OpenJDK 21.0.11, Firestore Emulator v1.21.0, successful `npm.cmd run test:unit003a` execution inside `firebase.cmd emulators:exec`, and process exit code 0.

Fresh local validation also passed: Unit 003A tests, TypeScript, production build, and diff check; lint reported zero errors and only the same four pre-existing driver-dashboard warnings.

Staging deployment was not performed because safe target discovery failed closed:

- `firebase.cmd projects:list` exposed only `velora-cabs`, the production Firebase project. No distinct staging Firebase project exists under the authenticated account.
- The Vercel project was safely linked without deployment. Preview environment names were inspected without printing values. Required public Firebase variables, public Maps key, Firebase Admin private key, and server Maps key pulled as empty; `NEXT_PUBLIC_FIREBASE_PROJECT_ID` had no staging target value.
- Therefore application code and rules could not be deployed together to a non-production target. No branch was pushed, no Vercel preview was created, no Firestore rules were deployed, no staging booking/API data was mutated, and no live legacy audit was run.
- Firebase Authentication authorized-domain and browser Maps-referrer approval cannot be confirmed until an exact preview hostname and staging Firebase project exist.

Required owner/browser verification after staging is configured:

1. Deploy this exact commit to a Vercel preview and deploy `firestore.rules` to the selected non-production Firebase project as one coordinated release.
2. Normal ride: approved driver enables location/goes online; verified customer books immediate; driver accepts; start OTP and end OTP succeed. Confirm the customer dashboard retains the completed ride and shows ride completed, payment due, locked fare/breakdown, and no payment-success state. Confirm the driver is released.
3. Cash ride: select cash, complete through end OTP, confirm `cash_pending_confirmation`, no paid/receipt/wallet state, and no false payment-success notification.
4. Replay: repeat the same completion request and confirm unchanged snapshot/version, one completion notification, and no second trip increment.
5. If a trusted corporate fixture exists, confirm `not_due`, `pending_company_billing`, and no customer checkout. Otherwise leave the fixture gate pending.
6. Run `npm.cmd run audit:finance:dry-run` only with staging Admin variables and `VELORA_FINANCE_AUDIT_ENV=staging`; record category counts only.

No real Razorpay charge is permitted. Unit 003A remains active pending authenticated owner browser evidence. Unit 003B has not started.

## Staging deployment attempt — 2026-07-17

- Confirmed branch `unit-003a-staging-verification` at baseline implementation commit `587fe32509e0ebaa0dc22d4dd6db97eca72b2eb8` with a clean tracked worktree before this documentation update.
- Firebase CLI now lists and authorizes both `velora-cabs` production and the distinct `velora-cabs-staging` project. Production was not selected, mutated, or deployed.
- The linked Vercel project is `velora-cabs`. Live metadata confirms all thirteen required names are Preview-scoped, but Vercel intentionally omits their values from metadata/detail responses. No values were printed or written into tracked files.
- A fresh Preview environment pull materialized all thirteen entries empty. More decisively, `vercel.cmd build --target preview --yes` failed during `/admin/analytics` prerender with `Missing Firebase environment variables: apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId`. The expected `NEXT_PUBLIC_FIREBASE_PROJECT_ID == velora-cabs-staging` gate therefore could not pass.
- The coordinated staging release failed closed before mutation. `firestore.rules` was not deployed to staging, the branch was not pushed by this attempt, no Vercel Preview deployment was created, and no staging API/data, legacy audit, browser flow, or Razorpay charge was executed.
- Fresh verification passed: `npm.cmd run test:unit003a`; Firestore Emulator v1.21.0 under OpenJDK 21.0.11 with exit code 0; `npx.cmd tsc --noEmit`; local `npm.cmd run build`; and the pre-documentation `git diff --check`. Lint returned zero errors and the same four pre-existing driver-dashboard warnings. The separate Vercel Preview build failed only at the missing Preview configuration gate above.
- Staging deployment may resume only after the Vercel Preview values are saved as non-empty, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` resolves exactly to `velora-cabs-staging`, and the application Preview plus matching staging rules can be released together.

Unit 003A remains active. Authenticated owner browser verification is still required, and Unit 003B has not started.

## Local Vercel adapter diagnosis — 2026-07-17

- Replaced the six public Firebase Web App Preview entries as readable non-sensitive Vercel Preview variables, which is appropriate for `NEXT_PUBLIC_*` client configuration. A value-free verification confirmed all six are non-empty, no placeholder remains, and the project ID resolves exactly to `velora-cabs-staging`. Production variables were not changed.
- Audited `app/admin/analytics/page.tsx`, the client admin layout, root layout, route imports, route-segment exports, middleware/proxy absence, `next.config.ts`, package scripts, and Vercel linkage/settings. The analytics route has no invalid export, runtime override, dynamic/static override, middleware dependency, or custom Vercel configuration.
- A clean `npm.cmd run build` passed. `/admin/analytics` exists as a static prerender in `.next/server/app/admin/analytics`, `app-paths-manifest.json`, `routes-manifest.json`, and `prerender-manifest.json`, with valid HTML, RSC, metadata, trace, and segment artifacts.
- Clean local Vercel builds fail on Windows with `Unable to find lambda for route: /admin/analytics` using both CLI 54.20.1 / `@vercel/next` 4.20.2 and current CLI 56.3.1 / `@vercel/next` 4.20.4. The adapter writes only `.vercel/output/config.json` version 3 and produces no functions/static output before failing.
- This is a local Windows Vercel adapter packaging incompatibility with the valid Next.js 16.2.10 static App Router output, not a genuine analytics route error. Stale `.next`/Vercel output, invalid exports, unsupported runtime, middleware, project linkage, and outdated CLI were independently ruled out. No application or route workaround was added.
- The next safe evidence is a normal remote Vercel Preview build from the clean branch on Vercel's build environment. Firestore rules remain undeployed until that application Preview succeeds. Unit 003B remains out of scope.

## Remote Preview and staging rules — 2026-07-17

- Committed the Bible diagnosis as `6bccbb0` and pushed `unit-003a-staging-verification` after staged-file, ignored-secret, and diff safety checks passed with no secret values or credential artifacts.
- A standard remote Vercel Preview build succeeded on Vercel CLI 56.2.0/Linux with Next.js 16.2.10, TypeScript, all 43 static pages, and `/admin/analytics` present as a static route. Deployment `dpl_ApZUDpiKziLzuULDLPDy6uTRoxrh` is Ready at `https://velora-cabs-mcdrugm8q-jyotshinasingh7-ship-its-projects.vercel.app`.
- After the application gate passed, `firebase.cmd deploy --only firestore:rules --project velora-cabs-staging` compiled and released the matching Unit 003A rules successfully. Production Firebase/Vercel targets were not changed.
- Anonymous smoke tests passed: `/` returned 200, `/admin/analytics` returned 200, and unauthenticated `POST /api/rides/dispatch` returned the expected 401, confirming the remote route/function output is healthy.
- Unit 003A remains active pending authenticated verified-customer/approved-driver normal and cash completion, replay, corporate exclusion fixture, legacy dry-run audit, and owner browser confirmation. No real Razorpay charge was made and Unit 003B was not started.

## Staging identity preparation — 2026-07-17

- Audited the existing broad `scripts/seed-test-accounts.mjs`. It is environment-guarded and idempotent, but it creates nine cross-module identities, prints generated passwords to terminal, and its approved-driver record lacks the complete vehicle/service fixture needed for this bounded staging lifecycle test.
- Added a dedicated staging-only seed workflow at `scripts/seed-unit-003a-staging.mjs`. It permits only project ID `velora-cabs-staging` with an explicit staging/Preview marker, refuses account takeover, verifies Auth and Firestore access before generating credentials, creates only verified customer/approved driver/admin identities, and writes passwords only to ignored `.test-credentials/unit-003a-staging.json` after access succeeds.
- The planned driver fixture is offline initially and has trusted `users`, approved `driverApplications`, `drivers`, and `vehicles` records, no incoming/active ride, supported local/airport/outstation services, a deterministic staging vehicle, and one isolated staging pricing document. It creates no booking, wallet, commission, receipt, withdrawal, settlement, or Unit 003B record.
- Dry-run and syntax validation passed. A deliberate `velora-cabs` target was refused before Firebase initialization, proving the production guard.
- The linked Vercel Preview environment exposed non-empty Admin credential names, but its locally injected `NEXT_PUBLIC_FIREBASE_PROJECT_ID` did not resolve to the expected staging ID. Overriding only the non-secret target ID to `velora-cabs-staging` caused Firebase Auth to reject the Preview Admin identity with `auth/insufficient-permission`. No Auth user or Firestore document was created or changed in staging or production.
- The seed generated an intended local credential file before the permission failure under its first implementation; that unusable artifact was immediately removed. The workflow now proves both staging Auth and Firestore access before generating or persisting passwords. No credential file currently exists and no password was printed.
- Live identity creation therefore remains blocked until the Vercel Preview Firebase Admin service account is granted access to `velora-cabs-staging`, or an equivalent staging-only Admin triplet is placed directly in an ignored local environment file. Production credentials must not be reused.
- Fresh validation passed: staging seed dry-run, `npm.cmd run test:unit003a`, `npx.cmd tsc --noEmit`, `npm.cmd run lint`, `npm.cmd run build`, `git diff --check`, ignored-path verification, and changed-file secret scan. Lint has zero errors and only the same four pre-existing driver-dashboard warnings.

Unit 003A remains active. Authenticated browser completion, cash-pending behavior, replay, corporate exclusion, and the staging legacy audit are still pending. Unit 003B was not started.

## Staging identity retry after credential correction — 2026-07-17

- The owner reported replacing the two Firebase Admin Preview variables with a service-account key generated from `velora-cabs-staging`.
- A value-free `vercel env run` diagnostic confirmed both Admin variable names are non-empty and the Vercel Preview marker is present. The injected `NEXT_PUBLIC_FIREBASE_PROJECT_ID` still did not resolve to `velora-cabs-staging`.
- The mandated seed command therefore used its explicit non-secret `velora-cabs-staging` override. The exact-project guard passed, but the Firebase Admin identity was denied. A dedicated sequential access probe reported `FIREBASE_AUTH_ACCESS=FAIL` with `auth/insufficient-permission`; the initial concurrent preflight also returned Firestore `PERMISSION_DENIED`.
- A read-only Firebase CLI database listing confirmed the staging `(default)` Firestore Native database exists. The failure is Admin identity/IAM or stale Preview-variable delivery, not an absent staging database.
- Preflight occurs before password generation and before all Auth/Firestore fixture writes. No customer, driver, admin, application, vehicle, service/pricing fixture, or credential file was created. `.test-credentials/unit-003a-staging.json` remains absent and Git-ignored. Production was not targeted or modified.
- The seed now includes a value-free `--verify-access` mode and reports Auth and Firestore access independently before mutation.
- Fresh local validation passed: seed syntax/dry-run, Unit 003A focused tests, TypeScript, Next.js production build, and diff checks. Lint returned zero errors and the same four pre-existing driver-dashboard warnings.

Unit 003A remains active. Unit 003B was not started. The next gate is a Preview Admin identity that passes both staging Auth and Firestore access checks.

## Successful staging identity seed — 2026-07-17

- Located exactly one downloaded staging Firebase service-account JSON and validated in memory that its project, service-account email scope, private key, and private-key ID belong to `velora-cabs-staging`; no value or JSON content was printed.
- Overwrote only the two Sensitive Vercel Preview variables for branch `unit-003a-staging-verification`. Production and Development variables were not changed.
- Pulled the branch Preview environment to ignored `.env.preview.local`. Because Vercel does not return Sensitive values during `env pull`, hydrated only the two empty local Admin entries directly from the same validated staging JSON. `.env.local` was not read or modified.
- Value-free checks passed: staging project ID, no production project ID, staging-scoped Admin email, and non-empty private key.
- Explicit `.env.preview.local` access preflight passed for both Firebase Auth and Firestore.
- The guarded seed completed and verified three TEST ONLY identities: one verified customer, one approved active driver initially offline with no incoming/active ride, and one active admin. Approved driver application, linked approved dispatch vehicle, supported local/airport/outstation services, and isolated staging pricing fixture all passed verification.
- Credentials were generated only at ignored `.test-credentials/unit-003a-staging.json`; no password or secret was printed. No wallet, commission, receipt, withdrawal, settlement, production, or Unit 003B record was created.

Unit 003A remains active pending authenticated Preview browser verification of normal and cash completion behavior. Unit 003B was not started.
