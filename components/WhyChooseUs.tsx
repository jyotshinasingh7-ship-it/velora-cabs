const features = [
  {
    title: "24×7 Availability",
    desc: "Book your cab anytime, day or night.",
    icon: "🕒",
  },
  {
    title: "Verified Drivers",
    desc: "Professional and background verified drivers.",
    icon: "👨‍✈️",
  },
  {
    title: "GPS Tracked Rides",
    desc: "Safe and live route tracking for every trip.",
    icon: "📍",
  },
  {
    title: "Transparent Pricing",
    desc: "No hidden charges. Fixed & fair fares.",
    icon: "💰",
  },
  {
    title: "Airport Transfers",
    desc: "On-time pickup and drop for all airports.",
    icon: "✈️",
  },
  {
    title: "Fast Booking",
    desc: "Book your cab within seconds.",
    icon: "⚡",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl font-bold text-center">
          Why Choose Velora Cabs?
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-16">
          Premium taxi experience with safety, comfort and affordable pricing.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item) => (
            <div
              key={item.title}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyan-400 transition"
            >
              <div className="text-5xl mb-6">{item.icon}</div>

              <h3 className="text-2xl font-bold mb-3">
                {item.title}
              </h3>

              <p className="text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}