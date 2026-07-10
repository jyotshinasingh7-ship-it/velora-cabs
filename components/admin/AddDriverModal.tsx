"use client";

import { useEffect, useState } from "react";

interface DriverFormData {
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehicleNumber: string;
  licenseNumber: string;
}

interface AddDriverModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (driver: DriverFormData) => Promise<void>;
}

const initialForm: DriverFormData = {
  name: "",
  email: "",
  phone: "",
  vehicleType: "",
  vehicleNumber: "",
  licenseNumber: "",
};

export default function AddDriverModal({
  open,
  onClose,
  onSave,
}: AddDriverModalProps) {
  const [form, setForm] = useState<DriverFormData>(initialForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.vehicleType ||
      !form.vehicleNumber ||
      !form.licenseNumber
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);
      await onSave(form);
      setForm(initialForm);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">
            Add New Driver
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          <Input
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />

          <Select
            label="Vehicle Type"
            name="vehicleType"
            value={form.vehicleType}
            onChange={handleChange}
          />

          <Input
            label="Vehicle Number"
            name="vehicleNumber"
            value={form.vehicleNumber}
            onChange={handleChange}
          />

          <Input
            label="License Number"
            name="licenseNumber"
            value={form.licenseNumber}
            onChange={handleChange}
          />
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/20 px-6 py-3 text-white transition hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Driver"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function Select({
  label,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-gray-300">
        {label}
      </label>

      <select
        {...props}
        className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
      >
        <option value="">Select Vehicle</option>
        <option value="Sedan">Sedan</option>
        <option value="SUV">SUV</option>
        <option value="Hatchback">Hatchback</option>
        <option value="Luxury">Luxury</option>
      </select>
    </div>
  );
}