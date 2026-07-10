"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Phone,
  ShieldCheck,
  Star,
  Zap,
} from "lucide-react";

import LocationAutocomplete, {
  type SelectedLocation,
} from "@/components/LocationAutocomplete";

type BookingMode = "now" | "schedule";

const emptyLocation: SelectedLocation = {
  address: "",
  placeId: "",
  latitude: null,
  longitude: null,
};

export default function Hero() {
  const router = useRouter();

  const [bookingMode, setBookingMode] =
    useState<BookingMode>("now");

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const [pickupLocation, setPickupLocation] =
    useState<SelectedLocation>(emptyLocation);

  const [dropoffLocation, setDropoffLocation] =
    useState<SelectedLocation>(emptyLocation);

  const [travelDate, setTravelDate] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const minimumDate = useMemo(() => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }, []);

  const handleBookingModeChange = (mode: BookingMode) => {
    setBookingMode(mode);
    setFormError(null);

    if (mode === "now") {
      setTravelDate("");
      setTravelTime("");
    }
  };

  const handleQuickBooking = (
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

    if (bookingMode === "schedule") {
      if (!travelDate || !travelTime) {
        setFormError(
          "Please select both date and time for your scheduled ride."
        );
        return;
      }

      const scheduledRideDate = new Date(
        `${travelDate}T${travelTime}`
      );

      const minimumScheduleTime =
        Date.now() + 30 * 60 * 1000;

      if (
        Number.isNaN(scheduledRideDate.getTime()) ||
        scheduledRideDate.getTime() < minimumScheduleTime
      ) {
        setFormError(
          "Scheduled rides must be booked at least 30 minutes in advance."
        );
        return;
      }
    }

    const params = new URLSearchParams({
      pickup: pickupLocation.address,
      pickupPlaceId: pickupLocation.placeId,
      dropoff: dropoffLocation.address,
      dropoffPlaceId: dropoffLocation.placeId,
      bookingType: bookingMode,
    });

    if (pickupLocation.latitude !== null) {
      params.set(
        "pickupLat",
        String(pickupLocation.latitude)
      );
    }

    if (pickupLocation.longitude !== null) {
      params.set(
        "pickupLng",
        String(pickupLocation.longitude)
      );
    }

    if (dropoffLocation.latitude !== null) {
      params.set(
        "dropoffLat",
        String(dropoffLocation.latitude)
      );
    }

    if (dropoffLocation.longitude !== null) {
      params.set(
        "dropoffLng",
        String(dropoffLocation.longitude)
      );
    }

    if (bookingMode === "schedule") {
      params.set("date", travelDate);
      params.set("time", travelTime);
    }

    router.push(`/book?${params.toString()}`);
  };

  return (
    <section
      id="home"
      className="relative isolate min-h-screen overflow-hidden bg-[#05070c] pb-16 pt-28 text-white lg:pb-24 lg:pt-32"
    >
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/hero-car.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.08] blur-sm"
        />
      </div>

      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_25%,rgba(251,191,36,0.13),transparent_30%),radial-gradient(circle_at_20%_45%,rgba(255,255,255,0.06),transparent_30%),linear-gradient(to_bottom,#05070c_5%,rgba(5,7,12,0.88),#05070c)]" />

      <div className="absolute -left-44 top-36 -z-10 h-[420px] w-[420px] rounded-full bg-amber-400/[0.08] blur-[150px]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_470px] lg:gap-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300 sm:text-sm">
            <ShieldCheck size={17} />
            Safe, reliable mobility across India
          </div>

          <h1 className="mt-7 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
            Every journey deserves a
            <span className="block bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              better way to move.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Book local rides, airport transfers, outstation
            journeys and corporate mobility with verified drivers,
            transparent pricing and dependable support.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-bold text-black shadow-[0_18px_45px_rgba(251,191,36,0.18)] transition hover:-translate-y-0.5 hover:bg-amber-300"
            >
              Book a Ride
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/corporate"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 font-semibold text-white transition hover:border-amber-400/30 hover:bg-white/[0.08]"
            >
              <Building2 size={18} />
              Corporate Travel
            </Link>

            <a
              href="tel:+919997997390"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-semibold text-white/65 transition hover:bg-white/[0.05] hover:text-white"
            >
              <Phone size={18} />
              Call Support
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: "24×7", label: "Ride support" },
              { value: "4.9★", label: "Customer rating" },
              { value: "500+", label: "Happy riders" },
              { value: "100%", label: "Verified drivers" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl"
              >
                <p className="text-xl font-bold text-amber-400">
                  {item.value}
                </p>

                <p className="mt-1 text-xs leading-5 text-white/45">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className="text-amber-400"
              />
              Upfront estimated fare
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className="text-amber-400"
              />
              Professional drivers
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2
                size={16}
                className="text-amber-400"
              />
              Live booking updates
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-[36px] bg-amber-400/[0.05] blur-2xl" />

          <form
            onSubmit={handleQuickBooking}
            className="overflow-visible rounded-[30px] border border-white/10 bg-[#0b0e14]/95 shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
          >
            <div className="rounded-t-[30px] border-b border-white/10 px-6 py-6 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
                    Quick fare check
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    Where are you going?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Select exact Google locations to calculate your
                    ride estimate.
                  </p>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-black">
                  <Star size={20} fill="currentColor" />
                </div>
              </div>
            </div>

            <div className="space-y-5 rounded-b-[30px] p-6 sm:p-7">
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() =>
                    handleBookingModeChange("now")
                  }
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    bookingMode === "now"
                      ? "bg-amber-400 text-black shadow-lg"
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
                      ? "bg-amber-400 text-black shadow-lg"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  <CalendarDays size={17} />
                  Schedule Ride
                </button>
              </div>

              <LocationAutocomplete
                id="hero-pickup"
                label="Pickup location"
                placeholder="Start typing your pickup location"
                value={pickup}
                type="pickup"
                required
                onChange={(value) => {
                  setPickup(value);
                  setFormError(null);
                }}
                onLocationSelect={setPickupLocation}
              />

              <LocationAutocomplete
                id="hero-dropoff"
                label="Drop-off location"
                placeholder="Start typing your destination"
                value={dropoff}
                type="dropoff"
                required
                onChange={(value) => {
                  setDropoff(value);
                  setFormError(null);
                }}
                onLocationSelect={setDropoffLocation}
              />

              {bookingMode === "schedule" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div>
                    <label
                      htmlFor="hero-date"
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
                        id="hero-date"
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
                      htmlFor="hero-time"
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
                        id="hero-time"
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
                    Your ride will be requested for immediate pickup
                    after confirming the vehicle and fare.
                  </p>
                </div>
              )}

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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300"
              >
                {bookingMode === "now"
                  ? "Check Fare & Available Cars"
                  : "Check Scheduled Ride Fare"}

                <ArrowRight size={18} />
              </button>

              <p className="text-center text-xs leading-5 text-white/35">
                Final fare may vary due to tolls, parking, waiting
                time or route changes.
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}