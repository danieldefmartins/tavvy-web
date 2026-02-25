/**
 * EditorSection — collapsible section wrapper for the card editor.
 * Each section has a title, optional icon, and collapse/expand toggle.
 */

import React, { useState, useRef, useEffect } from 'react';
import { IoChevronDown } from 'react-icons/io5';

interface EditorSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isDark?: boolean;
}

export default function EditorSection({
  id,
  title,
  icon,
  defaultOpen = true,
  children,
  isDark = false,
}: EditorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <section id={`section-${id}`} style={{ borderBottom: `1px solid ${border}` }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '18px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {icon && <span style={{ display: 'flex', color: '#00C853', flexShrink: 0 }}>{icon}</span>}
        <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: textPrimary }}>{title}</span>
        <IoChevronDown
          size={18}
          color={isDark ? '#64748B' : '#9CA3AF'}
          style={{
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? 'none' : 0,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s',
          padding: isOpen ? '0 20px 20px' : '0 20px 0',
        }}
      >
        {isOpen && children}
      </div>
    </section>
  );
}
