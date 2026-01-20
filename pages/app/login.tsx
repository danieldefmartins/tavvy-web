/**
 * Login Screen
 * Ported from tavvy-mobile/screens/LoginScreen.tsx
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';

export default function LoginScreen() {
  const { theme } = useThemeContext();
  const { signIn } = useAuth();
  const router = useRouter();
  
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
      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
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

          {/* Logo */}
          <div className="logo-container">
            <img 
              src="/brand/logo-white.png" 
              alt="TavvY" 
              className="logo"
            />
          </div>

          {/* Login Form */}
          <div className="form-container">
            <h1 className="title" style={{ color: theme.text }}>
              Welcome Back
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              Sign in to continue to TavvY
            </p>

            {error && (
              <div className="error-message" style={{ backgroundColor: theme.errorLight, color: theme.error }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
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
                    color: theme.text,
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
                    color: theme.text,
                  }}
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
                style={{ backgroundColor: theme.primary }}
              >
                {loading ? 'Signing in...' : 'Log In'}
              </button>
            </form>

            <div className="signup-prompt">
              <span style={{ color: theme.textSecondary }}>
                Don't have an account?{' '}
              </span>
              <Link href="/app/signup" style={{ color: theme.primary }}>
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
          }
          
          .logo-container {
            display: flex;
            justify-content: center;
            padding: ${spacing.xl}px;
          }
          
          .logo {
            height: 60px;
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
          
          .login-form {
            display: flex;
            flex-direction: column;
            gap: ${spacing.lg}px;
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
          
          .login-button {
            padding: 16px;
            border-radius: ${borderRadius.md}px;
            border: none;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: ${spacing.md}px;
          }
          
          .login-button:hover {
            opacity: 0.9;
          }
          
          .login-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .signup-prompt {
            text-align: center;
            margin-top: ${spacing.xl}px;
            font-size: 14px;
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
