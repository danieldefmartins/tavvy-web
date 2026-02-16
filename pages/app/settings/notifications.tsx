/**
 * Notification Settings Page
 * Allows users to manage notification preferences
 */
import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { FiArrowLeft, FiBell } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Toggle = ({ enabled, onChange, theme }: { enabled: boolean; onChange: () => void; theme: any }) => (
  <button
    onClick={onChange}
    style={{
      width: 50,
      height: 28,
      borderRadius: 14,
      border: 'none',
      background: enabled ? '#0D9488' : theme.border,
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.2s',
      padding: 0,
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        background: 'white',
        position: 'absolute',
        top: 3,
        left: enabled ? 25 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    />
  </button>
);

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const locale = router.locale || 'en';
  const { theme } = useThemeContext();
  const { t } = useTranslation('common');

  const [prefs, setPrefs] = useState({
    pushEnabled: true,
    emailEnabled: true,
    newReviews: true,
    projectUpdates: true,
    proMessages: true,
    promotions: false,
    weeklyDigest: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppLayout>
      <Head>
        <title>Notifications | TavvY</title>
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
        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: ${theme.textSecondary};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          margin-top: 28px;
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid ${theme.border};
        }
        .setting-info {
          flex: 1;
          margin-right: 16px;
        }
        .setting-label {
          font-size: 16px;
          font-weight: 500;
          color: ${theme.text};
        }
        .setting-desc {
          font-size: 13px;
          color: ${theme.textSecondary};
          margin-top: 2px;
        }
      `}</style>

      <div className="container">
        <div className="header">
          <button className="back-btn" onClick={() => router.back()}>
            <FiArrowLeft size={20} />
          </button>
          <span className="header-title">Notifications</span>
        </div>

        <div className="section-title">General</div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Push Notifications</div>
            <div className="setting-desc">Receive push notifications on your device</div>
          </div>
          <Toggle enabled={prefs.pushEnabled} onChange={() => toggle('pushEnabled')} theme={theme} />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Email Notifications</div>
            <div className="setting-desc">Receive notifications via email</div>
          </div>
          <Toggle enabled={prefs.emailEnabled} onChange={() => toggle('emailEnabled')} theme={theme} />
        </div>

        <div className="section-title">Activity</div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">New Reviews</div>
            <div className="setting-desc">When someone reviews a place you added</div>
          </div>
          <Toggle enabled={prefs.newReviews} onChange={() => toggle('newReviews')} theme={theme} />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Project Updates</div>
            <div className="setting-desc">Updates on your service requests</div>
          </div>
          <Toggle enabled={prefs.projectUpdates} onChange={() => toggle('projectUpdates')} theme={theme} />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Pro Messages</div>
            <div className="setting-desc">Messages from service professionals</div>
          </div>
          <Toggle enabled={prefs.proMessages} onChange={() => toggle('proMessages')} theme={theme} />
        </div>

        <div className="section-title">Marketing</div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Promotions</div>
            <div className="setting-desc">Special offers and deals</div>
          </div>
          <Toggle enabled={prefs.promotions} onChange={() => toggle('promotions')} theme={theme} />
        </div>

        <div className="setting-row">
          <div className="setting-info">
            <div className="setting-label">Weekly Digest</div>
            <div className="setting-desc">Weekly summary of activity near you</div>
          </div>
          <Toggle enabled={prefs.weeklyDigest} onChange={() => toggle('weeklyDigest')} theme={theme} />
        </div>
      </div>
    </AppLayout>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
