"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  BadgeCheck,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { auth, db } from "@/lib/firebase";

interface ProfileData {
  name: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  role: string;
  accountType: string;
  isActive: boolean;
}

const defaultProfile: ProfileData = {
  name: "Velora Customer",
  email: "",
  phoneNumber: "",
  photoURL: "",
  role: "customer",
  accountType: "customer",
  isActive: true,
};

export default function ProfileCard() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] =
    useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        try {
          const profileReference = doc(
            db,
            "users",
            currentUser.uid
          );

          const profileSnapshot = await getDoc(
            profileReference
          );

          if (profileSnapshot.exists()) {
            const data = profileSnapshot.data();

            setProfile({
              name:
                data.name ||
                currentUser.displayName ||
                "Velora Customer",
              email:
                data.email ||
                currentUser.email ||
                "",
              phoneNumber:
                data.phoneNumber ||
                currentUser.phoneNumber ||
                "",
              photoURL:
                data.photoURL ||
                currentUser.photoURL ||
                "",
              role: data.role || "customer",
              accountType:
                data.accountType || "customer",
              isActive:
                data.isActive !== false,
            });
          } else {
            setProfile({
              ...defaultProfile,
              name:
                currentUser.displayName ||
                "Velora Customer",
              email: currentUser.email || "",
              phoneNumber:
                currentUser.phoneNumber || "",
              photoURL:
                currentUser.photoURL || "",
            });
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const initial =
    profile.name.trim().charAt(0).toUpperCase() || "V";

  const membershipLabel =
    profile.accountType === "driver"
      ? "Driver Applicant"
      : profile.accountType === "partner"
        ? "Fleet Partner"
        : "Standard Customer";

  return (
    <div className="min-w-[290px] rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-400/20 bg-amber-400 text-xl font-bold text-black">
          {profile.photoURL ? (
            <Image
              src={profile.photoURL}
              alt={profile.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-400">
            Signed in as
          </p>

          <h2 className="mt-1 truncate text-lg font-bold text-white">
            {loading ? "Loading profile..." : profile.name}
          </h2>

          <p className="mt-1 truncate text-xs text-white/45">
            {loading
              ? "Please wait..."
              : profile.email ||
                profile.phoneNumber ||
                "Velora account"}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {profile.email && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
            <Mail
              size={16}
              className="shrink-0 text-amber-400"
            />

            <span className="truncate text-xs text-white/55">
              {profile.email}
            </span>
          </div>
        )}

        {profile.phoneNumber && (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
            <Phone
              size={16}
              className="shrink-0 text-amber-400"
            />

            <span className="truncate text-xs text-white/55">
              {profile.phoneNumber}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-white/40">
              <BadgeCheck size={15} />
              <span className="text-[10px] uppercase tracking-wide">
                Status
              </span>
            </div>

            <p
              className={`mt-2 text-sm font-semibold ${
                profile.isActive
                  ? "text-green-400"
                  : "text-red-300"
              }`}
            >
              {profile.isActive ? "Active" : "Disabled"}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-white/40">
              <UserRound size={15} />
              <span className="text-[10px] uppercase tracking-wide">
                Account
              </span>
            </div>

            <p className="mt-2 truncate text-sm font-semibold capitalize text-white/80">
              {profile.role}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
          Membership
        </p>

        <p className="mt-1 text-sm font-semibold text-amber-300">
          {membershipLabel}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/profile"
          className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-amber-400/30 hover:bg-white/[0.06]"
        >
          Edit Profile
        </Link>

        <Link
          href="/book"
          className="rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-bold text-black transition hover:bg-amber-300"
        >
          Book Ride
        </Link>
      </div>
    </div>
  );
}