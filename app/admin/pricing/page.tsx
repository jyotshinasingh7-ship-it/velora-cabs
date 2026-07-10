"use client";

import { DollarSign, Save, Car, Clock, Moon, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function PricingPage() {
  const [pricing, setPricing] = useState({
    baseFare: 100,
    perKm: 18,
    perMinute: 2,
    waitingCharge: 3,
    nightCharge: 50,
    surgeMultiplier: 1.5,
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setPricing({
      ...pricing,
      [e.target.name]: Number(e.target.value),
    });
  }

  function handleSave() {
    alert(
      "Pricing saved successfully. Firebase integration coming next."
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      <div className="mb-8">

        <h1 className="text-4xl font-bold">
          Pricing Management
        </h1>

        <p className="mt-2 text-gray-400">
          Configure fare settings for Velora Cabs.
        </p>

      </div>

      {/* Cards */}

      <div className="grid gap-6 md:grid-cols-3 mb-10">

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <DollarSign
            className="mb-4 text-cyan-400"
            size={40}
          />

          <p className="text-gray-400">
            Base Fare
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            ₹{pricing.baseFare}
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <Car
            className="mb-4 text-green-400"
            size={40}
          />

          <p className="text-gray-400">
            Per KM
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            ₹{pricing.perKm}
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <TrendingUp
            className="mb-4 text-yellow-400"
            size={40}
          />

          <p className="text-gray-400">
            Surge Multiplier
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            {pricing.surgeMultiplier}x
          </h2>

        </div>

      </div>

      {/* Form */}

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm text-gray-400">
              Base Fare (₹)
            </label>

            <input
              type="number"
              name="baseFare"
              value={pricing.baseFare}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm text-gray-400">
              Per KM Charge (₹)
            </label>

            <input
              type="number"
              name="perKm"
              value={pricing.perKm}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm text-gray-400">
              Per Minute Charge (₹)
            </label>

            <input
              type="number"
              name="perMinute"
              value={pricing.perMinute}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-sm text-gray-400">
              Waiting Charge (₹)
            </label>

            <div className="relative">

              <Clock
                className="absolute left-4 top-4 text-gray-500"
                size={20}
              />

              <input
                type="number"
                name="waitingCharge"
                value={pricing.waitingCharge}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 pl-12 outline-none focus:border-cyan-500"
              />

            </div>

          </div>

          <div>

            <label className="mb-2 block text-sm text-gray-400">
              Night Charge (₹)
            </label>

            <div className="relative">

              <Moon
                className="absolute left-4 top-4 text-gray-500"
                size={20}
              />

              <input
                type="number"
                name="nightCharge"
                value={pricing.nightCharge}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 pl-12 outline-none focus:border-cyan-500"
              />

            </div>

          </div>

          <div>

            <label className="mb-2 block text-sm text-gray-400">
              Surge Multiplier
            </label>

            <input
              type="number"
              step="0.1"
              name="surgeMultiplier"
              value={pricing.surgeMultiplier}
              onChange={handleChange}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

        </div>

        <button
          onClick={handleSave}
          className="mt-8 flex items-center gap-3 rounded-xl bg-cyan-500 px-8 py-4 font-bold hover:bg-cyan-600 transition"
        >

          <Save size={20} />

          Save Pricing

        </button>

      </div>

    </div>
  );
}