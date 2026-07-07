import React, { useState, useEffect } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          ? "bg-bg backdrop-blur-xl border-b border-border"
          : "bg-transparent"
        }
      `}
    >
      <div className="max-w-full mx-auto px-6 h-16 flex items-center justify-between bg-bg text-text">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">

          {/* Sangam logo — two interlocking arcs */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 277 64" width="160" role="img" aria-label="Sangum">
            <title>Sangum</title>
            <defs>
              <linearGradient id="sangumPurple" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stop-color="#D2C0FD" />
                <stop offset="100%" stop-color="#4A4DFD" />
              </linearGradient>
              <linearGradient id="sangumTeal" x1="0.5" y1="0" x2="0.5" y2="1">
                <stop offset="0%" stop-color="#01CEC6" />
                <stop offset="100%" stop-color="#CBF3F1" />
              </linearGradient>
            </defs>
            <g transform="translate(0,4) scale(0.24561)">
              <path d="M 96.90 5.40 c -44.10 7.80 -78.00 38.90 -89.60 82.30 -2.40 8.70 -2.70 11.70 -2.70 26.80 0.00 13.40 0.40 18.40 1.80 23.50 1.00 3.60 2.00 6.80 2.20 7.20 0.20 0.40 3.40 -0.70 7.00 -2.40 4.60 -2.20 8.70 -3.20 13.50 -3.60 3.80 -0.20 7.20 -0.80 7.40 -1.20 0.20 -0.40 -0.20 -3.80 -1.00 -7.60 -0.80 -3.80 -1.50 -11.40 -1.40 -16.90 0.00 -46.20 30.90 -87.40 73.10 -97.50 15.80 -3.80 38.90 -2.20 54.90 3.70 5.80 2.10 7.20 2.30 8.50 1.20 1.50 -1.20 1.40 -1.50 -0.50 -3.00 -3.20 -2.60 -21.50 -9.50 -30.10 -11.40 -10.20 -2.20 -33.40 -2.80 -43.10 -1.10 z M 201.50 100.20 c -0.20 0.70 -0.90 3.30 -1.50 5.80 -7.50 30.50 -24.60 56.90 -46.20 71.30 -18.00 11.90 -40.80 17.60 -58.90 14.80 -8.60 -1.40 -18.60 -4.40 -24.10 -7.20 l -3.90 -2.00 -1.50 3.80 c -2.90 7.70 -5.00 10.90 -10.30 16.20 -6.20 6.30 -6.20 6.40 4.80 10.50 20.90 8.00 41.30 8.30 63.10 1.00 32.60 -10.80 59.40 -38.50 73.40 -75.70 4.50 -12.00 8.90 -37.80 6.60 -39.20 -0.50 -0.30 -1.20 -0.00 -1.50 0.70 z M 22.80 151.70 c -6.30 2.10 -12.30 7.40 -15.50 13.70 -6.40 12.50 -1.00 28.30 12.00 35.30 4.80 2.60 17.00 2.40 22.20 -0.40 16.50 -8.80 19.80 -29.00 6.90 -42.00 -3.80 -3.80 -6.50 -5.50 -10.40 -6.70 -6.50 -2.00 -9.10 -1.90 -15.20 0.10 z" fill="url(#sangumPurple)" />
              <path d="M 225.10 11.50 c -26.30 5.70 -47.70 19.30 -64.60 41.00 -12.10 15.60 -20.40 32.40 -25.10 51.10 -2.70 10.80 -3.80 25.10 -2.00 25.60 0.50 0.20 2.20 -4.60 3.80 -10.60 6.50 -25.30 21.60 -48.80 40.10 -62.70 18.30 -13.80 36.80 -19.70 58.20 -18.60 11.70 0.60 19.50 2.50 28.70 7.10 7.50 3.70 7.60 3.70 10.30 -3.20 1.20 -2.80 4.30 -6.60 9.20 -11.20 l 7.50 -6.90 -6.80 -3.40 c -8.10 -4.00 -17.50 -7.20 -25.80 -8.60 -8.20 -1.50 -25.80 -1.20 -33.50 0.40 z M 298.20 33.30 c -4.60 1.40 -12.60 8.90 -15.10 14.00 -2.70 5.60 -2.80 15.60 -0.20 21.20 4.20 9.10 13.80 15.50 23.20 15.50 7.80 -0.00 12.00 -1.50 17.20 -6.00 6.30 -5.60 9.10 -11.80 9.10 -20.00 -0.10 -17.80 -17.20 -30.20 -34.20 -24.70 z M 322.10 91.30 c -4.40 2.50 -7.10 3.10 -14.00 3.60 -5.90 0.40 -8.50 1.00 -8.40 1.80 1.90 9.40 2.50 17.40 1.90 25.80 -2.00 32.40 -18.00 60.30 -44.70 78.10 -24.70 16.50 -54.60 19.80 -82.30 9.20 -6.80 -2.60 -8.00 -2.80 -9.20 -1.60 -1.30 1.20 -1.20 1.60 0.30 2.90 3.20 2.70 18.00 8.80 28.00 11.60 8.80 2.40 11.50 2.70 26.30 2.70 13.80 -0.00 18.00 -0.40 25.30 -2.20 32.70 -8.20 60.10 -29.80 74.50 -58.70 8.40 -17.00 11.40 -29.70 11.50 -49.00 0.10 -13.00 -1.30 -25.10 -3.10 -26.50 -0.40 -0.40 -3.10 0.70 -6.10 2.30 z" fill="url(#sangumTeal)" />
            </g>
            <text x="98.3" y="32.0" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="34" letter-spacing="4" fill="currentColor" dominant-baseline="central">SANGUM</text>
          </svg>

        </a>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary justify-center">

          <Link to="/community" className="hover:text-text transition-colors">Community</Link>
          <Link to="/pricing" className="hover:text-text transition-colors">Pricing</Link>
          <Link to="/legal" className="hover:text-text transition-colors">Legal</Link>
          <Link to="/about" className="hover:text-text transition-colors">About</Link>
          <Link to="/contact" className="hover:text-text transition-colors">Contact Us</Link>
        </div>

        <div className="flex items-center gap-2 justify-end">
            <ThemeToggle />

          {/* Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm">Login</Button>
            <Button size="sm">Register</Button>
          </div>
          

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-white/10 transition"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>


      {isMenuOpen && (
        
        <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur-md">
          
          <div className="flex flex-col  gap-1">
          <Link to="/community" className="p-4 text-text-secondary hover:bg-text/3 transition">Community</Link>
          <Link to="/pricing" className="p-4 text-text-secondary hover:bg-text/3 transition">Pricing</Link>
          <Link to="/legal" className="p-4 text-text-secondary hover:bg-text/3 transition">Legal</Link>
          <Link to="/about" className="p-4 text-text-secondary hover:bg-text/3 transition">About</Link>
          <Link to="/contact" className="p-4 text-text-secondary hover:bg-text/3 transition">Contact Us</Link>
            <div className="flex flex-col gap-3 pt-4">
              <Button variant="outline">Login</Button>
              <Button>Register</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
