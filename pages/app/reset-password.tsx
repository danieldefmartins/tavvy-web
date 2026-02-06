/**
 * Reset Password Screen
 * User lands here after clicking the reset link in their email
 * Allows setting a new password via Supabase
 * Uses hardcoded dark theme to avoid white-on-white issues
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function ResetPasswordScreen() {
  const { t } = useTranslation('common');
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Listen for the PASSWORD_RECOVERY event from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[ResetPassword] Auth event:', event);
        if (event === 'PASSWORD_RECOVERY') {
          setSessionReady(true);
          setCheckingSession(false);
        }
        if (event === 'SIGNED_IN' && session) {
          setSessionReady(true);
          setCheckingSession(false);
        }
      }
    );

    // Also check if we already have a session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[ResetPassword] Existing session:', !!session);
      if (session) {
        setSessionReady(true);
      }
      setCheckingSession(false);
    });

    // Handle the hash fragment from Supabase email link
    // Supabase appends #access_token=...&type=recovery to the URL
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (accessToken && type === 'recovery') {
        console.log('[ResetPassword] Found recovery tokens in URL hash');
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        }).then(({ error }) => {
          if (error) {
            console.error('[ResetPassword] Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new one.');
          } else {
            setSessionReady(true);
          }
          setCheckingSession(false);
        });
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Must contain at least one uppercase letter';
    if (!/[0-9]/.test(pwd)) return 'Must contain at least one number';
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ResetPassword] Submit clicked, sessionReady:', sessionReady);

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
        console.error('[ResetPassword] Update error:', updateError);
        if (updateError.message.includes('session') || updateError.message.includes('token')) {
          setError('Your reset link has expired. Please request a new password reset.');
        } else {
          setError(updateError.message);
        }
      } else {
        console.log('[ResetPassword] Password updated successfully');
        setSuccess(true);
      }
    } catch (err: any) {
      console.error('[ResetPassword] Catch error:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordValidation = password ? validatePassword(password) : null;
  const canSubmit = password && confirmPassword && passwordsMatch && !passwordValidation && !loading;

  return (
    <>
      <Head>
        <title>Reset Password | TavvY</title>
        <meta name="description" content="Set your new TavvY password" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Header */}
        <header style={{
          width: '100%',
          maxWidth: 440,
          padding: '24px 20px 0',
        }}>
          <button
            onClick={() => router.push('/app/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#14B8A6',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
            }}
          >
            ← Back to Login
          </button>
        </header>

        {/* Logo */}
        <div style={{ padding: '32px 0 16px', textAlign: 'center' }}>
          <img
            src="/brand/logo-horizontal.png"
            alt="TavvY"
            style={{ height: 56, width: 'auto' }}
          />
        </div>

        {/* Content */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          padding: '0 20px',
        }}>
          {checkingSession ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 40,
                height: 40,
                border: '3px solid #333',
                borderTopColor: '#14B8A6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ color: '#999', fontSize: 15 }}>Verifying your reset link...</p>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
                Password Updated!
              </h1>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5, margin: '0 0 24px' }}>
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <button
                onClick={() => router.push('/app/login')}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: '#14B8A6',
                  cursor: 'pointer',
                }}
              >
                Go to Login →
              </button>
            </div>
          ) : !sessionReady ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
                Invalid or Expired Link
              </h1>
              <p style={{ color: '#999', fontSize: 15, lineHeight: 1.5, margin: '0 0 24px' }}>
                This password reset link is no longer valid. Please request a new one.
              </p>
              <button
                onClick={() => router.push('/app/forgot-password')}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: 'none',
                  borderRadius: 14,
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: '#14B8A6',
                  cursor: 'pointer',
                }}
              >
                Request New Reset Link
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, margin: '0 0 6px', textAlign: 'center' }}>
                Set new password
              </h1>
              <p style={{ color: '#999', fontSize: 15, margin: '0 0 24px', textAlign: 'center', lineHeight: 1.5 }}>
                Create a strong password for your account.
              </p>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  marginBottom: 16,
                  fontSize: 14,
                  textAlign: 'center',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* New Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: '#aaa', fontSize: 14, fontWeight: 500 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, fontSize: 18, zIndex: 1 }}>🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 48px 14px 44px',
                        borderRadius: 12,
                        border: '1px solid #333',
                        fontSize: 16,
                        outline: 'none',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        background: 'none',
                        border: 'none',
                        fontSize: 18,
                        cursor: 'pointer',
                        padding: 4,
                        color: '#999',
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {password && passwordValidation && (
                    <span style={{ fontSize: 12, color: '#ef4444' }}>{passwordValidation}</span>
                  )}
                  {password && !passwordValidation && (
                    <span style={{ fontSize: 12, color: '#10B981' }}>✓ Password meets requirements</span>
                  )}
                </div>

                {/* Confirm Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ color: '#aaa', fontSize: 14, fontWeight: 500 }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 14, fontSize: 18, zIndex: 1 }}>🔒</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '14px 48px 14px 44px',
                        borderRadius: 12,
                        border: '1px solid #333',
                        fontSize: 16,
                        outline: 'none',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        background: 'none',
                        border: 'none',
                        fontSize: 18,
                        cursor: 'pointer',
                        padding: 4,
                        color: '#999',
                      }}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {confirmPassword && (
                    <span style={{ fontSize: 12, color: passwordsMatch ? '#10B981' : '#ef4444' }}>
                      {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </span>
                  )}
                </div>

                {/* Password Requirements */}
                <div style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                }}>
                  <p style={{ color: '#aaa', fontSize: 13, fontWeight: 600, margin: '0 0 8px' }}>
                    Password requirements:
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    <li style={{ color: password && password.length >= 8 ? '#10B981' : '#666' }}>
                      {password && password.length >= 8 ? '✓' : '○'} At least 8 characters
                    </li>
                    <li style={{ color: password && /[A-Z]/.test(password) ? '#10B981' : '#666' }}>
                      {password && /[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                    </li>
                    <li style={{ color: password && /[0-9]/.test(password) ? '#10B981' : '#666' }}>
                      {password && /[0-9]/.test(password) ? '✓' : '○'} One number
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    width: '100%',
                    padding: 16,
                    border: 'none',
                    borderRadius: 14,
                    fontSize: 17,
                    fontWeight: 600,
                    color: '#fff',
                    backgroundColor: canSubmit ? '#14B8A6' : '#333',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    opacity: canSubmit ? 1 : 0.6,
                    marginTop: 8,
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #555 !important;
        }
        input:focus {
          border-color: #14B8A6 !important;
        }
      `}</style>
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
