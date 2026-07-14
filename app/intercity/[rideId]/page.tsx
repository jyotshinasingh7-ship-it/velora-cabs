"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, CarFront, CheckCircle2, LoaderCircle, ShieldCheck, Star, UsersRound } from "lucide-react";

import Navbar from "@/components/Navbar";
import { auth } from "@/lib/firebase";

interface RideDetails {
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
  instantBooking: boolean;
  notes: string;
}

export default function IntercityRideDetailsPage() {
  const params = useParams<{ rideId: string }>();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void fetch(`/api/intercity/rides/${params.rideId}`, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { ride?: RideDetails; message?: string };
        if (!response.ok || !result.ride) throw new Error(result.message ?? "Ride not found.");
        setRide(result.ride);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load ride."))
      .finally(() => setLoading(false));
  }, [params.rideId]);

  async function requestSeats() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Please login as a customer before requesting seats.");
      return;
    }
    try {
      setRequesting(true);
      setError("");
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/intercity/requests", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: params.rideId, seatsRequested: seats }),
      });
      const result = (await response.json()) as { status?: string; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to request seats.");
      setSuccess(result.status === "accepted" ? "Seats booked instantly. Complete payment from your Intercity dashboard." : "Seat request sent to the driver.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request seats.");
    } finally {
      setRequesting(false);
    }
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#05070c] text-white"><LoaderCircle className="animate-spin text-amber-400" /></main>;
  if (!ride) return <main className="flex min-h-screen items-center justify-center bg-[#05070c] p-6 text-white"><div className="text-center"><p>{error || "Ride not found."}</p><Link href="/intercity" className="mt-4 inline-block text-amber-400">Back to search</Link></div></main>;

  return (
    <><Navbar /><main className="min-h-screen bg-[#05070c] px-4 pb-20 pt-28 text-white sm:px-6"><div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[32px] border border-white/10 bg-[#0b1018] p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Intercity Journey</p><div className="mt-6"><h1 className="text-2xl font-bold">{ride.origin.address}</h1><div className="my-3 ml-2 h-10 border-l-2 border-dashed border-amber-400/30" /><h2 className="text-2xl font-bold">{ride.destination.address}</h2></div><div className="mt-7 grid gap-3 sm:grid-cols-2"><Info icon={CalendarDays} text={new Date(ride.departureAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })} /><Info icon={UsersRound} text={`${ride.availableSeats} seats available`} /><Info icon={CarFront} text={`${ride.vehicleName} · ${ride.vehicleNumber}`} /><Info icon={ShieldCheck} text={ride.womenOnly ? "Women-only ride" : "Verified shared ride"} /></div>{ride.notes && <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/50">{ride.notes}</div>}<div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-6"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 font-bold text-black">{ride.driverName.charAt(0).toUpperCase()}</span><div><p className="font-bold">{ride.driverName}</p><p className="mt-1 flex items-center gap-1 text-xs text-white/40"><Star size={13} className="fill-amber-400 text-amber-400" />{ride.driverRating.toFixed(1)} · Verified driver</p></div></div></section>
      <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.04] p-6 lg:sticky lg:top-28"><p className="text-sm text-white/45">Price per seat</p><p className="mt-2 text-3xl font-extrabold text-amber-400">₹{ride.pricePerSeat}</p><label className="mt-6 block text-sm font-medium text-white/70">Seats</label><select value={seats} onChange={(event) => setSeats(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1018] p-4 outline-none">{Array.from({ length: Math.min(ride.availableSeats, 6) }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} seat{count > 1 ? "s" : ""}</option>)}</select><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5"><span className="text-white/50">Total</span><span className="text-2xl font-bold">₹{ride.pricePerSeat * seats}</span></div>{error && <p className="mt-4 text-sm text-red-300">{error}</p>}{success && <div className="mt-4 flex gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 size={18} className="shrink-0" />{success}</div>}<button onClick={requestSeats} disabled={requesting || ride.availableSeats < 1 || Boolean(success)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-4 font-bold text-black transition hover:bg-amber-300 disabled:opacity-50">{requesting && <LoaderCircle size={18} className="animate-spin" />}{ride.instantBooking ? "Book Seats" : "Request Seats"}</button></aside>
    </div></main></>
  );
}

function Info({ icon: Icon, text }: { icon: typeof CalendarDays; text: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/55"><Icon size={18} className="shrink-0 text-amber-400" />{text}</div>;
}
