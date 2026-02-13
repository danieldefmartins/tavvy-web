/**
 * ARTICLE DETAIL SCREEN v2.0
 * Full article reading experience with block-based content
 * Pixel-perfect port from tavvy-mobile/screens/ArticleDetailScreen.tsx
 * 
 * Features:
 * - Reading modes (Light, Sepia, Dark)
 * - Font size controls
 * - Save/Bookmark functionality
 * - Share functionality
 * - Related articles
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { 
  IoArrowBack, 
  IoShareOutline, 
  IoBookmark, 
  IoBookmarkOutline,
  IoHeart,
  IoHeartOutline,
  IoSettingsOutline,
  IoClose,
  IoSunny,
  IoMoon
} from 'react-icons/io5';
import { ContentBlockRenderer, ContentBlock } from '../../../components/atlas/ContentBlockRenderer';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';

// Reading Mode Color Schemes (matching iOS)
const READING_MODES = {
  light: {
    background: '#FAFAFA',
    text: '#1F2937',
    secondaryText: '#374151',
    metaText: '#6B7280',
    divider: '#E5E7EB',
    cardBg: '#FFFFFF',
  },
  sepia: {
    background: '#FBF5E6',
    text: '#5C4B37',
    secondaryText: '#6B5A48',
    metaText: '#8B7B6B',
    divider: '#E8DCC8',
    cardBg: '#F5EFE0',
  },
  dark: {
    background: '#1A1A2E',
    text: '#F5F5F5',
    secondaryText: '#E8E6E3',
    metaText: '#B8B5B0',
    divider: '#2D2D44',
    cardBg: '#252540',
  },
};

type ReadingMode = 'light' | 'sepia' | 'dark';

// Default settings
const DEFAULT_READING_MODE: ReadingMode = 'light';
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const FONT_SIZE_STEP = 2;

interface Article {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  content_blocks?: ContentBlock[];
  excerpt?: string;
  cover_image_url?: string;
  cover_image_caption?: string;
  category_id?: string;
  author_id?: string;
  author_name?: string;
  author_avatar_url?: string;
  author_bio?: string;
  published_at?: string;
  read_time_minutes?: number;
  love_count?: number;
  tags?: string[];
  article_template_type?: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  slug?: string;
  cover_image_url?: string;
  author_name?: string;
  read_time_minutes?: number;
}

// Placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100';

export default function ArticleDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { locale } = router;
  const { id } = router.query;
  const { theme, isDark: systemIsDark } = useThemeContext();

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Reading preferences
  const [readingMode, setReadingMode] = useState<ReadingMode>(DEFAULT_READING_MODE);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('atlas_reading_mode');
      const savedSize = localStorage.getItem('atlas_font_size');
      if (savedMode && ['light', 'sepia', 'dark'].includes(savedMode)) {
        setReadingMode(savedMode as ReadingMode);
      }
      if (savedSize) {
        setFontSize(parseInt(savedSize, 10));
      }
    }
  }, []);

  // Save preferences
  const savePreferences = (mode: ReadingMode, size: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('atlas_reading_mode', mode);
      localStorage.setItem('atlas_font_size', size.toString());
    }
  };

  useEffect(() => {
    checkUser();
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const { data: articleData, error: articleError } = await supabase
        .from('atlas_articles')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (!articleError && articleData) {
        setArticle(articleData);

        // Increment view count
        await supabase
          .from('atlas_articles')
          .update({ view_count: (articleData.view_count || 0) + 1 })
          .eq('id', articleData.id);

        // Fetch related articles
        if (articleData.category_id) {
          const { data: relatedData } = await supabase
            .from('atlas_articles')
            .select('id, title, slug, cover_image_url, author_name, read_time_minutes')
            .eq('category_id', articleData.category_id)
            .neq('id', articleData.id)
            .eq('status', 'published')
            .limit(3);

          if (relatedData) {
            setRelatedArticles(relatedData);
          }
        }

        // Check if saved/loved
        if (userId) {
          const { data: savedData } = await supabase
            .from('atlas_saved_articles')
            .select('id')
            .eq('article_id', articleData.id)
            .eq('user_id', userId)
            .single();
          setIsSaved(!!savedData);

          const { data: reactionData } = await supabase
            .from('atlas_article_reactions')
            .select('reaction_type')
            .eq('article_id', articleData.id)
            .eq('user_id', userId)
            .single();
          setIsLoved(reactionData?.reaction_type === 'love');
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || `Read ${article.title} on TavvY Atlas`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  const toggleSave = async () => {
    if (!userId || !article) return;
    
    try {
      if (isSaved) {
        await supabase
          .from('atlas_saved_articles')
          .delete()
          .eq('article_id', article.id)
          .eq('user_id', userId);
        setIsSaved(false);
      } else {
        await supabase
          .from('atlas_saved_articles')
          .insert({ article_id: article.id, user_id: userId });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const toggleLove = async () => {
    if (!userId || !article) return;
    
    try {
      if (isLoved) {
        await supabase
          .from('atlas_article_reactions')
          .delete()
          .eq('article_id', article.id)
          .eq('user_id', userId);
        setIsLoved(false);
      } else {
        await supabase
          .from('atlas_article_reactions')
          .upsert({ 
            article_id: article.id, 
            user_id: userId,
            reaction_type: 'love'
          });
        setIsLoved(true);
      }
    } catch (error) {
      console.error('Error toggling love:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get current reading mode colors
  const colors = READING_MODES[readingMode];
  const isDark = readingMode === 'dark';

  // Calculate font sizes
  const titleSize = fontSize + 10;
  const lineHeight = Math.round(fontSize * 1.6);

  if (loading) {
    return (
      <AppLayout hideTabBar>
        <div className="loading-screen" style={{ backgroundColor: colors.background }}>
          <div className="loading-spinner" />
          <style jsx>{`
            .loading-screen {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .loading-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid ${colors.divider};
              border-top-color: ${TEAL_PRIMARY};
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  if (!article) {
    return (
      <AppLayout hideTabBar>
        <div className="error-screen" style={{ backgroundColor: colors.background }}>
          <span className="error-icon">📖</span>
          <h1 style={{ color: colors.text }}>Article not found</h1>
          <button onClick={() => router.push('/app/atlas', undefined, { locale })} style={{ color: TEAL_PRIMARY }}>
            Back to Atlas
          </button>
          <style jsx>{`
            .error-screen {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              text-align: center;
            }
            .error-icon { font-size: 64px; margin-bottom: 16px; }
            button { 
              background: none; 
              border: none; 
              font-size: 16px; 
              font-weight: 600; 
              cursor: pointer; 
              margin-top: 16px; 
            }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  const hasContentBlocks = article.content_blocks && Array.isArray(article.content_blocks) && article.content_blocks.length > 0;

  return (
    <>
      <Head>
        <title>{article.title} | TavvY Atlas</title>
        <meta name="description" content={article.excerpt || article.title} />
        {article.cover_image_url && <meta property="og:image" content={article.cover_image_url} />}
      </Head>

      <AppLayout hideTabBar>
        <div className="article-screen" style={{ backgroundColor: colors.background }}>
          {/* Header with Cover Image */}
          <header className="article-header">
            <img 
              src={article.cover_image_url || PLACEHOLDER_ARTICLE}
              alt={article.title}
              className="cover-image"
            />
            <div className="header-overlay">
              <div className="header-actions">
                <button className="action-btn" onClick={() => router.back()}>
                  <IoArrowBack size={24} color="white" />
                </button>
                <div className="right-actions">
                  <button className="action-btn" onClick={() => setShowSettingsModal(true)}>
                    <IoSettingsOutline size={20} color="white" />
                  </button>
                  <button className="action-btn" onClick={toggleSave}>
                    {isSaved ? (
                      <IoBookmark size={20} color="white" />
                    ) : (
                      <IoBookmarkOutline size={20} color="white" />
                    )}
                  </button>
                  <button className="action-btn" onClick={handleShare}>
                    <IoShareOutline size={20} color="white" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="article-content">
            <h1 className="article-title" style={{ color: colors.text, fontSize: titleSize }}>
              {article.title}
            </h1>

            {/* Meta Info */}
            <div className="article-meta">
              <div className="author-info">
                <img 
                  src={article.author_avatar_url || PLACEHOLDER_AVATAR} 
                  alt={article.author_name} 
                  className="author-avatar"
                />
                <div className="author-details">
                  <span className="author-name" style={{ color: colors.text }}>
                    {article.author_name || 'Tavvy Team'}
                  </span>
                  <span className="publish-date" style={{ color: colors.metaText }}>
                    {formatDate(article.published_at)}
                  </span>
                </div>
              </div>
              <div className="meta-stats">
                {article.read_time_minutes && (
                  <span className="read-time" style={{ color: colors.metaText }}>
                    {article.read_time_minutes} min read
                  </span>
                )}
                <button className="love-btn" onClick={toggleLove}>
                  {isLoved ? (
                    <IoHeart size={20} color="#ef4444" />
                  ) : (
                    <IoHeartOutline size={20} color={colors.metaText} />
                  )}
                  <span style={{ color: colors.metaText }}>
                    {article.love_count || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="excerpt" style={{ color: colors.secondaryText, fontSize }}>
                {article.excerpt}
              </p>
            )}

            {/* Main Content */}
            <div className="content-body" style={{ fontSize, lineHeight: `${lineHeight}px` }}>
              {hasContentBlocks ? (
                <ContentBlockRenderer 
                  blocks={article.content_blocks!}
                  isDark={isDark}
                />
              ) : article.content ? (
                <div 
                  className="legacy-content"
                  style={{ color: colors.text }}
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              ) : (
                <p style={{ color: colors.metaText }}>
                  Full article content coming soon...
                </p>
              )}
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="tags-section">
                <h3 style={{ color: colors.text }}>Tags</h3>
                <div className="tags-list">
                  {article.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="tag"
                      style={{ backgroundColor: colors.cardBg, color: colors.text }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="related-section">
                <h3 style={{ color: colors.text }}>Related Articles</h3>
                <div className="related-list">
                  {relatedArticles.map((related) => (
                    <Link 
                      key={related.id}
                      href={`/app/article/${related.slug || related.id}`}
                      locale={locale}
                      className="related-card"
                      style={{ backgroundColor: colors.cardBg }}
                    >
                      <img 
                        src={related.cover_image_url || PLACEHOLDER_ARTICLE} 
                        alt={related.title}
                        className="related-image"
                      />
                      <div className="related-info">
                        <span className="related-title" style={{ color: colors.text }}>
                          {related.title}
                        </span>
                        <span className="related-meta" style={{ color: colors.metaText }}>
                          {related.author_name || 'Tavvy Team'} • {related.read_time_minutes || 5} min
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Settings Modal */}
          {showSettingsModal && (
            <div className="settings-modal-overlay" onClick={() => setShowSettingsModal(false)}>
              <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Reading Settings</h3>
                  <button onClick={() => setShowSettingsModal(false)}>
                    <IoClose size={24} color={colors.text} />
                  </button>
                </div>

                {/* Reading Mode */}
                <div className="setting-section">
                  <label>Reading Mode</label>
                  <div className="mode-buttons">
                    <button 
                      className={`mode-btn ${readingMode === 'light' ? 'active' : ''}`}
                      onClick={() => {
                        setReadingMode('light');
                        savePreferences('light', fontSize);
                      }}
                      style={{ backgroundColor: READING_MODES.light.background }}
                    >
                      <IoSunny size={20} color={READING_MODES.light.text} />
                      <span style={{ color: READING_MODES.light.text }}>Light</span>
                    </button>
                    <button 
                      className={`mode-btn ${readingMode === 'sepia' ? 'active' : ''}`}
                      onClick={() => {
                        setReadingMode('sepia');
                        savePreferences('sepia', fontSize);
                      }}
                      style={{ backgroundColor: READING_MODES.sepia.background }}
                    >
                      <span style={{ color: READING_MODES.sepia.text }}>Aa</span>
                      <span style={{ color: READING_MODES.sepia.text }}>Sepia</span>
                    </button>
                    <button 
                      className={`mode-btn ${readingMode === 'dark' ? 'active' : ''}`}
                      onClick={() => {
                        setReadingMode('dark');
                        savePreferences('dark', fontSize);
                      }}
                      style={{ backgroundColor: READING_MODES.dark.background }}
                    >
                      <IoMoon size={20} color={READING_MODES.dark.text} />
                      <span style={{ color: READING_MODES.dark.text }}>Dark</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div className="setting-section">
                  <label>Font Size</label>
                  <div className="font-size-control">
                    <button 
                      className="size-btn"
                      onClick={() => {
                        const newSize = Math.max(MIN_FONT_SIZE, fontSize - FONT_SIZE_STEP);
                        setFontSize(newSize);
                        savePreferences(readingMode, newSize);
                      }}
                      disabled={fontSize <= MIN_FONT_SIZE}
                    >
                      A-
                    </button>
                    <span className="size-value">{fontSize}px</span>
                    <button 
                      className="size-btn"
                      onClick={() => {
                        const newSize = Math.min(MAX_FONT_SIZE, fontSize + FONT_SIZE_STEP);
                        setFontSize(newSize);
                        savePreferences(readingMode, newSize);
                      }}
                      disabled={fontSize >= MAX_FONT_SIZE}
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .article-screen {
            min-height: 100vh;
            padding-bottom: 40px;
          }

          /* Header */
          .article-header {
            position: relative;
            height: 300px;
          }

          .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .header-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.6) 100%);
          }

          .header-actions {
            display: flex;
            justify-content: space-between;
            padding: 20px;
          }

          .action-btn {
            width: 44px;
            height: 44px;
            border-radius: 22px;
            background: rgba(0,0,0,0.4);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
          }

          .right-actions {
            display: flex;
            gap: 8px;
          }

          /* Content */
          .article-content {
            padding: 24px 20px;
          }

          .article-title {
            font-weight: 700;
            line-height: 1.2;
            margin: 0 0 20px;
          }

          /* Meta */
          .article-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid ${colors.divider};
          }

          .author-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .author-avatar {
            width: 48px;
            height: 48px;
            border-radius: 24px;
            object-fit: cover;
          }

          .author-details {
            display: flex;
            flex-direction: column;
          }

          .author-name {
            font-size: 15px;
            font-weight: 600;
          }

          .publish-date {
            font-size: 13px;
          }

          .meta-stats {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .read-time {
            font-size: 13px;
          }

          .love-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 14px;
          }

          /* Excerpt */
          .excerpt {
            font-style: italic;
            line-height: 1.6;
            margin: 0 0 24px;
            padding: 16px;
            background: ${colors.cardBg};
            border-radius: 12px;
            border-left: 4px solid ${TEAL_PRIMARY};
          }

          /* Content Body */
          .content-body {
            color: ${colors.text};
          }

          .legacy-content {
            line-height: 1.6;
          }

          .legacy-content p {
            margin-bottom: 16px;
          }

          /* Tags */
          .tags-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid ${colors.divider};
          }

          .tags-section h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 12px;
          }

          .tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .tag {
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 500;
          }

          /* Related */
          .related-section {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid ${colors.divider};
          }

          .related-section h3 {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 16px;
          }

          .related-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .related-card {
            display: flex;
            gap: 12px;
            border-radius: 12px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .related-card:hover {
            transform: scale(1.01);
          }

          .related-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            flex-shrink: 0;
          }

          .related-info {
            padding: 12px 12px 12px 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }

          .related-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .related-meta {
            font-size: 12px;
          }

          /* Settings Modal */
          .settings-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: flex-end;
            justify-content: center;
            z-index: 1000;
          }

          .settings-modal {
            background: ${colors.cardBg};
            border-radius: 20px 20px 0 0;
            padding: 24px;
            width: 100%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .modal-header h3 {
            font-size: 20px;
            font-weight: 700;
            color: ${colors.text};
            margin: 0;
          }

          .modal-header button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
          }

          .setting-section {
            margin-bottom: 24px;
          }

          .setting-section label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${colors.metaText};
            margin-bottom: 12px;
          }

          .mode-buttons {
            display: flex;
            gap: 12px;
          }

          .mode-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px;
            border-radius: 12px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: border-color 0.2s;
          }

          .mode-btn.active {
            border-color: ${TEAL_PRIMARY};
          }

          .mode-btn span {
            font-size: 13px;
            font-weight: 600;
          }

          .font-size-control {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 24px;
          }

          .size-btn {
            width: 48px;
            height: 48px;
            border-radius: 24px;
            background: ${colors.background};
            border: 1px solid ${colors.divider};
            font-size: 16px;
            font-weight: 600;
            color: ${colors.text};
            cursor: pointer;
            transition: opacity 0.2s;
          }

          .size-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .size-value {
            font-size: 18px;
            font-weight: 600;
            color: ${colors.text};
            min-width: 60px;
            text-align: center;
          }

          /* Responsive */
          @media (max-width: 480px) {
            .article-header {
              height: 250px;
            }

            .article-meta {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
          }
        `}</style>
      </AppLayout>
    </>
  );
}


export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
