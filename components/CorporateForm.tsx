"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CorporateForm() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    employees: "",
    service: "Employee Transport",
    requirement: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      await addDoc(collection(db, "corporate_requests"), {
        ...form,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      alert("Thank you! Our corporate team will contact you shortly.");

      setForm({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        city: "",
        employees: "",
        service: "Employee Transport",
        requirement: "",
      });
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="corporate-form"
      className="bg-[#050816] py-24"
    >
      <div className="max-w-3xl mx-auto px-6">

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10">

          <h2 className="text-4xl font-bold text-white text-center">
            Request a Corporate Quote
          </h2>

          <p className="text-center text-gray-400 mt-4 mb-10">
            Fill in your company details and our corporate team will get back
            to you within 24 hours.
          </p>

          <form
            onSubmit={submitForm}
            className="space-y-5"
          >
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Company Name"
              required
              className="w-full rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
            />

            <input
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChange}
              placeholder="Contact Person"
              required
              className="w-full rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
            />

            <div className="grid md:grid-cols-2 gap-5">

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Business Email"
                required
                className="rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
              />

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
                className="rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
              />

            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="City"
                required
                className="rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
              />

              <input
                name="employees"
                value={form.employees}
                onChange={handleChange}
                placeholder="Number of Employees"
                required
                className="rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
              />

            </div>

            <select
              name="service"
              value={form.service}
              onChange={handleChange}
              className="w-full rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
            >
              <option>Employee Transport</option>
              <option>Airport Transfer</option>
              <option>Corporate Events</option>
              <option>Outstation Travel</option>
              <option>Monthly Rental</option>
            </select>

            <textarea
              rows={5}
              name="requirement"
              value={form.requirement}
              onChange={handleChange}
              placeholder="Tell us about your transportation requirements..."
              className="w-full rounded-xl bg-black/20 border border-white/10 p-4 outline-none focus:border-cyan-500"
            />

            <button
              disabled={loading}
              className="w-full rounded-xl bg-cyan-500 py-4 text-lg font-bold hover:bg-cyan-600 transition disabled:opacity-50"
            >
              {loading
                ? "Submitting..."
                : "Request Corporate Quote"}
            </button>

          </form>

        </div>

      </div>
    </section>
  );
}