import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#2A3441] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo + brand */}
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
            <circle cx="11" cy="16" r="8" stroke="#6D5DFE" strokeWidth="2.5" fill="none" />
            <circle cx="21" cy="16" r="8" stroke="#14D8C4" strokeWidth="2.5" fill="none" />
          </svg>
          <span className="text-[#FFFDFC] font-semibold tracking-tight">SANGAM</span>
        </div>

        {/* Copyright */}
        <p className="text-sm text-[#959698]">
          © 2026 Sangam. All rights reserved.
        </p>

        {/* Tech stack */}
        <p className="text-xs text-[#959698]">
          Built with{" "}
          <span className="text-[#6D5DFE]">React</span>,{" "}
          <span className="text-[#6D5DFE]">TypeScript</span> and{" "}
          <span className="text-[#6D5DFE]">Node.js</span>
        </p>
      </div>
    </footer>
  );
};
