/**
 * Signal Search — Find places by combining signal filters
 *
 * Users can select multiple signals (AND logic) to discover places
 * that match all selected criteria. Results sorted by combined signal strength.
 *
 * Signal categories:
 * - The Good (best_for): Teal #00C2CB
 * - The Vibe (vibe): Purple #8A05BE
 * - Heads Up (heads_up): Amber #F5A623
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import PlaceCard from '../../components/PlaceCard';
import { supabase } from '../../lib/supabaseClient';
import { SIGNAL_LABELS, CATEGORY_COLORS } from '../../lib/signalService';
import { SignalCategory, inferCategoryFromLabel } from '../../components/SignalPill';
import { spacing, borderRadius } from '../../constants/Colors';
import { IoSearch, IoChevronBack, IoClose } from 'react-icons/io5';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// ============================================
// CONSTANTS
// ============================================

const BG_LIGHT = '#F9F7F2';
const BG_DARK = '#000000';
const ACCENT = '#17013A';
const TEAL = '#00C2CB';

const CATEGORY_META: Record<string, { label: string; color: string; bgAlpha: string }> = {
  best_for: { label: 'The Good', color: '#00C2CB', bgAlpha: 'rgba(0, 194, 203, 0.12)' },
  vibe: { label: 'The Vibe', color: '#8A05BE', bgAlpha: 'rgba(138, 5, 190, 0.12)' },
  heads_up: { label: 'Heads Up', color: '#F5A623', bgAlpha: 'rgba(245, 166, 35, 0.12)' },
};

// ============================================
// TYPES
// ============================================

interface SignalOption {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: string;
  tap_count: number; // global popularity
}

interface PlaceResult {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state_region?: string;
  category?: string;
  photo_url?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  combined_score: number;
  matched_signals: Array<{ label: string; tap_total: number }>;
}

// ============================================
// COMPONENT
// ============================================

export default function SignalSearchScreen() {
  const { theme, isDark } = useThemeContext();
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;

  // State
  const [popularSignals, setPopularSignals] = useState<SignalOption[]>([]);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [searchText, setSearchText] = useState('');

  // Computed
  const bgColor = isDark ? BG_DARK : BG_LIGHT;
  const textColor = isDark ? '#fff' : ACCENT;

  // ============================================
  // LOAD POPULAR SIGNALS
  // ============================================

  useEffect(() => {
    loadPopularSignals();
  }, []);

  const loadPopularSignals = async () => {
    setLoadingSignals(true);
    try {
      // Get all active signals with their global tap counts
      const { data: signals, error } = await supabase
        .from('review_items')
        .select('id, slug, label, icon_emoji, signal_type')
        .eq('is_active', true)
        .in('signal_type', ['best_for', 'vibe', 'heads_up']);

      if (error) {
        console.error('[SignalSearch] Error loading signals:', error);
        return;
      }

      if (!signals || signals.length === 0) return;

      // Get tap counts per signal from place_review_signal_taps
      const { data: tapCounts, error: tapError } = await supabase
        .from('place_review_signal_taps')
        .select('signal_id');

      // Count taps per signal
      const countMap: Record<string, number> = {};
      (tapCounts || []).forEach((tap: any) => {
        countMap[tap.signal_id] = (countMap[tap.signal_id] || 0) + 1;
      });

      // Also check tap_activity for additional counts
      const { data: tapActivity } = await supabase
        .from('tap_activity')
        .select('signal_id');

      (tapActivity || []).forEach((tap: any) => {
        countMap[tap.signal_id] = (countMap[tap.signal_id] || 0) + 1;
      });

      const enriched: SignalOption[] = signals.map((s: any) => ({
        id: s.id,
        slug: s.slug,
        label: s.label,
        icon_emoji: s.icon_emoji,
        signal_type: s.signal_type,
        tap_count: countMap[s.id] || 0,
      }));

      // Sort by tap count descending so popular ones appear first
      enriched.sort((a, b) => b.tap_count - a.tap_count);

      setPopularSignals(enriched);
    } catch (err) {
      console.error('[SignalSearch] Error:', err);
    } finally {
      setLoadingSignals(false);
    }
  };

  // ============================================
  // TOGGLE SIGNAL SELECTION
  // ============================================

  const toggleSignal = useCallback((signalId: string) => {
    setSelectedSignalIds(prev => {
      if (prev.includes(signalId)) {
        return prev.filter(id => id !== signalId);
      }
      return [...prev, signalId];
    });
  }, []);

  // ============================================
  // SEARCH BY SELECTED SIGNALS
  // ============================================

  useEffect(() => {
    if (selectedSignalIds.length > 0) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [selectedSignalIds]);

  const performSearch = async () => {
    if (selectedSignalIds.length === 0) return;

    setLoading(true);
    try {
      // Step 1: Find places that have taps for ALL selected signals
      // Get all taps for the selected signals
      const { data: taps, error: tapError } = await supabase
        .from('place_review_signal_taps')
        .select('place_id, signal_id, intensity')
        .in('signal_id', selectedSignalIds);

      if (tapError) {
        console.error('[SignalSearch] Tap query error:', tapError);
        setLoading(false);
        return;
      }

      // Also check tap_activity for more data
      const { data: activityTaps } = await supabase
        .from('tap_activity')
        .select('place_id, signal_id')
        .in('signal_id', selectedSignalIds);

      // Combine both sources
      const allTaps = [
        ...(taps || []).map((t: any) => ({
          place_id: t.place_id,
          signal_id: t.signal_id,
          intensity: t.intensity || 1,
        })),
        ...(activityTaps || []).map((t: any) => ({
          place_id: t.place_id,
          signal_id: t.signal_id,
          intensity: 1,
        })),
      ];

      // Step 2: Aggregate by place_id
      // Track which signals each place has and total score
      const placeMap: Record<string, {
        signal_ids: Set<string>;
        total_score: number;
        signal_scores: Record<string, number>;
      }> = {};

      allTaps.forEach(tap => {
        if (!tap.place_id) return;
        if (!placeMap[tap.place_id]) {
          placeMap[tap.place_id] = {
            signal_ids: new Set(),
            total_score: 0,
            signal_scores: {},
          };
        }
        placeMap[tap.place_id].signal_ids.add(tap.signal_id);
        placeMap[tap.place_id].total_score += tap.intensity;
        placeMap[tap.place_id].signal_scores[tap.signal_id] =
          (placeMap[tap.place_id].signal_scores[tap.signal_id] || 0) + tap.intensity;
      });

      // Step 3: Filter to places that have ALL selected signals (AND logic)
      const matchingPlaceIds = Object.entries(placeMap)
        .filter(([_, data]) => {
          return selectedSignalIds.every(sid => data.signal_ids.has(sid));
        })
        .sort((a, b) => b[1].total_score - a[1].total_score)
        .map(([placeId]) => placeId)
        .slice(0, 50); // Limit to 50 results

      if (matchingPlaceIds.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // Step 4: Fetch place details
      const { data: places, error: placeError } = await supabase
        .from('places')
        .select('id, name, address, city, region, category, photo_url, phone, website, latitude, longitude')
        .in('id', matchingPlaceIds);

      if (placeError) {
        console.error('[SignalSearch] Place query error:', placeError);
        setLoading(false);
        return;
      }

      // Build signal label lookup
      const signalLabelMap: Record<string, string> = {};
      popularSignals.forEach(s => {
        signalLabelMap[s.id] = s.label;
      });

      // Step 5: Build results with scores
      const placeResults: PlaceResult[] = (places || []).map((place: any) => {
        const data = placeMap[place.id];
        const matched_signals = selectedSignalIds
          .filter(sid => data.signal_scores[sid])
          .map(sid => ({
            label: signalLabelMap[sid] || sid,
            tap_total: data.signal_scores[sid] || 0,
          }));

        return {
          id: place.id,
          name: place.name,
          address: place.address,
          city: place.city,
          state_region: place.region,
          category: place.category,
          photo_url: place.photo_url,
          phone: place.phone,
          website: place.website,
          latitude: place.latitude,
          longitude: place.longitude,
          combined_score: data.total_score,
          matched_signals,
        };
      });

      // Sort by combined score
      placeResults.sort((a, b) => b.combined_score - a.combined_score);
      setResults(placeResults);
    } catch (err) {
      console.error('[SignalSearch] Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // CLEAR ALL
  // ============================================

  const clearAll = () => {
    setSelectedSignalIds([]);
    setResults([]);
    setSearchText('');
  };

  // ============================================
  // FILTER SIGNALS BY SEARCH TEXT
  // ============================================

  const filteredSignals = searchText.trim()
    ? popularSignals.filter(s =>
        s.label.toLowerCase().includes(searchText.toLowerCase())
      )
    : popularSignals;

  // Group signals by category
  const signalsByCategory: Record<string, SignalOption[]> = {
    best_for: [],
    vibe: [],
    heads_up: [],
  };

  filteredSignals.forEach(signal => {
    if (signalsByCategory[signal.signal_type]) {
      signalsByCategory[signal.signal_type].push(signal);
    }
  });

  // ============================================
  // RENDER
  // ============================================

  return (
    <AppLayout>
      <Head>
        <title>{t('signalSearch.title', 'Signal Search')} — Tavvy</title>
      </Head>

      <div className="signal-search-screen">
        <div className="container">
          {/* Header */}
          <div className="header">
            <button className="back-btn" onClick={() => router.back()}>
              <IoChevronBack size={24} />
            </button>
            <h1 className="page-title">{t('signalSearch.title', 'Signal Search')}</h1>
            {selectedSignalIds.length > 0 && (
              <button className="clear-btn" onClick={clearAll}>
                {t('signalSearch.clearAll', 'Clear')}
              </button>
            )}
          </div>

          <p className="page-subtitle">
            {t('signalSearch.subtitle', 'Combine signals to find your perfect spot')}
          </p>

          {/* Search Filter */}
          <div className="search-bar">
            <IoSearch size={20} className="search-icon" />
            <input
              type="text"
              placeholder={t('signalSearch.filterPlaceholder', 'Filter signals...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
            {searchText && (
              <button
                className="input-clear-btn"
                onClick={() => setSearchText('')}
              >
                <IoClose size={18} />
              </button>
            )}
          </div>

          {/* Selected Signals Summary */}
          {selectedSignalIds.length > 0 && (
            <div className="selected-summary">
              <span className="selected-label">
                {t('signalSearch.searching', 'Searching')}:
              </span>
              <div className="selected-chips">
                {selectedSignalIds.map(sid => {
                  const signal = popularSignals.find(s => s.id === sid);
                  if (!signal) return null;
                  const meta = CATEGORY_META[signal.signal_type];
                  return (
                    <button
                      key={sid}
                      className="selected-chip"
                      style={{
                        backgroundColor: meta?.bgAlpha || 'rgba(255,255,255,0.1)',
                        borderColor: meta?.color || '#666',
                      }}
                      onClick={() => toggleSignal(sid)}
                    >
                      <span className="chip-emoji">{signal.icon_emoji}</span>
                      <span className="chip-label" style={{ color: meta?.color }}>
                        {signal.label}
                      </span>
                      <IoClose size={14} style={{ color: meta?.color, opacity: 0.6 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signal Categories */}
          {loadingSignals ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>{t('signalSearch.loadingSignals', 'Loading signals...')}</span>
            </div>
          ) : (
            <div className="signal-categories">
              {(['best_for', 'vibe', 'heads_up'] as const).map(cat => {
                const signals = signalsByCategory[cat];
                if (!signals || signals.length === 0) return null;
                const meta = CATEGORY_META[cat];

                return (
                  <section key={cat} className="signal-category-section">
                    <div className="category-header">
                      <div
                        className="category-dot"
                        style={{ backgroundColor: meta.color }}
                      />
                      <h2 className="category-title">{meta.label}</h2>
                      <span className="category-count">{signals.length}</span>
                    </div>
                    <div className="signal-chips">
                      {signals.map(signal => {
                        const isSelected = selectedSignalIds.includes(signal.id);
                        return (
                          <button
                            key={signal.id}
                            className={`signal-chip ${isSelected ? 'selected' : ''}`}
                            style={{
                              backgroundColor: isSelected
                                ? meta.bgAlpha
                                : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                              borderColor: isSelected
                                ? meta.color
                                : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                            }}
                            onClick={() => toggleSignal(signal.id)}
                          >
                            <span className="chip-emoji">{signal.icon_emoji}</span>
                            <span
                              className="chip-label"
                              style={{
                                color: isSelected ? meta.color : (isDark ? 'rgba(255,255,255,0.7)' : '#555'),
                              }}
                            >
                              {signal.label}
                            </span>
                            {signal.tap_count > 0 && (
                              <span
                                className="chip-count"
                                style={{ color: isSelected ? meta.color : undefined }}
                              >
                                x{signal.tap_count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* Results */}
          {selectedSignalIds.length > 0 && (
            <section className="results-section">
              <div className="results-header">
                <h2 className="results-title">
                  {t('signalSearch.results', 'Results')}
                </h2>
                <span className="results-count">
                  {loading ? '...' : results.length} {t('signalSearch.places', 'places')}
                </span>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>{t('signalSearch.searching', 'Searching')}...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <h3>{t('signalSearch.noResults', 'No places found')}</h3>
                  <p>{t('signalSearch.noResultsHint', 'Try removing some signals or selecting different ones')}</p>
                </div>
              ) : (
                <div className="results-list">
                  {results.map(place => (
                    <div key={place.id} className="result-card-wrapper">
                      <PlaceCard
                        place={{
                          id: place.id,
                          name: place.name,
                          address_line1: place.address,
                          city: place.city,
                          state_region: place.state_region,
                          category: place.category,
                          photo_url: place.photo_url,
                          phone: place.phone,
                          website: place.website,
                          latitude: place.latitude,
                          longitude: place.longitude,
                          signals: place.matched_signals.map(ms => ({
                            bucket: ms.label,
                            tap_total: ms.tap_total,
                          })),
                        }}
                        showQuickActions={false}
                        compact
                      />
                      <div className="result-score">
                        <span className="score-value">{place.combined_score}</span>
                        <span className="score-label">{t('signalSearch.combinedTaps', 'combined taps')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Bottom Spacing */}
          <div className="bottom-spacing" />
        </div>

        <style jsx>{`
          .signal-search-screen {
            min-height: 100vh;
            background-color: ${bgColor};
          }

          .container {
            max-width: 640px;
            margin: 0 auto;
            padding: 0 20px;
            padding-bottom: 100px;
          }

          /* Header */
          .header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 20px 0 8px;
          }

          .back-btn {
            background: none;
            border: none;
            color: ${textColor};
            cursor: pointer;
            padding: 8px;
            margin: -8px;
            display: flex;
            align-items: center;
            border-radius: 50%;
            transition: background 0.2s;
          }

          .back-btn:hover {
            background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
          }

          .page-title {
            flex: 1;
            font-size: 24px;
            font-weight: 800;
            color: ${textColor};
            margin: 0;
            letter-spacing: -0.5px;
          }

          .clear-btn {
            background: none;
            border: none;
            color: ${TEAL};
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 10px;
            transition: background 0.2s;
          }

          .clear-btn:hover {
            background: rgba(0, 194, 203, 0.1);
          }

          .page-subtitle {
            font-size: 15px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#888'};
            margin: 0 0 20px;
          }

          /* Search Bar */
          .search-bar {
            display: flex;
            align-items: center;
            background: ${isDark ? 'rgba(255,255,255,0.06)' : '#F5F5F5'};
            border-radius: 16px;
            padding: 0 16px;
            height: 48px;
            margin-bottom: 24px;
            border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'transparent'};
            transition: border-color 0.2s;
          }

          .search-bar:focus-within {
            border-color: ${isDark ? 'rgba(138, 5, 190, 0.4)' : 'rgba(138, 5, 190, 0.3)'};
          }

          .search-bar .search-icon {
            color: ${isDark ? 'rgba(255,255,255,0.3)' : '#999'};
            flex-shrink: 0;
          }

          .search-bar .search-input {
            flex: 1;
            background: none;
            border: none;
            outline: none;
            color: ${isDark ? '#fff' : '#000'};
            font-size: 15px;
            padding: 0 12px;
            font-weight: 400;
          }

          .search-bar .search-input::placeholder {
            color: ${isDark ? 'rgba(255,255,255,0.3)' : '#999'};
          }

          .input-clear-btn {
            background: none;
            border: none;
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
            cursor: pointer;
            padding: 4px;
            display: flex;
          }

          /* Selected Summary */
          .selected-summary {
            margin-bottom: 24px;
          }

          .selected-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
            display: block;
            margin-bottom: 10px;
          }

          .selected-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .selected-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border-radius: 100px;
            border: 1px solid;
            background: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
          }

          .selected-chip:hover {
            transform: translateY(-1px);
          }

          /* Signal Categories */
          .signal-categories {
            margin-bottom: 32px;
          }

          .signal-category-section {
            margin-bottom: 24px;
          }

          .category-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          }

          .category-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }

          .category-title {
            font-size: 16px;
            font-weight: 700;
            color: ${textColor};
            margin: 0;
          }

          .category-count {
            font-size: 12px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.3)' : '#999'};
            margin-left: 4px;
          }

          .signal-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .signal-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            border-radius: 100px;
            border: 1px solid;
            background: none;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            -webkit-tap-highlight-color: transparent;
          }

          .signal-chip:hover {
            transform: translateY(-1px);
            filter: brightness(1.05);
          }

          .signal-chip:active {
            transform: translateY(0);
          }

          .signal-chip.selected {
            font-weight: 600;
          }

          .chip-emoji {
            font-size: 16px;
          }

          .chip-label {
            max-width: 160px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .chip-count {
            font-size: 11px;
            font-weight: 700;
            opacity: 0.5;
            margin-left: 2px;
          }

          /* Results */
          .results-section {
            margin-top: 8px;
          }

          .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .results-title {
            font-size: 20px;
            font-weight: 700;
            color: ${textColor};
            margin: 0;
          }

          .results-count {
            font-size: 14px;
            font-weight: 500;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#888'};
          }

          .results-list {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .result-card-wrapper {
            position: relative;
          }

          .result-score {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 16px 8px;
            margin-top: -12px;
          }

          .score-value {
            font-size: 16px;
            font-weight: 700;
            color: ${TEAL};
          }

          .score-label {
            font-size: 12px;
            color: ${isDark ? 'rgba(255,255,255,0.4)' : '#999'};
          }

          /* Loading & Empty States */
          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 48px 0;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#888'};
            font-size: 14px;
          }

          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
            border-top-color: ${TEAL};
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .empty-state {
            text-align: center;
            padding: 48px 20px;
          }

          .empty-icon {
            font-size: 48px;
            display: block;
            margin-bottom: 16px;
          }

          .empty-state h3 {
            font-size: 18px;
            font-weight: 700;
            color: ${textColor};
            margin: 0 0 8px;
          }

          .empty-state p {
            font-size: 14px;
            color: ${isDark ? 'rgba(255,255,255,0.5)' : '#888'};
            margin: 0;
          }

          .bottom-spacing {
            height: 40px;
          }
        `}</style>
      </div>
    </AppLayout>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
