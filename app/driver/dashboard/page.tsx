"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";

import DriverHeader from "@/components/driver/DriverHeader";
import DriverStats from "@/components/driver/DriverStats";
import DriverMap from "@/components/driver/DriverMap";
import RideRequestCard from "@/components/driver/RideRequestCard";

export default function DriverDashboard() {
  const router = useRouter();

  const [rides, setRides] = useState<any[]>([]);
  const [driverName, setDriverName] = useState("Driver");
  const [online, setOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/driver/login");
        return;
      }

      setDriverName(user.displayName || "Driver");

      await fetchRides();

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function fetchRides() {
    const snap = await getDocs(collection(db, "bookings"));

    const data = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setRides(data);
  }

  async function updateStatus(
    id: string,
    status: string
  ) {
    await updateDoc(doc(db, "bookings", id), {
      status,
    });

    fetchRides();
  }

  async function logout() {
    await signOut(auth);
    router.push("/driver/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="mx-auto max-w-7xl space-y-8 p-8">

        <DriverHeader
          driverName={driverName}
          online={online}
          setOnline={setOnline}
          logout={logout}
        />

        <DriverStats
          totalRides={rides.length}
        />

        <DriverMap />

        <div>

          <h2 className="mb-5 text-3xl font-bold">
            Pending Ride Requests
          </h2>

          <div className="space-y-5">

            {rides.length === 0 ? (

              <div className="rounded-2xl bg-white/5 p-10 text-center text-gray-400">

                No Ride Available

              </div>

            ) : (

              rides.map((ride) => (

                <RideRequestCard
                  key={ride.id}
                  ride={ride}
                  updateStatus={updateStatus}
                />

              ))

            )}

          </div>

        </div>

      </div>

    </div>
  );
}