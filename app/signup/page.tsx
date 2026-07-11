"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  continueWithGoogle,
  getFirebaseAuthErrorMessage,
  logoutUser,
  signupWithEmail,
} from "@/lib/auth";

type AccountType = "customer" | "driver" | "partner";

const accountOptions = [
  {
    type: "customer" as const,
    title: "Customer",
    description: "Book and manage your rides",
    icon: UserRound,
  },
  {
    type: "driver" as const,
    title: "Driver",
    description: "Apply to drive and earn",
    icon: CarFront,
  },
  {
    type: "partner" as const,
    title: "Fleet Partner",
    description: "Attach and manage vehicles",
    icon: BriefcaseBusiness,
  },
];

function getNextPath(accountType: AccountType) {
  if (accountType === "driver") {
    return "/earn/driver";
  }

  if (accountType === "partner") {
    return "/earn/vehicle";
  }

  return "/dashboard";
}

export default function SignupPage() {
  const router = useRouter();

  const [accountType, setAccountType] =
    useState<AccountType>("customer");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [loadingAction, setLoadingAction] = useState<
    "email" | "google" | null
  >(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const saveSignupIntent = async (
    uid: string,
    selectedAccountType: AccountType
  ) => {
    await setDoc(
      doc(db, "users", uid),
      {
        accountType: selectedAccountType,
        onboardingIntent: selectedAccountType,
        applicationStatus:
          selectedAccountType === "customer"
            ? "not_required"
            : "not_started",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const validateForm = () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (cleanName.length < 2) {
      return "Please enter your full name.";
    }

    if (!cleanEmail) {
      return "Please enter your email address.";
    }

    if (password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    if (!acceptedTerms) {
      return "Please accept the Terms and Privacy Policy.";
    }

    return null;
  };

  const handleEmailSignup = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoadingAction("email");

      const user = await signupWithEmail({
        fullName,
        email,
        password,
      });

      await saveSignupIntent(user.uid, accountType);

      await logoutUser();

      setSuccess(
        "Account created. We sent a verification link to your email."
      );

      const params = new URLSearchParams({
        verification: "sent",
        email: email.trim().toLowerCase(),
        accountType,
      });

      window.setTimeout(() => {
        router.push(`/login?${params.toString()}`);
      }, 1200);
    } catch (signupError) {
      setError(
        getFirebaseAuthErrorMessage(signupError)
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setSuccess("");

    if (!acceptedTerms) {
      setError(
        "Please accept the Terms and Privacy Policy."
      );
      return;
    }

    try {
      setLoadingAction("google");

      const user = await continueWithGoogle();

      await saveSignupIntent(user.uid, accountType);

      router.push(getNextPath(accountType));
      router.refresh();
    } catch (googleError) {
      setError(
        getFirebaseAuthErrorMessage(googleError)
      );
    } finally {
      setLoadingAction(null);
    }
  };

  const isLoading = loadingAction !== null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 py-24 text-white sm:px-6">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-400/[0.08] blur-[150px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/[0.04] blur-[150px]" />

      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0e14]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[0.85fr_1.15fr]">
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
              One account.
              <span className="block text-amber-400">
                Multiple opportunities.
              </span>
            </h1>

            <p className="mt-5 max-w-md leading-7 text-white/55">
              Book premium rides, apply as a driver or
              attach your vehicle to the Velora network.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Verified and secure accounts",
                "Customer, driver and partner access",
                "Google and email authentication",
                "Role-based dashboards",
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
            Driver and fleet-partner access is activated
            only after document verification and admin
            approval.
          </p>
        </section>

        <section className="p-6 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
                Create your account
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Join Velora Mobility
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Choose how you want to use the Velora
                platform.
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {accountOptions.map((option) => {
                const Icon = option.icon;
                const selected =
                  accountType === option.type;

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => {
                      setAccountType(option.type);
                      setError("");
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    <Icon
                      size={21}
                      className={
                        selected
                          ? "text-amber-400"
                          : "text-white/45"
                      }
                    />

                    <p className="mt-3 text-sm font-semibold">
                      {option.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

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
              onSubmit={handleEmailSignup}
              className="mt-7 space-y-4"
            >
              <div>
                <label
                  htmlFor="full-name"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Full name
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                  />

                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setError("");
                    }}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
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
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
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
                <label
                  htmlFor="signup-password"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                  />

                  <input
                    id="signup-password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                    placeholder="Minimum 8 characters"
                    autoComplete="new-password"
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

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-2 block text-sm font-medium text-white/70"
                >
                  Confirm password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                  />

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(
                        event.target.value
                      );
                      setError("");
                    }}
                    placeholder="Enter password again"
                    autoComplete="new-password"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-12 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    setAcceptedTerms(
                      event.target.checked
                    );
                    setError("");
                  }}
                  disabled={isLoading}
                  className="mt-1 h-4 w-4 accent-amber-400"
                />

                <span className="text-xs leading-6 text-white/50">
                  I agree to the{" "}
                  <Link
                    href="/terms-and-conditions"
                    className="text-amber-400 hover:underline"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy-policy"
                    className="text-amber-400 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

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
                  ? "Creating Account..."
                  : "Create Account"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs uppercase tracking-[0.2em] text-white/30">
                Or continue with
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
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
              href={`/phone-auth?accountType=${accountType}`}
              className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 font-semibold text-white transition hover:bg-white/[0.07]"
            >
              <Phone size={19} className="text-amber-400" />
              Continue with Phone Number
            </Link>

            <p className="mt-7 text-center text-sm text-white/45">
              Already have an account?{" "}
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