import { createHash, createHmac, timingSafeEqual } from "crypto";

type BookingData = Record<string, unknown>;

export class PaymentFlowError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "PaymentFlowError";
  }
}

function normalized(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function safeInteger(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}

export function assertBookingOwner(userId: string, booking: BookingData) {
  if (booking.customerId !== userId && booking.userId !== userId) {
    throw new PaymentFlowError(
      "PAYMENT_FORBIDDEN",
      403,
      "You cannot pay for this booking."
    );
  }
}

export function lockedPaymentAmount(booking: BookingData) {
  if (Number(booking.financeSchemaVersion ?? 0) < 1) {
    throw new PaymentFlowError(
      "PAYMENT_LEGACY_REVIEW_REQUIRED",
      409,
      "This legacy ride requires payment review."
    );
  }
  if (booking.fareLocked !== true || !booking.fareSnapshot || typeof booking.fareSnapshot !== "object") {
    throw new PaymentFlowError(
      "PAYMENT_FARE_NOT_LOCKED",
      409,
      "The final fare is not locked."
    );
  }

  const snapshot = booking.fareSnapshot as Record<string, unknown>;
  const amountPaise = safeInteger(snapshot.totalPayablePaise);
  const currency = String(snapshot.currency ?? "").trim().toUpperCase();
  if (amountPaise === null || amountPaise <= 0 || currency !== "INR") {
    throw new PaymentFlowError(
      "PAYMENT_FARE_INVALID",
      409,
      "The locked fare is not valid for payment."
    );
  }

  return { amountPaise, currency: "INR" as const };
}

export function assertOnlinePaymentEligible(
  userId: string,
  booking: BookingData,
  options: { allowFailedRetry?: boolean; allowPaidReplay?: boolean } = {}
) {
  assertBookingOwner(userId, booking);
  return assertTrustedOnlinePaymentState(booking, options);
}

export function assertTrustedOnlinePaymentState(
  booking: BookingData,
  options: { allowFailedRetry?: boolean; allowPaidReplay?: boolean } = {}
) {
  const rideStatus = normalized(booking.rideStatus ?? booking.status);
  if (rideStatus !== "completed") {
    throw new PaymentFlowError(
      "PAYMENT_RIDE_INCOMPLETE",
      409,
      "Payment is available only after the ride is completed."
    );
  }
  if (normalized(booking.billingMode) === "corporate_postpaid") {
    throw new PaymentFlowError(
      "PAYMENT_CORPORATE_EXCLUDED",
      409,
      "This ride is billed to the company."
    );
  }
  if (normalized(booking.paymentMethod) === "cash") {
    throw new PaymentFlowError(
      "PAYMENT_CASH_EXCLUDED",
      409,
      "Cash rides cannot use online Checkout."
    );
  }

  const locked = lockedPaymentAmount(booking);
  const paymentStatus = normalized(booking.paymentStatus);
  const allowedStatuses = new Set(["payment_pending", "payment_processing"]);
  if (options.allowFailedRetry) allowedStatuses.add("payment_failed");
  if (options.allowPaidReplay) allowedStatuses.add("paid");
  if (!allowedStatuses.has(paymentStatus)) {
    throw new PaymentFlowError(
      paymentStatus === "paid" ? "PAYMENT_ALREADY_PAID" : "PAYMENT_STATE_INVALID",
      409,
      paymentStatus === "paid"
        ? "This booking has already been paid."
        : "This booking is not eligible for online payment."
    );
  }

  const settlementStatus = normalized(booking.settlementStatus);
  const allowedSettlement = paymentStatus === "paid"
    ? settlementStatus === "pending_driver_earnings"
    : settlementStatus === "not_settled";
  if (!allowedSettlement) {
    throw new PaymentFlowError(
      "PAYMENT_SETTLEMENT_STATE_INVALID",
      409,
      "This booking is not eligible for a new payment."
    );
  }
  return locked;
}

export function safeSignatureMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}) {
  const expected = createHmac("sha256", input.secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return safeSignatureMatch(expected, input.signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeSignatureMatch(expected, signature);
}

export function assertProviderPayment(input: {
  expectedOrderId: string;
  expectedAmountPaise: number;
  expectedCurrency: string;
  payment: Record<string, unknown>;
  requireCaptured?: boolean;
}) {
  const paymentId = String(input.payment.id ?? "").trim();
  const orderId = String(input.payment.order_id ?? "").trim();
  const amountPaise = safeInteger(input.payment.amount);
  const currency = String(input.payment.currency ?? "").trim().toUpperCase();
  const status = normalized(input.payment.status);

  if (!paymentId || orderId !== input.expectedOrderId) {
    throw new PaymentFlowError("PAYMENT_PROVIDER_ORDER_MISMATCH", 400, "Payment order verification failed.");
  }
  if (amountPaise !== input.expectedAmountPaise || currency !== input.expectedCurrency) {
    throw new PaymentFlowError("PAYMENT_PROVIDER_AMOUNT_MISMATCH", 400, "Payment amount verification failed.");
  }
  if (input.requireCaptured && status !== "captured") {
    throw new PaymentFlowError("PAYMENT_NOT_CAPTURED", 409, "Payment has not been captured yet.");
  }

  return {
    paymentId,
    orderId,
    amountPaise,
    currency,
    status,
    method: normalized(input.payment.method),
  };
}

export function isReusableProviderOrder(input: {
  expectedAmountPaise: number;
  expectedCurrency: string;
  order: Record<string, unknown>;
}) {
  const amountPaise = safeInteger(input.order.amount);
  const amountPaidPaise = safeInteger(input.order.amount_paid ?? 0);
  const currency = String(input.order.currency ?? "").trim().toUpperCase();
  const status = normalized(input.order.status);
  return amountPaise === input.expectedAmountPaise
    && amountPaidPaise === 0
    && currency === input.expectedCurrency
    && ["created", "attempted"].includes(status);
}

export function paymentMethodFromProvider(method: string) {
  return normalized(method) === "upi" ? "upi" as const : "razorpay" as const;
}

export function providerRecordId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha256").update(value).digest("hex")}`;
}
