"use client";

interface BookingStatsProps {
  stats: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
}

export default function BookingStats({
  stats,
}: BookingStatsProps) {
  const cards = [
    {
      title: "Total Bookings",
      value: stats.total,
      color: "text-cyan-400",
    },
    {
      title: "Completed",
      value: stats.completed,
      color: "text-green-400",
    },
    {
      title: "Pending",
      value: stats.pending,
      color: "text-yellow-400",
    },
    {
      title: "Cancelled",
      value: stats.cancelled,
      color: "text-red-400",
    },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">

      <h2 className="mb-6 text-2xl font-bold">
        Booking Statistics
      </h2>

      <div className="grid grid-cols-2 gap-4">

        {cards.map((card) => (

          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-slate-900 p-5"
          >

            <p className="text-sm text-gray-400">
              {card.title}
            </p>

            <h3
              className={`mt-3 text-3xl font-bold ${card.color}`}
            >
              {card.value}
            </h3>

          </div>

        ))}

      </div>

    </div>
  );
}