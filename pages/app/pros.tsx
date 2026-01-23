/**
 * Pros Screen - Find Trusted Local Home Service Pros
 * Pixel-perfect port from tavvy-mobile/screens/ProsHomeScreen.tsx
 * 
 * Features:
 * - Green theme
 * - "Tavvy Pros" header with Find Pros / I'm a Pro buttons
 * - Pro signup banner
 * - Search form (service + location)
 * - Service category grid with icons
 * - Start a Project CTA
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { 
  IoSearch, IoLocationOutline, IoChevronForward, IoCheckmarkCircle,
  IoStar, IoTime, IoHome, IoWater, IoFlash, IoBrush, IoLeaf, 
  IoConstruct, IoColorPalette, IoSnow, IoHammer, IoCar
} from 'react-icons/io5';
import { FiPlus, FiChevronRight } from 'react-icons/fi';

// Green theme colors
const GREEN = '#10B981';
const GREEN_DARK = '#059669';
const GREEN_LIGHT = '#D1FAE5';

// Service categories matching mobile app
const serviceCategories = [
  { id: 'home', name: 'Home', icon: IoHome, color: '#1F2937' },
  { id: 'plumbing', name: 'Plumbing', icon: IoWater, color: '#1F2937' },
  { id: 'electrical', name: 'Electrical', icon: IoFlash, color: '#1F2937' },
  { id: 'cleaning', name: 'Cleaning', icon: IoBrush, color: '#1F2937' },
  { id: 'landscaping', name: 'Landscaping', icon: IoLeaf, color: '#1F2937' },
  { id: 'handyman', name: 'Handyman', icon: IoConstruct, color: '#1F2937' },
  { id: 'painting', name: 'Painting', icon: IoColorPalette, color: '#1F2937' },
  { id: 'hvac', name: 'HVAC', icon: IoSnow, color: '#1F2937' },
  { id: 'roofing', name: 'Roofing', icon: IoHammer, color: '#1F2937' },
  { id: 'auto', name: 'Auto', icon: IoCar, color: '#1F2937' },
];

// Trust badges
const trustBadges = [
  { icon: IoCheckmarkCircle, text: 'Verified Pros', color: GREEN },
  { icon: IoStar, text: 'Community Reviews', color: '#F59E0B' },
  { icon: IoTime, text: 'Fast Response', color: GREEN },
];

export default function ProsScreen() {
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const router = useRouter();
  
  const [serviceQuery, setServiceQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'find' | 'pro'>('find');

  const handleSearch = () => {
    if (serviceQuery.trim()) {
      router.push(`/app/pros/search?service=${encodeURIComponent(serviceQuery)}&location=${encodeURIComponent(locationQuery)}`);
    }
  };

  const bgColor = isDark ? '#0F172A' : '#F9F7F2';

  return (
    <>
      <Head>
        <title>Pros | TavvY</title>
        <meta name="description" content="Find trusted local home service pros on TavvY" />
      </Head>

      <AppLayout>
        <div className="pros-screen">
          {/* Header */}
          <header className="pros-header">
            <div className="header-content">
              <h1 className="header-title">Tavvy Pros</h1>
              <div className="header-tabs">
                <button 
                  className={`header-tab ${activeTab === 'find' ? 'active' : ''}`}
                  onClick={() => setActiveTab('find')}
                >
                  Find Pros
                </button>
                <button 
                  className={`header-tab outline ${activeTab === 'pro' ? 'active' : ''}`}
                  onClick={() => router.push('/app/pros/register')}
                >
                  I'm a Pro
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content">
            {/* Pro Signup Banner */}
            <div className="promo-banner">
              <span className="promo-icon">✨</span>
              <span className="promo-text">Are you a Pro? Save $400 · Only 487 spots left!</span>
            </div>

            {/* Hero Title */}
            <h2 className="hero-title">
              Find Trusted Local<br />
              <span className="hero-accent">Home Service Pros</span>
            </h2>
            <p className="hero-subtitle">
              Connect with verified electricians, plumbers, cleaners, and more. Get quotes in minutes, not days.
            </p>

            {/* Search Form */}
            <div className="search-form">
              <div className="search-field">
                <IoSearch size={18} className="field-icon" />
                <input
                  type="text"
                  placeholder="What service do you need? (e.g. Plumber)"
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                />
              </div>
              <div className="search-field">
                <IoLocationOutline size={18} className="field-icon" />
                <input
                  type="text"
                  placeholder="City or ZIP code"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <button className="search-btn" onClick={handleSearch}>
                Search
              </button>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              {trustBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div key={index} className="trust-badge">
                    <Icon size={16} color={badge.color} />
                    <span>{badge.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Start a Project CTA */}
            <Link href="/app/pros/new-project" className="project-cta">
              <div className="cta-left">
                <div className="cta-icon">
                  <FiPlus size={20} color="#fff" />
                </div>
                <div className="cta-text">
                  <h3>Start a Project</h3>
                  <p>Get quotes from multiple pros in minutes</p>
                </div>
              </div>
              <IoChevronForward size={24} color="#fff" />
            </Link>

            {/* Browse by Service */}
            <section className="services-section">
              <h3 className="section-title">Browse by Service</h3>
              <div className="services-grid">
                {serviceCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Link
                      key={category.id}
                      href={`/app/pros/category/${category.id}`}
                      className="service-card"
                    >
                      <div className="service-icon">
                        <Icon size={28} color={category.color} />
                      </div>
                      <span className="service-name">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* How It Works */}
            <section className="how-section">
              <h3 className="section-title">How It Works</h3>
              <div className="steps-list">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Describe Your Project</h4>
                    <p>Tell us what you need help with</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Get Matched</h4>
                    <p>We'll connect you with qualified pros</p>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Compare & Hire</h4>
                    <p>Review quotes and choose the best fit</p>
                  </div>
                </div>
              </div>
            </section>
          </main>

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .pros-screen {
            min-height: 100vh;
            background-color: ${bgColor};
          }

          /* Header */
          .pros-header {
            background: #fff;
            padding: 16px 20px;
            padding-top: max(16px, env(safe-area-inset-top));
            border-bottom: 1px solid rgba(0,0,0,0.06);
          }

          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .header-title {
            font-size: 22px;
            font-weight: 700;
            color: #111;
            margin: 0;
          }

          .header-tabs {
            display: flex;
            gap: 8px;
          }

          .header-tab {
            padding: 10px 20px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            background: ${GREEN};
            color: #fff;
          }

          .header-tab.outline {
            background: transparent;
            border: 1px solid #ddd;
            color: #666;
          }

          .header-tab:hover {
            transform: scale(1.02);
          }

          /* Main Content */
          .main-content {
            padding: 20px;
          }

          /* Promo Banner */
          .promo-banner {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: ${GREEN_LIGHT};
            padding: 8px 16px;
            border-radius: 24px;
            margin-bottom: 20px;
          }

          .promo-icon {
            font-size: 14px;
          }

          .promo-text {
            font-size: 13px;
            font-weight: 500;
            color: ${GREEN_DARK};
          }

          /* Hero */
          .hero-title {
            font-size: 28px;
            font-weight: 700;
            color: ${isDark ? '#fff' : '#111'};
            line-height: 1.2;
            margin: 0 0 12px;
          }

          .hero-accent {
            color: ${GREEN};
          }

          .hero-subtitle {
            font-size: 15px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            line-height: 1.5;
            margin: 0 0 24px;
          }

          /* Search Form */
          .search-form {
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'};
          }

          .search-field {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5'};
            border-radius: 12px;
            margin-bottom: 12px;
          }

          .field-icon {
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
          }

          .search-field input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 15px;
            color: ${isDark ? '#fff' : '#111'};
            outline: none;
          }

          .search-field input::placeholder {
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
          }

          .search-btn {
            width: 100%;
            padding: 16px;
            background: ${GREEN};
            color: #fff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .search-btn:hover {
            background: ${GREEN_DARK};
          }

          /* Trust Badges */
          .trust-badges {
            display: flex;
            justify-content: center;
            gap: 16px;
            margin-bottom: 24px;
            flex-wrap: wrap;
          }

          .trust-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
          }

          /* Project CTA */
          .project-cta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: ${GREEN};
            padding: 16px 20px;
            border-radius: 16px;
            text-decoration: none;
            margin-bottom: 32px;
          }

          .cta-left {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .cta-icon {
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .cta-text h3 {
            font-size: 17px;
            font-weight: 600;
            color: #fff;
            margin: 0 0 4px;
          }

          .cta-text p {
            font-size: 13px;
            color: rgba(255,255,255,0.85);
            margin: 0;
          }

          /* Services Section */
          .services-section {
            margin-bottom: 32px;
          }

          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 16px;
          }

          .services-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }

          .service-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px 8px;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 16px;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .service-card:hover {
            transform: scale(1.02);
          }

          .service-icon {
            width: 56px;
            height: 56px;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#f5f5f5'};
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .service-name {
            font-size: 12px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.7)' : '#666'};
            text-align: center;
          }

          /* How It Works */
          .how-section {
            margin-bottom: 32px;
          }

          .steps-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .step-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;
            padding: 16px;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#fff'};
            border-radius: 16px;
          }

          .step-number {
            width: 32px;
            height: 32px;
            background: ${GREEN};
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 700;
            flex-shrink: 0;
          }

          .step-content h4 {
            font-size: 15px;
            font-weight: 600;
            color: ${isDark ? '#fff' : '#111'};
            margin: 0 0 4px;
          }

          .step-content p {
            font-size: 13px;
            color: ${isDark ? 'rgba(255,255,255,0.6)' : '#666'};
            margin: 0;
          }

          /* Bottom Spacing */
          .bottom-spacing {
            height: 100px;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .services-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }

          @media (min-width: 768px) {
            .services-grid {
              grid-template-columns: repeat(5, 1fr);
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}
