"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";

export default function DriverDashboard() {
  const [rides, setRides] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const driverEmail = "driver@velora.com";
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || user.email !== driverEmail) {
        router.push("/driver/login");
      } else {
        fetchRides();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const fetchRides = async () => {
    const querySnapshot = await getDocs(collection(db, "bookings"));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setRides(data);
  };

  // Status update karne ka function
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: newStatus });
      alert(`Ride status updated to ${newStatus}!`);
      fetchRides();
    } catch (error) {
      alert("Error updating status");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <h1 className="text-3xl font-bold mb-8 text-green-500">Driver Dashboard</h1>
      <div className="grid gap-6">
        {rides.map((ride: any) => (
          <div key={ride.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="font-bold text-lg">{ride.pickup} → {ride.dropoff}</p>
            <p className="text-sm text-yellow-500 mb-4">Status: {ride.status || "pending"}</p>
            
            {/* Dynamic Buttons based on Status */}
            <div className="flex gap-2">
              {ride.status === "pending" && (
                <button onClick={() => updateStatus(ride.id, "accepted")} className="px-4 py-2 bg-blue-600 rounded">Accept</button>
              )}
              {ride.status === "accepted" && (
                <button onClick={() => updateStatus(ride.id, "ongoing")} className="px-4 py-2 bg-yellow-600 rounded">Start Ride</button>
              )}
              {ride.status === "ongoing" && (
                <button onClick={() => updateStatus(ride.id, "completed")} className="px-4 py-2 bg-green-600 rounded">Complete Ride</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}