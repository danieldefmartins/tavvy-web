import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAccess } from '../hooks/useRoles';
import { AccessLevel } from '../lib/roleService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel: AccessLevel;
  fallbackUrl?: string;
}

/**
 * Component that protects routes based on user roles
 * Redirects unauthorized users to appropriate pages
 */
export function ProtectedRoute({ 
  children, 
  requiredLevel, 
  fallbackUrl 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { hasAccess, loading, redirectTo } = useAccess(requiredLevel);

  useEffect(() => {
    if (!loading && !hasAccess && redirectTo) {
      const destination = fallbackUrl || redirectTo;
      router.replace(destination);
    }
  }, [loading, hasAccess, redirectTo, fallbackUrl, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
        <style jsx>{`
          .protected-route-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            color: var(--text-secondary);
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--border-color);
            border-top-color: var(--accent-blue);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            margin-top: 16px;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // Show access denied message briefly before redirect
  if (!hasAccess) {
    return (
      <div className="access-denied">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Restricted</h2>
        <p>You don't have permission to view this page.</p>
        <p className="redirect-message">Redirecting...</p>
        <style jsx>{`
          .access-denied {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 50vh;
            text-align: center;
            padding: 20px;
          }
          .access-denied-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h2 {
            color: var(--text-primary);
            margin-bottom: 8px;
          }
          p {
            color: var(--text-secondary);
            margin-bottom: 8px;
          }
          .redirect-message {
            font-size: 12px;
            color: var(--text-tertiary);
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * HOC for protecting pages with role-based access
 */
export function withProtectedRoute<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredLevel: AccessLevel,
  fallbackUrl?: string
) {
  const WithProtectedRoute = (props: P) => {
    return (
      <ProtectedRoute requiredLevel={requiredLevel} fallbackUrl={fallbackUrl}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };

  WithProtectedRoute.displayName = `WithProtectedRoute(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithProtectedRoute;
}

/**
 * Component for showing content only to specific roles
 */
interface RoleGateProps {
  children: React.ReactNode;
  requiredLevel: AccessLevel;
  fallback?: React.ReactNode;
}

export function RoleGate({ children, requiredLevel, fallback = null }: RoleGateProps) {
  const { hasAccess, loading } = useAccess(requiredLevel);

  if (loading) {
    return null;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component for showing content only to authenticated users
 */
export function AuthenticatedOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate requiredLevel="authenticated" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Component for showing content only to Pro users
 */
export function ProOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate requiredLevel="pro" fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/**
 * Component for showing content only to Super Admins
 */
export function AdminOnly({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return (
    <RoleGate requiredLevel="super_admin" fallback={fallback}>
      {children}
    </RoleGate>
  );
}
