"use client";

import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default function Contact() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#05070c] py-24"
    >
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            Contact Velora
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Need help with your
            <span className="text-amber-400"> next ride?</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-white/55">
            Whether you need an instant cab, airport transfer,
            corporate transportation or want to join Velora as a
            driver, our team is always ready to help.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* LEFT */}

          <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h3 className="text-3xl font-bold text-white">
              Get In Touch
            </h3>

            <p className="mt-3 text-white/55">
              Reach out anytime. Our support team is available 24×7.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black">
                  <MapPin size={24} />
                </div>

                <div>
                  <h4 className="font-semibold text-white">
                    Office Address
                  </h4>

                  <p className="mt-2 text-white/55">
                    Noida,
                    <br />
                    Uttar Pradesh, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black">
                  <Phone size={24} />
                </div>

                <div>
                  <h4 className="font-semibold text-white">
                    Phone
                  </h4>

                  <a
                    href="tel:+919997997390"
                    className="mt-2 block text-amber-400 hover:underline"
                  >
                    +91 99979 97390
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black">
                  <Mail size={24} />
                </div>

                <div>
                  <h4 className="font-semibold text-white">
                    Email
                  </h4>

                  <a
                    href="mailto:info@veloramobility.in"
                    className="mt-2 block text-amber-400 hover:underline"
                  >
                    info@veloramobility.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-black">
                  <Clock3 size={24} />
                </div>

                <div>
                  <h4 className="font-semibold text-white">
                    Working Hours
                  </h4>

                  <p className="mt-2 text-white/55">
                    24 Hours × 7 Days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}

          <div className="rounded-[32px] border border-white/10 bg-gradient-to-b from-amber-400/10 via-white/[0.04] to-white/[0.04] p-8 backdrop-blur-xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-black">
              <ShieldCheck size={30} />
            </div>

            <h3 className="mt-8 text-3xl font-bold text-white">
              Why Choose Velora?
            </h3>

            <div className="mt-8 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                ✅ Verified Drivers
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                ✅ Transparent Pricing
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                ✅ Live GPS Tracking
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                ✅ Airport & Outstation Specialists
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                ✅ Corporate Mobility Solutions
              </div>
            </div>

            <Link
              href="/book"
              className="mt-10 flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-4 text-lg font-bold text-black transition hover:bg-amber-300"
            >
              Book Your Ride
              <ArrowRight size={18} />
            </Link>

            <Link
                href="/signup?intent=driver"
              className="mt-4 flex items-center justify-center rounded-xl border border-white/10 py-4 font-semibold text-white transition hover:bg-white/5"
            >
              Earn With Velora
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
