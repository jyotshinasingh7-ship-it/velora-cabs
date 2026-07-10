import {
  Building2,
  ShieldCheck,
  Clock3,
  ReceiptText,
  Users,
  Headset,
  CarFront,
  BadgeCheck,
} from "lucide-react";

const benefits = [
  {
    icon: Building2,
    title: "Dedicated Corporate Account",
    description:
      "Single point of contact for bookings, support and account management.",
  },
  {
    icon: Users,
    title: "Employee Transportation",
    description:
      "Daily office pickup & drop services with reliable drivers.",
  },
  {
    icon: CarFront,
    title: "Airport Transfers",
    description:
      "On-time airport pickup and drop for employees and business guests.",
  },
  {
    icon: ReceiptText,
    title: "GST Invoice",
    description:
      "Monthly GST invoices for hassle-free accounting and reimbursements.",
  },
  {
    icon: Clock3,
    title: "24×7 Availability",
    description:
      "Book rides any time with round-the-clock customer support.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Drivers",
    description:
      "Professional, background-verified and experienced chauffeurs.",
  },
];

const stats = [
  {
    number: "500+",
    title: "Corporate Clients",
  },
  {
    number: "50K+",
    title: "Business Trips",
  },
  {
    number: "99%",
    title: "On-Time Pickup",
  },
  {
    number: "24/7",
    title: "Support",
  },
];

export default function CorporateBenefits() {
  return (
    <section className="bg-[#050816] py-24">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">

          <span className="text-cyan-400 font-semibold uppercase tracking-widest">
            Why Companies Choose Velora
          </span>

          <h2 className="text-5xl font-bold mt-4 text-white">
            Business Travel Made Easy
          </h2>

          <p className="mt-5 text-gray-400 max-w-3xl mx-auto">
            We simplify corporate transportation with reliable drivers,
            transparent pricing, monthly billing and dedicated support for
            businesses of every size.
          </p>

        </div>

        {/* Benefits */}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {benefits.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 hover:border-cyan-400 transition duration-300 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6">
                  <Icon className="text-cyan-400" size={34} />
                </div>

                <h3 className="text-2xl font-bold text-white">
                  {item.title}
                </h3>

                <p className="text-gray-400 mt-4 leading-7">
                  {item.description}
                </p>
              </div>
            );
          })}

        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-20">

          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-center p-8"
            >
              <h3 className="text-5xl font-extrabold text-cyan-400">
                {stat.number}
              </h3>

              <p className="mt-3 text-gray-300">
                {stat.title}
              </p>
            </div>
          ))}

        </div>

        {/* CTA */}

        <div className="mt-24 rounded-3xl bg-gradient-to-r from-cyan-600 to-blue-700 p-10 text-center">

          <BadgeCheck
            className="mx-auto mb-5 text-white"
            size={55}
          />

          <h2 className="text-4xl font-bold text-white">
            Ready to Partner with Velora Cabs?
          </h2>

          <p className="mt-5 text-cyan-100 max-w-2xl mx-auto">
            Join hundreds of businesses that trust Velora Cabs for employee
            transportation, airport transfers and corporate travel.
          </p>

          <a
            href="#corporate-form"
            className="inline-flex items-center gap-2 mt-8 rounded-xl bg-white px-8 py-4 font-bold text-cyan-700 hover:bg-gray-100 transition"
          >
            <Headset size={20} />
            Request a Corporate Quote
          </a>

        </div>

      </div>
    </section>
  );
}