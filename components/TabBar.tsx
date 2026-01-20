/**
 * TabBar - Bottom navigation component matching mobile app
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../contexts/ThemeContext';

interface TabItem {
  name: string;
  label: string;
  href: string;
  icon: string;
  iconActive: string;
}

const tabs: TabItem[] = [
  { name: 'Home', label: 'Home', href: '/app', icon: '🏠', iconActive: '🏠' },
  { name: 'Explore', label: 'Universes', href: '/app/explore', icon: '🪐', iconActive: '🪐' },
  { name: 'Pros', label: 'Pros', href: '/app/pros', icon: '🔧', iconActive: '🔧' },
  { name: 'Atlas', label: 'Atlas', href: '/app/atlas', icon: '🗺️', iconActive: '🗺️' },
  { name: 'Apps', label: 'Apps', href: '/app/apps', icon: '📱', iconActive: '📱' },
];

export default function TabBar() {
  const router = useRouter();
  const { theme } = useThemeContext();
  
  const isActive = (href: string) => {
    if (href === '/app') {
      return router.pathname === '/app' || router.pathname === '/app/home';
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
          >
            <span className="tab-icon">
              {active ? tab.iconActive : tab.icon}
            </span>
            <span 
              className="tab-label"
              style={{ color: active ? theme.tabBarActive : theme.tabBarInactive }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}

      <style jsx>{`
        .tab-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          height: 83px;
          padding-bottom: env(safe-area-inset-bottom, 0);
          border-top-width: 0.5px;
          border-top-style: solid;
          z-index: 1000;
        }
        
        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 16px;
          text-decoration: none;
          transition: transform 0.2s;
        }
        
        .tab-item:hover {
          transform: scale(1.05);
        }
        
        .tab-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        .tab-label {
          font-size: 10px;
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .tab-bar {
            height: 70px;
          }
          
          .tab-icon {
            font-size: 20px;
          }
        }
      `}</style>
    </nav>
  );
}
