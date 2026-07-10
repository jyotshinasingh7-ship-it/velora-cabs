"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

type CorporateLead = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  employees: string;
  service: string;
  requirement: string;
  status?: string;
};

export default function CorporateLeadsPage() {
  const [leads, setLeads] = useState<CorporateLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "corporate_requests"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<CorporateLead, "id">),
      }));

      setLeads(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (
    id: string,
    status: "approved" | "pending" | "rejected"
  ) => {
    try {
      await updateDoc(doc(db, "corporate_requests", id), {
        status,
      });

      alert("Status Updated Successfully");
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white pt-24 px-8">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold">
          Corporate Leads
        </h1>

        <p className="text-gray-400 mt-3">
          Manage all corporate enquiries.
        </p>

        {loading && (
          <p className="mt-10 text-cyan-400">
            Loading...
          </p>
        )}

        {!loading && leads.length === 0 && (
          <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-8">
            No Corporate Leads Found
          </div>
        )}

        <div className="space-y-8 mt-10">

          {leads.map((lead) => (
            <div
              key={lead.id}
              className="rounded-3xl bg-white/5 border border-white/10 p-8"
            >
                              <div className="grid md:grid-cols-2 gap-8">

                <div className="space-y-4">

                  <div>
                    <p className="text-gray-400 text-sm">Company</p>
                    <h2 className="text-3xl font-bold text-cyan-400">
                      {lead.companyName}
                    </h2>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Contact Person</p>
                    <p>{lead.contactPerson}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p>{lead.email}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Phone</p>
                    <p>{lead.phone}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">City</p>
                    <p>{lead.city}</p>
                  </div>

                </div>

                <div className="space-y-4">

                  <div>
                    <p className="text-gray-400 text-sm">Employees</p>
                    <p>{lead.employees}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Service</p>
                    <p>{lead.service}</p>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm">Requirement</p>

                    <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-4">
                      {lead.requirement || "No requirement provided"}
                    </div>

                  </div>

                </div>

              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">

                <span
                  className={`px-4 py-2 rounded-full font-bold
                    ${
                      lead.status === "approved"
                        ? "bg-green-600"
                        : lead.status === "rejected"
                        ? "bg-red-600"
                        : "bg-yellow-500 text-black"
                    }`}
                >
                  {(lead.status || "pending").toUpperCase()}
                </span>

                <div className="flex gap-3">

                  <button
                    onClick={() => updateStatus(lead.id, "approved")}
                    className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateStatus(lead.id, "pending")}
                    className="px-5 py-2 rounded-xl bg-yellow-500 text-black hover:bg-yellow-400"
                  >
                    Pending
                  </button>

                  <button
                    onClick={() => updateStatus(lead.id, "rejected")}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700"
                  >
                    Reject
                  </button>

                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}