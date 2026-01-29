/**
 * Smart Match Start Screen
 * Entry point for the realtor matching questionnaire
 */

import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../../../components/AppLayout';
import { FiX, FiShield, FiClock, FiUsers, FiLock, FiArrowRight, FiZap } from 'react-icons/fi';

export default function SmartMatchStartScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/app/realtors/match/q1');
  };

  const handleClose = () => {
    router.push('/app/realtors');
  };

  const benefits = [
    { icon: FiShield, title: 'Spam-free matching', desc: 'No unwanted calls or emails', color: '#10B981' },
    { icon: FiClock, title: 'Takes less than 2 minutes', desc: 'Quick and easy process', color: '#3B82F6' },
    { icon: FiUsers, title: 'Connect with top realtors', desc: 'Up to 5 matched professionals', color: '#C9A227' },
    { icon: FiLock, title: "You're in control", desc: 'Choose who contacts you', color: '#EF4444' },
  ];

  return (
    <>
      <Head>
        <title>Smart Match | TavvY Realtors</title>
        <meta name="description" content="Find your perfect realtor with Smart Match" />
      </Head>

      <AppLayout hideNav>
        <div className="match-start-screen">
          {/* Close Button */}
          <button className="close-button" onClick={handleClose}>
            <FiX size={24} />
          </button>

          {/* Content */}
          <div className="content">
            {/* Icon */}
            <div className="icon-container">
              <FiZap size={48} color="#C9A227" />
            </div>

            {/* Title */}
            <h1>Smart Match</h1>
            <p className="subtitle">
              Answer a few quick questions and we'll match you with the perfect real estate professional for your needs.
            </p>

            {/* Benefits */}
            <div className="benefits-container">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-row">
                  <div className="benefit-icon" style={{ color: benefit.color }}>
                    <benefit.icon size={20} />
                  </div>
                  <div className="benefit-text">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="bottom-container">
            <button className="start-button" onClick={handleStart}>
              Get Started
              <FiArrowRight size={20} />
            </button>
            <p className="privacy-text">
              Your information is secure and never shared without your permission.
            </p>
          </div>
        </div>

        <style jsx>{`
          .match-start-screen {
            min-height: 100vh;
            background: linear-gradient(180deg, #0A0A0F 0%, #0F1520 50%, #1A2535 100%);
            display: flex;
            flex-direction: column;
            padding: 20px;
          }
          
          .close-button {
            position: absolute;
            top: 60px;
            right: 20px;
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
            z-index: 10;
          }
          
          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 100px;
          }
          
          .icon-container {
            width: 100px;
            height: 100px;
            border-radius: 50px;
            background: linear-gradient(135deg, #1E3A5F 0%, #2D4A6F 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 32px;
          }
          
          h1 {
            font-size: 36px;
            font-weight: 700;
            color: #FFFFFF;
            margin: 0 0 12px;
            text-align: center;
          }
          
          .subtitle {
            font-size: 16px;
            color: #9CA3AF;
            text-align: center;
            line-height: 1.5;
            margin: 0 0 40px;
            max-width: 400px;
          }
          
          .benefits-container {
            width: 100%;
            max-width: 400px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          
          .benefit-row {
            display: flex;
            align-items: center;
            gap: 16px;
            background: #1A1A24;
            padding: 16px;
            border-radius: 12px;
          }
          
          .benefit-icon {
            width: 44px;
            height: 44px;
            border-radius: 22px;
            background: rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .benefit-text {
            flex: 1;
          }
          
          .benefit-text h3 {
            font-size: 15px;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0 0 2px;
          }
          
          .benefit-text p {
            font-size: 13px;
            color: #6B7280;
            margin: 0;
          }
          
          .bottom-container {
            padding: 20px 0 40px;
          }
          
          .start-button {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: linear-gradient(90deg, #3B82F6 0%, #2563EB 100%);
            color: #FFFFFF;
            font-size: 18px;
            font-weight: 700;
            padding: 18px;
            border: none;
            border-radius: 16px;
            cursor: pointer;
            transition: transform 0.2s;
            margin-bottom: 16px;
          }
          
          .start-button:hover {
            transform: scale(1.02);
          }
          
          .privacy-text {
            font-size: 12px;
            color: #6B7280;
            text-align: center;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
