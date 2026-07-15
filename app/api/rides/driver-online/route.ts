import { NextResponse } from "next/server";

import { dispatchRideServer } from "@/lib/server/dispatchRide";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const db = getAdminDb();
    const [userSnapshot, driverSnapshot] = await Promise.all([
      db.collection("users").doc(user.uid).get(),
      db.collection("drivers").doc(user.uid).get(),
    ]);

    if (
      !userSnapshot.exists ||
      userSnapshot.data()?.role !== "driver" ||
      !driverSnapshot.exists ||
      driverSnapshot.data()?.isApproved !== true ||
      driverSnapshot.data()?.isActive !== true
    ) {
      return NextResponse.json({ message: "Approved driver access required." }, { status: 403 });
    }

    const pendingSnapshot = await db
      .collection("bookings")
      .where("rideStatus", "in", ["Pending", "pending", "searching_driver"])
      .limit(25)
      .get();

    for (const bookingDocument of pendingSnapshot.docs) {
      const booking = bookingDocument.data();
      if (
        booking.requestedDriverId ||
        (booking.bookingType ?? booking.bookingMode) === "schedule"
      ) continue;

      try {
        const assignedDriverId = await dispatchRideServer(bookingDocument.id);
        if (assignedDriverId === user.uid) {
          return NextResponse.json({ success: true, rideRequested: true });
        }
      } catch (dispatchError) {
        if (process.env.NODE_ENV !== "production") {
          console.info("[dispatch]", {
            event: "pending_booking_skipped",
            bookingDocumentId: bookingDocument.id,
            reason:
              dispatchError instanceof Error
                ? dispatchError.message
                : "Unknown pending booking error",
          });
        }
      }
    }

    return NextResponse.json({ success: true, rideRequested: false });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    console.error("Driver online dispatch failed:", error);
    return NextResponse.json(
      { message: unauthenticated ? "Please login again." : "Unable to search pending rides." },
      { status: unauthenticated ? 401 : 500 }
    );
  }
}
