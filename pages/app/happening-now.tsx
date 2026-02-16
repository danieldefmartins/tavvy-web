/**
 * Happening Now Screen
 * Live events and activities happening nearby
 * Fetches real events from Ticketmaster, PredictHQ, and Tavvy community
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiMapPin, FiClock, FiCalendar, FiZap, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { getHappeningNowEvents, TavvyEvent } from '../../lib/eventsService';

const EVENT_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎉' },
  { id: 'concerts', name: 'Concerts', icon: '🎵' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'festivals', name: 'Festivals', icon: '🎪' },
  { id: 'arts', name: 'Arts', icon: '🎨' },
  { id: 'other', name: 'Other', icon: '✨' },
];

const TIME_FILTERS = [
  { id: 'all', name: 'All Time' },
  { id: 'tonight', name: 'Tonight' },
  { id: 'weekend', name: 'This Weekend' },
  { id: 'week', name: 'This Week' },
];

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop';

export default function HappeningNowScreen() {
  const { theme } = useThemeContext();
  const [events, setEvents] = useState<TavvyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationError('Location access denied. Using default location.');
          // Default to Orlando, FL
          setUserLocation({ lat: 28.5383, lng: -81.3792 });
        }
      );
    } else {
      setLocationError('Geolocation not supported. Using default location.');
      setUserLocation({ lat: 28.5383, lng: -81.3792 });
    }
  }, []);

  // Fetch events when location is available
  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (!userLocation) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const fetchedEvents = await getHappeningNowEvents({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusMiles: 50,
        timeFilter: selectedTime === 'all' ? undefined : selectedTime as any,
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, selectedTime]);

  useEffect(() => {
    if (userLocation) {
      fetchEvents();
    }
  }, [userLocation, selectedTime, fetchEvents]);

  // Filter events by category
  const filteredEvents = events.filter(event => 
    selectedCategory === 'all' || event.category === selectedCategory
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ticketmaster':
        return { text: 'TM', color: '#026CDF' };
      case 'predicthq':
        return { text: 'PHQ', color: '#FF6B35' };
      case 'tavvy':
        return { text: 'Tavvy', color: '#0F8A8A' };
      default:
        return { text: source, color: '#666' };
    }
  };

  const formatPrice = (event: TavvyEvent) => {
    if (event.price_min === 0 || event.price_min === undefined) return 'Free';
    if (event.price_max && event.price_max !== event.price_min) {
      return `$${event.price_min} - $${event.price_max}`;
    }
    return `From $${event.price_min}`;
  };

  const handleEventClick = (event: TavvyEvent) => {
    if (event.url) {
      window.open(event.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <Head>
        <title>Happening Now | TavvY</title>
        <meta name="description" content="Discover events happening right now near you" />
      </Head>

      <AppLayout>
        <div className="happening-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="happening-header" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>
            <div className="header-content">
              <div className="header-badge">
                <FiZap size={16} /> LIVE
              </div>
              <h1>🎉 Happening Now</h1>
              <p>Real events from Ticketmaster, PredictHQ & more</p>
            </div>
            <button 
              className="refresh-btn"
              onClick={() => fetchEvents(true)}
              disabled={refreshing}
            >
              <FiRefreshCw size={20} className={refreshing ? 'spinning' : ''} />
            </button>
          </header>

          {locationError && (
            <div className="location-notice" style={{ backgroundColor: theme.surface }}>
              <FiMapPin size={14} />
              <span style={{ color: theme.textSecondary }}>{locationError}</span>
            </div>
          )}

          {/* Time Filter Pills */}
          <div className="time-filters">
            {TIME_FILTERS.map((filter) => (
              <button
                key={filter.id}
                className={`time-pill ${selectedTime === filter.id ? 'active' : ''}`}
                onClick={() => setSelectedTime(filter.id)}
                style={{
                  backgroundColor: selectedTime === filter.id ? theme.primary : 'transparent',
                  color: selectedTime === filter.id ? 'white' : theme.text,
                  borderColor: selectedTime === filter.id ? theme.primary : theme.border,
                }}
              >
                {filter.name}
              </button>
            ))}
          </div>

          {/* Category Pills */}
          <div className="categories-scroll">
            {EVENT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  backgroundColor: selectedCategory === cat.id ? theme.primary : theme.surface,
                  color: selectedCategory === cat.id ? 'white' : theme.text,
                }}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Events List */}
          <section className="events-section">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p style={{ color: theme.textSecondary }}>Finding events near you...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <span>🎉</span>
                <h3 style={{ color: theme.text }}>No events found</h3>
                <p style={{ color: theme.textSecondary }}>
                  {selectedCategory !== 'all' 
                    ? `No ${selectedCategory} events found. Try a different category.`
                    : 'Check back later for upcoming events in your area.'}
                </p>
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => {
                  const sourceBadge = getSourceBadge(event.source);
                  return (
                    <div
                      key={event.id}
                      className="event-card"
                      style={{ backgroundColor: theme.cardBackground }}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="card-image">
                        <img 
                          src={event.image_url || DEFAULT_EVENT_IMAGE} 
                          alt={event.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_EVENT_IMAGE;
                          }}
                        />
                        <span 
                          className="source-badge"
                          style={{ backgroundColor: sourceBadge.color }}
                        >
                          {sourceBadge.text}
                        </span>
                        {event.price_min === 0 && (
                          <span className="free-badge">FREE</span>
                        )}
                      </div>
                      <div className="card-content">
                        <div className="time-info">
                          <span className="date" style={{ color: theme.primary }}>
                            <FiCalendar size={12} /> {formatDate(event.start_time)}
                          </span>
                          <span className="time" style={{ color: theme.textSecondary }}>
                            <FiClock size={12} /> {formatTime(event.start_time)}
                          </span>
                        </div>
                        <h3 style={{ color: theme.text }}>{event.title}</h3>
                        {event.venue_name && (
                          <p className="venue" style={{ color: theme.textSecondary }}>
                            <FiMapPin size={12} /> {event.venue_name}
                          </p>
                        )}
                        <div className="card-footer">
                          <span className="price" style={{ color: theme.text }}>
                            {formatPrice(event)}
                          </span>
                          {event.url && (
                            <span className="external-link" style={{ color: theme.primary }}>
                              <FiExternalLink size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .happening-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .happening-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .header-content {
            flex: 1;
          }
          
          .refresh-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            transition: background 0.2s;
          }
          
          .refresh-btn:hover {
            background: rgba(255,255,255,0.3);
          }
          
          .refresh-btn:disabled {
            opacity: 0.6;
          }
          
          .spinning {
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
          
          .header-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(255,255,255,0.2);
            padding: 4px 10px;
            border-radius: ${borderRadius.full}px;
            color: white;
            font-size: 11px;
            font-weight: 700;
            margin-bottom: ${spacing.sm}px;
          }
          
          .happening-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .happening-header p {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            margin: 0;
          }
          
          .location-notice {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px ${spacing.lg}px;
            font-size: 13px;
          }
          
          .time-filters {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.md}px ${spacing.lg}px;
          }
          
          .time-pill {
            padding: 6px 14px;
            border-radius: ${borderRadius.full}px;
            border: 1px solid;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .categories-scroll {
            display: flex;
            gap: ${spacing.sm}px;
            padding: 0 ${spacing.lg}px ${spacing.md}px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .categories-scroll::-webkit-scrollbar {
            display: none;
          }
          
          .category-pill {
            padding: 8px 16px;
            border-radius: ${borderRadius.full}px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.2s;
          }
          
          .events-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px;
            gap: ${spacing.md}px;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${theme.surface};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          .empty-state {
            text-align: center;
            padding: 60px 20px;
          }
          
          .empty-state span {
            font-size: 48px;
            display: block;
            margin-bottom: ${spacing.md}px;
          }
          
          .empty-state h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .empty-state p {
            font-size: 14px;
            margin: 0;
          }
          
          .events-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .event-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          
          .event-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          }
          
          .card-image {
            position: relative;
            width: 100%;
            height: 180px;
          }
          
          .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .source-badge {
            position: absolute;
            top: ${spacing.sm}px;
            left: ${spacing.sm}px;
            padding: 4px 8px;
            border-radius: ${borderRadius.sm}px;
            color: white;
            font-size: 10px;
            font-weight: 700;
          }
          
          .free-badge {
            position: absolute;
            top: ${spacing.sm}px;
            right: ${spacing.sm}px;
            background: #10B981;
            padding: 4px 8px;
            border-radius: ${borderRadius.sm}px;
            color: white;
            font-size: 10px;
            font-weight: 700;
          }
          
          .card-content {
            padding: ${spacing.md}px;
          }
          
          .time-info {
            display: flex;
            gap: ${spacing.md}px;
            margin-bottom: ${spacing.sm}px;
            font-size: 12px;
          }
          
          .time-info span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .card-content h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 ${spacing.sm}px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .venue {
            font-size: 13px;
            margin: 0 0 ${spacing.sm}px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: ${spacing.sm}px;
            border-top: 1px solid ${theme.border};
          }
          
          .price {
            font-size: 14px;
            font-weight: 600;
          }
          
          .external-link {
            display: flex;
            align-items: center;
          }
          
          @media (max-width: 640px) {
            .events-grid {
              grid-template-columns: 1fr;
            }
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
