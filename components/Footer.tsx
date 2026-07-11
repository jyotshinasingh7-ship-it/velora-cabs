"use client";

import Link from "next/link";
import {
  CarFront,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#040507] text-white">
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-4">

          {/* Company */}

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400">
                <CarFront className="text-black" size={28} />
              </div>

              <div>
                <h2 className="text-3xl font-bold">
                  Velora
                  <span className="text-amber-400"> Mobility</span>
                </h2>

                <p className="text-sm text-white/40">
                  Premium Cab Services
                </p>
              </div>
            </div>

            <p className="mt-6 leading-8 text-white/55">
              Velora Mobility provides premium local taxi,
              airport transfer, outstation, corporate travel,
              ride sharing and luxury mobility solutions across India.
            </p>

            <div className="mt-8 flex gap-4">
              <a
                href="#"
                className="rounded-xl border border-white/10 p-3 transition hover:border-amber-400 hover:bg-amber-400 hover:text-black"
              >
                <Facebook size={18} />
              </a>

              <a
                href="#"
                className="rounded-xl border border-white/10 p-3 transition hover:border-amber-400 hover:bg-amber-400 hover:text-black"
              >
                <Instagram size={18} />
              </a>

              <a
                href="#"
                className="rounded-xl border border-white/10 p-3 transition hover:border-amber-400 hover:bg-amber-400 hover:text-black"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}

          <div>
            <h3 className="text-2xl font-bold">
              Quick Links
            </h3>

            <div className="mt-6 flex flex-col gap-4 text-white/60">
              <Link href="/">Home</Link>
              <Link href="/#services">Services</Link>
              <Link href="/#fleet">Fleet</Link>
              <Link href="/corporate">Corporate</Link>
              <Link href="/earn">Earn With Us</Link>
              <Link href="/book">Book Ride</Link>
            </div>
          </div>

          {/* Services */}

          <div>
            <h3 className="text-2xl font-bold">
              Services
            </h3>

            <div className="mt-6 flex flex-col gap-4 text-white/60">
              <span>Local Taxi</span>
              <span>Airport Transfer</span>
              <span>Outstation Taxi</span>
              <span>Corporate Mobility</span>
              <span>Ride Sharing</span>
              <span>Tempo Traveller</span>
            </div>
          </div>

          {/* Contact */}

          <div>
            <h3 className="text-2xl font-bold">
              Contact
            </h3>

            <div className="mt-6 space-y-5">

              <div className="flex gap-3">
                <Phone
                  size={20}
                  className="mt-1 text-amber-400"
                />
                <div>
                  <p className="text-white font-medium">
                    Phone
                  </p>

                  <a
                    href="tel:+919997997390"
                    className="text-white/60 hover:text-amber-400"
                  >
                    +91 99979 97390
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail
                  size={20}
                  className="mt-1 text-amber-400"
                />

                <div>
                  <p className="text-white font-medium">
                    Email
                  </p>

                  <a
                    href="mailto:info@veloramobility.in"
                    className="text-white/60 hover:text-amber-400"
                  >
                    info@veloramobility.in
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <MapPin
                  size={20}
                  className="mt-1 text-amber-400"
                />

                <div>
                  <p className="text-white font-medium">
                    Address
                  </p>

                  <p className="text-white/60">
                    Noida, Uttar Pradesh,
                    <br />
                    India
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                <ShieldCheck className="text-amber-400" />

                <div>
                  <p className="font-semibold">
                    Safe & Verified
                  </p>

                  <p className="text-sm text-white/55">
                    Secure rides with verified drivers.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 lg:flex-row">

          <p className="text-center text-sm text-white/45">
            © 2026 Velora Mobility. All Rights Reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-white/45">
            <Link href="/privacy-policy">
              Privacy Policy
            </Link>

            <Link href="/terms-and-conditions">
              Terms & Conditions
            </Link>

            <Link href="/refund-policy">
              Refund Policy
            </Link>

            <Link href="/cancellation-policy">
              Cancellation Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}