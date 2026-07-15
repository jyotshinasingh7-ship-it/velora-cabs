# Unit 001 — Dispatch Driver Delivery Bug

- Status: implemented and preview-integrated; browser UI verification pending
- Owner: Velora project owner
- Created: 2026-07-15
- Last updated: 2026-07-15
- Related decision IDs: VEL-ADR-003, VEL-ADR-005
- Related Bible sections: `context/architecture.md` (Booking and dispatch), `context/progress-tracker.md` (Confirmed bugs)

## Owner goal

Ensure an immediate customer booking reliably reaches one eligible approved online driver and appears in the existing driver popup/countdown/sound UI.

## Business context

Dispatch is the bridge between a successful customer booking and ride fulfillment. A silent delivery failure leaves the customer waiting and the driver unaware while admin still sees the booking.

## Current repository truth

Confirmed runtime report:

- Booking was created.
- Booking appeared in the admin portal.
- The ride request did not reach the driver.

Implemented path:

- `components/BookingForm.tsx` writes `bookings/{clientRequestId}` and calls `POST /api/rides/dispatch` for immediate rides.
- `app/api/rides/dispatch/route.ts` verifies ownership and invokes `lib/server/dispatchRide.ts`.
- Dispatch queries `drivers` with `status == "online"`, requires coordinates/availability, and transactionally links `requestedDriverId` with `incomingRideId` and a 30-second expiry.
- `app/driver/dashboard/page.tsx` listens to `drivers/{uid}`, then to `bookings/{incomingRideId}`.

The root cause is now proven: Firebase Admin 14.1.0 failed at Vercel route module load with `ERR_REQUIRE_ESM` through `jwks-rsa`/ESM-only `jose`. The request returned a cached HTML 500 before `requireUser` or dispatch logic ran.

The trace also proved `/api/rides/driver-online` aborted its complete pending scan when an older legacy booking lacked pickup coordinates.

## Problem statement

Trace and fix the first point where the booking-to-driver delivery contract breaks, without redesigning the UI or weakening authorization/rules.

## Scope

- Capture booking write result and dispatch API request/response.
- Inspect actual production/staging booking and driver field shapes without exposing personal data.
- Verify driver trusted/active/approved/online state, location fields, and availability.
- Verify eligibility filtering, distance sorting, transaction writes, request expiry, and deterministic notification.
- Verify `requestedDriverId`, `incomingRideId`, `rideRequestStatus`, and expiry appear on the intended records.
- Verify driver listeners, auth/role gates, popup/countdown/sound conditions, Firestore index/rules behavior, and rejection/expiry redispatch.
- Fix only the confirmed root cause and add focused regression coverage/diagnostics.

## Out of scope

- UI redesign, broad lifecycle rewrite, new dispatch algorithm, scheduled dispatch, push/WhatsApp, pricing/payment changes, or unrelated warning cleanup.

## User roles

Customer, approved active driver, admin observer.

## User journey

Customer books immediate ride → API selects eligible driver → linked Firestore fields update → driver listener receives booking → visible request/countdown appears and optional enabled sound plays → driver accepts or rejects/expires.

## UX behavior

Preserve existing UI. Sound is never the only alert. Customer messaging must distinguish no eligible driver from API failure rather than claiming an unseen background retry.

## Data model

Trace `bookings`, `drivers`, and `notifications`, especially:

- Booking: `customerId`, `userId`, pickup coordinates, `rideStatus`, `status`, `requestedDriverId`, `driverRequestExpiresAt`, `rejectedDrivers`, `noDriverAvailable`.
- Driver: `isApproved`, `isActive`, `isOnline`, `status`, coordinate aliases, `incomingRideId`, `activeRideId`, request status/expiry.

## API changes

None pre-approved. Any change must retain token/ownership verification and return safe diagnostic states.

## Firestore rules

Audit booking requested-driver read permissions and driver operational update fields. Do not weaken rules. Admin SDK transaction writes bypass rules intentionally.

## Security constraints

- Customer cannot choose/assign a driver.
- Driver cannot read unrelated bookings.
- Only approved active driver records are eligible.
- Logs/evidence must exclude tokens, exact private locations, and personal details.

## Compatibility requirements

Preserve current booking/driver aliases and lifecycle fields until a migration is approved.

## Files to create

Only focused tests/diagnostics determined during PLAN.

## Files to modify

Expected audit targets: `components/BookingForm.tsx`, `app/api/rides/dispatch/route.ts`, `lib/server/dispatchRide.ts`, `app/driver/dashboard/page.tsx`, `app/api/rides/reject/route.ts`, `firestore.rules`, `firestore.indexes.json`. Modify only confirmed root-cause files.

## External setup

Staging Firebase access, one customer and one approved driver test account, and permission to inspect redacted staging records. Never provide credentials in chat.

## Implementation plan

1. Reproduce with one controlled driver and record safe field-state checkpoints.
2. Trace booking submission and dispatch response.
3. Trace eligibility exclusion reasons and transaction result.
4. Trace driver document and booking listeners through expiry.
5. Fix root cause, add regression test/diagnostic, and remove temporary sensitive diagnostics.

## Validation commands

```text
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

## Automated tests

Add focused tests for eligibility, linked transaction fields, ownership/rules where practical. Current repository has no test harness; test strategy is part of PLAN.

## Manual test checklist

- One eligible driver receives request.
- Unrelated/offline/unapproved/busy drivers do not.
- Popup and countdown render; optional sound does not overlap.
- Accept links driver/booking and stops alert.
- Reject/expiry clears fields and advances safely.
- Cancellation stops the driver alert.
- No-driver result is shown accurately.

## Failure/edge cases

Missing location, stale online state, casing mismatch, active/incoming ride, expired request, concurrent dispatch, driver logout/offline, listener permission error, API timeout, and no candidates.

## Completion criteria

- Root cause proven with evidence.
- Focused fix implemented without weakened security.
- Controlled end-to-end staging test passes for delivery, accept, reject/expiry, and cancellation.
- Required validation passes; regressions and remaining limitations documented.

## Rollback plan

Revert only Unit 001 changes and redeploy prior rules/API build; retain redacted failure evidence and Bible history.

## Documentation/Bible updates

Update architecture, progress/session log, decisions if needed, and this spec. Move to completed only after criteria pass.

## Final result

Implemented on 2026-07-15:

- Pinned Firebase Admin to 13.10.0, restoring protected Next/Vercel API route execution.
- Required drivers to be explicitly approved, active, online in both status fields, free of incoming/active rides, and location-ready.
- Honored declared service/vehicle restrictions when present without inventing mandatory fields for legacy drivers.
- Added development-only aggregate dispatch diagnostics containing IDs, counts, and exclusion reasons only.
- Added `driver_requested`/`still_searching` response state and truthful customer messaging when dispatch cannot start.
- Expanded online recovery to legacy `Pending`/`pending` and canonical `searching_driver` records.
- Isolated malformed legacy pending records so later valid rides are still evaluated.
- Did not change Firestore rules or indexes.

Executed integration evidence on Vercel preview using existing TEST ONLY customer/driver identities:

- Before fix: production `/api/rides/dispatch` returned HTML 500; booking stayed `Pending`; driver stayed unlinked.
- After fix: dispatch returned 200 and linked booking `requestedDriverId` to driver `incomingRideId` with matching expiries.
- Driver acceptance executed through the Firebase client SDK and existing Firestore rules, producing `driver_assigned`/`busy` linked active state.
- Timed-out rejection returned 200, cleared request fields, recorded rejection, and left `noDriverAvailable: true` when no alternate driver existed.
- Customer cancellation returned 200 and cleared driver linkage.
- Driver-online recovery skipped two malformed legacy pending documents and delivered the valid TEST ONLY booking.
- Inactive, unapproved, and offline scenarios each returned `still_searching` with no driver linkage.

Validation results:

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with the four pre-existing driver-dashboard warnings; no new warning was introduced.
- `npm run build`: passed and generated 43 static pages.
- `git diff --check`: passed.
- Vercel preview build: passed at `https://velora-cabs-oaeuhyl20-jyotshinasingh7-ship-its-projects.vercel.app`.
- `npm audit --omit=dev`: 10 moderate, 0 high, 0 critical; the moderate findings include transitive Firebase Admin 13 dependencies and the existing Next/PostCSS advisory path.

The spec remains active because the authenticated browser popup, countdown, and sound were not directly witnessed. No claim of full browser end-to-end completion is made.
