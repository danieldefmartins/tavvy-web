/**
 * Password Settings Page
 * Allows users to change their password
 */
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { FiArrowLeft, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PasswordSettingsScreen() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const { theme } = useThemeContext();
  const { t } = useTranslation('common');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Head>
        <title>Change Password | TavvY</title>
      </Head>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 0 16px 40px;
          min-height: 100vh;
          background: ${theme.background};
        }
        .header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
          border-bottom: 1px solid ${theme.border};
          margin-bottom: 24px;
        }
        .back-btn {
          background: none;
          border: none;
          color: ${theme.text};
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: ${theme.text};
        }
        .field-group {
          margin-bottom: 16px;
        }
        .field-label {
          font-size: 14px;
          font-weight: 500;
          color: ${theme.textSecondary};
          margin-bottom: 6px;
        }
        .input-wrapper {
          position: relative;
        }
        .field-input {
          width: 100%;
          padding: 12px 44px 12px 14px;
          border: 1px solid ${theme.border};
          border-radius: 10px;
          font-size: 16px;
          color: ${theme.text};
          background: ${theme.surface};
          outline: none;
          box-sizing: border-box;
        }
        .field-input:focus {
          border-color: #0D9488;
        }
        .toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: ${theme.textSecondary};
          cursor: pointer;
          padding: 4px;
          display: flex;
        }
        .save-btn {
          width: 100%;
          padding: 14px;
          background: #0D9488;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
        .save-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .alert {
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .alert-success {
          background: #D1FAE5;
          color: #065F46;
        }
        .alert-error {
          background: #FEE2E2;
          color: #991B1B;
        }
        .hint {
          font-size: 12px;
          color: ${theme.textSecondary};
          margin-top: 4px;
        }
      `}</style>

      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={() => router.back()}>
            <FiArrowLeft size={20} />
          </button>
          <span className="header-title">Change Password</span>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="field-group">
          <div className="field-label">New Password</div>
          <div className="input-wrapper">
            <input
              className="field-input"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
            <button className="toggle-btn" onClick={() => setShowNew(!showNew)}>
              {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="hint">Minimum 6 characters</div>
        </div>

        <div className="field-group">
          <div className="field-label">Confirm Password</div>
          <div className="input-wrapper">
            <input
              className="field-input"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <button className="toggle-btn" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>

        <button
          className="save-btn"
          onClick={handleUpdatePassword}
          disabled={saving || !newPassword || !confirmPassword}
        >
          {saving ? 'Updating...' : <><FiCheck size={16} /> Update Password</>}
        </button>
      </div>
    </AppLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
