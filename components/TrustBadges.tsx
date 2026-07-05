export default function TrustBadges() {
  const badges = [
    {
      icon: "🛡️",
      title: "Verified Drivers",
      text: "Professional & Background Verified",
    },
    {
      icon: "📍",
      title: "GPS Tracking",
      text: "Live Ride Tracking",
    },
    {
      icon: "💳",
      title: "Secure Payments",
      text: "UPI, Card & Cash",
    },
    {
      icon: "⏰",
      title: "24×7 Service",
      text: "Always Available",
    },
    {
      icon: "💰",
      title: "Transparent Pricing",
      text: "No Hidden Charges",
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-center">
          Why Customers Trust Velora Cabs
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-14">
          Safe, Reliable and Affordable Taxi Service in Noida
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">

          {badges.map((badge) => (
            <div
              key={badge.title}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:scale-105 transition"
            >
              <div className="text-5xl mb-5">
                {badge.icon}
              </div>

              <h3 className="text-xl font-bold">
                {badge.title}
              </h3>

              <p className="text-gray-400 mt-3">
                {badge.text}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}