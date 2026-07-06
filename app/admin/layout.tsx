"use client";

import { ReactNode, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists()) {
        router.replace("/dashboard");
        return;
      }

      const role = snap.data().role;

      if (role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-xl">
        Loading Admin Panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <AdminSidebar />

      <div className="ml-72">

        <AdminHeader />

        <main className="p-8 pt-28">
          {children}
        </main>

      </div>

    </div>
  );
}