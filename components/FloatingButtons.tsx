import { MessageCircle, PhoneCall } from "lucide-react";

export default function FloatingButtons() {
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-3 sm:bottom-6 sm:right-6">
      <a href="https://wa.me/919997997390" target="_blank" rel="noopener noreferrer" aria-label="Chat with Velora on WhatsApp" className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/25 bg-emerald-500 text-white shadow-[0_14px_35px_rgba(16,185,129,0.22)] transition hover:-translate-y-1 hover:bg-emerald-400 sm:h-13 sm:w-13">
        <MessageCircle size={21} />
      </a>
      <a href="tel:+919997997390" aria-label="Call Velora Mobility" className="group flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-400 text-black shadow-[0_14px_35px_rgba(251,191,36,0.2)] transition hover:-translate-y-1 hover:bg-amber-300 sm:h-13 sm:w-13">
        <PhoneCall size={21} />
      </a>
    </div>
  );
}
