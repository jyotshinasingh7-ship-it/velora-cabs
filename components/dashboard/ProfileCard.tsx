"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function ProfileCard() {
  const [name, setName] = useState("Velora Customer");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login";
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          setName(data.name || user.displayName || "Customer");
          setEmail(data.email || user.email || "");
        } else {
          setName(user.displayName || "Customer");
          setEmail(user.email || "");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
      alert("Logout failed.");
    }
  }

  const initial =
    name && name.length > 0
      ? name.charAt(0).toUpperCase()
      : "V";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

      <div className="flex items-center gap-4">

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500 text-2xl font-bold">
          {initial}
        </div>

        <div>

          <h2 className="text-xl font-semibold">
            {loading ? "Loading..." : `Welcome, ${name}`}
          </h2>

          <p className="text-sm text-gray-400">
            {loading ? "Loading..." : email}
          </p>

        </div>

      </div>

      <div className="mt-6 space-y-3 text-sm">

        <div className="flex justify-between">
          <span className="text-gray-400">
            Account
          </span>

          <span className="text-green-400">
            Active
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">
            Membership
          </span>

          <span>
            Standard
          </span>
        </div>

      </div>

      <button
        onClick={handleLogout}
        className="mt-6 w-full rounded-xl bg-red-500 py-3 font-semibold transition hover:bg-red-600"
      >
        Logout
      </button>

    </div>
  );
}