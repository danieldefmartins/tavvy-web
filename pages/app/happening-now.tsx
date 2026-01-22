/**
 * Happening Now Screen
 * Live events and activities happening nearby
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiMapPin, FiClock, FiUsers, FiCalendar, FiZap } from 'react-icons/fi';

interface Event {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  category?: string;
  venue_name?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
  is_free?: boolean;
  price?: number;
  attendee_count?: number;
}

const EVENT_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🎉' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'food', name: 'Food & Drink', icon: '🍻' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'arts', name: 'Arts', icon: '🎨' },
  { id: 'networking', name: 'Networking', icon: '🤝' },
  { id: 'community', name: 'Community', icon: '👥' },
];

export default function HappeningNowScreen() {
  const { theme } = useThemeContext();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('end_time', now)
        .order('start_time', { ascending: true })
        .limit(50);

      if (!error) {
        setEvents(data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const isHappeningNow = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return false;
    const now = new Date();
    return new Date(startTime) <= now && new Date(endTime) >= now;
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
            <div className="header-badge">
              <FiZap size={16} /> LIVE
            </div>
            <h1>🎉 Happening Now</h1>
            <p>Events and activities near you</p>
          </header>

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
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="empty-state">
                <span>🎉</span>
                <h3 style={{ color: theme.text }}>No events happening now</h3>
                <p style={{ color: theme.textSecondary }}>
                  Check back later for upcoming events
                </p>
              </div>
            ) : (
              <div className="events-list">
                {filteredEvents.map((event) => {
                  const happeningNow = isHappeningNow(event.start_time, event.end_time);
                  return (
                    <Link
                      key={event.id}
                      href={`/app/event/${event.slug || event.id}`}
                      className="event-card"
                      style={{ backgroundColor: theme.cardBackground }}
                    >
                      <div className="card-image">
                        {event.cover_image_url ? (
                          <img src={event.cover_image_url} alt={event.title} />
                        ) : (
                          <div className="image-placeholder" style={{ backgroundColor: theme.surface }}>
                            🎉
                          </div>
                        )}
                        {happeningNow && (
                          <span className="live-badge">
                            <FiZap size={12} /> LIVE NOW
                          </span>
                        )}
                        {event.is_free && (
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
                          {event.attendee_count !== undefined && event.attendee_count > 0 && (
                            <span className="attendees" style={{ color: theme.textTertiary }}>
                              <FiUsers size={12} /> {event.attendee_count} going
                            </span>
                          )}
                          {!event.is_free && event.price !== undefined && (
                            <span className="price" style={{ color: theme.text }}>
                              ${event.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
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
          }
          
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
          
          .categories-scroll {
            display: flex;
            gap: ${spacing.sm}px;
            padding: ${spacing.lg}px;
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
          }
          
          .events-section {
            padding: 0 ${spacing.lg}px;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            padding: 60px;
          }
          
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${theme.surface};
            border-top-color: ${theme.primary};
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin { to { transform: rotate(360deg); } }
          
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
          
          .events-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .event-card {
            display: flex;
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .event-card:hover {
            transform: translateX(4px);
          }
          
          .card-image {
            position: relative;
            width: 120px;
            min-width: 120px;
            height: 120px;
          }
          
          .card-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
          }
          
          .live-badge {
            position: absolute;
            top: ${spacing.sm}px;
            left: ${spacing.sm}px;
            display: flex;
            align-items: center;
            gap: 4px;
            background: #EF4444;
            padding: 4px 8px;
            border-radius: ${borderRadius.sm}px;
            color: white;
            font-size: 10px;
            font-weight: 700;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          .free-badge {
            position: absolute;
            bottom: ${spacing.sm}px;
            left: ${spacing.sm}px;
            background: #10B981;
            padding: 2px 8px;
            border-radius: ${borderRadius.sm}px;
            color: white;
            font-size: 10px;
            font-weight: 700;
          }
          
          .card-content {
            flex: 1;
            padding: ${spacing.md}px;
            display: flex;
            flex-direction: column;
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
            margin: 0;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .card-footer {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: ${spacing.sm}px;
          }
          
          .attendees {
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .price {
            font-size: 14px;
            font-weight: 600;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
