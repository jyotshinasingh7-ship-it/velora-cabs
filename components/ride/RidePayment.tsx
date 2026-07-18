"use client";

import { useCallback, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  ReceiptText,
  Smartphone,
  WalletCards,
} from "lucide-react";

import { normalizeLegacyMoneyToPaise } from "@/lib/finance/money";
import { auth } from "@/lib/firebase";
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
  { id: "upi", label: "UPI", description: "Available through secure Razorpay Checkout when supported", icon: Smartphone },
  { id: "razorpay", label: "Card / Online", description: "Pay securely using methods enabled in Razorpay", icon: CreditCard },
];

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  retry: { enabled: boolean };
  handler: (response: RazorpaySuccessResponse) => Promise<void>;
  modal: { ondismiss: () => void };
}

interface RazorpayCheckoutInstance {
  open: () => void;
  on: (event: "payment.failed", callback: () => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

let checkoutScriptPromise: Promise<void> | null = null;

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.reject(new Error("Payment Checkout is unavailable."));
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;
  checkoutScriptPromise = new Promise<void>((resolve, reject) => {
    const source = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${source}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load secure Checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = source;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load secure Checkout."));
    document.head.appendChild(script);
  }).catch((error) => {
    checkoutScriptPromise = null;
    throw error;
  });
  return checkoutScriptPromise;
}

function formatPaise(amountPaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

export default function RidePayment({
  bookingDocumentId,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  fare,
  fareSnapshot,
  paymentMethod,
  paymentStatus,
  billingMode,
  settlementStatus,
  financeSchemaVersion,
  reviewRequired,
  onPaymentCompleted,
}: RidePaymentProps) {
  const [checkoutState, setCheckoutState] = useState<"idle" | "creating" | "checkout" | "verifying" | "success" | "failed" | "cancelled">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const legacyFarePaise = normalizeLegacyMoneyToPaise(fare.finalFare) ?? 0;
  const totalPayablePaise = fareSnapshot?.totalPayablePaise ?? legacyFarePaise;
  const paid = paymentStatus === "paid" || paymentStatus === "cash_collected";
  const corporate = billingMode === "corporate_postpaid";
  const cashSelected = paymentMethod === "cash" || paymentStatus === "cash_pending_confirmation";
  const onlineEligible = Boolean(
    fareSnapshot
      && financeSchemaVersion >= 1
      && !reviewRequired
      && !corporate
      && !cashSelected
      && settlementStatus === "not_settled"
      && ["payment_pending", "payment_failed"].includes(paymentStatus)
  );
  const busy = ["creating", "checkout", "verifying"].includes(checkoutState);

  const verifyPayment = useCallback(async (response: RazorpaySuccessResponse) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Please login again before verifying payment.");
    setCheckoutState("verifying");
    setCheckoutMessage("Verifying payment securely...");
    const token = await user.getIdToken();
    const verification = await fetch("/api/payments/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bookingDocumentId, bookingId, ...response }),
    });
    const result = await verification.json().catch(() => ({})) as { message?: string };
    if (!verification.ok) throw new Error(result.message || "Payment verification is pending. Refresh and retry shortly.");
    setCheckoutState("success");
    setCheckoutMessage("Payment verified successfully.");
    onPaymentCompleted?.();
  }, [bookingDocumentId, bookingId, onPaymentCompleted]);

  const startPayment = useCallback(async () => {
    if (!onlineEligible || busy) return;
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please login again before paying.");
      setCheckoutState("creating");
      setCheckoutMessage("Preparing secure Checkout...");
      const [token] = await Promise.all([user.getIdToken(), loadRazorpayCheckout()]);
      const orderRequest = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingDocumentId, bookingId }),
      });
      const order = await orderRequest.json().catch(() => ({})) as {
        message?: string; orderId?: string; amount?: number; currency?: string; keyId?: string;
      };
      if (!orderRequest.ok || !order.orderId || !order.keyId || !Number.isSafeInteger(order.amount)) {
        throw new Error(order.message || "Unable to prepare payment.");
      }
      if (!window.Razorpay) throw new Error("Secure Checkout did not load.");
      setCheckoutState("checkout");
      setCheckoutMessage("Complete payment in secure Checkout.");
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount!,
        currency: order.currency || "INR",
        order_id: order.orderId,
        name: "Velora Cabs",
        description: `Payment for ride ${bookingId}`,
        prefill: { name: customerName, email: customerEmail, contact: customerPhone },
        theme: { color: "#fbbf24" },
        retry: { enabled: true },
        handler: async (response) => {
          try {
            await verifyPayment(response);
          } catch (error) {
            setCheckoutState("failed");
            setCheckoutMessage(error instanceof Error ? error.message : "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutState((current) => current === "success" || current === "verifying" ? current : "cancelled");
            setCheckoutMessage((current) => current === "Payment verified successfully." ? current : "Checkout was closed. You can retry safely.");
          },
        },
      });
      checkout.on("payment.failed", () => {
        setCheckoutState("failed");
        setCheckoutMessage("Payment failed or was not completed. No payment was recorded.");
      });
      checkout.open();
    } catch (error) {
      setCheckoutState("failed");
      setCheckoutMessage(error instanceof Error ? error.message : "Unable to start payment.");
    }
  }, [bookingDocumentId, bookingId, busy, customerEmail, customerName, customerPhone, onlineEligible, verifyPayment]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black"><WalletCards size={23} /></div>
        <div><h2 className="text-2xl font-bold text-white">Ride Payment</h2><p className="mt-2 text-sm leading-6 text-white/45">Ride completed. The fare below is {fareSnapshot ? "locked by Velora" : "shown from a legacy booking"}.</p></div>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-5">
        <div className="flex items-center gap-2"><ReceiptText size={19} className="text-amber-400" /><h3 className="font-bold text-white">Fare Breakdown</h3></div>
        <div className="mt-5 space-y-3 text-sm">
          {fareSnapshot ? <>
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
          </> : <FareRow label="Legacy recorded fare" value={legacyFarePaise} />}
          <div className="border-t border-white/10 pt-4"><div className="flex items-center justify-between gap-4"><span className="font-bold text-white">Final Fare</span><span className="text-2xl font-extrabold text-amber-400">{formatPaise(totalPayablePaise)}</span></div></div>
        </div>
      </div>

      {corporate ? (
        <StatusCard title="Billed to company" message="No payment is required from the employee or guest. Company billing remains pending." tone="amber" />
      ) : paid ? (
        <StatusCard title="Payment completed" message="This ride has a server-verified completed payment state." tone="green" />
      ) : reviewRequired ? (
        <StatusCard title="Payment state unavailable" message="This legacy ride needs review. Velora has not inferred payment success." tone="amber" />
      ) : (
        <>
          <StatusCard title={cashSelected ? "Cash confirmation pending" : "Payment still due"} message={`Status: ${paymentStatus.replaceAll("_", " ")}. Settlement: ${settlementStatus.replaceAll("_", " ")}.`} tone="amber" />
          <div className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Available payment methods">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              const selected = paymentMethod === option.id;
              return <div key={option.id} className={`rounded-2xl border p-4 ${selected ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-black/20"}`}><Icon size={22} className={selected ? "text-amber-400" : "text-white/40"} /><p className="mt-4 font-bold text-white">{option.label}</p><p className="mt-2 text-xs leading-5 text-white/40">{option.description}</p></div>;
            })}
          </div>
          {checkoutMessage && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm ${checkoutState === "success" ? "border-green-400/20 bg-green-500/10 text-green-200" : checkoutState === "failed" ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-white/10 bg-white/5 text-white/60"}`} role="status" aria-live="polite">{checkoutMessage}</div>}
          <button type="button" onClick={startPayment} disabled={!onlineEligible || busy} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <LoaderCircle size={20} className="animate-spin" /> : <CreditCard size={20} />}
            {checkoutState === "verifying" ? "Verifying Payment" : busy ? "Opening Secure Checkout" : checkoutState === "failed" || checkoutState === "cancelled" ? "Retry Payment" : "Pay Now"}
          </button>
          {cashSelected && <p className="mt-4 text-center text-sm text-white/45">Cash payment is awaiting secure driver confirmation. Online Checkout is unavailable for this ride.</p>}
        </>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-white/35">Booking {bookingId} · Finance schema {financeSchemaVersion || "legacy"}. No payment is marked successful without trusted verification.</p>
    </section>
  );
}

function StatusCard({ title, message, tone }: { title: string; message: string; tone: "green" | "amber" }) {
  const Icon = tone === "green" ? CheckCircle2 : ReceiptText;
  return <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-5 ${tone === "green" ? "border-green-400/20 bg-green-500/10 text-green-200" : "border-amber-400/20 bg-amber-400/10 text-amber-100"}`} role="status"><Icon size={22} className="mt-0.5 shrink-0" /><div><p className="font-bold">{title}</p><p className="mt-1 text-sm opacity-70">{message}</p></div></div>;
}

function FareRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-white/45">{label}</span><span className="font-semibold text-white/80">{formatPaise(value)}</span></div>;
}
