import React from "react";

type StepStatus = "done" | "active" | "upcoming";

interface Step {
  label: string;
  status: StepStatus;
  description: string;
}

const steps: Step[] = [
  {
    label: "Planning",
    status: "done",
    description: "Research, scope, and product definition.",
  },
  {
    label: "Product Design",
    status: "done",
    description: "UI/UX design and design system.",
  },
  {
    label: "Frontend and Development",
    status: "active",
    description: "Building the interface and interactions.",
  },
  {
    label: "Backend Integration",
    status: "upcoming",
    description: "APIs, real-time features, and data.",
  },
  {
    label: "Beta Launch",
    status: "upcoming",
    description: "Early access rollout and feedback.",
  },
];

const StepIcon: React.FC<{ status: StepStatus; index: number }> = ({ status, index }) => {
  if (status === "done") {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#6D5DFE] border-2 border-[#6D5DFE] shrink-0">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#6D5DFE] bg-[#161C23] shrink-0 relative">
        <div className="w-3 h-3 rounded-full bg-[#6D5DFE] animate-pulse" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#2A3441] bg-[#161C23] shrink-0">
      <span className="text-xs text-[#959698] font-medium">{index + 1}</span>
    </div>
  );
};

export const Progress: React.FC = () => {
  return (
    <section id="progress" className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs text-[#6D5DFE] uppercase tracking-[0.15em] font-medium mb-3">
            Where we are
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#FFFDFC] tracking-tight mb-3">
            Roadmap
          </h2>
          <p className="text-[#C5C7CB]">
            We're building in the open. Here's where things stand.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {steps.map((step, i) => (
            <div key={step.label} className="flex gap-5">
              {/* Left column: icon + connector */}
              <div className="flex flex-col items-center">
                <StepIcon status={step.status} index={i} />
                {i < steps.length - 1 && (
                  <div
                    className={`w-px flex-1 my-1 ${
                      step.status === "done"
                        ? "bg-[#6D5DFE]/50"
                        : "bg-[#2A3441]"
                    }`}
                    style={{ minHeight: "2rem" }}
                  />
                )}
              </div>

              {/* Right column: content */}
              <div className={`pb-8 flex-1 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`text-base font-semibold ${
                      step.status === "upcoming"
                        ? "text-[#959698]"
                        : "text-[#FFFDFC]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.status === "done" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#14D8C4]/10 border border-[#14D8C4]/25 text-[#14D8C4] font-medium">
                      Completed
                    </span>
                  )}
                  {step.status === "active" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#6D5DFE]/15 border border-[#6D5DFE]/30 text-[#6D5DFE] font-medium">
                      In Progress
                    </span>
                  )}
                  {step.status === "upcoming" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#161C23] border border-[#2A3441] text-[#959698]">
                      Upcoming
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#959698]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
