import { useCallback, useEffect, useRef, useState } from "react";


interface LegalSection {
  id: string;
  title: string;
  content: string[];
}

interface LegalArticleLayoutProps {
  eyebrow?: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

// For some reason tailwind grid isn't working so i am using css 
const STYLES = `
  .legal-container {
    max-width: var(--container-max, 1280px);
    margin: 0 auto;
    padding: 50px var(--sp-4, 16px) 60px;
  }
  @media (min-width: 1280px) {
    .legal-container {
      padding-left: var(--sp-6, 24px);
      padding-right: var(--sp-6, 24px);
    }
  }
  .legal-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--sp-6, 24px);
    align-items: start;
  }
  @media (min-width: 768px) {
    .legal-grid {
      grid-template-columns: 200px 1fr;
    }
  }
  .legal-sidebar {
    display: none;
  }
  @media (min-width: 768px) {
    .legal-sidebar {
      display: block;
      width: 200px;
      flex-shrink: 0;
      align-self: start;
      position: sticky;
      top: calc(var(--topbar-h, 64px) + 24px);
    }
  }
  .legal-sidebar-label {
    display: block;
    margin-bottom: var(--sp-2, 8px);
    font-size: var(--fs-xs, 12px);
    color: var(--text-muted);
  }
  .legal-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .legal-nav-item {
    display: block;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-md, 10px);
    padding: 7px 10px;
    font-size: var(--fs-xs, 12px);
    font-weight: 500;
    color: var(--text-secondary);
    transition: background 120ms ease, color 120ms ease;
  }
  .legal-nav-item:hover {
    background: var(--surface-hover);
    color: var(--text);
  }
  .legal-nav-item[aria-current="true"] {
    background: rgba(109, 93, 254, 0.14);
    color: var(--brand-purple-light);
  }
  .legal-main {
    min-width: 0;
  }
  .legal-eyebrow {
    display: block;
    margin-bottom: var(--sp-2, 8px);
    font-size: var(--fs-xs, 12px);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--brand-purple-light);
  }
  .legal-title {
    margin: 0 0 var(--sp-2, 8px);
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
  }
  @media (min-width: 768px) {
    .legal-title {
      font-size: 32px;
    }
  }
  .legal-updated {
    margin: 0 0 var(--sp-6, 24px);
    font-size: var(--fs-xs, 12px);
    color: var(--text-muted);
  }
  .legal-section {
    scroll-margin-top: calc(var(--topbar-h, 64px) + 24px);
  }
  .legal-section-title {
    margin: 40px 0 var(--sp-2, 8px);
    font-size: var(--fs-lg, 17px);
    font-weight: 600;
    color: var(--text);
  }
  .legal-section-paragraph {
    margin: 0 0 var(--sp-3, 12px);
    font-size: var(--fs-base, 14px);
    line-height: 1.6;
    color: var(--text-secondary);
  }
  .legal-section-paragraph:last-child {
    margin-bottom: 0;
  }
`;

// ===========================================================================
// ---[ Sticky Sidebar ]------------------------------------------------------
// ===========================================================================
interface SidebarProps {
  sections: LegalSection[];
  activeId: string;
  onSelect: (id: string) => void;
}

function Sidebar({ sections, activeId, onSelect }: SidebarProps) {
  return (
    <aside className="legal-sidebar">
      <span className="legal-sidebar-label">ON THIS PAGE</span>
      <nav className="legal-nav" aria-label="Page sections">
        {sections.map((section, index) => {
          const isActive = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              className="legal-nav-item"
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect(section.id)}
            >
              {index + 1}. {section.title}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

// ===========================================================================
// ---[ Main Container ]------------------------------------------------------
// ===========================================================================
interface MainContainerProps {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
  registerSectionRef: (id: string) => (el: HTMLElement | null) => void;
}

function MainContainer({
  eyebrow,
  title,
  lastUpdated,
  sections,
  registerSectionRef,
}: MainContainerProps) {
  return (
    <div className="legal-main">
      <span className="legal-eyebrow">{eyebrow}</span>
      <h1 className="legal-title">{title}</h1>
      <p className="legal-updated">Last updated: {lastUpdated}</p>

      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          ref={registerSectionRef(section.id)}
          className="legal-section"
        >
          <h3 className="legal-section-title">
            {index + 1}. {section.title}
          </h3>
          {section.content.map((paragraph, pIndex) => (
            <p key={pIndex} className="legal-section-paragraph">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

// ===========================================================================
// ---[ Legal Arcticle Component ]--------------------------------------------
// ===========================================================================
export default function LegalArticleLayout({
  eyebrow = "LEGAL",
  title,
  lastUpdated,
  sections,
}: LegalArticleLayoutProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const sectionElsRef = useRef<Map<string, HTMLElement>>(new Map());

  const registerSectionRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) sectionElsRef.current.set(id, el);
      else sectionElsRef.current.delete(id);
    },
    [],
  );

  // Scroll-spy: highlight whichever section is currently under the
  useEffect(() => {
    const elements = sections
      .map((section) => sectionElsRef.current.get(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0) {
          setActiveId(intersecting[0].target.id);
        }
      },
      {
        rootMargin: "-96px 0px -70% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const handleSelect = useCallback((id: string) => {
    const el = sectionElsRef.current.get(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="legal-shell">
      <style>{STYLES}</style>
      <div className="legal-container">
        <div className="legal-grid">
          <Sidebar sections={sections} activeId={activeId} onSelect={handleSelect} />
          <MainContainer
            eyebrow={eyebrow}
            title={title}
            lastUpdated={lastUpdated}
            sections={sections}
            registerSectionRef={registerSectionRef}
          />
        </div>
      </div>
    </div>
  );
}