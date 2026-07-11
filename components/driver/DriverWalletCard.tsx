"use client";

import {
  ArrowDownCircle,
  CircleDollarSign,
  Clock3,
  Wallet,
} from "lucide-react";

interface DriverWalletCardProps {
  walletBalance: number;
  pendingBalance: number;
  todayEarnings: number;
  onWithdraw: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function DriverWalletCard({
  walletBalance,
  pendingBalance,
  todayEarnings,
  onWithdraw,
}: DriverWalletCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1018] p-6">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
            Driver Wallet
          </p>

          <h2 className="mt-2 text-2xl font-bold text-white">
            Available Balance
          </h2>

          <p className="mt-3 text-4xl font-extrabold text-green-400">
            {formatCurrency(walletBalance)}
          </p>

        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400 text-black">

          <Wallet size={30} />

        </div>

      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

          <div className="flex items-center gap-2">

            <CircleDollarSign
              size={18}
              className="text-green-400"
            />

            <span className="text-sm text-white/60">
              Today's Earnings
            </span>

          </div>

          <p className="mt-3 text-2xl font-bold text-white">
            {formatCurrency(todayEarnings)}
          </p>

        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

          <div className="flex items-center gap-2">

            <Clock3
              size={18}
              className="text-yellow-400"
            />

            <span className="text-sm text-white/60">
              Pending Settlement
            </span>

          </div>

          <p className="mt-3 text-2xl font-bold text-yellow-400">
            {formatCurrency(pendingBalance)}
          </p>

        </div>

      </div>

      <button
        onClick={onWithdraw}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-amber-400 py-4 text-lg font-bold text-black transition hover:bg-amber-300"
      >

        <ArrowDownCircle size={22} />

        Withdraw Earnings

      </button>

    </section>
  );
}