"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="w-full flex justify-between items-center px-8 py-6 bg-black/50 backdrop-blur-md fixed top-0 z-50">
      <Link href="/" className="text-2xl font-bold text-yellow-500">
        VELORA
      </Link>

      <div className="flex gap-6 items-center">
        {user ? (
          <>
            <Link href="/book" className="text-white hover:text-yellow-500 transition font-bold">
              Book Now
            </Link>
            <Link href="/dashboard" className="text-white hover:text-yellow-500 transition">
              Dashboard
            </Link>
            <Link href="/profile" className="text-white hover:text-yellow-500 transition">
              Profile
            </Link>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-white"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-white hover:text-yellow-500 transition">
              Login
            </Link>
            <Link href="/signup" className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition">
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}