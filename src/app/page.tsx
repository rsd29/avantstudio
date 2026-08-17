import Hero from "@/components/Hero";
import CaseStudies from "@/components/CaseStudies";

export default function Home() {
  return (
    <div className="relative h-dvh max-h-dvh overflow-hidden">
      <CaseStudies />
      <Hero />
    </div>
  );
}
