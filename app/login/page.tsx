"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone, ShieldCheck } from "lucide-react";

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
  const [loadingAction, setLoadingAction] = useState<"email" | "google" | "verification" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryEmail = params.get("email") ?? "";
    if (queryEmail) setEmail(queryEmail);
    if (params.get("verification") === "sent") setSuccess("Verification email sent. Verify your email, then login.");
    if (params.get("error") === "account-disabled") setError("Your account is disabled. Please contact Velora support.");
    if (params.get("error") === "email-not-verified") setError("Your email is not verified. Open the verification link sent to your inbox, then login.");
  }, []);

  async function redirectUser(uid: string) {
    const params = new URLSearchParams(window.location.search);
    const requestedPath = params.get("next");
    const rolePath = await getRedirectPath(uid);
    const safeNextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : null;

    router.replace(rolePath === "/dashboard" && safeNextPath ? safeNextPath : rolePath);
    router.refresh();
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess(""); setVerificationEmail("");
    if (!email.trim() || !password) { setError("Please enter your email and password."); return; }
    try {
      setLoadingAction("email");
      const user = await loginWithEmail({ email, password });
      if (isEmailVerificationRequired(user)) {
        setVerificationEmail(user.email ?? email);
        await logoutUser();
        setError("Your email is not verified. Open the verification link sent to your inbox.");
        return;
      }
      await redirectUser(user.uid);
    } catch (loginError) {
      setError(getFirebaseAuthErrorMessage(loginError));
    } finally { setLoadingAction(null); }
  }

  async function handleGoogleLogin() {
    setError(""); setSuccess(""); setVerificationEmail("");
    try {
      setLoadingAction("google");
      const user = await continueWithGoogle();
      await redirectUser(user.uid);
    } catch (googleError) {
      setError(getFirebaseAuthErrorMessage(googleError));
    } finally { setLoadingAction(null); }
  }

  async function handleResendVerification() {
    setError(""); setSuccess("");
    if (!email.trim() || !password) { setError("Enter your email and password first, then resend verification."); return; }
    try {
      setLoadingAction("verification");
      const user = await loginWithEmail({ email, password });
      if (!isEmailVerificationRequired(user)) { setSuccess("Your email is already verified."); await redirectUser(user.uid); return; }
      await resendVerificationEmail(user);
      await logoutUser();
      setVerificationEmail(user.email ?? email);
      setSuccess("A new verification link has been sent to your email.");
    } catch (verificationError) {
      setError(getFirebaseAuthErrorMessage(verificationError));
    } finally { setLoadingAction(null); }
  }

  const isLoading = loadingAction !== null;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070c] px-4 py-10 text-white sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-amber-400/[0.1] blur-[150px]" />
      <Link href="/" className="absolute left-4 top-5 inline-flex items-center gap-2 text-sm font-semibold text-white/45 transition hover:text-amber-400 sm:left-7 sm:top-7"><ArrowLeft size={17} />Home</Link>

      <section className="relative w-full max-w-[430px] rounded-[30px] border border-white/10 bg-[#0b1018]/95 p-6 shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:p-8">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-2xl border border-amber-400/25 bg-amber-400/10 shadow-[0_14px_40px_rgba(251,191,36,0.12)]"><Image src="/images/logo.png" alt="Velora Mobility" fill priority sizes="64px" className="object-contain p-1.5" /></div>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-400">Secure Access</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome to Velora</h1>
          <p className="mt-2 text-sm leading-6 text-white/42">Login to book, drive or manage your journeys.</p>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-3.5 text-sm leading-6 text-red-200">{error}{verificationEmail && <button type="button" onClick={handleResendVerification} disabled={isLoading} className="mt-2 block font-semibold text-amber-300 hover:underline">Resend verification email</button>}</div>}
        {success && <div role="status" className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-200">{success}</div>}

        <form onSubmit={handleEmailLogin} className="mt-7 space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-medium text-white/65">Email address</span><span className="relative block"><Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" /><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} autoComplete="email" placeholder="name@example.com" disabled={isLoading} className="w-full rounded-xl border border-white/10 bg-black/25 py-3.5 pl-11 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-amber-400/55" required /></span></label>
          <label className="block"><span className="mb-2 block text-sm font-medium text-white/65">Password</span><span className="relative block"><LockKeyhole size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} autoComplete="current-password" placeholder="Enter your password" disabled={isLoading} className="w-full rounded-xl border border-white/10 bg-black/25 py-3.5 pl-11 pr-12 text-sm outline-none placeholder:text-white/25 focus:border-amber-400/55" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/35 hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
          <div className="flex justify-end"><Link href="/forgot-password" className="text-xs font-semibold text-amber-400 hover:underline">Forgot password?</Link></div>
          <button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 font-bold text-black transition hover:bg-amber-300 disabled:opacity-50">{loadingAction === "email" && <LoaderCircle size={18} className="animate-spin" />}Login securely</button>
        </form>

        <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-[11px] uppercase tracking-widest text-white/25">or</span><span className="h-px flex-1 bg-white/10" /></div>
        <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-sm font-semibold transition hover:border-white/20 hover:bg-white/[0.06] disabled:opacity-50">{loadingAction === "google" ? <LoaderCircle size={18} className="animate-spin" /> : <span className="font-bold text-blue-400">G</span>}Continue with Google</button>
        <Link href="/phone-auth" className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-white/60 transition hover:border-amber-400/25 hover:text-amber-300"><Phone size={17} />Continue with Phone OTP</Link>

        <p className="mt-6 text-center text-sm text-white/40">New to Velora? <Link href="/signup" className="font-semibold text-amber-400 hover:underline">Create account</Link></p>
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-white/10 pt-5 text-[11px] text-white/28"><ShieldCheck size={14} />Protected with Firebase Authentication</div>
      </section>
    </main>
  );
}
