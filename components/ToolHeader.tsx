import React from 'react';
import { useRouter } from 'next/router';
import { IoChevronBack, IoPersonCircleOutline } from 'react-icons/io5';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { canGoBackInApp } from '../hooks/useAppNavigationHistory';

export interface ToolHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onProfilePress?: () => void;
  children?: React.ReactNode;
}

/** The Universe navigation pattern, shared by tool landing pages. */
export default function ToolHeader({ title, subtitle, onBack, onProfilePress, children }: ToolHeaderProps) {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const back = () => {
    if (onBack) return onBack();
    if (canGoBackInApp()) router.back();
    else void router.push('/app/apps', undefined, { locale: router.locale });
  };
  return <header className="tool-header" style={{ background: theme.background, color: theme.text, borderColor: theme.border }}>
    <div className="tool-header-row">
      <button type="button" onClick={back} aria-label={copy('Go back')}><IoChevronBack size={24} aria-hidden /></button>
      <div className="tool-header-copy">
        <h1>{copy(title)}</h1>
        {subtitle && <p style={{ color: isDark ? '#B9C4FF' : '#4656AD' }}>{copy(subtitle)}</p>}
      </div>
      <button type="button" onClick={onProfilePress || (() => void router.push('/app/profile', undefined, { locale: router.locale }))} aria-label={copy('Profile')}><IoPersonCircleOutline size={28} aria-hidden /></button>
    </div>
    {children && <div className="tool-header-content">{children}</div>}
    <style jsx>{`
      .tool-header { width: 100%; border-bottom: 1px solid; padding-top: env(safe-area-inset-top, 0px); position: sticky; top: 0; z-index: 100; }
      .tool-header-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 8px; padding: 10px max(16px, env(safe-area-inset-right)) 10px max(16px, env(safe-area-inset-left)); }
      .tool-header-copy { min-width: 0; text-align: center; }
      h1 { font-size: 18px; line-height: 1.3; font-weight: 700; margin: 0; overflow-wrap: anywhere; }
      p { font-size: 12px; line-height: 1.4; font-weight: 500; margin: 2px 0 0; }
      button { width: 44px; height: 44px; border: 0; border-radius: 22px; background: transparent; color: inherit; display: flex; align-items: center; justify-content: center; cursor: pointer; }
      button:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
      .tool-header-content { padding: 0 16px 16px; }
    `}</style>
  </header>;
}
