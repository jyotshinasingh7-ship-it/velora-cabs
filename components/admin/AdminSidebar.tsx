"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const menu = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: "🏠",
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: "📖",
  },
  {
    title: "Drivers",
    href: "/admin/drivers",
    icon: "🚖",
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: "👥",
  },
  {
    title: "Pricing",
    href: "/admin/pricing",
    icon: "💰",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: "📊",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: "⚙️",
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-slate-950 border-r border-white/10 flex flex-col">

      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-3xl font-bold text-cyan-400">
          Velora
        </h1>

        <p className="text-gray-400 text-sm">
          Admin Panel
        </p>
      </div>

      {/* Scroll Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-6">

        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-2 flex items-center gap-4 rounded-xl px-5 py-4 transition ${
              pathname === item.href
                ? "bg-cyan-500 text-white"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            <span className="text-xl">{item.icon}</span>

            <span>{item.title}</span>
          </Link>
        ))}

      </div>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">

        <button
          onClick={logout}
          className="w-full rounded-xl bg-red-500 py-3 font-bold hover:bg-red-600 transition"
        >
          Logout
        </button>

      </div>

    </aside>
  );
}