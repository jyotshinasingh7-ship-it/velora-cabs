"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { isEmailVerificationRequired, logoutUser } from "@/lib/auth";
import type { DriverApplication } from "@/types/onboarding";
import NotificationBell from "@/components/NotificationBell";

type FormState = Omit<DriverApplication, "applicantUid" | "applicationId" | "accountType" | "status" | "reviewNotes" | "rejectionReason" | "changeRequests" | "schemaVersion">;
const emptyForm: FormState = { legalName: "", email: "", phoneNumber: "", dateOfBirth: "", address: "", city: "", state: "", pincode: "", licenceNumber: "", licenceExpiry: "", drivingExperienceYears: 0, preferredServiceArea: "", emergencyContact: { name: "", phone: "" }, languages: [], availability: "full_time", vehicleOwnershipType: "own_vehicle", declarationsAccepted: false, consentAccepted: false };

export default function DriverOnboardingForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [application, setApplication] = useState<DriverApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { let unsubscribeApplication: (() => void) | undefined; const unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
    unsubscribeApplication?.(); if (!currentUser) { router.replace("/login?next=/driver/onboarding"); return; }
    if (isEmailVerificationRequired(currentUser)) { await logoutUser(); router.replace("/login?error=email-not-verified&next=/driver/onboarding"); return; }
    setUser(currentUser);
    setForm(previous => ({ ...previous, legalName: currentUser.displayName ?? "", email: currentUser.email ?? "", phoneNumber: currentUser.phoneNumber ?? "" }));
    unsubscribeApplication = onSnapshot(doc(db, "driverApplications", currentUser.uid), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data() as DriverApplication;
        setApplication(data);
        setForm({ legalName: data.legalName, email: data.email, phoneNumber: data.phoneNumber, dateOfBirth: data.dateOfBirth, address: data.address, city: data.city, state: data.state, pincode: data.pincode, licenceNumber: data.licenceNumber, licenceExpiry: data.licenceExpiry, drivingExperienceYears: data.drivingExperienceYears, preferredServiceArea: data.preferredServiceArea, emergencyContact: data.emergencyContact, languages: data.languages, availability: data.availability, vehicleOwnershipType: data.vehicleOwnershipType, declarationsAccepted: data.declarationsAccepted, consentAccepted: data.consentAccepted });
        if (data.status === "approved") router.replace("/driver/dashboard");
      }
      setLoading(false);
    }, () => { setError("Unable to load your driver application."); setLoading(false); });
  }); return () => { unsubscribeAuth(); unsubscribeApplication?.(); }; }, [router]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) { setForm(previous => ({ ...previous, [key]: value })); setError(""); }
  function validate() {
    if (form.legalName.trim().length < 3) return "Enter your full legal name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email address.";
    if (!/^\+?[0-9]{10,13}$/.test(form.phoneNumber.replace(/[\s-]/g, ""))) return "Enter a valid phone number.";
    const birth = new Date(`${form.dateOfBirth}T00:00:00`); const minimumBirth = new Date(); minimumBirth.setFullYear(minimumBirth.getFullYear() - 21);
    if (!form.dateOfBirth || Number.isNaN(birth.getTime()) || birth > minimumBirth) return "Drivers must be at least 21 years old.";
    if (!form.address.trim() || !form.city.trim() || !form.state.trim()) return "Complete your current address.";
    if (!/^[1-9][0-9]{5}$/.test(form.pincode)) return "Enter a valid 6-digit PIN code.";
    if (!/^[A-Z0-9 -]{8,20}$/.test(form.licenceNumber.trim().toUpperCase())) return "Enter a valid driving licence number.";
    const expiry = new Date(`${form.licenceExpiry}T23:59:59`); if (!form.licenceExpiry || expiry <= new Date()) return "Driving licence expiry must be in the future.";
    if (form.drivingExperienceYears < 0 || form.drivingExperienceYears > 60) return "Enter valid driving experience.";
    if (!form.preferredServiceArea.trim()) return "Enter your preferred service area.";
    if (form.emergencyContact.name.trim().length < 2 || !/^[0-9+ -]{10,16}$/.test(form.emergencyContact.phone)) return "Enter a valid emergency contact.";
    if (!form.declarationsAccepted || !form.consentAccepted) return "Accept the required declarations and consent.";
    return "";
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); const message = validate(); if (message) { setError(message); return; }
    if (!user || (application && !["draft", "needs_changes"].includes(application.status))) return;
    try { setSubmitting(true); setError("");
      await setDoc(doc(db, "driverApplications", user.uid), { ...form, legalName: form.legalName.trim(), email: form.email.trim().toLowerCase(), phoneNumber: form.phoneNumber.trim(), licenceNumber: form.licenceNumber.trim().toUpperCase(), languages: form.languages.map(item => item.trim()).filter(Boolean), applicantUid: user.uid, applicationId: user.uid, accountType: "driver", status: "submitted", schemaVersion: 1, submittedAt: serverTimestamp(), updatedAt: serverTimestamp(), ...(application ? {} : { reviewNotes: "", rejectionReason: "", changeRequests: [], reviewedAt: null, reviewedBy: "", reviewHistory: [] }) }, { merge: Boolean(application) });
      await setDoc(doc(db, "users", user.uid), { accountType: "driver", onboardingIntent: "driver", applicationStatus: "submitted", updatedAt: serverTimestamp() }, { merge: true });
      await fetch("/api/notifications/events", { method: "POST", headers: { Authorization: `Bearer ${await user.getIdToken()}`, "Content-Type": "application/json" }, body: JSON.stringify({ event: "driver_application_submitted", documentId: user.uid }) }).catch(() => undefined);
      setSuccess("Your driver application has been submitted for review.");
    } catch { setError("Unable to submit your application. Check the form and try again."); } finally { setSubmitting(false); }
  }
  if (loading) return <Loading />;
  const locked = Boolean(application && !["draft", "needs_changes"].includes(application.status));
  return <ApplicationShell title="Driver onboarding" status={application?.status} notes={application?.reviewNotes || application?.rejectionReason}>
    {locked ? <StatusCopy status={application?.status ?? "submitted"} /> : <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Input label="Full legal name" value={form.legalName} onChange={v => setField("legalName", v)} /><Input label="Email" type="email" value={form.email} onChange={v => setField("email", v)} /><Input label="Phone number" value={form.phoneNumber} onChange={v => setField("phoneNumber", v)} /><Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={v => setField("dateOfBirth", v)} /><Input label="Current address" value={form.address} onChange={v => setField("address", v)} /><Input label="City" value={form.city} onChange={v => setField("city", v)} /><Input label="State" value={form.state} onChange={v => setField("state", v)} /><Input label="PIN code" value={form.pincode} onChange={v => setField("pincode", v)} /><Input label="Driving licence number" value={form.licenceNumber} onChange={v => setField("licenceNumber", v)} /><Input label="Licence expiry" type="date" value={form.licenceExpiry} onChange={v => setField("licenceExpiry", v)} /><Input label="Driving experience (years)" type="number" value={String(form.drivingExperienceYears)} onChange={v => setField("drivingExperienceYears", Number(v))} /><Input label="Preferred service area" value={form.preferredServiceArea} onChange={v => setField("preferredServiceArea", v)} /><Input label="Emergency contact name" value={form.emergencyContact.name} onChange={v => setField("emergencyContact", { ...form.emergencyContact, name: v })} /><Input label="Emergency contact phone" value={form.emergencyContact.phone} onChange={v => setField("emergencyContact", { ...form.emergencyContact, phone: v })} /><Input label="Languages (comma separated)" value={form.languages.join(", ")} onChange={v => setField("languages", v.split(","))} />
      <Select label="Availability" value={form.availability} onChange={v => setField("availability", v)} options={["full_time", "part_time", "weekends", "flexible"]} /><Select label="Vehicle ownership" value={form.vehicleOwnershipType} onChange={v => setField("vehicleOwnershipType", v as FormState["vehicleOwnershipType"])} options={["own_vehicle", "company_fleet", "no_vehicle"]} />
      <div className="sm:col-span-2 space-y-3"><Check label="I confirm that the information provided is accurate." checked={form.declarationsAccepted} onChange={v => setField("declarationsAccepted", v)} /><Check label="I consent to eligibility and document verification." checked={form.consentAccepted} onChange={v => setField("consentAccepted", v)} /></div>
      {error && <Message error text={error} />}{success && <Message text={success} />}<button disabled={submitting} className="sm:col-span-2 flex justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-black disabled:opacity-50">{submitting && <LoaderCircle className="animate-spin" size={18} />}{application ? "Resubmit application" : "Submit application"}</button>
    </form>}
  </ApplicationShell>;
}

export function ApplicationShell({ title, status, notes, children }: { title: string; status?: string; notes?: string; children: React.ReactNode }) { return <main className="min-h-screen bg-[#05070c] px-4 py-16 text-white sm:px-6"><section className="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-[#0b1018] p-6 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Earn with Velora</p><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-bold">{title}</h1><div className="flex items-center gap-3"><NotificationBell />{status && <span className="rounded-full bg-amber-400/10 px-4 py-2 text-sm capitalize text-amber-300">{status.replace(/_/g, " ")}</span>}</div></div>{notes && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100">Admin note: {notes}</div>}<div className="mt-8">{children}</div></section></main>; }
function StatusCopy({ status }: { status: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center"><CheckCircle2 className="mx-auto text-amber-400" size={36} /><h2 className="mt-4 text-xl font-bold capitalize">Application {status.replace(/_/g, " ")}</h2><p className="mt-3 text-sm text-white/50">{status === "rejected" ? "You may contact Velora support if you need clarification." : "You will see updates here after the operations team reviews your application."}</p></div>; }
function Loading() { return <main className="flex min-h-screen items-center justify-center bg-[#05070c] text-white"><LoaderCircle className="animate-spin text-amber-400" /></main>; }
export function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block"><span className="mb-2 block text-sm text-white/60">{label}</span><input required type={type} value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 outline-none focus:border-amber-400/60" /></label>; }
export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label><span className="mb-2 block text-sm text-white/60">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#090d14] px-4 py-3.5 capitalize outline-none focus:border-amber-400/60">{options.map(option => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}</select></label>; }
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex gap-3 text-sm text-white/60"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 accent-amber-400" />{label}</label>; }
export function Message({ text, error = false }: { text: string; error?: boolean }) { return <div className={`sm:col-span-2 rounded-xl border p-3 text-sm ${error ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"}`}>{text}</div>; }
