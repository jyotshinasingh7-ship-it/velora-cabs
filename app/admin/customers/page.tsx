"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, type Timestamp } from "firebase/firestore";
import { Mail, Phone, Search, UserRoundCheck, UsersRound } from "lucide-react";

import { db } from "@/lib/firebase";

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt?: Timestamp | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => onSnapshot(collection(db, "users"), (snapshot) => {
    setCustomers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as CustomerRecord)).filter((item) => !item.role || item.role === "customer"));
    setLoading(false);
  }, () => setLoading(false)), []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((customer) => !term || [customer.name, customer.email, customer.phoneNumber].some((value) => String(value ?? "").toLowerCase().includes(term)));
  }, [customers, search]);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Customer Management</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Customers</h1>
        <p className="mt-2 text-sm text-white/45">View registered Velora customer accounts and contact details.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard icon={UsersRound} label="Registered Customers" value={customers.length} />
        <SummaryCard icon={UserRoundCheck} label="Visible Results" value={filteredCustomers.length} />
      </div>

      <div className="relative">
        <Search size={19} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or phone..." className="w-full rounded-2xl border border-white/10 bg-white/[0.035] py-4 pl-12 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/50" />
      </div>

      {loading ? (
        <EmptyState text="Loading customers..." />
      ) : filteredCustomers.length === 0 ? (
        <EmptyState text="No customers found." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <article key={customer.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-amber-400/20">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-lg font-extrabold text-black">{(customer.name || customer.email || "C").charAt(0).toUpperCase()}</span>
                <div className="min-w-0"><h2 className="truncate font-bold">{customer.name || "Velora Customer"}</h2><p className="mt-1 text-xs text-white/35">Customer account</p></div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-white/50">
                <div className="flex items-center gap-3"><Mail size={16} className="shrink-0 text-amber-400" /><span className="truncate">{customer.email || "Email not added"}</span></div>
                <div className="flex items-center gap-3"><Phone size={16} className="shrink-0 text-amber-400" /><span>{customer.phoneNumber || "Phone not added"}</span></div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: number }) {
  return <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div><p className="text-sm text-white/40">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400"><Icon size={22} /></span></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-sm text-white/40">{text}</div>;
}
