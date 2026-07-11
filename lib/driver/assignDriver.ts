import {
  DriverAvailability,
  canReceiveRide,
} from "./driverAvailability";

import {
  DriverLocation,
  sortDriversByDistance,
} from "./driverDistance";

import {
  DriverQueueItem,
  getNextDriver,
} from "./driverQueue";

export interface DriverCandidate
  extends DriverLocation {
  id: string;
  status: DriverAvailability;
}

export function createDriverQueue(
  pickup: DriverLocation,
  drivers: DriverCandidate[]
): DriverQueueItem[] {
  const availableDrivers =
    drivers.filter((driver) =>
      canReceiveRide(driver.status)
    );

  const sortedDrivers =
    sortDriversByDistance(
      pickup,
      availableDrivers
    );

  return sortedDrivers.map((driver) => ({
    driverId: driver.id,
    distanceKm: Math.round(
      Math.sqrt(
        Math.pow(
          driver.latitude -
            pickup.latitude,
          2
        ) +
          Math.pow(
            driver.longitude -
              pickup.longitude,
            2
          )
      ) * 111
    ),
  }));
}

export function assignNearestDriver(
  pickup: DriverLocation,
  drivers: DriverCandidate[],
  rejectedDrivers: string[]
) {
  const queue =
    createDriverQueue(
      pickup,
      drivers
    );

  return getNextDriver(
    queue,
    rejectedDrivers
  );
}