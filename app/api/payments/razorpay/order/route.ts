import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { calculateAuthoritativePayment } from "@/lib/server/paymentAmount";

export const runtime = "nodejs";

interface CreateOrderRequest {
  bookingDocumentId?: string;
  bookingId?: string;
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret =
    process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay environment variables are missing."
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body =
      (await request.json()) as CreateOrderRequest;

    const bookingDocumentId =
      body.bookingDocumentId?.trim();

    const bookingId =
      body.bookingId?.trim();

    if (!bookingDocumentId || !bookingId) {
      return NextResponse.json(
        {
          message:
            "Booking information is missing.",
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

    const bookingData =
      bookingSnapshot.data() ?? {};

    if (
      bookingData?.customerId !== user.uid &&
      bookingData?.userId !== user.uid
    ) {
      return NextResponse.json({ message: "You cannot pay for this booking." }, { status: 403 });
    }

    const storedBookingId = String(
      bookingData.bookingId ?? ""
    );

    if (storedBookingId !== bookingId) {
      return NextResponse.json(
        {
          message:
            "Booking verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    const rideStatus = String(bookingData.rideStatus ?? bookingData.status ?? "").toLowerCase();
    if (!["stop_otp_pending", "completed"].includes(rideStatus)) {
      return NextResponse.json({ message: "Payment is not available at this ride stage." }, { status: 409 });
    }

    const paymentStatus = String(
      bookingData.paymentStatus ?? "pending"
    ).toLowerCase();

    if (paymentStatus === "paid") {
      return NextResponse.json(
        {
          message:
            "This booking has already been paid.",
        },
        {
          status: 409,
        }
      );
    }

    const existingOrderId = String(bookingData.razorpayOrderId ?? bookingData.razorpay?.razorpayOrderId ?? "");
    const existingAmount = Number(bookingData.paymentOrderAmount ?? 0);
    if (existingOrderId && existingAmount > 0) {
      return NextResponse.json({ orderId: existingOrderId, amount: existingAmount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID }, { status: 200 });
    }

    const authoritative = await calculateAuthoritativePayment(bookingData);
    const amountInPaise = authoritative.amountInPaise;

    const razorpay = getRazorpayClient();

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: bookingId.slice(0, 40),
        notes: {
          bookingDocumentId,
          bookingId,
          customerId: String(
            bookingData.customerId ??
              bookingData.userId ??
              ""
          ),
        },
      });

    await bookingReference.update({
      paymentMethod: "razorpay",
      paymentStatus: "pending",

      "razorpay.razorpayOrderId":
        razorpayOrder.id,

      "razorpay.razorpayPaymentId": "",
      "razorpay.razorpaySignature": "",

      razorpayOrderId:
        razorpayOrder.id,

      paymentOrderAmount:
        amountInPaise,

      payableFare: authoritative.payableFare,
      payableFareBasis: "server_directions_and_pricing",
      payableFareBreakdown: authoritative.fareBreakdown,
      paymentRouteDistanceMeters: authoritative.routeDistanceMeters,
      paymentRouteDurationSeconds: authoritative.routeDurationSeconds,

      paymentCurrency: "INR",

      paymentOrderCreatedAt:
        FieldValue.serverTimestamp(),

      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json(
      {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId:
          process.env.RAZORPAY_KEY_ID,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay order creation failed:",
      error
    );
    const message = error instanceof Error ? error.message : "";
    const unauthenticated = message === "UNAUTHENTICATED";
    const setupMissing = message === "PAYMENT_ROUTE_VERIFICATION_NOT_CONFIGURED";

    return NextResponse.json(
      {
        message:
          unauthenticated ? "Please login again." : setupMissing ? "Online payment is temporarily unavailable." : "Unable to create Razorpay order.",
      },
      {
          status: unauthenticated ? 401 : setupMissing ? 503 : 500,
      }
    );
  }
}
