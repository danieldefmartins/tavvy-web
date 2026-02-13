/**
 * Smart Match Question 2 - Property Type
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../../components/AppLayout';
import { FiX, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const options = [
  { id: 'single_family', label: 'Single Family Home', emoji: '🏠' },
  { id: 'condo', label: 'Condo / Apartment', emoji: '🏢' },
  { id: 'townhouse', label: 'Townhouse', emoji: '🏘️' },
  { id: 'multi_family', label: 'Multi-Family', emoji: '🏗️' },
  { id: 'land', label: 'Land / Lot', emoji: '🌳' },
  { id: 'commercial', label: 'Commercial', emoji: '🏬' },
];

export default function MatchQ2Screen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (selected) {
      sessionStorage.setItem('match_property_type', selected);
      router.push('/app/realtors/match/contact');
    }
  };

  return (
    <>
      <Head><title>Smart Match - Step 2 | TavvY</title></Head>
      <AppLayout hideNav>
        <div className="question-screen">
          <div className="header">
            <button className="back-button" onClick={() => router.back()}><FiArrowLeft size={24} /></button>
            <div className="progress-bar"><div className="progress-fill" style={{ width: '50%' }} /></div>
            <span className="step-indicator">2 of 4</span>
          </div>

          <div className="content">
            <h1>What type of property?</h1>
            <p className="subtitle">Select the property type you're interested in.</p>
            <div className="options-grid">
              {options.map((option) => (
                <button key={option.id} className={`option-card ${selected === option.id ? 'selected' : ''}`} onClick={() => setSelected(option.id)}>
                  <span className="option-emoji">{option.emoji}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bottom-container">
            <button className={`next-button ${selected ? 'active' : ''}`} onClick={handleNext} disabled={!selected}>
              Continue <FiArrowRight size={20} />
            </button>
          </div>
        </div>

        <style jsx>{`
          .question-screen { min-height: 100vh; background: #0A0A0F; display: flex; flex-direction: column; padding: 20px; }
          .header { display: flex; align-items: center; gap: 16px; padding-top: 40px; margin-bottom: 40px; }
          .back-button { width: 40px; height: 40px; border-radius: 20px; background: #1A1A24; border: none; color: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; }
          .progress-bar { flex: 1; height: 4px; background: #1A1A24; border-radius: 2px; overflow: hidden; }
          .progress-fill { height: 100%; background: #3B82F6; border-radius: 2px; }
          .step-indicator { font-size: 14px; color: #6B7280; white-space: nowrap; }
          .content { flex: 1; }
          h1 { font-size: 28px; font-weight: 700; color: #FFFFFF; margin: 0 0 8px; }
          .subtitle { font-size: 16px; color: #6B7280; margin: 0 0 32px; }
          .options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .option-card { display: flex; flex-direction: column; align-items: center; gap: 12px; background: #1A1A24; padding: 24px 16px; border-radius: 16px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
          .option-card:hover { background: #252532; }
          .option-card.selected { border-color: #3B82F6; background: rgba(59, 130, 246, 0.1); }
          .option-emoji { font-size: 36px; }
          .option-label { font-size: 14px; font-weight: 500; color: #FFFFFF; text-align: center; }
          .bottom-container { padding: 20px 0 40px; }
          .next-button { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: #3B3B4F; color: #6B7280; font-size: 18px; font-weight: 700; padding: 18px; border: none; border-radius: 16px; cursor: not-allowed; }
          .next-button.active { background: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%); color: #FFFFFF; cursor: pointer; }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
