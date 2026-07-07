import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsMarquee from "@/components/StatsMarquee";
import AboutSection from "@/components/AboutSection";
import SectorUseCases from "@/components/SectorUseCases";
import PackageMergeSection from "@/components/PackageMergeSection";
import MetricsBand from "@/components/MetricsBand";
import PipelineSection from "@/components/PipelineSection";
import CapabilitiesCarousel from "@/components/CapabilitiesCarousel";
import WhySection from "@/components/WhySection";
import VsTable from "@/components/VsTable";
import VsCharts from "@/components/VsCharts";
import HonestLimits from "@/components/HonestLimits";
import ProofSection from "@/components/ProofSection";
import TierGuide from "@/components/TierGuide";
import EvidencePack from "@/components/EvidencePack";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SectionNav from "@/components/ui/SectionNav";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsMarquee />
        <AboutSection />
        <SectorUseCases />
        <PackageMergeSection />
        <MetricsBand />
        <PipelineSection />
        <CapabilitiesCarousel />
        <WhySection />
        <VsTable />
        <VsCharts />
        <HonestLimits />
        <ProofSection />
        <TierGuide />
        <EvidencePack />
        <Contact />
      </main>
      <Footer />
      <SectionNav />
    </>
  );
}
