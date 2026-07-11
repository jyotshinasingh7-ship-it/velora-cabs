"use client";

import {
  BadgeCheck,
  CreditCard,
  IndianRupee,
  MapPinned,
  ShieldCheck,
} from "lucide-react";

const badges = [
  {
    title: "Verified Drivers",
    description:
      "Every driver is verified before accepting customer rides.",
    icon: BadgeCheck,
  },
  {
    title: "Live GPS Tracking",
    description:
      "Track your ride in real-time from pickup to destination.",
    icon: MapPinned,
  },
  {
    title: "Secure Payments",
    description:
      "Pay safely using UPI, Cards, Wallets or Cash.",
    icon: CreditCard,
  },
  {
    title: "24×7 Support",
    description:
      "Our support team is available anytime you need help.",
    icon: ShieldCheck,
  },
  {
    title: "Transparent Pricing",
    description:
      "Fair fares with no hidden charges or surprises.",
    icon: IndianRupee,
  },
];

export default function TrustBadges() {
  return (
    <section className="relative overflow-hidden bg-[#080B12] py-24">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-amber-400/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Trust & Safety
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Why customers
            <span className="text-amber-400"> trust Velora</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-white/55">
            Every ride is backed by verified drivers, secure technology
            and transparent pricing.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
          {badges.map((badge) => {
            const Icon = badge.icon;

            return (
              <div
                key={badge.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/30 hover:bg-white/[0.06]"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-black shadow-lg transition duration-300 group-hover:scale-110">
                  <Icon size={30} />
                </div>

                <h3 className="mt-6 text-xl font-bold text-white">
                  {badge.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-white/55">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-[30px] border border-amber-400/20 bg-amber-400/10 p-8 text-center backdrop-blur-xl">
          <h3 className="text-3xl font-bold text-white">
            Your safety is our highest priority
          </h3>

          <p className="mx-auto mt-4 max-w-3xl text-white/55">
            Every booking is handled through verified drivers, secure
            payment methods and continuous ride monitoring to ensure a
            reliable travel experience.
          </p>
        </div>
      </div>
    </section>
  );
}