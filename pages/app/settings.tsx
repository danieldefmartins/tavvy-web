/**
 * Settings Screen
 * App settings and preferences
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { 
  FiArrowLeft, FiUser, FiLock, FiBell, FiGlobe, FiMoon, FiSun, 
  FiHelpCircle, FiFileText, FiShield, FiMail, FiChevronRight, 
  FiLogOut, FiTrash2, FiMonitor
} from 'react-icons/fi';

type ThemeMode = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useThemeContext();
  const { user, signOut } = useAuth();

  const [showThemeOptions, setShowThemeOptions] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/app');
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      alert('Account deletion request submitted. You will receive a confirmation email.');
    }
  };

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <FiSun size={18} /> },
    { value: 'dark', label: 'Dark', icon: <FiMoon size={18} /> },
    { value: 'system', label: 'System', icon: <FiMonitor size={18} /> },
  ];

  return (
    <>
      <Head>
        <title>Settings | TavvY</title>
        <meta name="description" content="TavvY app settings" />
      </Head>

      <AppLayout hideTabBar requiredAccess="authenticated">
        <div className="settings-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="settings-header">
            <button className="back-button" onClick={() => router.back()}>
              <FiArrowLeft size={24} color={theme.text} />
            </button>
            <h1 style={{ color: theme.text }}>Settings</h1>
            <div style={{ width: 40 }} />
          </header>

          {/* Account Section */}
          {user && (
            <section className="settings-section">
              <h2 style={{ color: theme.textSecondary }}>Account</h2>
              <div className="settings-group" style={{ backgroundColor: theme.cardBackground }}>
                <Link href="/app/profile/edit" className="settings-item">
                  <div className="item-left">
                    <FiUser size={20} color={theme.primary} />
                    <span style={{ color: theme.text }}>Edit Profile</span>
                  </div>
                  <FiChevronRight size={20} color={theme.textTertiary} />
                </Link>
                <Link href="/app/settings/password" className="settings-item">
                  <div className="item-left">
                    <FiLock size={20} color={theme.primary} />
                    <span style={{ color: theme.text }}>Change Password</span>
                  </div>
                  <FiChevronRight size={20} color={theme.textTertiary} />
                </Link>
                <Link href="/app/settings/notifications" className="settings-item">
                  <div className="item-left">
                    <FiBell size={20} color={theme.primary} />
                    <span style={{ color: theme.text }}>Notifications</span>
                  </div>
                  <FiChevronRight size={20} color={theme.textTertiary} />
                </Link>
              </div>
            </section>
          )}

          {/* Preferences Section */}
          <section className="settings-section">
            <h2 style={{ color: theme.textSecondary }}>Preferences</h2>
            <div className="settings-group" style={{ backgroundColor: theme.cardBackground }}>
              <button 
                className="settings-item"
                onClick={() => setShowThemeOptions(!showThemeOptions)}
              >
                <div className="item-left">
                  {themeMode === 'dark' ? (
                    <FiMoon size={20} color={theme.primary} />
                  ) : themeMode === 'light' ? (
                    <FiSun size={20} color={theme.primary} />
                  ) : (
                    <FiMonitor size={20} color={theme.primary} />
                  )}
                  <span style={{ color: theme.text }}>Appearance</span>
                </div>
                <span style={{ color: theme.textSecondary }}>
                  {themeOptions.find(t => t.value === themeMode)?.label}
                </span>
              </button>
              
              {showThemeOptions && (
                <div className="theme-options">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`theme-option ${themeMode === option.value ? 'active' : ''}`}
                      onClick={() => {
                        setThemeMode(option.value);
                        setShowThemeOptions(false);
                      }}
                      style={{
                        backgroundColor: themeMode === option.value ? theme.primary : theme.surface,
                        color: themeMode === option.value ? 'white' : theme.text,
                      }}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <Link href="/app/settings/language" className="settings-item">
                <div className="item-left">
                  <FiGlobe size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Language</span>
                </div>
                <span style={{ color: theme.textSecondary }}>English</span>
              </Link>
            </div>
          </section>

          {/* Support Section */}
          <section className="settings-section">
            <h2 style={{ color: theme.textSecondary }}>Support</h2>
            <div className="settings-group" style={{ backgroundColor: theme.cardBackground }}>
              <Link href="/app/help" className="settings-item">
                <div className="item-left">
                  <FiHelpCircle size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Help Center</span>
                </div>
                <FiChevronRight size={20} color={theme.textTertiary} />
              </Link>
              <a href="mailto:support@tavvy.com" className="settings-item">
                <div className="item-left">
                  <FiMail size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Contact Us</span>
                </div>
                <FiChevronRight size={20} color={theme.textTertiary} />
              </a>
            </div>
          </section>

          {/* Legal Section */}
          <section className="settings-section">
            <h2 style={{ color: theme.textSecondary }}>Legal</h2>
            <div className="settings-group" style={{ backgroundColor: theme.cardBackground }}>
              <Link href="/terms" className="settings-item">
                <div className="item-left">
                  <FiFileText size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Terms of Service</span>
                </div>
                <FiChevronRight size={20} color={theme.textTertiary} />
              </Link>
              <Link href="/privacy" className="settings-item">
                <div className="item-left">
                  <FiShield size={20} color={theme.primary} />
                  <span style={{ color: theme.text }}>Privacy Policy</span>
                </div>
                <FiChevronRight size={20} color={theme.textTertiary} />
              </Link>
            </div>
          </section>

          {/* Account Actions */}
          {user && (
            <section className="settings-section">
              <div className="settings-group" style={{ backgroundColor: theme.cardBackground }}>
                <button className="settings-item danger" onClick={handleSignOut}>
                  <div className="item-left">
                    <FiLogOut size={20} color="#EF4444" />
                    <span style={{ color: '#EF4444' }}>Sign Out</span>
                  </div>
                </button>
                <button className="settings-item danger" onClick={handleDeleteAccount}>
                  <div className="item-left">
                    <FiTrash2 size={20} color="#EF4444" />
                    <span style={{ color: '#EF4444' }}>Delete Account</span>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Version Info */}
          <div className="version-info">
            <p style={{ color: theme.textTertiary }}>TavvY Web App v1.0.0</p>
          </div>
        </div>

        <style jsx>{`
          .settings-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .back-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: none;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .settings-header h1 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
          }
          
          .settings-section {
            padding: 0 ${spacing.lg}px;
            margin-bottom: ${spacing.lg}px;
          }
          
          .settings-section h2 {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0 0 ${spacing.sm}px ${spacing.sm}px;
          }
          
          .settings-group {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
          }
          
          .settings-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: ${spacing.md}px ${spacing.lg}px;
            background: none;
            border: none;
            border-bottom: 1px solid ${theme.border};
            cursor: pointer;
            text-decoration: none;
          }
          
          .settings-item:last-child {
            border-bottom: none;
          }
          
          .item-left {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
          }
          
          .item-left span {
            font-size: 16px;
          }
          
          .theme-options {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.sm}px ${spacing.lg}px ${spacing.md}px;
            border-bottom: 1px solid ${theme.border};
          }
          
          .theme-option {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.sm}px;
            border-radius: ${borderRadius.md}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          }
          
          .version-info {
            text-align: center;
            padding: ${spacing.xl}px;
          }
          
          .version-info p {
            font-size: 12px;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
