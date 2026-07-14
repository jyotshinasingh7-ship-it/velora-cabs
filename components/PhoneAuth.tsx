"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ConfirmationResult } from "firebase/auth";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  Phone,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  clearPhoneRecaptcha,
  getPhoneAuthErrorMessage,
  getPhoneRedirectPath,
  sendPhoneOtp,
  type PhoneAccountType,
  verifyPhoneOtp,
} from "@/lib/phoneAuth";

type AuthStep = "phone" | "otp";

function getAccountType(
  value: string | null
): PhoneAccountType {
  if (
    value === "driver" ||
    value === "partner" ||
    value === "customer"
  ) {
    return value;
  }

  return "customer";
}

function getAccountLabel(
  accountType: PhoneAccountType
) {
  if (accountType === "driver") {
    return "Driver";
  }

  if (accountType === "partner") {
    return "Fleet Partner";
  }

  return "Customer";
}

export default function PhoneAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accountType = useMemo(
    () =>
      getAccountType(
        searchParams.get("accountType")
      ),
    [searchParams]
  );

  const [step, setStep] =
    useState<AuthStep>("phone");

  const [fullName, setFullName] =
    useState("");

  const [phoneNumber, setPhoneNumber] =
    useState("");

  const [otp, setOtp] =
    useState("");

  const [
    confirmationResult,
    setConfirmationResult,
  ] =
    useState<ConfirmationResult | null>(
      null
    );

  const [
    loadingAction,
    setLoadingAction,
  ] = useState<
    "send" | "verify" | "resend" | null
  >(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    return () => {
      clearPhoneRecaptcha();
    };
  }, []);

  const isLoading =
    loadingAction !== null;

  const cleanPhoneNumber =
    phoneNumber.replace(/\D/g, "");

  const maskedPhoneNumber =
    cleanPhoneNumber.length === 10
      ? `+91 ${cleanPhoneNumber.slice(
          0,
          5
        )} ${cleanPhoneNumber.slice(5)}`
      : "";

  function validatePhoneForm() {
    if (
      accountType !== "customer" &&
      fullName.trim().length < 2
    ) {
      return "Please enter your full name.";
    }

    if (cleanPhoneNumber.length !== 10) {
      return "Enter a valid 10-digit Indian phone number.";
    }

    return null;
  }

  async function handleSendOtp(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validatePhoneForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoadingAction("send");

      const result =
        await sendPhoneOtp({
          phoneNumber:
            cleanPhoneNumber,
          recaptchaContainerId:
            "phone-recaptcha-container",
        });

      setConfirmationResult(result);
      setStep("otp");

      setSuccess(
        `OTP sent successfully to ${maskedPhoneNumber}.`
      );
    } catch (sendError) {
      setError(
        getPhoneAuthErrorMessage(
          sendError
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleVerifyOtp(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanOtp =
      otp.replace(/\D/g, "");

    if (!confirmationResult) {
      setError(
        "OTP session not found. Please request a new OTP."
      );
      return;
    }

    if (cleanOtp.length !== 6) {
      setError(
        "Enter the complete 6-digit OTP."
      );
      return;
    }

    try {
      setLoadingAction("verify");

      const user =
        await verifyPhoneOtp({
          confirmationResult,
          otp: cleanOtp,
          accountType,
          fullName:
            fullName.trim() ||
            undefined,
        });

      setSuccess(
        "Phone number verified successfully."
      );

      const redirectPath =
        await getPhoneRedirectPath(
          user.uid
        );

      router.replace(redirectPath);
      router.refresh();
    } catch (verifyError) {
      setError(
        getPhoneAuthErrorMessage(
          verifyError
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleResendOtp() {
    setError("");
    setSuccess("");

    const validationError =
      validatePhoneForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoadingAction("resend");

      clearPhoneRecaptcha();

      const result =
        await sendPhoneOtp({
          phoneNumber:
            cleanPhoneNumber,
          recaptchaContainerId:
            "phone-recaptcha-container",
        });

      setConfirmationResult(result);
      setOtp("");

      setSuccess(
        `A new OTP was sent to ${maskedPhoneNumber}.`
      );
    } catch (resendError) {
      setError(
        getPhoneAuthErrorMessage(
          resendError
        )
      );
    } finally {
      setLoadingAction(null);
    }
  }

  function handleChangePhoneNumber() {
    clearPhoneRecaptcha();

    setStep("phone");
    setOtp("");
    setConfirmationResult(null);
    setError("");
    setSuccess("");
  }

  const accountLabel =
    getAccountLabel(accountType);
      return (
    <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 py-24 text-white sm:px-6">
      <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-400/[0.08] blur-[150px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white/[0.04] blur-[150px]" />

      <div className="relative mx-auto grid max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0e14]/95 shadow-[0_35px_120px_rgba(0,0,0,0.55)] backdrop-blur-2xl lg:grid-cols-[0.85fr_1.15fr]">
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
              Login securely with
              <span className="block text-amber-400">
                your phone number.
              </span>
            </h1>

            <p className="mt-5 max-w-md leading-7 text-white/55">
              Verify your Indian mobile number using a one-time
              password and continue as a {accountLabel.toLowerCase()}.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "Secure OTP verification",
                "Fast login without password",
                "Role-based dashboard access",
                "Firebase protected authentication",
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
            Standard SMS charges and Firebase authentication limits may
            apply.
          </p>
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
              Phone authentication
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              {step === "phone"
                ? "Enter your number"
                : "Verify your OTP"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              {step === "phone"
                ? `Continue as a ${accountLabel.toLowerCase()} using your Indian mobile number.`
                : `Enter the 6-digit code sent to ${maskedPhoneNumber}.`}
            </p>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                Account type
              </p>

              <p className="mt-1 font-semibold text-amber-400">
                {accountLabel}
              </p>
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

            {step === "phone" ? (
              <form
                onSubmit={handleSendOtp}
                className="mt-7 space-y-5"
              >
                {accountType !== "customer" && (
                  <div>
                    <label
                      htmlFor="phone-full-name"
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
                        id="phone-full-name"
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
                )}

                <div>
                  <label
                    htmlFor="phone-number"
                    className="mb-2 block text-sm font-medium text-white/70"
                  >
                    Mobile number
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                    />

                    <div className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 border-r border-white/10 pr-3 text-sm font-semibold text-white/70">
                      +91
                    </div>

                    <input
                      id="phone-number"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(event) => {
                        setPhoneNumber(
                          event.target.value.replace(/\D/g, "")
                        );
                        setError("");
                        setSuccess("");
                      }}
                      placeholder="10-digit mobile number"
                      autoComplete="tel-national"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-24 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAction === "send" && (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  )}

                  {loadingAction === "send"
                    ? "Sending OTP..."
                    : "Send OTP"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleVerifyOtp}
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="phone-otp"
                    className="mb-2 block text-sm font-medium text-white/70"
                  >
                    6-digit OTP
                  </label>

                  <div className="relative">
                    <LockKeyhole
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-400"
                    />

                    <input
                      id="phone-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => {
                        setOtp(
                          event.target.value.replace(/\D/g, "")
                        );
                        setError("");
                      }}
                      placeholder="Enter OTP"
                      autoComplete="one-time-code"
                      disabled={isLoading}
                      className="w-full rounded-xl border border-white/10 bg-black/25 py-4 pl-12 pr-4 text-center text-lg font-bold tracking-[0.35em] outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-white/25 focus:border-amber-400/60 disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingAction === "verify" && (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  )}

                  {loadingAction === "verify"
                    ? "Verifying OTP..."
                    : "Verify & Continue"}
                </button>
                                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-400 disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={handleChangePhoneNumber}
                    disabled={isLoading}
                    className="rounded-xl border border-white/10 py-3 text-sm font-semibold text-white transition hover:border-amber-400 hover:text-amber-400 disabled:opacity-50"
                  >
                    Change Number
                  </button>
                </div>
              </form>
            )}

            <div
              id="phone-recaptcha-container"
              className="mt-4"
            />

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={20}
                  className="mt-0.5 text-amber-400"
                />

                <div>
                  <h3 className="font-semibold">
                    Secure Authentication
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/50">
                    OTP verification is protected by Firebase Authentication,
                    invisible Google reCAPTCHA and encrypted communication.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs leading-6 text-white/35">
              By continuing you agree to Velora Mobility&apos;s Terms of Service
              and Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
