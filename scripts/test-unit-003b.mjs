import assert from "node:assert/strict";
import crypto, { createHmac } from "node:crypto";
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
    if (specifier === "crypto") return crypto;
    if (Object.hasOwn(dependencyMap, specifier)) return dependencyMap[specifier];
    throw new Error(`Unexpected test dependency: ${specifier}`);
  };
  new Function("require", "module", "exports", output)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const security = loadTypeScriptModule("lib/payments/razorpaySecurity.ts");
const canonicalBooking = {
  customerId: "customer-1",
  bookingId: "VELORA-TEST-1",
  rideStatus: "completed",
  status: "completed",
  billingMode: "customer_pay",
  paymentMethod: null,
  paymentStatus: "payment_pending",
  settlementStatus: "not_settled",
  financeSchemaVersion: 1,
  fareLocked: true,
  fareSnapshot: { currency: "INR", totalPayablePaise: 50000 },
};

assert.deepEqual(security.assertOnlinePaymentEligible("customer-1", canonicalBooking), {
  amountPaise: 50000,
  currency: "INR",
});
assert.throws(
  () => security.assertOnlinePaymentEligible("wrong-customer", canonicalBooking),
  (error) => error.code === "PAYMENT_FORBIDDEN" && error.status === 403
);
assert.throws(
  () => security.assertOnlinePaymentEligible("customer-1", { ...canonicalBooking, rideStatus: "active", status: "active" }),
  (error) => error.code === "PAYMENT_RIDE_INCOMPLETE"
);
assert.throws(
  () => security.assertOnlinePaymentEligible("customer-1", { ...canonicalBooking, paymentMethod: "cash", paymentStatus: "cash_pending_confirmation" }),
  (error) => error.code === "PAYMENT_CASH_EXCLUDED"
);
assert.throws(
  () => security.assertOnlinePaymentEligible("customer-1", { ...canonicalBooking, fareSnapshot: { currency: "INR", totalPayablePaise: 500.5 } }),
  (error) => error.code === "PAYMENT_FARE_INVALID"
);

const secret = "unit-test-secret";
const orderId = "order_test_1";
const paymentId = "pay_test_1";
const validSignature = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
assert.equal(security.verifyCheckoutSignature({ orderId, paymentId, signature: validSignature, secret }), true);
assert.equal(security.verifyCheckoutSignature({ orderId, paymentId, signature: "invalid", secret }), false);

const providerPayment = {
  id: paymentId,
  order_id: orderId,
  amount: 50000,
  currency: "INR",
  status: "captured",
  method: "upi",
};
assert.equal(security.assertProviderPayment({
  expectedOrderId: orderId,
  expectedAmountPaise: 50000,
  expectedCurrency: "INR",
  payment: providerPayment,
  requireCaptured: true,
}).method, "upi");
assert.throws(() => security.assertProviderPayment({
  expectedOrderId: orderId,
  expectedAmountPaise: 49999,
  expectedCurrency: "INR",
  payment: providerPayment,
}), (error) => error.code === "PAYMENT_PROVIDER_AMOUNT_MISMATCH");

const reusableOrder = { amount: 50000, amount_paid: 0, currency: "INR", status: "created" };
assert.equal(security.isReusableProviderOrder({ expectedAmountPaise: 50000, expectedCurrency: "INR", order: reusableOrder }), true);
assert.equal(security.isReusableProviderOrder({ expectedAmountPaise: 50001, expectedCurrency: "INR", order: reusableOrder }), false);
assert.equal(security.providerRecordId("razorpay-event", "event-1"), security.providerRecordId("razorpay-event", "event-1"));

const orderRoute = readFileSync(resolve("app/api/payments/razorpay/order/route.ts"), "utf8");
assert.match(orderRoute, /requireUser\(request\)/);
assert.match(orderRoute, /assertOnlinePaymentEligible/);
assert.match(orderRoute, /claim\.amountPaise/);
assert.doesNotMatch(orderRoute, /body\.amount|clientAmount|calculateAuthoritativePayment/);

const verifyRoute = readFileSync(resolve("app/api/payments/razorpay/verify/route.ts"), "utf8");
assert.match(verifyRoute, /verifyCheckoutSignature/);
assert.match(verifyRoute, /assertProviderPayment/);
assert.match(verifyRoute, /settleCapturedPayment/);

const settlement = readFileSync(resolve("lib/server/razorpaySettlement.ts"), "utf8");
assert.match(settlement, /paymentStatus:\s*"paid"/);
assert.match(settlement, /settlementStatus:\s*"pending_driver_earnings"/);
assert.match(settlement, /eventSnapshot\.exists/);
assert.match(settlement, /paymentClaimSnapshot\.exists/);
assert.doesNotMatch(settlement, /driverWallets|walletTransactions|platformCommissionPaise|withdrawal/);

const webhook = readFileSync(resolve("app/api/payments/razorpay/webhook/route.ts"), "utf8");
assert.match(webhook, /await request\.text\(\)/);
assert.match(webhook, /verifyWebhookSignature/);
assert.match(webhook, /x-razorpay-event-id/);

const paymentUi = readFileSync(resolve("components/ride/RidePayment.tsx"), "utf8");
assert.match(paymentUi, /"Pay Now"/);
assert.match(paymentUi, /\/api\/payments\/razorpay\/order/);
assert.match(paymentUi, /\/api\/payments\/razorpay\/verify/);
assert.match(paymentUi, /cashSelected/);

console.log("Unit 003B Razorpay eligibility, signature, amount, idempotency, and route contract tests passed.");
