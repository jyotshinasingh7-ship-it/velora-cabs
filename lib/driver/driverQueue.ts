export interface DriverQueueItem {
  driverId: string;
  distanceKm: number;
}

const REQUEST_TIMEOUT_SECONDS = 30;

export function getRequestTimeout() {
  return REQUEST_TIMEOUT_SECONDS;
}

export function getNextDriver(
  queue: DriverQueueItem[],
  rejectedDrivers: string[]
) {
  return (
    queue.find(
      (driver) =>
        !rejectedDrivers.includes(driver.driverId)
    ) ?? null
  );
}

export function removeDriverFromQueue(
  queue: DriverQueueItem[],
  driverId: string
) {
  return queue.filter(
    (driver) => driver.driverId !== driverId
  );
}

export function hasAvailableDrivers(
  queue: DriverQueueItem[]
) {
  return queue.length > 0;
}