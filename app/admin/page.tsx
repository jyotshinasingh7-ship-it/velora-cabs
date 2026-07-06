"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";


export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Yahan apna wo email likhein jisse aap admin access chahte hain
  const ADMIN_EMAIL = "admin@velora.com"; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email !== ADMIN_EMAIL) {
      alert("Access Denied: You are not an authorized admin.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Admin Login Error:", error);
      alert("Invalid Admin Credentials or Authentication failed.");
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
        <h1 className="text-3xl font-bold mb-6 text-yellow-500">Admin Login</h1>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Admin Email" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-yellow-500" 
            onChange={(e) => setEmail(e.target.value)} 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-yellow-500" 
            onChange={(e) => setPassword(e.target.value)} 
            required
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login to Admin Panel"}
          </button>
        </div>
      </form>
    </div>
  );
}