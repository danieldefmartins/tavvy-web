/**
 * TabBar - Bottom navigation component
 * Updated to match new tavvy-mobile tab configuration
 * 
 * Tabs:
 * 1. Home (house icon)
 * 2. Universes (planet icon)
 * 3. + Create (elevated center button)
 * 4. Pros (construct icon)
 * 5. Apps (grid icon)
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../contexts/ThemeContext';
import { spacing } from '../constants/Colors';
import { 
  FiHome, 
  FiGlobe, 
  FiTool, 
  FiGrid,
  FiPlus
} from 'react-icons/fi';

interface TabItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  isCenter?: boolean;
}

const tabs: TabItem[] = [
  {
    name: 'Home',
    href: '/app',
    icon: <FiHome size={24} />,
    activeIcon: <FiHome size={24} strokeWidth={2.5} />,
  },
  {
    name: 'Universes',
    href: '/app/explore',
    icon: <FiGlobe size={24} />,
    activeIcon: <FiGlobe size={24} strokeWidth={2.5} />,
  },
  {
    name: '',
    href: '/app/add',
    icon: <FiPlus size={28} color="#000000" />,
    activeIcon: <FiPlus size={28} color="#000000" />,
    isCenter: true,
  },
  {
    name: 'Pros',
    href: '/app/pros',
    icon: <FiTool size={24} />,
    activeIcon: <FiTool size={24} strokeWidth={2.5} />,
  },
  {
    name: 'Apps',
    href: '/app/apps',
    icon: <FiGrid size={24} />,
    activeIcon: <FiGrid size={24} strokeWidth={2.5} />,
  },
];

const styles = {
  tabBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '85px',
    paddingBottom: 'env(safe-area-inset-bottom, 20px)',
    borderTopWidth: '1px',
    borderTopStyle: 'solid' as const,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    zIndex: 1000,
  },
  tabItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '60px',
    textDecoration: 'none',
    transition: 'color 0.2s, transform 0.2s',
    padding: `${spacing.sm}px`,
  },
  tabIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  tabLabel: {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.1px',
  },
  addButtonContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    position: 'relative' as const,
    textDecoration: 'none',
  },
  addButton: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(15, 138, 138, 0.3)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
};

export default function TabBar() {
  const router = useRouter();
  const { theme } = useThemeContext();
  const { locale } = router;
  
  const isActive = (href: string) => {
    if (href === '/app') {
      return router.pathname === '/app' || router.pathname === '/app/index';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <nav 
      style={{ 
        ...styles.tabBar,
        backgroundColor: theme.tabBarBackground,
        borderTopColor: theme.border,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        
        if (tab.isCenter) {
          return (
            <Link
              key="add-button"
              href={tab.href}
              locale={locale}
              style={styles.addButtonContainer}
            >
              <div style={styles.addButton}>
                {tab.icon}
              </div>
            </Link>
          );
        }
        
        return (
          <Link
            key={tab.name}
            href={tab.href}
            locale={locale}
            style={{ 
              ...styles.tabItem,
              color: active ? theme.tabBarActive : theme.tabBarInactive,
              transform: active ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            <div style={styles.tabIcon}>
              {active ? tab.activeIcon : tab.icon}
            </div>
            <span style={{
              ...styles.tabLabel,
              fontWeight: active ? 600 : 500,
            }}>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
