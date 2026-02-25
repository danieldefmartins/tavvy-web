/**
 * SectionNavigator — floating dot navigation on the right edge.
 * Scrolls to each section when clicked. Highlights active section.
 */

import React, { useState, useEffect } from 'react';

interface SectionDef {
  id: string;
  label: string;
}

interface SectionNavigatorProps {
  sections: SectionDef[];
  isDark?: boolean;
}

export default function SectionNavigator({ sections, isDark = false }: SectionNavigatorProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      let closest = sections[0]?.id || '';
      let closestDist = Infinity;

      for (const section of sections) {
        const el = document.getElementById(`section-${section.id}`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - 80); // offset for header
        if (dist < closestDist) {
          closestDist = dist;
          closest = section.id;
        }
      }
      setActiveId(closest);
    };

    const container = document.getElementById('editor-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 50,
      padding: '8px 4px',
      borderRadius: 12,
      background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    }}>
      {sections.map((section) => {
        const isActive = activeId === section.id;
        return (
          <button
            key={section.id}
            onClick={() => scrollTo(section.id)}
            title={section.label}
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: isActive ? '#00C853' : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
              transition: 'background 0.2s, transform 0.2s',
              transform: isActive ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        );
      })}
    </div>
  );
}
