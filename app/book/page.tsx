"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { motion } from "framer-motion";

export default function BookingPage() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Please login to book a ride.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "bookings"), {
        userId: auth.currentUser.uid,
        pickup: pickup,
        dropoff: dropoff,
        status: "pending",
        createdAt: new Date(),
      });
      alert("Booking successful!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving booking: ", error);
      alert("Failed to book ride.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
      >
        <h1 className="text-3xl font-bold mb-6">Book Your Ride</h1>
        
        <form onSubmit={handleBooking} className="space-y-4">
          <input
            type="text"
            placeholder="Pickup Location"
            className="w-full p-4 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-500 transition"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Drop-off Location"
            className="w-full p-4 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-500 transition"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {loading ? "Finding Taxi..." : "Find a Taxi"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}