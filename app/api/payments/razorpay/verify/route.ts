import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireUser } from "@/lib/server/requireUser";
import { createNotification, setNotification } from "@/lib/server/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyPaymentRequest {
  bookingDocumentId?: string;
  bookingId?: string;
  paymentMethod?: "upi" | "razorpay";

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

function getRazorpayCredentials() {
  const keyId =
    process.env.RAZORPAY_KEY_ID?.trim();

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay environment variables are missing."
    );
  }

  return {
    keyId,
    keySecret,
  };
}

function createRazorpayClient() {
  const { keyId, keySecret } =
    getRazorpayCredentials();

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

function safeSignatureMatch(
  expectedSignature: string,
  receivedSignature: string
) {
  const expectedBuffer = Buffer.from(
    expectedSignature,
    "utf8"
  );

  const receivedBuffer = Buffer.from(
    receivedSignature,
    "utf8"
  );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body =
      (await request.json()) as VerifyPaymentRequest;

    const bookingDocumentId =
      body.bookingDocumentId?.trim();

    const bookingId =
      body.bookingId?.trim();

    const razorpayOrderId =
      body.razorpayOrderId?.trim();

    const razorpayPaymentId =
      body.razorpayPaymentId?.trim();

    const razorpaySignature =
      body.razorpaySignature?.trim();

    const paymentMethod =
      body.paymentMethod === "upi"
        ? "upi"
        : "razorpay";

    if (
      !bookingDocumentId ||
      !bookingId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          message:
            "Required payment verification details are missing.",
        },
        {
          status: 400,
        }
      );
    }

    const db = getAdminDb();
    const bookingReference = db.collection("bookings").doc(bookingDocumentId);
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
      bookingData.customerId !== user.uid &&
      bookingData.userId !== user.uid
    ) {
      return NextResponse.json({ message: "You cannot verify payment for this booking." }, { status: 403 });
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
      return NextResponse.json({ message: "Payment verification is not available at this ride stage." }, { status: 409 });
    }

    const existingPaymentStatus = String(
      bookingData.paymentStatus ?? "pending"
    ).toLowerCase();

    const existingPaymentId = String(
      bookingData.razorpay
        ?.razorpayPaymentId ??
        bookingData.razorpayPaymentId ??
        ""
    );

    if (
      existingPaymentStatus === "paid"
    ) {
      if (
        existingPaymentId ===
        razorpayPaymentId
      ) {
        return NextResponse.json(
          {
            success: true,
            message:
              "Payment was already verified.",
            paymentId:
              razorpayPaymentId,
          },
          {
            status: 200,
          }
        );
      }

      return NextResponse.json(
        {
          message:
            "This booking has already been paid using another payment.",
        },
        {
          status: 409,
        }
      );
    }

    const storedOrderId = String(
      bookingData.razorpay
        ?.razorpayOrderId ??
        bookingData.razorpayOrderId ??
        ""
    );

    if (
      !storedOrderId ||
      storedOrderId !== razorpayOrderId
    ) {
      return NextResponse.json(
        {
          message:
            "Razorpay order verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    const { keySecret } =
      getRazorpayCredentials();

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(
        `${storedOrderId}|${razorpayPaymentId}`
      )
      .digest("hex");

    const signatureIsValid =
      safeSignatureMatch(
        expectedSignature,
        razorpaySignature
      );

    if (!signatureIsValid) {
      return NextResponse.json(
        {
          message:
            "Invalid payment signature.",
        },
        {
          status: 400,
        }
      );
    }

    const razorpay =
      createRazorpayClient();

    const payment =
      await razorpay.payments.fetch(
        razorpayPaymentId
      );

    if (
      payment.order_id !== storedOrderId
    ) {
      return NextResponse.json(
        {
          message:
            "Payment does not belong to this order.",
        },
        {
          status: 400,
        }
      );
    }

    const expectedAmountInPaise =
      Number(
        bookingData.paymentOrderAmount ??
          Math.round(
            Number(
              bookingData.fare
                ?.finalFare ??
                bookingData.finalFare ??
                bookingData.estimatedFare ??
                0
            ) * 100
          )
      );

    const receivedAmountInPaise =
      Number(payment.amount);

    if (
      !Number.isFinite(
        expectedAmountInPaise
      ) ||
      expectedAmountInPaise <= 0 ||
      receivedAmountInPaise !==
        expectedAmountInPaise
    ) {
      return NextResponse.json(
        {
          message:
            "Payment amount verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    let finalPaymentStatus =
      String(payment.status);

    if (
      finalPaymentStatus ===
      "authorized"
    ) {
      const capturedPayment =
        await razorpay.payments.capture(
          razorpayPaymentId,
          expectedAmountInPaise,
          "INR"
        );

      finalPaymentStatus = String(
        capturedPayment.status
      );
    }

    if (
      finalPaymentStatus !==
      "captured"
    ) {
      await createNotification({ recipientUid: user.uid, recipientRole: "customer", title: "Payment unsuccessful", message: "Your payment was not completed. You can try again from your ride details.", type: "payment_failed", eventKey: `booking:${bookingDocumentId}:payment_failed:${razorpayPaymentId}`, actionUrl: "/dashboard", metadata: { bookingDocumentId, paymentStatus: finalPaymentStatus }, source: "razorpay" });
      return NextResponse.json(
        {
          message:
            "Payment has not been captured yet.",
          paymentStatus:
            finalPaymentStatus,
        },
        {
          status: 409,
        }
      );
    }

    await db.runTransaction(
      async (transaction) => {
        const latestBookingSnapshot =
          await transaction.get(
            bookingReference
          );

        if (
          !latestBookingSnapshot.exists
        ) {
          throw new Error(
            "Booking no longer exists."
          );
        }

        const latestBookingData =
          latestBookingSnapshot.data() ?? {};

        const latestPaymentStatus =
          String(
            latestBookingData.paymentStatus ??
              "pending"
          ).toLowerCase();

        const latestPaymentId =
          String(
            latestBookingData.razorpay
              ?.razorpayPaymentId ??
              latestBookingData
                .razorpayPaymentId ??
              ""
          );

        if (
          latestPaymentStatus === "paid"
        ) {
          if (
            latestPaymentId !==
            razorpayPaymentId
          ) {
            throw new Error(
              "Booking was already paid using another payment."
            );
          }

          return;
        }

        transaction.update(
          bookingReference,
          {
            paymentMethod,
            paymentStatus: "paid",

            "razorpay.razorpayOrderId":
              storedOrderId,

            "razorpay.razorpayPaymentId":
              razorpayPaymentId,

            "razorpay.razorpaySignature":
              razorpaySignature,

            razorpayOrderId:
              storedOrderId,

            razorpayPaymentId:
              razorpayPaymentId,

            paymentGatewayStatus:
              finalPaymentStatus,

            paidAmount:
              receivedAmountInPaise /
              100,

            paidAt:
            FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),
          }
        );
        setNotification(transaction, db, { recipientUid: user.uid, recipientRole: "customer", title: "Payment successful", message: "Your Velora ride payment was completed successfully.", type: "payment_success", eventKey: `booking:${bookingDocumentId}:payment_success`, actionUrl: "/dashboard", metadata: { bookingDocumentId, paymentId: razorpayPaymentId }, source: "razorpay" });
      }
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Payment verified successfully.",
        paymentId:
          razorpayPaymentId,
        paymentStatus: "paid",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay payment verification failed:",
      error
    );
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";

    return NextResponse.json(
      {
        message:
          unauthenticated
            ? "Please login again."
            : "Unable to verify payment.",
      },
      {
        status: unauthenticated ? 401 : 500,
      }
    );
  }
}
