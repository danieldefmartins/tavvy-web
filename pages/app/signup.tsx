/**
 * Sign Up Screen
 * Ported from tavvy-mobile/screens/SignUpScreen.tsx
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

export default function SignUpScreen() {
  const { theme } = useThemeContext();
  const { signUp } = useAuth();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    if (!zipCode.trim()) {
      setError('ZIP code is required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signUp(email, password, displayName, zipCode.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Check Your Email | TavvY</title>
        </Head>

        <AppLayout hideTabBar>
          <div className="signup-screen" style={{ backgroundColor: theme.background }}>
            <div className="success-container">
              <span className="success-icon">✉️</span>
              <h1 style={{ color: theme.text }}>Check Your Email</h1>
              <p style={{ color: theme.textSecondary }}>
                We've sent a confirmation link to <strong>{email}</strong>. 
                Please click the link to verify your account.
              </p>
              <Link href={`/app/login${router.query.returnUrl ? `?returnUrl=${encodeURIComponent(router.query.returnUrl as string)}` : ''}`} locale={locale} className="back-to-login" style={{ color: theme.primary }}>
                Back to Login
              </Link>
            </div>
          </div>

          <style jsx>{`
            .signup-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: ${spacing.xl}px;
            }
            
            .success-container {
              text-align: center;
              max-width: 400px;
            }
            
            .success-icon {
              font-size: 64px;
              display: block;
              margin-bottom: ${spacing.lg}px;
            }
            
            .success-container h1 {
              font-size: 24px;
              margin: 0 0 ${spacing.md}px;
            }
            
            .success-container p {
              font-size: 16px;
              line-height: 1.5;
              margin: 0 0 ${spacing.xl}px;
            }
            
            .back-to-login {
              font-weight: 600;
              text-decoration: none;
            }
          `}</style>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Sign Up | TavvY</title>
        <meta name="description" content="Create your TavvY account" />
      </Head>

      <AppLayout hideTabBar>
        <div className="signup-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="signup-header">
            <button 
              className="back-button"
              onClick={() => router.back()}
              style={{ color: theme.text }}
            >
              ← Back
            </button>
          </header>

          {/* Logo */}
          <div className="logo-container">
            <img 
              src="/brand/logo-white.png" 
              alt="TavvY" 
              className="logo"
            />
          </div>

          {/* Sign Up Form */}
          <div className="form-container">
            <h1 className="title" style={{ color: theme.text }}>
              Create Account
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              Join TavvY to discover and share places
            </p>

            {error && (
              <div className="error-message" style={{ backgroundColor: theme.errorLight, color: theme.error }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="signup-form">
              <div className="input-group">
                <label className="input-label" style={{ color: theme.textSecondary }}>
                  Display Name (optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: theme.textSecondary }}>
                  ZIP Code *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. 33101"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  maxLength={10}
                  style={{ 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: theme.textSecondary }}>
                  Email
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: theme.textSecondary }}>
                  Password
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  }}
                />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ color: theme.textSecondary }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.inputText,
                  }}
                />
              </div>

              <button
                type="submit"
                className="signup-button"
                disabled={loading}
                style={{ backgroundColor: theme.primary }}
              >
                {loading ? 'Creating account...' : 'Sign Up'}
              </button>
            </form>

            <p className="terms-text" style={{ color: theme.textTertiary }}>
              By signing up, you agree to our{' '}
              <Link href="/terms" locale={locale} style={{ color: theme.primary }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" locale={locale} style={{ color: theme.primary }}>Privacy Policy</Link>
            </p>

            <div className="login-prompt">
              <span style={{ color: theme.textSecondary }}>
                Already have an account?{' '}
              </span>
              <Link href="/app/login" locale={locale} style={{ color: theme.primary }}>
                Log In
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .signup-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }
          
          .signup-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button {
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
          }
          
          .logo-container {
            display: flex;
            justify-content: center;
            padding: ${spacing.lg}px;
          }
          
          .logo {
            height: 50px;
            width: auto;
          }
          
          .form-container {
            flex: 1;
            padding: ${spacing.xl}px;
            max-width: 400px;
            margin: 0 auto;
            width: 100%;
          }
          
          .title {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 8px;
            text-align: center;
          }
          
          .subtitle {
            font-size: 16px;
            margin: 0 0 ${spacing.xl}px;
            text-align: center;
          }
          
          .error-message {
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.md}px;
            margin-bottom: ${spacing.lg}px;
            text-align: center;
            font-size: 14px;
          }
          
          .signup-form {
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
            font-size: 14px;
            font-weight: 500;
          }
          
          .input {
            padding: 14px 16px;
            border-radius: ${borderRadius.md}px;
            border-width: 1px;
            border-style: solid;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
          }
          
          .input:focus {
            border-color: ${theme.primary};
          }
          
          .signup-button {
            padding: 16px;
            border-radius: ${borderRadius.md}px;
            border: none;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: ${spacing.sm}px;
          }
          
          .signup-button:hover {
            opacity: 0.9;
          }
          
          .signup-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .terms-text {
            text-align: center;
            font-size: 12px;
            margin-top: ${spacing.lg}px;
            line-height: 1.5;
          }
          
          .terms-text a {
            text-decoration: none;
          }
          
          .login-prompt {
            text-align: center;
            margin-top: ${spacing.lg}px;
            font-size: 14px;
          }
          
          .login-prompt a {
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
