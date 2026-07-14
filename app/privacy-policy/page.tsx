import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#05070c] px-4 py-16 text-white sm:px-6">
      <article className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-[#0b1018] p-6 sm:p-10">
        <Link href="/signup" className="text-sm font-semibold text-amber-400">Back to signup</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Velora Mobility</p>
        <h1 className="mt-3 text-3xl font-bold">Privacy Policy</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-white/60">
          <p>Velora collects the account, contact, booking, location, trip, payment-status, device, and support information needed to provide and secure its mobility services. Payment credentials are processed by the configured payment provider and should not be stored in Velora booking documents.</p>
          <p>Information is used to authenticate users, arrange rides, calculate routes and fares, communicate trip updates, prevent misuse, provide support, meet legal duties, and improve service reliability.</p>
          <p>Relevant trip details may be shared with the assigned driver, customer, fleet partner, payment provider, mapping provider, Firebase services, and authorities where legally required. Velora does not sell personal information.</p>
          <p>Access is limited through authentication and role-based database rules. Data is retained only as needed for operations, disputes, fraud prevention, accounting, and legal obligations.</p>
          <p>To request access, correction, or deletion of eligible personal information, contact info@veloramobility.in. Some records may need to be retained where required by law or for active disputes.</p>
        </div>
      </article>
    </main>
  );
}
