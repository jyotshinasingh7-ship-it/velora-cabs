export function fareLockIdempotencyKey(bookingDocumentId: string) {
  return `fare-lock:${bookingDocumentId}:v1`;
}

export function isFareLockReplay(
  booking: Record<string, unknown>,
  bookingDocumentId: string
) {
  return booking.fareLocked === true
    && booking.fareVersion === 1
    && booking.financeSchemaVersion === 1
    && booking.fareLockIdempotencyKey === fareLockIdempotencyKey(bookingDocumentId)
    && Boolean(booking.fareSnapshot);
}

export function isFinanceFinalized(booking: Record<string, unknown>) {
  const paymentStatus = String(booking.paymentStatus ?? "").trim().toLowerCase();
  const settlementStatus = String(booking.settlementStatus ?? "").trim().toLowerCase();
  return ["paid", "cash_collected"].includes(paymentStatus)
    || ["settled", "reversed"].includes(settlementStatus);
}
