/**
 * AppLayout - Layout wrapper for app pages (with TabBar)
 */

import React, { ReactNode } from 'react';
import { useThemeContext } from '../contexts/ThemeContext';
import TabBar from './TabBar';

interface AppLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
}

export default function AppLayout({ children, hideTabBar = false }: AppLayoutProps) {
  const { theme } = useThemeContext();

  return (
    <div 
      className="app-layout"
      style={{ backgroundColor: theme.background }}
    >
      <main className="app-content">
        {children}
      </main>
      {!hideTabBar && <TabBar />}

      <style jsx>{`
        .app-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .app-content {
          flex: 1;
          padding-bottom: ${hideTabBar ? '0' : '83px'};
        }
        
        @media (max-width: 768px) {
          .app-content {
            padding-bottom: ${hideTabBar ? '0' : '70px'};
          }
        }
      `}</style>
    </div>
  );
}
