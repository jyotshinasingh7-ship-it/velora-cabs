"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CarFront,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";
import { isEmailVerificationRequired, logoutUser } from "@/lib/auth";

interface CustomerProfile {
  name: string;
  phoneNumber: string;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile>({ name: "", phoneNumber: "", role: "customer" });
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (isEmailVerificationRequired(currentUser)) {
      await logoutUser();
      router.replace("/login?error=email-not-verified");
      return;
    }

    setUser(currentUser);

    try {
      const snapshot = await getDoc(doc(db, "users", currentUser.uid));
      const data = snapshot.data();
      setProfile({
        name: String(data?.name ?? currentUser.displayName ?? ""),
        phoneNumber: String(data?.phoneNumber ?? currentUser.phoneNumber ?? ""),
        role: String(data?.role ?? "customer"),
      });
    } finally {
      setLoading(false);
    }
  }), [router]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070c] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
          <p className="mt-4 text-sm text-white/45">Loading your account...</p>
        </div>
      </main>
    );
  }

  const displayName = profile.name || user?.displayName || "Velora Customer";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 pb-16 pt-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-400/[0.08] blur-[150px]" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-amber-400"><ArrowLeft size={17} /> Dashboard</Link>
          <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"><LogOut size={17} /> Logout</button>
        </div>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1018]/95 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-gradient-to-r from-amber-400/[0.1] via-transparent to-transparent p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-amber-400 text-3xl font-extrabold text-black shadow-[0_16px_45px_rgba(251,191,36,0.18)]">{initial}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-3xl font-bold sm:text-4xl">{displayName}</h1>
                  <BadgeCheck size={22} className="text-amber-400" />
                </div>
                <p className="mt-2 text-sm capitalize text-white/45">{profile.role} account · Velora Mobility</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.35fr_0.65fr]">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Account Details</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ProfileDetail icon={UserRound} label="Full name" value={displayName} />
                <ProfileDetail icon={Mail} label="Email address" value={user?.email || "Not added"} />
                <ProfileDetail icon={Phone} label="Phone number" value={profile.phoneNumber || "Not added"} />
                <ProfileDetail icon={ShieldCheck} label="Email verification" value={user?.emailVerified ? "Verified" : "Verification pending"} accent={user?.emailVerified} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wide text-white/35">Account ID</p>
                <p className="mt-2 break-all font-mono text-xs text-white/55">{user?.uid}</p>
              </div>
            </section>

            <aside>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Quick Actions</p>
              <div className="mt-5 grid gap-3">
                <ActionLink href="/dashboard" icon={CarFront} title="Open Dashboard" description="Book and track rides" />
                <ActionLink href="/book" icon={CalendarDays} title="Book a Ride" description="Plan your next journey" />
                {user?.email && <ActionLink href="/forgot-password" icon={KeyRound} title="Reset Password" description="Secure your account" />}
              </div>
            </aside>
          </div>
        </motion.section>
      </div>
    </main>
  );
}

function ProfileDetail({ icon: Icon, label, value, accent = false }: { icon: typeof UserRound; label: string; value: string; accent?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/35"><Icon size={16} className="text-amber-400" />{label}</div><p className={`mt-3 break-words text-sm font-semibold ${accent ? "text-emerald-300" : "text-white/80"}`}>{value}</p></div>;
}

function ActionLink({ href, icon: Icon, title, description }: { href: string; icon: typeof CarFront; title: string; description: string }) {
  return <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-amber-400/25 hover:bg-amber-400/[0.06]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 transition group-hover:bg-amber-400 group-hover:text-black"><Icon size={19} /></span><span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-white/40">{description}</span></span></Link>;
}
