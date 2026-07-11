export interface DriverLocation {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceKm(
  first: DriverLocation,
  second: DriverLocation
) {
  const latitudeDifference =
    toRadians(second.latitude - first.latitude);

  const longitudeDifference =
    toRadians(second.longitude - first.longitude);

  const latitude1 = toRadians(first.latitude);
  const latitude2 = toRadians(second.latitude);

  const haversine =
    Math.sin(latitudeDifference / 2) *
      Math.sin(latitudeDifference / 2) +
    Math.cos(latitude1) *
      Math.cos(latitude2) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);

  const angle =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine)
    );

  return Number(
    (EARTH_RADIUS * angle).toFixed(2)
  );
}

export function sortDriversByDistance<
  T extends DriverLocation
>(
  pickup: DriverLocation,
  drivers: T[]
) {
  return [...drivers].sort(
    (first, second) =>
      calculateDistanceKm(
        pickup,
        first
      ) -
      calculateDistanceKm(
        pickup,
        second
      )
  );
}