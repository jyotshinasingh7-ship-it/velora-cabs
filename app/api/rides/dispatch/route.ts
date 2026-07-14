import { NextResponse } from "next/server";

import { dispatchRideServer } from "@/lib/server/dispatchRide";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as { bookingDocumentId?: string };
    const bookingDocumentId = body.bookingDocumentId?.trim();

    if (!bookingDocumentId) {
      return NextResponse.json({ message: "Booking information is missing." }, { status: 400 });
    }

    const bookingSnapshot = await getAdminDb().collection("bookings").doc(bookingDocumentId).get();

    if (!bookingSnapshot.exists) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const booking = bookingSnapshot.data() ?? {};

    if (booking.customerId !== user.uid && booking.userId !== user.uid) {
      return NextResponse.json({ message: "You cannot dispatch this booking." }, { status: 403 });
    }

    if (booking.bookingType === "schedule") {
      return NextResponse.json({ message: "Scheduled rides are dispatched near their pickup time." }, { status: 409 });
    }

    const driverId = await dispatchRideServer(bookingDocumentId);
    return NextResponse.json({ success: true, driverRequested: Boolean(driverId) });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    console.error("Ride dispatch failed:", error);
    return NextResponse.json(
      { message: unauthenticated ? "Please login again." : "Unable to dispatch ride." },
      { status: unauthenticated ? 401 : 500 }
    );
  }
}
