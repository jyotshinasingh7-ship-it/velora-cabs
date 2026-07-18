# Unit 003B — Razorpay Post-Ride Payment

- Status: implementation in progress
- Owner: Velora project owner
- Created: 2026-07-17
- Parent definition: [`Unit 003 — Post-Ride Payment, Platform Commission, Driver Wallet and Settlement`](../completed/unit-003-post-ride-payment-driver-wallet.md)
- Dependency: [`Unit 003A — Final Fare Lock and Payment Lifecycle Separation`](unit-003a-final-fare-payment-lifecycle.md)

## Goal

Allow the owning customer to pay a completed, locked-fare, non-corporate ride through Razorpay Standard Checkout in Test Mode. Direct verification and signature-verified webhooks must converge on one idempotent Firestore settlement boundary. A successful payment records Velora collection and changes the booking to `paid` plus `pending_driver_earnings`, without posting commission or driver wallet entries.

## Repository truth before implementation

- Unit 003A produces immutable integer-paise `fareSnapshot.totalPayablePaise`, `payment_pending` for ordinary online rides, `cash_pending_confirmation` for cash, and `not_settled` for both.
- The current order route is fail-closed for finance schema 1 but still contains legacy recalculation/order code and accepts `stop_otp_pending` in unreachable fallback logic.
- The current verification route is likewise fail-closed for schema 1, stores the browser signature, accepts legacy fare fallbacks, and does not set a canonical settlement state.
- The customer payment component renders the locked breakdown but intentionally disables all provider actions.
- No Razorpay webhook route, provider-event idempotency record, or payment-ID replay claim exists.
- `razorpay` 2.9.6 is installed. Preview contains test-mode key names, but test-key identity and webhook-secret setup must be verified without exposing values.

## Scope

1. Server-only Razorpay client/credential boundary.
2. Authenticated, owner-only order creation from the locked Firestore paise snapshot.
3. Idempotent reuse of a valid unpaid order and a short-lived creation claim for concurrent requests.
4. Razorpay Standard Checkout in the existing completed-ride payment card.
5. Server-side callback signature, order, payment, amount, currency, ownership, and lifecycle verification.
6. Signature-verified raw-body webhook processing for captured/paid and failed events.
7. One shared idempotent settlement service for direct verification and webhooks.
8. Safe payment-provider event and payment-ID claim records, denied to clients by the existing catch-all rule.
9. Payment success/failure notifications.
10. Focused tests and Preview-only deployment/browser verification.

## Explicitly out of scope

- Driver wallet or immutable earning ledger posting.
- Platform commission calculation/posting.
- Cash collection, cash commission due, or cash settlement.
- Receipt generation.
- Withdrawals, payouts, Razorpay Route/Linked Accounts, or automatic bank transfer.
- Refunds, disputes, recoverable dues, tips, incentives, penalties, or manual finance adjustments.
- Corporate invoicing or employee checkout.
- Production Firebase, production Razorpay, or production Vercel deployment.

## Order API

`POST /api/payments/razorpay/order`

- Requires a valid Firebase bearer token.
- Accepts booking document ID and compatibility booking ID only; no amount/currency/fare input is accepted.
- Requires customer ownership, `completed`, `customer_pay`, finance schema 1+, locked valid fare snapshot, `payment_pending` (or a safe retry after provider failure), and `not_settled`.
- Rejects cash and corporate-postpaid bookings.
- Uses `fareSnapshot.totalPayablePaise` and `fareSnapshot.currency` only.
- Creates a short-lived Firestore order-creation claim before the external call.
- Reuses a stored provider order only when provider amount/currency/status remain eligible and unpaid.
- Stores safe order ID/status/amount/currency/receipt and timestamps; never stores provider secrets.
- Returns only Checkout-required public data.

## Checkout UI

- Existing locked fare and breakdown remain unchanged.
- Cash, corporate, legacy-review, paid, and ineligible states never show Checkout.
- Eligible online rides show **Pay Now** with loading, modal-dismissed, failed, retry, verifying, and verified-success states.
- Checkout loads the official Standard Checkout script once and uses the server-created order.
- Available Test Mode methods are controlled by the Razorpay account/Checkout configuration; the client does not claim unavailable methods.
- The browser callback is treated only as a verification input. The UI shows success only after the secure verification API succeeds or the Firestore listener observes `paid`.

## Verification API

`POST /api/payments/razorpay/verify`

- Requires Firebase authentication and booking ownership.
- Requires the stored order and locked expected amount/currency.
- Verifies HMAC `order_id|payment_id` using the server secret with timing-safe comparison.
- Fetches provider payment and order, validates IDs, captured state, amount, currency, and binding, and captures an `authorized` payment only for the exact locked amount when required.
- Never uses a browser-submitted amount, currency, status, method, or fare.
- Converges on the shared settlement transaction.

## Webhook API

`POST /api/payments/razorpay/webhook`

- Reads the raw request body before parsing.
- Requires `RAZORPAY_WEBHOOK_SECRET` and validates `x-razorpay-signature` with timing-safe HMAC comparison.
- Uses `x-razorpay-event-id` when supplied and a raw-body hash fallback for deduplication.
- Supports `payment.captured`, `order.paid`, and `payment.failed`; unknown verified events are acknowledged without mutation.
- Locates the booking by trusted stored order ID, validates locked amount/currency/order/payment identity, and calls the same settlement/failure transaction as direct verification.
- Stores only safe event IDs/types/provider references/statuses and processing timestamps, never the raw payload or signature.

## Canonical payment transition

First valid captured payment:

```text
rideStatus: completed (unchanged)
paymentStatus: payment_pending|payment_processing|payment_failed -> paid
settlementStatus: not_settled -> pending_driver_earnings
paymentMethod: provider-derived upi or razorpay
paymentMethodLocked: true
paidAt: server timestamp
fareSnapshot/fareVersion/fareLockedAt: unchanged
```

`pending_driver_earnings` means Velora has verified customer collection but Unit 003C has not yet posted commission or driver earnings.

## Idempotency and atomicity

- One provider payment ID may settle only one booking, enforced by a trusted payment claim document.
- Direct verification replay for the same booking/order/payment returns success without another mutation or notification.
- Webhook retries use provider event IDs/body hashes and are processed once.
- Direct verification and webhook arrival order do not matter; both converge on the same transaction.
- A failed event never downgrades an already-paid booking.
- Fare snapshot and lock metadata are never modified by payment settlement.

## Planned trusted records

### `paymentProviderPayments/{hashedPaymentId}`

Payment ID claim containing provider, safe payment/order/booking references, amount/currency, status, source, and server timestamps. Client read/write remains denied.

### `paymentProviderEvents/{hashedEventId}`

Webhook/direct event claim containing provider, event type, safe references, processing result, and server timestamps. Raw payloads, signatures, secrets, card/UPI details, and customer financial data are not stored.

## Security invariants

- Client amount, currency, role, ownership, status, settlement state, and provider status are never authoritative.
- Cash and corporate rides cannot create online orders.
- Incomplete/unlocked/legacy-review rides cannot create or verify payment.
- Payment success is written only by Firebase Admin server code after provider verification.
- Clients cannot read or write provider-event/payment-claim collections.
- Logs contain safe error codes and IDs only; no secret, signature, token, full payload, card, VPA, or personal data.

## Tests

1. Unauthenticated order route retains `requireUser` protection.
2. Wrong-customer ownership is rejected.
3. Incomplete ride is rejected.
4. No client amount is accepted or used.
5. Duplicate order requests reuse the eligible order/creation claim.
6. Invalid Checkout signature is rejected.
7. Wrong provider order/payment amount/currency is rejected.
8. Valid captured verification produces `paid` plus `pending_driver_earnings` once.
9. Verification replay is idempotent.
10. Captured webhook and direct verification converge.
11. Failed webhook cannot downgrade paid.
12. Cash and corporate bookings cannot create an online order.
13. No wallet, commission, withdrawal, receipt, or payout record is created.
14. Unit 003A tests, Unit 003B tests, typecheck, lint, build, and diff check pass.

## External setup

- Preview must use Razorpay **Test Mode** `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET` from the same account/mode.
- Preview requires a separate `RAZORPAY_WEBHOOK_SECRET` configured both in Vercel Preview and Razorpay Test Mode dashboard.
- Webhook URL: Preview deployment origin plus `/api/payments/razorpay/webhook`.
- Enable Test Mode events `payment.captured`, `payment.failed`, and optionally `order.paid`.
- QR/UPI methods shown by Checkout depend on Razorpay Test Mode/account capability; no static QR is implemented.

## Completion gate

Unit 003B remains active until local tests/build pass, Preview deploys, Razorpay Test Mode order/Checkout/direct verification succeeds, webhook capture/failure/replay is tested, cash/corporate exclusions are verified, and the owner confirms the authenticated browser flow. Production remains untouched.
