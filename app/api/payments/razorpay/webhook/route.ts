import { createHash } from "crypto";
import { NextResponse } from "next/server";

import {
  PaymentFlowError,
  assertProviderPayment,
  verifyWebhookSignature,
} from "@/lib/payments/razorpaySecurity";
import { getRazorpayWebhookSecret } from "@/lib/server/razorpayClient";
import {
  findBookingByOrderId,
  recordFailedPayment,
  settleCapturedPayment,
} from "@/lib/server/razorpaySettlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WebhookPayload {
  event?: string;
  payload?: {
    payment?: { entity?: Record<string, unknown> };
    order?: { entity?: Record<string, unknown> };
  };
}
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature")?.trim() ?? "";
    const secret = getRazorpayWebhookSecret();
    if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ message: "Invalid webhook signature." }, { status: 403 });
    }

    const payload = JSON.parse(rawBody) as WebhookPayload;
    const eventType = String(payload.event ?? "").trim();
    if (!["payment.captured", "payment.failed", "order.paid"].includes(eventType)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment) throw new PaymentFlowError("PAYMENT_WEBHOOK_PAYLOAD_INVALID", 400, "Webhook payment data is missing.");
    const orderId = String(payment.order_id ?? payload.payload?.order?.entity?.id ?? "").trim();
    const paymentId = String(payment.id ?? "").trim();
    const amountPaise = Number(payment.amount);
    const currency = String(payment.currency ?? "").trim().toUpperCase();
    if (!orderId || !paymentId || !Number.isSafeInteger(amountPaise) || amountPaise <= 0 || currency !== "INR") {
      throw new PaymentFlowError("PAYMENT_WEBHOOK_PAYLOAD_INVALID", 400, "Webhook payment data is invalid.");
    }

    const bookingDocumentId = await findBookingByOrderId(orderId);
    const verified = assertProviderPayment({
      expectedOrderId: orderId,
      expectedAmountPaise: amountPaise,
      expectedCurrency: currency,
      payment,
      requireCaptured: eventType !== "payment.failed",
    });
    const eventId = request.headers.get("x-razorpay-event-id")?.trim()
      || createHash("sha256").update(rawBody).digest("hex");
    const input = {
      bookingDocumentId,
      orderId,
      paymentId,
      amountPaise,
      currency: "INR" as const,
      method: verified.method,
      providerStatus: verified.status,
      source: "webhook" as const,
      eventId,
      eventType,
    };

    const result = eventType === "payment.failed"
      ? await recordFailedPayment(input)
      : await settleCapturedPayment(input);
    return NextResponse.json({ success: true, alreadyProcessed: result.alreadyProcessed });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ message: "Invalid webhook payload." }, { status: 400 });
    }
    if (error instanceof PaymentFlowError) {
      return NextResponse.json({ message: error.message, code: error.code }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "";
    console.error("Razorpay webhook failed", {
      code: message.startsWith("RAZORPAY_") ? message : "WEBHOOK_PROCESSING_FAILED",
    });
    return NextResponse.json(
      { message: message === "RAZORPAY_WEBHOOK_CONFIGURATION_MISSING" ? "Webhook is not configured." : "Webhook processing failed." },
      { status: message === "RAZORPAY_WEBHOOK_CONFIGURATION_MISSING" ? 503 : 500 }
    );
  }
}
