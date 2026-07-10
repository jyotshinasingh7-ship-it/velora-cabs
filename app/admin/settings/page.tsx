"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import PageHeader from "@/components/admin/PageHeader";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    company: "Velora Cabs",
    supportEmail: "support@velora.com",
    phone: "+91 9876543210",
    address: "Jaipur, Rajasthan",
    currency: "INR (₹)",
    tax: 5,
    mapsKey: "",
    notifications: true,
  });

  function updateField(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = e.target;

    setSettings({
      ...settings,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  }

  function saveSettings() {
    alert(
      "Settings saved successfully.\n\nFirebase integration will be added next."
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">

      <PageHeader
        title="Settings"
        subtitle="Manage your application settings."
      />

      <div className="rounded-2xl border border-white/10 bg-slate-900 p-8">

        <div className="grid gap-6 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-gray-400">
              Company Name
            </label>

            <input
              name="company"
              value={settings.company}
              onChange={updateField}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-gray-400">
              Support Email
            </label>

            <input
              name="supportEmail"
              value={settings.supportEmail}
              onChange={updateField}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-gray-400">
              Phone
            </label>

            <input
              name="phone"
              value={settings.phone}
              onChange={updateField}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-gray-400">
              Office Address
            </label>

            <input
              name="address"
              value={settings.address}
              onChange={updateField}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-gray-400">
              Currency
            </label>

            <input
              name="currency"
              value={settings.currency}
              onChange={updateField}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div>

            <label className="mb-2 block text-gray-400">
              GST (%)
            </label>

            <input
              type="number"
              name="tax"
              value={settings.tax}
              onChange={updateField}
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div className="md:col-span-2">

            <label className="mb-2 block text-gray-400">
              Google Maps API Key
            </label>

            <input
              name="mapsKey"
              value={settings.mapsKey}
              onChange={updateField}
              placeholder="Paste API Key here..."
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-cyan-500"
            />

          </div>

          <div className="md:col-span-2 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 p-5">

            <div>

              <h3 className="font-semibold">
                Email Notifications
              </h3>

              <p className="text-sm text-gray-400">
                Receive booking and payment alerts.
              </p>

            </div>

            <input
              type="checkbox"
              name="notifications"
              checked={settings.notifications}
              onChange={updateField}
              className="h-6 w-6"
            />

          </div>

        </div>

        <button
          onClick={saveSettings}
          className="mt-8 flex items-center gap-3 rounded-xl bg-cyan-500 px-8 py-4 font-bold transition hover:bg-cyan-600"
        >

          <Save size={20} />

          Save Settings

        </button>

      </div>

    </div>
  );
}