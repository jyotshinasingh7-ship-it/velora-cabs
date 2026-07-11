"use client";

import { useState } from "react";

import {
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { verifyRideOtp } from "@/lib/ride/otp";

import type { RideStatus } from "@/types/booking";

interface RideOTPProps {
  bookingId: string;

  rideStatus: RideStatus;

  otpHash: string;

  type: "start" | "stop";
}

export default function RideOTP({
  bookingId,
  rideStatus,
  otpHash,
  type,
}: RideOTPProps) {
  const [otp, setOtp] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function verifyOtp() {
    if (otp.length !== 6) {
      alert("Enter valid OTP");
      return;
    }

    if (
      !verifyRideOtp(
        otp,
        otpHash
      )
    ) {
      alert("Incorrect OTP");
      return;
    }

    try {
      setLoading(true);

      if (type === "start") {
        await updateDoc(
          doc(db, "bookings", bookingId),
          {
            "otp.startOtpVerified":
              true,

            rideStatus:
              "in_progress",

            "timeline.startedAt":
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        await updateDoc(
          doc(db, "bookings", bookingId),
          {
            "otp.stopOtpVerified":
              true,

            rideStatus:
              "completed",

            "timeline.completedAt":
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      }

      alert("OTP Verified");
    } catch (error) {
      console.error(error);

      alert("Verification failed");
    } finally {
      setLoading(false);
    }
  }

  if (
    type === "start" &&
    rideStatus !==
      "start_otp_pending"
  )
    return null;

  if (
    type === "stop" &&
    rideStatus !==
      "stop_otp_pending"
  )
    return null;

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">

      <div className="flex items-center gap-3">

        <ShieldCheck className="text-amber-400" />

        <h2 className="text-xl font-bold">

          {type === "start"
            ? "Start Ride OTP"
            : "End Ride OTP"}

        </h2>

      </div>

      <input
        type="text"
        maxLength={6}
        value={otp}
        onChange={(e) =>
          setOtp(
            e.target.value
          )
        }
        placeholder="Enter OTP"
        className="mt-6 w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-center text-2xl tracking-[0.4em] outline-none"
      />

      <button
        onClick={verifyOtp}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-amber-500 py-4 font-bold text-black hover:bg-amber-400 disabled:opacity-50"
      >
        {loading && (
          <Loader2 className="animate-spin" />
        )}

        Verify OTP
      </button>

    </div>
  );
}