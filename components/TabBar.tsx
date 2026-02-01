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
import { spacing, borderRadius } from '../constants/Colors';
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

export default function TabBar() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { locale } = router;
  
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
        
        // Render elevated center button differently
        if (tab.isCenter) {
          return (
            <Link
              key="add-button"
              href={tab.href}
              locale={locale}
              className="add-button-container"
            >
              <div className="add-button">
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

      <style jsx global>{\`
        .tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 85px;
          padding-bottom: env(safe-area-inset-bottom, 20px);
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
          height: 60px;
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

        /* Elevated Center Add Button */
        .add-button-container {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          position: relative;
          text-decoration: none;
        }
        
        .add-button {
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background-color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Removed top offset - button now aligns with other tab icons */
          box-shadow: 0 2px 8px rgba(15, 138, 138, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .add-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(15, 138, 138, 0.5);
        }
        
        .add-button:active {
          transform: scale(0.95);
        }

        @media (max-width: 480px) {
          .tab-bar {
            height: 75px;
            padding-bottom: env(safe-area-inset-bottom, 15px);
          }
          
          .tab-label {
            font-size: 10px;
          }
          
          .add-button {
            width: 44px;
            height: 44px;
            border-radius: 22px;
          }
        }
      \`}</style>
    </nav>
  );
}
