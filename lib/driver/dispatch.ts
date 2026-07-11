import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  assignNearestDriver,
  type DriverCandidate,
} from "@/lib/driver/assignDriver";

export async function dispatchRide(
  bookingDocumentId: string
) {
  const bookingReference = doc(
    db,
    "bookings",
    bookingDocumentId
  );

  const bookingSnapshot = await getDoc(
    bookingReference
  );

  if (!bookingSnapshot.exists()) {
    throw new Error("Booking not found.");
  }

  const booking = bookingSnapshot.data();

  const pickupLatitude = Number(
    booking.pickupLatitude ??
      booking.pickup?.latitude
  );

  const pickupLongitude = Number(
    booking.pickupLongitude ??
      booking.pickup?.longitude
  );

  if (
    !Number.isFinite(pickupLatitude) ||
    !Number.isFinite(pickupLongitude)
  ) {
    throw new Error(
      "Pickup coordinates are missing."
    );
  }

  const rejectedDrivers = Array.isArray(
    booking.rejectedDrivers
  )
    ? booking.rejectedDrivers.filter(
        (value): value is string =>
          typeof value === "string"
      )
    : [];

  const driversQuery = query(
    collection(db, "drivers"),
    where("status", "==", "online")
  );

  const driverSnapshot = await getDocs(
    driversQuery
  );

  const drivers: DriverCandidate[] = [];

  driverSnapshot.forEach(
    (driverDocument) => {
      const data = driverDocument.data();

      const latitude = Number(
        data.currentLatitude ??
          data.latitude
      );

      const longitude = Number(
        data.currentLongitude ??
          data.longitude
      );

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      drivers.push({
        id: driverDocument.id,
        latitude,
        longitude,
        status: data.status ?? "offline",
      });
    }
  );

  const selectedDriver =
    assignNearestDriver(
      {
        latitude: pickupLatitude,
        longitude: pickupLongitude,
      },
      drivers,
      rejectedDrivers
    );

  if (!selectedDriver) {
    await updateDoc(bookingReference, {
      rideStatus: "searching_driver",
      status: "searching_driver",
      requestedDriverId: "",
      driverRequestExpiresAt: null,
      noDriverAvailable: true,
      updatedAt: serverTimestamp(),
    });

    return null;
  }

  const driverReference = doc(
    db,
    "drivers",
    selectedDriver.driverId
  );

  await runTransaction(
    db,
    async (transaction) => {
      const latestBookingSnapshot =
        await transaction.get(
          bookingReference
        );

      const latestDriverSnapshot =
        await transaction.get(
          driverReference
        );

      if (
        !latestBookingSnapshot.exists() ||
        !latestDriverSnapshot.exists()
      ) {
        throw new Error(
          "Booking or driver no longer exists."
        );
      }

      const latestBooking =
        latestBookingSnapshot.data();

      const latestDriver =
        latestDriverSnapshot.data();

      const rideStatus = String(
        latestBooking.rideStatus ??
          latestBooking.status ??
          ""
      ).toLowerCase();

      if (
        rideStatus === "driver_assigned" ||
        rideStatus === "cancelled" ||
        rideStatus === "completed"
      ) {
        return;
      }

      if (
        latestDriver.status !== "online" ||
        latestDriver.incomingRideId
      ) {
        throw new Error(
          "Selected driver is no longer available."
        );
      }

      const expiresAt = new Date(
        Date.now() + 30_000
      );

      transaction.update(
        bookingReference,
        {
          rideStatus: "searching_driver",
          status: "searching_driver",

          requestedDriverId:
            selectedDriver.driverId,

          driverRequestDistanceKm:
            selectedDriver.distanceKm,

          driverRequestExpiresAt:
            expiresAt,

          requestedAt:
            serverTimestamp(),

          noDriverAvailable: false,
          updatedAt: serverTimestamp(),
        }
      );

      transaction.update(
        driverReference,
        {
          incomingRideId:
            bookingDocumentId,

          rideRequestStatus: "pending",

          rideRequestExpiresAt:
            expiresAt,

          rideRequestedAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );
    }
  );

  return selectedDriver.driverId;
}

export async function rejectDriverRequest({
  bookingDocumentId,
  driverId,
}: {
  bookingDocumentId: string;
  driverId: string;
}) {
  const bookingReference = doc(
    db,
    "bookings",
    bookingDocumentId
  );

  const driverReference = doc(
    db,
    "drivers",
    driverId
  );

  await runTransaction(
    db,
    async (transaction) => {
      const bookingSnapshot =
        await transaction.get(
          bookingReference
        );

      if (!bookingSnapshot.exists()) {
        throw new Error(
          "Booking not found."
        );
      }

      const booking =
        bookingSnapshot.data();

      if (
        booking.requestedDriverId !==
        driverId
      ) {
        return;
      }

      transaction.update(
        bookingReference,
        {
          requestedDriverId: "",
          driverRequestExpiresAt: null,
          rejectedDrivers:
            arrayUnion(driverId),
          updatedAt:
            serverTimestamp(),
        }
      );

      transaction.update(
        driverReference,
        {
          incomingRideId: "",
          rideRequestStatus: "rejected",
          rideRequestExpiresAt: null,
          updatedAt:
            serverTimestamp(),
        }
      );
    }
  );

  return dispatchRide(bookingDocumentId);
}