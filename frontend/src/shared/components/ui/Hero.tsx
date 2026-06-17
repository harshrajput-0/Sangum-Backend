import React, { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";

export const Hero: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background glow blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-150 h-120 bg-[#6D5DFE]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-75 h-75 bg-[#14D8C4]/8 rounded-full blur-[100px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#FFFDFC 1px, transparent 1px), linear-gradient(90deg, #FFFDFC 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full border border-[#2A3441] bg-[#161C23] text-sm text-[#C5C7CB]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#14D8C4] animate-pulse" />
          <span>Active development · Join the waitlist</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-[#FFFDFC] leading-[1.08] tracking-tight mb-8">
          Where Communities{" "}
          <span
            className="relative inline-block pb-2"
            style={{
              background: "linear-gradient(135deg, #6D5DFE 0%, #14D8C4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Come Together.
          </span>
        </h1>

        {/* Description */}
        <p className="max-w-xl mx-auto text-lg text-[#C5C7CB] leading-relaxed mb-10">
          Sangam is a modern platform for communities, conversations,
          collaboration, and knowledge sharing.
          <br />
          <span className="text-[#959698] text-base">
            Currently in active development.
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <Button size="lg">Join Early Access</Button>
          <Button variant="outline" size="lg">
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              View Progress
            </span>
          </Button>
        </div>

        {/* Email input */}
        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="
                flex-1 w-full sm:w-auto
                px-4 py-2.5 rounded-lg text-sm
                bg-[#161C23] border border-[#2A3441]
                text-[#FFFDFC] placeholder:text-[#959698]
                focus:outline-none focus:border-[#6D5DFE]
                transition-colors
              "
            />
            <Button type="submit" size="md">
              Notify Me
            </Button>
          </form>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#161C23] border border-[#14D8C4]/40 text-[#14D8C4] text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            You're on the list! We'll reach out soon.
          </div>
        )}

        <p className="mt-3 text-xs text-[#959698]">
          No spam, we promise. Unsubscribe anytime.
        </p>

        {/* Social links */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <span className="text-xs text-[#959698] uppercase tracking-widest">Follow our progress</span>
          <div className="flex items-center gap-3">
            {[
              {
                label: "Twitter",
                svg: (
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.735l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                ),
              },
              {
                label: "GitHub",
                svg: (
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                ),
              },
              {
                label: "LinkedIn",
                svg: (
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                ),
              },
            ].map(({ label, svg }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#2A3441] text-[#959698] hover:text-[#FFFDFC] hover:border-[#6D5DFE]/50 transition-all"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  {svg}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
