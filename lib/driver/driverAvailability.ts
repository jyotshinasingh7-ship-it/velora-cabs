export type DriverAvailability =
  | "offline"
  | "online"
  | "busy"
  | "on_trip"
  | "break";

export function canReceiveRide(
  status: DriverAvailability
) {
  return status === "online";
}

export function isDriverBusy(
  status: DriverAvailability
) {
  return (
    status === "busy" ||
    status === "on_trip"
  );
}

export function isDriverOffline(
  status: DriverAvailability
) {
  return status === "offline";
}

export function isDriverAvailable(
  status: DriverAvailability
) {
  return status === "online";
}