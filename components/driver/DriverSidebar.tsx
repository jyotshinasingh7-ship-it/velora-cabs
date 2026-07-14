"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CarFront,
  Gauge,
  MapPinned,
  PlusCircle,
} from "lucide-react";

const navigationItems = [
  {
    label: "Dashboard",
    href: "/driver/dashboard",
    icon: Gauge,
  },
  {
    label: "Intercity Requests",
    href: "/driver/intercity",
    icon: MapPinned,
  },
  {
    label: "Publish Intercity Ride",
    href: "/driver/intercity/publish",
    icon: PlusCircle,
  },
];

interface DriverSidebarProps {
  driverName: string;
  driverPhotoURL?: string;
  rating?: number;
  online: boolean;
}

export default function DriverSidebar({
  driverName,
  driverPhotoURL = "",
  rating = 0,
  online,
}: DriverSidebarProps) {
  const pathname = usePathname();

  const initial =
    driverName.trim().charAt(0).toUpperCase() || "D";

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-[#080b12] lg:block">
      <div className="sticky top-0 flex h-screen flex-col p-5">
        <Link
          href="/driver/dashboard"
          className="flex items-center gap-3 px-2"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-black">
            <CarFront size={23} />
          </div>

          <div>
            <p className="text-lg font-extrabold text-white">
              Velora
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              Driver Partner
            </p>
          </div>
        </Link>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-400 text-lg font-bold text-black">
              {driverPhotoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={driverPhotoURL}
                  alt={driverName}
                  className="h-full w-full object-cover"
                />
              ) : (
                initial
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-white">
                {driverName}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    online
                      ? "bg-green-400"
                      : "bg-white/25"
                  }`}
                />

                <span className="text-xs text-white/45">
                  {online ? "Online" : "Offline"}
                </span>

                {rating > 0 && (
                  <span className="text-xs text-amber-300">
                    ★ {rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-7 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              (item.href !== "/driver/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-amber-400 text-black"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Icon size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
          <p className="text-sm font-bold text-white">
            Need assistance?
          </p>

          <p className="mt-2 text-xs leading-5 text-white/45">
            Velora driver support is available 24×7.
          </p>

          <a
            href="tel:+919997997390"
            className="mt-4 block rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-amber-300"
          >
            Call Support
          </a>
        </div>
      </div>
    </aside>
  );
}
