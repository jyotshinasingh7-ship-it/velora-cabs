"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, LoaderCircle, UsersRound, XCircle } from "lucide-react";

import Navbar from "@/components/Navbar";
import { auth } from "@/lib/firebase";

interface PassengerRequest {
  id: string;
  rideId: string;
  seatsRequested: number;
  amount: number;
  status: string;
  paymentStatus?: string;
  pickupStop?: { address?: string };
  dropoffStop?: { address?: string };
}

export default function IntercityTripsPage() {
  const [requests, setRequests] = useState<PassengerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  async function loadTrips() {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      setError("Please login to view your Intercity trips.");
      return;
    }
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/intercity/requests", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = (await response.json()) as { requests?: PassengerRequest[]; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to load trips.");
      setRequests(result.requests ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load trips.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => auth.onAuthStateChanged(() => void loadTrips()), []);

  async function cancelRequest(requestId: string) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      setActionId(requestId);
      const token = await user.getIdToken();
      const response = await fetch(`/api/intercity/requests?requestId=${encodeURIComponent(requestId)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to cancel request.");
      await loadTrips();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel request.");
    } finally {
      setActionId("");
    }
  }

  return <><Navbar /><main className="min-h-screen bg-[#05070c] px-4 pb-20 pt-28 text-white sm:px-6"><div className="mx-auto max-w-5xl"><Link href="/intercity" className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 hover:text-amber-400"><ArrowLeft size={17} />Search rides</Link><div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Passenger Intercity</p><h1 className="mt-2 text-3xl font-bold">My Intercity Trips</h1></div>{error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}{loading ? <div className="flex justify-center py-20"><LoaderCircle className="animate-spin text-amber-400" /></div> : requests.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-white/10 py-20 text-center text-white/40">No Intercity trips yet.</div> : <div className="mt-8 grid gap-4">{requests.map((request) => <article key={request.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{request.pickupStop?.address || "Pickup"}</p><p className="my-2 text-amber-400">↓</p><p className="font-bold">{request.dropoffStop?.address || "Destination"}</p><div className="mt-4 flex flex-wrap gap-4 text-sm text-white/45"><span className="flex gap-2"><UsersRound size={16} />{request.seatsRequested} seats</span><span className="flex gap-2"><CalendarDays size={16} />Request #{request.id.slice(-6)}</span></div></div><div className="sm:text-right"><p className="text-2xl font-bold text-amber-400">₹{request.amount}</p><p className="mt-2 text-xs capitalize text-white/45">{request.status} · {request.paymentStatus || "payment pending"}</p><div className="mt-4 flex gap-2 sm:justify-end"><Link href={`/intercity/${request.rideId}`} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold">View Ride</Link>{["pending", "accepted"].includes(request.status) && <button onClick={() => cancelRequest(request.id)} disabled={actionId === request.id} className="flex items-center gap-2 rounded-xl border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-300"><XCircle size={16} />Cancel</button>}</div></div></div></article>)}</div>}</div></main></>;
}
