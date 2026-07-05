import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Fleet from "@/components/Fleet";
import WhyChooseUs from "@/components/WhyChooseUs";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import FAQ from "@/components/FAQ";
import Stats from "@/components/Stats";
import TrustBadges from "@/components/TrustBadges";
import Contact from "@/components/Contact";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <Navbar />
      <Hero />
      <Fleet />
      <WhyChooseUs />
      <Services />
      <Testimonials />
      <Footer />
      <FloatingButtons />
      <FAQ />
      <Stats />
      <TrustBadges />
      <Contact />
      <ScrollToTop />
    </main>
  );
}