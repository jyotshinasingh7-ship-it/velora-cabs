export default function Stats() {
  const stats = [
    { number: "10K+", title: "Happy Customers" },
    { number: "50K+", title: "Rides Completed" },
    { number: "4.9★", title: "Google Rating" },
    { number: "24×7", title: "Support" },
  ];

  return (
    <section className="py-20 bg-cyan-500">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((item) => (
          <div
            key={item.title}
            className="text-center bg-white/10 rounded-2xl p-8 backdrop-blur-lg"
          >
            <h2 className="text-5xl font-bold">{item.number}</h2>
            <p className="mt-3 text-lg">{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}