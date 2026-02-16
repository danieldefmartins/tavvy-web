/**
 * Email Settings Page
 * Allows users to view and update their email address
 */
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { FiArrowLeft, FiMail, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function EmailSettingsScreen() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const { theme } = useThemeContext();
  const { user } = useAuth();
  const { t } = useTranslation('common');

  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });

      if (updateError) throw updateError;

      setSuccess('A confirmation email has been sent to your new address. Please check your inbox.');
      setNewEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to update email.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Head>
        <title>Email Settings | TavvY</title>
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
        .current-email {
          background: ${theme.surface};
          border: 1px solid ${theme.border};
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .label {
          font-size: 13px;
          color: ${theme.textSecondary};
          margin-bottom: 4px;
        }
        .email-value {
          font-size: 16px;
          color: ${theme.text};
          font-weight: 500;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: ${theme.text};
          margin-bottom: 12px;
        }
        .field-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid ${theme.border};
          border-radius: 10px;
          font-size: 16px;
          color: ${theme.text};
          background: ${theme.surface};
          outline: none;
          box-sizing: border-box;
          margin-bottom: 16px;
        }
        .field-input:focus {
          border-color: #0D9488;
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
      `}</style>

      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={() => router.back()}>
            <FiArrowLeft size={20} />
          </button>
          <span className="header-title">Email Address</span>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="current-email">
          <div className="label">Current Email</div>
          <div className="email-value">{user?.email || 'Not set'}</div>
        </div>

        <div className="section-title">Change Email</div>
        <input
          className="field-input"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Enter new email address"
        />
        <button className="save-btn" onClick={handleUpdateEmail} disabled={saving || !newEmail.trim()}>
          {saving ? 'Updating...' : <><FiCheck size={16} /> Update Email</>}
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
