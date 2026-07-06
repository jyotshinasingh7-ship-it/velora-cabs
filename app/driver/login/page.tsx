"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Driver ki email yahan define karein
  const DRIVER_EMAIL = "driver@velora.com"; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email !== DRIVER_EMAIL) {
      alert("Unauthorized: Only registered drivers can access this portal.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/driver/dashboard");
    } catch (error) {
      alert("Invalid Driver Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <form 
        onSubmit={handleLogin} 
        className="p-8 bg-white/5 border border-white/10 rounded-2xl w-full max-w-md backdrop-blur-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-green-500">Driver Login</h1>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Driver Email" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500" 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-green-500" 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login to Driver Portal"}
          </button>
        </div>
      </form>
    </div>
  );
}