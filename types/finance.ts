import type { Timestamp } from "firebase/firestore";

export type BillingMode = "customer_pay" | "corporate_postpaid";

export type CanonicalPaymentStatus =
  | "not_due"
  | "payment_pending"
  | "payment_processing"
  | "paid"
  | "cash_pending_confirmation"
  | "cash_collected"
  | "payment_failed"
  | "partially_refunded"
  | "refunded"
  | "disputed";

export type SettlementStatus =
  | "not_settled"
  | "pending_driver_earnings"
  | "pending"
  | "available"
  | "withdrawal_reserved"
  | "processing"
  | "settled"
  | "reversed";

export type CanonicalPaymentMethod =
  | "cash"
  | "upi"
  | "razorpay"
  | "corporate_postpaid";

export interface FareSnapshot {
  currency: "INR";
  estimatedFarePaise: number;
  baseFarePaise: number;
  distanceFarePaise: number;
  timeFarePaise: number;
  waitingChargePaise: number;
  tollChargePaise: number;
  parkingChargePaise: number;
  nightChargePaise: number;
  surgeChargePaise: number;
  platformChargePaise: number;
  driverAllowancePaise: number;
  discountPaise: number;
  cancellationChargePaise: number;
  taxPaise: number;
  commissionableFarePaise: number;
  taxableValuePaise: number;
  minimumFareAdjustmentPaise: number;
  totalPayablePaise: number;
  source: string;
  pricingVersion: string;
  distanceMeters: number;
  durationSeconds: number;
  unsupportedComponents: string[];
  lockedAt: Timestamp | null;
  lockedBy: "system";
}
