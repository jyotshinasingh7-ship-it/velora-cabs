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

export async function dispatchRideServer(bookingDocumentId: string) {
  const db = getAdminDb();
  const bookingReference = db.collection("bookings").doc(bookingDocumentId);
  const bookingSnapshot = await bookingReference.get();

  if (!bookingSnapshot.exists) {
    throw new Error("Booking not found.");
  }

  const booking = bookingSnapshot.data() ?? {};
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

  driverSnapshot.forEach((document) => {
    if (rejectedDrivers.has(document.id)) return;

    const data = document.data();
    const latitude = Number(data.currentLatitude ?? data.latitude);
    const longitude = Number(data.currentLongitude ?? data.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      data.incomingRideId ||
      data.isApproved === false ||
      data.isOnline === false
    ) return;

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
      if (latestBooking.requestedDriverId || latestDriver.status !== "online" || latestDriver.incomingRideId) return false;

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

    if (assigned) return candidate.id;
  }

  await bookingReference.update({
    rideStatus: "searching_driver",
    status: "searching_driver",
    requestedDriverId: "",
    driverRequestExpiresAt: null,
    noDriverAvailable: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return null;
}
