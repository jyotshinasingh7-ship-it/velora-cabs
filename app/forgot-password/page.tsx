"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  getFirebaseAuthErrorMessage,
  sendResetPasswordEmail,
} from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      await sendResetPasswordEmail(email);

      setSuccess(
        "Password reset link sent. Please check your inbox and spam folder."
      );
    } catch (resetError) {
      setError(
        getFirebaseAuthErrorMessage(resetError)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 py-24 text-white sm:px-6">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-400/[0.08] blur-[150px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/[0.04] blur-[150px]" />

      <div className="relative mx-auto grid max-w-4xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0e14]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[0.85fr_1.15fr]">
        <section className="hidden border-r border-white/10 bg-gradient-to-b from-amber-400/10 to-transparent p-10 lg:flex lg:flex-col">
          <Link
            href="/"
            className="text-2xl font-bold"
          >
            Velora
            <span className="ml-1 text-amber-400">
              Mobility
            </span>
          </Link>

          <div className="my-auto">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-black">
              <ShieldCheck size={30} />
            </div>

            <h1 className="mt-8 text-4xl font-extrabold leading-tight">
              Reset your
              <span className="block text-amber-400">
                account password.
              </span>
            </h1>

            <p className="mt-5 max-w-md leading-7 text-white/55">
              We will send a secure reset link to your registered
              email address.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Secure Firebase password reset",
                "Reset link sent to registered email",
                "Old password remains protected",
                "Available for all account roles",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-white/70"
                >
                  <CheckCircle2
                    size={18}
                    className="shrink-0 text-amber-400"
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition hover:text-amber-400"
            >
              <ArrowLeft size={17} />
              Back to login
            </Link>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
              Password recovery
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Forgot your password?
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Enter your registered email and we will send a
              password reset link.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-6 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm leading-6 text-green-200"
              >
                {success}
              </div>
            )}

            <form
              onSubmit={handleResetPassword}
              className="mt-7 space-y-5"
            >
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                  />

                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setSuccess("");
                    }}
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                )}

                {loading
                  ? "Sending Reset Link..."
                  : "Send Reset Link"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-white/45">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-amber-400 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}