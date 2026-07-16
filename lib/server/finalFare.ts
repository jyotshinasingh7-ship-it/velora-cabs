import "server-only";

import { createHash } from "crypto";

import {
  normalizeLegacyMoneyToPaise,
  rupeesToPaise,
} from "@/lib/finance/money";
import { buildFareSnapshotAmounts } from "@/lib/finance/buildFareSnapshot";
import { getAuthoritativeFareInputs } from "@/lib/server/paymentAmount";
import type { FareSnapshot } from "@/types/finance";
import { fareLockIdempotencyKey } from "@/lib/finance/fareLockIdentity";

type BookingData = Record<string, unknown>;
type FareSnapshotCandidate = Omit<FareSnapshot, "lockedAt">;

function finiteNonNegative(value: unknown, field: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${field.toUpperCase()}_INVALID`);
  }
  return number;
}

function timestampVersion(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value
    && typeof value.toMillis === "function") {
    return String(value.toMillis());
  }
  return "unversioned";
}

export function bookingFareInputFingerprint(booking: BookingData) {
  const stableInput = {
    pickupPlaceId: String(booking.pickupPlaceId ?? ""),
    dropoffPlaceId: String(booking.dropoffPlaceId ?? ""),
    vehicleType: String(booking.vehicleType ?? ""),
    serviceType: String(booking.serviceType ?? ""),
    tripType: String(booking.tripType ?? ""),
    billingMode: String(booking.billingMode ?? "customer_pay"),
    paymentMethod: String(booking.paymentMethod ?? ""),
    estimatedFare: booking.estimatedFare ?? null,
  };
  return createHash("sha256").update(JSON.stringify(stableInput)).digest("hex");
}

export { fareLockIdempotencyKey };

export async function buildFinalFareLockCandidate(
  booking: BookingData,
  bookingDocumentId: string
) {
  const estimatedFarePaise = normalizeLegacyMoneyToPaise(booking.estimatedFare);
  if (estimatedFarePaise === null || estimatedFarePaise <= 0) {
    throw new Error("BOOKING_ESTIMATED_FARE_INVALID");
  }

  const inputs = await getAuthoritativeFareInputs(booking);
  const pricing = inputs.pricing;
  const baseFarePaise = rupeesToPaise(finiteNonNegative(pricing.baseFare, "baseFare"));
  const perKmPaise = rupeesToPaise(finiteNonNegative(pricing.perKm, "perKm"));
  const perMinutePaise = rupeesToPaise(finiteNonNegative(pricing.perMinute, "perMinute"));
  const minimumFarePaise = rupeesToPaise(finiteNonNegative(pricing.minimumFare, "minimumFare"));
  const platformChargePaise = rupeesToPaise(finiteNonNegative(pricing.platformCharge, "platformCharge"));
  const nightChargePaise = inputs.isNight
    ? rupeesToPaise(finiteNonNegative(pricing.nightCharge, "nightCharge"))
    : 0;
  const driverAllowancePaise = inputs.isOutstation
    ? rupeesToPaise(finiteNonNegative(pricing.driverAllowance, "driverAllowance"))
    : 0;

  const minimumKm = Math.max(1, finiteNonNegative(pricing.minimumKm ?? 1, "minimumKm"));
  const minimumMeters = Math.round(minimumKm * 1000);
  if (!Number.isSafeInteger(minimumMeters)) throw new Error("MINIMUM_DISTANCE_INVALID");
  const gstBasisPoints = rupeesToPaise(finiteNonNegative(pricing.gst, "gst"));
  const amounts = buildFareSnapshotAmounts({
    estimatedFarePaise,
    baseFarePaise,
    perKmPaise,
    perMinutePaise,
    minimumFarePaise,
    minimumDistanceMeters: minimumMeters,
    routeDistanceMeters: inputs.routeDistanceMeters,
    routeDurationSeconds: inputs.routeDurationSeconds,
    platformChargePaise,
    nightChargePaise,
    driverAllowancePaise,
    gstBasisPoints,
  });

  const pricingVersion = createHash("sha256").update(JSON.stringify({
    vehicleType: inputs.vehicleType,
    updatedAt: timestampVersion(inputs.pricingUpdatedAt),
    baseFarePaise,
    perKmPaise,
    perMinutePaise,
    minimumFarePaise,
    platformChargePaise,
    nightChargePaise,
    driverAllowancePaise,
    gstBasisPoints,
  })).digest("hex").slice(0, 20);

  const fareSnapshot: FareSnapshotCandidate & { minimumFareAdjustmentPaise: number } = {
    currency: "INR",
    ...amounts,
    source: "server_directions_current_pricing_v1",
    pricingVersion,
    distanceMeters: inputs.routeDistanceMeters,
    durationSeconds: inputs.routeDurationSeconds,
    unsupportedComponents: [
      "waiting_charge_not_measured",
      "toll_not_supported",
      "parking_not_supported",
      "surge_not_supported",
      "discount_not_supported",
      "cancellation_charge_not_applicable",
    ],
    lockedBy: "system",
  };

  return {
    fareSnapshot,
    fareVersion: 1,
    financeSchemaVersion: 1,
    fareLockIdempotencyKey: fareLockIdempotencyKey(bookingDocumentId),
    inputFingerprint: bookingFareInputFingerprint(booking),
  };
}
