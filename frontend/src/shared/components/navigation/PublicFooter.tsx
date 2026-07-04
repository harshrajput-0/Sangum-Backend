// src/shared/components/navigation/PublicFooter.tsx
import { Link } from "react-router-dom"
import { GithubIcon, LinkIcon, TwitterIcon } from "@/styles/icons"

const footerLinks = {
  Platform: [
    { label: "Communities", to: "/communities" },
    { label: "Resources", to: "/resources" },
    { label: "Messages", to: "/messages" },
    { label: "Bookmarks", to: "/bookmarks" },
  ],
  Company: [
    { label: "About us", to: "/about" },
    { label: "Contact", to: "/contact" },
  ],
  Legal: [
    { label: "Terms of Service", to: "/legal/terms" },
    { label: "Privacy Policy", to: "/legal/privacy" },
    { label: "Disclaimer", to: "/legal/disclaimer" },
    { label: "Cookie Policy", to: "/legal/cookies" },
  ],
}

export const Footer = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-bg w-full">
      <div className="mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10">
          {/* Logo + tagline */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              {/* reuse your Sangam logo svg here */}
              <span className="text-xl font-bold text-text tracking-tight">
                SANGUM
              </span>
            </Link>
            <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
              A platform for developers to connect, share knowledge, and
              build together.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-sm font-semibold text-text mb-4">
                {heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-text-secondary hover:text-text transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © {year} Sangum. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:border-brand-purple/50 transition-colors"
            >
              <TwitterIcon size={16} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:border-brand-purple/50 transition-colors"
            >
              <GithubIcon size={16} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-muted hover:text-text hover:border-brand-purple/50 transition-colors"
            >
              <LinkIcon size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}