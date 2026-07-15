# Velora Project Overview

Last verified: 2026-07-15

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

Implemented in code: authentication pages, protected dashboard/profile, booking form/map, immediate dispatch call, scheduled data, lifecycle UI/APIs, payment routes, rating, and history. Production HTTP routes were smoke-tested; authenticated end-to-end behavior needs verification. The reported dispatch-delivery failure is active.

### Driver

Authenticate → submit application → admin review/approval → trusted `drivers/{uid}` creation → driver login → online/offline state and location → incoming request popup/countdown/sound → accept/reject → arrival → start OTP → ride → stop OTP/completion.

Implemented in code. Approval is server-controlled. Full production journey needs verification; a booking has reportedly appeared in admin without reaching the driver.

### Fleet/car owner

Authenticate → submit vehicle-owner application → admin review → approved trusted vehicle created inactive with dispatch disabled → operational activation outside the current flow.

Implemented in code but not fully runtime-tested. There is no fleet operations dashboard. Document uploads are absent because Storage is not wired.

### Admin

Authenticate against trusted `users.role == "admin"` → use dashboard → view bookings/customers/drivers → review driver and vehicle applications through server APIs → edit Firestore pricing → manage notification campaigns → view corporate leads, analytics, and settings.

Code exists for these routes. Production role-protected workflows need manual verification. Analytics/settings depth must not be assumed from route existence.

### Corporate

The current corporate module is **lead-generation only**: a public form creates `corporate_requests`, and an admin page reads/manages those records. There is no company account portal, employee roster, policy engine, contract pricing, monthly billing, GST invoice workflow, or corporate reporting SaaS.

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

- Confirmed booking-to-driver delivery problem requires trace and fix.
- Firebase Storage/document uploads are not configured.
- Razorpay webhook/reconciliation is not implemented.
- Scheduled notification/ride reminder delivery has no trusted cron scheduler.
- Corporate full workflow is not defined or implemented.
- Emulator/rules tests are not present as an automated test suite.
- Authenticated production browser journeys need manual testing.

### Future/proposed scope

- Full corporate account and billing product, pending owner decisions.
- Secure onboarding document uploads after Storage design/rules.
- Payment webhooks and reconciliation.
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
