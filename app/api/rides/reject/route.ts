import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { dispatchRideServer } from "@/lib/server/dispatchRide";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { setNotification } from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { bookingDocumentId?: string; timedOut?: boolean };
    const bookingDocumentId = body.bookingDocumentId?.trim();

    if (!bookingDocumentId) {
      return NextResponse.json({ message: "Booking information is missing." }, { status: 400 });
    }

    const db = getAdminDb();
    const bookingReference = db.collection("bookings").doc(bookingDocumentId);
    const driverReference = db.collection("drivers").doc(user.uid);

    const rejected = await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, driverSnapshot] = await Promise.all([
        transaction.get(bookingReference),
        transaction.get(driverReference),
      ]);

      if (!bookingSnapshot.exists || !driverSnapshot.exists) {
        throw new Error("Ride request is no longer available.");
      }

      const booking = bookingSnapshot.data() ?? {};
      const driver = driverSnapshot.data() ?? {};

      if (booking.requestedDriverId !== user.uid || driver.incomingRideId !== bookingDocumentId) {
        return false;
      }

      transaction.update(bookingReference, {
        requestedDriverId: "",
        driverRequestExpiresAt: null,
        rejectedDrivers: FieldValue.arrayUnion(user.uid),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.update(driverReference, {
        incomingRideId: "",
        rideRequestStatus: "rejected",
        rideRequestExpiresAt: null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (body.timedOut === true) setNotification(transaction, db, { recipientUid: user.uid, recipientRole: "driver", title: "Ride request expired", message: "The ride request expired before it was accepted.", type: "system", eventKey: `booking:${bookingDocumentId}:request_expired:${user.uid}`, actionUrl: "/driver/dashboard", metadata: { bookingDocumentId }, source: "ride_dispatch" });

      return true;
    });

    if (rejected) {
      await dispatchRideServer(bookingDocumentId);
    }

    return NextResponse.json({ success: true, rejected });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    console.error("Ride rejection failed:", error);
    return NextResponse.json(
      { message: unauthenticated ? "Please login again." : "Unable to reject ride." },
      { status: unauthenticated ? 401 : 500 }
    );
  }
}
