import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import {
  PaymentFlowError,
  assertTrustedOnlinePaymentState,
  paymentMethodFromProvider,
  providerRecordId,
} from "@/lib/payments/razorpaySecurity";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { setNotification } from "@/lib/server/notifications";

export interface ProviderPaymentInput {
  bookingDocumentId: string;
  orderId: string;
  paymentId: string;
  amountPaise: number;
  currency: "INR";
  method: string;
  providerStatus: string;
  source: "direct" | "webhook";
  eventId: string;
  eventType: string;
}

function safeEventData(input: ProviderPaymentInput, result: string) {
  return {
    provider: "razorpay",
    eventType: input.eventType,
    bookingDocumentId: input.bookingDocumentId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    amountPaise: input.amountPaise,
    currency: input.currency,
    providerStatus: input.providerStatus,
    source: input.source,
    result,
    processedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  };
}

export async function findBookingByOrderId(orderId: string) {
  const snapshot = await getAdminDb()
    .collection("bookings")
    .where("razorpayOrderId", "==", orderId)
    .limit(2)
    .get();
  if (snapshot.size !== 1) {
    throw new PaymentFlowError(
      snapshot.empty ? "PAYMENT_ORDER_NOT_FOUND" : "PAYMENT_ORDER_NOT_UNIQUE",
      snapshot.empty ? 404 : 409,
      "Payment order could not be reconciled."
    );
  }
  return snapshot.docs[0].id;
}

export async function settleCapturedPayment(input: ProviderPaymentInput) {
  const db = getAdminDb();
  const bookingReference = db.collection("bookings").doc(input.bookingDocumentId);
  const paymentClaimReference = db
    .collection("paymentProviderPayments")
    .doc(providerRecordId("razorpay-payment", input.paymentId));
  const eventReference = db
    .collection("paymentProviderEvents")
    .doc(providerRecordId("razorpay-event", input.eventId));

  return db.runTransaction(async (transaction) => {
    const [bookingSnapshot, paymentClaimSnapshot, eventSnapshot] = await Promise.all([
      transaction.get(bookingReference),
      transaction.get(paymentClaimReference),
      transaction.get(eventReference),
    ]);
    if (!bookingSnapshot.exists) {
      throw new PaymentFlowError("PAYMENT_BOOKING_NOT_FOUND", 404, "Booking not found.");
    }
    if (eventSnapshot.exists) return { alreadyProcessed: true };

    const booking = bookingSnapshot.data() ?? {};
    const storedOrderId = String(booking.razorpayOrderId ?? booking.razorpay?.razorpayOrderId ?? "");
    const storedPaymentId = String(booking.razorpayPaymentId ?? booking.razorpay?.razorpayPaymentId ?? "");
    const paymentStatus = String(booking.paymentStatus ?? "").toLowerCase();

    if (storedOrderId !== input.orderId) {
      throw new PaymentFlowError("PAYMENT_ORDER_MISMATCH", 409, "Payment order does not match the booking.");
    }

    const locked = assertTrustedOnlinePaymentState(booking, {
      allowFailedRetry: true,
      allowPaidReplay: true,
    });
    if (locked.amountPaise !== input.amountPaise || locked.currency !== input.currency) {
      throw new PaymentFlowError("PAYMENT_AMOUNT_MISMATCH", 409, "Payment amount does not match the locked fare.");
    }

    if (paymentClaimSnapshot.exists) {
      const claim = paymentClaimSnapshot.data() ?? {};
      if (claim.bookingDocumentId !== input.bookingDocumentId || claim.orderId !== input.orderId) {
        throw new PaymentFlowError("PAYMENT_ID_REUSED", 409, "Payment reference is already in use.");
      }
    }

    if (paymentStatus === "paid") {
      if (storedPaymentId !== input.paymentId) {
        throw new PaymentFlowError("PAYMENT_ALREADY_SETTLED", 409, "Booking was already paid using another payment.");
      }
      transaction.set(eventReference, safeEventData(input, "idempotent_replay"), { merge: false });
      return { alreadyProcessed: true };
    }

    const paymentMethod = paymentMethodFromProvider(input.method);
    const now = FieldValue.serverTimestamp();
    transaction.update(bookingReference, {
      paymentStatus: "paid",
      settlementStatus: "pending_driver_earnings",
      paymentMethod,
      paymentMethodLocked: true,
      paidAmountPaise: input.amountPaise,
      paidAmount: input.amountPaise / 100,
      paidAt: now,
      paymentVerifiedAt: now,
      paymentVerificationSource: input.source,
      paymentProvider: "razorpay",
      paymentGatewayStatus: "captured",
      razorpayOrderId: input.orderId,
      razorpayPaymentId: input.paymentId,
      "razorpay.razorpayOrderId": input.orderId,
      "razorpay.razorpayPaymentId": input.paymentId,
      "razorpay.razorpaySignature": FieldValue.delete(),
      updatedAt: now,
    });
    transaction.set(paymentClaimReference, {
      provider: "razorpay",
      bookingDocumentId: input.bookingDocumentId,
      bookingId: String(booking.bookingId ?? ""),
      orderId: input.orderId,
      paymentId: input.paymentId,
      amountPaise: input.amountPaise,
      currency: input.currency,
      status: "captured",
      source: input.source,
      createdAt: now,
      updatedAt: now,
    }, { merge: false });
    transaction.set(eventReference, safeEventData(input, "settled"), { merge: false });
    const customerUid = String(booking.customerId ?? booking.userId ?? "");
    setNotification(transaction, db, {
      recipientUid: customerUid,
      recipientRole: "customer",
      title: "Payment successful",
      message: "Your Velora ride payment was verified successfully.",
      type: "payment_success",
      eventKey: `booking:${input.bookingDocumentId}:payment_success`,
      actionUrl: "/dashboard",
      metadata: { bookingDocumentId: input.bookingDocumentId, paymentId: input.paymentId },
      source: "razorpay",
    });
    return { alreadyProcessed: false };
  });
}
export async function recordFailedPayment(input: ProviderPaymentInput) {
  const db = getAdminDb();
  const bookingReference = db.collection("bookings").doc(input.bookingDocumentId);
  const eventReference = db
    .collection("paymentProviderEvents")
    .doc(providerRecordId("razorpay-event", input.eventId));

  return db.runTransaction(async (transaction) => {
    const [bookingSnapshot, eventSnapshot] = await Promise.all([
      transaction.get(bookingReference),
      transaction.get(eventReference),
    ]);
    if (!bookingSnapshot.exists) throw new PaymentFlowError("PAYMENT_BOOKING_NOT_FOUND", 404, "Booking not found.");
    if (eventSnapshot.exists) return { alreadyProcessed: true };
    const booking = bookingSnapshot.data() ?? {};
    const storedOrderId = String(booking.razorpayOrderId ?? booking.razorpay?.razorpayOrderId ?? "");
    if (storedOrderId !== input.orderId) throw new PaymentFlowError("PAYMENT_ORDER_MISMATCH", 409, "Payment order does not match the booking.");

    const locked = assertTrustedOnlinePaymentState(booking, {
      allowFailedRetry: true,
      allowPaidReplay: true,
    });
    if (locked.amountPaise !== input.amountPaise || locked.currency !== input.currency) {
      throw new PaymentFlowError("PAYMENT_AMOUNT_MISMATCH", 409, "Payment amount does not match the locked fare.");
    }

    const alreadyPaid = String(booking.paymentStatus ?? "").toLowerCase() === "paid";
    transaction.set(eventReference, safeEventData(input, alreadyPaid ? "ignored_after_paid" : "failed"), { merge: false });
    if (alreadyPaid) return { alreadyProcessed: true };

    transaction.update(bookingReference, {
      paymentStatus: "payment_failed",
      settlementStatus: "not_settled",
      lastPaymentAttemptId: input.paymentId,
      lastPaymentAttemptStatus: "failed",
      lastPaymentAttemptAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const customerUid = String(booking.customerId ?? booking.userId ?? "");
    setNotification(transaction, db, {
      recipientUid: customerUid,
      recipientRole: "customer",
      title: "Payment unsuccessful",
      message: "Your payment was not completed. You can retry from your ride details.",
      type: "payment_failed",
      eventKey: `booking:${input.bookingDocumentId}:payment_failed:${input.paymentId}`,
      actionUrl: "/dashboard",
      metadata: { bookingDocumentId: input.bookingDocumentId },
      source: "razorpay",
    });
    return { alreadyProcessed: false };
  });
}
