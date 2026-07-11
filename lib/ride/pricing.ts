export interface PricingInput {
  baseFare: number;
  perKm: number;
  distanceKm: number;
  minimumKm: number;

  gstPercentage: number;

  isNightRide: boolean;
  nightCharge: number;

  tollCharge: number;
  parkingCharge: number;

  waitingMinutes: number;
  freeWaitingMinutes: number;
  waitingChargePerMinute: number;

  driverAllowance: number;
  driverAllowanceApplicable: boolean;

  discountAmount?: number;
}

export interface PricingResult {
  billableKm: number;

  distanceFare: number;

  subtotal: number;

  gstAmount: number;

  waitingCharge: number;

  nightCharge: number;

  tollCharge: number;

  parkingCharge: number;

  driverAllowance: number;

  discountAmount: number;

  finalFare: number;
}

function round(value: number) {
  return Math.round(value);
}

export function calculateRideFare(
  input: PricingInput
): PricingResult {
  const billableKm = Math.max(
    input.distanceKm,
    input.minimumKm
  );

  const distanceFare =
    billableKm * input.perKm;

  const waitingMinutes =
    Math.max(
      0,
      input.waitingMinutes -
        input.freeWaitingMinutes
    );

  const waitingCharge =
    waitingMinutes *
    input.waitingChargePerMinute;

  const nightCharge =
    input.isNightRide
      ? input.nightCharge
      : 0;

  const driverAllowance =
    input.driverAllowanceApplicable
      ? input.driverAllowance
      : 0;

  const subtotal =
    input.baseFare +
    distanceFare +
    waitingCharge +
    nightCharge +
    input.tollCharge +
    input.parkingCharge +
    driverAllowance;

  const gstAmount =
    subtotal *
    (input.gstPercentage / 100);

  const discount =
    input.discountAmount ?? 0;

  const finalFare =
    subtotal +
    gstAmount -
    discount;

  return {
    billableKm: round(billableKm),

    distanceFare: round(distanceFare),

    subtotal: round(subtotal),

    gstAmount: round(gstAmount),

    waitingCharge: round(waitingCharge),

    nightCharge: round(nightCharge),

    tollCharge: round(
      input.tollCharge
    ),

    parkingCharge: round(
      input.parkingCharge
    ),

    driverAllowance: round(
      driverAllowance
    ),

    discountAmount: round(discount),

    finalFare: round(finalFare),
  };
}

export function isNightRide(
  rideHour: number,
  startHour = 22,
  endHour = 6
) {
  if (startHour > endHour) {
    return (
      rideHour >= startHour ||
      rideHour < endHour
    );
  }

  return (
    rideHour >= startHour &&
    rideHour < endHour
  );
}

export function calculateWaitingMinutes(
  arrivedAt: Date,
  rideStartedAt: Date
) {
  const milliseconds =
    rideStartedAt.getTime() -
    arrivedAt.getTime();

  return Math.max(
    0,
    Math.floor(milliseconds / 60000)
  );
}