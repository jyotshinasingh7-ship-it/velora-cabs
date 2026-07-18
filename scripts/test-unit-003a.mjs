import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

function loadTypeScriptModule(path, dependencyMap = {}) {
  const source = readFileSync(resolve(path), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  }).outputText;
  const loadedModule = { exports: {} };
  const localRequire = (specifier) => {
    if (Object.hasOwn(dependencyMap, specifier)) return dependencyMap[specifier];
    throw new Error(`Unexpected test dependency: ${specifier}`);
  };
  new Function("require", "module", "exports", output)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const money = loadTypeScriptModule("lib/finance/money.ts");
const lifecycle = loadTypeScriptModule("lib/finance/completionLifecycle.ts");
const normalization = loadTypeScriptModule("lib/finance/normalizeBookingFinance.ts", {
  "@/lib/finance/money": money,
});
const fareLockIdentity = loadTypeScriptModule("lib/finance/fareLockIdentity.ts");
const fareBuilder = loadTypeScriptModule("lib/finance/buildFareSnapshot.ts", {
  "@/lib/finance/money": money,
});

assert.equal(money.rupeesToPaise("10.004"), 1000);
assert.equal(money.rupeesToPaise("10.005"), 1001);
assert.equal(money.rupeesToPaise(500), 50000);
assert.equal(money.safeAddPaise(100, 250, 650), 1000);
assert.equal(money.roundHalfUpDivide(5, 2), 3);
assert.throws(() => money.rupeesToPaise(Number.NaN));
assert.throws(() => money.rupeesToPaise(-1));
assert.throws(() => money.assertValidPaise(1.5));

assert.equal(fareLockIdentity.fareLockIdempotencyKey("booking-1"), "fare-lock:booking-1:v1");
assert.equal(fareLockIdentity.isFareLockReplay({
  fareLocked: true, fareVersion: 1, financeSchemaVersion: 1,
  fareLockIdempotencyKey: "fare-lock:booking-1:v1", fareSnapshot: { totalPayablePaise: 100 },
}, "booking-1"), true);
assert.equal(fareLockIdentity.isFinanceFinalized({ paymentStatus: "paid" }), true);
assert.equal(fareLockIdentity.isFinanceFinalized({ settlementStatus: "settled" }), true);
assert.equal(fareLockIdentity.isFinanceFinalized({ paymentStatus: "payment_pending" }), false);

const fareAmounts = fareBuilder.buildFareSnapshotAmounts({
  estimatedFarePaise: 50000,
  baseFarePaise: 10000,
  perKmPaise: 1500,
  perMinutePaise: 200,
  minimumFarePaise: 10000,
  minimumDistanceMeters: 1000,
  routeDistanceMeters: 10000,
  routeDurationSeconds: 1800,
  platformChargePaise: 1000,
  nightChargePaise: 0,
  driverAllowancePaise: 0,
  gstBasisPoints: 500,
});
assert.equal(fareAmounts.distanceFarePaise, 15000);
assert.equal(fareAmounts.timeFarePaise, 6000);
assert.equal(fareAmounts.taxPaise, 1600);
assert.equal(fareAmounts.totalPayablePaise, 33600);
assert.ok(Object.values(fareAmounts).every(Number.isSafeInteger));

assert.deepEqual(lifecycle.deriveCompletionFinanceState("customer_pay", "cash"), {
  billingMode: "customer_pay",
  paymentMethod: "cash",
  paymentMethodLocked: false,
  paymentStatus: "cash_pending_confirmation",
  settlementStatus: "not_settled",
  corporateBillingStatus: "not_applicable",
});
assert.equal(
  lifecycle.deriveCompletionFinanceState("customer_pay", "upi").paymentStatus,
  "payment_pending"
);
assert.deepEqual(lifecycle.deriveCompletionFinanceState("corporate_postpaid", "cash"), {
  billingMode: "corporate_postpaid",
  paymentMethod: "corporate_postpaid",
  paymentMethodLocked: true,
  paymentStatus: "not_due",
  settlementStatus: "not_settled",
  corporateBillingStatus: "pending_company_billing",
});

const legacyPaid = normalization.normalizeBookingFinance({
  rideStatus: "completed", paymentStatus: "Paid", paymentMethod: "cash", finalFare: 500,
});
assert.equal(legacyPaid.paymentStatus, "paid");
assert.equal(legacyPaid.compatibilityReason, "legacy_auto_cash_paid");
assert.equal(legacyPaid.displayFarePaise, 50000);

const ambiguous = normalization.normalizeBookingFinance({
  rideStatus: "completed", paymentStatus: "Pending", finalFare: 500,
});
assert.equal(ambiguous.paymentStatus, "payment_pending");
assert.equal(ambiguous.reviewRequired, true);

const canonicalCash = normalization.normalizeBookingFinance({
  rideStatus: "completed",
  financeSchemaVersion: 1,
  fareLocked: true,
  paymentStatus: "cash_pending_confirmation",
  paymentMethod: "cash",
  settlementStatus: "not_settled",
  fareSnapshot: {
    currency: "INR", estimatedFarePaise: 49000, baseFarePaise: 10000,
    distanceFarePaise: 30000, timeFarePaise: 5000, waitingChargePaise: 0,
    tollChargePaise: 0, parkingChargePaise: 0, nightChargePaise: 0,
    surgeChargePaise: 0, platformChargePaise: 2500, driverAllowancePaise: 0,
    discountPaise: 0, cancellationChargePaise: 0, taxPaise: 2500,
    commissionableFarePaise: 45000, taxableValuePaise: 47500,
    minimumFareAdjustmentPaise: 0, totalPayablePaise: 50000,
    distanceMeters: 10000, durationSeconds: 1800,
    source: "test", pricingVersion: "test-v1",
  },
});
assert.equal(canonicalCash.paymentStatus, "cash_pending_confirmation");
assert.equal(canonicalCash.reviewRequired, false);
assert.equal(canonicalCash.displayFarePaise, 50000);

const otpRoute = readFileSync(resolve("app/api/rides/otp/route.ts"), "utf8");
assert.match(otpRoute, /buildFinalFareLockCandidate/);
assert.match(otpRoute, /paymentStatus: financeState\.paymentStatus/);
assert.doesNotMatch(otpRoute, /paymentStatus:\s*["']paid["']/);
assert.doesNotMatch(otpRoute, /cashCollectedAt:\s*FieldValue\.serverTimestamp/);
assert.doesNotMatch(otpRoute, /driverWallets|walletTransactions|platformCommission/);

assert.match(readFileSync(resolve("app/api/payments/cash/route.ts"), "utf8"), /getUnit003APaymentBoundary/);
for (const paymentRoute of [
  "app/api/payments/razorpay/order/route.ts",
  "app/api/payments/razorpay/verify/route.ts",
]) {
  assert.match(readFileSync(resolve(paymentRoute), "utf8"), /assertOnlinePaymentEligible/);
}

console.log("Unit 003A finance primitive, lifecycle, and legacy normalization tests passed.");
