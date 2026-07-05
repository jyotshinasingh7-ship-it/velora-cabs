"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
      >
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        
        <div className="space-y-6">
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <label className="block text-gray-400 text-sm mb-1">Email Address</label>
            <p className="text-lg font-medium">{user?.email}</p>
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <label className="block text-gray-400 text-sm mb-1">Account UID</label>
            <p className="text-sm font-mono text-yellow-500 break-all">{user?.uid}</p>
          </div>

          <div className="pt-6">
            <button 
              className="w-full py-4 bg-white/10 text-white rounded-lg hover:bg-white/20 transition font-bold"
              onClick={() => alert("Profile update feature coming soon!")}
            >
              Update Profile Details
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}