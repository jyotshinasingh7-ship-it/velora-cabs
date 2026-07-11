"use client";

import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  IndianRupee,
  MapPinned,
  Plane,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    title: "24×7 Ride Availability",
    description:
      "Book a ride anytime. Our booking platform works round the clock for local, airport and outstation travel.",
    icon: Clock3,
  },
  {
    title: "Verified Drivers",
    description:
      "Every driver completes document verification before accepting customer rides.",
    icon: BadgeCheck,
  },
  {
    title: "Live GPS Tracking",
    description:
      "Track your ride in real-time with route monitoring and trip updates.",
    icon: MapPinned,
  },
  {
    title: "Transparent Pricing",
    description:
      "Know your estimated fare before booking with no hidden charges.",
    icon: IndianRupee,
  },
  {
    title: "Airport Specialists",
    description:
      "Reliable airport pickup and drop with scheduled timing support.",
    icon: Plane,
  },
  {
    title: "Fast Booking",
    description:
      "Book your ride within seconds using Google location search.",
    icon: Smartphone,
  },
];

export default function WhyChooseUs() {
  return (
    <section
      id="why-velora"
      className="relative overflow-hidden bg-[#05070c] py-24"
    >
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            <ShieldCheck size={16} />
            Why Velora Mobility
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Travel smarter,
            <span className="text-amber-400"> travel safer.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/55">
            Velora Mobility is built to deliver premium travel experiences with
            verified drivers, transparent pricing and modern technology.
          </p>
        </div>

        <div className="mt-16 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-lg transition duration-300 group-hover:scale-110">
                  <Icon size={30} />
                </div>

                <h3 className="mt-7 text-2xl font-bold text-white">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/55">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-[32px] border border-white/10 bg-gradient-to-r from-amber-400/10 via-white/5 to-amber-400/10 p-8 backdrop-blur-xl lg:flex lg:items-center lg:justify-between">
          <div>
            <h3 className="text-3xl font-bold text-white">
              Ready to book your next ride?
            </h3>

            <p className="mt-3 max-w-2xl text-white/55">
              Local rides, airport transfers, outstation trips and corporate
              travel — all from one trusted platform.
            </p>
          </div>

          <Link
            href="/book"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-8 py-4 font-bold text-black transition hover:bg-amber-300 lg:mt-0"
          >
            Book Your Ride
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}