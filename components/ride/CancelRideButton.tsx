"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Loader2,
  XCircle,
} from "lucide-react";

import { auth } from "@/lib/firebase";
import {
  canCustomerCancelRide,
} from "@/lib/ride/status";

import type {
  RideStatus,
} from "@/types/booking";

interface CancelRideButtonProps {
  bookingId: string;
  rideStatus: RideStatus;
}

const reasons = [
  "Driver is taking too long",
  "Booked by mistake",
  "Found another ride",
  "Plans changed",
  "Pickup location changed",
  "Other",
];

export default function CancelRideButton({
  bookingId,
  rideStatus,
}: CancelRideButtonProps) {
  const [loading, setLoading] =
    useState(false);

  const [showDialog, setShowDialog] =
    useState(false);

  const [reason, setReason] =
    useState(reasons[0]);

  if (
    !canCustomerCancelRide(
      rideStatus
    )
  ) {
    return null;
  }

  async function cancelRide() {
    try {
      setLoading(true);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Please login again.");
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/rides/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingDocumentId: bookingId, reason }),
      });

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        throw new Error(result.message ?? "Unable to cancel ride.");
      }

      setShowDialog(false);

      alert(
        "Ride cancelled successfully."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Unable to cancel ride."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() =>
          setShowDialog(true)
        }
        className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 py-4 font-semibold text-red-400 transition hover:bg-red-500 hover:text-white"
      >
        Cancel Ride
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">

          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6">

            <div className="flex items-center gap-3">

              <AlertTriangle className="text-red-400" />

              <h2 className="text-xl font-bold">
                Cancel Ride
              </h2>

            </div>

            <p className="mt-4 text-sm text-gray-400">

              Please tell us why you&apos;re cancelling.

            </p>

            <select
              value={reason}
              onChange={(e) =>
                setReason(
                  e.target.value
                )
              }
              className="mt-5 w-full rounded-xl border border-white/10 bg-slate-900 p-4 outline-none"
            >

              {reasons.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}

            </select>

            <div className="mt-8 flex gap-3">

              <button
                onClick={() =>
                  setShowDialog(false)
                }
                className="flex-1 rounded-xl border border-white/10 py-3"
              >
                Close
              </button>

              <button
                disabled={loading}
                onClick={cancelRide}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 font-bold text-white disabled:opacity-50"
              >

                {loading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <XCircle size={18} />
                )}

                Cancel Ride

              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}
