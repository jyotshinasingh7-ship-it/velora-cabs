"use client";

import Link from "next/link";
import { ArrowRight, Quote, Star } from "lucide-react";

const reviews = [
  {
    name: "Rahul Sharma",
    city: "Noida",
    review:
      "Outstanding service. The driver arrived before time, the vehicle was spotless and the fare matched the estimate.",
  },
  {
    name: "Priya Verma",
    city: "Delhi",
    review:
      "Booking was extremely easy. Google location search, instant fare estimate and professional driver. Highly recommended.",
  },
  {
    name: "Amit Singh",
    city: "Greater Noida",
    review:
      "Used Velora for airport transfer. Smooth experience from pickup to drop. Will definitely use it again.",
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#05070c] py-24">
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-amber-400/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Testimonials
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Loved by
            <span className="text-amber-400"> our customers</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-white/55">
            Every ride is focused on safety, comfort and reliability.
          </p>
        </div>

        <div className="mt-16 grid gap-7 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="group relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/30 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className="fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                <Quote className="text-amber-400/60" size={30} />
              </div>

              <p className="mt-6 text-sm leading-7 text-white/60">
                &ldquo;{review.review}&rdquo;
              </p>

              <div className="mt-8 border-t border-white/10 pt-5">
                <h3 className="text-lg font-bold text-white">
                  {review.name}
                </h3>

                <p className="mt-1 text-sm text-amber-400">
                  {review.city}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-[30px] border border-white/10 bg-gradient-to-r from-amber-400/10 via-white/5 to-amber-400/10 p-8 text-center backdrop-blur-xl">
          <h3 className="text-3xl font-bold text-white">
            Ready to experience premium travel?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-white/55">
            Join hundreds of satisfied customers travelling every day
            with Velora Mobility.
          </p>

          <Link
            href="/book"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-8 py-4 font-bold text-black transition hover:bg-amber-300"
          >
            Book Your Ride
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
