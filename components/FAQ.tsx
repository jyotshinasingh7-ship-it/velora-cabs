"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How can I book a taxi in Noida?",
    answer:
      "You can book a taxi online using our booking form or call us directly for instant booking.",
  },
  {
    question: "Do you provide Airport Taxi Service?",
    answer:
      "Yes, we provide 24×7 airport pickup and drop services to Delhi Airport and nearby locations.",
  },
  {
    question: "Which payment methods are accepted?",
    answer:
      "We accept UPI, Cash, Credit Card, Debit Card and Razorpay payments.",
  },
  {
    question: "Can I book an Outstation Cab?",
    answer:
      "Yes, we provide one-way and round-trip outstation taxi services across North India.",
  },
  {
    question: "Are your drivers verified?",
    answer:
      "Yes, every driver is verified and trained for a safe and comfortable ride.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-24 bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-5xl font-bold text-center">
          Frequently Asked Questions
        </h2>

        <p className="text-center text-gray-400 mt-4 mb-14">
          Everything you need to know before booking your ride.
        </p>

        <div className="space-y-5">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setOpen(open === index ? null : index)
                }
                className="w-full flex justify-between items-center px-6 py-5 text-left"
              >
                <span className="font-semibold text-lg">
                  {faq.question}
                </span>

                <span className="text-cyan-400 text-2xl">
                  {open === index ? "−" : "+"}
                </span>
              </button>

              {open === index && (
                <div className="px-6 pb-6 text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}