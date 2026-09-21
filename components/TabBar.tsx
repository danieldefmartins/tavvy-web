import { useReleaseCopy } from '../hooks/useReleaseCopy';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FiCompass, FiBookmark, FiUser } from 'react-icons/fi';
import { useThemeContext } from '../contexts/ThemeContext';

function ToolsIcon({ size = 23 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {[6, 12, 18].flatMap(cy => [6, 12, 18].map(cx => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.7" />))}
  </svg>;
}

const tabs = [
  { label: 'Discover', href: '/app', Icon: FiCompass },
  { label: 'Tools', href: '/app/apps', Icon: ToolsIcon },
  { label: 'Saved', href: '/app/saved', Icon: FiBookmark },
  { label: 'Profile', href: '/app/profile', Icon: FiUser },
];

export default function TabBar() {
  const copy = useReleaseCopy();
  const router = useRouter();
  const { theme } = useThemeContext();
  return <nav aria-label="Main navigation" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 12px)', background: theme.tabBarBackground, borderTop: `1px solid ${theme.border}`, zIndex: 1000 }}>
    {tabs.map(({ label, href, Icon }) => {
      const active = href === '/app' ? router.pathname === '/app' : router.pathname.startsWith(href);
      return <Link className="tavvy-tab" key={href} href={href} locale={router.locale} aria-current={active ? 'page' : undefined} style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 64, color: active ? theme.text : theme.textSecondary, textDecoration: "none", fontSize: 12, fontWeight: active ? 700 : 500 }}>
        <Icon size={23} />{copy(label)}
      </Link>;
    })}
  </nav>;
}
