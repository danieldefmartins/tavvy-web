/**
 * Rides Screen
 * Transportation and ride services
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiMapPin, FiNavigation, FiClock, FiDollarSign, FiExternalLink } from 'react-icons/fi';

const RIDE_SERVICES = [
  {
    id: 'uber',
    name: 'Uber',
    icon: '🚗',
    description: 'Request a ride in minutes',
    color: '#000000',
    url: 'https://www.uber.com',
  },
  {
    id: 'lyft',
    name: 'Lyft',
    icon: '🚙',
    description: 'Friendly rides, fair prices',
    color: '#FF00BF',
    url: 'https://www.lyft.com',
  },
  {
    id: 'taxi',
    name: 'Local Taxis',
    icon: '🚕',
    description: 'Traditional taxi services',
    color: '#F59E0B',
    url: null,
  },
  {
    id: 'rental',
    name: 'Car Rentals',
    icon: '🚐',
    description: 'Rent a car for your trip',
    color: '#3B82F6',
    url: null,
  },
  {
    id: 'bike',
    name: 'Bike Share',
    icon: '🚲',
    description: 'Eco-friendly city bikes',
    color: '#10B981',
    url: null,
  },
  {
    id: 'scooter',
    name: 'Scooters',
    icon: '🛴',
    description: 'Electric scooter rentals',
    color: '#8B5CF6',
    url: null,
  },
];

const QUICK_TIPS = [
  {
    icon: '💡',
    title: 'Compare Prices',
    description: 'Check multiple apps for the best rates',
  },
  {
    icon: '⏰',
    title: 'Avoid Surge',
    description: 'Prices spike during peak hours',
  },
  {
    icon: '📍',
    title: 'Set Pickup',
    description: 'Choose a safe, easy-to-find spot',
  },
  {
    icon: '⭐',
    title: 'Rate Drivers',
    description: 'Help the community with honest reviews',
  },
];

export default function RidesScreen() {
  const { theme } = useThemeContext();

  return (
    <>
      <Head>
        <title>Rides | TavvY</title>
        <meta name="description" content="Find transportation options on TavvY" />
      </Head>

      <AppLayout>
        <div className="rides-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="rides-header" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            <h1>🚗 Rides</h1>
            <p>Get where you need to go</p>
          </header>

          {/* Quick Actions */}
          <section className="quick-actions">
            <div className="action-card" style={{ backgroundColor: theme.cardBackground }}>
              <div className="action-icon" style={{ backgroundColor: theme.primary }}>
                <FiNavigation size={24} color="white" />
              </div>
              <div className="action-content">
                <h3 style={{ color: theme.text }}>Get a Ride</h3>
                <p style={{ color: theme.textSecondary }}>Find rides near you</p>
              </div>
            </div>
            <div className="action-card" style={{ backgroundColor: theme.cardBackground }}>
              <div className="action-icon" style={{ backgroundColor: '#10B981' }}>
                <FiClock size={24} color="white" />
              </div>
              <div className="action-content">
                <h3 style={{ color: theme.text }}>Schedule</h3>
                <p style={{ color: theme.textSecondary }}>Book ahead of time</p>
              </div>
            </div>
          </section>

          {/* Ride Services */}
          <section className="services-section">
            <h2 style={{ color: theme.text }}>Transportation Options</h2>
            <div className="services-grid">
              {RIDE_SERVICES.map((service) => (
                <a
                  key={service.id}
                  href={service.url || '#'}
                  target={service.url ? '_blank' : undefined}
                  rel={service.url ? 'noopener noreferrer' : undefined}
                  className="service-card"
                  style={{ backgroundColor: theme.cardBackground }}
                >
                  <div 
                    className="service-icon"
                    style={{ backgroundColor: `${service.color}20` }}
                  >
                    <span>{service.icon}</span>
                  </div>
                  <div className="service-info">
                    <h3 style={{ color: theme.text }}>{service.name}</h3>
                    <p style={{ color: theme.textSecondary }}>{service.description}</p>
                  </div>
                  {service.url && (
                    <FiExternalLink size={16} color={theme.textTertiary} />
                  )}
                </a>
              ))}
            </div>
          </section>

          {/* Quick Tips */}
          <section className="tips-section">
            <h2 style={{ color: theme.text }}>Quick Tips</h2>
            <div className="tips-grid">
              {QUICK_TIPS.map((tip, index) => (
                <div 
                  key={index}
                  className="tip-card"
                  style={{ backgroundColor: theme.surface }}
                >
                  <span className="tip-icon">{tip.icon}</span>
                  <h4 style={{ color: theme.text }}>{tip.title}</h4>
                  <p style={{ color: theme.textSecondary }}>{tip.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Safety Notice */}
          <section className="safety-section">
            <div className="safety-card" style={{ backgroundColor: theme.surface }}>
              <span>🛡️</span>
              <div>
                <h3 style={{ color: theme.text }}>Safety First</h3>
                <p style={{ color: theme.textSecondary }}>
                  Always verify your driver and vehicle before getting in. Share your trip details with friends or family.
                </p>
              </div>
            </div>
          </section>
        </div>

        <style jsx>{`
          .rides-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .rides-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .rides-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .rides-header p {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            margin: 0;
          }
          
          .quick-actions {
            display: flex;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            margin-top: -${spacing.xl}px;
          }
          
          .action-card {
            flex: 1;
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .action-icon {
            width: 48px;
            height: 48px;
            border-radius: ${borderRadius.md}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .action-content h3 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .action-content p {
            font-size: 12px;
            margin: 0;
          }
          
          .services-section {
            padding: ${spacing.lg}px;
          }
          
          .services-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .services-grid {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
          }
          
          .service-card {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .service-card:hover {
            transform: translateX(4px);
          }
          
          .service-icon {
            width: 48px;
            height: 48px;
            border-radius: ${borderRadius.md}px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .service-icon span {
            font-size: 24px;
          }
          
          .service-info {
            flex: 1;
          }
          
          .service-info h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 2px;
          }
          
          .service-info p {
            font-size: 13px;
            margin: 0;
          }
          
          .tips-section {
            padding: ${spacing.lg}px;
          }
          
          .tips-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .tips-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: ${spacing.sm}px;
          }
          
          .tip-card {
            padding: ${spacing.md}px;
            border-radius: ${borderRadius.lg}px;
            text-align: center;
          }
          
          .tip-icon {
            font-size: 24px;
            display: block;
            margin-bottom: ${spacing.sm}px;
          }
          
          .tip-card h4 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .tip-card p {
            font-size: 12px;
            margin: 0;
          }
          
          .safety-section {
            padding: ${spacing.lg}px;
          }
          
          .safety-card {
            display: flex;
            gap: ${spacing.md}px;
            padding: ${spacing.lg}px;
            border-radius: ${borderRadius.lg}px;
          }
          
          .safety-card span {
            font-size: 32px;
          }
          
          .safety-card h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 4px;
          }
          
          .safety-card p {
            font-size: 13px;
            line-height: 1.5;
            margin: 0;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
