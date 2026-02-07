/**
 * AppLayout - Layout wrapper for app pages (with TabBar and route protection)
 * 
 * Loading strategy:
 * - Public routes: render immediately, no loading gate
 * - Authenticated routes: show spinner for max 6 seconds, then render
 * - If auth fails after timeout, redirect to login
 */

import React, { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useThemeContext } from '../contexts/ThemeContext';

import { useRoles } from '../hooks/useRoles';
import { getRouteAccessLevel, checkAccess, AccessLevel } from '../lib/roleService';
import TabBar from './TabBar';

interface AppLayoutProps {
  children: ReactNode;
  hideTabBar?: boolean;
  requiredAccess?: AccessLevel;
}

// Maximum time to show loading spinner before giving up (in ms)
const MAX_LOADING_MS = 8000;

export default function AppLayout({ 
  children, 
  hideTabBar = false,
  requiredAccess
}: AppLayoutProps) {
  const { theme } = useThemeContext();
  const router = useRouter();
  const { roles, isAuthenticated, loading } = useRoles();
  const [forceReady, setForceReady] = useState(false);

  // Determine required access level
  const accessLevel = requiredAccess || getRouteAccessLevel(router.pathname);
  const hasAccess = checkAccess(roles, isAuthenticated, accessLevel);
  const isPublicRoute = accessLevel === 'public';

  // Hard timeout: never show spinner for more than MAX_LOADING_MS
  useEffect(() => {
    if (!loading || isPublicRoute) return;
    
    const timeout = setTimeout(() => {
      console.warn('[AppLayout] Loading timed out — forcing ready state');
      setForceReady(true);
    }, MAX_LOADING_MS);

    return () => clearTimeout(timeout);
  }, [loading, isPublicRoute]);

  // Reset forceReady when loading completes normally
  useEffect(() => {
    if (!loading) {
      setForceReady(false);
    }
  }, [loading]);

  const effectivelyLoading = loading && !forceReady;

  // Redirect logic — only runs when loading is complete (or forced ready)
  useEffect(() => {
    if (effectivelyLoading) return;

    if (!hasAccess && !isPublicRoute) {
      if (!isAuthenticated) {
        router.replace(`/app/login?redirect=${encodeURIComponent(router.asPath)}`, undefined, { locale: router.locale });
      } else if (accessLevel === 'pro' && !roles.includes('pro') && !roles.includes('super_admin')) {
        router.replace('/app/pros', undefined, { locale: router.locale });
      } else if (accessLevel === 'super_admin' && !roles.includes('super_admin')) {
        router.replace('/app', undefined, { locale: router.locale });
      }
    }
  }, [effectivelyLoading, hasAccess, isAuthenticated, accessLevel, roles, router, isPublicRoute]);

  // For public routes, skip the loading gate entirely
  if (effectivelyLoading && !isPublicRoute) {
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

  // Show access denied briefly before redirect (only if not loading and no access)
  if (!effectivelyLoading && !hasAccess && !isPublicRoute) {
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
