export default function Footer() {
  return (
    <footer
      id="contact"
      className="bg-black border-t border-white/10 text-white"
    >
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10">

          <div>
            <h2 className="text-3xl font-bold text-cyan-400">
              Velora Cabs
            </h2>

            <p className="text-gray-400 mt-4 leading-7">
              Premium Taxi Service in Noida offering Local, Airport,
              Outstation and Corporate rides with safe drivers and
              transparent pricing.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-5">
              Quick Links
            </h3>

            <ul className="space-y-3 text-gray-400">
              <li><a href="#home" className="hover:text-cyan-400">Home</a></li>
              <li><a href="#services" className="hover:text-cyan-400">Services</a></li>
              <li><a href="#fleet" className="hover:text-cyan-400">Fleet</a></li>
              <li><a href="#booking" className="hover:text-cyan-400">Book Taxi</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-5">
              Services
            </h3>

            <ul className="space-y-3 text-gray-400">
              <li>Airport Taxi</li>
              <li>Local Taxi</li>
              <li>Outstation Cab</li>
              <li>Corporate Travel</li>
              <li>Tempo Traveller</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-5">
              Contact
            </h3>

            <div className="space-y-3 text-gray-400">
              <p>📞 +91 99979 97390</p>
              <p>📧 info@veloracabs.in</p>
              <p>📍 Noida, Uttar Pradesh</p>
              <p>🕒 24×7 Available</p>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-gray-500 text-center">
            © 2026 Velora Cabs. All Rights Reserved.
          </p>

          <div className="flex gap-6 text-gray-400">
            <a href="#" className="hover:text-cyan-400">
              Privacy Policy
            </a>

            <a href="#" className="hover:text-cyan-400">
              Terms & Conditions
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
}