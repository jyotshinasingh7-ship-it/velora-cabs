"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Vehicle {
  id: string;
  basefare: number;
  perKm: number;
  gst: number;
}

export default function BookingForm() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  const [estimatedFare, setEstimatedFare] = useState(0);

  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    loadVehiclePrices();
  }, []);

  async function loadVehiclePrices() {
    try {
      const snapshot = await getDocs(collection(db, "settings"));

      const data: Vehicle[] = [];

      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...(doc.data() as Omit<Vehicle, "id">),
        });
      });

      setVehicles(data);

      if (data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      console.log(error);
      alert("Unable to load vehicle prices.");
    } finally {
      setLoadingVehicles(false);
    }
  }

  useEffect(() => {
    if (!selectedVehicle) return;

    const demoDistance = 10;

    const fare =
      selectedVehicle.basefare +
      selectedVehicle.perKm * demoDistance;

    const gst =
      (fare * selectedVehicle.gst) / 100;

    setEstimatedFare(Math.round(fare + gst));
  }, [selectedVehicle]);

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

      await addDoc(collection(db, "bookings"), {
        customerName: name,
        phoneNumber: phone,

        pickup,
        drop,

        vehicleType: selectedVehicle.id,

        baseFare: selectedVehicle.basefare,
        perKm: selectedVehicle.perKm,
        gst: selectedVehicle.gst,

        estimatedFare,

        paymentStatus: "Pending",
        rideStatus: "Pending",

        createdAt: serverTimestamp(),
      });

      alert("Ride Booked Successfully!");

      setName("");
      setPhone("");
      setPickup("");
      setDrop("");

      if (vehicles.length > 0) {
        setSelectedVehicle(vehicles[0]);
      }
          } catch (error) {
      console.error(error);
      alert("Booking Failed!");
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">

      {/* LEFT SIDE */}

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
                  Base Fare ₹{vehicle.basefare}
                </p>

              </button>

            ))

          )}

        </div>
              </div>

      {/* RIGHT SIDE */}

      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">

        <h2 className="text-3xl font-bold mb-6">
          Ride Summary
        </h2>

        <div className="space-y-5">

          <div className="flex justify-between">
            <span className="text-gray-400">
              Selected Vehicle
            </span>

            <span className="font-semibold capitalize">
              {selectedVehicle?.id || "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Base Fare
            </span>

            <span>
              ₹{selectedVehicle?.basefare ?? 0}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Price / KM
            </span>

            <span>
              ₹{selectedVehicle?.perKm ?? 0}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              GST
            </span>

            <span>
              {selectedVehicle?.gst ?? 0}%
            </span>
          </div>

          <hr className="border-white/10" />

          <div className="flex justify-between items-center">

            <span className="text-xl font-bold">
              Estimated Fare
            </span>

            <span className="text-3xl font-bold text-cyan-400">
              ₹{estimatedFare}
            </span>

          </div>

        </div>

        <button
          onClick={handleBookRide}
          disabled={bookingLoading}
          className="mt-8 w-full rounded-2xl bg-cyan-500 py-4 text-lg font-bold hover:bg-cyan-600 transition disabled:opacity-50"
        >
          {bookingLoading
            ? "Booking Ride..."
            : "Book Ride"}
        </button>

        <div className="mt-8 h-80 rounded-2xl border border-dashed border-cyan-500/30 bg-slate-900 flex flex-col items-center justify-center">

          <h3 className="text-2xl font-bold">
            Google Maps
          </h3>

          <p className="mt-3 text-center text-gray-400 max-w-xs">
            Live Route, Distance, ETA,
            Fare Calculation and Pickup Marker
            will appear here after Google Maps
            integration.
          </p>

        </div>

      </div>
          </div>
  );
}