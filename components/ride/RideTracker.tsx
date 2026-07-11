"use client";

import {
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  XCircle,
} from "lucide-react";

import type {
  Booking,
  RideStatus,
} from "@/types/booking";

import {
  getRideStatusProgress,
  rideStatusLabels,
} from "@/lib/ride/status";

interface RideTrackerProps {
  booking: Booking;
}

const timeline: RideStatus[] = [
  "pending",
  "searching_driver",
  "driver_assigned",
  "driver_arriving",
  "driver_arrived",
  "start_otp_pending",
  "in_progress",
  "stop_otp_pending",
  "completed",
];

const driverVisibleStatuses: RideStatus[] = [
  "driver_assigned",
  "driver_arriving",
  "driver_arrived",
  "start_otp_pending",
  "in_progress",
  "stop_otp_pending",
  "completed",
];

function formatStatusLabel(status: RideStatus) {
  return rideStatusLabels[status];
}

export default function RideTracker({
  booking,
}: RideTrackerProps) {
  const progress = getRideStatusProgress(
    booking.rideStatus
  );

  const currentTimelineIndex =
    booking.rideStatus === "cancelled"
      ? -1
      : timeline.indexOf(booking.rideStatus);

  const shouldShowDriver =
    driverVisibleStatuses.includes(
      booking.rideStatus
    );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Live Ride
          </h2>

          <p className="mt-1 text-sm text-white/45">
            Booking ID: {booking.bookingId}
          </p>
        </div>

        <div
          className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
            booking.rideStatus === "completed"
              ? "bg-green-500/15 text-green-300"
              : booking.rideStatus === "cancelled"
                ? "bg-red-500/15 text-red-300"
                : "bg-amber-400/15 text-amber-300"
          }`}
        >
          {formatStatusLabel(
            booking.rideStatus
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            style={{
              width: `${progress}%`,
            }}
            className={`h-full rounded-full transition-all duration-700 ${
              booking.rideStatus === "cancelled"
                ? "bg-red-400"
                : booking.rideStatus ===
                    "completed"
                  ? "bg-green-400"
                  : "bg-amber-400"
            }`}
          />
        </div>

        <p className="mt-2 text-right text-xs text-white/35">
          {booking.rideStatus === "cancelled"
            ? "Ride cancelled"
            : `${progress}% complete`}
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {timeline.map((status, index) => {
          const isCompleted =
            booking.rideStatus !== "cancelled" &&
            currentTimelineIndex >= index;

          const isCurrent =
            booking.rideStatus === status;

          return (
            <div
              key={status}
              className="flex gap-4"
            >
              <div className="pt-0.5">
                {isCompleted ? (
                  <CheckCircle2
                    size={22}
                    className={
                      isCurrent
                        ? "text-amber-400"
                        : "text-green-400"
                    }
                  />
                ) : (
                  <Circle
                    size={22}
                    className="text-white/20"
                  />
                )}
              </div>

              <div>
                <h3
                  className={`font-semibold ${
                    isCompleted
                      ? "text-white"
                      : "text-white/30"
                  }`}
                >
                  {formatStatusLabel(status)}
                </h3>

                {isCurrent &&
                  booking.rideStatus !==
                    "completed" && (
                    <p className="mt-1 text-xs text-amber-300">
                      Current ride stage
                    </p>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        {booking.rideStatus ===
          "searching_driver" && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] p-6">
            <div className="flex items-center gap-4">
              <Loader2
                className="animate-spin text-amber-400"
                size={28}
              />

              <div>
                <h3 className="text-xl font-bold text-white">
                  Finding Nearby Driver...
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  Please wait while Velora finds
                  the nearest verified available
                  driver.
                </p>
              </div>
            </div>
          </div>
        )}

        {shouldShowDriver && (
          <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-400/20 bg-amber-400/10 text-2xl font-bold text-amber-300">
                {booking.driver?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      booking.driver.photoURL
                    }
                    alt={
                      booking.driver.name ||
                      "Velora driver"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  booking.driver?.name
                    ?.charAt(0)
                    .toUpperCase() || "D"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-2xl font-bold text-white">
                  {booking.driver?.name ||
                    "Driver Assigned"}
                </h3>

                <div className="mt-3 flex flex-wrap gap-3">
                  <span className="rounded-full bg-green-500/15 px-3 py-1 text-sm text-green-300">
                    ★{" "}
                    {booking.driver?.rating ??
                      "New"}
                  </span>

                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-sm text-amber-300">
                    {booking.vehicle?.number ||
                      "Vehicle pending"}
                  </span>
                </div>

                {booking.vehicle && (
                  <p className="mt-3 text-sm text-white/45">
                    {booking.vehicle.name ||
                      booking.vehicle.model}{" "}
                    {booking.vehicle.color
                      ? `• ${booking.vehicle.color}`
                      : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-white/45">
                  <Clock3
                    size={18}
                    className="text-amber-400"
                  />
                  ETA to Pickup
                </div>

                <h4 className="mt-3 text-2xl font-bold text-white">
                  {booking.pickupEtaMinutes !==
                  null
                    ? `${booking.pickupEtaMinutes} min`
                    : "Updating..."}
                </h4>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-white/45">
                  <MapPin
                    size={18}
                    className="text-amber-400"
                  />
                  Driver Distance
                </div>

                <h4 className="mt-3 text-2xl font-bold text-white">
                  {booking.driverDistanceToPickupKm !==
                  null
                    ? `${booking.driverDistanceToPickupKm} km`
                    : "Updating..."}
                </h4>
              </div>
            </div>

            {booking.driver?.phoneNumber && (
              <a
                href={`tel:${booking.driver.phoneNumber}`}
                className="mt-5 flex w-full items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/10 px-5 py-3 font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-black"
              >
                Call Driver
              </a>
            )}
          </div>
        )}

        {(booking.rideStatus ===
          "driver_arrived" ||
          booking.rideStatus ===
            "start_otp_pending") && (
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck
                size={28}
                className="shrink-0 text-amber-400"
              />

              <div>
                <h3 className="text-xl font-bold text-white">
                  Start Ride OTP
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Share the start OTP only
                  after confirming the driver
                  and vehicle details.
                </p>

                <div className="mt-5 inline-flex rounded-2xl border border-amber-400/20 bg-black/25 px-6 py-4 text-2xl font-extrabold tracking-[0.2em] text-amber-400">
                  {booking.otp
                    .startOtpVerified
                    ? "VERIFIED"
                    : "••••••"}
                </div>
              </div>
            </div>
          </div>
        )}

        {booking.rideStatus ===
          "in_progress" && (
          <div className="mt-6 rounded-2xl border border-green-400/20 bg-green-500/10 p-6">
            <div className="flex items-center gap-4">
              <MapPin
                size={28}
                className="shrink-0 text-green-400"
              />

              <div>
                <h3 className="text-xl font-bold text-white">
                  Ride In Progress
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Your journey has started.
                  Live ride updates will appear
                  here.
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.rideStatus ===
          "stop_otp_pending" && (
          <div className="mt-6 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-6">
            <div className="flex items-start gap-4">
              <ShieldCheck
                size={28}
                className="shrink-0 text-orange-400"
              />

              <div>
                <h3 className="text-xl font-bold text-white">
                  End Ride OTP
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Share this OTP only after
                  safely reaching your
                  destination.
                </p>

                <div className="mt-5 inline-flex rounded-2xl border border-orange-400/20 bg-black/25 px-6 py-4 text-2xl font-extrabold tracking-[0.2em] text-orange-300">
                  {booking.otp.stopOtpVerified
                    ? "VERIFIED"
                    : "••••••"}
                </div>
              </div>
            </div>
          </div>
        )}

        {(booking.rideStatus ===
          "stop_otp_pending" ||
          booking.rideStatus ===
            "completed") && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-6">
            <div className="flex items-start gap-4">
              <CreditCard
                size={26}
                className="shrink-0 text-amber-400"
              />

              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  Payment Summary
                </h3>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">
                      Payment Method
                    </span>

                    <span className="font-semibold capitalize text-white">
                      {booking.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-white/45">
                      Payment Status
                    </span>

                    <span className="font-semibold capitalize text-white">
                      {booking.paymentStatus}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
                    <span className="font-semibold text-white">
                      Final Fare
                    </span>

                    <span className="text-xl font-bold text-amber-400">
                      ₹
                      {
                        booking.fare
                          .finalFare
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {booking.rideStatus ===
          "completed" && (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <div className="flex items-start gap-4">
              <Star
                size={27}
                className="shrink-0 fill-yellow-400 text-yellow-400"
              />

              <div>
                <h3 className="text-xl font-bold text-white">
                  Ride Completed
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Thank you for travelling
                  with Velora Mobility.
                </p>

                {booking.rating
                  .customerRating ? (
                  <p className="mt-4 font-semibold text-yellow-300">
                    You rated this ride{" "}
                    {
                      booking.rating
                        .customerRating
                    }
                    /5
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-white/55">
                    Rate your driver to help
                    improve future rides.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {booking.rideStatus ===
          "cancelled" && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
            <div className="flex items-start gap-4">
              <XCircle
                size={28}
                className="shrink-0 text-red-400"
              />

              <div>
                <h3 className="text-xl font-bold text-white">
                  Ride Cancelled
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  {booking.cancellation
                    .cancellationReason ||
                    "This ride has been cancelled."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}