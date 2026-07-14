"use client";

import { ReactNode, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

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
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return children;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070c] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
          <p className="mt-4 text-sm text-white/50">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-white">

      <AdminSidebar />

      <div className="lg:ml-72">

        <AdminHeader />

        <main className="px-4 pb-28 pt-28 sm:px-6 lg:px-8 lg:pb-10 lg:pt-28">
          {children}
        </main>

      </div>

    </div>
  );
}
