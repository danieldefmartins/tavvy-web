/**
 * TabBar - Bottom navigation component
 * Pixel-perfect port from tavvy-mobile App.tsx tab configuration
 * 
 * Tabs:
 * 1. Home (house icon)
 * 2. Universes (planet icon)
 * 3. Pros (construct icon)
 * 4. Atlas (book icon)
 * 5. Apps (grid icon)
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../contexts/ThemeContext';
import { spacing, borderRadius } from '../constants/Colors';
import { 
  FiHome, 
  FiGlobe, 
  FiTool, 
  FiBook, 
  FiGrid 
} from 'react-icons/fi';

interface TabItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
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
    name: 'Pros',
    href: '/app/pros',
    icon: <FiTool size={24} />,
    activeIcon: <FiTool size={24} strokeWidth={2.5} />,
  },
  {
    name: 'Atlas',
    href: '/app/atlas',
    icon: <FiBook size={24} />,
    activeIcon: <FiBook size={24} strokeWidth={2.5} />,
  },
  {
    name: 'Apps',
    href: '/app/apps',
    icon: <FiGrid size={24} />,
    activeIcon: <FiGrid size={24} strokeWidth={2.5} />,
  },
];

export default function TabBar() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  
  const isActive = (href: string) => {
    if (href === '/app') {
      return router.pathname === '/app' || router.pathname === '/app/index';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <nav 
      className="tab-bar"
      style={{ 
        backgroundColor: theme.tabBarBackground,
        borderTopColor: theme.border,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`tab-item ${active ? 'active' : ''}`}
            style={{ 
              color: active ? theme.tabBarActive : theme.tabBarInactive,
            }}
          >
            <div className="tab-icon">
              {active ? tab.activeIcon : tab.icon}
            </div>
            <span className="tab-label">{tab.name}</span>
          </Link>
        );
      })}

      <style jsx global>{`
        .tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 80px;
          padding-bottom: env(safe-area-inset-bottom, 0);
          border-top-width: 1px;
          border-top-style: solid;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 1000;
        }
        
        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          height: 100%;
          text-decoration: none;
          transition: color 0.2s, transform 0.2s;
          padding: ${spacing.sm}px;
        }
        
        .tab-item:hover {
          transform: scale(1.05);
        }
        
        .tab-item.active {
          transform: scale(1.05);
        }
        
        .tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        
        .tab-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1px;
        }
        
        .tab-item.active .tab-label {
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .tab-bar {
            height: 70px;
          }
          
          .tab-label {
            font-size: 10px;
          }
        }
      `}</style>
    </nav>
  );
}
