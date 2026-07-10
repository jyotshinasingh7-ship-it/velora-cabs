"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const fleet = [
  {
    name: "Sedan",
    image: "/images/fleet/sedan.jpg",
    seats: "5 Seater",
    bags: "2 Bags",
    price: "Starts ₹12/km",
  },
  {
    name: "SUV",
    image: "/images/fleet/suv.jpg",
    seats: "7 Seater",
    bags: "4 Bags",
    price: "Starts ₹18/km",
  },
  {
    name: "Airport Drop",
    image: "/images/fleet/airport.jpg",
    seats: "7 Seater",
    bags: "5 Bags",
    price: "Airport Special",
  },
  {
    name: "Corporate Taxi",
    image: "/images/fleet/corporate.png",
    seats: "5 Seater",
    bags: "2 Bags",
    price: "Monthly Billing",
  },
  {
    name: "Premium Ride",
    image: "/images/fleet/premium.jpg",
    seats: "7 Seater",
    bags: "5 Bags",
    price: "Luxury Ride",
  },
  {
    name: "E-Rickshaw",
    image: "/images/fleet/erickshaw.jpg",
    seats: "4 Seater",
    bags: "Small Luggage",
    price: "Budget Ride",
  },
  {
    name: "Tempo Traveller",
    image: "/images/fleet/tempo.jpg",
    seats: "12+ Seater",
    bags: "10 Bags",
    price: "Group Travel",
  },
];

export default function Fleet() {
  const router = useRouter();

  return (
    <section className="py-24 bg-[#050816]">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl font-bold text-center text-white">
          Our Fleet
        </h2>

        <p className="mt-3 mb-14 text-center text-gray-400">
          Choose the perfect ride for every journey.
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {fleet.map((car) => (
            <div
              key={car.name}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-cyan-400 hover:-translate-y-2"
            >
              <div className="relative h-56">
                <Image
                  src={car.image}
                  alt={car.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="text-2xl font-bold text-white">
                  {car.name}
                </h3>

                <div className="mt-4 space-y-2 text-gray-300">
                  <p>👥 {car.seats}</p>
                  <p>🧳 {car.bags}</p>
                  <p className="font-semibold text-cyan-400">
                    {car.price}
                  </p>
                </div>

                <button
                  onClick={() => router.push("/login")}
                  className="mt-6 w-full rounded-xl bg-cyan-500 py-3 font-bold transition hover:bg-cyan-600"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}