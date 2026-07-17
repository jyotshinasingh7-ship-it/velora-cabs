# Velora Project Overview

Last verified: 2026-07-17

## Product truth

Velora Mobility is the public brand used in navigation and logos; Velora Cabs is the application/package and service name. It is an India-focused mobility platform currently aimed at local city cabs, airport transfers, outstation bookings, intercity seat sharing, custom-tour enquiries, corporate transport leads, driver onboarding, and vehicle-owner onboarding.

The current web product serves:

- Customers seeking immediate or scheduled travel.
- Drivers applying to join, receiving approval, going online, and handling rides.
- Fleet partners/car owners submitting commercial vehicles for review.
- Corporate contacts submitting transport enquiries.
- Administrators overseeing bookings, users, applications, pricing, notifications, leads, analytics, and settings.

## End-to-end journeys

### Customer

Discover service → sign up or log in → satisfy email verification for password accounts → choose service and route → receive Places/Directions estimate → book now or schedule → dispatch/matching → ride arrival and OTP lifecycle → cash or Razorpay payment → rating and booking history.

Implemented in code: authentication pages, protected dashboard/profile, booking form/map, immediate dispatch call, scheduled data, lifecycle UI/APIs, payment routes, rating, and history. Unit 001 was production-browser verified from immediate booking through driver delivery, acceptance, dashboard transitions, and ride completion. That result does not establish post-ride payment, commission, or driver-wallet settlement as complete.

### Driver

Authenticate → submit application → admin review/approval → trusted `drivers/{uid}` creation → driver login → online/offline state and location → incoming request popup/countdown/sound → accept/reject → arrival → start OTP → ride → stop OTP/completion.

Implemented in code. Approval is server-controlled. Unit 001 production-browser verification confirmed request popup, countdown, sound, acceptance, active-ride transition, and ride completion for an approved online driver.

### Fleet/car owner

Authenticate → submit vehicle-owner application → admin review → approved trusted vehicle created inactive with dispatch disabled → operational activation outside the current flow.

Implemented in code but not fully runtime-tested. There is no fleet operations dashboard. Document uploads are absent because Storage is not wired.

### Admin

Authenticate against trusted `users.role == "admin"` → use dashboard → view bookings/customers/drivers → review driver and vehicle applications through server APIs → edit Firestore pricing → manage notification campaigns → view corporate leads, analytics, and settings.

Code exists for these routes. Production role-protected workflows need manual verification. Analytics/settings depth must not be assumed from route existence.

### Corporate

The current corporate module is **lead-generation only**: a public form creates `corporate_requests`, and an admin page reads/manages those records. There is no company account portal, employee roster, policy engine, contract pricing, monthly billing, GST invoice workflow, or corporate reporting SaaS.

The owner has approved the future direction: an authenticated, single-company corporate portal with trusted `corporate_admin`/`corporate_employee` roles, company-paid postpaid rides, policy and credit enforcement, company percentage discounts, monthly consolidated GST invoices, and manual bank-transfer reconciliation. This is a planned phased module, not current production functionality.

### Planned corporate journey

Company applies → Velora admin reviews → trusted corporate account is approved → corporate admin invites employees and assigns policies → authorized employee/admin books self/employee/guest using the existing booking/dispatch engine → over-limit rides receive corporate approval → estimated credit is reserved → ride completes and final corporate charge replaces the reservation → monthly draft invoice is reviewed/issued → bank transfer is reconciled by Velora admin.

Corporate employees and guests do not use normal cash/Razorpay checkout. Initial services are local, airport, and outstation with immediate/scheduled booking. Online invoice payment, multi-company membership, multi-level approvals, recurring transport, public APIs, and accounting integrations are outside the initial MVP.

Approved operating defaults are ₹1,00,000 company credit, ₹5,000 employee per-ride limit, ₹25,000 employee monthly limit, discount-before-GST with server-side place-of-supply tax treatment, Net 15 plus seven-day grace, guest phone OTP, Velora-admin-only invoice issue/cancellation/reconciliation, and at least eight-year protected financial/report retention. Corporate applications require verified company/representative documents through private, validated, malware-scanned storage. Qualified tax/legal review and Storage implementation remain launch gates, not unresolved product decisions.

### Planned post-ride finance model

Completed Unit 003 defines, but does not implement, the separate customer-payment and driver-settlement lifecycle. For online rides, the customer pays the full locked final fare to Velora through server-verified Razorpay; Velora records platform commission and the driver net as an internal wallet liability. For cash rides, the driver collects the full fare, receives no duplicate digital earning credit, and owes the platform commission through a cash-due balance offset against future online earnings/withdrawals. MVP driver payout supports a verified bank account or verified UPI ID through an audited manual withdrawal settlement; automatic provider payouts are future scope.

All authoritative finance uses integer paise, immutable ledger entries, idempotent server transactions, separate ride/payment/settlement statuses, and a server-locked final fare. Commission is 15% by default with a ₹10 minimum and applies to pre-tax base/distance/time/waiting/night/surge after discount; GST, toll, and parking are excluded. Online earnings have a 24-hour pending hold, cash rides block at ₹1,000 commission due, minimum withdrawal is ₹500, incentives use a separate expense pool, split payment/tips are outside MVP, and refund shortfalls may create audited recoverable driver dues without a negative available balance. These are configurable trusted defaults, not browser constants.

Unit 003A now provides the first lifecycle boundary locally: stop-OTP completion locks a server-authoritative integer-paise snapshot, cash remains `cash_pending_confirmation`, ordinary rides remain payment due, and corporate postpaid bypasses checkout. The customer dashboard shows a truthful locked-fare shell while all current settlement actions fail closed. Razorpay settlement/webhook, commission, wallet accounting, cash due, withdrawals, receipts, refunds, and release scheduling remain unimplemented.

## Services and current handling

- Local: supported by `/book?service=local` behavior.
- Airport: supported by booking service type.
- Outstation: supported, including one-way/round-trip pricing fields.
- Intercity: separate published-ride and seat-request module under `/intercity` and `/driver/intercity`.
- Custom tours: authenticated request flow using `customTourRequests`.
- Corporate: enquiry/lead workflow only.
- Wedding/tempo: represented in marketing/fleet/service content; not accepted as core booking `serviceType` by Firestore rules. Needs product definition before dedicated pricing/dispatch claims.

## Core goals

- Securely connect customers with approved drivers.
- Keep estimates transparent while protecting final payable fare server-side.
- Allow administrators to govern supply, pricing, applications, and communications.
- Preserve a premium dark-and-gold Velora experience across mobile and desktop.

## Current scope and readiness

### Implemented but not fully tested

- Email/password, Google, and phone authentication code.
- Customer booking, dashboard, profile, payments, rating, and notifications.
- Driver and vehicle-owner onboarding plus admin approval APIs.
- Dispatch and driver lifecycle APIs/UI.
- Admin pricing and broadcast notifications.
- Intercity publishing and seat requests.

### Incomplete or externally blocked

- Firebase Storage/document uploads are not configured.
- Razorpay webhook/reconciliation is not implemented.
- Unit 003A code is locally/emulator validated and deployed to a Ready Vercel Preview with matching Firestore rules on `velora-cabs-staging`. The remote Linux build and anonymous analytics/API smoke checks pass; authenticated customer/driver completion, cash, replay, corporate-exclusion, and owner browser verification remain pending. Local Windows Vercel adapter packaging remains unreliable despite valid Next output.
- Scheduled notification/ride reminder delivery has no trusted cron scheduler.
- Corporate portal implementation has not started. Unit 002 business definition is completed; Unit 002A now plans corporate application, protected documents, secure admin approval, trusted account creation, and initial corporate-admin association.
- Emulator/rules tests are not present as an automated test suite.
- Authenticated production browser journeys need manual testing.

### Future/proposed scope

- Phased corporate Units 002A–002J covering approval, tenancy, employees, booking, pricing, credit, invoicing, reconciliation, reporting, and hardening; only Unit 002A has an active planning specification.
- Secure onboarding document uploads after Storage design/rules.
- Payment webhooks and reconciliation.
- Phased Unit 003A–003H implementation for fare locking, complete online settlement, cash settlement, scheduled release/offsets, wallet UI, withdrawals, admin finance/refunds, migration, and hardening.
- Trusted scheduled job infrastructure.
- WhatsApp/push communication only after explicit scope and provider decisions.

### Explicitly out of scope without approval

- Redesigning the visual system.
- Self-service driver role assignment or vehicle activation.
- Automatically applying advertised notification coupons.
- Treating fleet approval as dispatch activation.
- Client-authoritative pricing, payment, or protected lifecycle state.

## Definitions of done

- **Testing done:** typecheck, lint, build, diff check, relevant automated tests, and documented manual journeys pass with evidence.
- **Staging done:** staging environment variables/services are configured; authenticated role journeys, Maps, Firestore rules, payment test mode, and responsive checks pass on staging.
- **Production done:** staging criteria pass; production domains/restrictions/rules/indexes are deployed; live-mode operational checks and rollback are approved; monitoring and webhook/reconciliation gaps are resolved. Current state does not satisfy this definition.
