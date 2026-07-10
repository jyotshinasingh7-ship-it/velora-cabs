"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Clock3,
  Route,
  Zap,
} from "lucide-react";

import { db, auth } from "@/lib/firebase";
import BookingMap from "@/components/BookingMap";
import LocationAutocomplete, {
  type SelectedLocation,
} from "@/components/LocationAutocomplete";

type BookingMode = "now" | "schedule";

const createEmptyLocation = (): SelectedLocation => ({
  address: "",
  placeId: "",
  latitude: null,
  longitude: null,
});

function getNumberParameter(
  params: URLSearchParams,
  key: string
): number | null {
  const value = params.get(key);

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export default function BookingPage() {
  const router = useRouter();

  const [bookingMode, setBookingMode] =
    useState<BookingMode>("now");

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const [pickupLocation, setPickupLocation] =
    useState<SelectedLocation>(createEmptyLocation);

  const [dropoffLocation, setDropoffLocation] =
    useState<SelectedLocation>(createEmptyLocation);

  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");

  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const minimumDate = useMemo(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  /*
   * Read journey data sent from the homepage Hero.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const pickupAddress = params.get("pickup") ?? "";
    const pickupPlaceId = params.get("pickupPlaceId") ?? "";

    const dropoffAddress = params.get("dropoff") ?? "";
    const dropoffPlaceId = params.get("dropoffPlaceId") ?? "";

    const requestedBookingType = params.get("bookingType");
    const requestedDate = params.get("date") ?? "";
    const requestedTime = params.get("time") ?? "";

    if (pickupAddress) {
      setPickup(pickupAddress);

      setPickupLocation({
        address: pickupAddress,
        placeId: pickupPlaceId,
        latitude: getNumberParameter(params, "pickupLat"),
        longitude: getNumberParameter(params, "pickupLng"),
      });
    }

    if (dropoffAddress) {
      setDropoff(dropoffAddress);

      setDropoffLocation({
        address: dropoffAddress,
        placeId: dropoffPlaceId,
        latitude: getNumberParameter(params, "dropoffLat"),
        longitude: getNumberParameter(params, "dropoffLng"),
      });
    }

    if (requestedBookingType === "schedule") {
      setBookingMode("schedule");
      setTravelDate(requestedDate);
      setTravelTime(requestedTime);
    }
  }, []);

  const handleBookingModeChange = (mode: BookingMode) => {
    setBookingMode(mode);
    setFormError(null);

    if (mode === "now") {
      setTravelDate("");
      setTravelTime("");
    }
  };

  const handleBooking = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormError(null);

    const cleanPickup = pickup.trim();
    const cleanDropoff = dropoff.trim();

    if (!cleanPickup || !cleanDropoff) {
      setFormError(
        "Please enter pickup and drop-off locations."
      );
      return;
    }

    if (!pickupLocation.placeId) {
      setFormError(
        "Please select the pickup location from Google suggestions."
      );
      return;
    }

    if (!dropoffLocation.placeId) {
      setFormError(
        "Please select the drop-off location from Google suggestions."
      );
      return;
    }

    if (
      pickupLocation.placeId === dropoffLocation.placeId
    ) {
      setFormError(
        "Pickup and drop-off locations cannot be the same."
      );
      return;
    }

    if (distance <= 0 || duration <= 0) {
      setFormError(
        "Please wait while the route, distance and duration are calculated."
      );
      return;
    }

    let scheduledAt: Date | null = null;

    if (bookingMode === "schedule") {
      if (!travelDate || !travelTime) {
        setFormError(
          "Please select both date and time for the scheduled ride."
        );
        return;
      }

      scheduledAt = new Date(`${travelDate}T${travelTime}`);

      const minimumScheduleTime =
        Date.now() + 30 * 60 * 1000;

      if (
        Number.isNaN(scheduledAt.getTime()) ||
        scheduledAt.getTime() < minimumScheduleTime
      ) {
        setFormError(
          "Scheduled rides must be booked at least 30 minutes in advance."
        );
        return;
      }
    }

    if (!auth.currentUser) {
      alert("Please login to book a ride.");

      const returnUrl = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      );

      router.push(`/login?returnUrl=${returnUrl}`);
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "bookings"), {
        userId: auth.currentUser.uid,
        customerEmail: auth.currentUser.email ?? "",

        pickup: pickupLocation.address,
        pickupPlaceId: pickupLocation.placeId,
        pickupLatitude: pickupLocation.latitude,
        pickupLongitude: pickupLocation.longitude,

        dropoff: dropoffLocation.address,
        dropoffPlaceId: dropoffLocation.placeId,
        dropoffLatitude: dropoffLocation.latitude,
        dropoffLongitude: dropoffLocation.longitude,

        bookingType: bookingMode,
        scheduledDate:
          bookingMode === "schedule" ? travelDate : "",
        scheduledTime:
          bookingMode === "schedule" ? travelTime : "",
        scheduledAt:
          bookingMode === "schedule" && scheduledAt
            ? scheduledAt
            : null,

        distanceKm: distance,
        durationMinutes: duration,

        rideStatus: "Pending",
        paymentStatus: "Pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Booking successful!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving booking:", error);
      setFormError(
        "Failed to book your ride. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070c] px-4 pb-12 pt-28 text-white sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-7xl"
      >
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
            Velora Mobility
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Book Your Ride
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
            Select exact Google locations to calculate the route,
            distance and estimated travel time.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-20 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <h2 className="text-xl font-bold">
              Ride Details
            </h2>

            <p className="mt-2 text-sm leading-6 text-white/55">
              Start typing and select your pickup and destination
              from Google suggestions.
            </p>

            <form
              onSubmit={handleBooking}
              className="mt-7 space-y-5"
            >
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() =>
                    handleBookingModeChange("now")
                  }
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    bookingMode === "now"
                      ? "bg-amber-400 text-black"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <Zap size={17} />
                  Book Now
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleBookingModeChange("schedule")
                  }
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    bookingMode === "schedule"
                      ? "bg-amber-400 text-black"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <CalendarDays size={17} />
                  Schedule Ride
                </button>
              </div>

              <LocationAutocomplete
                id="booking-pickup"
                label="Pickup location"
                placeholder="Start typing your pickup location"
                value={pickup}
                type="pickup"
                required
                onChange={(value) => {
                  setPickup(value);
                  setFormError(null);
                  setDistance(0);
                  setDuration(0);
                }}
                onLocationSelect={(location) => {
                  setPickupLocation(location);
                  setFormError(null);
                }}
              />

              <LocationAutocomplete
                id="booking-dropoff"
                label="Drop-off location"
                placeholder="Start typing your destination"
                value={dropoff}
                type="dropoff"
                required
                onChange={(value) => {
                  setDropoff(value);
                  setFormError(null);
                  setDistance(0);
                  setDuration(0);
                }}
                onLocationSelect={(location) => {
                  setDropoffLocation(location);
                  setFormError(null);
                }}
              />

              {bookingMode === "schedule" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label
                      htmlFor="booking-date"
                      className="mb-2 block text-sm font-medium text-white/70"
                    >
                      Ride date
                    </label>

                    <div className="relative">
                      <CalendarDays
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                      />

                      <input
                        id="booking-date"
                        type="date"
                        min={minimumDate}
                        value={travelDate}
                        onChange={(event) => {
                          setTravelDate(event.target.value);
                          setFormError(null);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-11 pr-3 text-sm text-white outline-none transition focus:border-amber-400/60"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="booking-time"
                      className="mb-2 block text-sm font-medium text-white/70"
                    >
                      Ride time
                    </label>

                    <div className="relative">
                      <Clock3
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                      />

                      <input
                        id="booking-time"
                        type="time"
                        value={travelTime}
                        onChange={(event) => {
                          setTravelTime(event.target.value);
                          setFormError(null);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-11 pr-3 text-sm text-white outline-none transition focus:border-amber-400/60"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {bookingMode === "now" && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3">
                  <Zap
                    size={18}
                    className="shrink-0 text-amber-400"
                  />

                  <p className="text-xs leading-5 text-white/55">
                    Your ride will be requested for immediate pickup.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-white/50">
                    <Route size={16} />

                    <span className="text-xs font-medium uppercase tracking-wide">
                      Distance
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-bold">
                    {distance > 0
                      ? `${distance} km`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-white/50">
                    <Clock3 size={16} />

                    <span className="text-xs font-medium uppercase tracking-wide">
                      Duration
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-bold">
                    {duration > 0
                      ? `${duration} min`
                      : "—"}
                  </p>
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
                >
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  distance <= 0 ||
                  duration <= 0
                }
                className="w-full rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Booking Your Ride..."
                  : bookingMode === "schedule"
                    ? "Confirm Scheduled Ride"
                    : "Confirm Booking"}
              </button>
            </form>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-2 shadow-2xl"
          >
            <BookingMap
              pickup={pickup}
              dropoff={dropoff}
              pickupPlaceId={pickupLocation.placeId}
              dropoffPlaceId={dropoffLocation.placeId}
              onDistanceChange={(
                newDistance,
                newDuration
              ) => {
                setDistance(newDistance);
                setDuration(newDuration);
              }}
            />
          </motion.section>
        </div>
      </motion.div>
    </main>
  );
}