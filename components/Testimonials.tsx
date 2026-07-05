const reviews = [
  {
    name: "Rahul Sharma",
    review:
      "Outstanding service! The cab arrived on time and the driver was very professional.",
    rating: "★★★★★",
  },
  {
    name: "Priya Verma",
    review:
      "Clean car, smooth ride and transparent pricing. Highly recommended.",
    rating: "★★★★★",
  },
  {
    name: "Amit Singh",
    review:
      "Best taxi service in Noida. Easy booking and excellent customer support.",
    rating: "★★★★★",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-5xl font-bold text-center">
          What Our Customers Say
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-16">
          Trusted by hundreds of happy customers.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((item) => (
            <div
              key={item.name}
              className="bg-white/5 border border-white/10 rounded-3xl p-8"
            >
              <div className="text-yellow-400 text-xl mb-4">
                {item.rating}
              </div>

              <p className="text-gray-300 mb-6">
                "{item.review}"
              </p>

              <h3 className="font-bold text-xl">
                {item.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}