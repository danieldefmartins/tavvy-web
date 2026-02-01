/**
 * Quick Finds Screen
 * Fast access to common place categories
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const QUICK_CATEGORIES = [
  { id: 'restaurants', name: 'Restaurants', icon: '🍽️', color: '#EF4444' },
  { id: 'coffee', name: 'Coffee', icon: '☕', color: '#92400E' },
  { id: 'bars', name: 'Bars', icon: '🍺', color: '#F59E0B' },
  { id: 'gas', name: 'Gas Stations', icon: '⛽', color: '#3B82F6' },
  { id: 'grocery', name: 'Grocery', icon: '🛒', color: '#10B981' },
  { id: 'pharmacy', name: 'Pharmacy', icon: '💊', color: '#8B5CF6' },
  { id: 'atm', name: 'ATMs', icon: '🏧', color: '#06B6D4' },
  { id: 'parking', name: 'Parking', icon: '🅿️', color: '#6366F1' },
  { id: 'hotels', name: 'Hotels', icon: '🏨', color: '#EC4899' },
  { id: 'gyms', name: 'Gyms', icon: '💪', color: '#F97316' },
  { id: 'hospitals', name: 'Hospitals', icon: '🏥', color: '#DC2626' },
  { id: 'banks', name: 'Banks', icon: '🏦', color: '#059669' },
  { id: 'laundry', name: 'Laundry', icon: '🧺', color: '#0EA5E9' },
  { id: 'post-office', name: 'Post Office', icon: '📮', color: '#7C3AED' },
  { id: 'car-wash', name: 'Car Wash', icon: '🚗', color: '#14B8A6' },
  { id: 'pet-stores', name: 'Pet Stores', icon: '🐾', color: '#F472B6' },
];

export default function QuickFindsScreen() {
  const router = useRouter();
  const { locale } = router;
  const { theme } = useThemeContext();

  return (
    <>
      <Head>
        <title>Quick Finds | TavvY</title>
        <meta name="description" content="Quickly find common places near you" />
      </Head>

      <AppLayout>
        <div className="quick-finds-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="quick-header">
            <h1 style={{ color: theme.text }}>⚡ Quick Finds</h1>
            <p style={{ color: theme.textSecondary }}>
              Find what you need, fast
            </p>
          </header>

          {/* Categories Grid */}
          <section className="categories-section">
            <div className="categories-grid">
              {QUICK_CATEGORIES.map((category) => (
                <Link
                  key={category.id}
                  href={`/app/search?category=${category.id}`}
                  className="category-card"
                  style={{ backgroundColor: theme.cardBackground }}
                >
                  <div 
                    className="category-icon"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <span>{category.icon}</span>
                  </div>
                  <span className="category-name" style={{ color: theme.text }}>
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Popular Searches */}
          <section className="popular-section">
            <h2 style={{ color: theme.text }}>Popular Searches</h2>
            <div className="popular-list">
              {[
                { query: 'Open now', icon: '🕐' },
                { query: 'Delivery', icon: '🚚' },
                { query: 'Takeout', icon: '📦' },
                { query: 'Free WiFi', icon: '📶' },
                { query: 'Pet friendly', icon: '🐕' },
                { query: '24 hours', icon: '🌙' },
              ].map((item, index) => (
                <Link
                  key={index}
                  href={`/app/search?q=${encodeURIComponent(item.query)}`}
                  className="popular-item"
                  style={{ backgroundColor: theme.surface }}
                >
                  <span>{item.icon}</span>
                  <span style={{ color: theme.text }}>{item.query}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Nearby Section */}
          <section className="nearby-section">
            <div className="nearby-card" style={{ backgroundColor: theme.primary }}>
              <div className="nearby-content">
                <h3>📍 What's Nearby?</h3>
                <p>Discover places around your current location</p>
                <Link href="/app?view=map" locale={locale} className="nearby-button">
                  Explore Map
                </Link>
              </div>
            </div>
          </section>
        </div>

        <style jsx>{`
          .quick-finds-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .quick-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
          }
          
          .quick-header h1 {
            font-size: 28px;
            font-weight: 700;
            margin: 0 0 4px;
          }
          
          .quick-header p {
            font-size: 14px;
            margin: 0;
          }
          
          .categories-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .categories-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: ${spacing.sm}px;
          }
          
          @media (max-width: 480px) {
            .categories-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          .category-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: ${spacing.md}px ${spacing.sm}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .category-card:hover {
            transform: scale(1.05);
          }
          
          .category-icon {
            width: 48px;
            height: 48px;
            border-radius: ${borderRadius.md}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .category-icon span {
            font-size: 24px;
          }
          
          .category-name {
            font-size: 12px;
            font-weight: 500;
            text-align: center;
          }
          
          .popular-section {
            padding: ${spacing.xl}px ${spacing.lg}px;
          }
          
          .popular-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .popular-list {
            display: flex;
            flex-wrap: wrap;
            gap: ${spacing.sm}px;
          }
          
          .popular-item {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            text-decoration: none;
            font-size: 14px;
          }
          
          .nearby-section {
            padding: ${spacing.lg}px;
          }
          
          .nearby-card {
            border-radius: ${borderRadius.xl}px;
            overflow: hidden;
          }
          
          .nearby-content {
            padding: ${spacing.xl}px;
            text-align: center;
          }
          
          .nearby-content h3 {
            font-size: 20px;
            font-weight: 700;
            color: white;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .nearby-content p {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            margin: 0 0 ${spacing.lg}px;
          }
          
          .nearby-button {
            display: inline-block;
            background: white;
            color: ${theme.primary};
            padding: 12px 32px;
            border-radius: ${borderRadius.md}px;
            font-weight: 600;
            text-decoration: none;
          }
        `}</style>
      </AppLayout>
    </>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
