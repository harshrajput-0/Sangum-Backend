import React from "react";
import { Navbar } from "../../shared/components/navigation/PublicNavbar";
import { Hero } from "../../shared/components/ui/Hero";
import { FeatureGrid } from "../../shared/components/ui/FeatureGrid";
import { Progress } from "../../shared/components/ui/DProgress";
import { Footer } from "../../shared/components/navigation/PublicFooter";



export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0D0F] text-[#FFFDFC]">
      <Navbar />
      <main>
        <Hero />
        <FeatureGrid />
        <Progress />
      </main>
      <Footer />
    </div>
  );
};
