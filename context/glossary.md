# Velora Glossary

Last verified: 2026-07-15

- **Booking:** Customer-created `bookings` document containing route, estimate, schedule, rider, vehicle choice, payment, dispatch, and lifecycle fields.
- **Ride:** Operational execution of a booking after/while dispatch and driver lifecycle state advance.
- **Immediate ride:** `bookingMode`/legacy `bookingType` representing `now`; dispatch is requested after creation.
- **Scheduled ride:** Booking with normalized `scheduledAt`; later automatic dispatch is not currently scheduled by trusted infrastructure.
- **Dispatch:** Server process that selects an eligible online driver and writes linked request fields to booking and driver records.
- **Requested driver:** Driver temporarily offered a ride through `requestedDriverId`/`incomingRideId`; not yet assigned.
- **Assigned driver:** Driver who accepted and is stored in `driverId`, with booking status `driver_assigned` or later.
- **Approved driver:** User approved by admin with trusted `users.role == "driver"` and `drivers/{uid}` approval/active state.
- **Fleet partner:** Customer-level account intent used to submit vehicle-owner applications; not automatically a dispatch role.
- **Vehicle owner application:** `vehicleOwnerApplications` record reviewed by admin before a trusted vehicle record exists.
- **Corporate request:** Lead document in `corporate_requests`; it is not a corporate account or contract.
- **Estimate:** Browser-visible fare calculation stored as estimated fare; not an authorization to charge.
- **Payable fare:** Server-recalculated amount based on trusted settings and server Directions data, represented in rupees and converted to integer paise for Razorpay.
- **Booking status / ride status:** Lifecycle state, canonically lowercase: `pending`, `searching_driver`, `driver_assigned`, `driver_arriving`, `driver_arrived`, `start_otp_pending`, `in_progress`, `stop_otp_pending`, `completed`, `cancelled`. Legacy initial `Pending` exists.
- **Payment status:** `pending`, `authorized`, `paid`, `failed`, `refunded`, or `partially_refunded` in typed code; live transitions need end-to-end verification.
- **Notification campaign:** Admin-authored `notificationCampaigns` record broadcast by a trusted server API to a defined audience.
- **Trusted record:** Server/admin-controlled document or protected fields that clients cannot create/approve arbitrarily, such as approved drivers and vehicles.
- **Server-only operation:** Code using Firebase Admin or secrets in Node route handlers and never bundled into the browser.
- **Staging:** Non-production Firebase/Vercel/Razorpay environment for realistic role and integration testing.
- **Production:** Live Firebase/Vercel/service configuration serving client users; a deployed route alone does not prove production readiness.
- **Test seed:** Tagged, guarded test users/documents created by `scripts/seed-test-accounts.mjs`, with dry-run and scoped cleanup.
- **Client request ID:** UUID used as booking document and idempotency identity.
- **Application status:** `draft`, `submitted`, `under_review`, `needs_changes`, `approved`, or `rejected`.
- **Vehicle activation:** Operational step beyond approval; approved vehicles currently remain `isActive: false` and `dispatchEnabled: false`.
- **Start/stop OTP:** Server-held secrets used to authorize ride start and completion; secrets are not readable through client rules.
