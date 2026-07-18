import { NextResponse } from "next/server";

import {
  PaymentFlowError,
  assertOnlinePaymentEligible,
  assertProviderPayment,
  verifyCheckoutSignature,
} from "@/lib/payments/razorpaySecurity";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { getRazorpayClient, getRazorpayCredentials } from "@/lib/server/razorpayClient";
import { recordFailedPayment, settleCapturedPayment } from "@/lib/server/razorpaySettlement";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyPaymentRequest {
  bookingDocumentId?: string;
  bookingId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

function paymentError(error: unknown) {
  if (error instanceof PaymentFlowError) {
    return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "";
  const unauthenticated = message === "UNAUTHENTICATED";
  const configuration = message.startsWith("RAZORPAY_");
  if (!unauthenticated) {
    console.error("Razorpay verification failed", { code: configuration ? message : "PAYMENT_VERIFY_FAILED" });
  }
  return NextResponse.json(
    { message: unauthenticated ? "Please login again." : configuration ? "Online payment verification is temporarily unavailable." : "Unable to verify payment." },
    { status: unauthenticated ? 401 : configuration ? 503 : 500 }
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json() as VerifyPaymentRequest;
    const bookingDocumentId = body.bookingDocumentId?.trim() ?? "";
    const bookingId = body.bookingId?.trim() ?? "";
    const orderId = body.razorpayOrderId?.trim() ?? "";
    const paymentId = body.razorpayPaymentId?.trim() ?? "";
    const signature = body.razorpaySignature?.trim() ?? "";
    if (!bookingDocumentId || !bookingId || !orderId || !paymentId || !signature) {
      throw new PaymentFlowError("PAYMENT_VERIFICATION_REQUIRED", 400, "Payment verification details are missing.");
    }

    const db = getAdminDb();
    const bookingSnapshot = await db.collection("bookings").doc(bookingDocumentId).get();
    if (!bookingSnapshot.exists) throw new PaymentFlowError("PAYMENT_BOOKING_NOT_FOUND", 404, "Booking not found.");
    const booking = bookingSnapshot.data() ?? {};
    if (String(booking.bookingId ?? "") !== bookingId) {
      throw new PaymentFlowError("PAYMENT_BOOKING_MISMATCH", 400, "Booking verification failed.");
    }
    const locked = assertOnlinePaymentEligible(user.uid, booking, {
      allowFailedRetry: true,
      allowPaidReplay: true,
    });
    const storedOrderId = String(booking.razorpayOrderId ?? booking.razorpay?.razorpayOrderId ?? "");
    if (!storedOrderId || storedOrderId !== orderId) {
      throw new PaymentFlowError("PAYMENT_ORDER_MISMATCH", 400, "Payment order verification failed.");
    }

    const { keySecret } = getRazorpayCredentials();
    if (!verifyCheckoutSignature({ orderId: storedOrderId, paymentId, signature, secret: keySecret })) {
      throw new PaymentFlowError("PAYMENT_SIGNATURE_INVALID", 400, "Invalid payment signature.");
    }

    const razorpay = getRazorpayClient();
    let payment = await razorpay.payments.fetch(paymentId) as unknown as Record<string, unknown>;
    let verified = assertProviderPayment({
      expectedOrderId: storedOrderId,
      expectedAmountPaise: locked.amountPaise,
      expectedCurrency: locked.currency,
      payment,
    });

    if (verified.status === "authorized") {
      payment = await razorpay.payments.capture(paymentId, locked.amountPaise, locked.currency) as unknown as Record<string, unknown>;
      verified = assertProviderPayment({
        expectedOrderId: storedOrderId,
        expectedAmountPaise: locked.amountPaise,
        expectedCurrency: locked.currency,
        payment,
      });
    }

    const order = await razorpay.orders.fetch(storedOrderId);
    if (
      Number(order.amount) !== locked.amountPaise
      || String(order.currency ?? "").toUpperCase() !== locked.currency
      || String(order.id ?? "") !== storedOrderId
    ) {
      throw new PaymentFlowError("PAYMENT_PROVIDER_ORDER_INVALID", 400, "Provider order verification failed.");
    }

    if (verified.status !== "captured") {
      await recordFailedPayment({
        bookingDocumentId,
        orderId: storedOrderId,
        paymentId: verified.paymentId,
        amountPaise: locked.amountPaise,
        currency: locked.currency,
        method: verified.method,
        providerStatus: verified.status,
        source: "direct",
        eventId: `direct-failed:${verified.paymentId}:${verified.status}`,
        eventType: "payment.failed",
      });
      throw new PaymentFlowError("PAYMENT_NOT_CAPTURED", 409, "Payment has not been captured. You can retry.");
    }

    const result = await settleCapturedPayment({
      bookingDocumentId,
      orderId: storedOrderId,
      paymentId: verified.paymentId,
      amountPaise: locked.amountPaise,
      currency: locked.currency,
      method: verified.method,
      providerStatus: verified.status,
      source: "direct",
      eventId: `direct-captured:${verified.paymentId}`,
      eventType: "payment.captured",
    });
    return NextResponse.json({
      success: true,
      alreadyProcessed: result.alreadyProcessed,
      paymentStatus: "paid",
      settlementStatus: "pending_driver_earnings",
    });
  } catch (error) {
    return paymentError(error);
  }
}
