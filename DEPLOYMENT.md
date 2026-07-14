# Velora Cabs deployment checklist

Use separate Firebase and Razorpay projects/accounts for staging and production. Never copy server secrets into `NEXT_PUBLIC_*` variables.

## Client environment variables

`NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, and optionally `NEXT_PUBLIC_GOOGLE_MAP_ID`.

## Server-only environment variables

`FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `GOOGLE_MAPS_SERVER_API_KEY`. Preserve private-key newlines as escaped `\\n` when required by the hosting dashboard. The server Maps key must have Directions API enabled and must use server-appropriate restrictions; never expose it to the browser.

## Test seeding only

Set `VELORA_SEED_ENV` to `development`, `test`, or `staging`. `ALLOW_PRODUCTION_TEST_SEED=true` is deliberately required for production-like projects and must only be set after explicit owner approval.

## Firebase and Google Cloud

Enable the required Authentication providers, add production and preview domains to Firebase Authorized domains, deploy Firestore rules with `firebase deploy --only firestore:rules`, and create required composite indexes from Firebase error links. Restrict the browser Maps key by HTTP referrer and API; enable Maps JavaScript API and Places API. Restrict the server Maps key separately and enable Directions API.

Firebase Storage is not currently wired into the application or `firebase.json`. Enable a bucket and add reviewed `storage.rules` before adding document-upload controls.

## Vercel

Use the Next.js preset, `npm install`, and `npm run build`. Configure secrets independently for Preview and Production. Confirm preview domains are authorized only where preview authentication is intended.

## Razorpay

Use test keys outside production and live keys only in Production scope. The order route now recalculates payable fare from server-side pricing plus a server-side Directions lookup. Configure webhook reconciliation before treating asynchronous payment reconciliation as complete.
