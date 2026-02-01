/**
 * Settings Screen - Redesigned
 * Clean, organized settings with better visual hierarchy
 * Following Tavvy V2 design system
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { 
  FiArrowLeft, FiGlobe, FiMoon, FiBell, FiMail, FiMapPin, 
  FiTrendingUp, FiMap, FiHelpCircle, FiFileText, FiShield,
  FiChevronRight
} from 'react-icons/fi';
import { IoLanguage, IoRadio } from 'react-icons/io5';

export default function SettingsScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { user } = useAuth();

  const isDark = themeMode === 'dark';

  // Settings state
  const [darkMode, setDarkMode] = useState(isDark);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [liveBusinessAlerts, setLiveBusinessAlerts] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [shareUsageData, setShareUsageData] = useState(false);

  const handleDarkModeToggle = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    setThemeMode(newValue ? 'dark' : 'light');
  };

  return (
    <>
      <Head>
        <title>Settings | TavvY</title>
        <meta name="description" content="TavvY app settings" />
      </Head>

      <AppLayout hideTabBar>
        <div className="settings-screen">
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <FiArrowLeft size={24} />
            </button>
            <h1>Settings</h1>
            <div style={{ width: 24 }} />
          </header>

          <div className="content">
            {/* Language Section */}
            <section className="section">
              <h2 className="section-label">LANGUAGE</h2>
              <Link href="/app/settings/language" className="setting-row clickable">
                <div className="row-left">
                  <div className="icon-container blue">
                    <IoLanguage size={20} />
                  </div>
                  <span className="row-title">Language</span>
                </div>
                <div className="row-right">
                  <span className="row-value">🇺🇸 English</span>
                  <FiChevronRight size={20} className="chevron" />
                </div>
              </Link>
            </section>

            {/* Theme Section */}
            <section className="section">
              <h2 className="section-label">THEME</h2>
              <div className="setting-row">
                <div className="row-left">
                  <div className="icon-container purple">
                    <FiMoon size={20} />
                  </div>
                  <span className="row-title">Dark Mode</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={handleDarkModeToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </section>

            {/* Reviews Section */}
            <section className="section">
              <h2 className="section-label">REVIEWS</h2>
              <div className="setting-row">
                <div className="row-left">
                  <div className="icon-container blue">
                    <IoLanguage size={20} />
                  </div>
                  <span className="row-title">Auto-translate reviews</span>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={autoTranslate}
                    onChange={(e) => setAutoTranslate(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </section>

            {/* Notifications Section */}
            <section className="section">
              <h2 className="section-label">NOTIFICATIONS</h2>
              <div className="settings-group">
                <div className="setting-row">
                  <div className="row-left">
                    <div className="icon-container blue">
                      <FiBell size={20} />
                    </div>
                    <span className="row-title">Push Notifications</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={pushNotifications}
                      onChange={(e) => setPushNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="divider" />

                <div className="setting-row">
                  <div className="row-left">
                    <div className="icon-container blue">
                      <FiMail size={20} />
                    </div>
                    <span className="row-title">Email Notifications</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="divider" />

                <div className="setting-row">
                  <div className="row-left">
                    <div className="icon-container blue">
                      <IoRadio size={20} />
                    </div>
                    <span className="row-title">Live Business Alerts</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={liveBusinessAlerts}
                      onChange={(e) => setLiveBusinessAlerts(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>

            {/* Privacy & Security Section */}
            <section className="section">
              <h2 className="section-label">PRIVACY & SECURITY</h2>
              <div className="settings-group">
                <div className="setting-row">
                  <div className="row-left">
                    <div className="icon-container blue">
                      <FiMapPin size={20} />
                    </div>
                    <span className="row-title">Location Sharing</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={locationSharing}
                      onChange={(e) => setLocationSharing(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="divider" />

                <div className="setting-row">
                  <div className="row-left">
                    <div className="icon-container blue">
                      <FiTrendingUp size={20} />
                    </div>
                    <span className="row-title">Share Usage Data</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={shareUsageData}
                      onChange={(e) => setShareUsageData(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>

            {/* Preferences Section */}
            <section className="section">
              <h2 className="section-label">PREFERENCES</h2>
              <div className="settings-group">
                <Link href="/app/settings/distance-unit" className="setting-row clickable">
                  <div className="row-left">
                    <div className="icon-container purple">
                      <FiMap size={20} />
                    </div>
                    <span className="row-title">Distance Unit</span>
                  </div>
                  <div className="row-right">
                    <span className="row-value">Miles</span>
                    <FiChevronRight size={20} className="chevron" />
                  </div>
                </Link>

                <div className="divider" />

                <Link href="/app/settings/map-layer" className="setting-row clickable">
                  <div className="row-left">
                    <div className="icon-container purple">
                      <FiMap size={20} />
                    </div>
                    <span className="row-title">Default Map Layer</span>
                  </div>
                  <div className="row-right">
                    <span className="row-value">Standard</span>
                    <FiChevronRight size={20} className="chevron" />
                  </div>
                </Link>
              </div>
            </section>

            {/* Help & Support Section */}
            <section className="section">
              <h2 className="section-label">HELP & SUPPORT</h2>
              <div className="settings-group">
                <Link href="/app/support" className="setting-row clickable">
                  <div className="row-left">
                    <div className="icon-container orange">
                      <FiHelpCircle size={20} />
                    </div>
                    <span className="row-title">Contact Support</span>
                  </div>
                  <FiChevronRight size={20} className="chevron" />
                </Link>

                <div className="divider" />

                <Link href="/app/guidelines" className="setting-row clickable">
                  <div className="row-left">
                    <div className="icon-container green">
                      <FiFileText size={20} />
                    </div>
                    <span className="row-title">Community Guidelines</span>
                  </div>
                  <FiChevronRight size={20} className="chevron" />
                </Link>

                <div className="divider" />

                <Link href="/app/privacy" className="setting-row clickable">
                  <div className="row-left">
                    <div className="icon-container blue">
                      <FiShield size={20} />
                    </div>
                    <span className="row-title">Privacy Policy</span>
                  </div>
                  <FiChevronRight size={20} className="chevron" />
                </Link>
              </div>
            </section>

            {/* App Info */}
            <div className="app-info">
              <p className="version">Version 2.0.1</p>
              <p className="tagline">Discover places through real experiences</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .settings-screen {
            min-height: 100vh;
            background-color: ${isDark ? '#000000' : '#FFFFFF'};
            padding-bottom: 100px;
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
            border-bottom: 1px solid ${isDark ? '#1A1A1A' : '#F0F0F0'};
          }

          .back-btn {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header h1 {
            font-size: 18px;
            font-weight: 600;
            color: ${isDark ? '#FFFFFF' : '#000000'};
            margin: 0;
          }

          /* Content */
          .content {
            padding: 0 20px;
          }

          /* Section */
          .section {
            margin-top: 32px;
          }

          .section-label {
            font-size: 13px;
            font-weight: 600;
            color: ${isDark ? '#666666' : '#999999'};
            letter-spacing: 0.5px;
            margin: 0 0 12px 0;
          }

          /* Settings Group (for multiple rows) */
          .settings-group {
            background-color: ${isDark ? '#1A1A1A' : '#F8F8F8'};
            border-radius: 16px;
            overflow: hidden;
          }

          /* Setting Row */
          .setting-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            background-color: ${isDark ? '#1A1A1A' : '#F8F8F8'};
            text-decoration: none;
            transition: background-color 0.2s;
          }

          .setting-row.clickable {
            cursor: pointer;
          }

          .setting-row.clickable:hover {
            background-color: ${isDark ? '#222222' : '#F0F0F0'};
          }

          /* Single row (not in group) */
          .section > .setting-row {
            border-radius: 16px;
          }

          .row-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .icon-container {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
          }

          .icon-container.blue {
            background-color: #3B82F6;
          }

          .icon-container.purple {
            background-color: #8B5CF6;
          }

          .icon-container.green {
            background-color: #10B981;
          }

          .icon-container.orange {
            background-color: #F97316;
          }

          .row-title {
            font-size: 16px;
            font-weight: 500;
            color: ${isDark ? '#FFFFFF' : '#000000'};
          }

          .row-right {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .row-value {
            font-size: 15px;
            color: ${isDark ? '#999999' : '#666666'};
          }

          .chevron {
            color: ${isDark ? '#666666' : '#CCCCCC'};
          }

          /* Divider */
          .divider {
            height: 1px;
            background-color: ${isDark ? '#2A2A2A' : '#EEEEEE'};
            margin: 0 16px;
          }

          /* Toggle Switch */
          .toggle {
            position: relative;
            display: inline-block;
            width: 51px;
            height: 31px;
          }

          .toggle input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${isDark ? '#3A3A3A' : '#CCCCCC'};
            transition: 0.3s;
            border-radius: 31px;
          }

          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 27px;
            width: 27px;
            left: 2px;
            bottom: 2px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
          }

          .toggle input:checked + .toggle-slider {
            background-color: #3B82F6;
          }

          .toggle input:checked + .toggle-slider:before {
            transform: translateX(20px);
          }

          /* App Info */
          .app-info {
            text-align: center;
            margin-top: 48px;
            padding: 0 20px;
          }

          .version {
            font-size: 13px;
            color: ${isDark ? '#666666' : '#999999'};
            margin: 0 0 4px 0;
          }

          .tagline {
            font-size: 13px;
            color: ${isDark ? '#666666' : '#999999'};
            margin: 0;
          }

          /* Responsive */
          @media (min-width: 768px) {
            .settings-screen {
              max-width: 600px;
              margin: 0 auto;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
