/**
 * AppLayout - Layout wrapper for app pages (with TabBar and route protection)
 * 
 * Strategy:
 * - Public routes: render immediately, no loading gate
 * - Authenticated routes: show spinner while auth is loading
 * - Only redirect to login after auth has FULLY resolved with no user
 * - Never show "Access Restricted" flash — show spinner instead, then redirect
 */

import React, { ReactNode, useEffect, useState, useRef } from 'react';
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
const MAX_LOADING_MS = 10000;

// Grace period after login before we consider redirecting (in ms)
const POST_LOGIN_GRACE_MS = 8000;

export default function AppLayout({ 
  children, 
  hideTabBar = false,
  requiredAccess
}: AppLayoutProps) {
  const { theme } = useThemeContext();
  const router = useRouter();
  const { roles, isAuthenticated, loading } = useRoles();
  const [forceReady, setForceReady] = useState(false);
  const hasRedirectedRef = useRef(false);

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

  // Reset redirect ref on route change
  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [router.pathname]);

  const effectivelyLoading = loading && !forceReady;

  // Redirect logic — only runs when loading is complete (or forced ready)
  useEffect(() => {
    if (effectivelyLoading) return;
    if (hasRedirectedRef.current) return;

    if (!hasAccess && !isPublicRoute) {
      if (!isAuthenticated) {
        // Check if user just logged in — give auth more time to settle
        const justLoggedIn = typeof window !== 'undefined' && 
          sessionStorage.getItem('tavvy_login_ts') && 
          (Date.now() - parseInt(sessionStorage.getItem('tavvy_login_ts') || '0', 10)) < POST_LOGIN_GRACE_MS;
        
        if (justLoggedIn) {
          console.log('[AppLayout] Just logged in — waiting for auth to settle');
          // Don't redirect, don't show restricted — just keep showing spinner
          return;
        }
        
        hasRedirectedRef.current = true;
        router.replace(`/app/login?redirect=${encodeURIComponent(router.asPath)}`, undefined, { locale: router.locale });
      } else if (accessLevel === 'pro' && !roles.includes('pro') && !roles.includes('super_admin')) {
        hasRedirectedRef.current = true;
        router.replace('/app/pros', undefined, { locale: router.locale });
      } else if (accessLevel === 'super_admin' && !roles.includes('super_admin')) {
        hasRedirectedRef.current = true;
        router.replace('/app', undefined, { locale: router.locale });
      }
    }
  }, [effectivelyLoading, hasAccess, isAuthenticated, accessLevel, roles, router, isPublicRoute]);

  // For public routes, skip the loading gate entirely
  if (isPublicRoute) {
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

  // Show loading spinner while auth is loading OR if we don't have access yet
  // This replaces the old "Access Restricted" flash — we just keep spinning
  // until either auth resolves with a user, or we redirect to login
  if (effectivelyLoading || (!hasAccess && !hasRedirectedRef.current)) {
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
