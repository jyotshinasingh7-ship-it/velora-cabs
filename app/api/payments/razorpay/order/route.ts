import { randomUUID } from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import {
  PaymentFlowError,
  assertOnlinePaymentEligible,
  isReusableProviderOrder,
} from "@/lib/payments/razorpaySecurity";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { getRazorpayClient, getRazorpayCredentials } from "@/lib/server/razorpayClient";
import { requireUser } from "@/lib/server/requireUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateOrderRequest {
  bookingDocumentId?: string;
  bookingId?: string;
}

interface CreatedRazorpayOrder {
  id: string;
  amount: number | string;
  amount_paid?: number | string;
  currency: string;
  status?: string;
  receipt?: string;
}

function timestampMillis(value: unknown) {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function paymentError(error: unknown) {
  if (error instanceof PaymentFlowError) {
    return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "";
  const unauthenticated = message === "UNAUTHENTICATED";
  const configuration = message.startsWith("RAZORPAY_");
  if (!unauthenticated) {
    console.error("Razorpay order failed", { code: configuration ? message : "ORDER_CREATE_FAILED" });
  }
  return NextResponse.json(
    { message: unauthenticated ? "Please login again." : configuration ? "Online payment is temporarily unavailable." : "Unable to create payment order." },
    { status: unauthenticated ? 401 : configuration ? 503 : 500 }
  );
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json() as CreateOrderRequest;
    const bookingDocumentId = body.bookingDocumentId?.trim() ?? "";
    const bookingId = body.bookingId?.trim() ?? "";
    if (!bookingDocumentId || !bookingId) {
      throw new PaymentFlowError("PAYMENT_BOOKING_REQUIRED", 400, "Booking information is missing.");
    }

    const db = getAdminDb();
    const bookingReference = db.collection("bookings").doc(bookingDocumentId);
    const creationId = randomUUID();
    const claim = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingReference);
      if (!snapshot.exists) throw new PaymentFlowError("PAYMENT_BOOKING_NOT_FOUND", 404, "Booking not found.");
      const booking = snapshot.data() ?? {};
      if (String(booking.bookingId ?? "") !== bookingId) {
        throw new PaymentFlowError("PAYMENT_BOOKING_MISMATCH", 400, "Booking verification failed.");
      }
      const locked = assertOnlinePaymentEligible(user.uid, booking, { allowFailedRetry: true });
      const existingOrderId = String(booking.razorpayOrderId ?? booking.razorpay?.razorpayOrderId ?? "");
      if (existingOrderId) {
        return { kind: "existing" as const, orderId: existingOrderId, ...locked };
      }

      const activeCreationId = String(booking.paymentOrderCreationId ?? "");
      const creationStartedAt = timestampMillis(booking.paymentOrderCreationStartedAt);
      if (activeCreationId && Date.now() - creationStartedAt < 90_000) {
        throw new PaymentFlowError("PAYMENT_ORDER_CREATING", 409, "A payment order is already being prepared. Please retry shortly.");
      }
      transaction.update(bookingReference, {
        paymentOrderCreationId: creationId,
        paymentOrderCreationStartedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { kind: "create" as const, ...locked };
    });

    const razorpay = getRazorpayClient();
    const { keyId } = getRazorpayCredentials();
    if (claim.kind === "existing") {
      const existing = await razorpay.orders.fetch(claim.orderId);
      const status = String(existing.status ?? "").toLowerCase();
      if (isReusableProviderOrder({
        expectedAmountPaise: claim.amountPaise,
        expectedCurrency: claim.currency,
        order: existing as unknown as Record<string, unknown>,
      })) {
        return NextResponse.json({
          orderId: claim.orderId,
          amount: claim.amountPaise,
          currency: claim.currency,
          keyId,
          reused: true,
        });
      }
      throw new PaymentFlowError(
        status === "paid" ? "PAYMENT_RECONCILIATION_PENDING" : "PAYMENT_ORDER_NOT_REUSABLE",
        409,
        status === "paid"
          ? "Payment was captured and is being reconciled. Refresh your ride shortly."
          : "The existing payment order cannot be reused."
      );
    }

    let order: CreatedRazorpayOrder;
    try {
      order = await (razorpay.orders.create({
        amount: claim.amountPaise,
        currency: claim.currency,
        receipt: `velora-${bookingDocumentId.slice(0, 20)}-${creationId.slice(0, 8)}`.slice(0, 40),
        notes: { bookingDocumentId, bookingId },
        partial_payment: false,
      }) as unknown as Promise<CreatedRazorpayOrder>);
    } catch (providerError) {
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(bookingReference);
        if (snapshot.exists && snapshot.data()?.paymentOrderCreationId === creationId) {
          transaction.update(bookingReference, {
            paymentOrderCreationId: FieldValue.delete(),
            paymentOrderCreationStartedAt: FieldValue.delete(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
      throw providerError;
    }

    const providerAmount = Number(order.amount);
    const providerCurrency = String(order.currency ?? "").toUpperCase();
    if (providerAmount !== claim.amountPaise || providerCurrency !== claim.currency) {
      throw new PaymentFlowError("PAYMENT_PROVIDER_ORDER_INVALID", 502, "Payment provider returned an invalid order.");
    }

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingReference);
      if (!snapshot.exists) throw new PaymentFlowError("PAYMENT_BOOKING_NOT_FOUND", 404, "Booking not found.");
      const booking = snapshot.data() ?? {};
      assertOnlinePaymentEligible(user.uid, booking, { allowFailedRetry: true });
      if (booking.paymentOrderCreationId !== creationId) {
        throw new PaymentFlowError("PAYMENT_ORDER_CLAIM_LOST", 409, "Payment order request was superseded.");
      }
      transaction.update(bookingReference, {
        paymentMethod: "razorpay",
        paymentMethodLocked: false,
        paymentStatus: "payment_pending",
        razorpayOrderId: order.id,
        "razorpay.razorpayOrderId": order.id,
        "razorpay.razorpayPaymentId": "",
        "razorpay.razorpaySignature": "",
        paymentOrderAmountPaise: claim.amountPaise,
        paymentOrderAmount: claim.amountPaise,
        paymentCurrency: claim.currency,
        paymentOrderStatus: String(order.status ?? "created"),
        paymentOrderReceipt: String(order.receipt ?? ""),
        paymentOrderCreatedAt: FieldValue.serverTimestamp(),
        paymentOrderCreationId: FieldValue.delete(),
        paymentOrderCreationStartedAt: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      orderId: order.id,
      amount: claim.amountPaise,
      currency: claim.currency,
      keyId,
      reused: false,
    });
  } catch (error) {
    return paymentError(error);
  }
}
