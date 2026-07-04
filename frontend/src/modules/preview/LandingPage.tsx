// LandingPage.tsx 
import React from "react";
import { Hero } from "../../shared/components/ui/Hero";
import { FeatureGrid } from "../../shared/components/ui/FeatureGrid";
import { Progress } from "../../shared/components/ui/DProgress";



export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0D0F] text-[#FFFDFC]">
        <Hero />
        <FeatureGrid />
        <Progress />
    </div>
  );
};
