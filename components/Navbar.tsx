"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  BriefcaseBusiness,
  Building2,
  CarFront,
  ChevronDown,
  CircleUserRound,
  ClipboardCheck,
  LogOut,
  Menu,
  Phone,
  UserPlus,
  UserRoundCheck,
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

const earnLinks = [
  {
    label: "Drive With Velora",
    description: "Join as a professional driver and start earning",
    href: "/earn/driver",
    icon: UserRoundCheck,
  },
  {
    label: "Attach Your Car",
    description: "Add your vehicle to the Velora network",
    href: "/earn/vehicle",
    icon: CarFront,
  },
  {
    label: "Application Status",
    description: "Track your driver or vehicle application",
    href: "/earn/status",
    icon: ClipboardCheck,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const earnDropdownRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [earnMenuOpen, setEarnMenuOpen] = useState(false);
  const [mobileEarnMenuOpen, setMobileEarnMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
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
        earnDropdownRef.current &&
        !earnDropdownRef.current.contains(event.target as Node)
      ) {
        setEarnMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEarnMenuOpen(false);
        setMobileMenuOpen(false);
        setMobileEarnMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setEarnMenuOpen(false);
    setMobileEarnMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setEarnMenuOpen(false);
    setMobileEarnMenuOpen(false);
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

  const earnSectionActive = pathname.startsWith("/earn");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? "border-b border-white/10 bg-[#05070c]/95 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          : "bg-gradient-to-b from-black/85 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link
            href="/"
            onClick={closeMenus}
            className="flex min-w-0 items-center gap-3"
            aria-label="Velora Mobility home"
          >
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-400/20 bg-white/5 sm:h-12 sm:w-12">
              <Image
                src="/images/logo.png"
                alt="Velora Mobility"
                fill
                priority
                sizes="48px"
                className="object-contain p-1"
              />
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white sm:text-xl">
                Velora <span className="text-amber-400">Mobility</span>
              </p>

              <p className="hidden text-[10px] uppercase tracking-[0.2em] text-white/45 sm:block">
                Premium rides, every mile
              </p>
            </div>
          </Link>

          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label="Main navigation"
          >
            {mainLinks.slice(0, 5).map((link) => (
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

            <div
              ref={earnDropdownRef}
              className="relative"
              onMouseEnter={() => setEarnMenuOpen(true)}
              onMouseLeave={() => setEarnMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setEarnMenuOpen((previous) => !previous)}
                aria-expanded={earnMenuOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  earnSectionActive
                    ? "bg-white/10 text-amber-400"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                Earn With Us

                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    earnMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute left-1/2 top-full w-[340px] -translate-x-1/2 pt-3 transition-all duration-200 ${
                  earnMenuOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-2 opacity-0"
                }`}
              >
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e14]/98 p-2 shadow-[0_28px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl">
                  <Link
                    href="/earn"
                    onClick={closeMenus}
                    className="mb-1 flex items-center gap-3 rounded-xl border border-amber-400/10 bg-amber-400/[0.06] px-4 py-3 transition hover:bg-amber-400/10"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-black">
                      <BriefcaseBusiness size={19} />
                    </span>

                    <span>
                      <span className="block text-sm font-semibold text-white">
                        Start Earning With Velora
                      </span>

                      <span className="mt-1 block text-xs text-white/45">
                        Choose the earning option that suits you
                      </span>
                    </span>
                  </Link>

                  {earnLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={closeMenus}
                        className="group flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.06]"
                      >
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/10 text-amber-400 transition group-hover:bg-amber-400 group-hover:text-black">
                          <Icon size={19} />
                        </span>

                        <span>
                          <span className="block text-sm font-semibold text-white">
                            {item.label}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-white/45">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <Link
              href="/#contact"
              className="rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href="tel:+919997997390"
              className="mr-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-amber-400"
            >
              <Phone size={16} />
              +91 99979 97390
            </a>

            {!authLoading &&
              (user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition hover:border-amber-400/30 hover:bg-white/[0.08]"
                  >
                    <CircleUserRound size={17} />
                    Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-black shadow-[0_12px_32px_rgba(251,191,36,0.16)] transition hover:-translate-y-0.5 hover:bg-amber-300"
                  >
                    <UserPlus size={17} />
                    Sign Up
                  </Link>
                </>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:border-amber-400/30 hover:text-amber-400 lg:hidden"
            aria-label={
              mobileMenuOpen ? "Close navigation" : "Open navigation"
            }
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 top-20 overflow-y-auto bg-[#05070c] transition-all duration-300 lg:hidden ${
          mobileMenuOpen
            ? "visible translate-x-0 opacity-100"
            : "invisible translate-x-full opacity-0"
        }`}
      >
        <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pb-10 pt-6">
          <nav className="space-y-2" aria-label="Mobile navigation">
            {mainLinks.slice(0, 5).map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenus}
                className={`block rounded-xl px-4 py-3.5 text-base font-semibold transition ${
                  isActive(link.href)
                    ? "bg-amber-400/10 text-amber-400"
                    : "text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
              <button
                type="button"
                onClick={() =>
                  setMobileEarnMenuOpen((previous) => !previous)
                }
                className="flex w-full items-center justify-between px-4 py-3.5 text-left text-base font-semibold text-white"
                aria-expanded={mobileEarnMenuOpen}
              >
                <span className="flex items-center gap-3">
                  <BriefcaseBusiness size={19} className="text-amber-400" />
                  Earn With Us
                </span>

                <ChevronDown
                  size={18}
                  className={`text-amber-400 transition-transform ${
                    mobileEarnMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`grid transition-all duration-300 ${
                  mobileEarnMenuOpen
                    ? "grid-rows-[1fr]"
                    : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-1 border-t border-white/10 p-2">
                    <Link
                      href="/earn"
                      onClick={closeMenus}
                      className="flex items-center gap-3 rounded-xl bg-amber-400/[0.07] px-3 py-3 text-sm font-semibold text-amber-300"
                    >
                      <BriefcaseBusiness size={18} />
                      Earning Overview
                    </Link>

                    {earnLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={closeMenus}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
                        >
                          <Icon size={18} className="text-amber-400" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/#contact"
              onClick={closeMenus}
              className="block rounded-xl px-4 py-3.5 text-base font-semibold text-white transition hover:bg-white/5"
            >
              Contact
            </Link>
          </nav>

          <div className="mt-7 border-t border-white/10 pt-6">
            <a
              href="tel:+919997997390"
              className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-white/70"
            >
              <Phone size={18} className="text-amber-400" />
              +91 99979 97390
            </a>

            {!authLoading &&
              (user ? (
                <div className="grid gap-3">
                  <Link
                    href="/dashboard"
                    onClick={closeMenus}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 font-bold text-black"
                  >
                    <CircleUserRound size={19} />
                    Open Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3.5 font-semibold text-white/70 transition hover:bg-red-500/10 hover:text-red-300"
                  >
                    <LogOut size={19} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={closeMenus}
                    className="rounded-xl border border-white/10 px-4 py-3.5 text-center font-semibold text-white"
                  >
                    Login
                  </Link>

                  <Link
                    href="/signup"
                    onClick={closeMenus}
                    className="flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3.5 text-center font-bold text-black"
                  >
                    <UserPlus size={18} />
                    Sign Up
                  </Link>
                </div>
              ))}
          </div>

          <div className="mt-auto pt-10 text-center">
            <div className="flex items-center justify-center gap-2 text-xs text-white/35">
              <Building2 size={14} />
              Corporate and personal mobility solutions
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}