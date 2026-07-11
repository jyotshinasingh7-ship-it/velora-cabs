"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  Route,
  UserRound,
  UsersRound,
  WalletCards,
  Zap,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import BookingMap from "@/components/BookingMap";
import LocationAutocomplete, {
  type SelectedLocation,
} from "@/components/LocationAutocomplete";

type BookingMode = "now" | "schedule";
type BookingFor = "self" | "someone_else";
type PaymentMethod = "cash" | "upi" | "razorpay";

interface Vehicle {
  id: string;
  name: string;
  description: string;
  seats: number;
  baseFare: number;
  perKm: number;
  minimumKm: number;
  gst: number;
  toll: number;
  parking: number;
  nightCharge: number;
  driverAllowance: number;
  waitingCharge: number;
  enabled: boolean;
}

interface FareDetails {
  billableKm: number;
  distanceFare: number;
  subtotal: number;
  gstAmount: number;
  estimatedFare: number;
}

const createEmptyLocation = (): SelectedLocation => ({
  address: "",
  placeId: "",
  latitude: null,
  longitude: null,
});

const blockedCustomTourKeywords = [
  "tempo",
  "traveller",
  "traveler",
  "bus",
  "coach",
  "mini-bus",
  "minibus",
  "tour",
];

function isCustomTourVehicle(vehicleId: string) {
  const normalizedId = vehicleId.toLowerCase();

  return blockedCustomTourKeywords.some((keyword) =>
    normalizedId.includes(keyword)
  );
}

function formatVehicleName(vehicleId: string) {
  return vehicleId
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function generateBookingId() {
  return `VM-${Date.now()
    .toString()
    .slice(-8)}`;
}

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

export default function BookingForm() {
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [bookingMode, setBookingMode] =
    useState<BookingMode>("now");

  const [bookingFor, setBookingFor] =
    useState<BookingFor>("self");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const [pickupLocation, setPickupLocation] =
    useState<SelectedLocation>(
      createEmptyLocation()
    );

  const [dropoffLocation, setDropoffLocation] =
    useState<SelectedLocation>(
      createEmptyLocation()
    );

  const [travelDate, setTravelDate] =
    useState("");

  const [travelTime, setTravelTime] =
    useState("");

  const [distance, setDistance] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [
    specialInstructions,
    setSpecialInstructions,
  ] = useState("");

  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const minimumDate = useMemo(
    () => getTodayDate(),
    []
  );

  useEffect(() => {
    void loadCustomerProfile();
    void loadVehiclePrices();
  }, []);

  async function loadCustomerProfile() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    setName(
      currentUser.displayName ?? ""
    );

    setPhone(
      currentUser.phoneNumber ?? ""
    );

    try {
      const profileSnapshot = await getDoc(
        doc(db, "users", currentUser.uid)
      );

      if (!profileSnapshot.exists()) {
        return;
      }

      const profile = profileSnapshot.data();

      setName(
        profile.name ||
          currentUser.displayName ||
          ""
      );

      setPhone(
        profile.phoneNumber ||
          currentUser.phoneNumber ||
          ""
      );
    } catch {
      // Firebase Auth values remain available.
    }
  }

  async function loadVehiclePrices() {
    try {
      setLoadingVehicles(true);
      setFormError("");

      const snapshot = await getDocs(
        collection(db, "settings")
      );

      const loadedVehicles: Vehicle[] = [];

      snapshot.forEach((vehicleDocument) => {
        const data = vehicleDocument.data();
        const vehicleId =
          vehicleDocument.id.trim();

        if (
          !vehicleId ||
          isCustomTourVehicle(vehicleId) ||
          data.category === "custom-tour" ||
          data.serviceType === "custom-tour" ||
          data.enabled === false
        ) {
          return;
        }

        loadedVehicles.push({
          id: vehicleId,
          name:
            data.name ||
            formatVehicleName(vehicleId),
          description:
            data.description ||
            "Comfortable ride with a verified Velora driver.",
          seats:
            Number(data.seats) || 4,
          baseFare:
            Number(data.baseFare) || 0,
          perKm:
            Number(data.perKm) || 0,
          minimumKm:
            Number(data.minimumKm) || 1,
          gst:
            Number(data.gst) || 0,
          toll:
            Number(data.toll) || 0,
          parking:
            Number(data.parking) || 0,
          nightCharge:
            Number(data.nightCharge) || 0,
          driverAllowance:
            Number(data.driverAllowance) ||
            0,
          waitingCharge:
            Number(data.waitingCharge) || 0,
          enabled: data.enabled !== false,
        });
      });

      loadedVehicles.sort(
        (firstVehicle, secondVehicle) =>
          firstVehicle.perKm -
          secondVehicle.perKm
      );

      setVehicles(loadedVehicles);

      if (loadedVehicles.length > 0) {
        setSelectedVehicle(
          loadedVehicles[0]
        );
      } else {
        setFormError(
          "No normal ride vehicles are currently available."
        );
      }
    } catch {
      setFormError(
        "Unable to load vehicle pricing."
      );
    } finally {
      setLoadingVehicles(false);
    }
  }

  const fareDetails =
    useMemo<FareDetails>(() => {
      if (
        !selectedVehicle ||
        distance <= 0
      ) {
        return {
          billableKm: 0,
          distanceFare: 0,
          subtotal: 0,
          gstAmount: 0,
          estimatedFare: 0,
        };
      }

      const billableKm = Math.max(
        distance,
        selectedVehicle.minimumKm
      );

      const distanceFare =
        billableKm *
        selectedVehicle.perKm;

      const subtotal =
        selectedVehicle.baseFare +
        distanceFare;

      const gstAmount =
        (subtotal *
          selectedVehicle.gst) /
        100;

      return {
        billableKm: Number(
          billableKm.toFixed(2)
        ),
        distanceFare: Math.round(
          distanceFare
        ),
        subtotal: Math.round(subtotal),
        gstAmount: Math.round(gstAmount),
        estimatedFare: Math.round(
          subtotal + gstAmount
        ),
      };
    }, [distance, selectedVehicle]);

  function resetRoute() {
    setDistance(0);
    setDuration(0);
    setSuccessMessage("");
  }

  function handleBookingModeChange(
    mode: BookingMode
  ) {
    setBookingMode(mode);
    setFormError("");

    if (mode === "now") {
      setTravelDate("");
      setTravelTime("");
    }
  }

  function validateBooking() {
    if (!auth.currentUser) {
      return "Please login before booking a ride.";
    }

    if (name.trim().length < 2) {
      return "Please enter the passenger name.";
    }

    const phoneDigits =
      phone.replace(/\D/g, "");

    if (
      phoneDigits.length < 10 ||
      phoneDigits.length > 12
    ) {
      return "Please enter a valid phone number.";
    }

    if (!pickupLocation.placeId) {
      return "Select the pickup location from Google suggestions.";
    }

    if (!dropoffLocation.placeId) {
      return "Select the destination from Google suggestions.";
    }

    if (
      pickupLocation.placeId ===
      dropoffLocation.placeId
    ) {
      return "Pickup and destination cannot be the same.";
    }

    if (!selectedVehicle) {
      return "Please select a vehicle.";
    }

    if (
      distance <= 0 ||
      duration <= 0
    ) {
      return "Please wait while the route and fare are calculated.";
    }

    if (bookingMode === "schedule") {
      if (!travelDate || !travelTime) {
        return "Select the scheduled ride date and time.";
      }

      const scheduledDate = new Date(
        `${travelDate}T${travelTime}`
      );

      const minimumScheduleTime =
        Date.now() + 30 * 60 * 1000;

      if (
        Number.isNaN(
          scheduledDate.getTime()
        ) ||
        scheduledDate.getTime() <
          minimumScheduleTime
      ) {
        return "Scheduled rides must be booked at least 30 minutes in advance.";
      }
    }

    return null;
  }

  async function handleBookRide(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const validationError =
      validateBooking();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const currentUser =
      auth.currentUser;

    if (
      !currentUser ||
      !selectedVehicle
    ) {
      return;
    }

    try {
      setBookingLoading(true);

      const bookingId =
        generateBookingId();

      const scheduledAt =
        bookingMode === "schedule"
          ? new Date(
              `${travelDate}T${travelTime}`
            )
          : null;

      await addDoc(
        collection(db, "bookings"),
        {
          bookingId,

          customerId: currentUser.uid,
          userId: currentUser.uid,

          customerName: name.trim(),
          customerEmail:
            currentUser.email ?? "",
          phoneNumber: phone.trim(),

          bookingFor,
          bookingType: bookingMode,

          pickup:
            pickupLocation.address,
          pickupPlaceId:
            pickupLocation.placeId,
          pickupLatitude:
            pickupLocation.latitude,
          pickupLongitude:
            pickupLocation.longitude,

          drop:
            dropoffLocation.address,
          dropoff:
            dropoffLocation.address,
          dropoffPlaceId:
            dropoffLocation.placeId,
          dropoffLatitude:
            dropoffLocation.latitude,
          dropoffLongitude:
            dropoffLocation.longitude,

          scheduledDate:
            bookingMode === "schedule"
              ? travelDate
              : "",

          scheduledTime:
            bookingMode === "schedule"
              ? travelTime
              : "",

          scheduledAt,

          vehicleType:
            selectedVehicle.id,
          vehicleName:
            selectedVehicle.name,
          seats: selectedVehicle.seats,

          distance,
          distanceKm: distance,
          durationMinutes: duration,
          billableKm:
            fareDetails.billableKm,

          baseFare:
            selectedVehicle.baseFare,
          perKm:
            selectedVehicle.perKm,
          distanceFare:
            fareDetails.distanceFare,

          fareWithoutGST:
            fareDetails.subtotal,
          gstPercentage:
            selectedVehicle.gst,
          gstAmount:
            fareDetails.gstAmount,

          estimatedFare:
            fareDetails.estimatedFare,
          finalFare:
            fareDetails.estimatedFare,

          toll: 0,
          parking: 0,
          waitingCharge: 0,
          nightCharge: 0,
          driverAllowance: 0,

          paymentMethod,
          paymentStatus: "Pending",

          rideStatus: "Pending",
          status: "Pending",

          driverId: "",
          driverName: "",

          specialInstructions:
            specialInstructions.trim(),

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      setSuccessMessage(
        `Ride ${bookingId} booked successfully.`
      );

      setPickup("");
      setDropoff("");
      setPickupLocation(
        createEmptyLocation()
      );
      setDropoffLocation(
        createEmptyLocation()
      );
      setDistance(0);
      setDuration(0);
      setSpecialInstructions("");
      setTravelDate("");
      setTravelTime("");
      setBookingMode("now");
      setBookingFor("self");
      setPaymentMethod("cash");

      if (vehicles.length > 0) {
        setSelectedVehicle(
          vehicles[0]
        );
      }
    } catch {
      setFormError(
        "Booking failed. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleBookRide}
      className="space-y-7"
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
            handleBookingModeChange(
              "schedule"
            )
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

      <div>
        <p className="mb-3 text-sm font-medium text-white/70">
          Who is travelling?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              setBookingFor("self")
            }
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              bookingFor === "self"
                ? "border-amber-400 bg-amber-400/10 text-amber-300"
                : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            <UserRound size={17} />
            Myself
          </button>

          <button
            type="button"
            onClick={() =>
              setBookingFor(
                "someone_else"
              )
            }
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              bookingFor ===
              "someone_else"
                ? "border-amber-400 bg-amber-400/10 text-amber-300"
                : "border-white/10 bg-black/20 text-white/55"
            }`}
          >
            <UsersRound size={17} />
            Someone Else
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="booking-passenger-name"
            className="mb-2 block text-sm font-medium text-white/70"
          >
            Passenger name
          </label>

          <input
            id="booking-passenger-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(
                event.target.value
              );
              setFormError("");
            }}
            placeholder="Full name"
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60"
            required
          />
        </div>

        <div>
          <label
            htmlFor="booking-phone"
            className="mb-2 block text-sm font-medium text-white/70"
          >
            Phone number
          </label>

          <input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(
                event.target.value
              );
              setFormError("");
            }}
            placeholder="+91 98765 43210"
            className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60"
            required
          />
        </div>
      </div>

      <div className="relative z-30 grid gap-4">
        <LocationAutocomplete
          id="dashboard-pickup"
          label="Pickup location"
          placeholder="Start typing pickup location"
          value={pickup}
          type="pickup"
          required
          onChange={(value) => {
            setPickup(value);
            resetRoute();
            setFormError("");
          }}
          onLocationSelect={(location) => {
            setPickupLocation(
              location
            );
            setFormError("");
          }}
        />

        <LocationAutocomplete
          id="dashboard-dropoff"
          label="Drop-off location"
          placeholder="Start typing destination"
          value={dropoff}
          type="dropoff"
          required
          onChange={(value) => {
            setDropoff(value);
            resetRoute();
            setFormError("");
          }}
          onLocationSelect={(location) => {
            setDropoffLocation(
              location
            );
            setFormError("");
          }}
        />
      </div>

      {bookingMode === "schedule" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="dashboard-date"
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
                id="dashboard-date"
                type="date"
                min={minimumDate}
                value={travelDate}
                onChange={(event) => {
                  setTravelDate(
                    event.target.value
                  );
                  setFormError("");
                }}
                className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-11 pr-3 text-sm outline-none focus:border-amber-400/60"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="dashboard-time"
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
                id="dashboard-time"
                type="time"
                value={travelTime}
                onChange={(event) => {
                  setTravelTime(
                    event.target.value
                  );
                  setFormError("");
                }}
                className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-11 pr-3 text-sm outline-none focus:border-amber-400/60"
                required
              />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-2">
        <BookingMap
          pickup={pickup}
          dropoff={dropoff}
          pickupPlaceId={
            pickupLocation.placeId
          }
          dropoffPlaceId={
            dropoffLocation.placeId
          }
          onDistanceChange={(
            routeDistance,
            routeDuration
          ) => {
            setDistance(
              routeDistance
            );
            setDuration(
              routeDuration
            );
          }}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">
              Select Vehicle
            </h3>

            <p className="mt-1 text-xs text-white/40">
              Tempo Traveller and group vehicles are available only under Custom Tours.
            </p>
          </div>

          <Link
            href="/custom-tours"
            className="shrink-0 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-black"
          >
            Custom Tours
          </Link>
        </div>

        {loadingVehicles ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 py-10 text-sm text-white/45">
            <LoaderCircle
              size={19}
              className="animate-spin text-amber-400"
            />
            Loading vehicles...
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => {
                  setSelectedVehicle(
                    vehicle
                  );
                  setFormError("");
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedVehicle?.id ===
                  vehicle.id
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-white/10 bg-black/20 hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CarFront
                        size={18}
                        className="text-amber-400"
                      />

                      <h4 className="font-bold">
                        {vehicle.name}
                      </h4>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-white/40">
                      {vehicle.description}
                    </p>
                  </div>

                  {selectedVehicle?.id ===
                    vehicle.id && (
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-amber-400"
                    />
                  )}
                </div>

                <div className="mt-4 flex items-end justify-between gap-3">
                  <span className="text-xs text-white/45">
                    Up to {vehicle.seats} seats
                  </span>

                  <span className="font-bold text-amber-400">
                    ₹{vehicle.perKm}/km
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-bold">
          Payment Method
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {(
            [
              {
                id: "cash",
                label: "Cash",
                icon: IndianRupee,
              },
              {
                id: "upi",
                label: "UPI",
                icon: WalletCards,
              },
              {
                id: "razorpay",
                label: "Card",
                icon: CreditCard,
              },
            ] as const
          ).map((method) => {
            const Icon = method.icon;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    method.id
                  )
                }
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-semibold transition ${
                  paymentMethod ===
                  method.id
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-black/20 text-white/55"
                }`}
              >
                <Icon size={19} />
                {method.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="special-instructions"
          className="mb-2 block text-sm font-medium text-white/70"
        >
          Special instructions
        </label>

        <textarea
          id="special-instructions"
          value={specialInstructions}
          onChange={(event) =>
            setSpecialInstructions(
              event.target.value
            )
          }
          rows={3}
          maxLength={300}
          placeholder="Landmark, luggage details or driver instructions"
          className="w-full resize-none rounded-xl border border-white/10 bg-black/25 p-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60"
        />
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-lg font-bold">
          Ride Summary
        </h3>

        <div className="mt-5 space-y-3 text-sm">
          <SummaryRow
            label="Vehicle"
            value={
              selectedVehicle?.name ??
              "Not selected"
            }
          />

          <SummaryRow
            label="Distance"
            value={
              distance > 0
                ? `${distance} km`
                : "—"
            }
          />

          <SummaryRow
            label="Duration"
            value={
              duration > 0
                ? `${duration} min`
                : "—"
            }
          />

          <SummaryRow
            label="Billable distance"
            value={
              fareDetails.billableKm > 0
                ? `${fareDetails.billableKm} km`
                : "—"
            }
          />

          <SummaryRow
            label="Base fare"
            value={`₹${
              selectedVehicle?.baseFare ??
              0
            }`}
          />

          <SummaryRow
            label="Distance fare"
            value={`₹${fareDetails.distanceFare}`}
          />

          <SummaryRow
            label="GST"
            value={`₹${fareDetails.gstAmount}`}
          />

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold">
                Estimated Fare
              </span>

              <span className="text-2xl font-extrabold text-amber-400">
                ₹{fareDetails.estimatedFare}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-white/35">
          <Route
            size={15}
            className="mt-0.5 shrink-0"
          />

          Toll, parking, waiting and night charges are added only when applicable.
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

      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-200"
        >
          {successMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={
          bookingLoading ||
          loadingVehicles ||
          fareDetails.estimatedFare <= 0
        }
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {bookingLoading && (
          <LoaderCircle
            size={19}
            className="animate-spin"
          />
        )}

        {bookingLoading
          ? "Booking Ride..."
          : bookingMode === "schedule"
            ? "Confirm Scheduled Ride"
            : "Confirm Booking"}
      </button>
    </form>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/45">
        {label}
      </span>

      <span className="text-right font-semibold text-white/80">
        {value}
      </span>
    </div>
  );
}