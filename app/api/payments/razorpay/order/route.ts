import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

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

    const bookingReference = doc(
      db,
      "bookings",
      bookingDocumentId
    );

    const bookingSnapshot =
      await getDoc(bookingReference);

    if (!bookingSnapshot.exists()) {
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
      bookingSnapshot.data();

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

    const finalFare = Number(
      bookingData.fare?.finalFare ??
        bookingData.finalFare ??
        bookingData.estimatedFare ??
        0
    );

    if (
      !Number.isFinite(finalFare) ||
      finalFare <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "A valid final fare is not available.",
        },
        {
          status: 400,
        }
      );
    }

    const amountInPaise =
      Math.round(finalFare * 100);

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

    await updateDoc(bookingReference, {
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

      paymentCurrency: "INR",

      paymentOrderCreatedAt:
        serverTimestamp(),

      updatedAt: serverTimestamp(),
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

    return NextResponse.json(
      {
        message:
          "Unable to create Razorpay order.",
      },
      {
        status: 500,
      }
    );
  }
}