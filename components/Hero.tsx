export default function Hero() {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white pt-24"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 px-6 items-center">

        <div>
          <span className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full">
            Premium Taxi Service in Noida
          </span>

          <h1 className="text-6xl font-bold mt-6 leading-tight">
            Ride Safe,
            <br />
            Ride Smart
            <br />
            with
            <span className="text-cyan-400"> Velora Cabs</span>
          </h1>

          <p className="text-gray-300 mt-6 text-lg">
            Local Taxi • Airport Transfer • Outstation • Corporate Travel
          </p>

          <div className="flex gap-4 mt-8">
            <button className="bg-cyan-500 hover:bg-cyan-600 px-8 py-4 rounded-full font-semibold">
              Book Ride
            </button>

            <a
              href="tel:9997997390"
              className="border border-cyan-400 px-8 py-4 rounded-full"
            >
              Call 9997997390
            </a>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold mb-6">
            Quick Booking
          </h2>

          <input
            placeholder="Pickup Location"
            className="w-full mb-4 p-4 rounded-xl bg-black/30"
          />

          <input
            placeholder="Drop Location"
            className="w-full mb-4 p-4 rounded-xl bg-black/30"
          />

          <select className="w-full mb-4 p-4 rounded-xl bg-black/30">
            <option>Sedan</option>
            <option>SUV</option>
            <option>7 Seater</option>
            <option>Tempo Traveller</option>
          </select>

          <button className="w-full bg-cyan-500 py-4 rounded-xl font-bold">
            Check Fare
          </button>
        </div>

      </div>
    </section>
  );
}