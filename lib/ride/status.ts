import type { RideStatus } from "@/types/booking";

export const rideStatusLabels: Record<RideStatus, string> = {
  pending: "Booking Created",
  searching_driver: "Finding Driver",
  driver_assigned: "Driver Assigned",
  driver_arriving: "Driver On The Way",
  driver_arrived: "Driver Arrived",
  start_otp_pending: "Start OTP Required",
  in_progress: "Ride In Progress",
  stop_otp_pending: "End OTP Required",
  completed: "Ride Completed",
  cancelled: "Ride Cancelled",
};

export const activeRideStatuses: RideStatus[] = [
  "pending",
  "searching_driver",
  "driver_assigned",
  "driver_arriving",
  "driver_arrived",
  "start_otp_pending",
  "in_progress",
  "stop_otp_pending",
];

export const customerCancellableStatuses: RideStatus[] = [
  "pending",
  "searching_driver",
];

export const driverCancellableStatuses: RideStatus[] = [
  "driver_assigned",
  "driver_arriving",
];

export function isActiveRideStatus(status: RideStatus) {
  return activeRideStatuses.includes(status);
}

export function canCustomerCancelRide(status: RideStatus) {
  return customerCancellableStatuses.includes(status);
}

export function canDriverCancelRide(status: RideStatus) {
  return driverCancellableStatuses.includes(status);
}

export function isDriverAssignedStatus(status: RideStatus) {
  return [
    "driver_assigned",
    "driver_arriving",
    "driver_arrived",
    "start_otp_pending",
    "in_progress",
    "stop_otp_pending",
    "completed",
  ].includes(status);
}

export function isRideOtpVisible(status: RideStatus) {
  return (
    status === "driver_arrived" ||
    status === "start_otp_pending" ||
    status === "stop_otp_pending"
  );
}

export function isRideCompleted(status: RideStatus) {
  return status === "completed";
}

export function isRideCancelled(status: RideStatus) {
  return status === "cancelled";
}

export function getNextRideStatus(
  currentStatus: RideStatus
): RideStatus | null {
  const flow: Record<RideStatus, RideStatus | null> = {
    pending: "searching_driver",
    searching_driver: "driver_assigned",
    driver_assigned: "driver_arriving",
    driver_arriving: "driver_arrived",
    driver_arrived: "start_otp_pending",
    start_otp_pending: "in_progress",
    in_progress: "stop_otp_pending",
    stop_otp_pending: "completed",
    completed: null,
    cancelled: null,
  };

  return flow[currentStatus];
}

export function canTransitionRideStatus(
  currentStatus: RideStatus,
  nextStatus: RideStatus
) {
  if (nextStatus === "cancelled") {
    return currentStatus !== "completed";
  }

  return getNextRideStatus(currentStatus) === nextStatus;
}

export function normalizeRideStatus(
  status: unknown
): RideStatus {
  if (
    status === "pending" ||
    status === "searching_driver" ||
    status === "driver_assigned" ||
    status === "driver_arriving" ||
    status === "driver_arrived" ||
    status === "start_otp_pending" ||
    status === "in_progress" ||
    status === "stop_otp_pending" ||
    status === "completed" ||
    status === "cancelled"
  ) {
    return status;
  }

  if (typeof status === "string") {
    const normalizedStatus = status
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    if (
      normalizedStatus === "pending" ||
      normalizedStatus === "searching_driver" ||
      normalizedStatus === "driver_assigned" ||
      normalizedStatus === "driver_arriving" ||
      normalizedStatus === "driver_arrived" ||
      normalizedStatus === "start_otp_pending" ||
      normalizedStatus === "in_progress" ||
      normalizedStatus === "stop_otp_pending" ||
      normalizedStatus === "completed" ||
      normalizedStatus === "cancelled"
    ) {
      return normalizedStatus;
    }
  }

  return "pending";
}

export function getRideStatusProgress(status: RideStatus) {
  const progress: Record<RideStatus, number> = {
    pending: 5,
    searching_driver: 15,
    driver_assigned: 30,
    driver_arriving: 45,
    driver_arrived: 60,
    start_otp_pending: 70,
    in_progress: 80,
    stop_otp_pending: 90,
    completed: 100,
    cancelled: 0,
  };

  return progress[status];
}

export function getRideStatusTone(status: RideStatus) {
  if (status === "completed") {
    return "success";
  }

  if (status === "cancelled") {
    return "danger";
  }

  if (
    status === "in_progress" ||
    status === "stop_otp_pending"
  ) {
    return "warning";
  }

  return "info";
}