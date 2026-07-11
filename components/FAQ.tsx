"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How do I book a taxi with Velora Mobility?",
    answer:
      "Simply enter your pickup and destination, select your preferred ride type, check the estimated fare and confirm your booking.",
  },
  {
    question: "Can I schedule a ride in advance?",
    answer:
      "Yes. You can choose 'Schedule Ride' while booking and select your preferred date and time.",
  },
  {
    question: "Do you provide airport pickup and drop services?",
    answer:
      "Yes. We provide 24×7 airport pickup and drop services with professional drivers and flight-friendly scheduling.",
  },
  {
    question: "Which payment methods are supported?",
    answer:
      "UPI, Credit Card, Debit Card, Net Banking, Wallets and Cash are supported. Online payment options will continue expanding.",
  },
  {
    question: "Can I book an outstation trip?",
    answer:
      "Yes. One-way and round-trip outstation rides are available with transparent pricing and multiple vehicle options.",
  },
  {
    question: "Are Velora drivers verified?",
    answer:
      "Yes. Every driver goes through document verification before joining the platform.",
  },
  {
    question: "Can I join Velora as a driver?",
    answer:
      "Yes. Visit the 'Earn With Us' section to apply as a driver or register your own vehicle.",
  },
  {
    question: "Can I attach my own vehicle?",
    answer:
      "Absolutely. Vehicle owners can submit their RC, Insurance, Permit and other required documents from the Earn With Us section.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#05070c] py-24"
    >
      <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-400/10 blur-[150px]" />

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
            <HelpCircle size={15} />
            FAQ
          </span>

          <h2 className="mt-6 text-4xl font-extrabold text-white lg:text-5xl">
            Frequently Asked
            <span className="text-amber-400"> Questions</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/55">
            Find answers to the most common questions about booking,
            payments, airport transfers, outstation rides and becoming
            a Velora partner.
          </p>
        </div>

        <div className="mt-16 space-y-5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:border-amber-400/30"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenIndex(isOpen ? -1 : index)
                  }
                  className="flex w-full items-center justify-between px-7 py-6 text-left"
                >
                  <span className="pr-6 text-lg font-semibold text-white">
                    {faq.question}
                  </span>

                  <ChevronDown
                    size={22}
                    className={`text-amber-400 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr]"
                      : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 px-7 py-6 text-sm leading-7 text-white/60">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 rounded-[30px] border border-amber-400/20 bg-amber-400/10 p-8 text-center backdrop-blur-xl">
          <h3 className="text-3xl font-bold text-white">
            Still have questions?
          </h3>

          <p className="mx-auto mt-4 max-w-2xl text-white/55">
            Our support team is available 24×7 to help you with booking,
            payments, corporate travel and driver onboarding.
          </p>

          <a
            href="tel:+919997997390"
            className="mt-8 inline-flex items-center rounded-xl bg-amber-400 px-8 py-4 font-bold text-black transition hover:bg-amber-300"
          >
            Call Support
          </a>
        </div>
      </div>
    </section>
  );
}