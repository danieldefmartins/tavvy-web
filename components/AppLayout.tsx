/**
 * AppLayout - Layout wrapper for app pages (with TabBar and route protection)
 */

import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useThemeContext } from '../contexts/ThemeContext';

import { useRoles } from '../hooks/useRoles';
import { getRouteAccessLevel, checkAccess, AccessLevel } from '../lib/roleService';
import TabBar from './TabBar';

interface AppLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
  requiredAccess?: AccessLevel; // Optional override for route access level
}

export default function AppLayout({ 
  children, 
  hideTabBar = false,
  requiredAccess
}: AppLayoutProps) {
  const { theme } = useThemeContext();
  const router = useRouter();
  const { roles, isAuthenticated, loading } = useRoles();

  // Determine required access level
  const accessLevel = requiredAccess || getRouteAccessLevel(router.pathname);
  const hasAccess = checkAccess(roles, isAuthenticated, accessLevel);

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    // Check access and redirect if needed
    if (!hasAccess) {
      if (!isAuthenticated && accessLevel !== 'public') {
        // Not logged in - redirect to login
        router.replace(`/app/login?redirect=${encodeURIComponent(router.asPath)}`, undefined, { locale: router.locale });
      } else if (accessLevel === 'pro' && !roles.includes('pro') && !roles.includes('super_admin')) {
        // Not a pro - redirect to pros info page
        router.replace('/app/pros', undefined, { locale: router.locale });
      } else if (accessLevel === 'super_admin' && !roles.includes('super_admin')) {
        // Not an admin - redirect to home
        router.replace('/app', undefined, { locale: router.locale });
      }
    }
  }, [loading, hasAccess, isAuthenticated, accessLevel, roles, router]);

  // Show loading state while checking access
  if (loading) {
    return (
      <div 
        className="app-layout"
        style={{ backgroundColor: theme.background }}
      >
        <main className="app-content loading-state">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
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
          
          .loading-state {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid ${theme.border};
            border-top-color: ${theme.accent};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
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

  // Show access denied briefly before redirect
  if (!hasAccess && accessLevel !== 'public') {
    return (
      <div 
        className="app-layout"
        style={{ backgroundColor: theme.background }}
      >
        <main className="app-content access-denied">
          <div className="access-denied-container">
            <div className="lock-icon">🔒</div>
            <h2>Access Restricted</h2>
            <p>
              {!isAuthenticated 
                ? 'Please log in to access this page.' 
                : accessLevel === 'pro'
                ? 'This page is only available to Pro users.'
                : 'You don\'t have permission to view this page.'}
            </p>
            <p className="redirect-text">Redirecting...</p>
          </div>
        </main>

        <style jsx>{`
          .app-layout {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .app-content {
            flex: 1;
          }
          
          .access-denied {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .access-denied-container {
            text-align: center;
            padding: 40px 20px;
          }
          
          .lock-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          h2 {
            color: ${theme.text};
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          p {
            color: ${theme.textSecondary};
            font-size: 16px;
            margin-bottom: 8px;
          }
          
          .redirect-text {
            font-size: 12px;
            color: ${theme.textTertiary};
            margin-top: 16px;
          }
        `}</style>
      </div>
    );
  }

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
