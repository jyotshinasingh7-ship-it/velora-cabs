"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, IndianRupee, LoaderCircle, Luggage, ShieldCheck, UsersRound } from "lucide-react";

import LocationAutocomplete, { type SelectedLocation } from "@/components/LocationAutocomplete";
import { auth } from "@/lib/firebase";

const emptyLocation = (): SelectedLocation => ({ address: "", placeId: "", latitude: null, longitude: null });

export default function PublishIntercityRidePage() {
  const router = useRouter();
  const [originText, setOriginText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [origin, setOrigin] = useState<SelectedLocation>(emptyLocation());
  const [destination, setDestination] = useState<SelectedLocation>(emptyLocation());
  const [departureAt, setDepartureAt] = useState("");
  const [totalSeats, setTotalSeats] = useState(1);
  const [pricePerSeat, setPricePerSeat] = useState("");
  const [luggageAllowed, setLuggageAllowed] = useState(true);
  const [womenOnly, setWomenOnly] = useState(false);
  const [instantBooking, setInstantBooking] = useState(false);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function publishRide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push("/driver/login");
      return;
    }
    if (!origin.placeId || !destination.placeId) {
      setError("Select origin and destination from Google suggestions.");
      return;
    }

    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch("/api/intercity/rides", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, departureAt, totalSeats, pricePerSeat: Number(pricePerSeat), luggageAllowed, womenOnly, instantBooking, notes }),
      });
      const result = (await response.json()) as { rideId?: string; message?: string };
      if (!response.ok) throw new Error(result.message ?? "Unable to publish ride.");
      router.push(`/intercity/${result.rideId}`);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Unable to publish ride.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#05070c] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/driver/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-amber-400"><ArrowLeft size={17} /> Driver dashboard</Link>
        <section className="mt-7 rounded-[32px] border border-white/10 bg-[#0b1018] p-5 shadow-2xl sm:p-8">
          <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-black"><ShieldCheck size={23} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Verified Driver</p><h1 className="mt-2 text-3xl font-bold">Publish an intercity ride</h1><p className="mt-2 text-sm leading-6 text-white/45">Share empty seats with passengers travelling on your route.</p></div></div>

          <form onSubmit={publishRide} className="mt-8 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2"><LocationAutocomplete id="intercity-origin" label="Leaving from" placeholder="Select city or pickup point" value={originText} type="pickup" required onChange={(value) => { setOriginText(value); setOrigin(emptyLocation()); }} onLocationSelect={setOrigin} /><LocationAutocomplete id="intercity-destination" label="Going to" placeholder="Select city or drop point" value={destinationText} type="dropoff" required onChange={(value) => { setDestinationText(value); setDestination(emptyLocation()); }} onLocationSelect={setDestination} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Departure date & time" icon={CalendarDays}><input type="datetime-local" value={departureAt} onChange={(event) => setDepartureAt(event.target.value)} className="field-input" required /></Field>
              <Field label="Available seats" icon={UsersRound}><select value={totalSeats} onChange={(event) => setTotalSeats(Number(event.target.value))} className="field-input">{[1,2,3,4,5,6].map((count) => <option key={count} value={count}>{count}</option>)}</select></Field>
              <Field label="Price per seat" icon={IndianRupee}><input type="number" min={50} max={10000} value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} placeholder="500" className="field-input" required /></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3"><Toggle checked={luggageAllowed} onChange={setLuggageAllowed} label="Luggage allowed" icon={Luggage} /><Toggle checked={womenOnly} onChange={setWomenOnly} label="Women only" icon={ShieldCheck} /><Toggle checked={instantBooking} onChange={setInstantBooking} label="Instant booking" icon={UsersRound} /></div>
            <div><label htmlFor="intercity-notes" className="mb-2 block text-sm font-medium text-white/70">Trip notes</label><textarea id="intercity-notes" rows={4} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Pickup flexibility, luggage space, travel preferences..." className="w-full resize-none rounded-2xl border border-white/10 bg-black/25 p-4 text-sm outline-none placeholder:text-white/25 focus:border-amber-400/50" /></div>
            {error && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:opacity-50">{loading && <LoaderCircle size={19} className="animate-spin" />}{loading ? "Publishing ride..." : "Publish Intercity Ride"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof CalendarDays; children: React.ReactNode }) {
  return <label><span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70"><Icon size={16} className="text-amber-400" />{label}</span>{children}</label>;
}

function Toggle({ checked, onChange, label, icon: Icon }: { checked: boolean; onChange: (value: boolean) => void; label: string; icon: typeof Luggage }) {
  return <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition ${checked ? "border-amber-400/30 bg-amber-400/10 text-amber-300" : "border-white/10 bg-black/20 text-white/45"}`}><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="sr-only" /><Icon size={18} />{label}</label>;
}
