import React, { useState, useEffect } from "react";
import { Button } from "../../../shared/components/ui/Button";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        transition-all duration-300
        ${scrolled
          ? "bg-[#0A0D0F]/90 backdrop-blur-md border-b border-[#2A3441]"
          : "bg-transparent"
        }
      `}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8">
            {/* Sangam logo — two interlocking arcs */}
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              <circle
                cx="11"
                cy="16"
                r="8"
                stroke="#6D5DFE"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="21"
                cy="16"
                r="8"
                stroke="#14D8C4"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          </div>
          <span className="text-[#FFFDFC] font-semibold text-lg tracking-tight">
            SANGAM
          </span>
        </a>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm text-[#C5C7CB]">
          <a href="#features" className="hover:text-[#FFFDFC] transition-colors">
            Features
          </a>
          <a href="#progress" className="hover:text-[#FFFDFC] transition-colors">
            Roadmap
          </a>
          <a href="#" className="hover:text-[#FFFDFC] transition-colors">
            About
          </a>
        </div>

        <Button size="sm">Get Early Access</Button>
      </div>
    </nav>
  );
};
