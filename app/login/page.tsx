"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

import {
  continueWithGoogle,
  getFirebaseAuthErrorMessage,
  getRedirectPath,
  isEmailVerificationRequired,
  loginWithEmail,
  logoutUser,
  resendVerificationEmail,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loadingAction, setLoadingAction] = useState<
    "email" | "google" | "verification" | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const verification = params.get("verification");
    const queryEmail = params.get("email") ?? "";

    if (queryEmail) {
      setEmail(queryEmail);
    }

    if (verification === "sent") {
      setSuccess(
        "Verification email sent. Verify your email, then login."
      );
    }

    if (params.get("error") === "account-disabled") {
      setError(
        "Your account is disabled. Please contact Velora support."
      );
    }
  }, []);

  async function redirectUser(uid: string) {
    const redirectPath = await getRedirectPath(uid);

    router.replace(redirectPath);
    router.refresh();
  }

  async function handleEmailLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setVerificationEmail("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoadingAction("email");

      const user = await loginWithEmail({
        email,
        password,
      });

      if (isEmailVerificationRequired(user)) {
        setVerificationEmail(user.email ?? email);

        await logoutUser();

        setError(
          "Your email is not verified. Open the verification link sent to your inbox."
        );

        return;
      }

      await redirectUser(user.uid);
    } catch (loginError) {
      setError(
        getFirebaseAuthErrorMessage(loginError)
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSuccess("");
    setVerificationEmail("");

    try {
      setLoadingAction("google");

      const user = await continueWithGoogle();

      await redirectUser(user.uid);
    } catch (googleError) {
      setError(
        getFirebaseAuthErrorMessage(googleError)
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleResendVerification() {
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError(
        "Enter your email and password first, then resend verification."
      );
      return;
    }

    try {
      setLoadingAction("verification");

      const user = await loginWithEmail({
        email,
        password,
      });

      if (!isEmailVerificationRequired(user)) {
        setSuccess("Your email is already verified.");
        await redirectUser(user.uid);
        return;
      }

      await resendVerificationEmail(user);
      await logoutUser();

      setVerificationEmail(user.email ?? email);

      setSuccess(
        "A new verification link has been sent to your email."
      );
    } catch (verificationError) {
      setError(
        getFirebaseAuthErrorMessage(verificationError)
      );
    } finally {
      setLoadingAction(null);
    }
  }

  const isLoading = loadingAction !== null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 py-24 text-white sm:px-6">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-400/[0.08] blur-[150px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/[0.04] blur-[150px]" />

      <div className="relative mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0e14]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[0.85fr_1.15fr]">
        <section className="hidden border-r border-white/10 bg-gradient-to-b from-amber-400/10 to-transparent p-10 lg:flex lg:flex-col">
          <Link href="/" className="text-2xl font-bold">
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
              Welcome back to
              <span className="block text-amber-400">
                Velora Mobility.
              </span>
            </h1>

            <p className="mt-5 max-w-md leading-7 text-white/55">
              Customers, drivers, fleet partners and administrators
              can securely access their respective dashboards from
              one login page.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Secure role-based access",
                "Verified customer accounts",
                "Google, email and phone login",
                "Separate dashboards for every role",
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

          <p className="text-xs leading-5 text-white/35">
            Driver and fleet-partner dashboards remain unavailable
            until their applications are approved.
          </p>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
              Secure login
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Login to Velora
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Enter your credentials or continue with Google or phone.
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
              onSubmit={handleEmailLogin}
              className="mt-7 space-y-4"
            >
              <div>
                <label
                  htmlFor="login-email"
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
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                      setVerificationEmail("");
                    }}
                    placeholder="name@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="login-password"
                    className="text-sm font-medium text-white/70"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-amber-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                  />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-12 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((previous) => !previous)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "email" && (
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                )}

                {loadingAction === "email"
                  ? "Logging In..."
                  : "Login"}
              </button>
            </form>

            {verificationEmail && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isLoading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-6 py-4 font-semibold text-amber-300 transition hover:bg-amber-400 hover:text-black disabled:opacity-50"
              >
                {loadingAction === "verification" && (
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                )}

                Resend verification email
              </button>
            )}

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                Or continue with
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-6 py-4 font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingAction === "google" ? (
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10 text-sm font-bold">
                  G
                </span>
              )}

              {loadingAction === "google"
                ? "Connecting..."
                : "Continue with Google"}
            </button>

            <Link
              href="/phone-auth"
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 font-semibold text-white transition hover:bg-white/[0.07]"
            >
              <Phone size={19} className="text-amber-400" />
              Login with Phone Number
            </Link>

            <p className="mt-7 text-center text-sm text-white/45">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-amber-400 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
