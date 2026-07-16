import type {
  BillingMode,
  CanonicalPaymentMethod,
  CanonicalPaymentStatus,
} from "@/types/finance";

export interface CompletionFinanceState {
  billingMode: BillingMode;
  paymentMethod: CanonicalPaymentMethod | null;
  paymentMethodLocked: boolean;
  paymentStatus: CanonicalPaymentStatus;
  settlementStatus: "not_settled";
  corporateBillingStatus: "not_applicable" | "pending_company_billing";
}

export function deriveCompletionFinanceState(
  billingModeValue: unknown,
  paymentMethodValue: unknown
): CompletionFinanceState {
  const corporatePostpaid = String(billingModeValue ?? "customer_pay")
    .trim().toLowerCase() === "corporate_postpaid";
  if (corporatePostpaid) {
    return {
      billingMode: "corporate_postpaid",
      paymentMethod: "corporate_postpaid",
      paymentMethodLocked: true,
      paymentStatus: "not_due",
      settlementStatus: "not_settled",
      corporateBillingStatus: "pending_company_billing",
    };
  }

  const rawMethod = String(paymentMethodValue ?? "").trim().toLowerCase();
  const paymentMethod: CanonicalPaymentMethod | null =
    rawMethod === "cash" || rawMethod === "upi" || rawMethod === "razorpay"
      ? rawMethod
      : null;

  return {
    billingMode: "customer_pay",
    paymentMethod,
    paymentMethodLocked: false,
    paymentStatus: paymentMethod === "cash"
      ? "cash_pending_confirmation"
      : "payment_pending",
    settlementStatus: "not_settled",
    corporateBillingStatus: "not_applicable",
  };
}
