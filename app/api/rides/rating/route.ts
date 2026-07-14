import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";

interface RatingRequest {
  bookingDocumentId?: string;
  bookingId?: string;
  rating?: number;
  review?: string;
  quickFeedback?: string[];
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = (await request.json()) as RatingRequest;
    const bookingDocumentId = body.bookingDocumentId?.trim();
    const rating = Number(body.rating);

    if (!bookingDocumentId || !body.bookingId?.trim() || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Valid rating information is required." }, { status: 400 });
    }

    const db = getAdminDb();
    const bookingReference = db.collection("bookings").doc(bookingDocumentId);
    const result = await db.runTransaction(async (transaction) => {
      const bookingSnapshot = await transaction.get(bookingReference);
      if (!bookingSnapshot.exists) throw new Error("Booking not found.");

      const booking = bookingSnapshot.data() ?? {};
      if (booking.customerId !== user.uid && booking.userId !== user.uid) throw new Error("FORBIDDEN");
      if (String(booking.bookingId ?? "") !== body.bookingId) throw new Error("Booking verification failed.");
      if (String(booking.rideStatus ?? booking.status ?? "").toLowerCase() !== "completed") throw new Error("Ride must be completed before rating.");
      if (String(booking.paymentStatus ?? "").toLowerCase() !== "paid") throw new Error("Payment must be completed before rating.");
      if (Number(booking.rating?.customerRating ?? booking.customerRating ?? 0) > 0) return "already_rated";

      const driverId = String(booking.driverId ?? "");
      if (!driverId) throw new Error("Assigned driver is missing.");
      const driverReference = db.collection("drivers").doc(driverId);
      const driverSnapshot = await transaction.get(driverReference);
      if (!driverSnapshot.exists) throw new Error("Driver profile not found.");

      const driver = driverSnapshot.data() ?? {};
      const oldRating = Number(driver.rating ?? driver.averageRating ?? 0);
      const oldCount = Number(driver.ratingCount ?? 0);
      const newCount = oldCount + 1;
      const newAverage = oldCount === 0 ? rating : (oldRating * oldCount + rating) / newCount;
      const review = String(body.review ?? "").trim().slice(0, 500);
      const quickFeedback = Array.isArray(body.quickFeedback)
        ? body.quickFeedback.filter((item): item is string => typeof item === "string").slice(0, 10)
        : [];

      transaction.update(bookingReference, {
        "rating.customerRating": rating,
        "rating.customerReview": review,
        "rating.quickFeedback": quickFeedback,
        "rating.ratedAt": FieldValue.serverTimestamp(),
        customerRating: rating,
        customerReview: review,
        ratedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(driverReference, {
        rating: Number(newAverage.toFixed(2)),
        averageRating: Number(newAverage.toFixed(2)),
        ratingCount: newCount,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.collection("rideRatings").doc(bookingDocumentId), {
        bookingDocumentId,
        bookingId: body.bookingId,
        customerId: user.uid,
        driverId,
        driverName: String(booking.driverName ?? "Velora Driver"),
        rating,
        review,
        quickFeedback,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return "saved";
    });

    if (result === "already_rated") return NextResponse.json({ message: "This ride has already been rated." }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit rating.";
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 409;
    return NextResponse.json({ message: message === "UNAUTHENTICATED" ? "Please login again." : message === "FORBIDDEN" ? "You cannot rate this booking." : message }, { status });
  }
}
