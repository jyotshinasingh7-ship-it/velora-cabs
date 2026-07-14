"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function redirectAdmin(uid: string) {
    const currentUser = auth.currentUser;
    const usesPassword = currentUser?.providerData.some(
      (provider) => provider.providerId === "password"
    );

    if (currentUser && usesPassword && !currentUser.emailVerified) {
      alert("Verify your email before opening the admin portal.");
      await auth.signOut();
      return;
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found.");
      await auth.signOut();
      return;
    }

    const role = userSnap.data().role;

    if (role !== "admin") {
      alert("Access Denied");
      await auth.signOut();
      router.push("/login");
      return;
    }

    router.push("/admin/dashboard");
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);

      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      await redirectAdmin(result.user.uid);
    } catch (error) {
      console.error(error);
      alert("Google Login Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setLoading(true);

      const credential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      await redirectAdmin(credential.user.uid);
    } catch (error) {
      console.error(error);
      alert("Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

        <h1 className="mb-2 text-3xl font-bold">
          Admin Login
        </h1>

        <p className="mb-6 text-sm text-gray-400">
          Velora Cabs Administration Panel
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-4 w-full rounded-lg bg-white py-3 font-bold text-black hover:bg-gray-200 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-4 text-center text-gray-500">
          OR
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-4"
        >
          <input
            type="email"
            required
            placeholder="Admin Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-4 outline-none focus:border-cyan-500"
          />

          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-4 outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-4 font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Admin Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
