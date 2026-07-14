"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ArrowLeft,
  BusFront,
  CarFront,
  CheckCircle2,
  Crown,
  LoaderCircle,
  Phone,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import LocationAutocomplete, {
  type SelectedLocation,
} from "@/components/LocationAutocomplete";

type TripType =
  | "one-way"
  | "round-trip"
  | "multi-city";

type VehicleType =
  | "sedan"
  | "suv"
  | "premium"
  | "tempo-9"
  | "tempo-12"
  | "tempo-16"
  | "tempo-20"
  | "tempo-26"
  | "mini-bus"
  | "luxury-coach";

interface TourVehicle {
  id: VehicleType;
  name: string;
  capacity: string;
  description: string;
  category: "car" | "tempo" | "bus";
  icon: typeof CarFront;
}

const vehicleOptions: TourVehicle[] = [
  {
    id: "sedan",
    name: "Sedan",
    capacity: "1–4 passengers",
    description:
      "Comfortable option for couples, small families and business tours.",
    category: "car",
    icon: CarFront,
  },
  {
    id: "suv",
    name: "SUV",
    capacity: "4–6 passengers",
    description:
      "Spacious family vehicle for hills, highways and longer journeys.",
    category: "car",
    icon: CarFront,
  },
  {
    id: "premium",
    name: "Premium Luxury",
    capacity: "Up to 6 passengers",
    description:
      "Luxury vehicle for VIP travel, weddings and executive tours.",
    category: "car",
    icon: Crown,
  },
  {
    id: "tempo-9",
    name: "9-Seater Tempo Traveller",
    capacity: "Up to 9 passengers",
    description:
      "Ideal for small group tours and family vacations.",
    category: "tempo",
    icon: BusFront,
  },
  {
    id: "tempo-12",
    name: "12-Seater Tempo Traveller",
    capacity: "Up to 12 passengers",
    description:
      "Comfortable group travel with spacious seating and luggage room.",
    category: "tempo",
    icon: BusFront,
  },
  {
    id: "tempo-16",
    name: "16-Seater Tempo Traveller",
    capacity: "Up to 16 passengers",
    description:
      "Suitable for corporate outings, religious tours and events.",
    category: "tempo",
    icon: BusFront,
  },
  {
    id: "tempo-20",
    name: "20-Seater Tempo Traveller",
    capacity: "Up to 20 passengers",
    description:
      "Large group vehicle for tours, weddings and institutional travel.",
    category: "tempo",
    icon: BusFront,
  },
  {
    id: "tempo-26",
    name: "26-Seater Tempo Traveller",
    capacity: "Up to 26 passengers",
    description:
      "High-capacity group vehicle for long-distance travel.",
    category: "tempo",
    icon: BusFront,
  },
  {
    id: "mini-bus",
    name: "Mini Bus",
    capacity: "20–35 passengers",
    description:
      "Best for large families, corporate teams and school trips.",
    category: "bus",
    icon: BusFront,
  },
  {
    id: "luxury-coach",
    name: "Luxury Coach",
    capacity: "35–50 passengers",
    description:
      "Premium coach for large groups, events and multi-day tours.",
    category: "bus",
    icon: BusFront,
  },
];

const createEmptyLocation = (): SelectedLocation => ({
  address: "",
  placeId: "",
  latitude: null,
  longitude: null,
});

function getTodayDate() {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = String(
    currentDate.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    currentDate.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function generateRequestId() {
  return `VT-${Date.now()
    .toString()
    .slice(-8)}`;
}

export default function CustomToursPage() {
  const router = useRouter();

  const [tripType, setTripType] =
    useState<TripType>("round-trip");

  const [pickup, setPickup] = useState("");
  const [destination, setDestination] =
    useState("");

  const [pickupLocation, setPickupLocation] =
    useState<SelectedLocation>(
      createEmptyLocation()
    );

  const [
    destinationLocation,
    setDestinationLocation,
  ] = useState<SelectedLocation>(
    createEmptyLocation()
  );

  const [additionalStops, setAdditionalStops] =
    useState("");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [pickupTime, setPickupTime] =
    useState("");

  const [passengers, setPassengers] =
    useState("");

  const [vehicleType, setVehicleType] =
    useState<VehicleType>("sedan");

  const [hotelRequired, setHotelRequired] =
    useState(false);

  const [customerName, setCustomerName] =
    useState("");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [email, setEmail] = useState("");

  const [
    specialInstructions,
    setSpecialInstructions,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const minimumDate = useMemo(
    () => getTodayDate(),
    []
  );

  const selectedVehicle =
    vehicleOptions.find(
      (vehicle) =>
        vehicle.id === vehicleType
    ) ?? vehicleOptions[0];

  useEffect(() => {
    async function loadCustomerProfile() {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setProfileLoading(false);
        return;
      }

      setCustomerName(
        currentUser.displayName ?? ""
      );

      setPhoneNumber(
        currentUser.phoneNumber ?? ""
      );

      setEmail(
        currentUser.email ?? ""
      );

      try {
        const profileSnapshot = await getDoc(
          doc(db, "users", currentUser.uid)
        );

        if (!profileSnapshot.exists()) {
          return;
        }

        const profile =
          profileSnapshot.data();

        setCustomerName(
          profile.name ||
            currentUser.displayName ||
            ""
        );

        setPhoneNumber(
          profile.phoneNumber ||
            currentUser.phoneNumber ||
            ""
        );

        setEmail(
          profile.email ||
            currentUser.email ||
            ""
        );
      } catch {
        // Firebase Authentication values remain available.
      } finally {
        setProfileLoading(false);
      }
    }

    void loadCustomerProfile();
  }, []);

  function validateForm() {
    if (!auth.currentUser) {
      return "Please login before submitting a custom tour request.";
    }

    if (customerName.trim().length < 2) {
      return "Please enter your full name.";
    }

    const phoneDigits =
      phoneNumber.replace(/\D/g, "");

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 12
    ) {
      return "Please enter a valid phone number.";
    }

    if (!pickupLocation.placeId) {
      return "Please select pickup from Google suggestions.";
    }

    if (!destinationLocation.placeId) {
      return "Please select destination from Google suggestions.";
    }

    if (
      pickupLocation.placeId ===
      destinationLocation.placeId
    ) {
      return "Pickup and destination cannot be the same.";
    }

    if (!startDate || !pickupTime) {
      return "Please select the start date and pickup time.";
    }

    if (
      tripType !== "one-way" &&
      !endDate
    ) {
      return "Please select the return date.";
    }

    if (
      endDate &&
      new Date(endDate) <
        new Date(startDate)
    ) {
      return "Return date cannot be before the start date.";
    }

    const passengerCount =
      Number(passengers);

    if (
      !Number.isInteger(passengerCount) ||
      passengerCount < 1
    ) {
      return "Please enter a valid passenger count.";
    }

    return null;
  }
    async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const requestId = generateRequestId();

      await addDoc(
        collection(db, "customTourRequests"),
        {
          requestId,

          customerId: currentUser.uid,

          customerName: customerName.trim(),

          customerEmail:
            email.trim() ||
            currentUser.email ||
            "",

          phoneNumber: phoneNumber.trim(),

          tripType,

          pickup: pickupLocation.address,
          pickupPlaceId: pickupLocation.placeId,
          pickupLatitude:
            pickupLocation.latitude,
          pickupLongitude:
            pickupLocation.longitude,

          destination:
            destinationLocation.address,

          destinationPlaceId:
            destinationLocation.placeId,

          destinationLatitude:
            destinationLocation.latitude,

          destinationLongitude:
            destinationLocation.longitude,

          additionalStops:
            additionalStops.trim(),

          startDate,

          endDate:
            tripType === "one-way"
              ? ""
              : endDate,

          pickupTime,

          passengers: Number(passengers),

          vehicleType,

          vehicleName:
            selectedVehicle.name,

          hotelRequired,

          specialInstructions:
            specialInstructions.trim(),

          status: "Pending",

          quotationStatus:
            "Pending",

          quotedAmount: 0,

          adminNotes: "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

      setSuccess(
        `Tour request ${requestId} submitted successfully. Our travel team will contact you shortly.`
      );

      setTripType("round-trip");

      setPickup("");
      setDestination("");

      setPickupLocation(
        createEmptyLocation()
      );

      setDestinationLocation(
        createEmptyLocation()
      );

      setAdditionalStops("");

      setStartDate("");

      setEndDate("");

      setPickupTime("");

      setPassengers("");

      setVehicleType("sedan");

      setHotelRequired(false);

      setSpecialInstructions("");
    } catch (error) {
      console.error(error);

      setError(
        "Unable to submit your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070c] pt-28 pb-20 px-4">

      <div className="mx-auto max-w-7xl">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-amber-400 transition"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        <div className="mt-8 grid xl:grid-cols-[1fr_380px] gap-8">

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8">

            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-amber-400">
              Velora Mobility
            </p>

            <h1 className="mt-4 text-5xl font-extrabold text-white">
              Custom Tours
            </h1>

            <p className="mt-5 max-w-3xl leading-7 text-white/50">
              Plan your family trip,
              corporate travel,
              pilgrimage,
              wedding transportation
              or luxury vacation with
              dedicated vehicles.
            </p>

            {error && (
              <div className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-200">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-8"
            >
                              {/* Trip Type */}

              <div>
                <h2 className="mb-4 text-2xl font-bold text-white">
                  Trip Type
                </h2>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(
                    [
                      {
                        id: "one-way",
                        label: "One Way",
                      },
                      {
                        id: "round-trip",
                        label: "Round Trip",
                      },
                      {
                        id: "multi-city",
                        label: "Multi City",
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setTripType(item.id)
                      }
                      className={`rounded-2xl border p-4 font-semibold transition ${
                        tripType === item.id
                          ? "border-amber-400 bg-amber-400/10 text-amber-300"
                          : "border-white/10 bg-black/20 text-white/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}

              <div className="grid gap-5 lg:grid-cols-2">

                <LocationAutocomplete
                  id="pickup"
                  label="Pickup Location"
                  placeholder="Enter Pickup"
                  value={pickup}
                  type="pickup"
                  required
                  onChange={setPickup}
                  onLocationSelect={
                    setPickupLocation
                  }
                />

                <LocationAutocomplete
                  id="destination"
                  label="Destination"
                  placeholder="Enter Destination"
                  value={destination}
                  type="dropoff"
                  required
                  onChange={setDestination}
                  onLocationSelect={
                    setDestinationLocation
                  }
                />

              </div>

              {tripType ===
                "multi-city" && (
                <textarea
                  rows={3}
                  value={additionalStops}
                  onChange={(e) =>
                    setAdditionalStops(
                      e.target.value
                    )
                  }
                  placeholder="Additional Cities / Stops"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 p-5 outline-none focus:border-amber-400"
                />
              )}

              {/* Dates */}

              <div className="grid gap-5 lg:grid-cols-3">

                <input
                  type="date"
                  min={minimumDate}
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                />

                {tripType !==
                  "one-way" && (
                  <input
                    type="date"
                    min={
                      startDate ||
                      minimumDate
                    }
                    value={endDate}
                    onChange={(e) =>
                      setEndDate(
                        e.target.value
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  />
                )}

                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) =>
                    setPickupTime(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                />

              </div>

              {/* Vehicle Selection */}

              <div>

                <h2 className="mb-5 text-2xl font-bold">
                  Select Vehicle
                </h2>

                <div className="grid gap-4 md:grid-cols-2">

                  {vehicleOptions.map(
                    (vehicle) => {

                      const Icon =
                        vehicle.icon;

                      return (

                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={() =>
                            setVehicleType(
                              vehicle.id
                            )
                          }
                          className={`rounded-3xl border p-6 text-left transition ${
                            vehicleType ===
                            vehicle.id
                              ? "border-amber-400 bg-amber-400/10"
                              : "border-white/10 bg-black/20 hover:border-white/20"
                          }`}
                        >

                          <div className="flex items-center justify-between">

                            <Icon
                              size={34}
                              className="text-amber-400"
                            />

                            {vehicleType ===
                              vehicle.id && (
                              <CheckCircle2 className="text-amber-400" />
                            )}

                          </div>

                          <h3 className="mt-5 text-xl font-bold">
                            {vehicle.name}
                          </h3>

                          <p className="mt-2 text-sm text-white/40">
                            {vehicle.capacity}
                          </p>

                          <p className="mt-3 text-sm leading-6 text-white/55">
                            {vehicle.description}
                          </p>

                        </button>

                      );
                    }
                  )}

                </div>

              </div>

              {/* Passenger Details */}

              <div className="grid gap-5 lg:grid-cols-3">

                <input
                  type="number"
                  placeholder="Passengers"
                  value={passengers}
                  onChange={(e) =>
                    setPassengers(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                />

                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) =>
                    setCustomerName(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(
                      e.target.value
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                />

              </div>

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/20 p-4"
              />

              <textarea
                rows={5}
                value={
                  specialInstructions
                }
                onChange={(e) =>
                  setSpecialInstructions(
                    e.target.value
                  )
                }
                placeholder="Special Requirements, Hotels, Sightseeing, Wedding, Corporate Tour etc."
                className="w-full rounded-2xl border border-white/10 bg-black/20 p-5"
              />

              <label className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-5">

                <input
                  type="checkbox"
                  checked={hotelRequired}
                  onChange={(e) =>
                    setHotelRequired(
                      e.target.checked
                    )
                  }
                />

                Hotel Booking Required

              </label>
                      <button
                type="submit"
                disabled={loading || profileLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 py-5 text-lg font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <LoaderCircle
                    size={20}
                    className="animate-spin"
                  />
                )}

                {loading
                  ? "Submitting Request..."
                  : "Request Custom Quotation"}
              </button>

            </form>

          </section>

          {/* RIGHT SIDEBAR */}

          <aside className="space-y-6">

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl">

              <BusFront
                size={34}
                className="text-amber-400"
              />

              <h2 className="mt-5 text-2xl font-bold">
                Tour Summary
              </h2>

              <div className="mt-6 space-y-4 text-sm">

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Trip
                  </span>

                  <span className="capitalize">
                    {tripType.replace("-", " ")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Vehicle
                  </span>

                  <span>
                    {selectedVehicle.name}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Capacity
                  </span>

                  <span>
                    {selectedVehicle.capacity}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Passengers
                  </span>

                  <span>
                    {passengers || "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/45">
                    Hotel
                  </span>

                  <span>
                    {hotelRequired
                      ? "Required"
                      : "Not Required"}
                  </span>
                </div>

              </div>

            </div>

            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-7">

              <Phone
                size={30}
                className="text-amber-400"
              />

              <h3 className="mt-5 text-xl font-bold">
                Need Immediate Booking?
              </h3>

              <p className="mt-3 text-sm leading-7 text-white/55">
                For urgent departures,
                corporate requirements,
                wedding transportation,
                religious tours or large
                group bookings,
                contact our travel team
                directly.
              </p>

              <a
                href="tel:+919997997390"
                className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-amber-400 px-5 py-4 text-lg font-bold text-black transition hover:bg-amber-300"
              >
                <Phone size={20} />

                +91 99979 97390
              </a>

            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7">

              <h3 className="text-xl font-bold">
                Why Book With Velora?
              </h3>

              <div className="mt-6 space-y-4">

                {[
                  "Verified Drivers",
                  "Luxury & Economy Vehicles",
                  "24×7 Customer Support",
                  "Transparent Pricing",
                  "Dedicated Tour Manager",
                  "GST Invoice Available",
                ].map((item) => (

                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >

                    <CheckCircle2
                      size={18}
                      className="text-amber-400"
                    />

                    <span className="text-white/70">
                      {item}
                    </span>

                  </div>

                ))}

              </div>

            </div>

          </aside>

        </div>

      </div>

    </main>
  );
}
