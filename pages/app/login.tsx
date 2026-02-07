/**
 * Login Screen
 * Updated to match iOS design with social login, forgot password, and pro login link
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const { signIn } = useAuth();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Mark login timestamp so AppLayout doesn't redirect back to login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tavvy_login_ts', Date.now().toString());
      }
      // Redirect to returnUrl or redirect param if provided, otherwise go to /app
      const returnUrl = (router.query.returnUrl || router.query.redirect) as string;
      router.push(returnUrl || '/app');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'apple' | 'google') => {
    // TODO: Implement social login
    console.log(`Login with ${provider}`);
  };

  return (
    <>
      <Head>
        <title>Log In | TavvY</title>
        <meta name="description" content="Log in to your TavvY account" />
      </Head>

      <AppLayout hideTabBar>
        <div className="login-screen" style={{ backgroundColor: theme.background }}>
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

          {/* Login Form */}
          <div className="form-container">
            <h1 className="title" style={{ color: theme.text }}>
              Welcome back!
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              Sign in to continue your journey
            </p>

            {error && (
              <div className="error-message" style={{ backgroundColor: theme.errorLight, color: theme.error }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              {/* Email Input */}
              <div className="input-group">
                <label className="input-label" style={{ color: theme.textSecondary }}>
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
                <label className="input-label" style={{ color: theme.textSecondary }}>
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

              {/* Log In Button */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
                style={{ backgroundColor: theme.primary }}
              >
                {loading ? 'Signing in...' : 'Log In →'}
              </button>

              {/* Forgot Password & Pro Login Links */}
              <div className="secondary-links">
                <Link href="/app/forgot-password" locale={locale} className="forgot-link" style={{ color: theme.primary }}>
                  Forgot Password?
                </Link>
                <div className="pro-login-link">
                  <span style={{ color: theme.textSecondary }}>Are you a Pro?{' '}</span>
                  <Link href="/app/pros/login" locale={locale} style={{ color: '#10B981', fontWeight: 600 }}>
                    Sign in here
                  </Link>
                </div>
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
                Don't have an account?{' '}
              </span>
              <Link href={`/app/signup${(router.query.returnUrl || router.query.redirect) ? `?returnUrl=${encodeURIComponent((router.query.returnUrl || router.query.redirect) as string)}` : ''}`} locale={locale} style={{ color: theme.primary }}>
                Sign Up
              </Link>
            </div>


          </div>
        </div>

        <style jsx>{`
          .login-screen {
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
            padding: ${spacing.lg}px ${spacing.xl}px;
            margin-bottom: ${spacing.sm}px;
          }
          
          .logo {
            height: 64px;
            width: auto;
          }
          
          .form-container {
            flex: 1;
            padding: ${spacing.md}px ${spacing.xl}px;
            max-width: 400px;
            margin: 0 auto;
            width: 100%;
          }
          
          .title {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 ${spacing.xs}px;
            text-align: center;
          }
          
          .subtitle {
            font-size: 16px;
            margin: 0 0 ${spacing.lg}px;
            text-align: center;
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
            border-color: ${theme.primary};
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
          
          .secondary-links {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: ${spacing.md}px;
            flex-wrap: wrap;
          }
          
          .forgot-link {
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
          }
          
          .pro-login-link {
            font-size: 14px;
            text-align: right;
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
          
          .pro-login-prompt {
            text-align: center;
            margin-top: ${spacing.md}px;
            font-size: 15px;
          }
          
          .pro-login-prompt a {
            font-weight: 600;
            text-decoration: none;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
