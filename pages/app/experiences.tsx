/**
 * Experiences Screen
 * Browse local experiences and activities
 */

import { useAuth } from '../../contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../contexts/ThemeContext';
import AppLayout from '../../components/AppLayout';
import { supabase } from '../../lib/supabaseClient';
import { spacing, borderRadius } from '../../constants/Colors';
import { FiSearch, FiClock } from 'react-icons/fi';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { ExperiencePath, loadExperiencePaths, matchesPath, loadOwnedExperiencePaths } from '../../lib/experiencePaths';

export default function ExperiencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [owned, setOwned] = useState<ExperiencePath[]>([]);
  const [ownedError, setOwnedError] = useState(false);
  const [ownedLoading, setOwnedLoading] = useState(false);
  const [ownedRetry, setOwnedRetry] = useState(0);
  const { locale } = router;
  const { theme } = useThemeContext();
  const [experiences, setExperiences] = useState<ExperiencePath[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchExperiences();
  }, []);

  useEffect(() => {
    let active = true;
    setOwned([]); setOwnedError(false); setOwnedLoading(Boolean(user));
    if (user) loadOwnedExperiencePaths(supabase, user.id).then(rows => { if (active) setOwned(rows); }).catch(() => { if (active) setOwnedError(true); }).finally(() => { if (active) setOwnedLoading(false); });
    return () => { active = false; };
  }, [user?.id, ownedRetry]);

  const fetchExperiences = async () => {
    setLoading(true);
    setError(false);
    try { setExperiences(await loadExperiencePaths(supabase)); }
    catch { setError(true); }
    finally { setLoading(false); }
  };

  const categories = ['all', ...Array.from(new Set(experiences.map(p => p.category).filter((c): c is string => Boolean(c))))];
  const filteredExperiences = experiences.filter(exp => matchesPath(exp, searchQuery, selectedCategory));

  return (
    <>
      <Head>
        <title>Experiences | TavvY</title>
        <meta name="description" content="Discover unique local experiences on TavvY" />
      </Head>

      <AppLayout>
        <div className="experiences-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="experiences-header" style={{ background: 'linear-gradient(135deg, #8A05BE, #6366F1)' }}>
            <h1>✨ Experiences</h1>
            <p>Discover unique local activities</p>
            
            {/* Search */}
            <div className="search-container">
              <FiSearch size={18} color="rgba(255,255,255,0.7)" />
              <input
                aria-label="Search experiences"
                type="text"
                placeholder="Search experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          <section style={{ padding: 24, color: theme.text }}>
            <Link href="/app/experience/new" style={{ display: 'inline-block', padding: '12px 18px', borderRadius: 12, background: theme.primary, color: 'white', textDecoration: 'none' }}>Create a path</Link>
            {user && <><h2>My paths</h2>{ownedLoading ? <p role="status">Loading your paths…</p> : ownedError ? <p role="alert">Your paths could not be loaded. <button onClick={() => setOwnedRetry(x => x + 1)}>Retry</button></p> : owned.length ? owned.map(path => <p key={path.id}><Link href={`/app/experience/${path.id}`}>{path.title}</Link> · {path.is_published ? 'Published' : 'Private draft'}</p>) : <p>Your saved paths will appear here.</p>}</>}
          </section>
          {/* Category Pills */}
          <div className="categories-scroll">
            {categories.map((category) => (
              <button
                key={category}
                aria-pressed={selectedCategory === category}
                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category || 'all')}
                style={{
                  backgroundColor: selectedCategory === category ? theme.primary : theme.surface,
                  color: selectedCategory === category ? 'white' : theme.text,
                }}
              >
                {category === 'all' ? 'All paths' : category}
              </button>
            ))}
          </div>

          {/* Experiences Grid */}
          <section className="experiences-section">
            {loading ? (
              <div className="loading-container" role="status" aria-label="Loading experiences">
                <div className="loading-spinner" />
              </div>
            ) : error ? (
              <div role="alert" className="empty-state"><p>Experiences could not be loaded.</p><button onClick={fetchExperiences}>Retry</button></div>
            ) : filteredExperiences.length === 0 ? (
              <div className="empty-state">
                <span>✨</span>
                <h3 style={{ color: theme.text }}>No experiences found</h3>
                <p style={{ color: theme.textSecondary }}>
                  {searchQuery || selectedCategory !== 'all' ? 'Try a different search or category' : 'No published experience paths yet. Check back soon.'}
                </p>
              </div>
            ) : (
              <div className="experiences-grid">
                {filteredExperiences.map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/app/experience/${exp.id}`}
                    locale={locale}
                    className="experience-card"
                    style={{ backgroundColor: theme.cardBackground }}
                  >
                    <div className="card-image">
                      {exp.cover_image_url ? (
                        <img src={exp.cover_image_url} alt={exp.title} />
                      ) : (
                        <div className="image-placeholder" style={{ backgroundColor: theme.surface }}>
                          ✨
                        </div>
                      )}
                      {exp.category && (
                        <span className="category-badge" style={{ backgroundColor: theme.primary }}>
                          {exp.category}
                        </span>
                      )}
                    </div>
                    <div className="card-content">
                      <h3 style={{ color: theme.text }}>{exp.title}</h3>
                      {exp.description && <p style={{ color: theme.textSecondary }}>{exp.description}</p>}
                      {exp.duration_minutes != null && <p><FiClock /> {exp.duration_minutes} minutes</p>}

                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .experiences-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .experiences-header {
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            padding-bottom: ${spacing.xl}px;
          }
          
          .experiences-header h1 {
            font-size: 28px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }
          
          .experiences-header p {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            margin: 0 0 ${spacing.lg}px;
          }
          
          .search-container {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
            background: rgba(255,255,255,0.2);
            padding: 12px 16px;
            border-radius: ${borderRadius.md}px;
          }
          
          .search-container input {
            flex: 1;
            border: none;
            background: transparent;
            font-size: 16px;
            color: white;
            outline: none;
          }
          
          .search-container input::placeholder {
            color: rgba(255,255,255,0.7);
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
          
          .experiences-section {
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
          
          .experiences-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: ${spacing.md}px;
          }
          
          .experience-card {
            border-radius: ${borderRadius.lg}px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }
          
          .experience-card:hover {
            transform: translateY(-4px);
          }
          
          .card-image {
            position: relative;
            height: 180px;
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
            font-size: 48px;
          }
          
          .category-badge {
            position: absolute;
            top: ${spacing.sm}px;
            left: ${spacing.sm}px;
            padding: 4px 10px;
            border-radius: ${borderRadius.full}px;
            color: white;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .card-content {
            padding: ${spacing.md}px;
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
          
          .location {
            font-size: 13px;
            margin: 0 0 ${spacing.sm}px;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .meta-row {
            display: flex;
            gap: ${spacing.md}px;
            margin-bottom: ${spacing.sm}px;
            font-size: 12px;
          }
          
          .meta-row span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .price {
            font-size: 14px;
            margin: 0 0 ${spacing.sm}px;
          }
          
          .rating {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
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
