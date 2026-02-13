/**
 * Pro Login Screen
 * Service Provider Portal login with teal/green theme
 * Matches iOS design exactly
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useProAuth } from '../../../contexts/ProAuthContext';
import AppLayout from '../../../components/AppLayout';
import { spacing, borderRadius } from '../../../constants/Colors';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ProLoginScreen() {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const { signIn } = useProAuth();
  const router = useRouter();
  const { locale } = router;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pro-specific teal/green color
  const proColor = '#10B981';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signIn(email, password);
      router.push('/app/pros/dashboard', undefined, { locale });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'apple' | 'google') => {
    // TODO: Implement social login for pros
    console.log(`Pro login with ${provider}`);
  };

  return (
    <>
      <Head>
        <title>Pro Login | TavvY</title>
        <meta name="description" content="Log in to your TavvY Pro account" />
      </Head>

      <AppLayout hideTabBar>
        <div className="pro-login-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="login-header">
            <button 
              className="back-button"
              onClick={() => router.back()}
              style={{ color: theme.text }}
            >
              ← Back
            </button>
          </header>

          {/* Logo - Tavvy horizontal logo */}
          <div className="logo-container">
            <img 
              src="/brand/logo-horizontal.png" 
              alt="TavvY" 
              className="logo"
            />
          </div>

          {/* PROS Badge */}
          <div className="pros-badge-container">
            <div className="pros-badge" style={{ borderColor: proColor, color: proColor }}>
              PROS
            </div>
            <p className="portal-subtitle" style={{ color: theme.textSecondary }}>
              Service Provider Portal
            </p>
          </div>

          {/* Value Proposition */}
          <div className="value-prop">
            <h2 className="value-prop-main" style={{ color: theme.text }}>
              No per-lead fees. No bidding wars.
            </h2>
            <p className="value-prop-sub" style={{ color: theme.textSecondary }}>
              Just real customers finding you.
            </p>
          </div>

          {/* Login Form */}
          <div className="form-container">
            {error && (
              <div className="error-message" style={{ backgroundColor: theme.errorLight, color: theme.error }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              {/* Email Input */}
              <div className="input-group">
                <label className="input-label" style={{ color: theme.text }}>
                  Email
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    className="input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ 
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label className="input-label" style={{ color: theme.text }}>
                  Password
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    className="input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                      color: theme.text,
                    }}
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    style={{ color: theme.textSecondary }}
                  >
                    👁️
                  </button>
                </div>
              </div>

              {/* Log In as Pro Button */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
                style={{ backgroundColor: proColor }}
              >
                {loading ? 'Signing in...' : 'Log In as Pro →'}
              </button>

              {/* Forgot Password Link */}
              <div className="forgot-link-container">
                <Link href="/app/pros/forgot-password" locale={locale} className="forgot-link" style={{ color: proColor }}>
                  Forgot Password?
                </Link>
              </div>
            </form>

            {/* Social Login Divider */}
            <div className="divider">
              <span className="divider-line" style={{ backgroundColor: theme.border }}></span>
              <span className="divider-text" style={{ color: theme.textSecondary }}>or continue with</span>
              <span className="divider-line" style={{ backgroundColor: theme.border }}></span>
            </div>

            {/* Social Login Buttons */}
            <div className="social-buttons">
              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialLogin('apple')}
                style={{ 
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: theme.text }}>
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>

              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialLogin('google')}
                style={{ 
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>

            {/* Sign Up Prompt */}
            <div className="signup-prompt">
              <span style={{ color: theme.textSecondary }}>
                New to Tavvy Pros?{' '}
              </span>
              <Link href="/app/pros/register" locale={locale} style={{ color: proColor }}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .pro-login-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .login-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button {
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .logo-container {
            display: flex;
            justify-content: center;
            padding: ${spacing.md}px ${spacing.xl}px;
            margin-bottom: ${spacing.sm}px;
          }
          
          .logo {
            height: 64px;
            width: auto;
          }
          
          .pros-badge-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: ${spacing.xs}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .pros-badge {
            padding: 8px 24px;
            border: 2px solid;
            border-radius: 24px;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 1px;
          }
          
          .portal-subtitle {
            font-size: 16px;
            margin: 0;
          }
          
          .value-prop {
            text-align: center;
            padding: 0 ${spacing.xl}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .value-prop-main {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 ${spacing.xs}px;
            line-height: 1.3;
          }
          
          .value-prop-sub {
            font-size: 16px;
            margin: 0;
          }
          
          .form-container {
            flex: 1;
            padding: ${spacing.md}px ${spacing.xl}px;
            max-width: 400px;
            margin: 0 auto;
            width: 100%;
          }
          
          .error-message {
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.md}px;
            margin-bottom: ${spacing.lg}px;
            text-align: center;
            font-size: 14px;
          }
          
          .login-form {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          
          .input-label {
            font-size: 16px;
            font-weight: 600;
          }
          
          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }
          
          .input-icon {
            position: absolute;
            left: 16px;
            font-size: 18px;
            pointer-events: none;
          }
          
          .input {
            width: 100%;
            padding: 16px 16px 16px 48px;
            border-radius: ${borderRadius.lg}px;
            border-width: 1px;
            border-style: solid;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
          }
          
          .input:focus {
            border-color: ${proColor};
          }
          
          .password-toggle {
            position: absolute;
            right: 16px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 18px;
            padding: 4px;
          }
          
          .login-button {
            padding: 18px;
            border-radius: ${borderRadius.lg}px;
            border: none;
            color: white;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: ${spacing.sm}px;
          }
          
          .login-button:hover {
            opacity: 0.9;
          }
          
          .login-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .forgot-link-container {
            display: flex;
            justify-content: center;
            margin-top: ${spacing.sm}px;
          }
          
          .forgot-link {
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
          }
          
          .divider {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            margin: ${spacing.lg}px 0;
          }
          
          .divider-line {
            flex: 1;
            height: 1px;
          }
          
          .divider-text {
            font-size: 14px;
            white-space: nowrap;
          }
          
          .social-buttons {
            display: flex;
            gap: ${spacing.md}px;
            justify-content: center;
          }
          
          .social-button {
            width: 64px;
            height: 64px;
            border-radius: ${borderRadius.lg}px;
            border: 1px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: opacity 0.2s;
          }
          
          .social-button:hover {
            opacity: 0.8;
          }
          
          .signup-prompt {
            text-align: center;
            margin-top: ${spacing.xl}px;
            font-size: 15px;
          }
          
          .signup-prompt a {
            font-weight: 600;
            text-decoration: none;
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
