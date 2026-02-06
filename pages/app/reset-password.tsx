/**
 * Reset Password Screen
 * User lands here after clicking the reset link in their email
 * Allows setting a new password via Supabase
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing } from '../../constants/Colors';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ResetPasswordScreen() {
  const { theme } = useThemeContext();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Listen for the PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
        }
        if (event === 'SIGNED_IN' && session) {
          setSessionReady(true);
        }
      }
    );

    // Also check if we already have a session (user clicked link and session was restored)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number';
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordValidation = password ? validatePassword(password) : null;

  return (
    <>
      <Head>
        <title>Reset Password | TavvY</title>
        <meta name="description" content="Set your new TavvY password" />
      </Head>

      <AppLayout hideTabBar>
        <div className="reset-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="reset-header">
            <button
              className="back-button"
              onClick={() => router.push('/app/login')}
              style={{ color: theme.text }}
            >
              ← Back to Login
            </button>
          </header>

          {/* Logo */}
          <div className="logo-container">
            <img
              src="/brand/logo-horizontal.png"
              alt="TavvY"
              className="logo"
            />
          </div>

          {/* Content */}
          <div className="form-container">
            {success ? (
              <div className="success-container">
                <div className="success-icon">✅</div>
                <h1 className="title" style={{ color: theme.text }}>
                  Password Updated!
                </h1>
                <p className="subtitle" style={{ color: theme.textSecondary }}>
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <Link href="/app/login" locale={locale}>
                  <button
                    className="login-button"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Go to Login →
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <h1 className="title" style={{ color: theme.text }}>
                  Set new password
                </h1>
                <p className="subtitle" style={{ color: theme.textSecondary }}>
                  Create a strong password for your account.
                </p>

                {error && (
                  <div className="error-message" style={{ backgroundColor: theme.errorLight, color: theme.error }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="reset-form">
                  {/* New Password */}
                  <div className="input-group">
                    <label className="input-label" style={{ color: theme.textSecondary }}>
                      New Password
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Enter new password"
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
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ color: theme.textSecondary }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {password && passwordValidation && (
                      <span className="validation-hint" style={{ color: theme.error }}>
                        {passwordValidation}
                      </span>
                    )}
                    {password && !passwordValidation && (
                      <span className="validation-hint" style={{ color: '#10B981' }}>
                        ✓ Password meets requirements
                      </span>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="input-group">
                    <label className="input-label" style={{ color: theme.textSecondary }}>
                      Confirm Password
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                          color: theme.text,
                        }}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ color: theme.textSecondary }}
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {confirmPassword && (
                      <span className="validation-hint" style={{ color: passwordsMatch ? '#10B981' : theme.error }}>
                        {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="requirements" style={{ backgroundColor: theme.surface, borderColor: theme.border }}>
                    <p className="requirements-title" style={{ color: theme.textSecondary }}>
                      Password requirements:
                    </p>
                    <ul className="requirements-list">
                      <li style={{ color: password && password.length >= 8 ? '#10B981' : theme.textSecondary }}>
                        {password && password.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li style={{ color: password && /[A-Z]/.test(password) ? '#10B981' : theme.textSecondary }}>
                        {password && /[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                      </li>
                      <li style={{ color: password && /[0-9]/.test(password) ? '#10B981' : theme.textSecondary }}>
                        {password && /[0-9]/.test(password) ? '✓' : '○'} One number
                      </li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    className="reset-button"
                    disabled={loading || !passwordsMatch || !!passwordValidation}
                    style={{ backgroundColor: theme.primary }}
                  >
                    {loading ? 'Updating...' : 'Update Password →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .reset-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .reset-header {
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
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 ${spacing.xs}px;
            text-align: center;
          }

          .subtitle {
            font-size: 15px;
            margin: 0 0 ${spacing.lg}px;
            text-align: center;
            line-height: 1.5;
          }

          .error-message {
            padding: ${spacing.md}px;
            border-radius: 12px;
            margin-bottom: ${spacing.md}px;
            font-size: 14px;
            text-align: center;
          }

          .reset-form {
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

          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .input-icon {
            position: absolute;
            left: 14px;
            font-size: 18px;
            z-index: 1;
          }

          .input {
            width: 100%;
            padding: 14px 48px 14px 44px;
            border-radius: 12px;
            border: 1px solid;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
          }

          .input:focus {
            border-color: #14B8A6;
          }

          .password-toggle {
            position: absolute;
            right: 14px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            padding: 4px;
          }

          .validation-hint {
            font-size: 12px;
            margin-top: 2px;
          }

          .requirements {
            padding: ${spacing.md}px;
            border-radius: 12px;
            border: 1px solid;
          }

          .requirements-title {
            font-size: 13px;
            font-weight: 600;
            margin: 0 0 8px;
          }

          .requirements-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 13px;
          }

          .reset-button {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 14px;
            font-size: 17px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: ${spacing.sm}px;
          }

          .reset-button:hover {
            opacity: 0.9;
          }

          .reset-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .success-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: ${spacing.md}px;
          }

          .success-icon {
            font-size: 64px;
            margin-bottom: ${spacing.sm}px;
          }

          .login-button {
            width: 100%;
            padding: 16px 32px;
            border: none;
            border-radius: 14px;
            font-size: 17px;
            font-weight: 600;
            color: white;
            cursor: pointer;
            transition: opacity 0.2s;
            margin-top: ${spacing.md}px;
          }

          .login-button:hover {
            opacity: 0.9;
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
