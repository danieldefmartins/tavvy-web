import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

interface GeoEntry {
  zip: string;
  count: number;
  city?: string;
  state?: string;
  country?: string;
  support?: number;
  needs_improvement?: number;
  disagree?: number;
}

interface CityStateEntry {
  count: number;
  city: string;
  state: string;
  country: string;
}

interface GeoData {
  endorsements: {
    total: number;
    byZip: GeoEntry[];
    byIpZip: GeoEntry[];
    byCityState: CityStateEntry[];
    mismatchCount: number;
    mismatchRate: number;
  };
  votes: {
    total: number;
    byZip: GeoEntry[];
    byIpZip: GeoEntry[];
    byCityState: CityStateEntry[];
    mismatchCount: number;
    mismatchRate: number;
  };
  summary: {
    totalEndorsements: number;
    totalVotes: number;
    totalMismatches: number;
    overallMismatchRate: number;
  };
}

interface Props {
  cardId: string;
  isDark: boolean;
}

export default function GeoAnalyticsDashboard({ cardId, isDark }: Props) {
  const { t } = useTranslation('common');
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'endorsements' | 'votes'>('endorsements');
  const [viewMode, setViewMode] = useState<'zip' | 'ip' | 'city'>('zip');

  useEffect(() => {
    fetchGeoData();
  }, [cardId]);

  const fetchGeoData = async () => {
    try {
      const res = await fetch(`/api/ecard/geo-analytics?card_id=${cardId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch geo analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const bg = isDark ? '#1E293B' : '#fff';
  const text = isDark ? '#fff' : '#1a1a2e';
  const subtext = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? '#334155' : '#E5E7EB';
  const accent = '#6C63FF';
  const green = '#10B981';
  const yellow = '#F59E0B';
  const red = '#EF4444';

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: subtext }}>
        {t('geo.loading', 'Loading geo analytics...')}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: subtext }}>
        {t('geo.noData', 'No geo data available yet.')}
      </div>
    );
  }

  const currentData = activeSection === 'endorsements' ? data.endorsements : data.votes;
  const currentList =
    viewMode === 'zip' ? currentData.byZip :
    viewMode === 'ip' ? currentData.byIpZip :
    currentData.byCityState.map((c: CityStateEntry) => ({
      zip: `${c.city}, ${c.state}`,
      count: c.count,
      city: c.city,
      state: c.state,
      country: c.country,
    }));

  const maxCount = currentList.length > 0 ? Math.max(...currentList.map((e: any) => e.count)) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        <div style={{
          background: bg, borderRadius: '12px', padding: '1.25rem',
          border: `1px solid ${border}`, textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: accent }}>
            {data.summary.totalEndorsements}
          </div>
          <div style={{ fontSize: '0.8rem', color: subtext, marginTop: '0.25rem' }}>
            {t('geo.totalEndorsements', 'Total Endorsements')}
          </div>
        </div>
        <div style={{
          background: bg, borderRadius: '12px', padding: '1.25rem',
          border: `1px solid ${border}`, textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: green }}>
            {data.summary.totalVotes}
          </div>
          <div style={{ fontSize: '0.8rem', color: subtext, marginTop: '0.25rem' }}>
            {t('geo.totalVotes', 'Total Votes')}
          </div>
        </div>
        <div style={{
          background: bg, borderRadius: '12px', padding: '1.25rem',
          border: `1px solid ${border}`, textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2rem', fontWeight: 700,
            color: data.summary.overallMismatchRate > 20 ? red : data.summary.overallMismatchRate > 10 ? yellow : green,
          }}>
            {data.summary.overallMismatchRate}%
          </div>
          <div style={{ fontSize: '0.8rem', color: subtext, marginTop: '0.25rem' }}>
            {t('geo.mismatchRate', 'ZIP/IP Mismatch Rate')}
          </div>
        </div>
        <div style={{
          background: bg, borderRadius: '12px', padding: '1.25rem',
          border: `1px solid ${border}`, textAlign: 'center',
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: yellow }}>
            {data.summary.totalMismatches}
          </div>
          <div style={{ fontSize: '0.8rem', color: subtext, marginTop: '0.25rem' }}>
            {t('geo.totalMismatches', 'Total Mismatches')}
          </div>
        </div>
      </div>

      {/* Mismatch Alert */}
      {data.summary.overallMismatchRate > 15 && (
        <div style={{
          background: isDark ? '#451a03' : '#FEF3C7',
          border: `1px solid ${isDark ? '#92400e' : '#F59E0B'}`,
          borderRadius: '12px', padding: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, color: isDark ? '#FCD34D' : '#92400E', fontSize: '0.9rem' }}>
              {t('geo.mismatchAlert', 'High Mismatch Rate Detected')}
            </div>
            <div style={{ fontSize: '0.8rem', color: isDark ? '#FDE68A' : '#A16207', marginTop: '0.25rem' }}>
              {t('geo.mismatchAlertDesc', '{{rate}}% of interactions show a different IP location than the self-reported ZIP code. This could indicate users accessing from different locations or potential misrepresentation.', { rate: data.summary.overallMismatchRate })}
            </div>
          </div>
        </div>
      )}

      {/* Section Toggle */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setActiveSection('endorsements')}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
            background: activeSection === 'endorsements' ? accent : (isDark ? '#334155' : '#F3F4F6'),
            color: activeSection === 'endorsements' ? '#fff' : text,
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {t('geo.endorsements', 'Endorsements')} ({data.endorsements.total})
        </button>
        <button
          onClick={() => setActiveSection('votes')}
          style={{
            flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none',
            background: activeSection === 'votes' ? accent : (isDark ? '#334155' : '#F3F4F6'),
            color: activeSection === 'votes' ? '#fff' : text,
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {t('geo.votes', 'Votes')} ({data.votes.total})
        </button>
      </div>

      {/* View Mode Toggle */}
      <div style={{
        display: 'flex', gap: '0.25rem', background: isDark ? '#0F172A' : '#F3F4F6',
        borderRadius: '10px', padding: '0.25rem',
      }}>
        {[
          { key: 'zip' as const, label: t('geo.selfReported', 'Self-Reported ZIP') },
          { key: 'ip' as const, label: t('geo.ipBased', 'IP-Based ZIP') },
          { key: 'city' as const, label: t('geo.byCity', 'By City') },
        ].map((mode) => (
          <button
            key={mode.key}
            onClick={() => setViewMode(mode.key)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none',
              background: viewMode === mode.key ? bg : 'transparent',
              color: viewMode === mode.key ? text : subtext,
              fontWeight: viewMode === mode.key ? 600 : 400,
              fontSize: '0.75rem', cursor: 'pointer',
              boxShadow: viewMode === mode.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Comparison Info */}
      <div style={{
        background: isDark ? '#0F172A' : '#F8FAFC',
        borderRadius: '12px', padding: '1rem',
        border: `1px solid ${border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: text, fontSize: '0.9rem' }}>
            {viewMode === 'zip'
              ? t('geo.reportedLocations', 'Reported Locations')
              : viewMode === 'ip'
              ? t('geo.detectedLocations', 'Detected Locations (IP)')
              : t('geo.cityBreakdown', 'City Breakdown')}
          </span>
          <span style={{
            fontSize: '0.75rem', color: subtext,
            background: isDark ? '#1E293B' : '#E5E7EB',
            padding: '0.25rem 0.75rem', borderRadius: '20px',
          }}>
            {currentData.mismatchCount} {t('geo.mismatches', 'mismatches')} ({currentData.mismatchRate}%)
          </span>
        </div>

        {/* Location Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {currentList.length === 0 ? (
            <div style={{ textAlign: 'center', color: subtext, padding: '1rem', fontSize: '0.85rem' }}>
              {t('geo.noLocationData', 'No location data available')}
            </div>
          ) : (
            currentList.slice(0, 15).map((entry: any, idx: number) => {
              const percentage = Math.round((entry.count / currentData.total) * 100);
              const barWidth = Math.max(5, (entry.count / maxCount) * 100);

              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ minWidth: '120px', fontSize: '0.8rem', color: text, fontWeight: 500 }}>
                    {viewMode === 'city' ? entry.zip : entry.zip}
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '100%', height: '100%',
                      background: isDark ? '#1E293B' : '#E5E7EB',
                      borderRadius: '6px',
                    }} />
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      width: `${barWidth}%`, height: '100%',
                      background: activeSection === 'endorsements'
                        ? `linear-gradient(90deg, ${accent}, ${accent}88)`
                        : `linear-gradient(90deg, ${green}, ${green}88)`,
                      borderRadius: '6px',
                      transition: 'width 0.5s ease',
                    }} />
                    {/* Vote breakdown bars for votes section */}
                    {activeSection === 'votes' && viewMode === 'zip' && entry.support !== undefined && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0,
                        width: `${barWidth}%`, height: '100%',
                        display: 'flex', borderRadius: '6px', overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${entry.count > 0 ? (entry.support / entry.count) * 100 : 0}%`,
                          background: green, height: '100%',
                        }} />
                        <div style={{
                          width: `${entry.count > 0 ? (entry.needs_improvement / entry.count) * 100 : 0}%`,
                          background: yellow, height: '100%',
                        }} />
                        <div style={{
                          width: `${entry.count > 0 ? (entry.disagree / entry.count) * 100 : 0}%`,
                          background: red, height: '100%',
                        }} />
                      </div>
                    )}
                  </div>
                  <div style={{
                    minWidth: '60px', textAlign: 'right',
                    fontSize: '0.8rem', fontWeight: 600, color: text,
                  }}>
                    {entry.count} <span style={{ color: subtext, fontWeight: 400 }}>({percentage}%)</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {currentList.length > 15 && (
          <div style={{
            textAlign: 'center', marginTop: '0.75rem',
            fontSize: '0.8rem', color: subtext,
          }}>
            {t('geo.andMore', '+ {{count}} more locations', { count: currentList.length - 15 })}
          </div>
        )}
      </div>

      {/* Vote Legend */}
      {activeSection === 'votes' && viewMode === 'zip' && (
        <div style={{
          display: 'flex', gap: '1.5rem', justifyContent: 'center',
          fontSize: '0.75rem', color: subtext,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: green, display: 'inline-block' }} />
            {t('geo.support', 'Support')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: yellow, display: 'inline-block' }} />
            {t('geo.needsImprovement', 'Needs Improvement')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: red, display: 'inline-block' }} />
            {t('geo.disagree', 'Disagree')}
          </span>
        </div>
      )}

      {/* Dual Source Comparison */}
      <div style={{
        background: bg, borderRadius: '12px', padding: '1rem',
        border: `1px solid ${border}`,
      }}>
        <h4 style={{ color: text, fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.75rem 0' }}>
          {t('geo.dualSourceComparison', 'Self-Reported vs IP Detection')}
        </h4>
        <div style={{ fontSize: '0.8rem', color: subtext, marginBottom: '1rem' }}>
          {t('geo.dualSourceDesc', 'Compare what users report as their location versus where their IP address indicates they are. High mismatch rates may indicate users accessing from different locations than reported.')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{
            background: isDark ? '#0F172A' : '#F8FAFC',
            borderRadius: '10px', padding: '1rem',
          }}>
            <div style={{ fontWeight: 600, color: text, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              📋 {t('geo.selfReportedTitle', 'Self-Reported (ZIP)')}
            </div>
            {currentData.byZip.slice(0, 5).map((e, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.35rem 0', borderBottom: `1px solid ${border}`,
                fontSize: '0.8rem',
              }}>
                <span style={{ color: text }}>{e.zip}</span>
                <span style={{ color: accent, fontWeight: 600 }}>{e.count}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: isDark ? '#0F172A' : '#F8FAFC',
            borderRadius: '10px', padding: '1rem',
          }}>
            <div style={{ fontWeight: 600, color: text, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              🌐 {t('geo.ipDetectedTitle', 'IP-Detected Location')}
            </div>
            {currentData.byIpZip.slice(0, 5).map((e, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.35rem 0', borderBottom: `1px solid ${border}`,
                fontSize: '0.8rem',
              }}>
                <span style={{ color: text }}>{e.city || e.zip}, {e.state}</span>
                <span style={{ color: green, fontWeight: 600 }}>{e.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
