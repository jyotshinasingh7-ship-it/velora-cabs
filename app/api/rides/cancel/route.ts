import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { setNotification } from "@/lib/server/notifications";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { bookingDocumentId?: string; reason?: string };
    const bookingDocumentId = body.bookingDocumentId?.trim();
    const reason = body.reason?.trim();

    if (!bookingDocumentId || !reason) {
      return NextResponse.json({ message: "Cancellation information is missing." }, { status: 400 });
    }

    const db = getAdminDb();
    const bookingReference = db.collection("bookings").doc(bookingDocumentId);

    await db.runTransaction(async (transaction) => {
      const bookingSnapshot = await transaction.get(bookingReference);

      if (!bookingSnapshot.exists) throw new Error("Booking not found.");

      const booking = bookingSnapshot.data() ?? {};

      if (booking.customerId !== user.uid && booking.userId !== user.uid) {
        throw new Error("FORBIDDEN");
      }

      const status = String(booking.rideStatus ?? booking.status ?? "").toLowerCase();

      if (!["pending", "searching_driver"].includes(status)) {
        throw new Error("Ride can no longer be cancelled by the customer.");
      }

      const requestedDriverId = String(booking.requestedDriverId ?? "");
      const driverReference = requestedDriverId
        ? db.collection("drivers").doc(requestedDriverId)
        : null;
      const driverSnapshot = driverReference
        ? await transaction.get(driverReference)
        : null;

      transaction.update(bookingReference, {
        rideStatus: "cancelled",
        status: "cancelled",
        requestedDriverId: "",
        driverRequestExpiresAt: null,
        cancelledAt: FieldValue.serverTimestamp(),
        "timeline.cancelledAt": FieldValue.serverTimestamp(),
        cancellation: {
          cancelledBy: "customer",
          cancellationReason: reason,
          cancellationNotes: "",
          cancellationFeeApplied: 0,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (driverReference && driverSnapshot?.exists && driverSnapshot.data()?.incomingRideId === bookingDocumentId) {
        transaction.update(driverReference, {
          incomingRideId: "",
          rideRequestStatus: "cancelled",
          rideRequestExpiresAt: null,
          updatedAt: FieldValue.serverTimestamp(),
        });
        setNotification(transaction, db, { recipientUid: requestedDriverId, recipientRole: "driver", title: "Ride request cancelled", message: "The customer cancelled this ride request.", type: "ride_cancelled", eventKey: `booking:${bookingDocumentId}:driver_request_cancelled:${requestedDriverId}`, actionUrl: "/driver/dashboard", metadata: { bookingDocumentId }, source: "ride_lifecycle" });
      }
      setNotification(transaction, db, { recipientUid: user.uid, recipientRole: "customer", title: "Ride cancelled", message: "Your ride has been cancelled successfully.", type: "ride_cancelled", eventKey: `booking:${bookingDocumentId}:cancelled`, actionUrl: "/dashboard", metadata: { bookingDocumentId, reason }, source: "ride_lifecycle" });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json(
      { message: message === "UNAUTHENTICATED" ? "Please login again." : message === "FORBIDDEN" ? "You cannot cancel this booking." : message || "Unable to cancel ride." },
      { status }
    );
  }
}
