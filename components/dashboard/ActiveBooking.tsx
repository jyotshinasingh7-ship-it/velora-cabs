"use client";

import {
  CarFront,
  MapPin,
  Navigation,
  ReceiptText,
} from "lucide-react";

import RideTracker from "@/components/ride/RideTracker";
import DriverCard from "@/components/ride/DriverCard";
import CancelRideButton from "@/components/ride/CancelRideButton";
import RideOTP from "@/components/ride/RideOTP";
import RidePayment from "@/components/ride/RidePayment";
import RateDriver from "@/components/ride/RateDriver";

import {
  canCustomerCancelRide,
  isDriverAssignedStatus,
  normalizeRideStatus,
} from "@/lib/ride/status";

import type {
  Booking,
  PaymentMethod,
  PaymentStatus,
} from "@/types/booking";

interface LegacyBooking {
  id: string;
  bookingId: string;

  customerId?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  phoneNumber?: string;

  pickup: string;
  drop: string;
  dropoff?: string;

  vehicleType: string;
  vehicleName?: string;

  distance?: number;
  distanceKm?: number;
  durationMinutes?: number;
  billableKm?: number;

  baseFare?: number;
  distanceFare?: number;
  fareWithoutGST?: number;
  gstPercentage?: number;
  gstAmount?: number;
  estimatedFare?: number;
  finalFare: number;

  toll?: number;
  tollCharge?: number;
  parking?: number;
  parkingCharge?: number;
  waitingCharge?: number;
  nightCharge?: number;
  driverAllowance?: number;
  cancellationFee?: number;
  discountAmount?: number;

  rideStatus: string;
  status?: string;

  paymentMethod?: string;
  paymentStatus: string;

  bookingType?: "now" | "schedule";
  bookingFor?: "self" | "someone_else";

  scheduledDate?: string;
  scheduledTime?: string;

  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhotoURL?: string;
  driverRating?: number;
  driverTotalRides?: number;

  vehicleId?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleColor?: string;
  vehicleSeats?: number;
  vehiclePhotoURL?: string;

  pickupEtaMinutes?: number | null;
  driverDistanceToPickupKm?: number | null;

  startOtpHash?: string;
  startOtpVerified?: boolean;
  startOtpAttempts?: number;

  stopOtpHash?: string;
  stopOtpVerified?: boolean;
  stopOtpAttempts?: number;

  cancelledBy?: string;
  cancellationReason?: string;
  cancellationNotes?: string;
  cancellationFeeApplied?: number;

  customerRating?: number | null;
  customerReview?: string;

  specialInstructions?: string;
}

interface ActiveBookingProps {
  booking: LegacyBooking | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatVehicleName(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function normalizePaymentStatus(
  value: string
): PaymentStatus {
  const status = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (
    status === "authorized" ||
    status === "paid" ||
    status === "failed" ||
    status === "refunded" ||
    status === "partially_refunded"
  ) {
    return status;
  }

  return "pending";
}

function normalizePaymentMethod(
  value?: string
): PaymentMethod {
  const method = value
    ?.trim()
    .toLowerCase();

  if (
    method === "upi" ||
    method === "razorpay"
  ) {
    return method;
  }

  return "cash";
}

function convertLegacyBooking(
  booking: LegacyBooking
): Booking {
  const finalFare =
    Number(
      booking.finalFare ??
        booking.estimatedFare ??
        0
    ) || 0;

  const baseFare =
    Number(booking.baseFare ?? 0) || 0;

  const distanceFare =
    Number(
      booking.distanceFare ??
        Math.max(
          0,
          Number(
            booking.fareWithoutGST ?? 0
          ) - baseFare
        )
    ) || 0;

  const gstAmount =
    Number(booking.gstAmount ?? 0) || 0;

  const subtotal =
    Number(
      booking.fareWithoutGST ??
        baseFare + distanceFare
    ) || 0;

  const driverId =
    booking.driverId ?? "";

  const vehicleNumber =
    booking.vehicleNumber ?? "";

  return {
    id: booking.id,
    bookingId: booking.bookingId,

    customerId:
      booking.customerId ??
      booking.userId ??
      "",

    customerName:
      booking.customerName ??
      "Velora Customer",

    customerEmail:
      booking.customerEmail ?? "",

    phoneNumber:
      booking.phoneNumber ?? "",

    bookingFor:
      booking.bookingFor ?? "self",

    bookingType:
      booking.bookingType ?? "now",

    pickup: {
      address: booking.pickup ?? "",
      placeId: "",
      latitude: null,
      longitude: null,
    },

    dropoff: {
      address:
        booking.dropoff ??
        booking.drop ??
        "",
      placeId: "",
      latitude: null,
      longitude: null,
    },

    scheduledDate:
      booking.scheduledDate ?? "",

    scheduledTime:
      booking.scheduledTime ?? "",

    scheduledAt: null,

    vehicleType:
      booking.vehicleType ??
      "not-selected",

    vehicleName:
      booking.vehicleName ??
      formatVehicleName(
        booking.vehicleType ??
          "Vehicle"
      ),

    distanceKm:
      Number(
        booking.distanceKm ??
          booking.distance ??
          0
      ) || 0,

    durationMinutes:
      Number(
        booking.durationMinutes ?? 0
      ) || 0,

    billableKm:
      Number(
        booking.billableKm ??
          booking.distanceKm ??
          booking.distance ??
          0
      ) || 0,

    rideStatus: normalizeRideStatus(
      booking.rideStatus ??
        booking.status
    ),

    paymentStatus:
      normalizePaymentStatus(
        booking.paymentStatus
      ),

    paymentMethod:
      normalizePaymentMethod(
        booking.paymentMethod
      ),

    driver: driverId
      ? {
          id: driverId,
          name:
            booking.driverName ??
            "Velora Driver",
          phoneNumber:
            booking.driverPhone ?? "",
          photoURL:
            booking.driverPhotoURL ?? "",
          rating:
            Number(
              booking.driverRating ?? 0
            ) || 0,
          totalRides:
            Number(
              booking.driverTotalRides ?? 0
            ) || 0,
          currentLatitude: null,
          currentLongitude: null,
        }
      : null,

    vehicle:
      driverId || vehicleNumber
        ? {
            id:
              booking.vehicleId ??
              booking.vehicleType ??
              "",
            name:
              booking.vehicleName ??
              formatVehicleName(
                booking.vehicleType ??
                  "Vehicle"
              ),
            model:
              booking.vehicleModel ?? "",
            category:
              booking.vehicleType ?? "",
            number: vehicleNumber,
            color:
              booking.vehicleColor ?? "",
            seats:
              Number(
                booking.vehicleSeats ?? 4
              ) || 4,
            photoURL:
              booking.vehiclePhotoURL ?? "",
          }
        : null,

    pickupEtaMinutes:
      booking.pickupEtaMinutes ?? null,

    driverDistanceToPickupKm:
      booking.driverDistanceToPickupKm ??
      null,

    fare: {
      baseFare,
      distanceFare,
      subtotal,

      gstPercentage:
        Number(
          booking.gstPercentage ?? 0
        ) || 0,

      gstAmount,

      tollCharge:
        Number(
          booking.tollCharge ??
            booking.toll ??
            0
        ) || 0,

      parkingCharge:
        Number(
          booking.parkingCharge ??
            booking.parking ??
            0
        ) || 0,

      waitingCharge:
        Number(
          booking.waitingCharge ?? 0
        ) || 0,

      nightCharge:
        Number(
          booking.nightCharge ?? 0
        ) || 0,

      driverAllowance:
        Number(
          booking.driverAllowance ?? 0
        ) || 0,

      cancellationFee:
        Number(
          booking.cancellationFee ?? 0
        ) || 0,

      discountAmount:
        Number(
          booking.discountAmount ?? 0
        ) || 0,

      finalFare,
    },

    conditionalCharges: {
      tollApplicable:
        Number(
          booking.tollCharge ??
            booking.toll ??
            0
        ) > 0,

      parkingApplicable:
        Number(
          booking.parkingCharge ??
            booking.parking ??
            0
        ) > 0,

      waitingApplicable:
        Number(
          booking.waitingCharge ?? 0
        ) > 0,

      nightChargeApplicable:
        Number(
          booking.nightCharge ?? 0
        ) > 0,

      driverAllowanceApplicable:
        Number(
          booking.driverAllowance ?? 0
        ) > 0,

      freeWaitingMinutes: 0,
      waitingMinutes: 0,
      nightChargeReason: "",
      tollNotes: "",
      parkingNotes: "",
    },

    otp: {
      startOtpHash:
        booking.startOtpHash ?? "",

      startOtpVerified:
        booking.startOtpVerified ??
        false,

      startOtpAttempts:
        Number(
          booking.startOtpAttempts ?? 0
        ) || 0,

      stopOtpHash:
        booking.stopOtpHash ?? "",

      stopOtpVerified:
        booking.stopOtpVerified ??
        false,

      stopOtpAttempts:
        Number(
          booking.stopOtpAttempts ?? 0
        ) || 0,
    },

    timeline: {},

    cancellation: {
      cancelledBy:
        booking.cancelledBy ===
          "customer" ||
        booking.cancelledBy ===
          "driver" ||
        booking.cancelledBy ===
          "admin" ||
        booking.cancelledBy ===
          "system"
          ? booking.cancelledBy
          : "",

      cancellationReason:
        booking.cancellationReason ?? "",

      cancellationNotes:
        booking.cancellationNotes ?? "",

      cancellationFeeApplied:
        Number(
          booking.cancellationFeeApplied ??
            0
        ) || 0,
    },

    rating: {
      customerRating:
        booking.customerRating ?? null,

      customerReview:
        booking.customerReview ?? "",
    },

    razorpay: {
      razorpayOrderId: "",
      razorpayPaymentId: "",
      razorpaySignature: "",
    },

    specialInstructions:
      booking.specialInstructions ?? "",
  };
}

export default function ActiveBooking({
  booking,
}: ActiveBookingProps) {
  if (!booking) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <CarFront size={21} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              Active Booking
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Live ride updates will appear here.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-10 text-center">
          <CarFront
            size={36}
            className="mx-auto text-white/20"
          />

          <p className="mt-4 text-lg font-semibold text-white">
            No Active Ride
          </p>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/40">
            Book a ride to view driver assignment,
            live status, OTP, payment and tracking.
          </p>
        </div>
      </section>
    );
  }

  const normalizedBooking =
    convertLegacyBooking(booking);

  const shouldShowDriver =
    isDriverAssignedStatus(
      normalizedBooking.rideStatus
    );

  const shouldShowStartOtp =
    normalizedBooking.rideStatus ===
    "start_otp_pending";

  const shouldShowStopOtp =
    normalizedBooking.rideStatus ===
    "stop_otp_pending";

  const shouldShowPayment =
    normalizedBooking.rideStatus ===
      "stop_otp_pending" ||
    normalizedBooking.rideStatus ===
      "completed";

  const shouldShowRating =
    normalizedBooking.rideStatus ===
      "completed" &&
    normalizedBooking.paymentStatus ===
      "paid";

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Active Booking
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {normalizedBooking.bookingId}
            </h2>

            <p className="mt-2 text-sm text-white/40">
              {normalizedBooking.vehicleName}
            </p>
          </div>

          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-white/40">
              Estimated Fare
            </p>

            <p className="mt-1 text-xl font-bold text-amber-400">
              {formatCurrency(
                normalizedBooking.fare.finalFare
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <MapPin
              size={19}
              className="mt-0.5 shrink-0 text-green-400"
            />

            <div>
              <p className="text-xs uppercase tracking-wide text-white/35">
                Pickup
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-white/80">
                {normalizedBooking.pickup.address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <Navigation
              size={19}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-xs uppercase tracking-wide text-white/35">
                Destination
              </p>

              <p className="mt-1 text-sm font-semibold leading-6 text-white/80">
                {
                  normalizedBooking.dropoff
                    .address
                }
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-white/35">
              Distance
            </p>

            <p className="mt-2 font-bold text-white">
              {normalizedBooking.distanceKm >
              0
                ? `${normalizedBooking.distanceKm} km`
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wide text-white/35">
              Duration
            </p>

            <p className="mt-2 font-bold text-white">
              {normalizedBooking.durationMinutes >
              0
                ? `${normalizedBooking.durationMinutes} min`
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 text-white/45">
            <ReceiptText size={17} />
            Payment
          </div>

          <span className="text-sm font-semibold capitalize text-white/80">
            {normalizedBooking.paymentStatus}
          </span>
        </div>
      </div>

      <RideTracker
        booking={normalizedBooking}
      />

      {canCustomerCancelRide(
        normalizedBooking.rideStatus
      ) && (
        <div className="rounded-[28px] border border-red-400/15 bg-red-500/[0.05] p-6">
          <h3 className="text-lg font-bold text-white">
            Need to cancel?
          </h3>

          <p className="mt-2 text-sm leading-6 text-white/45">
            You can cancel this ride before a
            driver accepts it.
          </p>

          <div className="mt-5">
            <CancelRideButton
              bookingId={
                normalizedBooking.id
              }
              rideStatus={
                normalizedBooking.rideStatus
              }
            />
          </div>
        </div>
      )}

      {shouldShowDriver && (
        <DriverCard
          driver={normalizedBooking.driver}
          vehicle={
            normalizedBooking.vehicle
          }
          pickupEtaMinutes={
            normalizedBooking.pickupEtaMinutes
          }
          driverDistanceKm={
            normalizedBooking.driverDistanceToPickupKm
          }
        />
      )}

      {shouldShowStartOtp && (
        <RideOTP
          bookingId={
            normalizedBooking.id
          }
          rideStatus={
            normalizedBooking.rideStatus
          }
          otpHash={
            normalizedBooking.otp
              .startOtpHash
          }
          type="start"
        />
      )}

      {shouldShowStopOtp && (
        <RideOTP
          bookingId={
            normalizedBooking.id
          }
          rideStatus={
            normalizedBooking.rideStatus
          }
          otpHash={
            normalizedBooking.otp
              .stopOtpHash
          }
          type="stop"
        />
      )}

      {shouldShowPayment && (
        <RidePayment
          bookingDocumentId={
            normalizedBooking.id
          }
          bookingId={
            normalizedBooking.bookingId
          }
          customerName={
            normalizedBooking.customerName
          }
          customerEmail={
            normalizedBooking.customerEmail
          }
          customerPhone={
            normalizedBooking.phoneNumber
          }
          fare={normalizedBooking.fare}
          paymentMethod={
            normalizedBooking.paymentMethod
          }
          paymentStatus={
            normalizedBooking.paymentStatus
          }
        />
      )}

      {shouldShowRating && (
        <RateDriver
          bookingDocumentId={
            normalizedBooking.id
          }
          bookingId={
            normalizedBooking.bookingId
          }
          driverId={
            normalizedBooking.driver?.id ??
            ""
          }
          driverName={
            normalizedBooking.driver?.name ??
            "Velora Driver"
          }
          existingRating={
            normalizedBooking.rating
              .customerRating
          }
          existingReview={
            normalizedBooking.rating
              .customerReview
          }
        />
      )}

      {normalizedBooking.rideStatus ===
        "completed" &&
        normalizedBooking.paymentStatus !==
          "paid" && (
          <div className="rounded-[28px] border border-amber-400/20 bg-amber-400/[0.07] p-6">
            <h3 className="text-lg font-bold text-white">
              Payment Pending
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/50">
              Complete the ride payment before
              submitting the driver rating.
            </p>
          </div>
        )}
    </section>
  );
}