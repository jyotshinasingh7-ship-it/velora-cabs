# Unit 003 — Post-Ride Payment, Platform Commission, Driver Wallet and Settlement

- Status: completed; business and architecture definition approved
- Owner: Velora project owner
- Created: 2026-07-16
- Last updated: 2026-07-16
- Related decision IDs: VEL-ADR-003, VEL-ADR-004, VEL-ADR-012, VEL-ADR-015, VEL-ADR-016
- Related Bible sections: `context/architecture.md` (Pricing and payments; planned post-ride finance architecture), `context/project-overview.md` (Planned post-ride finance model), `context/progress-tracker.md` (Unit 003)

## Owner goal

Define a secure post-ride financial lifecycle in which Velora receives online customer payments, records platform commission, credits the assigned driver's internal wallet exactly once, accounts for commission owed on driver-collected cash, and supports audited manual driver withdrawals.

This task completes PLAN only. No payment, wallet, rule, API, UI, dependency, or configuration change is implemented by this specification.

## Business context

Ride completion and financial settlement are distinct. A ride may be `completed` while payment is still due, processing, failed, disputed, or refunded. Likewise, an internal driver-wallet balance is an accounting liability owed by Velora; it is not evidence that money reached the driver's bank or UPI account.

Corporate company-paid postpaid rides follow the separately planned corporate credit/invoice lifecycle and must not enter Unit 003 customer cash/Razorpay checkout.

## Current repository truth

### What exists

- `components/BookingForm.tsx` lets the customer choose `cash`, `upi`, or `razorpay` before the ride and writes a browser estimate in rupees. It initializes legacy `paymentStatus: "Pending"` and stores `finalFare == estimatedFare` as an estimate for compatibility.
- `components/dashboard/ActiveBooking.tsx` renders `components/ride/RidePayment.tsx` during `stop_otp_pending` and `completed`, and rating is gated on `paymentStatus == paid`.
- `POST /api/payments/razorpay/order` authenticates the booking owner, checks ride eligibility, recalculates a route/fare server-side, creates/reuses a Razorpay order, and stores the provider order ID and integer-paise order amount.
- `POST /api/payments/razorpay/verify` verifies booking ownership, order ID, HMAC signature, provider order/amount/status, captures an authorized payment, and transactionally marks the booking paid with an idempotent customer notification.
- `POST /api/payments/cash` authenticates the customer, recalculates a payable fare, and records cash selection as pending.
- `lib/server/paymentAmount.ts` uses server Directions plus `settings/{vehicleType}` and `lib/ride/pricing.ts`. It recalculates the planned route, not a final meter, and currently supplies zero toll, parking, and waiting adjustments.
- `lib/ride/pricing.ts` calculates in JavaScript numbers/rupees, rounds to whole rupees, and adds configured GST to the subtotal. It is suitable for the existing estimate but does not satisfy the proposed integer-paise finance ledger.
- `POST /api/rides/otp` completes the ride when the stop OTP succeeds. For a booking whose method is already cash, it also marks payment `paid` and records cash collected without a separate driver confirmation, commission entry, or wallet transaction.
- Driver approval creates legacy summary fields (`walletBalance`, `pendingBalance`, `todayEarnings`) on `drivers/{uid}`. `DriverWalletCard` displays them, but no trusted workflow updates them after payment. Its Withdraw button routes to `/driver/wallet`, which does not currently exist.
- Admin booking/dashboard screens display fare/payment fields. Admin dashboard “revenue” currently sums all booking `finalFare` values regardless of payment method/status and is not an accounting report. Admin pricing edits vehicle fare settings, not finance/commission settings. Admin settings is placeholder-only.
- Firestore rules deny ordinary client writes to unknown finance collections, but no explicit wallet, ledger, receipt, withdrawal, provider-event, or settlement rules exist.

### What is missing or unsafe for the approved model

- No immutable finance ledger, driver wallet collection, commission engine, settlement record, withdrawal request, receipt collection, cash-due balance, finance audit UI, or provider webhook exists.
- No final-fare lock/version or trusted toll/parking/waiting approval workflow exists. The current “payable fare” is a new server recomputation at payment time and can change when pricing settings change.
- Current payment routes accept `stop_otp_pending` as well as `completed`, so checkout/cash selection can occur before ride completion and before any immutable fare lock.
- Ride completion and cash payment are currently conflated. Cash is marked paid without an assigned-driver “Cash Collected” confirmation and without commission accounting.
- Razorpay verification is partially idempotent for one booking/payment ID but does not claim provider payment IDs globally, write a receipt/settlement ledger, calculate commission, or credit a wallet.
- Razorpay order reuse is not transactionally reserved, so concurrent order requests can create more than one provider order even though only one stored order remains authoritative.
- No webhook reconciles captured, failed, refunded, or disputed provider events. Direct browser verification is therefore the only completion path.
- Provider signature data is stored on the booking even though long-term storage is unnecessary for customer/UI behavior; implementation should retain only the minimum audit metadata required.
- Existing money fields mix whole-rupee numbers and paise. No migration report identifies historical conflicts.
- No refund or adjustment workflow exists. No automatic or manual earning-release scheduler is implemented.
- Admin booking UI can directly change ride status under the current admin rules; setting `completed` this way has no fare-lock or settlement side effect. Unit 003A must route finance-relevant completion through a trusted lifecycle service rather than infer payment from status alone.
- The driver dashboard contains obsolete client-side lifecycle handlers in addition to the secure OTP route, but Unit 003 must not alter them except where a bounded implementation unit proves a finance interaction.

## Problem statement

Define one server-authoritative, integer-paise, idempotent financial system that separates ride state, payment state, and driver settlement state; prevents double earnings; supports both Velora-collected online payments and driver-collected cash; and preserves current booking aliases and corporate future compatibility.

## Approved financial model

### Online rides

- The customer pays the full locked final fare into Velora's Razorpay account.
- Server verification is mandatory; a displayed checkout/UPI/QR state never proves payment.
- The configured platform commission is Velora revenue and the remainder, after approved penalties/incentives, becomes payable to the assigned driver.
- Example only: a ₹500 final fare at 15% produces ₹75 commission and ₹425 driver net earning.
- The wallet first records the earning as pending or available according to the configured hold policy. Wallet credit does not mean bank payout.
- MVP payout is a driver withdrawal request followed by admin-reviewed manual bank/UPI settlement. Razorpay Route/Linked Accounts and automatic provider transfer are future scope.

### Cash rides

- The customer pays the full locked fare directly to the assigned driver.
- The system records gross cash collected, driver cash earning, and platform commission due; it never credits the same earning digitally.
- Example only: for ₹500 cash at 15%, the driver retains ₹425 economically and owes Velora ₹75 commission.
- Cash commission due offsets future online earnings/withdrawals through explicit ledger entries. A verified provider “Pay Cash Dues” flow may clear it later.
- At/above the configured maximum due threshold, new cash rides are blocked while online rides may remain available.

### Commission configuration

Trusted admin configuration must support:

- default platform commission percentage;
- minimum platform commission;
- settlement hold duration;
- minimum withdrawal;
- maximum cash commission due;
- cash rides enabled/disabled; and
- withdrawals enabled/disabled.

Override priority is driver-specific, then vehicle-category, then global default. Only the global default is in the initial MVP unless a later repository audit proves safe existing override support.

Approved configurable defaults are:

- `platformCommissionPercentage: 15%`, stored as `defaultPlatformCommissionBps: 1500`.
- `minimumPlatformCommissionPaise: 1000` (₹10).
- `settlementHoldHours: 24`.
- `minimumWithdrawalPaise: 50000` (₹500).
- `maximumCashCommissionDuePaise: 100000` (₹1,000).
- `cashRideEnabled: true`.
- `withdrawalEnabled: true`.

These values live in trusted finance settings, not browser constants. A Velora admin changes them only through a secure server API that records before/after values, operator UID, server timestamp, reason where required, and an immutable audit event. A settled ride retains its commission/settings snapshot.

## Money and accounting invariants

- Every new authoritative money field is integer paise; never use floating-point ledger math.
- Browser estimates, payable values, roles, assignment, provider status, and settlement instructions are never authoritative.
- `rideStatus`, `paymentStatus`, and `settlementStatus` remain separate.
- A completed ride may remain `payment_pending`.
- A locked fare cannot be overwritten. Corrections create append-only adjustment/refund records and update aggregate snapshots transactionally.
- Provider payment IDs, booking settlement, cash settlement, withdrawal, and refund events are each idempotently claimed.
- Only the assigned approved driver may receive the ride earning.
- Corporate postpaid bookings are rejected by normal customer payment endpoints.
- Unknown collections remain denied.

Approved formulas, all in non-negative integer paise:

```text
commissionableFarePaise = max(
  0,
  baseFarePaise
  + distanceFarePaise
  + timeFarePaise
  + waitingChargePaise
  + nightChargePaise
  + surgeChargePaise
  - discountPaise
)

percentageCommissionPaise = floor(
  (commissionableFarePaise * platformCommissionBps + 5000) / 10000
)

platformCommissionPaise = max(
  0,
  min(
    commissionableFarePaise,
    max(minimumPlatformCommissionPaise, percentageCommissionPaise)
  )
)

driverBaseEarningPaise =
  commissionableFarePaise
  - platformCommissionPaise

driverNetEarningPaise =
  driverBaseEarningPaise
  - driverPenaltyPaise
  + driverIncentivePaise

netWithdrawablePaise = max(
  0,
  availableBalancePaise
  - cashCommissionDuePaise
  - reservedWithdrawalPaise
)
```

Percentage rounding is round-half-up to the nearest paise for non-negative values, implemented with integer arithmetic as shown. The commission is capped at `commissionableFarePaise` so the minimum commission cannot create a negative base earning on a very small fare. All inputs require safe-integer and range validation.

Platform commission applies only to the pre-tax commissionable fare. Tax/GST, toll, and parking are excluded. Discounts reduce commissionable fare before commission and cannot make it negative. Toll and parking remain separately itemized pass-through charges; any driver reimbursement/collection is a separate accounting component and never Velora commission revenue.

Driver incentives use a separate Velora incentive/marketing expense pool. They do not reduce recorded ride commission. Ride earning, commission, incentive, incentive funding source, penalty, and adjustment remain distinct ledger events.

Tips are outside the MVP and do not appear in Unit 003A. If separately approved later, the default policy is no platform commission on tips, subject to provider/tax review.

Financial records separately represent commissionable fare, non-commissionable pass-through charges, discount, taxable value, tax components, total customer payable, platform commission, and driver net earning. `taxPaise` is separately itemized and `totalPayablePaise` is the full customer charge. Tax remains server-authoritative/configurable; final rates, presentation, and place-of-supply compliance require qualified Indian tax/accounting review and are never hardcoded in browser components.

## Final fare lock

### Proposed timing and authority

- At successful stop-OTP verification, the trusted ride-completion API should atomically transition the ride to `completed`, calculate/finalize supported authoritative charges, and create the immutable fare-lock snapshot.
- Only trusted server code may lock a fare. `fareLockedBy` is `system` for the ordinary calculation or the authenticated Velora admin UID for an approved exceptional adjustment.
- Customer and driver clients may submit evidence/requested adjustments but never write money totals directly.
- Toll, parking, and waiting adjustments require a bounded evidence/approval contract. Driver-submitted amounts remain proposed until a trusted server policy or admin approves them with actor, timestamp, reason, and evidence metadata.
- Until final-meter/adjustment support exists, Unit 003A must lock only charges it can authoritatively calculate, set unsupported adjustments to zero, and clearly disclose the limitation. It must not silently copy browser values.
- After lock, changes use a versioned adjustment event; the original snapshot remains auditable.

### Proposed protected booking fields

- `estimatedFarePaise`
- `finalFarePaise`
- `baseFarePaise`
- `distanceFarePaise`
- `timeFarePaise`
- `waitingChargePaise`
- `tollChargePaise`
- `parkingChargePaise`
- `nightChargePaise`
- `surgeChargePaise`
- `discountPaise`
- `cancellationChargePaise`
- `taxPaise`
- `totalPayablePaise`
- `fareLockedAt`
- `fareLockedBy`
- `fareVersion`
- `fareLockIdempotencyKey`
- `commissionableFarePaise`
- `passThroughChargesPaise`
- `taxableValuePaise`
- `driverPassThroughPayablePaise` when trusted reimbursement/collection treatment is implemented

Existing rupee fields and nested fare aliases remain readable during migration. New server paths prefer paise snapshots. Removing aliases requires a separately approved migration.

### Legacy bookings

Do not auto-lock, charge, or settle historical completed rides. A dry-run-only report must classify completed-unpaid rides, paid-without-settlement rides, missing drivers, missing/invalid final fares, conflicting statuses, and duplicate provider IDs. Any selected backfill requires separate owner approval and per-record audit evidence.

## Proposed lifecycle states

### Booking payment status

`not_due`, `payment_pending`, `payment_processing`, `paid`, `cash_pending_confirmation`, `cash_collected`, `payment_failed`, `partially_refunded`, `refunded`, `disputed`.

### Driver settlement status

`not_settled`, `pending`, `available`, `withdrawal_reserved`, `processing`, `settled`, `reversed`.

Legacy `Pending`, `pending`, and `authorized` require explicit normalization/migration behavior. They must not be silently reinterpreted as paid or settled.

## Proposed data model

All schemas below are planned until their bounded implementation unit is approved and audited.

### `financeSettings/global`

Protected server/admin configuration: `currency`, `defaultPlatformCommissionBps: 1500`, `minimumPlatformCommissionPaise: 1000`, `settlementHoldSeconds: 86400`, `minimumWithdrawalPaise: 50000`, `maximumCashCommissionDuePaise: 100000`, `cashRidesEnabled: true`, `withdrawalsEnabled: true`, `version`, `updatedAt`, and `updatedBy`. Percentage storage uses integer basis points, not floats. Client writes are denied and every trusted change is audited with before/after values.

### `driverWallets/{driverUid}`

- `driverUid`
- `currency`
- `availableBalancePaise`
- `pendingBalancePaise`
- `reservedWithdrawalPaise`
- `cashCommissionDuePaise`
- `recoverableDriverDuePaise`
- `lifetimeOnlineEarningsPaise`
- `lifetimeCashCollectedPaise`
- `lifetimeGrossRideValuePaise`
- `lifetimePlatformCommissionPaise`
- `lifetimeWithdrawnPaise`
- `status`
- `createdAt`
- `updatedAt`

Only trusted server code modifies aggregates. Refund/reversal shortfalls use explicit recoverable due records and the protected aggregate; they never silently force available balance below zero.

### `walletTransactions/{transactionId}`

Immutable fields:

- `transactionId`
- `driverUid`
- `bookingId`
- `type`
- `direction`
- `amountPaise`
- `balanceBucket`
- `balanceBeforePaise`
- `balanceAfterPaise`
- `paymentMethod`
- `paymentId`
- `orderId`
- `status`
- `description`
- `idempotencyKey`
- `createdAt`
- `createdBy`
- `metadata`

Supported types: `online_ride_earning`, `platform_commission`, `cash_ride_record`, `cash_commission_due`, `cash_commission_payment`, `cash_commission_offset`, `withdrawal_reserve`, `withdrawal_paid`, `withdrawal_reversal`, `refund_adjustment`, `incentive`, `penalty`, and `manual_adjustment`. Informational commission/cash records must identify the affected balance bucket and must not fake a wallet credit.

### `rideFinancialSettlements/{bookingId}`

One protected settlement aggregate per booking: locked fare/commission snapshot, driver/customer/company identifiers, payment method/status, settlement status, gross/commission/net paise, provider IDs, idempotency keys, timestamps, and version. This is the once-only bridge between a paid/collected booking and ledger/wallet effects.

### `paymentReceipts/{bookingId}`

Customer-readable protected receipt containing booking/customer ownership, locked fare breakdown, paid amount/currency/method, masked provider metadata, transaction/provider reference, issued timestamp, and receipt version. It contains no Razorpay secret or unnecessary driver financial data.

### `paymentProviderEvents/{eventId}`

Server-only webhook/direct-verification reconciliation claim: provider, provider event/payment/order ID, normalized event type/status, booking ID, payload hash/minimal safe metadata, received/processed timestamps, processing result, and idempotency key. Raw sensitive payload retention must be minimized and governed.

### `driverWithdrawalRequests/{requestId}`

- `requestId`
- `driverUid`
- `amountPaise`
- `status`
- `payoutMethod`
- `payoutReference`
- `createdAt`
- `reviewedAt`
- `reviewedBy`
- `processedAt`
- `notes`
- `transactionId`
- `idempotencyKey`

Statuses: `requested`, `under_review`, `approved`, `processing`, `paid`, `rejected`, `failed`, `cancelled`.

### Booking finance snapshot

The existing `bookings` document retains lifecycle aliases and receives protected fare-lock, payment, settlement, corporate-exclusion, receipt, commission-snapshot, and provider-reference fields required by current readers. Exact field placement must be finalized in Unit 003A after auditing every reader; financial truth must not be split into contradictory duplicate fields.

## Proposed online payment flow

1. Stop OTP succeeds and the trusted server completes the ride and locks the final fare.
2. A non-corporate owner sees the final breakdown and selects Razorpay Checkout/UPI.
3. A trusted order API rechecks booking ownership, locked fare, method eligibility, payment state, and exact integer-paise amount.
4. Order creation uses a deterministic booking/fare-version idempotency claim so concurrent retries cannot leave multiple authoritative orders.
5. Razorpay receives the full amount into Velora's account.
6. Direct verification checks HMAC, provider order/payment ownership, amount, currency, capture state, and global payment-ID uniqueness.
7. A verified webhook independently reconciles captured, failed, refunded, and disputed states supported by Razorpay. Direct verification and webhook converge on the same idempotent settlement service.
8. One Firestore transaction writes/updates the provider-event claim, booking payment state, receipt, ride settlement, driver wallet, commission/earning ledger entries, and deterministic notifications. If the hold applies, the net earning enters pending, not available.
9. Online driver earnings enter pending for the approved 24-hour hold. Trusted scheduled infrastructure releases them automatically when no failed/reversed/refunded/disputed payment, fraud/support review, or audited admin hold exists. The scheduler and release path must be configured and staging-tested before automatic release is claimed complete.
10. Hold release moves the earning from pending to available through a separate idempotent ledger event. If cash commission or recoverable driver due exists, the release/withdrawal workflow creates explicit offsets without double subtraction.

Suggested settlement key: `online-settlement:{bookingId}:{providerPaymentId}`. Provider payment IDs must be unique across all bookings.

Razorpay Checkout/UPI is preferred. A static or unaudited QR is prohibited. Any future dynamic QR must be provider-created, booking/amount-bound, expiring, and confirmed by webhook/provider status.

## Proposed cash payment flow

1. The completed, fare-locked, non-corporate booking enters `cash_pending_confirmation` only if cash is enabled and the driver's due threshold permits cash rides.
2. The assigned authenticated driver presses **Cash Collected** after receiving the full amount.
3. A trusted API verifies driver assignment, completed ride, locked fare, expected method, cash eligibility, and absence of an existing settlement.
4. One Firestore transaction marks cash collected, creates `rideFinancialSettlements/{bookingId}`, increments lifetime cash/gross/commission aggregates and `cashCommissionDuePaise`, creates immutable `cash_ride_record` and `cash_commission_due` entries, and sends confirmations.
5. It does not increase pending or available driver earnings.

Suggested key: `cash-settlement:{bookingId}`.

- Duplicate taps return the already-completed result.
- If the driver says cash was not received, the booking remains pending confirmation and can enter a documented dispute/admin-review flow; no earning or due entry is created.
- Customer amount disputes move the protected payment state to `disputed` through a trusted workflow; clients cannot reverse ledger entries.
- Partial/split cash is not supported in the MVP. A short collection enters dispute/support and is not marked partially paid.
- Cancelled rides only create an authoritative cancellation charge/commission event when the cancellation unit supplies a locked charge.
- A driver who goes offline after completion may confirm later after reauthentication; offline state cannot bypass assignment or idempotency.
- Cash-dues payment must use a provider order bound to the driver and exact due amount, verified by signature/webhook before reducing the due ledger. A displayed UPI/QR is insufficient.
- A driver with cash commission due below `100000` paise remains cash-eligible. At or above the threshold, trusted dispatch/eligibility blocks new cash rides but permits online rides and never interrupts an active ride; eligibility returns below the threshold.

One ride is settled through one method: full verified online payment or full confirmed cash. After completion, a customer may choose/change an enabled method only while no settlement is final and no online payment is actively processing. A failed or expired online attempt may return to `payment_pending`; successful online payment, cash confirmation, or final settlement permanently locks the method. Every method transition is server-validated and audited.

## Atomicity and idempotency contract

Firestore transactions or an equivalent atomic server workflow are mandatory. Deterministic document IDs/claims must prevent duplicate payment verification, provider-event processing, booking settlement, commission entry, wallet credit, cash settlement, hold release, withdrawal reserve/payment/reversal, refund, and manual adjustment.

Online settlement atomically covers the booking, provider-event claim, receipt, ride settlement, wallet aggregate, earning/commission ledger entries, and event notifications. Cash settlement atomically covers the booking, ride settlement, wallet aggregate, cash/commission ledger entries, and notifications. Withdrawal reserve atomically validates net withdrawable, records the request, increases reserved balance, and creates its ledger entry. A paid/rejected/failed withdrawal atomically updates request, reserved/available aggregates, ledger, operator audit metadata, and notification.

External provider calls cannot be rolled back with Firestore. Persist an idempotent intent before/around the provider operation and reconcile uncertain outcomes through provider fetch/webhook rather than retrying blindly.

## Withdrawals and cash offsets

- The driver requests an amount through a trusted API.
- Server checks driver/wallet status, withdrawals-enabled setting, minimum, integer amount, and `netWithdrawablePaise`.
- Reservation increases `reservedWithdrawalPaise` atomically; it does not report payout.
- Velora admin reviews and manually pays by the owner-approved payout methods.
- MVP payout methods are a verified bank account or verified UPI ID selected from the driver's protected configured methods. Ordinary UI/logs show masked details only.
- Only after recording a verifiable payout reference does a trusted action mark paid, reduce available/reserved balances, increment lifetime withdrawn, and append ledger/audit entries.
- Rejection/failure/cancellation releases the reservation exactly once.
- Cash commission offsets must be explicit immutable transactions. No browser may edit a balance directly.

## Refunds, disputes, and adjustments

- Refund initiation is an authenticated admin finance action that validates booking/payment state and uses Razorpay's server API.
- Webhook/provider confirmation, not the button click, finalizes refund state.
- The same idempotent workflow updates payment status, receipt, settlement, commission, and wallet ledger.
- If driver earning is still pending, reverse the pending amount first. If available, create an explicit adjustment subject to sufficient funds and the approved recoverable-dues policy.
- If earning was already withdrawn or is otherwise unavailable, create an explicit idempotent recoverable driver due linked to booking, original transaction, refund reference, amount, reason, status, and audit metadata. Never silently create a negative available balance.
- Future online earnings and withdrawals may offset the recoverable due through documented ledger entries. A waiver/correction requires an audited admin action.
- Cash refund is an admin-reviewed manual adjustment in the MVP with evidence/reference and audit history.
- Manual incentives, penalties, and corrections require a secure Admin API, reason, operator UID/time, idempotency key, and immutable ledger entry. There is no direct balance editor.

## Admin finance plan

Plan routes such as `/admin/finance`, `/admin/finance/withdrawals`, and protected detail views within the existing admin design. Show gross customer collections, platform commission, driver payable balances, payment method/status, settlement status, cash commission dues, withdrawals, provider IDs, refunds/adjustments, ride-wise breakdown, search/filtering, and audit history.

Finance settings use secure server APIs and version/audit metadata. Existing `/admin/pricing` remains vehicle fare configuration. Existing dashboard “revenue” must not be treated as finance truth and should later use settled ledger aggregates.

## Driver experience plan

Create the currently missing `/driver/wallet` experience and extend existing dashboard cards without redesigning them. Show today's/weekly earnings, available/pending balances, cash collected, cash commission due, net withdrawable, recent immutable transactions, per-ride breakdown, withdrawal form/history, and cash-threshold warning.

Examples must distinguish:

- Online ₹500: Velora commission ₹75; wallet earning ₹425.
- Cash ₹500: customer paid driver ₹500; driver earning ₹425; Velora commission due ₹75; no ₹425 wallet credit.

## Customer experience plan

After completion, show the locked final fare breakdown, available methods, Razorpay Checkout/UPI, cash only when permitted, processing/success/failure/retry states, booking ID, receipt, and safe provider transaction reference. Do not expose driver wallet, commission overrides, or other private finance data.

Corporate-postpaid bookings show company billing status and never render normal cash/Razorpay payment actions.

## Notifications

Use deterministic in-app events for payment due/success/failure, cash collected, earning credited/released, cash due increased/threshold warning, withdrawal requested/approved/paid/rejected, and refund processed. Notifications report state; they do not authorize a financial transition.

## API plan

Exact routes are finalized per bounded unit. Likely trusted Node routes/helpers include:

- final fare lock/adjustment;
- Razorpay order, direct verification, and `/api/payments/razorpay/webhook`;
- assigned-driver cash collection;
- cash-dues provider payment;
- driver withdrawal creation/cancellation;
- admin finance settings, withdrawal review/payment, refund, and adjustment;
- receipt/history reads where Firestore ownership reads are insufficient; and
- shared commission, settlement, wallet, idempotency, and reconciliation services.

Every authenticated route verifies a Firebase ID token and trusted user/driver/admin records. The webhook verifies the raw request signature with a separate server-only webhook secret; it never trusts an ID token or parsed body before signature verification. Logs contain safe IDs/statuses/counts, never secrets, signatures, full provider payloads, customer financial data, or unnecessary personal data.

## Firestore rules plan

- Customer reads only their own booking payment snapshot and receipt.
- Driver reads only their own wallet, ledger, and withdrawal records.
- Client create/update/delete is denied for wallets, ledger, settlements, receipts, provider events, finance settings, refunds, and protected financial audit records.
- Withdrawal creation/review occurs through trusted APIs; direct client writes are denied.
- Customers cannot set paid/refunded/provider states. Drivers cannot set cash collected or balances directly.
- Admin finance mutations use trusted APIs; admin read access is limited to required finance views.
- Existing booking rules and unknown-collection denial are not weakened.

Rules tests must cover owner isolation, cross-driver/customer denial, financial client-write denial, provider/payment replay, cash assignment, corporate checkout exclusion, admin API role gates, and unknown collection denial.

## Security constraints

- Never trust browser fare, amount, commission, payment success, cash receipt, payout reference, role, driver ID, company ID, or status.
- Never expose Razorpay key secret/webhook secret or Firebase Admin credentials.
- Verify booking ownership and assigned driver from trusted data at every operation.
- Claim provider payment/refund IDs globally and compare exact amount/currency/order.
- Minimize stored provider data; do not store secrets or unnecessary signatures.
- Use integer paise and checked integer bounds.
- No self-approved withdrawal, refund, adjustment, or commission configuration.
- No negative wallet or silent overwrite; corrections are ledger events.

## Compatibility requirements

- Preserve booking `customerId`/`userId`, `rideStatus`/`status`, fare aliases, payment-method aliases, driver linkage, and current reader behavior until a documented migration.
- Normalizers must explicitly handle legacy status casing and rupee fields.
- Driver approval may retain legacy summary fields temporarily, but `driverWallets` becomes finance authority; dual-write/read migration must be explicit and cannot create two sources of truth.
- Existing notification idempotency is reused.
- Corporate bookings remain in `bookings` but carry a trusted corporate billing marker that makes all normal payment routes return a safe conflict.
- Intercity has a separate payment model and is outside Unit 003 unless a later audit explicitly brings it into scope.

## Out of scope

- Corporate invoice charging/reconciliation.
- Razorpay Route/Linked Accounts or automatic driver payouts.
- Static QR payment proof.
- Automatic tax filing/accounting integration.
- Custom per-driver/category commission overrides in the first MVP unless separately approved.
- Historical financial backfill without a reviewed dry run and owner approval.
- Redesign or unrelated ride-lifecycle cleanup.

## Phased implementation plan

Each sub-unit requires its own active implementation spec and full PLAN → IMPLEMENT → VERIFY cycle.

1. **Unit 003A — Fare lock and lifecycle separation:** introduce paise finance primitives, immutable fare lock/version, payment/settlement states, stop-OTP completion separation, corporate exclusion, legacy normalization, focused rules, and a disabled-boundary customer post-ride shell. Lock only authoritatively supported charges.
2. **Unit 003B — Complete online settlement:** secure global finance settings, basis-point commission, wallet/ledger/settlement foundations, transactionally safe Razorpay order intent, direct verification/webhook reconciliation, receipt, pending wallet credit, notifications, and provider staging tests as one coherent exactly-once path.
3. **Unit 003C — Cash confirmation and cash commission due:** assigned-driver confirmation, no digital double credit, cash ledger/due, threshold and cash-method eligibility, cash-dues provider payment, disputes, notifications, and tests.
4. **Unit 003D — Scheduled earning release and recoverable offsets:** trusted 24-hour scheduler, hold/exception evaluation, pending-to-available ledger transitions, cash/recoverable-due offsets, admin hold controls, monitoring, and replay tests.
5. **Unit 003E — Driver wallet and transaction UI:** dashboard summaries, `/driver/wallet`, per-ride entries, pending/available display, cash/recoverable dues, net withdrawable, and history using trusted aggregates.
6. **Unit 003F — Withdrawal and manual settlement:** verified bank/UPI methods, atomic reservation, driver request/history, admin review/manual payout, reversal/failure, audit/notifications, and payout-reference validation.
7. **Unit 003G — Admin finance, refunds, and adjustments:** accounting views, secure settings UI/API, provider refunds/reconciliation, manual cash refund, incentives/penalties/corrections/recoverable dues, and immutable audits.
8. **Unit 003H — Migration, rules, staging/provider testing, and production hardening:** dry-run legacy report, approved targeted migration only, emulator/rules regression, concurrency/replay tests, Razorpay test webhook drills, monitoring/reconciliation, rollback, and production release gate.

## Final owner decisions

1. Commission applies to the non-negative pre-tax ride components after discount: base, distance, time, waiting, night, and surge. GST is not commissionable.
2. Toll and parking are separately itemized non-commissionable pass-through charges; reimbursement/collection treatment cannot inflate platform revenue.
3. Driver incentives use a separate Velora incentive/marketing expense pool and separate ledger entries; they do not silently reduce ride commission. Penalties/adjustments remain separate.
4. Online earnings enter pending and automatically release after 24 hours unless payment/refund/dispute/fraud/support/admin-hold conditions block release. Trusted scheduled infrastructure and testing are mandatory before claiming automation.
5. Partial or split cash/online payment is outside the MVP. Short cash enters dispute/support.
6. An enabled method may change only before final settlement and while no online payment is processing. Failed/expired online attempts may return to `payment_pending`; successful online/cash settlement locks the method.
7. Non-zero cash due below `100000` paise permits cash rides. At/above the threshold, new cash rides are blocked, online rides continue, active rides remain uninterrupted, and eligibility returns below threshold.
8. MVP withdrawals support verified bank account and verified UPI ID, selected from protected driver payout methods; payout remains audited/manual.
9. Approved trusted defaults are 15% commission, `1000` paise minimum commission, 24-hour hold, `50000` paise minimum withdrawal, `100000` paise maximum cash due, cash enabled, and withdrawals enabled. Changes require secure audited admin APIs and do not alter settled snapshots.
10. Refund/reversal shortfalls may create explicit recoverable driver dues; no silent negative available balance. Future earnings/withdrawals may offset them, and waivers require audited admin action.
11. Tips are outside the MVP and Unit 003A. Future tips default to non-commissionable with separate provider/tax review.
12. Finance records separately store commissionable fare, pass-through charges, discount, taxable value, tax components, total payable, commission, and driver earning. Tax stays configurable/server-authoritative and requires qualified Indian tax/accounting review before production certification.

No genuine Unit 003 business decision remains unresolved. Tax-professional review, Razorpay webhook/provider setup, and trusted scheduler configuration/testing remain implementation and compliance gates rather than missing product decisions.

## Files expected in future implementation

No application files are created or modified by this planning task. Each sub-unit must re-audit exact paths. Likely future scope includes payment/ride API routes, server finance helpers, booking/payment types, customer/driver/admin finance components/routes, rules/indexes, seed/test/migration tooling, and the related Bible files.

## External setup

- Razorpay test-mode keys in server-only environment scopes.
- A separate `RAZORPAY_WEBHOOK_SECRET` configured directly in local/Vercel environments and the Razorpay dashboard callback URL/events.
- Razorpay product activation if dynamic QR or a later payout product is approved.
- Trusted scheduler choice if automatic hold release is approved.
- Staging Firebase project/test users and emulator/rules harness.
- Qualified Indian tax/accounting review before production fare/commission/GST treatment.
- Admin operational controls for manual payout references, bank/UPI verification, disputes, and reconciliation.

## Validation plan

Every implementation unit runs:

```text
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Also require unit tests for paise math/status transitions/idempotency; Firestore emulator tests; API auth/ownership/replay/concurrency tests; Razorpay test-mode order/capture/webhook/refund tests; cash and withdrawal negative cases; staging browser journeys; migration dry-run review; and reconciliation/rollback evidence. No provider or production claim follows from a build pass.

## Failure and edge cases

Concurrent order creation, duplicate payment callbacks/webhooks, provider timeout after capture, webhook before browser callback, wrong amount/currency/order, reused payment ID, price-setting changes, missing driver/final fare, cash double tap, driver offline, disputed/partial cash, refund after withdrawal, simultaneous withdrawals, cash threshold race, hold release during refund, notification failure, legacy casing/rupee data, corporate marker absence/conflict, and manual payout reference reuse.

## Completion criteria

- [x] Online and cash collection/commission responsibilities approved.
- [x] Integer-paise, immutable ledger, idempotency, atomicity, and state-separation invariants approved.
- [x] Commissionable components, exclusions, discount order, and round-half-up basis-point method approved.
- [x] Incentive funding, 24-hour release, partial-cash, payment-method-change, cash-threshold, payout-method, refund-recovery, tip, and tax boundaries approved.
- [x] Finance settings defaults and audited change requirements approved.
- [x] Fare lock, wallet, ledger, settlement, withdrawal, refund, notification, corporate exclusion, legacy, rules, security, and compatibility plans documented.
- [x] Units 003A–003H bounded, with Unit 003A specified separately as the immediate implementation unit.

Unit 003 business/architecture definition is complete. Implementation evidence belongs to Units 003A–003H and must not be inferred from this completed planning specification.

The future full implementation program is complete only when:

- final fare is locked server-side in paise and ride/payment/settlement states are separate;
- online payment is provider-verified/webhook-reconciled and exactly-once commission/wallet/receipt records are atomic;
- cash collection is assigned-driver-confirmed, creates commission due, and never double-credits earnings;
- wallet, immutable ledger, holds/offsets, withdrawals, refunds, and adjustments satisfy approved rules;
- customer, driver, and admin finance experiences work without redesign;
- corporate bookings cannot enter customer checkout;
- legacy migration is dry-run reviewed and no historical settlement occurs without approval;
- rules/API/provider/concurrency/staging tests pass with documented evidence; and
- owner operational, tax, webhook, scheduler, reconciliation, and rollback gates are satisfied.

## Rollback plan

Each sub-unit must be independently deployable/rollbackable. Disable new payment/withdrawal actions through trusted settings, preserve immutable provider/ledger/audit records, reconcile any provider-captured payment before rollback, restore prior UI/API versions without deleting finance evidence, and never reverse wallet aggregates without compensating transactions. Legacy aliases remain until the migration unit is approved.

## Documentation/Bible updates

This planning task updates project overview, architecture, progress, decisions, glossary, and this specification, then moves it to `specs/completed/`. `AGENTS.md` and UI context do not change because no workflow or implemented UI changed.

## Planning-task validation

Executed on 2026-07-16:

- Specification completeness: passed.
- Markdown link/path check: passed.
- Documentation secret scan: passed.
- Documentation-only scope check: passed; no application source, Firestore rule, API, UI, dependency, or configuration file changed.
- `npx.cmd tsc --noEmit`: passed. The PowerShell `npx.ps1` shim was blocked by local execution policy, so the equivalent Windows command shim was used.
- `npm.cmd run lint`: passed with zero errors and the same four pre-existing `app/driver/dashboard/page.tsx` warnings.
- `npm.cmd run build`: passed on Next.js 16.2.10 and generated 43 static pages.
- `git diff --check`: passed; Git emitted only existing LF-to-CRLF conversion notices for Bible files.

These checks validate the planning documents and unchanged repository build only. No payment/provider, wallet, rules, emulator, staging, or browser flow was tested.

Final business-definition validation on 2026-07-16:

- All twelve approved decisions and required formula/default boundaries: passed.
- Completed Unit 003 placement and active Unit 003A existence: passed.
- Specification completeness, Markdown links/paths, documentation secret scan, and documentation-only scope: passed.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run lint`: passed with zero errors and the same four pre-existing driver-dashboard warnings.
- `npm.cmd run build`: passed on Next.js 16.2.10 and generated 43 static pages.
- `git diff --check`: passed with only existing line-ending notices.

No application, provider, emulator, staging, or browser finance behavior was tested or changed by this closure task.

## Planning result

All twelve decisions are approved and Unit 003's business/architecture definition is complete. The bounded Unit 003A implementation specification is active. No Unit 003 application code, Firestore rule, API, UI, dependency, or configuration has been implemented by this documentation task.
