import { randomBytes } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

const SEED_TAG = "velora-final-test-seed-v1";
const args = new Set(process.argv.slice(2));
const cleanup = args.has("--cleanup");
const dryRun = args.has("--dry-run");
const required = ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY", "VELORA_SEED_ENV"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing server-only environment variables: ${missing.join(", ")}`);

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim();
const seedEnvironment = process.env.VELORA_SEED_ENV.trim().toLowerCase();
const productionLike = seedEnvironment === "production" || /(^|[-_])(prod|production)([-_]|$)/i.test(projectId);
if (productionLike && process.env.ALLOW_PRODUCTION_TEST_SEED !== "true") {
  throw new Error("Refusing to seed a production-like project. Use a staging project, or explicitly set ALLOW_PRODUCTION_TEST_SEED=true after owner approval.");
}
if (!new Set(["development", "test", "staging", "production"]).has(seedEnvironment)) {
  throw new Error("VELORA_SEED_ENV must be development, test, staging, or production.");
}

const definitions = [
  { key: "customer", email: "velora.test.customer@example.com", verified: true, role: "customer" },
  { key: "verified_customer", email: "velora.test.verified.customer@example.com", verified: true, role: "customer" },
  { key: "unverified_customer", email: "velora.test.unverified.customer@example.com", verified: false, role: "customer" },
  { key: "approved_driver", email: "velora.test.approved.driver@example.com", verified: true, role: "driver" },
  { key: "pending_driver", email: "velora.test.pending.driver@example.com", verified: true, role: "customer", driverStatus: "submitted" },
  { key: "needs_changes_driver", email: "velora.test.changes.driver@example.com", verified: true, role: "customer", driverStatus: "needs_changes" },
  { key: "fleet_applicant", email: "velora.test.fleet.applicant@example.com", verified: true, role: "customer", vehicleStatus: "submitted" },
  { key: "approved_fleet", email: "velora.test.approved.fleet@example.com", verified: true, role: "customer", vehicleStatus: "approved" },
  { key: "admin", email: "velora.test.admin@example.com", verified: true, role: "admin" },
];

if (dryRun) {
  console.log(`DRY RUN ONLY: ${cleanup ? "cleanup" : "seed"} ${definitions.length} TEST ONLY identities in ${projectId} (${seedEnvironment}). No Firebase connection was made.`);
  process.exit(0);
}

const app = getApps()[0] ?? initializeApp({ credential: cert({
  projectId,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL.trim(),
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").trim(),
}), projectId });
const auth = getAuth(app);
const db = getFirestore(app);

async function findUser(email) {
  try { return await auth.getUserByEmail(email); } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

if (cleanup) {
  await db.collection("notificationCampaigns").doc(`TEST-CAMPAIGN-${SEED_TAG}`).delete();
  for (const definition of definitions) {
    const user = await findUser(definition.email);
    if (!user || user.customClaims?.testSeed !== SEED_TAG) continue;
    const batch = db.batch();
    for (const [collection, id] of [["users", user.uid], ["admins", user.uid], ["drivers", user.uid], ["driverApplications", user.uid], ["vehicleOwnerApplications", `${user.uid}-test-vehicle`], ["vehicles", `TEST-${user.uid}`], ["notifications", `TEST-${SEED_TAG}-${user.uid}-primary`], ["notifications", `TEST-${SEED_TAG}-${user.uid}-promotion`]]) {
      batch.delete(db.collection(collection).doc(id));
    }
    await batch.commit();
    await auth.deleteUser(user.uid);
    console.log(`Removed TEST ONLY identity: ${definition.email}`);
  }
  process.exit(0);
}

const output = [];
for (const definition of definitions) {
  const password = `${randomBytes(18).toString("base64url")}!9aA`;
  const existing = await findUser(definition.email);
  const user = existing
    ? await auth.updateUser(existing.uid, { password, emailVerified: definition.verified, disabled: false, displayName: `TEST ONLY ${definition.key}` })
    : await auth.createUser({ email: definition.email, password, emailVerified: definition.verified, displayName: `TEST ONLY ${definition.key}` });
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: definition.role, testSeed: SEED_TAG });
  const now = FieldValue.serverTimestamp();
  await db.collection("users").doc(user.uid).set({ uid: user.uid, email: definition.email, name: `TEST ONLY ${definition.key}`, role: definition.role, isTestAccount: true, testSeed: SEED_TAG, updatedAt: now, createdAt: now }, { merge: true });
  if (definition.key === "admin") await db.collection("admins").doc(user.uid).set({ uid: user.uid, role: "admin", isActive: true, isTestAccount: true, testSeed: SEED_TAG, updatedAt: now }, { merge: true });
  if (definition.key === "approved_driver") await db.collection("drivers").doc(user.uid).set({ uid: user.uid, userId: user.uid, role: "driver", name: "TEST ONLY Approved Driver", email: definition.email, isApproved: true, isActive: true, isOnline: false, status: "offline", isTestAccount: true, testSeed: SEED_TAG, updatedAt: now }, { merge: true });
  if (["customer", "approved_driver"].includes(definition.key)) await db.collection("notifications").doc(`TEST-${SEED_TAG}-${user.uid}-primary`).set({ notificationId: `TEST-${SEED_TAG}-${user.uid}-primary`, recipientUid: user.uid, recipientRole: definition.key === "approved_driver" ? "driver" : "customer", title: definition.key === "approved_driver" ? "TEST ONLY — New ride request" : "TEST ONLY — Booking confirmed", message: definition.key === "approved_driver" ? "A seeded ride request notification for dashboard testing." : "A seeded customer booking notification for dashboard testing.", type: definition.key === "approved_driver" ? "system" : "booking_created", isRead: false, actionUrl: definition.key === "approved_driver" ? "/driver/dashboard" : "/dashboard", imageUrl: "", metadata: { testSeed: SEED_TAG }, createdAt: now, readAt: null, createdBy: "test-seed", source: "test_seed", expiresAt: null, campaignId: "", isTestAccount: true, testSeed: SEED_TAG });
  if (definition.key === "customer") await db.collection("notifications").doc(`TEST-${SEED_TAG}-${user.uid}-promotion`).set({ notificationId: `TEST-${SEED_TAG}-${user.uid}-promotion`, recipientUid: user.uid, recipientRole: "customer", title: "Today Only — 10% Off", message: "Book a ride today and get 10% off on eligible Velora rides. TEST ONLY; coupon is not automatically applied.", type: "promotion", isRead: false, actionUrl: "/book", imageUrl: "", metadata: { couponCode: "VELORA10", discountPercentage: 10, testSeed: SEED_TAG }, createdAt: now, readAt: null, createdBy: "test-seed", source: "test_seed", expiresAt: Timestamp.fromDate(new Date(Date.now() + 86_400_000)), campaignId: `TEST-CAMPAIGN-${SEED_TAG}`, isTestAccount: true, testSeed: SEED_TAG });
  if (definition.driverStatus) await db.collection("driverApplications").doc(user.uid).set({ applicantUid: user.uid, applicationId: user.uid, legalName: `TEST ONLY ${definition.key}`, email: definition.email, phoneNumber: "9999999999", city: "Test City", licenceNumber: `TEST${user.uid.slice(0, 8).toUpperCase()}`, licenceExpiry: Timestamp.fromDate(new Date("2030-12-31T00:00:00Z")), status: definition.driverStatus, reviewNotes: definition.driverStatus === "needs_changes" ? "TEST ONLY: update licence details." : "", changeRequests: definition.driverStatus === "needs_changes" ? ["Update licence details"] : [], isTestAccount: true, testSeed: SEED_TAG, submittedAt: now, updatedAt: now, schemaVersion: 1 }, { merge: true });
  if (definition.vehicleStatus) {
    const applicationId = `${user.uid}-test-vehicle`;
    const registrationNumber = `TS00TEST${user.uid.slice(0, 4).toUpperCase()}`;
    await db.collection("vehicleOwnerApplications").doc(applicationId).set({ applicationId, ownerUid: user.uid, ownerName: `TEST ONLY ${definition.key}`, ownerEmail: definition.email, ownerPhone: "9999999999", registrationNumber, vehicleMake: "TEST ONLY", vehicleModel: "Seed Vehicle", manufacturingYear: 2024, vehicleType: "sedan", seats: 4, status: definition.vehicleStatus, isTestAccount: true, testSeed: SEED_TAG, submittedAt: now, updatedAt: now, schemaVersion: 1 }, { merge: true });
    if (definition.vehicleStatus === "approved") await db.collection("vehicles").doc(`TEST-${user.uid}`).set({ ownerUid: user.uid, applicationId, registrationNumber, vehicleMake: "TEST ONLY", vehicleModel: "Seed Vehicle", vehicleType: "sedan", seats: 4, isApproved: true, isActive: false, isTestAccount: true, testSeed: SEED_TAG, approvedAt: now, updatedAt: now }, { merge: true });
  }
  output.push({ role: definition.key, email: definition.email, password, verified: definition.verified });
}

await db.collection("notificationCampaigns").doc(`TEST-CAMPAIGN-${SEED_TAG}`).set({ campaignId: `TEST-CAMPAIGN-${SEED_TAG}`, title: "Today Only — 10% Off", message: "Book a ride today and get 10% off on eligible Velora rides.", type: "promotion", audience: "customers", selectedRecipientUid: "", actionUrl: "/book", couponCode: "VELORA10", discountPercentage: 10, scheduledAt: null, expiresAt: Timestamp.fromDate(new Date(Date.now() + 86_400_000)), status: "sent", sentCount: 1, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), createdBy: "test-seed", sentAt: FieldValue.serverTimestamp(), active: true, isTestAccount: true, testSeed: SEED_TAG }, { merge: true });

console.log("TEST ONLY credentials (printed once; store securely, then clear terminal history):");
for (const item of output) console.log(`${item.role}: ${item.email} | ${item.password} | verified=${item.verified}`);
