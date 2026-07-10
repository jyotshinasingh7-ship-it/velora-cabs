"use client";

import {
  IndianRupee,
  Users,
  Car,
  Calendar,
  TrendingUp,
} from "lucide-react";

import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";

const monthlyRevenue = [
  { month: "Jan", value: 45 },
  { month: "Feb", value: 58 },
  { month: "Mar", value: 62 },
  { month: "Apr", value: 74 },
  { month: "May", value: 81 },
  { month: "Jun", value: 96 },
];

export default function AnalyticsPage() {
  const max = Math.max(...monthlyRevenue.map((i) => i.value));

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">

      <PageHeader
        title="Analytics"
        subtitle="Business overview & platform performance."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Revenue"
          value="₹4.82L"
          icon={IndianRupee}
          color="bg-green-600"
        />

        <StatCard
          title="Bookings"
          value="1,248"
          icon={Calendar}
          color="bg-blue-600"
        />

        <StatCard
          title="Customers"
          value="863"
          icon={Users}
          color="bg-purple-600"
        />

        <StatCard
          title="Drivers"
          value="97"
          icon={Car}
          color="bg-cyan-600"
        />

      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-3">

        <div className="xl:col-span-2 rounded-2xl border border-white/10 bg-slate-900 p-6">

          <div className="mb-8 flex items-center gap-3">

            <TrendingUp className="text-cyan-400" />

            <h2 className="text-2xl font-bold">
              Monthly Revenue
            </h2>

          </div>

          <div className="flex h-72 items-end justify-between gap-4">

            {monthlyRevenue.map((item) => (
              <div
                key={item.month}
                className="flex flex-col items-center"
              >
                <div
                  style={{
                    height: `${(item.value / max) * 220}px`,
                  }}
                  className="w-12 rounded-t-xl bg-cyan-500 transition-all duration-500 hover:bg-cyan-400"
                />

                <span className="mt-3 text-gray-400">
                  {item.month}
                </span>
              </div>
            ))}

          </div>

        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <h2 className="mb-6 text-2xl font-bold">
            Platform Summary
          </h2>

          <div className="space-y-6">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Avg Ride Value
              </span>

              <span className="font-bold">
                ₹482
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Active Drivers
              </span>

              <span className="font-bold">
                78
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Completed Trips
              </span>

              <span className="font-bold">
                1,186
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Cancellation Rate
              </span>

              <span className="font-bold text-red-400">
                3.1%
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Customer Rating
              </span>

              <span className="font-bold text-yellow-400">
                ⭐ 4.9
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}