"use client";

interface DashboardCardsProps {
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  customers: number;
  drivers: number;
}

export default function DashboardCards({
  totalBookings,
  todayBookings,
  pendingBookings,
  completedBookings,
  cancelledBookings,
  revenue,
  customers,
  drivers,
}: DashboardCardsProps) {
  const cards = [
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: "📖",
      color: "from-cyan-500 to-blue-600",
    },
    {
      title: "Today's Bookings",
      value: todayBookings,
      icon: "📅",
      color: "from-green-500 to-emerald-600",
    },
    {
      title: "Pending",
      value: pendingBookings,
      icon: "⏳",
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Completed",
      value: completedBookings,
      icon: "✅",
      color: "from-lime-500 to-green-600",
    },
    {
      title: "Cancelled",
      value: cancelledBookings,
      icon: "❌",
      color: "from-red-500 to-pink-600",
    },
    {
      title: "Revenue",
      value: `₹${revenue.toLocaleString()}`,
      icon: "💰",
      color: "from-purple-500 to-indigo-600",
    },
    {
      title: "Customers",
      value: customers,
      icon: "👥",
      color: "from-sky-500 to-cyan-600",
    },
    {
      title: "Drivers",
      value: drivers,
      icon: "🚖",
      color: "from-fuchsia-500 to-pink-600",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-3xl bg-gradient-to-br ${card.color} p-6 shadow-xl`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">{card.title}</p>

              <h2 className="mt-3 text-4xl font-bold text-white">
                {card.value}
              </h2>
            </div>

            <div className="text-5xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}