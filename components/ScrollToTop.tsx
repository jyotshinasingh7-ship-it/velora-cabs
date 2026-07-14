"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!show) return null;

  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Scroll to top" className="fixed bottom-5 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#0b1018]/90 text-white/65 shadow-xl backdrop-blur-xl transition hover:border-amber-400/30 hover:text-amber-400 sm:bottom-6 sm:left-6">
      <ArrowUp size={19} />
    </button>
  );
}
