import {
  normalizeLegacyMoneyToPaise,
} from "@/lib/finance/money";
import type {
  BillingMode,
  CanonicalPaymentMethod,
  CanonicalPaymentStatus,
  FareSnapshot,
  SettlementStatus,
} from "@/types/finance";

const PAYMENT_STATUSES = new Set<CanonicalPaymentStatus>([
  "not_due", "payment_pending", "payment_processing", "paid",
  "cash_pending_confirmation", "cash_collected", "payment_failed",
  "partially_refunded", "refunded", "disputed",
]);

const SETTLEMENT_STATUSES = new Set<SettlementStatus>([
  "not_settled", "pending", "available", "withdrawal_reserved",
  "processing", "settled", "reversed",
]);

function normalizedString(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isFareSnapshot(value: unknown): value is FareSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  const paiseFields = [
    "estimatedFarePaise", "baseFarePaise", "distanceFarePaise", "timeFarePaise",
    "waitingChargePaise", "tollChargePaise", "parkingChargePaise",
    "nightChargePaise", "surgeChargePaise", "platformChargePaise",
    "driverAllowancePaise", "discountPaise", "cancellationChargePaise",
    "taxPaise", "commissionableFarePaise", "taxableValuePaise",
    "minimumFareAdjustmentPaise", "totalPayablePaise",
  ];
  return snapshot.currency === "INR"
    && paiseFields.every((field) => Number.isSafeInteger(snapshot[field]) && Number(snapshot[field]) >= 0)
    && Number.isSafeInteger(snapshot.distanceMeters)
    && Number(snapshot.distanceMeters) > 0
    && Number.isSafeInteger(snapshot.durationSeconds)
    && Number(snapshot.durationSeconds) > 0
    && typeof snapshot.source === "string"
    && typeof snapshot.pricingVersion === "string";
}

export interface NormalizedBookingFinance {
  billingMode: BillingMode;
  paymentStatus: CanonicalPaymentStatus;
  paymentMethod: CanonicalPaymentMethod | null;
  settlementStatus: SettlementStatus;
  fareSnapshot: FareSnapshot | null;
  displayFarePaise: number | null;
  financeSchemaVersion: number;
  isLegacy: boolean;
  reviewRequired: boolean;
  compatibilityReason: string | null;
}

export function normalizeBookingFinance(
  booking: Record<string, unknown>
): NormalizedBookingFinance {
  const financeSchemaVersion = Number.isSafeInteger(booking.financeSchemaVersion)
    ? Number(booking.financeSchemaVersion)
    : 0;
  const isLegacy = financeSchemaVersion < 1;
  const rideStatus = normalizedString(booking.rideStatus ?? booking.status);
  const rawPaymentStatus = normalizedString(booking.paymentStatus);
  const rawPaymentMethod = normalizedString(booking.paymentMethod);
  const fareSnapshot = isFareSnapshot(booking.fareSnapshot)
    ? booking.fareSnapshot
    : null;

  let billingMode: BillingMode = "customer_pay";
  if (normalizedString(booking.billingMode) === "corporate_postpaid") {
    billingMode = "corporate_postpaid";
  }

  const paymentMethod: CanonicalPaymentMethod | null =
    rawPaymentMethod === "cash" || rawPaymentMethod === "upi" ||
    rawPaymentMethod === "razorpay" || rawPaymentMethod === "corporate_postpaid"
      ? rawPaymentMethod
      : null;

  let paymentStatus: CanonicalPaymentStatus;
  let reviewRequired = false;
  let compatibilityReason: string | null = null;

  if (PAYMENT_STATUSES.has(rawPaymentStatus as CanonicalPaymentStatus)) {
    paymentStatus = rawPaymentStatus as CanonicalPaymentStatus;
    if (isLegacy && paymentStatus === "paid") {
      compatibilityReason = paymentMethod === "cash"
        ? "legacy_auto_cash_paid"
        : "legacy_paid";
    }
  } else if (rawPaymentStatus === "failed") {
    paymentStatus = "payment_failed";
    compatibilityReason = "legacy_payment_status";
  } else if (rawPaymentStatus === "authorized") {
    paymentStatus = "payment_processing";
    reviewRequired = true;
    compatibilityReason = "legacy_authorized";
  } else if (rideStatus === "completed") {
    paymentStatus = "payment_pending";
    reviewRequired = true;
    compatibilityReason = "ambiguous_completed_payment";
  } else {
    paymentStatus = "not_due";
    compatibilityReason = isLegacy ? "legacy_pre_completion" : null;
  }

  const rawSettlementStatus = normalizedString(booking.settlementStatus);
  const settlementStatus = SETTLEMENT_STATUSES.has(rawSettlementStatus as SettlementStatus)
    ? rawSettlementStatus as SettlementStatus
    : "not_settled";

  const legacyFare = normalizeLegacyMoneyToPaise(
    booking.finalFare ?? booking.payableFare ?? booking.estimatedFare
  );
  const displayFarePaise = fareSnapshot?.totalPayablePaise ?? legacyFare;

  if (financeSchemaVersion >= 1 && (!fareSnapshot || booking.fareLocked !== true) && rideStatus === "completed") {
    reviewRequired = true;
    compatibilityReason = "missing_locked_fare";
  }
  if (rideStatus === "completed" && displayFarePaise === null) {
    reviewRequired = true;
    compatibilityReason = "missing_final_fare";
  }

  return {
    billingMode,
    paymentStatus,
    paymentMethod,
    settlementStatus,
    fareSnapshot,
    displayFarePaise,
    financeSchemaVersion,
    isLegacy,
    reviewRequired,
    compatibilityReason,
  };
}
