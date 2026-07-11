import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export const runtime = "nodejs";

interface CashPaymentRequest {
  bookingDocumentId?: string;
  bookingId?: string;
}

export async function POST(request: Request) {
  try {
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

    const bookingData = bookingSnapshot.data();

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

    await updateDoc(bookingReference, {
      paymentMethod: "cash",
      paymentStatus: "pending",
      cashPaymentSelectedAt:
        serverTimestamp(),
      updatedAt: serverTimestamp(),
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

    return NextResponse.json(
      {
        message:
          "Unable to update cash payment.",
      },
      {
        status: 500,
      }
    );
  }
}