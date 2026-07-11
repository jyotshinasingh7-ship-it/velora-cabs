"use client";

import { Bell, Power, Wallet, Star } from "lucide-react";

interface DriverTopbarProps {
  online: boolean;
  todayEarning: number;
  walletBalance: number;
  rating: number;
  onToggleOnline: () => void;
  loading?: boolean;
}

export default function DriverTopbar({
  online,
  todayEarning,
  walletBalance,
  rating,
  onToggleOnline,
  loading = false,
}: DriverTopbarProps) {
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-[#0b1018] p-6 lg:flex-row lg:items-center lg:justify-between">

      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-amber-400">
          Driver Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          Ready to Drive?
        </h1>

        <p className="mt-2 text-sm text-white/45">
          Manage rides, earnings and wallet in one place.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <p className="text-xs text-white/40">
            Today
          </p>

          <p className="mt-1 text-xl font-bold text-green-400">
            ₹{todayEarning}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <Wallet
              size={18}
              className="text-amber-400"
            />

            <span className="text-white font-bold">
              ₹{walletBalance}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3">
          <div className="flex items-center gap-2">
            <Star
              size={18}
              className="fill-yellow-400 text-yellow-400"
            />

            <span className="font-bold text-white">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        <button className="relative rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
          <Bell size={20} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <button
          onClick={onToggleOnline}
          disabled={loading}
          className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition ${
            online
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          <Power size={18} />

          {online ? "Online" : "Offline"}
        </button>

      </div>
    </div>
  );
}