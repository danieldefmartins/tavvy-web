/**
 * Distance Unit Settings Page
 * Allows users to change between miles and kilometers
 * Following Tavvy V2 design system
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

interface DistanceUnit {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
}

const distanceUnits: DistanceUnit[] = [
  { id: 'miles', name: 'Miles', abbreviation: 'mi', description: 'Used in the US, UK, and other countries' },
  { id: 'kilometers', name: 'Kilometers', abbreviation: 'km', description: 'Used in most countries worldwide' },
];

export default function DistanceUnitSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeMode } = useThemeContext();
  const isDark = themeMode === 'dark';
  
  const [selectedUnit, setSelectedUnit] = useState('miles');

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('tavvy-distance-unit');
    if (saved) {
      setSelectedUnit(saved);
    }
  }, []);

  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    localStorage.setItem('tavvy-distance-unit', unitId);
  };

  return (
    <>
      <Head>
        <title>Distance Unit | TavvY Settings</title>
        <meta name="description" content="Change your distance unit preference" />
      </Head>

      <AppLayout>
        <div className="distance-settings">
          {/* Header */}
          <header className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <FiArrowLeft size={24} />
            </button>
            <h1>Distance Unit</h1>
            <div style={{ width: 24 }} />
          </header>

          <div className="content">
            <p className="description">
              Choose how distances are displayed throughout the app.
            </p>

            <div className="units-list">
              {distanceUnits.map((unit) => (
                <button
                  key={unit.id}
                  className={`unit-item ${selectedUnit === unit.id ? 'selected' : ''}`}
                  onClick={() => handleUnitChange(unit.id)}
                >
                  <div className="unit-info">
                    <span className="unit-name">{unit.name}</span>
                    <span className="unit-description">{unit.description}</span>
                  </div>
                  {selectedUnit === unit.id && (
                    <FiCheck size={20} className="check-icon" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <style jsx>{`
            .distance-settings {
              min-height: 100vh;
              background: ${isDark ? '#0a0a0f' : '#f5f5f7'};
              color: ${isDark ? '#ffffff' : '#1a1a2e'};
            }

            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: ${isDark ? '#0f1233' : '#ffffff'};
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
              position: sticky;
              top: 0;
              z-index: 100;
            }

            .header h1 {
              font-size: 18px;
              font-weight: 600;
              margin: 0;
            }

            .back-btn {
              background: none;
              border: none;
              color: inherit;
              cursor: pointer;
              padding: 8px;
              margin: -8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .content {
              padding: 20px;
              padding-bottom: 100px;
            }

            .description {
              font-size: 14px;
              color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
              margin-bottom: 24px;
              line-height: 1.5;
            }

            .units-list {
              display: flex;
              flex-direction: column;
              gap: 2px;
              background: ${isDark ? '#1a1a2e' : '#ffffff'};
              border-radius: 16px;
              overflow: hidden;
            }

            .unit-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              background: transparent;
              border: none;
              color: inherit;
              cursor: pointer;
              width: 100%;
              text-align: left;
              transition: background 0.2s ease;
            }

            .unit-item:hover {
              background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'};
            }

            .unit-item.selected {
              background: ${isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
            }

            .unit-info {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .unit-name {
              font-size: 16px;
              font-weight: 500;
            }

            .unit-description {
              font-size: 13px;
              color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
            }

            .check-icon {
              color: #3b82f6;
              flex-shrink: 0;
            }

            .unit-item:not(:last-child) {
              border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
