"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((user: any) => user.role === "driver");

        setDrivers(data);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Drivers
      </h1>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        {drivers.map((driver: any) => (

          <div
            key={driver.id}
            className="rounded-2xl border border-white/10 bg-slate-900 p-6"
          >
            <h2 className="text-2xl font-bold">
              {driver.name}
            </h2>

            <p className="mt-2 text-gray-400">
              {driver.email}
            </p>

            <div className="mt-6 rounded-xl bg-green-500/20 p-3 text-center text-green-400">
              Available
            </div>
          </div>

        ))}

      </div>
    </div>
  );
}