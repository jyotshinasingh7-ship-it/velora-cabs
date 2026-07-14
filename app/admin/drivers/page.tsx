"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { CarFront, MapPin, Phone, Star } from "lucide-react";

import { db } from "@/lib/firebase";

interface DriverRecord {
  id: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  vehicleName?: string;
  vehicleNumber?: string;
  rating?: number;
  totalRides?: number;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => onSnapshot(collection(db, "drivers"), (snapshot) => {
    setDrivers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as DriverRecord)));
    setLoading(false);
  }, () => setLoading(false)), []);

  return (
    <div className="space-y-7">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Fleet Operations</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Drivers</h1><p className="mt-2 text-sm text-white/45">Real-time profiles from the Velora driver network.</p></div>
      {loading ? <div className="rounded-3xl border border-dashed border-white/10 py-16 text-center text-white/40">Loading drivers...</div> : drivers.length === 0 ? <div className="rounded-3xl border border-dashed border-white/10 py-16 text-center text-white/40">No driver profiles found.</div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {drivers.map((driver) => {
            const status = String(driver.status ?? "offline").toLowerCase();
            return <article key={driver.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-amber-400/20">
              <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-lg font-extrabold text-black">{(driver.name || "D").charAt(0).toUpperCase()}</span><div><h2 className="font-bold">{driver.name || "Velora Driver"}</h2><p className="mt-1 text-xs text-white/35">{driver.vehicleName || "Vehicle not added"}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${status === "online" ? "bg-emerald-500/10 text-emerald-300" : status === "busy" || status === "on_trip" ? "bg-amber-400/10 text-amber-300" : "bg-white/5 text-white/40"}`}>{status.replace(/_/g, " ")}</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><Metric icon={Star} label="Rating" value={Number(driver.rating ?? 0).toFixed(1)} /><Metric icon={CarFront} label="Trips" value={String(driver.totalRides ?? 0)} /></div>
              <div className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm text-white/45"><p className="flex items-center gap-2"><Phone size={15} className="text-amber-400" />{driver.phoneNumber || "Phone not added"}</p><p className="flex items-center gap-2"><MapPin size={15} className="text-amber-400" />{driver.vehicleNumber || "Vehicle number not added"}</p></div>
            </article>;
          })}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="flex items-center gap-2 text-xs text-white/35"><Icon size={14} className="text-amber-400" />{label}</p><p className="mt-2 font-bold">{value}</p></div>;
}
