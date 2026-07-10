"use client";

import { Building2, Plane, Users, BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CorporateHero() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 pt-32 pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#06b6d422,transparent_40%)]" />

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">

        {/* Left Side */}

        <div>

          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-5 py-2 text-cyan-300 font-medium">
            <Building2 size={18} />
            Corporate Mobility Solutions
          </span>

          <h1 className="mt-7 text-5xl lg:text-7xl font-extrabold leading-tight">
            Corporate
            <span className="block text-cyan-400">
              Taxi Services
            </span>
            for Modern Businesses
          </h1>

          <p className="mt-6 text-lg text-gray-300 leading-8">
            Velora Cabs helps companies manage employee transportation,
            airport transfers, client pickups, and business travel with
            dedicated support, GST billing, and monthly invoicing.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">

            <button
              onClick={() =>
                document
                  .getElementById("corporate-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-xl bg-cyan-500 px-8 py-4 font-bold hover:bg-cyan-600 transition"
            >
              Request Corporate Quote
            </button>

            <button
              onClick={() => router.push("/login")}
              className="rounded-xl border border-cyan-500 px-8 py-4 font-semibold hover:bg-cyan-500/10 transition"
            >
              Existing Client Login
            </button>

          </div>

        </div>

        {/* Right Side */}

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">

          <h2 className="text-3xl font-bold mb-8">
            Business Travel Solutions
          </h2>

          <div className="space-y-5">

            <div className="flex items-center gap-4 rounded-2xl bg-black/20 p-5">
              <Users className="text-cyan-400" size={32} />
              <div>
                <h3 className="font-bold text-lg">
                  Employee Pickup & Drop
                </h3>
                <p className="text-gray-400">
                  Daily office transportation with verified drivers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-black/20 p-5">
              <Plane className="text-cyan-400" size={32} />
              <div>
                <h3 className="font-bold text-lg">
                  Airport Transfers
                </h3>
                <p className="text-gray-400">
                  Reliable airport pickups and drops for employees and clients.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-black/20 p-5">
              <BadgeCheck className="text-cyan-400" size={32} />
              <div>
                <h3 className="font-bold text-lg">
                  GST Billing & Monthly Invoice
                </h3>
                <p className="text-gray-400">
                  Transparent pricing with business-ready invoicing.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}