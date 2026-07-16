# Velora Architecture

Last verified: 2026-07-16

## Technology stack

- Next.js `16.2.10` App Router; React/React DOM `19.2.0`; TypeScript `^5` with strict mode.
- Tailwind CSS `^4` through `@tailwindcss/postcss`; Geist/Geist Mono via `next/font`.
- Firebase client `^12.15.0`; Firebase Admin is pinned to `13.10.0` for current Next.js/Vercel CommonJS compatibility (see VEL-ADR-010).
- Google Maps JS API Loader `^2.1.1` and Google Maps types `^3.65.2`.
- Razorpay `^2.9.6`, Framer Motion `^12.42.2`, Lucide React `^0.542.0`.
- ESLint 9 with Next 16 core-web-vitals/TypeScript configs. Vercel hosts Next.js; Firebase hosts Auth/Firestore.

## Repository structure

- `app/`: App Router pages, layouts, and Node API handlers. The audit found 34 `page.tsx` files and 19 `route.ts` handlers (53 route files); dynamic segments and aliases affect the final route manifest. The 2026-07-14 build generated 43 static pages.
- `components/`: homepage, booking, customer, driver, admin, onboarding, ride, and notification client UI.
- `lib/`: client Firebase/auth/Maps, ride and driver utilities, plus `lib/server/` server-only Admin helpers.
- `types/`: booking, onboarding, notification, and intercity models.
- `public/`: Velora logos, fleet imagery, generic starter SVGs, and ride-alert audio source data.
- `scripts/seed-test-accounts.mjs`: guarded Admin SDK test seed/cleanup/dry-run script.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`: Firestore and emulator configuration. No Storage configuration.

Most interactive pages are client components. API handlers use Node runtime where Firebase Admin/Razorpay are required. No custom `loading.tsx`, `error.tsx`, or app-level `not-found.tsx` exists; loading/error states are generally component-local.

## Authentication and roles

- Email/password signup sends verification; password users are gated using provider data plus `emailVerified`.
- Google popup authentication and browser-local persistence are implemented.
- Phone OTP uses Firebase `signInWithPhoneNumber` and invisible reCAPTCHA; provider enablement and production behavior need verification.
- `users/{uid}` stores the profile and trusted `role`: `customer`, `driver`, or `admin`. Account/onboarding intent may be `customer`, `driver`, or `partner` without granting the trusted role.
- Admin client layouts check `users.role`; protected server routes also verify the ID token and trusted role. Driver dashboard requires a trusted approved/active driver profile.
- Fleet/car-owner applicants retain customer-level permissions; approved vehicle ownership does not create a separate privileged dispatch role.

## Firestore collections

### `users/{uid}`

Created by the user’s auth/profile flow with role `customer`; readable by owner/admin. Users cannot change their role. Admin approval routes can merge trusted role/application state.

### `bookings/{clientRequestId}`

Customer creates own normalized booking. Important fields include `bookingId`, `clientRequestId`, `customerId`/`userId`, customer details, service/vehicle type, flattened and nested location aliases, distance/duration, estimated fare/breakdown, booking mode and `scheduledAt`, `rideStatus`/`status`, payment fields, driver/request fields, audit timestamps, and source/platform. Customers, assigned/requested driver, and admins read according to rules. Privileged lifecycle APIs use Admin SDK; Firestore permits a narrowly scoped driver acceptance update.

### `drivers/{uid}`

Trusted record created by driver approval API. Contains approval/active/online status, locations, incoming/active ride IDs, vehicle/profile, metrics, and request expiry fields. Owner reads and can modify only operational fields allowed by rules; admin has full rule access.

### `vehicles/{vehicleId}`

Trusted record created after vehicle approval with `isApproved: true`, `isActive: false`, and `dispatchEnabled: false`. Owner/admin read; client writes denied.

### `driverApplications/{uid}`

Verified email/phone applicant creates own submitted application and reads it. Applicant can resubmit allowed fields only from `needs_changes`; review fields are protected. Admin review API controls status and trusted driver/user creation.

### `vehicleOwnerApplications/{applicationId}`

Owner-scoped submitted vehicle application. Resubmission is allowed from `needs_changes` with registration identity preserved. Admin review API controls status and trusted vehicle creation.

### `settings/{vehicleType}`

Publicly readable pricing configuration; admin-only client write. Booking estimates and server payable calculation read these records.

### `corporate_requests/{id}`

Public form creates a lead; admins read/update/delete. This is not a corporate account system.

### Planned corporate portal architecture — not implemented

Completed Unit 002 approves an authenticated, company-paid postpaid portal while preserving the current lead flow until bounded implementation units replace or extend it safely. Unit 002A is the active planning specification for application and trusted approval; none of the planned portal records or routes are implemented yet.

#### Tenancy and trusted roles

- Company access begins with `corporateApplications`, reviewed through a trusted admin API; applicants cannot approve themselves.
- Approval creates a trusted `corporateAccounts/{companyId}` tenant.
- MVP membership roles are `corporate_admin` and `corporate_employee`, stored in server-managed company memberships rather than accepted from client claims.
- One employee UID belongs to one approved company in the MVP. `corporateInvitations` provides expiring, single-use association; arbitrary client-supplied company IDs grant nothing.
- Company and employee suspension block corporate booking. Company-scoped APIs and rules prevent cross-tenant reads.
- Corporate applications require company PAN, applicable GST certificate, incorporation/registration proof, address proof, authorized-representative identity/designation/contact, and operationally necessary bank/billing evidence. Documents require private application-scoped Storage, validated type/size, quarantine/malware scanning, versioned metadata, and owner/admin access only.

#### Booking and dispatch reuse

- Corporate rides remain in existing `bookings/{clientRequestId}` and use the current route, pricing foundation, driver dispatch, ride lifecycle, and reader aliases.
- Planned protected additions include company/account, employee or guest, department/cost center, business purpose, booking actor/passenger, policy approval, corporate pricing, credit reservation, billing cycle, reference, and invoice linkage.
- Existing `customerId`/`userId`, route, service, vehicle, status, schedule, driver, and lifecycle aliases remain until a bounded compatibility design is implemented and tested.
- Corporate booking supports local, airport, and outstation plus immediate/scheduled modes. Intercity and custom tours are outside the initial corporate MVP.
- A trusted corporate booking API resolves membership, policy, company status, pricing, and credit. Corporate rides bypass normal customer cash/Razorpay checkout.
- Corporate-admin guest bookings require a guest phone number and successful phone OTP before confirmation. Guests receive no company/financial access; records retain company, booking admin, guest, and business-purpose linkage.

#### Policy, pricing, and credit

- Within-limit employee bookings proceed under policy; over-limit bookings wait for a company-scoped corporate-admin approval.
- Default employee limits are `500000` paise per ride and `2500000` paise monthly. Corporate admins may lower them; increases beyond the company policy ceiling require trusted Velora approval or policy.
- Admin-configured company percentage discounts are applied server-side before GST and snapshotted on the booking. Same-state supply uses CGST/SGST and inter-state supply uses IGST under configurable, tax-professional-reviewed place-of-supply logic. Notification coupons are unrelated.
- Credit values use integer paise. The planned account model includes limit, used, reserved, available, terms, billing cycle, block status, and reason.
- Default company credit is `10000000` paise; only an audited trusted Velora action may change it.
- A transaction reserves the estimated amount when the booking is approved/confirmed. Ride completion atomically releases that reservation and records the final authoritative charge so the two are never double-counted.
- Cancellation/failed booking releases reservations; an applicable authoritative cancellation fee becomes the only consumed amount.
- `corporateCreditLedger` is planned as append-only/idempotent evidence for reservations, releases, final/cancellation charges, payments, overrides, and corrections.

#### Billing and audit

- Monthly `corporateInvoices` begin as drafts and require trusted Velora review before issue. Statuses are draft, issued, partially paid, paid, overdue, cancelled.
- Default terms are Net 15, configurable per company to Net 7/15/30.
- A seven-calendar-day overdue grace period shows warnings; after grace, new corporate bookings are blocked without interrupting active rides. Audited Velora extensions/overrides are permitted, and repeated overdue behavior may suspend the company.
- Initial settlement is bank transfer. `corporateInvoicePayments` records trusted manual reconciliation and partial payments; online invoice payment is future scope.
- Only Velora admin may issue/cancel final invoices or reconcile payments in the MVP. Corporate admins can view invoices/review draft ride data but cannot alter financial state; finance-admin is future scope.
- Planned `corporateAuditLog` records actor, company, action, target, safe change summary/reason, and server time for approvals, overrides, invoice actions, and reconciliation.
- Corporate invoices, invoice payments, financial audits, and applicable ride reports are retained for at least eight years using archival rather than client deletion without breaking invoice/audit integrity. Implementation remains subject to Indian legal, tax, privacy, and accounting requirements.

Planned collections are `corporateApplications`, `corporateAccounts`, `corporateEmployees`, `corporateInvitations`, `corporateBookingApprovals`, `corporateCreditLedger`, `corporateInvoices`, `corporateInvoicePayments`, and `corporateAuditLog`. They do not exist merely because they are documented; schemas, rules, indexes, APIs, migration/rollback, and tests are finalized per Unit 002A–002J.

### `customTourRequests/{id}`

Authenticated customer creates and reads own request; admin can manage.

### `notifications/{notificationId}` and `notificationCampaigns/{campaignId}`

Server-created deterministic notifications and admin-created campaigns. Recipients/admins read notifications; clients cannot directly mutate them because read actions use server APIs. Campaign client writes are denied.

### Ride/payment support

- `rideOtpSecrets/{bookingId}`: server-only OTP data.
- `rideRatings/{bookingId}`: server-created rating record; admin read.

### Intercity

- `intercityRides`: approved drivers publish through Admin API; public searches read through API.
- `intercitySeatRequests`: authenticated passenger requests and driver responses use server transactions.
- Direct client Firestore access is not granted by current catch-all-deny rules.

### Test-only/legacy references

- `admins/{uid}` is written by the seed script but current authorization uses `users.role`; treat `admins` as non-authoritative.

## Booking and dispatch

Booking creation uses a UUID client request ID as document/idempotency key. Firestore rules accept `local`, `airport`, and `outstation`, immediate (`now`) or scheduled (`schedule`) modes, verified Places/route data, estimate fare, initial unassigned state, and web source aliases.

Immediate booking calls `POST /api/rides/dispatch`. The server queries `drivers` where `status == "online"`, rejects unavailable/unapproved/no-location candidates, sorts by Haversine distance, then transactionally sets:

- Booking: `searching_driver`, `requestedDriverId`, distance and 30-second expiry.
- Driver: `incomingRideId`, pending request fields and expiry.
- Deterministic driver notification.

Eligibility now requires explicit `isApproved: true`, `isActive: true`, `isOnline: true`, `status: "online"`, no incoming/active ride, valid location, and any service/vehicle restrictions declared on the driver record. Development-only diagnostics report IDs, counts, and aggregate exclusion reasons without locations or personal data.

The driver dashboard listens first to `drivers/{uid}`, then to the referenced booking. Unit 001 proved the original production failure occurred before dispatch logic: Firebase Admin 14.1.0 pulled `jwks-rsa` 4/ESM-only `jose`, while Next/Vercel externalized Firebase Admin through a CommonJS loader, causing `ERR_REQUIRE_ESM` at route module load. Pinning Firebase Admin 13.10.0 restored JSON API execution. Preview integration verified linked request fields, client-rule acceptance, rejection/expiry cleanup, cancellation cleanup, negative eligibility, and online recovery. The owner subsequently verified the complete production browser path through request popup/countdown/sound, acceptance, both dashboard transitions, and ride completion.

`POST /api/rides/driver-online` scans legacy `Pending`/`pending` plus canonical `searching_driver` bookings. A malformed legacy booking is isolated and skipped rather than aborting the entire scan.

Scheduled bookings are stored but the dispatch API rejects immediate dispatch for `bookingType == "schedule"`; no trusted scheduler for later dispatch is verified.

## Ride lifecycle

Canonical type statuses are:

`pending → searching_driver → driver_assigned → driver_arriving → driver_arrived → start_otp_pending → in_progress → stop_otp_pending → completed`

`cancelled` is terminal from permitted earlier states. Booking creation currently writes legacy initial casing `Pending`, while normalizers lower-case it. Acceptance, cancellation, OTP, payment, and rating routes enforce selected lifecycle rules. Compatibility casing remains technical debt.

Unit 001 production evidence confirms the operational lifecycle can reach `completed`. It does not prove the separate customer payment, commission, or driver-wallet settlement lifecycle; those remain a pending feature unit.

## Maps

- [`lib/googleMaps.ts`](../lib/googleMaps.ts) is the single browser loader and imports Maps/Places/Marker libraries.
- `LocationAutocomplete` requires selected Places details; `BookingMap` renders route and bounds.
- `LiveRideMap` uses the already loaded Google Maps API for live driver/pickup/drop-off display.
- Browser key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; optional map ID: `NEXT_PUBLIC_GOOGLE_MAP_ID`.
- Server Directions key: `GOOGLE_MAPS_SERVER_API_KEY`, used only for payable-fare verification.
- Invariant: no additional APIProvider/script tag/loader architecture.

## Pricing and payments

`settings/{vehicleType}` feeds the shared `calculateRideFare` utility. Estimate calculation includes base, distance, duration, minimums, GST, platform/night/waiting/driver allowance and conditional charges as configured.

Razorpay order creation verifies owner and eligible ride state, recalculates route and fare server-side, uses integer paise, and stores order/idempotency metadata. Verification checks Razorpay data/signature and prevents inconsistent reuse before marking paid. Cash is an explicit server route. Estimated fare and payable fare are distinct.

The current payment path is not a final settlement system. Unit 003A now locks a version-1 integer-paise `fareSnapshot` during trusted stop-OTP completion. `lib/server/finalFare.ts` uses server Directions plus trusted current `settings/{vehicleType}`, hashes the pricing inputs, and explicitly records unsupported adjustments as zero. Stop OTP no longer marks cash paid/collected: customer rides become `payment_pending` or `cash_pending_confirmation`, and corporate postpaid becomes `not_due` plus company billing. Existing payment routes now fail closed until Unit 003B; no receipt, commission ledger, settlement record, or wallet credit is created.

No Razorpay webhook/reconciliation handler exists; asynchronous capture/failure/refund/dispute reconciliation is incomplete. Legacy `drivers/{uid}` wallet summary fields are display-only, `/driver/wallet` does not exist, and no authoritative wallet/transaction/withdrawal collection exists. Admin “revenue” is a sum of booking fares rather than settled accounting truth.

### Post-ride finance architecture — Unit 003A implemented; settlement planned

Completed Unit 003 defines three independent state machines: ride lifecycle, booking payment, and driver settlement. A ride may be completed while payment remains due. New authoritative money fields use integer paise; the browser estimate and existing rupee aliases remain compatibility data until a reviewed migration.

At successful stop OTP, `POST /api/rides/otp` `verify_end` is the single normal fare-lock authority. It verifies the assigned driver and stop OTP, prepares the authoritative candidate, then transactionally revalidates the booking fingerprint and writes completion, driver release, deterministic notification, and the immutable snapshot. Lock identity is `fare-lock:{bookingDocumentId}:v1`; replay returns the existing lock, while finalized or malformed legacy states fail closed. Customer/driver clients cannot write locked totals. Toll, parking, waiting, surge, discounts, and later corrections require trusted evidence/approval; unsupported components remain zero rather than copying browser input. Historical rides are read-normalized/report-only until a separately approved backfill.

Planned protected collections are:

- `financeSettings/global`: commission basis points, minimum commission, hold, withdrawal/cash thresholds, feature switches, version, and operator audit.
- `driverWallets/{driverUid}`: pending/available/reserved balances, cash commission due, lifetime aggregates, and status.
- `walletTransactions/{transactionId}`: immutable ride earning, commission, cash due/offset/payment, withdrawal, refund, incentive, penalty, and adjustment entries.
- `rideFinancialSettlements/{bookingId}`: one exactly-once fare/commission/net/payment/settlement snapshot per ride.
- `paymentReceipts/{bookingId}`: customer-owned receipt with locked breakdown and safe provider references.
- `paymentProviderEvents/{eventId}`: server-only webhook/direct-verification idempotency and reconciliation claims.
- `driverWithdrawalRequests/{requestId}`: reserved, reviewed, manually paid/rejected driver withdrawals.

Online settlement converges direct Razorpay verification and signature-verified webhook events on one idempotent service, then atomically updates booking, receipt, settlement, wallet, ledger, and notifications. Cash settlement requires assigned-driver confirmation, records gross cash and commission due, and never credits the cash earning digitally. Cash due is offset through explicit ledger entries. Withdrawals reserve net-withdrawable funds before audited manual bank/UPI payout.

Normal payment APIs must reject the trusted corporate-postpaid marker. Corporate completion will later replace its credit reservation/final charge through the corporate ledger and invoice flow, not Unit 003 checkout.

Approved finance policy:

- Commissionable fare is non-negative pre-tax base, distance, time, waiting, night, and surge after discount. GST, toll, and parking are excluded.
- Percentage commission uses integer basis points and round-half-up to the nearest paise, capped at commissionable fare after applying the minimum.
- Defaults are 1500 basis points (15%), `1000` paise minimum commission, 24-hour hold, `50000` paise minimum withdrawal, `100000` paise maximum cash due, cash enabled, and withdrawals enabled. Only audited server administration changes them; settled rides keep their snapshot.
- Incentives use a separate Velora expense pool and ledger entry. Tips and split payments are outside MVP.
- Online earnings enter pending and automatically release after 24 hours when no payment/refund/dispute/fraud/support/admin hold exists; trusted scheduled infrastructure is required.
- Cash due below threshold permits cash rides; at/above threshold only new cash rides are blocked. Active rides continue and online rides remain eligible.
- Manual withdrawals support verified bank and UPI methods with masked details and audited payout references.
- Refund shortfalls may create explicit recoverable driver dues; available balance never silently becomes negative.

Unit 003A is implemented locally but remains active pending emulator and staging/browser evidence. `fareSnapshot` is the versioned paise authority; compatibility rupee projections remain read-only aliases. New customer bookings start `billingMode: customer_pay`, unlocked, `not_due`, and `not_settled`. The customer dashboard keeps completed unpaid/ambiguous rides visible and renders the locked breakdown plus a disabled, truthful payment boundary. `corporate_postpaid` renders company billing and never customer checkout. Existing new-schema payment APIs remain fail-closed until Unit 003B implements complete online settlement. Unit 003A creates no commission, wallet, cash-due, withdrawal, refund, webhook, receipt, or release-scheduler records.

Qualified Indian tax/accounting review, Razorpay webhook secret/dashboard configuration, and trusted scheduler deployment/testing remain production implementation gates, not unresolved business decisions.

## Onboarding and notifications

Driver and vehicle applications are client-submitted under restrictive rules. Admin review endpoints verify ID token/role and transactionally update applications/trusted records. Vehicle approval deliberately stays inactive.

The notification bell reads the latest 30 recipient notifications and a bounded unread query. Server helpers use event-key hashes for idempotency. Booking creation, assignment/dispatch, arrival/start/completion/cancellation, payments, and application reviews create notifications in relevant paths. Admin campaigns support audience targeting and chunked writes. Scheduled campaigns/reminders are stored helpers only; no cron scheduler is verified.

Driver alert controls require user-enabled browser audio, offer sound on/off and test controls, and stop sound when alert conditions cease. A visible popup/countdown remains. The owner verified production popup, countdown, and ride-alert playback during Unit 001. The unusual `ride-alert.wav.base64` source format remains an implementation detail to preserve unless a separately tested asset change is approved.

## Environment variables

### Public client

`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

### Optional public

`NEXT_PUBLIC_GOOGLE_MAP_ID`.

### Server-only

`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `GOOGLE_MAPS_SERVER_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

### Local/test-only

`VELORA_SEED_ENV`, `ALLOW_PRODUCTION_TEST_SEED`. A legacy/configured `NEXT_PUBLIC_RAZORPAY_KEY_ID` may exist but current server order response supplies the public key ID; do not add new reliance without review.

## Deployment and testing

- GitHub `origin/main`; last audited commit before Bible work: `13a19bb`.
- Vercel production alias: `https://velora-cabs.vercel.app`; build and anonymous HTTP smoke tests passed on 2026-07-14.
- Firestore rules deployed to Firebase project `velora-cabs` on 2026-07-14. Index deployment was not separately evidenced.
- Emulator ports are configured. Owner evidence on 2026-07-16 confirms OpenJDK 21.0.11, Firestore Emulator v1.21.0, and successful execution of `npm.cmd run test:unit003a` inside `firebase.cmd emulators:exec` with exit code 0. No `@firebase/rules-unit-testing` package or dedicated per-role allow/deny suite exists yet, so this evidence must not be overstated as complete rules authorization coverage.
- Seed script supports dry-run, idempotent test records, guarded production refusal, and cleanup of tagged records. Live seeding is not evidenced.

## Security invariants

- No client role escalation, admin approval, trusted payment amount, or protected lifecycle authority.
- Firebase Admin is server-only; secrets never use `NEXT_PUBLIC_*`, logs, source, or tracked credentials.
- Unknown Firestore collections are denied; applicants cannot approve themselves.
- Driver/vehicle trusted records are server-created; approved vehicles are not auto-dispatch-enabled.
- Redirects/action URLs are safe local paths; browser Maps uses one loader.
- Razorpay signatures are server-verified; test credentials are never committed.

## Known limitations and technical debt

- Unit 001 dispatch delivery is fixed and production-browser verified through ride completion.
- Storage/document uploads absent; `firebase.json` has no Storage rules.
- Razorpay webhook absent.
- Unit 003A fare lock/lifecycle separation is implemented locally but not emulator/staging verified. Actual payment, commission, wallet, cash due, withdrawals, refunds, and release automation remain unimplemented.
- Scheduled dispatch/campaign/reminder automation absent.
- No automated test or Firestore rules test suite.
- Authenticated production, Maps, payments, onboarding, notification, and lifecycle journeys need verification.
- Four driver-dashboard lint warnings remain.
- Initial booking status casing and compatibility aliases require a planned migration, not ad hoc cleanup.
- Admin protection is client-layout based for pages; sensitive mutations remain protected by server/rules, but server-rendered page gating is not implemented.
