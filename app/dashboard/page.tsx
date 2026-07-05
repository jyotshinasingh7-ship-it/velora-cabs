import BookingForm from "@/components/BookingForm";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">

      {/* Header */}
      <section className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Velora Cabs Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Book safe, fast and affordable rides.
            </p>
          </div>

          <div className="hidden md:flex gap-3">
            <button className="rounded-xl border border-cyan-500 px-5 py-2 hover:bg-cyan-500 transition">
              My Bookings
            </button>

            <button className="rounded-xl bg-cyan-500 px-5 py-2 hover:bg-cyan-600 transition">
              Profile
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <BookingForm />
      </section>

    </main>
  );
}