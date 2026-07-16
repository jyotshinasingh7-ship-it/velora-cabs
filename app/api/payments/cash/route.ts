import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { calculateAuthoritativePayment } from "@/lib/server/paymentAmount";
import { getUnit003APaymentBoundary } from "@/lib/server/paymentLifecycle";

export const runtime = "nodejs";

interface CashPaymentRequest {
  bookingDocumentId?: string;
  bookingId?: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body =
      (await request.json()) as CashPaymentRequest;

    const bookingDocumentId =
      body.bookingDocumentId?.trim();

    const bookingId =
      body.bookingId?.trim();

    if (!bookingDocumentId || !bookingId) {
      return NextResponse.json(
        {
          message: "Booking information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    const bookingReference = getAdminDb()
      .collection("bookings")
      .doc(bookingDocumentId);
    const bookingSnapshot = await bookingReference.get();

    if (!bookingSnapshot.exists) {
      return NextResponse.json(
        {
          message: "Booking not found.",
        },
        {
          status: 404,
        }
      );
    }

    const bookingData = bookingSnapshot.data() ?? {};

    if (
      bookingData?.customerId !== user.uid &&
      bookingData?.userId !== user.uid
    ) {
      return NextResponse.json({ message: "You cannot update this booking." }, { status: 403 });
    }

    if (bookingData.bookingId !== bookingId) {
      return NextResponse.json(
        {
          message: "Booking verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    const boundary = getUnit003APaymentBoundary(bookingData, "cash");
    if (boundary) {
      return NextResponse.json({ message: boundary.message }, { status: boundary.status });
    }

    const rideStatus = String(bookingData.rideStatus ?? bookingData.status ?? "").toLowerCase();
    if (!["stop_otp_pending", "completed"].includes(rideStatus)) {
      return NextResponse.json({ message: "Payment is not available at this ride stage." }, { status: 409 });
    }

    if (String(bookingData.paymentStatus ?? "").toLowerCase() === "paid") {
      return NextResponse.json({ message: "This booking has already been paid." }, { status: 409 });
    }

    const authoritative = await calculateAuthoritativePayment(bookingData);

    await bookingReference.update({
      paymentMethod: "cash",
      paymentStatus: "pending",
      payableFare: authoritative.payableFare,
      payableFareBasis: "server_directions_and_pricing",
      payableFareBreakdown: authoritative.fareBreakdown,
      paymentRouteDistanceMeters: authoritative.routeDistanceMeters,
      paymentRouteDurationSeconds: authoritative.routeDurationSeconds,
      cashPaymentSelectedAt:
        FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Cash payment selected successfully.",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    const unauthenticated = message === "UNAUTHENTICATED";
    const setupMissing = message === "PAYMENT_ROUTE_VERIFICATION_NOT_CONFIGURED";

    return NextResponse.json(
      {
        message:
          unauthenticated ? "Please login again." : setupMissing ? "Payment calculation is temporarily unavailable." : "Unable to update cash payment.",
      },
      {
          status: unauthenticated ? 401 : setupMissing ? 503 : 500,
      }
    );
  }
}
