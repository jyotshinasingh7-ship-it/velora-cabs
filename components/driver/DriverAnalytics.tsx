"use client";

import {
  BadgeCheck,
  CircleDollarSign,
  Clock3,
  Gauge,
  Route,
  Star,
  XCircle,
} from "lucide-react";

interface DriverAnalyticsProps {
  todayTrips: number;
  todayEarnings: number;
  rating: number;
  onlineHours: number;
  acceptanceRate: number;
  cancellationRate: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function DriverAnalytics({
  todayTrips,
  todayEarnings,
  rating,
  onlineHours,
  acceptanceRate,
  cancellationRate,
}: DriverAnalyticsProps) {
  const cards = [
    {
      label: "Today's Trips",
      value: todayTrips.toString(),
      helper: "Completed rides today",
      icon: Route,
    },
    {
      label: "Today's Earnings",
      value: formatCurrency(todayEarnings),
      helper: "Net ride earnings",
      icon: CircleDollarSign,
    },
    {
      label: "Driver Rating",
      value: rating > 0 ? rating.toFixed(1) : "New",
      helper: "Customer rating",
      icon: Star,
    },
    {
      label: "Online Hours",
      value: `${onlineHours.toFixed(1)} hrs`,
      helper: "Active time today",
      icon: Clock3,
    },
    {
      label: "Acceptance Rate",
      value: `${Math.max(0, Math.min(100, acceptanceRate))}%`,
      helper: "Ride requests accepted",
      icon: BadgeCheck,
    },
    {
      label: "Cancellation Rate",
      value: `${Math.max(0, Math.min(100, cancellationRate))}%`,
      helper: "Driver-side cancellations",
      icon: XCircle,
    },
  ];

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
            Performance
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Today&apos;s Overview
          </h2>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/45 sm:flex">
          <Gauge size={16} className="text-amber-400" />
          Live driver metrics
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="group rounded-3xl border border-white/10 bg-[#0b1018] p-5 transition hover:-translate-y-1 hover:border-amber-400/25"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-white/45">{card.label}</p>

                  <p className="mt-3 text-3xl font-extrabold text-white">
                    {card.value}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    {card.helper}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-400/15 bg-amber-400/10 text-amber-400 transition group-hover:bg-amber-400 group-hover:text-black">
                  <Icon size={22} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}