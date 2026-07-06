"use client";

import { auth, db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";


interface Vehicle {
  id: string;
  baseFare: number;
  perKm: number;
  minimumKm: number;
  gst: number;
  toll: number;
  parking: number;
  nightCharge: number;
  driverAllowance: number;
  waitingCharge: number;
}

export default function BookingForm() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("cash");

  const [distance, setDistance] = useState(10);
  const [billableKm, setBillableKm] = useState(10);

  const [fareWithoutGST, setFareWithoutGST] =
    useState(0);

  const [gstAmount, setGstAmount] = useState(0);

  const [estimatedFare, setEstimatedFare] =
    useState(0);

  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [bookingLoading, setBookingLoading] =
    useState(false);

  useEffect(() => {
    loadVehiclePrices();
  }, []);

  async function loadVehiclePrices() {
    try {
      const snapshot = await getDocs(
        collection(db, "settings")
      );

      const data: Vehicle[] = [];

      snapshot.forEach((doc) => {
        const vehicle = doc.data();

        data.push({
          id: doc.id,

          baseFare: vehicle.baseFare ?? 0,
          perKm: vehicle.perKm ?? 0,
          minimumKm: vehicle.minimumKm ?? 10,

          gst: vehicle.gst ?? 0,

          toll: vehicle.toll ?? 0,

          parking: vehicle.parking ?? 0,

          nightCharge:
            vehicle.nightCharge ?? 0,

          driverAllowance:
            vehicle.driverAllowance ?? 0,

          waitingCharge:
            vehicle.waitingCharge ?? 0,
        });
      });

      setVehicles(data);

      if (data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to load vehicle pricing.");
    } finally {
      setLoadingVehicles(false);
    }
  }

  function generateBookingId() {
    return (
      "VC-" +
      Date.now().toString().slice(-8)
    );
  }
    useEffect(() => {
    if (!selectedVehicle) return;

    const actualDistance = distance;

    const minimumKm =
      selectedVehicle.minimumKm;

    const billable =
      actualDistance < minimumKm
        ? minimumKm
        : actualDistance;

    setBillableKm(billable);

    const distanceFare =
      billable * selectedVehicle.perKm;

    const subTotal =
      selectedVehicle.baseFare +
      distanceFare;

    setFareWithoutGST(subTotal);

    const gst =
      (subTotal * selectedVehicle.gst) /
      100;

    setGstAmount(Math.round(gst));

    setEstimatedFare(
      Math.round(subTotal + gst)
    );
  }, [selectedVehicle, distance]);
    function resetForm() {
    setName("");
    setPhone("");
    setPickup("");
    setDrop("");

    setPaymentMethod("cash");

    if (vehicles.length > 0) {
      setSelectedVehicle(vehicles[0]);
    }

    setDistance(10);
  }
    async function handleBookRide() {
    if (
      !name ||
      !phone ||
      !pickup ||
      !drop ||
      !selectedVehicle
    ) {
      alert("Please fill all details.");
      return;
    }

    try {
      setBookingLoading(true);

      const bookingId = generateBookingId();

      await addDoc(collection(db, "bookings"), {
        bookingId,

        customerId: auth.currentUser?.uid ?? "",

        customerName: name,
        phoneNumber: phone,

        pickup,
        drop,

        vehicleType: selectedVehicle.id,

        distance,
        billableKm,

        baseFare: selectedVehicle.baseFare,
        perKm: selectedVehicle.perKm,

        fareWithoutGST,

        gstPercentage: selectedVehicle.gst,
        gstAmount,

        estimatedFare,

        toll: 0,
        parking: 0,
        waitingCharge: 0,
        nightCharge: 0,
        driverAllowance: 0,

        finalFare: estimatedFare,

        paymentMethod,

        paymentStatus: "Pending",

        rideStatus: "Pending",

        driverId: "",
        driverName: "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Ride Booked Successfully!");

      resetForm();
    } catch (error) {
      console.error(error);
      alert("Booking Failed!");
    } finally {
      setBookingLoading(false);
    }
  }
    return (
    <div className="grid lg:grid-cols-2 gap-8">

      {/* LEFT PANEL */}

      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-8">

        <h1 className="text-3xl font-bold mb-6">
          Book Your Ride
        </h1>

        <div className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-white/10 p-4 outline-none focus:border-cyan-500"
          />

          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-white/10 p-4 outline-none focus:border-cyan-500"
          />

          <input
            type="text"
            placeholder="Pickup Location"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-white/10 p-4 outline-none focus:border-cyan-500"
          />

          <input
            type="text"
            placeholder="Drop Location"
            value={drop}
            onChange={(e) => setDrop(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-white/10 p-4 outline-none focus:border-cyan-500"
          />

        </div>

        <h2 className="text-2xl font-bold mt-8 mb-5">
          Select Vehicle
        </h2>

        <div className="grid grid-cols-2 gap-4">

          {loadingVehicles ? (

            <div className="col-span-2 text-center text-gray-400">
              Loading Vehicles...
            </div>

          ) : (

            vehicles.map((vehicle) => (

              <button
                key={vehicle.id}
                type="button"
                onClick={() => setSelectedVehicle(vehicle)}
                className={`rounded-2xl p-5 transition border ${
                  selectedVehicle?.id === vehicle.id
                    ? "border-cyan-400 bg-cyan-500/20"
                    : "border-white/10 bg-slate-900"
                }`}
              >

                <h3 className="text-xl font-bold capitalize">
                  {vehicle.id}
                </h3>

                <p className="mt-2 text-cyan-400 font-semibold">
                  ₹{vehicle.perKm}/KM
                </p>

                <p className="text-sm text-gray-400">
                  Base Fare ₹{vehicle.baseFare}
                </p>

              </button>

            ))

          )}

        </div>

        <h2 className="text-2xl font-bold mt-8 mb-4">
          Payment Method
        </h2>

        <div className="grid grid-cols-3 gap-3">

          {["cash", "upi", "razorpay"].map((method) => (

            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className={`rounded-xl p-3 border capitalize ${
                paymentMethod === method
                  ? "border-cyan-400 bg-cyan-500/20"
                  : "border-white/10 bg-slate-900"
              }`}
            >
              {method}
            </button>

          ))}

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">

        <h2 className="text-3xl font-bold mb-6">
          Ride Summary
        </h2>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span>Vehicle</span>
            <span className="capitalize">
              {selectedVehicle?.id}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Distance</span>
            <span>{distance} KM</span>
          </div>

          <div className="flex justify-between">
            <span>Billable KM</span>
            <span>{billableKm} KM</span>
          </div>

          <div className="flex justify-between">
            <span>Base Fare</span>
            <span>₹{selectedVehicle?.baseFare ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span>Price / KM</span>
            <span>₹{selectedVehicle?.perKm ?? 0}</span>
          </div>

          <div className="flex justify-between">
            <span>GST</span>
            <span>₹{gstAmount}</span>
          </div>

          <hr className="border-white/10" />

          <div className="flex justify-between text-xl font-bold">
            <span>Estimated Fare</span>
            <span className="text-cyan-400">
              ₹{estimatedFare}
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Toll, parking, waiting charges and night charges
            will be added only if applicable.
          </p>

        </div>

        <button
          onClick={handleBookRide}
          disabled={bookingLoading}
          className="mt-8 w-full rounded-2xl bg-cyan-500 py-4 text-lg font-bold hover:bg-cyan-600 transition disabled:opacity-50"
        >
          {bookingLoading ? "Booking Ride..." : "Book Ride"}
        </button>

        <div className="mt-8 h-72 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-900 flex items-center justify-center text-gray-400">
          Google Maps Integration Coming Soon
        </div>

      </div>

    </div>
  );
}