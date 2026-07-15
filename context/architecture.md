# Velora Architecture

Last verified: 2026-07-15

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

The driver dashboard listens first to `drivers/{uid}`, then to the referenced booking. Unit 001 proved the original production failure occurred before dispatch logic: Firebase Admin 14.1.0 pulled `jwks-rsa` 4/ESM-only `jose`, while Next/Vercel externalized Firebase Admin through a CommonJS loader, causing `ERR_REQUIRE_ESM` at route module load. Pinning Firebase Admin 13.10.0 restored JSON API execution. A preview integration test verified linked request fields, client-rule acceptance, rejection/expiry cleanup, cancellation cleanup, negative eligibility, and recovery when a driver comes online.

`POST /api/rides/driver-online` scans legacy `Pending`/`pending` plus canonical `searching_driver` bookings. A malformed legacy booking is isolated and skipped rather than aborting the entire scan.

Scheduled bookings are stored but the dispatch API rejects immediate dispatch for `bookingType == "schedule"`; no trusted scheduler for later dispatch is verified.

## Ride lifecycle

Canonical type statuses are:

`pending → searching_driver → driver_assigned → driver_arriving → driver_arrived → start_otp_pending → in_progress → stop_otp_pending → completed`

`cancelled` is terminal from permitted earlier states. Booking creation currently writes legacy initial casing `Pending`, while normalizers lower-case it. Acceptance, cancellation, OTP, payment, and rating routes enforce selected lifecycle rules. Compatibility casing remains technical debt.

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

No Razorpay webhook/reconciliation handler exists; asynchronous settlement/refund/dispute reconciliation is incomplete.

## Onboarding and notifications

Driver and vehicle applications are client-submitted under restrictive rules. Admin review endpoints verify ID token/role and transactionally update applications/trusted records. Vehicle approval deliberately stays inactive.

The notification bell reads the latest 30 recipient notifications and a bounded unread query. Server helpers use event-key hashes for idempotency. Booking creation, assignment/dispatch, arrival/start/completion/cancellation, payments, and application reviews create notifications in relevant paths. Admin campaigns support audience targeting and chunked writes. Scheduled campaigns/reminders are stored helpers only; no cron scheduler is verified.

Driver alert controls require user-enabled browser audio, offer sound on/off and test controls, and stop sound when alert conditions cease. A visible popup/countdown remains. Runtime audio behavior needs browser verification; the public asset is stored as `ride-alert.wav.base64`, not a conventional `.wav` file, and should be validated before claiming production audio playback.

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
- Emulator ports are configured, but no rules-test package/suite is present and no emulator test result is recorded.
- Seed script supports dry-run, idempotent test records, guarded production refusal, and cleanup of tagged records. Live seeding is not evidenced.

## Security invariants

- No client role escalation, admin approval, trusted payment amount, or protected lifecycle authority.
- Firebase Admin is server-only; secrets never use `NEXT_PUBLIC_*`, logs, source, or tracked credentials.
- Unknown Firestore collections are denied; applicants cannot approve themselves.
- Driver/vehicle trusted records are server-created; approved vehicles are not auto-dispatch-enabled.
- Redirects/action URLs are safe local paths; browser Maps uses one loader.
- Razorpay signatures are server-verified; test credentials are never committed.

## Known limitations and technical debt

- Dispatch delivery bug is confirmed by runtime report but not traced.
- Storage/document uploads absent; `firebase.json` has no Storage rules.
- Razorpay webhook absent.
- Scheduled dispatch/campaign/reminder automation absent.
- No automated test or Firestore rules test suite.
- Authenticated production, Maps, payments, onboarding, notification, and lifecycle journeys need verification.
- Four driver-dashboard lint warnings remain.
- Initial booking status casing and compatibility aliases require a planned migration, not ad hoc cleanup.
- Admin protection is client-layout based for pages; sensitive mutations remain protected by server/rules, but server-rendered page gating is not implemented.
