"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, db, googleProvider } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const redirectByRole = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      alert("User profile not found.");
      await auth.signOut();
      return;
    }

    const role = userSnap.data().role;

    if (role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "driver") {
      router.push("/driver/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const result = await signInWithPopup(auth, googleProvider);

      await redirectByRole(result.user.uid);
    } catch (error) {
      console.error(error);
      alert("Google Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      await redirectByRole(userCredential.user.uid);
    } catch (error) {
      console.error(error);
      alert("Invalid Email or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

        <h1 className="mb-6 text-3xl font-bold">
          Login to Velora
        </h1>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mb-4 w-full rounded-lg bg-white py-3 font-bold text-black transition hover:bg-gray-200 disabled:opacity-50"
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
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 p-4 outline-none focus:border-cyan-500"
          />

          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 p-4 outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-4 font-bold transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}