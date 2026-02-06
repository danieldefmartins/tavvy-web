/**
 * Pros Forgot Password Screen
 * Matches Tavvy Pros branding (green theme)
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { spacing } from '../../../constants/Colors';
import { supabase } from '../../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ProsForgotPasswordScreen() {
  const { theme } = useThemeContext();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;

  const proColor = '#10B981';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password | TavvY Pros</title>
        <meta name="description" content="Reset your TavvY Pros password" />
      </Head>

      <AppLayout hideTabBar>
        <div className="forgot-screen" style={{ backgroundColor: theme.background }}>
          <header className="forgot-header">
            <button
              className="back-button"
              onClick={() => router.back()}
              style={{ color: theme.text }}
            >
              ← Back
            </button>
          </header>

          <div className="logo-container">
            <img
              src="/brand/logo-horizontal.png"
              alt="TavvY"
              className="logo"
            />
            <span className="pro-badge">PRO</span>
          </div>

          <div className="form-container">
            {success ? (
              <div className="success-container">
                <div className="success-icon">✉️</div>
                <h1 className="title" style={{ color: theme.text }}>
                  Check your email
                </h1>
                <p className="subtitle" style={{ color: theme.textSecondary }}>
                  We sent a password reset link to <strong style={{ color: theme.text }}>{email}</strong>.
                  Click the link in the email to reset your password.
                </p>
                <p className="hint" style={{ color: theme.textSecondary }}>
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  className="resend-button"
                  onClick={() => setSuccess(false)}
                  style={{ color: proColor }}
                >
                  Try again with a different email
                </button>
                <Link href="/app/pros/login" locale={locale} className="back-to-login" style={{ color: proColor }}>
                  ← Back to Pro Login
                </Link>
              </div>
            ) : (
              <>
                <h1 className="title" style={{ color: theme.text }}>
                  Forgot your password?
                </h1>
                <p className="subtitle" style={{ color: theme.textSecondary }}>
                  No worries! Enter your email and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="error-message" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="forgot-form">
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

                  <button
                    type="submit"
                    className="reset-button"
                    disabled={loading}
                    style={{ backgroundColor: proColor }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link →'}
                  </button>

                  <div className="login-link">
                    <Link href="/app/pros/login" locale={locale} style={{ color: proColor }}>
                      ← Back to Pro Login
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .forgot-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
          }

          .forgot-header {
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
            align-items: center;
            padding: ${spacing.lg}px ${spacing.xl}px;
            margin-bottom: ${spacing.sm}px;
            gap: 8px;
          }

          .logo {
            height: 64px;
            width: auto;
          }

          .pro-badge {
            background: ${proColor};
            color: white;
            font-size: 12px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            letter-spacing: 1px;
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

          .forgot-form {
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
            padding: 14px 14px 14px 44px;
            border-radius: 12px;
            border: 1px solid;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
          }

          .input:focus {
            border-color: ${proColor};
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
            opacity: 0.6;
            cursor: not-allowed;
          }

          .login-link {
            text-align: center;
            margin-top: ${spacing.md}px;
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

          .hint {
            font-size: 13px;
            margin: 0;
          }

          .resend-button {
            background: none;
            border: none;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            padding: 8px 16px;
          }

          .back-to-login {
            font-size: 15px;
            font-weight: 600;
            margin-top: ${spacing.sm}px;
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
