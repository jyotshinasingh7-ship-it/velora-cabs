import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

const EXPECTED_PROJECT_ID = "velora-cabs-staging";
const SEED_TAG = "velora-unit-003a-staging-v1";
const VEHICLE_ID = "unit003a-test-sedan";
const CREDENTIAL_PATH = resolve(".test-credentials", "unit-003a-staging.json");
const args = new Set(process.argv.slice(2));
const cleanup = args.has("--cleanup");
const dryRun = args.has("--dry-run");
const diagnoseEnvironment = args.has("--diagnose-env");
const verifyAccess = args.has("--verify-access");
const removeLocalCredentials = args.has("--remove-local-credentials");

if (removeLocalCredentials) {
  rmSync(CREDENTIAL_PATH, { force: true });
  console.log("Removed the local Unit 003A staging credential artifact.");
  process.exit(0);
}

const required = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
];
const missing = required.filter((name) => !process.env[name]?.trim());
if (diagnoseEnvironment) {
  console.error(
    JSON.stringify({
      projectIsExpectedStaging:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() === EXPECTED_PROJECT_ID,
      productionProjectActive:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() === "velora-cabs",
      adminClientEmailPresent: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()),
      adminClientEmailMatchesExpectedProject:
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL
          ?.trim()
          .toLowerCase()
          .endsWith(`@${EXPECTED_PROJECT_ID}.iam.gserviceaccount.com`) === true,
      adminPrivateKeyPresent: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim()),
      explicitStagingMarker: process.env.VELORA_SEED_ENV?.trim().toLowerCase() === "staging",
      vercelPreviewMarker: process.env.VERCEL_ENV?.trim().toLowerCase() === "preview",
    })
  );
  process.exit(0);
}
if (missing.length > 0) {
  throw new Error(`Missing server-only environment variables: ${missing.join(", ")}`);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim();
const seedEnvironment = process.env.VELORA_SEED_ENV?.trim().toLowerCase() ?? "";
const hasStagingMarker =
  seedEnvironment === "staging" || process.env.VERCEL_ENV?.trim().toLowerCase() === "preview";
if (projectId !== EXPECTED_PROJECT_ID || !hasStagingMarker) {
  throw new Error(
    `Refusing to access Firebase. This script only permits ${EXPECTED_PROJECT_ID} with VELORA_SEED_ENV=staging.`
  );
}

const definitions = [
  {
    key: "verified_customer",
    email: "velora.test.unit003a.customer@example.com",
    role: "customer",
    verified: true,
    displayName: "TEST ONLY Unit 003A Customer",
  },
  {
    key: "approved_driver",
    email: "velora.test.unit003a.driver@example.com",
    role: "driver",
    verified: true,
    displayName: "TEST ONLY Unit 003A Driver",
  },
  {
    key: "admin",
    email: "velora.test.unit003a.admin@example.com",
    role: "admin",
    verified: true,
    displayName: "TEST ONLY Unit 003A Admin",
  },
];

if (dryRun) {
  console.log(
    `DRY RUN ONLY: ${cleanup ? "cleanup" : "seed"} ${definitions.length} Unit 003A TEST ONLY identities in ${projectId}. No Firebase connection or file write occurred.`
  );
  process.exit(0);
}

function loadCredentialFile() {
  if (!existsSync(CREDENTIAL_PATH)) return null;
  const parsed = JSON.parse(readFileSync(CREDENTIAL_PATH, "utf8"));
  if (parsed.projectId !== EXPECTED_PROJECT_ID || parsed.seedTag !== SEED_TAG) {
    throw new Error("The existing Unit 003A credential file belongs to a different seed or project.");
  }
  return parsed;
}

function passwordFor(key, existingCredentials) {
  const storedPassword = existingCredentials?.accounts?.[key]?.password;
  if (typeof storedPassword === "string" && storedPassword.length >= 20) {
    return storedPassword;
  }
  return `${randomBytes(24).toString("base64url")}!9aA`;
}

function writeCredentialFile(accounts) {
  mkdirSync(dirname(CREDENTIAL_PATH), { recursive: true });
  writeFileSync(
    CREDENTIAL_PATH,
    `${JSON.stringify(
      {
        warning: "TEST ONLY - STAGING CREDENTIALS - DO NOT COMMIT OR SHARE",
        projectId: EXPECTED_PROJECT_ID,
        seedTag: SEED_TAG,
        generatedAt: new Date().toISOString(),
        accounts,
      },
      null,
      2
    )}\n`,
    { encoding: "utf8", mode: 0o600 }
  );
  try {
    chmodSync(CREDENTIAL_PATH, 0o600);
  } catch {
    // Windows ACLs remain authoritative when POSIX modes are unavailable.
  }
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL.trim(),
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n").trim(),
    }),
    projectId,
  });
const auth = getAuth(app);
const db = getFirestore(app);

async function findUser(email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error?.code === "auth/user-not-found") return null;
    throw error;
  }
}

async function verifyStagingAccess({ report = false } = {}) {
  try {
    await auth.listUsers(1);
    if (report) console.error("FIREBASE_AUTH_ACCESS=PASS");
  } catch (error) {
    if (report) console.error("FIREBASE_AUTH_ACCESS=FAIL");
    const code = typeof error?.code === "string" ? error.code : "unknown";
    throw new Error(`Staging Firebase Auth access failed (${code}).`);
  }

  try {
    await db.collection("users").limit(1).get();
    if (report) console.error("FIRESTORE_ACCESS=PASS");
  } catch (error) {
    if (report) console.error("FIRESTORE_ACCESS=FAIL");
    const code = typeof error?.code === "string" || typeof error?.code === "number"
      ? String(error.code)
      : "unknown";
    throw new Error(`Staging Firestore access failed (${code}).`);
  }
}

if (verifyAccess) {
  await verifyStagingAccess({ report: true });
  process.exit(0);
}

async function deleteSeededDocument(collection, id) {
  const reference = db.collection(collection).doc(id);
  const snapshot = await reference.get();
  if (snapshot.exists && snapshot.data()?.testSeed === SEED_TAG) {
    await reference.delete();
  }
}

if (cleanup) {
  for (const definition of definitions) {
    const user = await findUser(definition.email);
    if (!user || user.customClaims?.testSeed !== SEED_TAG) continue;

    await Promise.all([
      deleteSeededDocument("users", user.uid),
      deleteSeededDocument("admins", user.uid),
      deleteSeededDocument("drivers", user.uid),
      deleteSeededDocument("driverApplications", user.uid),
      deleteSeededDocument("vehicles", `${SEED_TAG}-${user.uid}`),
    ]);
    await auth.deleteUser(user.uid);
  }
  await deleteSeededDocument("settings", VEHICLE_ID);
  rmSync(CREDENTIAL_PATH, { force: true });
  console.log(`Removed Unit 003A TEST ONLY staging fixtures from ${projectId}.`);
  process.exit(0);
}

// Prove both staging Auth and Firestore access before generating or persisting passwords.
await verifyStagingAccess();

const existingCredentials = loadCredentialFile();
const credentialAccounts = Object.fromEntries(
  definitions.map((definition) => [
    definition.key,
    {
      email: definition.email,
      password: passwordFor(definition.key, existingCredentials),
      emailVerified: definition.verified,
      loginRoute:
        definition.role === "driver"
          ? "/driver/login"
          : definition.role === "admin"
            ? "/admin/login"
            : "/login",
    },
  ])
);

// Persist intended credentials before remote mutation so an interrupted seed can be rerun safely.
writeCredentialFile(credentialAccounts);

const seededUsers = new Map();
for (const definition of definitions) {
  const existing = await findUser(definition.email);
  if (existing && existing.customClaims?.testSeed !== SEED_TAG) {
    throw new Error(`Refusing to take over an existing non-seed account: ${definition.email}`);
  }

  const password = credentialAccounts[definition.key].password;
  const user = existing
    ? await auth.updateUser(existing.uid, {
        password,
        emailVerified: definition.verified,
        disabled: false,
        displayName: definition.displayName,
      })
    : await auth.createUser({
        email: definition.email,
        password,
        emailVerified: definition.verified,
        disabled: false,
        displayName: definition.displayName,
      });

  await auth.setCustomUserClaims(user.uid, {
    role: definition.role,
    testSeed: SEED_TAG,
  });
  seededUsers.set(definition.key, user);

  const now = FieldValue.serverTimestamp();
  await db.collection("users").doc(user.uid).set(
    {
      uid: user.uid,
      email: definition.email,
      name: definition.displayName,
      role: definition.role,
      accountType: definition.role,
      isActive: true,
      emailVerified: definition.verified,
      isTestAccount: true,
      testSeed: SEED_TAG,
      updatedAt: now,
      createdAt: now,
    },
    { merge: true }
  );
}

const driver = seededUsers.get("approved_driver");
const admin = seededUsers.get("admin");
if (!driver || !admin) throw new Error("Required Unit 003A seed identities were not created.");

const now = FieldValue.serverTimestamp();
const vehicleDocumentId = `${SEED_TAG}-${driver.uid}`;
const licenceExpiry = Timestamp.fromDate(new Date("2035-12-31T00:00:00.000Z"));

await db.collection("admins").doc(admin.uid).set(
  {
    uid: admin.uid,
    role: "admin",
    isActive: true,
    isTestAccount: true,
    testSeed: SEED_TAG,
    updatedAt: now,
    createdAt: now,
  },
  { merge: true }
);

await db.collection("driverApplications").doc(driver.uid).set(
  {
    applicantUid: driver.uid,
    applicationId: driver.uid,
    accountType: "driver",
    legalName: "TEST ONLY Unit 003A Driver",
    email: definitions.find((item) => item.key === "approved_driver").email,
    phoneNumber: "9999999991",
    address: "TEST ONLY staging address",
    city: "Test City",
    state: "Test State",
    pincode: "400001",
    licenceNumber: "TESTUNIT003A",
    licenceExpiry,
    drivingExperienceYears: 5,
    preferredServiceArea: "Test City",
    emergencyContact: { name: "TEST ONLY Contact", phoneNumber: "9999999992" },
    languages: ["English", "Hindi"],
    availability: "full_time",
    vehicleOwnershipType: "own_vehicle",
    declarationsAccepted: true,
    status: "approved",
    reviewedBy: admin.uid,
    reviewedAt: now,
    reviewNotes: "TEST ONLY staging approval fixture.",
    submittedAt: now,
    updatedAt: now,
    schemaVersion: 1,
    isTestAccount: true,
    testSeed: SEED_TAG,
  },
  { merge: true }
);

await db.collection("drivers").doc(driver.uid).set(
  {
    uid: driver.uid,
    userId: driver.uid,
    role: "driver",
    name: "TEST ONLY Unit 003A Driver",
    email: definitions.find((item) => item.key === "approved_driver").email,
    phoneNumber: "9999999991",
    licenceNumber: "TESTUNIT003A",
    licenceExpiry,
    preferredServiceArea: "Test City",
    isApproved: true,
    isActive: true,
    isOnline: false,
    status: "offline",
    incomingRideId: "",
    activeRideId: "",
    rideRequestStatus: "",
    serviceTypes: ["local", "airport", "outstation"],
    supportedServiceTypes: ["local", "airport", "outstation"],
    vehicleType: VEHICLE_ID,
    vehicleTypes: [VEHICLE_ID],
    supportedVehicleTypes: [VEHICLE_ID],
    vehicleId: vehicleDocumentId,
    rating: 5,
    ratingCount: 0,
    totalRides: 0,
    todayTrips: 0,
    approvedAt: now,
    approvedBy: admin.uid,
    updatedAt: now,
    createdAt: now,
    isTestAccount: true,
    testSeed: SEED_TAG,
  },
  { merge: true }
);

await db.collection("vehicles").doc(vehicleDocumentId).set(
  {
    vehicleId: vehicleDocumentId,
    ownerUid: driver.uid,
    assignedDriverUid: driver.uid,
    registrationNumber: "MH01TEST3A",
    vehicleMake: "TEST ONLY",
    vehicleModel: "Unit 003A Sedan",
    manufacturingYear: 2024,
    vehicleType: VEHICLE_ID,
    serviceCategory: "local",
    seats: 4,
    fuelType: "petrol",
    permitStatus: "valid",
    commercialRegistrationConfirmed: true,
    isApproved: true,
    isActive: true,
    dispatchEnabled: true,
    approvedAt: now,
    approvedBy: admin.uid,
    updatedAt: now,
    createdAt: now,
    isTestAccount: true,
    testSeed: SEED_TAG,
  },
  { merge: true }
);

const pricingReference = db.collection("settings").doc(VEHICLE_ID);
const pricingSnapshot = await pricingReference.get();
if (pricingSnapshot.exists && pricingSnapshot.data()?.testSeed !== SEED_TAG) {
  throw new Error(`Refusing to overwrite non-seed pricing document: settings/${VEHICLE_ID}`);
}
await pricingReference.set(
  {
    name: "TEST ONLY Unit 003A Sedan",
    description: "Staging-only vehicle used for Unit 003A lifecycle verification.",
    seats: 4,
    baseFare: 60,
    perKm: 14,
    perMinute: 1,
    minimumKm: 3,
    minimumFare: 100,
    platformCharge: 10,
    gst: 5,
    nightCharge: 50,
    driverAllowance: 0,
    waitingCharge: 2,
    enabled: true,
    category: "sedan",
    updatedAt: now,
    updatedBy: admin.uid,
    createdAt: now,
    isTestAccount: true,
    testSeed: SEED_TAG,
  },
  { merge: true }
);

const verification = [];
for (const definition of definitions) {
  const user = await auth.getUserByEmail(definition.email);
  const userSnapshot = await db.collection("users").doc(user.uid).get();
  verification.push({
    key: definition.key,
    uid: user.uid,
    emailVerified: user.emailVerified,
    role: userSnapshot.data()?.role,
  });
}
const [driverSnapshot, vehicleSnapshot, settingsSnapshot, adminSnapshot] = await Promise.all([
  db.collection("drivers").doc(driver.uid).get(),
  db.collection("vehicles").doc(vehicleDocumentId).get(),
  pricingReference.get(),
  db.collection("admins").doc(admin.uid).get(),
]);

const driverData = driverSnapshot.data() ?? {};
const verified =
  verification.every((item) => item.emailVerified === true && item.role) &&
  driverData.isApproved === true &&
  driverData.isActive === true &&
  driverData.isOnline === false &&
  driverData.status === "offline" &&
  !driverData.activeRideId &&
  !driverData.incomingRideId &&
  vehicleSnapshot.exists &&
  settingsSnapshot.exists &&
  adminSnapshot.data()?.isActive === true;

if (!verified) throw new Error("Unit 003A staging fixture verification failed.");

console.log(`Confirmed ${verification.length} Unit 003A TEST ONLY identities in ${projectId}.`);
console.log("Customer verification, driver eligibility, vehicle, pricing, and admin records passed.");
console.log("Credentials were written only to the ignored .test-credentials workflow; passwords were not printed.");
