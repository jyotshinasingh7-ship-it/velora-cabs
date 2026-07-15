import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { calculateDistanceKm } from "@/lib/driver/driverDistance";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { setNotification } from "@/lib/server/notifications";

interface DriverCandidate {
  id: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

type DriverExclusionReason =
  | "rejected"
  | "not_approved"
  | "inactive"
  | "not_online"
  | "busy"
  | "missing_location"
  | "service_mismatch"
  | "vehicle_mismatch";

function addExclusion(
  exclusions: Record<DriverExclusionReason, number>,
  reason: DriverExclusionReason
) {
  exclusions[reason] += 1;
}

function declaredTypes(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    }
  }

  return [];
}

function dispatchDebug(event: string, data: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[dispatch]", { event, ...data });
  }
}

export async function dispatchRideServer(bookingDocumentId: string) {
  const db = getAdminDb();
  const bookingReference = db.collection("bookings").doc(bookingDocumentId);
  const bookingSnapshot = await bookingReference.get();

  if (!bookingSnapshot.exists) {
    throw new Error("Booking not found.");
  }

  const booking = bookingSnapshot.data() ?? {};
  const serviceType = String(booking.serviceType ?? "").trim().toLowerCase();
  const vehicleType = String(booking.vehicleType ?? "").trim().toLowerCase();
  const pickupLatitude = Number(booking.pickupLatitude ?? booking.pickup?.latitude);
  const pickupLongitude = Number(booking.pickupLongitude ?? booking.pickup?.longitude);

  if (!Number.isFinite(pickupLatitude) || !Number.isFinite(pickupLongitude)) {
    throw new Error("Pickup coordinates are missing.");
  }

  const rejectedDrivers = new Set<string>(
    Array.isArray(booking.rejectedDrivers)
      ? booking.rejectedDrivers.filter((value): value is string => typeof value === "string")
      : []
  );

  const driverSnapshot = await db
    .collection("drivers")
    .where("status", "==", "online")
    .get();

  const candidates: DriverCandidate[] = [];
  const exclusions: Record<DriverExclusionReason, number> = {
    rejected: 0,
    not_approved: 0,
    inactive: 0,
    not_online: 0,
    busy: 0,
    missing_location: 0,
    service_mismatch: 0,
    vehicle_mismatch: 0,
  };

  driverSnapshot.forEach((document) => {
    const data = document.data();
    const latitude = Number(data.currentLatitude ?? data.latitude);
    const longitude = Number(data.currentLongitude ?? data.longitude);

    if (rejectedDrivers.has(document.id)) {
      addExclusion(exclusions, "rejected");
      return;
    }
    if (data.isApproved !== true) {
      addExclusion(exclusions, "not_approved");
      return;
    }
    if (data.isActive !== true) {
      addExclusion(exclusions, "inactive");
      return;
    }
    if (data.status !== "online" || data.isOnline !== true) {
      addExclusion(exclusions, "not_online");
      return;
    }
    if (data.incomingRideId || data.activeRideId) {
      addExclusion(exclusions, "busy");
      return;
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      addExclusion(exclusions, "missing_location");
      return;
    }

    const serviceTypes = declaredTypes(data, ["serviceTypes", "supportedServiceTypes"]);
    if (serviceType && serviceTypes.length > 0 && !serviceTypes.includes(serviceType)) {
      addExclusion(exclusions, "service_mismatch");
      return;
    }

    const vehicleTypes = declaredTypes(data, ["vehicleTypes", "supportedVehicleTypes"]);
    if (vehicleType && vehicleTypes.length > 0 && !vehicleTypes.includes(vehicleType)) {
      addExclusion(exclusions, "vehicle_mismatch");
      return;
    }

    candidates.push({
      id: document.id,
      latitude,
      longitude,
      distanceKm: calculateDistanceKm(
        { latitude: pickupLatitude, longitude: pickupLongitude },
        { latitude, longitude }
      ),
    });
  });

  candidates.sort((first, second) => first.distanceKm - second.distanceKm);

  dispatchDebug("candidates_evaluated", {
    bookingDocumentId,
    queriedDriverCount: driverSnapshot.size,
    eligibleDriverCount: candidates.length,
    exclusions,
  });

  for (const candidate of candidates) {
    const driverReference = db.collection("drivers").doc(candidate.id);
    const assigned = await db.runTransaction(async (transaction) => {
      const [latestBookingSnapshot, latestDriverSnapshot] = await Promise.all([
        transaction.get(bookingReference),
        transaction.get(driverReference),
      ]);

      if (!latestBookingSnapshot.exists || !latestDriverSnapshot.exists) return false;

      const latestBooking = latestBookingSnapshot.data() ?? {};
      const latestDriver = latestDriverSnapshot.data() ?? {};
      const rideStatus = String(latestBooking.rideStatus ?? latestBooking.status ?? "").toLowerCase();

      if (["driver_assigned", "cancelled", "completed"].includes(rideStatus)) return false;
      if (
        latestBooking.requestedDriverId ||
        latestDriver.status !== "online" ||
        latestDriver.isOnline !== true ||
        latestDriver.isApproved !== true ||
        latestDriver.isActive !== true ||
        latestDriver.incomingRideId ||
        latestDriver.activeRideId
      ) return false;

      const expiresAt = Timestamp.fromMillis(Date.now() + 30_000);

      transaction.update(bookingReference, {
        rideStatus: "searching_driver",
        status: "searching_driver",
        requestedDriverId: candidate.id,
        driverRequestDistanceKm: candidate.distanceKm,
        driverRequestExpiresAt: expiresAt,
        requestedAt: FieldValue.serverTimestamp(),
        noDriverAvailable: false,
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(driverReference, {
        incomingRideId: bookingDocumentId,
        rideRequestStatus: "pending",
        rideRequestExpiresAt: expiresAt,
        rideRequestedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      setNotification(transaction, db, {
        recipientUid: candidate.id,
        recipientRole: "driver",
        title: "New ride request",
        message: `${String(latestBooking.pickup ?? "Pickup")} to ${String(latestBooking.drop ?? latestBooking.dropoff ?? "destination")}`,
        type: "system",
        eventKey: `booking:${bookingDocumentId}:request:${candidate.id}`,
        actionUrl: "/driver/dashboard",
        metadata: { bookingDocumentId, requestExpiresAt: expiresAt },
        source: "ride_dispatch",
      });

      return true;
    });

    if (assigned) {
      dispatchDebug("driver_requested", {
        bookingDocumentId,
        requestedDriverId: candidate.id,
      });
      return candidate.id;
    }
  }

  await bookingReference.update({
    rideStatus: "searching_driver",
    status: "searching_driver",
    requestedDriverId: "",
    driverRequestExpiresAt: null,
    noDriverAvailable: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  dispatchDebug("no_driver_available", {
    bookingDocumentId,
    queriedDriverCount: driverSnapshot.size,
    eligibleDriverCount: candidates.length,
    exclusions,
  });

  return null;
}
