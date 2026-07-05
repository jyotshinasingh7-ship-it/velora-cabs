export default function Fleet() {
  const fleet = [
    {
      name: "Hatchback",
      image:
        "https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800",
      seats: "4 Seats",
      luggage: "2 Bags",
      price: "Starts ₹12/km",
    },
    {
      name: "Sedan",
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
      seats: "4 Seats",
      luggage: "3 Bags",
      price: "Minimum 10 KM",
    },
    {
      name: "SUV",
      image:
        "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800",
      seats: "6 Seats",
      luggage: "4 Bags",
      price: "Premium Ride",
    },
    {
      name: "Innova Crysta",
      image:
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
      seats: "7 Seats",
      luggage: "5 Bags",
      price: "Most Popular",
    },
    {
      name: "7 Seater",
      image:
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800",
      seats: "7 Seats",
      luggage: "5 Bags",
      price: "Minimum 14 KM",
    },
    {
      name: "Tempo Traveller",
      image:
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800",
      seats: "12+ Seats",
      luggage: "10 Bags",
      price: "Best for Groups",
    },
  ];

  return (
    <section
      id="fleet"
      className="py-24 bg-slate-950 text-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl font-bold text-center">
          Our Premium Fleet
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-16">
          Choose the perfect vehicle for every journey.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fleet.map((car) => (
            <div
              key={car.name}
              className="bg-white/5 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 hover:scale-105 transition duration-300"
            >
              <img
                src={car.image}
                alt={car.name}
                className="h-56 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-2xl font-bold">
                  {car.name}
                </h3>

                <div className="mt-4 text-gray-300 space-y-2">
                  <p>👥 {car.seats}</p>
                  <p>🧳 {car.luggage}</p>
                  <p className="text-cyan-400 font-semibold">
                    {car.price}
                  </p>
                </div>

                <button className="mt-6 w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-xl font-semibold transition">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}