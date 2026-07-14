"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function DriverLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function redirectDriver(uid: string) {
    const currentUser = auth.currentUser;
    const usesPassword = currentUser?.providerData.some(
      (provider) => provider.providerId === "password"
    );

    if (currentUser && usesPassword && !currentUser.emailVerified) {
      alert("Verify your email before opening the driver portal.");
      await signOut(auth);
      return;
    }

    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found.");
      await signOut(auth);
      return;
    }

    const role = userSnap.data().role;

    if (role !== "driver") {
      const intent = userSnap.data().accountType ?? userSnap.data().onboardingIntent;
      if (intent === "driver") {
        router.push("/driver/onboarding");
        return;
      }
      alert("Access Denied"); await signOut(auth); router.push("/login");
      return;
    }

    router.push("/driver/dashboard");
  }

  async function handleGoogleLogin() {
    try {
      setLoading(true);

      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      await redirectDriver(result.user.uid);
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

      await redirectDriver(credential.user.uid);
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

        <h1 className="mb-2 text-3xl font-bold text-green-500">
          Driver Login
        </h1>

        <p className="mb-6 text-sm text-gray-400">
          Velora Cabs Driver Portal
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
            placeholder="Driver Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-4 outline-none focus:border-green-500"
          />

          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 p-4 outline-none focus:border-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-4 font-bold hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Driver Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
