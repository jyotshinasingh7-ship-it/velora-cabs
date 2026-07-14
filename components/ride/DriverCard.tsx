"use client";

import Image from "next/image";

import {
  BadgeCheck,
  CarFront,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";

import type { AssignedDriver, AssignedVehicle } from "@/types/booking";

interface DriverCardProps {
  driver: AssignedDriver | null;
  vehicle: AssignedVehicle | null;

  pickupEtaMinutes: number | null;
  driverDistanceKm: number | null;
}

export default function DriverCard({
  driver,
  vehicle,
  pickupEtaMinutes,
  driverDistanceKm,
}: DriverCardProps) {
  if (!driver || !vehicle) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="animate-pulse">

          <div className="flex gap-4">

            <div className="h-20 w-20 rounded-full bg-slate-800" />

            <div className="flex-1">

              <div className="h-5 w-40 rounded bg-slate-800" />

              <div className="mt-4 h-4 w-28 rounded bg-slate-800" />

            </div>

          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">

            <div className="h-20 rounded-2xl bg-slate-800" />

            <div className="h-20 rounded-2xl bg-slate-800" />

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="flex items-center gap-5">

        {driver.photoURL ? (

          <Image
            src={driver.photoURL}
            alt={driver.name}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 rounded-full border-2 border-cyan-500 object-cover"
          />

        ) : (

          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500 text-4xl font-bold">

            {driver.name.charAt(0).toUpperCase()}

          </div>

        )}

        <div className="flex-1">

          <div className="flex items-center gap-2">

            <h2 className="text-2xl font-bold">

              {driver.name}

            </h2>

            <BadgeCheck
              size={22}
              className="text-cyan-400"
            />

          </div>

          <div className="mt-3 flex flex-wrap gap-3">

            <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-sm text-yellow-300">

              ⭐ {driver.rating.toFixed(1)}

            </span>

            <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">

              {driver.totalRides} Rides

            </span>

          </div>

        </div>

      </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

          <div className="flex items-center gap-2 text-gray-400">

            <CarFront
              size={18}
              className="text-cyan-400"
            />

            Vehicle

          </div>

          <h3 className="mt-3 text-xl font-bold">

            {vehicle.name}

          </h3>

          <p className="mt-1 text-gray-400">

            {vehicle.model}

          </p>

          <div className="mt-4 flex flex-wrap gap-2">

            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-sm text-cyan-300">

              {vehicle.number}

            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">

              {vehicle.color}

            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">

              <Users
                size={14}
                className="mr-1 inline"
              />

              {vehicle.seats} Seats

            </span>

          </div>

        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">

          <h3 className="text-lg font-bold">

            Live Arrival

          </h3>

          <div className="mt-5 space-y-5">

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                ETA

              </span>

              <span className="text-2xl font-bold text-cyan-400">

                {pickupEtaMinutes ?? "--"} min

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Distance

              </span>

              <span className="text-xl font-semibold">

                {driverDistanceKm ?? "--"} km

              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-gray-400">

                Status

              </span>

              <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">

                ● Online

              </span>

            </div>

          </div>

        </div>

      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">

        <a
          href={`tel:${driver.phoneNumber}`}
          className="flex items-center justify-center gap-3 rounded-2xl bg-cyan-500 py-4 font-bold text-white transition hover:bg-cyan-600"
        >

          <Phone size={20} />

          Call Driver

        </a>

        <a
          href={`https://wa.me/${driver.phoneNumber.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 rounded-2xl border border-green-500 bg-green-500/10 py-4 font-bold text-green-400 transition hover:bg-green-500 hover:text-white"
        >

          <MessageCircle size={20} />

          WhatsApp

        </a>

      </div>
            {/* Safety Information */}

      <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">

        <h3 className="text-lg font-bold">
          Safety Information
        </h3>

        <div className="mt-4 space-y-3 text-sm text-gray-300">

          <div className="flex items-start gap-3">
            <BadgeCheck
              size={18}
              className="mt-0.5 text-cyan-400"
            />
            <span>
              Driver identity has been verified by Velora Mobility.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck
              size={18}
              className="mt-0.5 text-cyan-400"
            />
            <span>
              Match the vehicle number before starting your ride.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck
              size={18}
              className="mt-0.5 text-cyan-400"
            />
            <span>
              Never share your Start OTP before entering the vehicle.
            </span>
          </div>

          <div className="flex items-start gap-3">
            <BadgeCheck
              size={18}
              className="mt-0.5 text-cyan-400"
            />
            <span>
              Share the End OTP only after reaching your destination.
            </span>
          </div>

        </div>

      </div>

      {/* Trip Tips */}

      <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-5">

        <h3 className="text-lg font-bold">
          Trip Tips
        </h3>

        <ul className="mt-4 space-y-3 text-sm text-gray-400">

          <li>
            • Wear your seat belt throughout the journey.
          </li>

          <li>
            • Contact support immediately if vehicle details don&apos;t match.
          </li>

          <li>
            • Keep your valuables with you while exiting the vehicle.
          </li>

          <li>
            • Rate your driver after ride completion to help maintain service quality.
          </li>

        </ul>

      </div>

    </div>
  );
}
