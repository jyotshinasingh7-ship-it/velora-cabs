"use client";

import {
  CheckCircle2,
  CreditCard,
  IndianRupee,
  ReceiptText,
  Smartphone,
  WalletCards,
} from "lucide-react";

import { normalizeLegacyMoneyToPaise } from "@/lib/finance/money";
import type { FareBreakdown, PaymentMethod, PaymentStatus } from "@/types/booking";
import type { BillingMode, FareSnapshot, SettlementStatus } from "@/types/finance";

interface RidePaymentProps {
  bookingDocumentId: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fare: FareBreakdown;
  fareSnapshot: FareSnapshot | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  billingMode: BillingMode;
  settlementStatus: SettlementStatus;
  financeSchemaVersion: number;
  reviewRequired: boolean;
  onPaymentCompleted?: () => void;
}

const paymentOptions = [
  { id: "cash", label: "Cash", description: "Cash collection requires secure driver confirmation", icon: IndianRupee },
  { id: "upi", label: "UPI", description: "Secure provider payment is coming in Unit 003B", icon: Smartphone },
  { id: "razorpay", label: "Card / Online", description: "Secure provider payment is coming in Unit 003B", icon: CreditCard },
];

function formatPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

export default function RidePayment({
  bookingId,
  fare,
  fareSnapshot,
  paymentMethod,
  paymentStatus,
  billingMode,
  settlementStatus,
  financeSchemaVersion,
  reviewRequired,
}: RidePaymentProps) {
  const legacyFarePaise = normalizeLegacyMoneyToPaise(fare.finalFare) ?? 0;
  const totalPayablePaise = fareSnapshot?.totalPayablePaise ?? legacyFarePaise;
  const paid = paymentStatus === "paid" || paymentStatus === "cash_collected";
  const corporate = billingMode === "corporate_postpaid";

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black">
          <WalletCards size={23} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Ride Payment</h2>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Ride completed. The fare below is {fareSnapshot ? "locked by Velora" : "shown from a legacy booking"}.
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-5">
        <div className="flex items-center gap-2">
          <ReceiptText size={19} className="text-amber-400" />
          <h3 className="font-bold text-white">Fare Breakdown</h3>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          {fareSnapshot ? (
            <>
              <FareRow label="Base fare" value={fareSnapshot.baseFarePaise} />
              <FareRow label="Distance fare" value={fareSnapshot.distanceFarePaise} />
              {fareSnapshot.timeFarePaise > 0 && <FareRow label="Time fare" value={fareSnapshot.timeFarePaise} />}
              {fareSnapshot.nightChargePaise > 0 && <FareRow label="Night charge" value={fareSnapshot.nightChargePaise} />}
              {fareSnapshot.platformChargePaise > 0 && <FareRow label="Platform charge" value={fareSnapshot.platformChargePaise} />}
              {fareSnapshot.driverAllowancePaise > 0 && <FareRow label="Driver allowance" value={fareSnapshot.driverAllowancePaise} />}
              {fareSnapshot.tollChargePaise > 0 && <FareRow label="Toll" value={fareSnapshot.tollChargePaise} />}
              {fareSnapshot.parkingChargePaise > 0 && <FareRow label="Parking" value={fareSnapshot.parkingChargePaise} />}
              {fareSnapshot.minimumFareAdjustmentPaise > 0 && <FareRow label="Minimum fare adjustment" value={fareSnapshot.minimumFareAdjustmentPaise} />}
              {fareSnapshot.taxPaise > 0 && <FareRow label="Tax" value={fareSnapshot.taxPaise} />}
            </>
          ) : (
            <FareRow label="Legacy recorded fare" value={legacyFarePaise} />
          )}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-white">Final Fare</span>
              <span className="text-2xl font-extrabold text-amber-400">{formatPaise(totalPayablePaise)}</span>
            </div>
          </div>
        </div>
      </div>

      {corporate ? (
        <StatusCard title="Billed to company" message="No payment is required from the employee or guest. Company billing remains pending." tone="amber" />
      ) : paid ? (
        <StatusCard title="Payment completed" message="This ride has a recorded completed payment state." tone="green" />
      ) : reviewRequired ? (
        <StatusCard title="Payment state unavailable" message="This legacy ride needs review. Velora has not inferred payment success." tone="amber" />
      ) : (
        <>
          <StatusCard
            title="Payment still due"
            message={`Status: ${paymentStatus.replaceAll("_", " ")}. Settlement: ${settlementStatus.replaceAll("_", " ")}.`}
            tone="amber"
          />
          <div className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Payment methods not yet enabled">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const selected = paymentMethod === option.id;
              return (
                <div key={option.id} className={`rounded-2xl border p-4 ${selected ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-black/20"}`}>
                  <Icon size={22} className={selected ? "text-amber-400" : "text-white/40"} />
                  <p className="mt-4 font-bold text-white">{option.label}</p>
                  <p className="mt-2 text-xs leading-5 text-white/40">{option.description}</p>
                </div>
              );
            })}
          </div>
          <button type="button" disabled className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black opacity-50">
            <CreditCard size={20} /> Secure payment coming next
          </button>
        </>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-white/35">
        Booking {bookingId} · Finance schema {financeSchemaVersion || "legacy"}. No payment is marked successful without trusted verification.
      </p>
    </section>
  );
}

function StatusCard({ title, message, tone }: { title: string; message: string; tone: "green" | "amber" }) {
  const Icon = tone === "green" ? CheckCircle2 : ReceiptText;
  return (
    <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-5 ${tone === "green" ? "border-green-400/20 bg-green-500/10 text-green-200" : "border-amber-400/20 bg-amber-400/10 text-amber-100"}`} role="status">
      <Icon size={22} className="mt-0.5 shrink-0" />
      <div><p className="font-bold">{title}</p><p className="mt-1 text-sm opacity-70">{message}</p></div>
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-white/45">{label}</span><span className="font-semibold text-white/80">{formatPaise(value)}</span></div>;
}
