import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Fleet", href: "/#fleet" },
  { label: "Corporate", href: "/corporate" },
  { label: "Book a Ride", href: "/book" },
  { label: "Driver Portal", href: "/driver/login" },
];

const services = ["Local Taxi", "Airport Transfer", "Outstation Taxi", "Corporate Mobility", "Ride Sharing", "Custom Tours"];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#040507] text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[34rem] -translate-x-1/2 rounded-full bg-amber-400/[0.07] blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.75fr_0.8fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="relative h-12 w-12 overflow-hidden rounded-2xl border border-amber-400/20 bg-white/5">
                <Image src="/images/logo.png" alt="Velora Mobility" fill sizes="48px" className="object-contain p-1" />
              </span>
              <span>
                <span className="block text-xl font-bold">Velora <span className="text-amber-400">Mobility</span></span>
                <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-white/35">Premium rides, every mile</span>
              </span>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/45">Reliable local, airport, outstation and corporate mobility with verified drivers and transparent ride updates.</p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3 text-sm text-white/60"><ShieldCheck size={18} className="text-amber-400" /> Safe, verified and secure rides</div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Explore</h3>
            <nav className="mt-5 grid gap-3 text-sm text-white/45">
              {quickLinks.map((link) => <Link key={link.href} href={link.href} className="w-fit transition hover:translate-x-1 hover:text-amber-400">{link.label}</Link>)}
            </nav>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Services</h3>
            <div className="mt-5 grid gap-3 text-sm text-white/45">
              {services.map((service) => <span key={service}>{service}</span>)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-white">Contact</h3>
            <div className="mt-5 space-y-4 text-sm">
              <a href="tel:+919997997390" className="flex items-start gap-3 text-white/50 transition hover:text-amber-400"><Phone size={17} className="mt-0.5 shrink-0 text-amber-400" /> +91 99979 97390</a>
              <a href="mailto:info@veloramobility.in" className="flex items-start gap-3 break-all text-white/50 transition hover:text-amber-400"><Mail size={17} className="mt-0.5 shrink-0 text-amber-400" /> info@veloramobility.in</a>
              <div className="flex items-start gap-3 text-white/50"><MapPin size={17} className="mt-0.5 shrink-0 text-amber-400" /> Noida, Uttar Pradesh, India</div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-white/30 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Velora Mobility. All rights reserved.</p>
          <p>Built for safer, simpler journeys.</p>
        </div>
      </div>
    </footer>
  );
}
