"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminHeader() {
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminName(user.displayName || "Admin");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 left-72 right-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">

      <div className="flex items-center justify-between px-8 py-5">

        <div>
          <h1 className="text-3xl font-bold text-white">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Welcome back, {adminName}
          </p>
        </div>

        <div className="flex items-center gap-4">

          <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10">
            🔔
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-white">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="font-semibold">
                {adminName}
              </p>

              <p className="text-xs text-gray-400">
                Administrator
              </p>
            </div>

          </div>

        </div>

      </div>

    </header>
  );
}