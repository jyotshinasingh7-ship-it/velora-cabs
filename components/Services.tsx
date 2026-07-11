"use client";

import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Bus,
  CarFront,
  Crown,
  Map,
  Plane,
} from "lucide-react";

const services = [
  {
    title: "Local Taxi",
    description:
      "Quick, affordable and comfortable rides across your city with verified drivers.",
    icon: CarFront,
    color: "bg-amber-400",
    href: "/book?service=local",
  },
  {
    title: "Airport Transfer",
    description:
      "On-time airport pickup and drop with live flight timing support.",
    icon: Plane,
    color: "bg-sky-500",
    href: "/book?service=airport",
  },
  {
    title: "Outstation Trips",
    description:
      "One-way and round-trip taxi bookings with transparent pricing.",
    icon: Map,
    color: "bg-green-500",
    href: "/book?service=outstation",
  },
  {
    title: "Corporate Travel",
    description:
      "Dedicated employee transportation with monthly billing and account management.",
    icon: BriefcaseBusiness,
    color: "bg-purple-500",
    href: "/corporate",
  },
  {
    title: "Wedding & Events",
    description:
      "Luxury vehicles for weddings, VIP guests and special occasions.",
    icon: Crown,
    color: "bg-pink-500",
    href: "/book?service=wedding",
  },
  {
    title: "Tempo Traveller",
    description:
      "Comfortable group travel for tours, family vacations and corporate outings.",
    icon: Bus,
    color: "bg-orange-500",
    href: "/book?service=tempo",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="relative overflow-hidden bg-[#080B12] py-24"
    >
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Our Services
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Complete mobility
            <span className="text-amber-400"> solutions</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-white/55">
            From city rides to luxury travel, Velora Mobility provides
            premium transportation for every travel requirement.
          </p>
        </div>

        <div className="mt-16 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/30 hover:bg-white/[0.06]"
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${service.color} text-white shadow-lg transition group-hover:scale-110`}
                >
                  <Icon size={30} />
                </div>

                <h3 className="mt-7 text-2xl font-bold text-white">
                  {service.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/55">
                  {service.description}
                </p>

                <Link
                  href={service.href}
                  className="mt-8 inline-flex items-center gap-2 font-semibold text-amber-400 transition hover:text-amber-300"
                >
                  Explore Service
                  <ArrowRight size={17} />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <h3 className="text-3xl font-bold text-white">
            Need a custom travel solution?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-white/55">
            Whether you're planning employee transport, business travel,
            family vacations or special events, Velora Mobility can
            customize a transportation plan for you.
          </p>

          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-8 py-4 font-bold text-black transition hover:bg-amber-300"
          >
            Contact Our Team
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}