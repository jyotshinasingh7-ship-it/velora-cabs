import BookingForm from "@/components/BookingForm";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const supportedServices = ["local", "airport", "outstation"] as const;
type SupportedService = (typeof supportedServices)[number];

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const requestedService = (params.service ?? "local").toLowerCase();
  const serviceType: SupportedService = requestedService === "intercity"
    ? "outstation"
    : supportedServices.includes(requestedService as SupportedService)
      ? requestedService as SupportedService
      : "local";
  const customService = ["wedding", "tempo", "custom", "custom-tour"].includes(requestedService);
  const isIntercity = serviceType === "outstation";
  return (
    <>
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-[#05070c] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 rounded-full bg-amber-400/[0.07] blur-[150px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/[0.04] blur-[150px]" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">Velora Mobility</p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">{isIntercity ? "Plan your intercity ride" : "Book your next ride"}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">{isIntercity ? "Choose one-way or round-trip travel with scheduled pickup and a distance-based fare estimate." : "Choose exact pickup and destination locations, compare available vehicles and get a transparent fare estimate."}</p>
          </div>

          <section className="rounded-[32px] border border-white/10 bg-[#0b1018]/90 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-6 lg:p-8">
            {customService ? (
              <div className="py-10 text-center">
                <h2 className="text-2xl font-bold">This trip needs a custom travel plan</h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50">Wedding, event, Tempo Traveller and custom-tour requests use vehicle and itinerary-specific pricing, so they are not estimated as local taxi rides.</p>
                <Link href="/custom-tours" className="mt-7 inline-flex rounded-xl bg-amber-400 px-6 py-3 font-bold text-black transition hover:bg-amber-300">Open Custom Tours</Link>
              </div>
            ) : (
              <BookingForm serviceType={serviceType} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
