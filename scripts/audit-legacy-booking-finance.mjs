import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const required = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "VELORA_FINANCE_AUDIT_ENV",
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Missing server-only environment variables: ${missing.join(", ")}`);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim();
const auditEnvironment = process.env.VELORA_FINANCE_AUDIT_ENV.trim().toLowerCase();
const productionLike = auditEnvironment === "production" || /(^|[-_])(prod|production)([-_]|$)/i.test(projectId);
if (productionLike && process.env.ALLOW_PRODUCTION_FINANCE_AUDIT !== "true") {
  throw new Error("Refusing to audit a production-like project without explicit owner approval.");
}
if (!new Set(["development", "test", "staging", "production"]).has(auditEnvironment)) {
  throw new Error("VELORA_FINANCE_AUDIT_ENV must be development, test, staging, or production.");
}

const limitArgument = process.argv.find((argument) => argument.startsWith("--limit="));
const limit = Number(limitArgument?.split("=")[1] ?? 500);
if (!Number.isSafeInteger(limit) || limit < 1 || limit > 5000) {
  throw new Error("--limit must be an integer from 1 to 5000.");
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({
    projectId,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL.trim(),
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").trim(),
  }),
  projectId,
});
const db = getFirestore(app);
const snapshot = await db.collection("bookings").limit(limit).get();

const counts = {
  canonicalLocked: 0,
  completedPaidLegacy: 0,
  completedCashAutoPaidLegacy: 0,
  completedUnpaidOrAmbiguous: 0,
  completedMissingFare: 0,
  inconsistentRidePaymentState: 0,
  preCompletionLegacy: 0,
};
const examples = Object.fromEntries(Object.keys(counts).map((key) => [key, []]));
function record(category, id) {
  counts[category] += 1;
  if (examples[category].length < 10) examples[category].push(id);
}

for (const document of snapshot.docs) {
  const booking = document.data();
  const rideStatus = String(booking.rideStatus ?? booking.status ?? "").toLowerCase();
  const paymentStatus = String(booking.paymentStatus ?? "").toLowerCase();
  const paymentMethod = String(booking.paymentMethod ?? "").toLowerCase();
  const completed = rideStatus === "completed";
  const hasFare = Number.isFinite(Number(booking.finalFare ?? booking.payableFare ?? booking.estimatedFare));

  if (Number(booking.financeSchemaVersion) >= 1 && booking.fareLocked === true && booking.fareSnapshot) {
    record("canonicalLocked", document.id);
  } else if (!completed) {
    record("preCompletionLegacy", document.id);
  } else if (!hasFare) {
    record("completedMissingFare", document.id);
  } else if (paymentStatus === "paid" && paymentMethod === "cash") {
    record("completedCashAutoPaidLegacy", document.id);
  } else if (paymentStatus === "paid") {
    record("completedPaidLegacy", document.id);
  } else {
    record("completedUnpaidOrAmbiguous", document.id);
  }

  if (!completed && ["paid", "cash_collected"].includes(paymentStatus)) {
    record("inconsistentRidePaymentState", document.id);
  }
}

console.log(JSON.stringify({
  mode: "DRY_RUN_READ_ONLY",
  projectId,
  environment: auditEnvironment,
  scanned: snapshot.size,
  limit,
  counts,
  exampleBookingDocumentIds: examples,
  writesPerformed: 0,
}, null, 2));
