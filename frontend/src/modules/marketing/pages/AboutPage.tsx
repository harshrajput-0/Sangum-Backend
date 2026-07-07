import type { ReactNode } from "react";

interface MissionItem {
  title: string;
  description: string;
  iconBg: string; 
  iconColor: string;
  icon: ReactNode;
}

const missionItems: MissionItem[] = [
  {
    title: "Community First",
    description:
      "We believe in the power of community and collaboration to solve meaningful problems.",
    iconBg: "rgba(109,93,254,0.15)",
    iconColor: "var(--brand-purple-light)",
    icon: <path d="M17 20h5v-2a4 4 0 00-3-3.87" />,
  },
  {
    title: "Knowledge Sharing",
    description:
      "We make knowledge accessible so everyone can learn, grow, and share their skills.",
    iconBg: "rgba(20,216,196,0.15)",
    iconColor: "var(--brand-cyan)",
    icon: <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />,
  },
  {
    title: "Open & Inclusive",
    description: "Everyone is welcome here. We celebrate diversity and support inclusivity.",
    iconBg: "rgba(59,130,246,0.15)",
    iconColor: "var(--info)",
    icon: <circle cx="12" cy="12" r="10" />,
  },
];

const stats: { value: string; label: string }[] = [
  { value: "12,543+", label: "Developers" },
  { value: "342+", label: "Communities" },
  { value: "2,784+", label: "Resources" },
  { value: "98.7%", label: "Happy Members" },
];

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-4 pt-[70px] pb-[50px] text-text bg-bg text-center md:px-6">
        <span className="mb-3 block text-(length:--fs-xs)] font-bold uppercase tracking-[0.08em] text-brand-purple">
          About Sangum
        </span>
        <h1 className="mx-auto mb-4 max-w-[600px] text-[28px] font-bold leading-tight tracking-[-0.02em] text-text md:text-[38px]">
          Building the future of developer communities
        </h1>
        <p className="mx-auto max-w-[520px] text-(length:--fs-base)] text-text-secondary">
          Sangum is a platform designed to connect developers, share knowledge, and build better
          together.
        </p>
      </section>

      {/* Mission */}
      <section className="mx-auto mb-[50px] max-w-[1280px] px-4 md:px-6">
        <h2 className="mb-6 text-center text-(length:--fs-xl)] font-semibold text-text">
          Our mission
        </h2>
        <p className="mx-auto mb-[30px] max-w-[600px] text-center text-(length:--fs-base)] text-text-secondary">
          To empower developers by fostering inclusive communities, providing quality resources,
          and enabling meaningful collaboration.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {missionItems.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-surface p-5 text-center"
            >
              <div
                className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-md"
                style={{ background: item.iconBg, color: item.iconColor }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.icon}
                </svg>
              </div>
              <span className="mb-1.5 block text-(length:--fs-lg)] font-semibold text-text">
                {item.title}
              </span>
              <p className="text-(length:--fs-xs)] text-text-muted">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto mb-[50px] max-w-[1280px] px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="mb-3.5 text-(length:--fs-xl)] font-semibold text-text">
              Our story
            </h2>
            <p className="mb-3.5 text-(length:--fs-base)] text-text-secondary">
              Sangum was founded by developers, for developers. We noticed a gap in platforms
              that truly focus on developer communities and real knowledge sharing without the
              noise.
            </p>
            <p className="text-(length:--fs-base)] text-text-secondary">
              So we built Sangum — a place where developers can connect, learn, and grow
              together. From a small idea to a growing global community, we're just getting
              started.
            </p>
          </div>
          <div
            className="h-[200px] rounded-radius-lg"
            style={{ background: "var(--brand-gradient-cover)" }}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mb-[60px] max-w-[1280px] px-4 md:px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="block text-(length:--fs-2xl)] font-bold tracking-[-0.01em] text-text">
                {stat.value}
              </span>
              <div className="text-(length:--fs-xs)] text-text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}