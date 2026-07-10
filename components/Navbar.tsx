"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Building2,
  CarFront,
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  Phone,
  Plane,
  Route,
  X,
} from "lucide-react";

import { auth } from "@/lib/firebase";

const mainLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Fleet", href: "/#fleet" },
  { label: "Why Velora", href: "/#why-velora" },
  { label: "Corporate", href: "/corporate" },
  { label: "Contact", href: "/#contact" },
];

const rideLinks = [
  {
    label: "Local City Ride",
    href: "/book",
    icon: CarFront,
  },
  {
    label: "Airport Transfer",
    href: "/book?service=airport",
    icon: Plane,
  },
  {
    label: "Outstation Ride",
    href: "/book?service=outstation",
    icon: Route,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rideMenuOpen, setRideMenuOpen] = useState(false);
  const [mobileRideMenuOpen, setMobileRideMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setRideMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setRideMenuOpen(false);
    setMobileRideMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setRideMenuOpen(false);
    setMobileRideMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      closeMenus();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    if (href.startsWith("/#")) {
      return false;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? "border-b border-white/10 bg-[#05070c]/95 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            onClick={closeMenus}
            className="flex items-center gap-3"
          >
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-amber-400/20 bg-white/5">
              <Image
                src="/images/logo.png"
                alt="Velora Mobility"
                fill
                priority
                sizes="48px"
                className="object-contain p-1"
              />
            </div>

            <div>
              <p className="text-xl font-bold text-white">
                Velora <span className="text-amber-400">Mobility</span>
              </p>

              <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                Premium rides, every mile
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                pathname === "/"
                  ? "bg-white/10 text-amber-400"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              Home
            </Link>

            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setRideMenuOpen(true)}
              onMouseLeave={() => setRideMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setRideMenuOpen((previous) => !previous)}
                className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  pathname === "/book"
                    ? "bg-white/10 text-amber-400"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                Book Ride

                <ChevronDown
                  size={16}
                  className={`transition ${
                    rideMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {rideMenuOpen && (
                <div className="absolute left-0 top-full pt-3">
                  <div className="w-72 rounded-2xl border border-white/10 bg-[#0b0e14] p-2 shadow-2xl">
                    {rideLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={closeMenus}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/75 transition hover:bg-white/5 hover:text-white"
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
                            <Icon size={18} />
                          </span>

                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {mainLinks.slice(1).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-white/10 text-amber-400"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href="tel:+919997997390"
              className="flex items-center gap-2 text-sm text-white/65 transition hover:text-amber-400"
            >
              <Phone size={16} />
              +91 99979 97390
            </a>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold"
                >
                  <CircleUserRound size={17} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:text-red-300"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2.5 text-sm font-semibold text-white/70 hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/book"
                  className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300"
                >
                  Book Now
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#05070c] lg:hidden">
          <div className="max-h-[calc(100vh-80px)] overflow-y-auto px-5 py-6">
            <nav className="space-y-2">
              <Link
                href="/"
                onClick={closeMenus}
                className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/5"
              >
                Home
              </Link>

              <div className="rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() =>
                    setMobileRideMenuOpen((previous) => !previous)
                  }
                  className="flex w-full items-center justify-between px-4 py-3 font-semibold"
                >
                  Book Ride

                  <ChevronDown
                    size={18}
                    className={`transition ${
                      mobileRideMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileRideMenuOpen && (
                  <div className="border-t border-white/10 p-2">
                    {rideLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={closeMenus}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 hover:bg-white/5"
                        >
                          <Icon size={17} className="text-amber-400" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {mainLinks.slice(1).map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={closeMenus}
                  className="block rounded-xl px-4 py-3 font-semibold hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-white/10 pt-6">
              <a
                href="tel:+919997997390"
                className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70"
              >
                <Phone size={17} className="text-amber-400" />
                +91 99979 97390
              </a>

              {user ? (
                <div className="grid gap-3">
                  <Link
                    href="/dashboard"
                    onClick={closeMenus}
                    className="rounded-xl bg-amber-400 px-4 py-3 text-center font-bold text-black"
                  >
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl border border-white/10 px-4 py-3"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenus}
                    className="rounded-xl border border-white/10 px-4 py-3 text-center font-semibold"
                  >
                    Login
                  </Link>

                  <Link
                    href="/book"
                    onClick={closeMenus}
                    className="rounded-xl bg-amber-400 px-4 py-3 text-center font-bold text-black"
                  >
                    Book Now
                  </Link>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/35">
              <Building2 size={14} />
              Corporate and personal mobility solutions
            </div>
          </div>
        </div>
      )}
    </header>
  );
}