"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "@/lib/firebase";
import NotificationBell from "@/components/NotificationBell";

export default function AdminHeader() {
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => onAuthStateChanged(auth, (user) => {
    if (user) setAdminName(user.displayName || "Admin");
  }), []);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-[#05070c]/85 backdrop-blur-2xl lg:left-72">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-400"><ShieldCheck size={14} /> Admin Workspace</div>
          <h1 className="mt-1 truncate text-lg font-bold text-white sm:text-xl">Welcome back, {adminName}</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 font-bold text-black">{adminName.charAt(0).toUpperCase()}</span>
            <span className="hidden text-sm font-semibold text-white/75 sm:block">{adminName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
