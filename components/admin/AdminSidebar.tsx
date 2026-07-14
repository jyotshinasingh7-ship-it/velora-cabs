"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  BarChart3,
  BookOpenCheck,
  CarFront,
  Gauge,
  IndianRupee,
  LogOut,
  Settings,
  UsersRound,
  ClipboardCheck,
  Truck,
  Megaphone,
} from "lucide-react";

import { auth } from "@/lib/firebase";

const menu = [
  { title: "Overview", href: "/admin/dashboard", icon: Gauge },
  { title: "Bookings", href: "/admin/bookings", icon: BookOpenCheck },
  { title: "Drivers", href: "/admin/drivers", icon: CarFront },
  { title: "Driver Applications", href: "/admin/driver-applications", icon: ClipboardCheck },
  { title: "Vehicle Applications", href: "/admin/vehicle-applications", icon: Truck },
  { title: "Customers", href: "/admin/customers", icon: UsersRound },
  { title: "Notifications", href: "/admin/notifications", icon: Megaphone },
  { title: "Pricing", href: "/admin/pricing", icon: IndianRupee },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-white/10 bg-[#080b11]/95 backdrop-blur-2xl lg:flex">
        <Link href="/admin/dashboard" className="flex h-24 items-center gap-3 border-b border-white/10 px-6">
          <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-amber-400/20 bg-white/5">
            <Image src="/images/logo.png" alt="Velora" fill sizes="48px" className="object-contain p-1" />
          </span>
          <span>
            <span className="block text-xl font-bold">Velora <span className="text-amber-400">Admin</span></span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-white/35">Operations Console</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6" aria-label="Admin navigation">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition ${active ? "bg-amber-400 text-black shadow-[0_12px_28px_rgba(251,191,36,0.12)]" : "text-white/55 hover:bg-white/[0.06] hover:text-white"}`}>
                <Icon size={19} className={active ? "text-black" : "text-white/35 group-hover:text-amber-400"} />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <button type="button" onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.06] px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-between gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#0b1018]/95 p-2 shadow-2xl backdrop-blur-2xl lg:hidden" aria-label="Mobile admin navigation">
        {menu.filter(item => ["Overview", "Bookings", "Drivers", "Notifications", "Settings"].includes(item.title)).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return <Link key={item.href} href={item.href} aria-label={item.title} className={`flex min-w-12 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${active ? "bg-amber-400 text-black" : "text-white/45"}`}><Icon size={18} />{item.title}</Link>;
        })}
      </nav>
    </>
  );
}
