import "server-only";

type BookingData = Record<string, unknown>;

export interface PaymentBoundaryBlock {
  status: number;
  message: string;
}

export function getUnit003APaymentBoundary(
  booking: BookingData,
  method: "cash" | "online" | "verification"
): PaymentBoundaryBlock | null {
  const rideStatus = String(booking.rideStatus ?? booking.status ?? "").trim().toLowerCase();
  if (rideStatus !== "completed") {
    return { status: 409, message: "Payment is available only after the ride is completed." };
  }

  if (String(booking.billingMode ?? "customer_pay").trim().toLowerCase() === "corporate_postpaid") {
    return { status: 409, message: "This ride is billed to the company; no customer payment is required." };
  }

  const financeSchemaVersion = Number(booking.financeSchemaVersion ?? 0);
  if (financeSchemaVersion < 1) {
    return { status: 409, message: "This legacy ride requires payment review before settlement." };
  }
  if (booking.fareLocked !== true || !booking.fareSnapshot) {
    return { status: 409, message: "The final fare is not locked. Payment cannot proceed." };
  }

  const paymentStatus = String(booking.paymentStatus ?? "").trim().toLowerCase();
  if (["paid", "cash_collected"].includes(paymentStatus)) {
    return { status: 409, message: "This booking has already been paid." };
  }
  if (["partially_refunded", "refunded", "disputed"].includes(paymentStatus)) {
    return { status: 409, message: "This booking is not eligible for a new payment." };
  }

  return {
    status: 409,
    message: method === "cash"
      ? "Cash collection confirmation will be enabled in a later secure settlement unit."
      : method === "verification"
        ? "Online payment verification is not enabled for the new finance lifecycle yet."
        : "Secure online payment processing will be enabled in the next payment unit.",
  };
}
