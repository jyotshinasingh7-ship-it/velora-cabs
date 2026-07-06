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
    <aside className="fixed left-0 top-0 h-screen w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl">

      <div className="border-b border-white/10 p-6">

        <h1 className="text-3xl font-extrabold text-cyan-400">
          Velora
        </h1>

        <p className="mt-1 text-sm text-gray-400">
          Admin Panel
        </p>

      </div>

      <nav className="mt-6 px-4">

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
            <span className="text-xl">
              {item.icon}
            </span>

            <span className="font-medium">
              {item.title}
            </span>

          </Link>

        ))}

      </nav>

      <div className="absolute bottom-6 left-4 right-4">

        <button
          onClick={logout}
          className="w-full rounded-xl bg-red-500 py-3 font-bold transition hover:bg-red-600"
        >
          Logout
        </button>

      </div>

    </aside>
  );
}