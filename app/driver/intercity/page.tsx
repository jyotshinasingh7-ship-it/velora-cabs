"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, MapPin, Plus, UsersRound, X } from "lucide-react";

import { auth } from "@/lib/firebase";

interface DriverSeatRequest {
  id: string;
  passengerName: string;
  passengerPhone: string;
  seatsRequested: number;
  amount: number;
  status: string;
  pickupStop?: { address?: string };
  dropoffStop?: { address?: string };
}

export default function DriverIntercityPage() {
  const [requests, setRequests] = useState<DriverSeatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");

  async function loadRequests() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/intercity/requests?scope=driver", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      const result = (await response.json()) as { requests?: DriverSeatRequest[]; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to load requests.");
      setRequests(result.requests ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) void loadRequests();
      else setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function updateRequest(requestId: string, action: "accept" | "reject") {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      setActionId(requestId);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/intercity/requests", { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ requestId, action }) });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to update request.");
      await loadRequests();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update request.");
    } finally {
      setActionId("");
    }
  }

  return <main className="min-h-screen bg-[#05070c] px-4 py-8 text-white sm:px-6"><div className="mx-auto max-w-5xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Driver Intercity</p><h1 className="mt-2 text-3xl font-bold">Seat Requests</h1><p className="mt-2 text-sm text-white/45">Accept passengers without exceeding available seats.</p></div><Link href="/driver/intercity/publish" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-black"><Plus size={18} />Publish Ride</Link></div>{error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}{loading ? <div className="flex py-20 justify-center"><LoaderCircle className="animate-spin text-amber-400" /></div> : requests.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-white/10 py-20 text-center text-white/40">No seat requests yet.</div> : <div className="mt-8 grid gap-4">{requests.map((request) => <article key={request.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400 font-bold text-black">{request.passengerName.charAt(0).toUpperCase()}</span><div><h2 className="font-bold">{request.passengerName}</h2><p className="text-xs text-white/40">{request.passengerPhone || "Phone unavailable"}</p></div></div><div className="mt-4 flex flex-wrap gap-3 text-sm text-white/50"><span className="flex gap-2"><UsersRound size={16} className="text-amber-400" />{request.seatsRequested} seats</span><span className="flex gap-2"><MapPin size={16} className="text-amber-400" />{request.pickupStop?.address} → {request.dropoffStop?.address}</span></div></div><div className="sm:text-right"><p className="text-xl font-bold text-amber-400">₹{request.amount}</p><span className="mt-2 inline-block rounded-full bg-white/5 px-3 py-1 text-xs capitalize text-white/50">{request.status}</span>{request.status === "pending" && <div className="mt-3 flex gap-2"><button onClick={() => updateRequest(request.id, "reject")} disabled={actionId === request.id} className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 text-red-300"><X size={18} /></button><button onClick={() => updateRequest(request.id, "accept")} disabled={actionId === request.id} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"><Check size={18} />Accept</button></div>}</div></div></article>)}</div>}</div></main>;
}
