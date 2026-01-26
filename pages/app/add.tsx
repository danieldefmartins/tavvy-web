/**
 * Add Place Screen (Placeholder)
 * Will be implemented to match UniversalAddScreenV3 from tavvy-mobile
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import TabBar from '../../components/TabBar';
import { FiPlus, FiMapPin, FiCamera, FiArrowLeft } from 'react-icons/fi';

const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#0F172A';
const ACCENT = '#0F8A8A';

export default function AddPlacePage() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  
  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtextColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <>
      <Head>
        <title>Add Place | TavvY</title>
        <meta name="description" content="Add a new place to Tavvy" />
      </Head>

      <div className="add-screen" style={{ backgroundColor: bgColor }}>
        {/* Header */}
        <div className="header">
          <button className="back-btn" onClick={() => router.back()}>
            <FiArrowLeft size={24} color={textColor} />
          </button>
          <h1 style={{ color: textColor }}>Add a Place</h1>
          <div style={{ width: 40 }} />
        </div>

        {/* Content */}
        <div className="content">
          <div className="hero-section">
            <div className="hero-icon" style={{ backgroundColor: `${ACCENT}20` }}>
              <FiPlus size={48} color={ACCENT} />
            </div>
            <h2 style={{ color: textColor }}>Help Build Tavvy</h2>
            <p style={{ color: subtextColor }}>
              Add places you love to help others discover amazing spots in your community.
            </p>
          </div>

          <div className="options">
            <button className="option-card" style={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}>
              <div className="option-icon" style={{ backgroundColor: `${ACCENT}15` }}>
                <FiMapPin size={24} color={ACCENT} />
              </div>
              <div className="option-text">
                <h3 style={{ color: textColor }}>Add by Location</h3>
                <p style={{ color: subtextColor }}>Search or pin a place on the map</p>
              </div>
            </button>

            <button className="option-card" style={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }}>
              <div className="option-icon" style={{ backgroundColor: `${ACCENT}15` }}>
                <FiCamera size={24} color={ACCENT} />
              </div>
              <div className="option-text">
                <h3 style={{ color: textColor }}>Scan Business Card</h3>
                <p style={{ color: subtextColor }}>Quickly add from a business card</p>
              </div>
            </button>
          </div>

          <div className="coming-soon" style={{ color: subtextColor }}>
            <p>Full add functionality coming soon to web.</p>
            <p>Use the Tavvy mobile app for the best experience.</p>
          </div>
        </div>

        <TabBar />
      </div>

      <style jsx>{`
        .add-screen {
          min-height: 100vh;
          padding-bottom: 100px;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          padding-top: max(16px, env(safe-area-inset-top));
        }

        .back-btn {
          width: 40px;
          height: 40px;
          border-radius: 20px;
          border: none;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .header h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .content {
          padding: 20px;
          max-width: 500px;
          margin: 0 auto;
        }

        .hero-section {
          text-align: center;
          padding: 40px 20px;
        }

        .hero-icon {
          width: 100px;
          height: 100px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }

        .hero-section h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 12px;
        }

        .hero-section p {
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        .options {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 32px;
        }

        .option-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .option-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .option-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .option-text h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px;
        }

        .option-text p {
          font-size: 14px;
          margin: 0;
        }

        .coming-soon {
          text-align: center;
          margin-top: 48px;
          font-size: 14px;
        }

        .coming-soon p {
          margin: 4px 0;
        }
      `}</style>
    </>
  );
}
