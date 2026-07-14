"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CalendarDays, CarFront, Luggage, MapPin, Search, ShieldCheck, Star, UsersRound } from "lucide-react";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

interface SearchRide {
  id: string;
  driverName: string;
  driverRating: number;
  vehicleName: string;
  vehicleNumber: string;
  origin: { address: string };
  destination: { address: string };
  departureAt: string;
  availableSeats: number;
  pricePerSeat: number;
  luggageAllowed: boolean;
  womenOnly: boolean;
}

export default function IntercityPage() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(1);
  const [rides, setRides] = useState<SearchRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function searchRides(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ origin, destination, date, seats: String(seats) });
      const response = await fetch(`/api/intercity/rides?${params.toString()}`, { cache: "no-store" });
      const result = (await response.json()) as { rides?: SearchRide[]; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to search rides.");
      setRides(result.rides ?? []);
      setSearched(true);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Unable to search rides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#05070c] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-amber-400/[0.12] via-[#0b1018] to-[#0b1018] p-6 sm:p-10 lg:p-14">
            <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">Velora Intercity</p><h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Share the journey. <span className="text-amber-400">Split the cost.</span></h1><p className="mt-5 max-w-2xl leading-7 text-white/50">Find verified drivers travelling between cities and reserve seats at a clear fixed price.</p></div>

            <form onSubmit={searchRides} className="mt-9 grid gap-3 rounded-3xl border border-white/10 bg-black/25 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_0.45fr_auto]">
              <SearchInput icon={MapPin} value={origin} onChange={setOrigin} placeholder="Leaving from" required />
              <SearchInput icon={MapPin} value={destination} onChange={setDestination} placeholder="Going to" required />
              <label className="relative"><CalendarDays size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" /><input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} className="h-full min-h-14 w-full rounded-2xl border border-white/10 bg-[#0b1018] pl-11 pr-3 text-sm outline-none focus:border-amber-400/50" required /></label>
              <label className="relative"><UsersRound size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" /><select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="h-full min-h-14 w-full rounded-2xl border border-white/10 bg-[#0b1018] pl-11 pr-3 text-sm outline-none">{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count} seat{count > 1 ? "s" : ""}</option>)}</select></label>
              <button type="submit" disabled={loading} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 font-bold text-black transition hover:bg-amber-300 disabled:opacity-50"><Search size={18} />{loading ? "Searching..." : "Search"}</button>
            </form>
          </section>

          {error && <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

          <section className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Available journeys</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Intercity rides</h2></div><div className="flex gap-2"><Link href="/intercity/trips" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/65 transition hover:border-amber-400/25 hover:text-amber-300">My Trips</Link><Link href="/driver/intercity/publish" className="rounded-xl border border-amber-400/25 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/10">Publish a ride</Link></div></div>
            {searched && rides.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-white/10 py-16 text-center text-white/40">No matching rides found. Try another date or nearby city.</div> : (
              <div className="mt-6 grid gap-5 lg:grid-cols-2">{rides.map((ride) => <RideCard key={ride.id} ride={ride} seats={seats} />)}</div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function SearchInput({ icon: Icon, value, onChange, placeholder, required }: { icon: typeof MapPin; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) {
  return <label className="relative"><Icon size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} className="min-h-14 w-full rounded-2xl border border-white/10 bg-[#0b1018] pl-11 pr-4 text-sm outline-none placeholder:text-white/30 focus:border-amber-400/50" /></label>;
}

function RideCard({ ride, seats }: { ride: SearchRide; seats: number }) {
  return <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 transition hover:border-amber-400/25"><div className="flex items-start justify-between gap-4"><div><p className="font-bold">{ride.origin.address}</p><div className="my-2 ml-1 h-6 border-l border-dashed border-amber-400/40" /><p className="font-bold">{ride.destination.address}</p></div><div className="text-right"><p className="text-2xl font-extrabold text-amber-400">₹{ride.pricePerSeat * seats}</p><p className="mt-1 text-xs text-white/35">₹{ride.pricePerSeat} / seat</p></div></div><div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"><p className="flex items-center gap-2 text-white/55"><CalendarDays size={16} className="text-amber-400" />{new Date(ride.departureAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p><p className="flex items-center gap-2 text-white/55"><UsersRound size={16} className="text-amber-400" />{ride.availableSeats} seats left</p><p className="flex items-center gap-2 text-white/55"><CarFront size={16} className="text-amber-400" />{ride.vehicleName}</p><p className="flex items-center gap-2 text-white/55"><Luggage size={16} className="text-amber-400" />{ride.luggageAllowed ? "Luggage allowed" : "Light bags only"}</p></div><div className="mt-5 flex items-center justify-between gap-3"><div><p className="font-semibold">{ride.driverName}</p><p className="mt-1 flex items-center gap-1 text-xs text-white/40"><Star size={13} className="fill-amber-400 text-amber-400" />{ride.driverRating.toFixed(1)} · <ShieldCheck size={13} /> Verified</p></div><Link href={`/intercity/${ride.id}?seats=${seats}`} className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-300">View ride</Link></div></article>;
}
