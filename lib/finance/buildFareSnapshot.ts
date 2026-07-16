import {
  assertValidPaise,
  roundHalfUpDivide,
  safeAddPaise,
} from "@/lib/finance/money";

export interface FareCalculationInput {
  estimatedFarePaise: number;
  baseFarePaise: number;
  perKmPaise: number;
  perMinutePaise: number;
  minimumFarePaise: number;
  minimumDistanceMeters: number;
  routeDistanceMeters: number;
  routeDurationSeconds: number;
  platformChargePaise: number;
  nightChargePaise: number;
  driverAllowancePaise: number;
  gstBasisPoints: number;
}

export function buildFareSnapshotAmounts(input: FareCalculationInput) {
  for (const [field, value] of Object.entries(input)) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`${field} must be a non-negative safe integer.`);
    }
  }
  if (input.routeDistanceMeters <= 0 || input.routeDurationSeconds <= 0) {
    throw new Error("Route distance and duration must be positive.");
  }

  const billableDistanceMeters = Math.max(
    input.routeDistanceMeters,
    input.minimumDistanceMeters
  );
  const distanceFarePaise = roundHalfUpDivide(
    billableDistanceMeters * input.perKmPaise,
    1000
  );
  const timeFarePaise = roundHalfUpDivide(
    input.routeDurationSeconds * input.perMinutePaise,
    60
  );
  const waitingChargePaise = 0;
  const tollChargePaise = 0;
  const parkingChargePaise = 0;
  const surgeChargePaise = 0;
  const discountPaise = 0;
  const cancellationChargePaise = 0;

  const commissionableBeforeDiscount = safeAddPaise(
    input.baseFarePaise,
    distanceFarePaise,
    timeFarePaise,
    waitingChargePaise,
    input.nightChargePaise,
    surgeChargePaise
  );
  const commissionableFarePaise = Math.max(
    0,
    commissionableBeforeDiscount - discountPaise
  );
  assertValidPaise(commissionableFarePaise, "commissionableFarePaise");

  const taxableValuePaise = safeAddPaise(
    commissionableFarePaise,
    tollChargePaise,
    parkingChargePaise,
    input.platformChargePaise,
    input.driverAllowancePaise,
    cancellationChargePaise
  );
  const taxPaise = roundHalfUpDivide(
    taxableValuePaise * input.gstBasisPoints,
    10000
  );
  const calculatedTotalPaise = safeAddPaise(taxableValuePaise, taxPaise);
  const minimumFareAdjustmentPaise = Math.max(
    0,
    input.minimumFarePaise - calculatedTotalPaise
  );
  assertValidPaise(minimumFareAdjustmentPaise, "minimumFareAdjustmentPaise");
  const totalPayablePaise = safeAddPaise(
    calculatedTotalPaise,
    minimumFareAdjustmentPaise
  );
  if (totalPayablePaise <= 0) throw new Error("PAYMENT_AMOUNT_INVALID");

  return {
    estimatedFarePaise: input.estimatedFarePaise,
    baseFarePaise: input.baseFarePaise,
    distanceFarePaise,
    timeFarePaise,
    waitingChargePaise,
    tollChargePaise,
    parkingChargePaise,
    nightChargePaise: input.nightChargePaise,
    surgeChargePaise,
    platformChargePaise: input.platformChargePaise,
    driverAllowancePaise: input.driverAllowancePaise,
    discountPaise,
    cancellationChargePaise,
    taxPaise,
    commissionableFarePaise,
    taxableValuePaise,
    minimumFareAdjustmentPaise,
    totalPayablePaise,
  };
}
