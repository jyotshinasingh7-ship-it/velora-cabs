"use client";

import { useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Firebase signup logic yahan Part 2 me aayega

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8">

        <h1 className="text-3xl font-bold text-center text-white mb-2">
          Create Account
        </h1>

        <p className="text-center text-gray-400 mb-8">
          Welcome to Velora Cabs
        </p>

        {error && (
          <div className="mb-5 rounded-xl bg-red-500/20 border border-red-500 text-red-300 p-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl bg-slate-800 p-4 text-white outline-none"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl bg-slate-800 p-4 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl bg-slate-800 p-4 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl bg-slate-800 p-4 text-white outline-none"
          />
          <button            
  type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-4 font-bold text-white hover:bg-cyan-600 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full rounded-xl border border-white/20 py-4 font-semibold text-white hover:bg-white hover:text-black transition"
          >
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!fullName || !email || !password || !confirmPassword) {
      return setError("Please fill all fields.");
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: fullName,
        email,
        role: "customer",
        createdAt: serverTimestamp(),
      });

      alert("Account created successfully!");

      window.location.href = "/login";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      await setDoc(
        doc(db, "users", result.user.uid),
        {
          uid: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          role: "customer",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    }
  }
}