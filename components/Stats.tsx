"use client";

import {
  BadgeCheck,
  CarFront,
  Star,
  Users,
} from "lucide-react";

const stats = [
  {
    number: "10K+",
    title: "Happy Customers",
    icon: Users,
  },
  {
    number: "50K+",
    title: "Completed Trips",
    icon: CarFront,
  },
  {
    number: "4.9★",
    title: "Customer Rating",
    icon: Star,
  },
  {
    number: "24×7",
    title: "Customer Support",
    icon: BadgeCheck,
  },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-[#05070c] py-24">
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Velora In Numbers
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Trusted by thousands of
            <span className="text-amber-400"> travellers</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-white/55">
            We focus on safe rides, verified drivers and premium customer
            experience across every journey.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/30 hover:bg-white/[0.06]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-lg transition duration-300 group-hover:scale-110">
                  <Icon size={30} />
                </div>

                <h3 className="mt-6 text-5xl font-extrabold text-white">
                  {item.number}
                </h3>

                <p className="mt-3 text-base font-medium text-white/60">
                  {item.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}