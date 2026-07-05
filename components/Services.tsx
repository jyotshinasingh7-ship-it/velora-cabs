const services = [
  {
    title: "Local Taxi",
    desc: "Comfortable city rides across Noida & Delhi NCR.",
    icon: "🚖",
  },
  {
    title: "Airport Transfer",
    desc: "On-time pickup & drop for all airport terminals.",
    icon: "✈️",
  },
  {
    title: "Outstation",
    desc: "One-way & round-trip outstation taxi bookings.",
    icon: "🛣️",
  },
  {
    title: "Corporate Travel",
    desc: "Professional transport solutions for businesses.",
    icon: "💼",
  },
  {
    title: "Wedding & Events",
    desc: "Luxury vehicles for weddings and special occasions.",
    icon: "💍",
  },
  {
    title: "Tempo Traveller",
    desc: "Perfect for family trips and group travel.",
    icon: "🚌",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl font-bold text-center">
          Our Services
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-16">
          Premium cab services for every travel need.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyan-400 transition duration-300"
            >
              <div className="text-5xl mb-5">{service.icon}</div>

              <h3 className="text-2xl font-bold mb-3">
                {service.title}
              </h3>

              <p className="text-gray-400">
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}