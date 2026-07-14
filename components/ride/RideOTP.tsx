"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { auth } from "@/lib/firebase";
import type { RideStatus } from "@/types/booking";

interface RideOTPProps {
  bookingId: string;
  rideStatus: RideStatus;
  otpHash: string;
  type: "start" | "stop";
}

export default function RideOTP({ bookingId, rideStatus, type }: RideOTPProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOtp() {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("Please login again.");

        const token = await currentUser.getIdToken();
        const response = await fetch(
          `/api/rides/otp?bookingDocumentId=${encodeURIComponent(bookingId)}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
        );
        const result = (await response.json()) as { otp?: string; message?: string };
        if (!response.ok) throw new Error(result.message ?? "Unable to load OTP.");
        if (!cancelled) setOtp(result.otp ?? "");
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load OTP.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOtp();
    return () => { cancelled = true; };
  }, [bookingId, rideStatus]);

  const expectedStatus = type === "start" ? "start_otp_pending" : "stop_otp_pending";
  if (rideStatus !== expectedStatus) return null;

  return (
    <section className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-amber-400" />
        <h2 className="text-xl font-bold">{type === "start" ? "Start Ride OTP" : "End Ride OTP"}</h2>
      </div>

      <p className="mt-3 text-sm leading-6 text-white/55">
        Ye OTP sirf assigned driver ko batayein. Driver OTP verify karke ride {type === "start" ? "start" : "complete"} karega.
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5 text-center">
        {loading ? (
          <Loader2 className="mx-auto animate-spin text-amber-400" />
        ) : error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : (
          <p className="text-3xl font-extrabold tracking-[0.35em] text-amber-300">{otp || "------"}</p>
        )}
      </div>
    </section>
  );
}
