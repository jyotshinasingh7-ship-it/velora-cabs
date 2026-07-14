import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-[#05070c] px-4 py-16 text-white sm:px-6">
      <article className="mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-[#0b1018] p-6 sm:p-10">
        <Link href="/signup" className="text-sm font-semibold text-amber-400">Back to signup</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Velora Mobility</p>
        <h1 className="mt-3 text-3xl font-bold">Terms and Conditions</h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-white/60">
          <p>By creating an account or requesting a ride, you agree to provide accurate information, use the service lawfully, and follow the booking, payment, cancellation, and safety instructions shown during your journey.</p>
          <p>Ride availability, arrival estimates, routes, fares, and completion times can change because of traffic, demand, weather, tolls, waiting time, route changes, or other operating conditions. Any updated charge must be shown or communicated through the applicable booking flow.</p>
          <p>Drivers and vehicle partners must provide valid, current identity, licence, vehicle, insurance, permit, and banking information. Submitting an application does not guarantee approval or activation.</p>
          <p>You are responsible for protecting your account and for promptly reporting unauthorized access. Velora may suspend accounts used fraudulently, unlawfully, unsafely, or in breach of these terms.</p>
          <p>For booking or account questions, contact info@veloramobility.in or +91 99979 97390. Applicable consumer rights and mandatory law continue to apply.</p>
        </div>
      </article>
    </main>
  );
}
