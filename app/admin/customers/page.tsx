"use client";

import { Search, Eye, Pencil, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  joined: string;
  status: "Active" | "Blocked";
};

const customers: Customer[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    email: "rahul@gmail.com",
    phone: "+91 9876543210",
    joined: "02 Jul 2026",
    status: "Active",
  },
  {
    id: 2,
    name: "Aman Verma",
    email: "aman@gmail.com",
    phone: "+91 9988776655",
    joined: "04 Jul 2026",
    status: "Blocked",
  },
  {
    id: 3,
    name: "Priya Singh",
    email: "priya@gmail.com",
    phone: "+91 9123456780",
    joined: "05 Jul 2026",
    status: "Active",
  },
  {
    id: 4,
    name: "Karan Mehta",
    email: "karan@gmail.com",
    phone: "+91 9090909090",
    joined: "06 Jul 2026",
    status: "Active",
  },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase()) ||
      customer.phone.includes(search)
    );
  }, [search]);

  const active = customers.filter((c) => c.status === "Active").length;
  const blocked = customers.filter((c) => c.status === "Blocked").length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">

      {/* Header */}

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-4xl font-bold">
            Customers
          </h1>

          <p className="text-gray-400 mt-2">
            Manage all registered customers.
          </p>
        </div>

      </div>

      {/* Stats */}

      <div className="grid gap-6 md:grid-cols-3 mb-8">

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <Users className="mb-4 text-cyan-400" size={40} />

          <p className="text-gray-400">
            Total Customers
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {customers.length}
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <p className="text-green-400 font-semibold">
            Active Customers
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {active}
          </h2>

        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">

          <p className="text-red-400 font-semibold">
            Blocked Customers
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {blocked}
          </h2>

        </div>

      </div>

      {/* Search */}

      <div className="relative mb-8">

        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          size={20}
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer..."
          className="w-full rounded-xl border border-white/10 bg-slate-900 py-4 pl-12 pr-4 outline-none focus:border-cyan-500"
        />

      </div>

      {/* Table */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-slate-800">

              <tr>

                <th className="px-6 py-4 text-left">
                  Customer
                </th>

                <th className="px-6 py-4 text-left">
                  Phone
                </th>

                <th className="px-6 py-4 text-left">
                  Joined
                </th>

                <th className="px-6 py-4 text-left">
                  Status
                </th>

                <th className="px-6 py-4 text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredCustomers.map((customer) => (

                <tr
                  key={customer.id}
                  className="border-t border-white/10 hover:bg-white/5 transition"
                >

                  <td className="px-6 py-5">

                    <div>

                      <h3 className="font-semibold">
                        {customer.name}
                      </h3>

                      <p className="text-sm text-gray-400">
                        {customer.email}
                      </p>

                    </div>

                  </td>

                  <td className="px-6">
                    {customer.phone}
                  </td>

                  <td className="px-6">
                    {customer.joined}
                  </td>

                  <td className="px-6">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        customer.status === "Active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {customer.status}
                    </span>

                  </td>

                  <td className="px-6">

                    <div className="flex items-center justify-center gap-3">

                      <button className="rounded-lg bg-cyan-500 p-2 hover:bg-cyan-600">
                        <Eye size={18} />
                      </button>

                      <button className="rounded-lg bg-yellow-500 p-2 hover:bg-yellow-600">
                        <Pencil size={18} />
                      </button>

                      <button className="rounded-lg bg-red-500 p-2 hover:bg-red-600">
                        <Trash2 size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}