import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CorporateHero from "@/components/CorporateHero";
import CorporateBenefits from "@/components/CorporateBenefits";
import CorporateForm from "@/components/CorporateForm";

export default function CorporatePage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <Navbar />

      <CorporateHero />

      <CorporateBenefits />

      <CorporateForm />

      <Footer />
    </main>
  );
}