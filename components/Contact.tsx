export default function Contact() {
  return (
    <section id="contact" className="py-24 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-center">
          Contact Us
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-16">
          Book your ride anytime. We are available 24×7.
        </p>

        <div className="grid lg:grid-cols-2 gap-10">

          <div className="bg-white/5 rounded-3xl border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-6">
              Get In Touch
            </h3>

            <div className="space-y-5 text-lg">
              <p>📍 Noida, Uttar Pradesh</p>
              <p>📞 +91 99979 97390</p>
              <p>📧 info@veloracabs.in</p>
              <p>🕒 24×7 Available</p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-3xl border border-white/10 flex items-center justify-center min-h-[350px]">
            <p className="text-gray-400 text-xl">
              Google Maps will be integrated here
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}