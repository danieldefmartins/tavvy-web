/**
 * Smart Match Question 1
 * What are you looking to do?
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../../components/AppLayout';
import { FiX, FiArrowRight, FiHome, FiDollarSign, FiKey, FiTrendingUp, FiHelpCircle } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const options = [
  { id: 'buy', label: 'Buy a home', icon: FiHome, color: '#3B82F6' },
  { id: 'sell', label: 'Sell my home', icon: FiDollarSign, color: '#10B981' },
  { id: 'rent', label: 'Rent a property', icon: FiKey, color: '#F59E0B' },
  { id: 'invest', label: 'Investment property', icon: FiTrendingUp, color: '#8B5CF6' },
  { id: 'other', label: 'Something else', icon: FiHelpCircle, color: '#6B7280' },
];

export default function MatchQ1Screen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (selected) {
      sessionStorage.setItem('match_goal', selected);
      router.push('/app/realtors/match/q2', undefined, { locale });
    }
  };

  const handleClose = () => {
    router.push('/app/realtors', undefined, { locale });
  };

  return (
    <>
      <Head>
        <title>Smart Match - Step 1 | TavvY</title>
      </Head>

      <AppLayout hideNav>
        <div className="question-screen">
          <div className="header">
            <button className="close-button" onClick={handleClose}>
              <FiX size={24} />
            </button>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '8%' }} />
            </div>
            <span className="step-indicator">1 of 12</span>
          </div>

          <div className="content">
            <h1>What are you looking to do?</h1>
            <p className="subtitle">Select the option that best describes your goal.</p>

            <div className="options-container">
              {options.map((option) => (
                <button
                  key={option.id}
                  className={`option-card ${selected === option.id ? 'selected' : ''}`}
                  onClick={() => setSelected(option.id)}
                >
                  <div className="option-icon" style={{ backgroundColor: `${option.color}20`, color: option.color }}>
                    <option.icon size={24} />
                  </div>
                  <span className="option-label">{option.label}</span>
                  <div className={`option-check ${selected === option.id ? 'checked' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="bottom-container">
            <button 
              className={`next-button ${selected ? 'active' : ''}`}
              onClick={handleNext}
              disabled={!selected}
            >
              Continue
              <FiArrowRight size={20} />
            </button>
          </div>
        </div>

        <style jsx>{`
          .question-screen {
            min-height: 100vh;
            background: #0A0A0F;
            display: flex;
            flex-direction: column;
            padding: 20px;
          }
          
          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-top: 40px;
            margin-bottom: 40px;
          }
          
          .close-button {
            width: 40px;
            height: 40px;
            border-radius: 20px;
            background: #1A1A24;
            border: none;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          }
          
          .progress-bar {
            flex: 1;
            height: 4px;
            background: #1A1A24;
            border-radius: 2px;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            background: #3B82F6;
            border-radius: 2px;
          }
          
          .step-indicator {
            font-size: 14px;
            color: #6B7280;
            white-space: nowrap;
          }
          
          .content {
            flex: 1;
          }
          
          h1 {
            font-size: 28px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 8px;
          }
          
          .subtitle {
            font-size: 16px;
            color: #6B7280;
            margin: 0 0 32px;
          }
          
          .options-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .option-card {
            display: flex;
            align-items: center;
            gap: 16px;
            background: #1A1A24;
            padding: 18px;
            border-radius: 12px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
          }
          
          .option-card:hover {
            background: #252532;
          }
          
          .option-card.selected {
            border-color: #3B82F6;
            background: rgba(59, 130, 246, 0.1);
          }
          
          .option-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .option-label {
            flex: 1;
            font-size: 16px;
            font-weight: 500;
            color: #FFFFFF;
          }
          
          .option-check {
            width: 24px;
            height: 24px;
            border-radius: 12px;
            border: 2px solid #3B3B4F;
          }
          
          .option-check.checked {
            background: #3B82F6;
            border-color: #3B82F6;
          }
          
          .bottom-container {
            padding: 20px 0 40px;
          }
          
          .next-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #3B3B4F;
            color: #6B7280;
            font-size: 18px;
            font-weight: 700;
            padding: 18px;
            border: none;
            border-radius: 16px;
            cursor: not-allowed;
          }
          
          .next-button.active {
            background: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%);
            color: #FFFFFF;
            cursor: pointer;
          }
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
