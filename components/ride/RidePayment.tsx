"use client";

import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";

import type {
  FareBreakdown,
  PaymentMethod,
  PaymentStatus,
} from "@/types/booking";

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => {
      open: () => void;
      on: (
        event: string,
        callback: (response: unknown) => void
      ) => void;
    };
  }
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (
    response: RazorpaySuccessResponse
  ) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RidePaymentProps {
  bookingDocumentId: string;
  bookingId: string;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  fare: FareBreakdown;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  onPaymentCompleted?: () => void;
}

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

const paymentOptions = [
  {
    id: "cash" as const,
    label: "Cash",
    description: "Pay driver after the ride",
    icon: IndianRupee,
  },
  {
    id: "upi" as const,
    label: "UPI",
    description: "Pay through Razorpay UPI",
    icon: Smartphone,
  },
  {
    id: "razorpay" as const,
    label: "Card / Online",
    description: "Card, net banking or wallet",
    icon: CreditCard,
  },
];

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true),
        { once: true }
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RidePayment({
  bookingDocumentId,
  bookingId,
  customerName,
  customerEmail,
  customerPhone,
  fare,
  paymentMethod,
  paymentStatus,
  onPaymentCompleted,
}: RidePaymentProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>(paymentMethod);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const paymentAlreadyCompleted =
    paymentStatus === "paid";

  async function handleCashPayment() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/payments/cash",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            bookingDocumentId,
            bookingId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to select cash payment."
        );
      }

      setSuccess(
        "Cash payment selected successfully."
      );

      onPaymentCompleted?.();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to update payment."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleOnlinePayment() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const scriptLoaded =
        await loadRazorpayScript();

      if (
        !scriptLoaded ||
        !window.Razorpay
      ) {
        throw new Error(
          "Razorpay checkout could not be loaded."
        );
      }

      const orderResponse = await fetch(
        "/api/payments/razorpay/order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            bookingDocumentId,
            bookingId,
          }),
        }
      );

      const orderData =
        (await orderResponse.json()) as
          | CreateOrderResponse
          | { message?: string };

      if (!orderResponse.ok) {
        throw new Error(
          "message" in orderData
            ? orderData.message ||
                "Unable to create payment order."
            : "Unable to create payment order."
        );
      }

      const {
        orderId,
        amount,
        currency,
        keyId,
      } =
        orderData as CreateOrderResponse;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "Velora Mobility",
        description: `Payment for ${bookingId}`,
        order_id: orderId,

        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },

        notes: {
          bookingId,
          bookingDocumentId,
          paymentMethod: selectedMethod,
        },

        theme: {
          color: "#fbbf24",
        },

        handler: async (
          paymentResponse
        ) => {
          try {
            const verificationResponse =
              await fetch(
                "/api/payments/razorpay/verify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    bookingDocumentId,
                    bookingId,
                    paymentMethod:
                      selectedMethod,
                    razorpayOrderId:
                      paymentResponse.razorpay_order_id,
                    razorpayPaymentId:
                      paymentResponse.razorpay_payment_id,
                    razorpaySignature:
                      paymentResponse.razorpay_signature,
                  }),
                }
              );

            const verificationResult =
              await verificationResponse.json();

            if (
              !verificationResponse.ok
            ) {
              throw new Error(
                verificationResult.message ||
                  "Payment verification failed."
              );
            }

            setSuccess(
              "Payment completed successfully."
            );

            onPaymentCompleted?.();
          } catch (verificationError) {
            setError(
              verificationError instanceof
                Error
                ? verificationError.message
                : "Payment verification failed."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            setError(
              "Payment window was closed."
            );
          },
        },
      });

      razorpay.on(
        "payment.failed",
        () => {
          setLoading(false);
          setError(
            "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to start payment."
      );

      setLoading(false);
    }
  }

  async function handlePayment() {
    if (paymentAlreadyCompleted) {
      return;
    }

    if (selectedMethod === "cash") {
      await handleCashPayment();
      return;
    }

    await handleOnlinePayment();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black">
          <WalletCards size={23} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            Ride Payment
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/45">
            Choose a secure payment method
            and review the final fare.
          </p>
        </div>
      </div>

      <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-5">
        <div className="flex items-center gap-2">
          <ReceiptText
            size={19}
            className="text-amber-400"
          />

          <h3 className="font-bold text-white">
            Fare Breakdown
          </h3>
        </div>

        <div className="mt-5 space-y-3 text-sm">
          <FareRow
            label="Base fare"
            value={fare.baseFare}
          />

          <FareRow
            label="Distance fare"
            value={fare.distanceFare}
          />

          {fare.waitingCharge > 0 && (
            <FareRow
              label="Waiting charge"
              value={fare.waitingCharge}
            />
          )}

          {fare.nightCharge > 0 && (
            <FareRow
              label="Night charge"
              value={fare.nightCharge}
            />
          )}

          {fare.tollCharge > 0 && (
            <FareRow
              label="Toll charge"
              value={fare.tollCharge}
            />
          )}

          {fare.parkingCharge > 0 && (
            <FareRow
              label="Parking charge"
              value={fare.parkingCharge}
            />
          )}

          {fare.driverAllowance > 0 && (
            <FareRow
              label="Driver allowance"
              value={fare.driverAllowance}
            />
          )}

          {fare.cancellationFee > 0 && (
            <FareRow
              label="Cancellation fee"
              value={fare.cancellationFee}
            />
          )}

          {fare.discountAmount > 0 && (
            <FareRow
              label="Discount"
              value={-fare.discountAmount}
            />
          )}

          <FareRow
            label={`GST (${fare.gstPercentage}%)`}
            value={fare.gstAmount}
          />

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-white">
                Final Fare
              </span>

              <span className="text-2xl font-extrabold text-amber-400">
                {formatCurrency(
                  fare.finalFare
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {paymentAlreadyCompleted ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-400/20 bg-green-500/10 p-5 text-green-200">
          <CheckCircle2
            size={22}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-bold">
              Payment completed
            </p>

            <p className="mt-1 text-sm text-green-200/70">
              This ride payment has already
              been received.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {paymentOptions.map(
              (option) => {
                const Icon = option.icon;
                const selected =
                  selectedMethod === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(
                        option.id
                      );
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                      selected
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-white/10 bg-black/20 hover:border-white/20"
                    }`}
                  >
                    <Icon
                      size={22}
                      className={
                        selected
                          ? "text-amber-400"
                          : "text-white/40"
                      }
                    />

                    <p className="mt-4 font-bold text-white">
                      {option.label}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-white/40">
                      {option.description}
                    </p>
                  </button>
                );
              }
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-5 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200"
            >
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={handlePayment}
            disabled={
              loading ||
              fare.finalFare <= 0
            }
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2
                size={20}
                className="animate-spin"
              />
            ) : (
              <ShieldCheck size={20} />
            )}

            {loading
              ? "Processing..."
              : selectedMethod === "cash"
                ? "Confirm Cash Payment"
                : `Pay ${formatCurrency(
                    fare.finalFare
                  )}`}
          </button>
        </>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-white/35">
        Online payments are verified securely
        on the server. Razorpay secret keys are
        never exposed in the browser.
      </p>
    </section>
  );
}

function FareRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/45">
        {label}
      </span>

      <span
        className={`font-semibold ${
          value < 0
            ? "text-green-400"
            : "text-white/80"
        }`}
      >
        {value < 0 ? "- " : ""}
        {formatCurrency(
          Math.abs(value)
        )}
      </span>
    </div>
  );
}