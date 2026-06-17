import React from "react";
import { Card } from "../../../shared/components/ui/Card";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const features: Feature[] = [
  {
    accent: "#6D5DFE",
    title: "Communities",
    description: "Create and join interest-based communities around topics you care about.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    accent: "#14D8C4",
    title: "Discussions",
    description: "Share ideas and participate in meaningful conversations with your community.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    ),
  },
  {
    accent: "#6D5DFE",
    title: "Real-Time Chat",
    description: "Stay connected with live messaging that keeps your community in sync.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    accent: "#14D8C4",
    title: "Knowledge Hub",
    description: "Discover, save, and share resources that help your community grow and learn.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
];

export const FeatureGrid: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-xs text-[#6D5DFE] uppercase tracking-[0.15em] font-medium mb-3">
            What we're building
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#FFFDFC] tracking-tight">
            Everything your community needs
          </h2>
        </div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="flex flex-col gap-4">
              {/* Icon container */}
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center"
                style={{
                  background: `${feature.accent}18`,
                  border: `1px solid ${feature.accent}30`,
                  color: feature.accent,
                }}
              >
                {feature.icon}
              </div>

              <div>
                <h3 className="text-[#FFFDFC] font-semibold mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-[#C5C7CB] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
