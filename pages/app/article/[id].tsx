/**
 * Article Detail Screen
 * View full article content with block-based rendering
 * Updated to use ContentBlockRenderer for Atlas v2.0
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
import AppLayout from '../../../components/AppLayout';
import { supabase } from '../../../lib/supabaseClient';
import { spacing, borderRadius } from '../../../constants/Colors';
import { FiArrowLeft, FiShare2, FiBookmark, FiClock, FiUser } from 'react-icons/fi';
import { ContentBlockRenderer, ContentBlock } from '../../../components/atlas/ContentBlockRenderer';

interface Article {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  content_blocks?: ContentBlock[];
  excerpt?: string;
  cover_image_url?: string;
  category_id?: string;
  author_name?: string;
  author_avatar_url?: string;
  published_at?: string;
  read_time_minutes?: number;
  tags?: string[];
}

interface RelatedArticle {
  id: string;
  title: string;
  slug?: string;
  cover_image_url?: string;
  category_id?: string;
}

export default function ArticleDetailScreen() {
  const router = useRouter();
  const { id } = router.query;
  const { theme, isDark } = useThemeContext();

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      // Fetch article with content_blocks
      const { data: articleData, error: articleError } = await supabase
        .from('atlas_articles')
        .select('*')
        .or(`id.eq.${id},slug.eq.${id}`)
        .single();

      if (!articleError && articleData) {
        setArticle(articleData);

        // Fetch related articles by category_id
        if (articleData.category_id) {
          const { data: relatedData } = await supabase
            .from('atlas_articles')
            .select('id, title, slug, cover_image_url, category_id')
            .eq('category_id', articleData.category_id)
            .neq('id', articleData.id)
            .eq('status', 'published')
            .limit(3);

          if (relatedData) {
            setRelatedArticles(relatedData);
          }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <AppLayout hideTabBar>
        <div className="loading-screen" style={{ backgroundColor: theme.background }}>
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
              border: 3px solid ${theme.surface};
              border-top-color: ${theme.primary};
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
        <div className="error-screen" style={{ backgroundColor: theme.background }}>
          <span>📖</span>
          <h1 style={{ color: theme.text }}>Article not found</h1>
          <button onClick={() => router.push('/app/atlas')} style={{ color: theme.primary }}>
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
            span { font-size: 64px; margin-bottom: 16px; }
            button { background: none; border: none; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px; }
          `}</style>
        </div>
      </AppLayout>
    );
  }

  // Check if we have content_blocks (v2.0) or legacy content
  const hasContentBlocks = article.content_blocks && Array.isArray(article.content_blocks) && article.content_blocks.length > 0;

  return (
    <>
      <Head>
        <title>{article.title} | TavvY Atlas</title>
        <meta name="description" content={article.excerpt || article.title} />
        {article.cover_image_url && <meta property="og:image" content={article.cover_image_url} />}
      </Head>

      <AppLayout hideTabBar>
        <div className="article-screen" style={{ backgroundColor: theme.background }}>
          {/* Header */}
          <header className="article-header">
            {article.cover_image_url && (
              <img 
                src={article.cover_image_url}
                alt={article.title}
                className="cover-image"
              />
            )}
            <div className="header-overlay">
              <div className="header-actions">
                <button className="action-btn" onClick={() => router.back()}>
                  <FiArrowLeft size={24} color="white" />
                </button>
                <div className="right-actions">
                  <button className="action-btn" onClick={() => setIsSaved(!isSaved)}>
                    <FiBookmark size={20} color="white" fill={isSaved ? 'white' : 'none'} />
                  </button>
                  <button className="action-btn" onClick={handleShare}>
                    <FiShare2 size={20} color="white" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="article-content">
            <h1 style={{ color: theme.text }}>{article.title}</h1>

            {/* Meta Info */}
            <div className="article-meta">
              {article.author_name && (
                <div className="author-info">
                  {article.author_avatar_url ? (
                    <img src={article.author_avatar_url} alt={article.author_name} className="author-image" />
                  ) : (
                    <div className="author-placeholder" style={{ backgroundColor: theme.primary }}>
                      <FiUser size={16} color="white" />
                    </div>
                  )}
                  <span style={{ color: theme.text }}>{article.author_name}</span>
                </div>
              )}
              <div className="meta-details">
                {article.published_at && (
                  <span style={{ color: theme.textSecondary }}>{formatDate(article.published_at)}</span>
                )}
                {article.read_time_minutes && (
                  <span style={{ color: theme.textSecondary }}>
                    <FiClock size={14} /> {article.read_time_minutes} min read
                  </span>
                )}
              </div>
            </div>

            {/* Excerpt */}
            {article.excerpt && (
              <p className="excerpt" style={{ color: theme.textSecondary }}>
                {article.excerpt}
              </p>
            )}

            {/* Main Content - Use ContentBlockRenderer for v2.0, fallback to legacy */}
            {hasContentBlocks ? (
              <ContentBlockRenderer 
                blocks={article.content_blocks!}
                isDark={isDark}
              />
            ) : article.content ? (
              <div 
                className="content-body"
                style={{ color: theme.text }}
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <div className="content-placeholder">
                <p style={{ color: theme.textSecondary }}>
                  Full article content coming soon...
                </p>
              </div>
            )}

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="tags-section">
                <h3 style={{ color: theme.text }}>Tags</h3>
                <div className="tags-list">
                  {article.tags.map((tag, index) => (
                    <span key={index} className="tag" style={{ backgroundColor: theme.surface, color: theme.text }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="related-section">
                <h3 style={{ color: theme.text }}>Related Articles</h3>
                <div className="related-list">
                  {relatedArticles.map((related) => (
                    <Link 
                      key={related.id}
                      href={`/app/article/${related.slug || related.id}`}
                      className="related-card"
                      style={{ backgroundColor: theme.cardBackground }}
                    >
                      {related.cover_image_url ? (
                        <img src={related.cover_image_url} alt={related.title} className="related-image" />
                      ) : (
                        <div className="related-placeholder" style={{ backgroundColor: theme.surface }}>
                          📖
                        </div>
                      )}
                      <div className="related-info">
                        <h4 style={{ color: theme.text }}>{related.title}</h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          .article-screen {
            min-height: 100vh;
            padding-bottom: 100px;
          }
          
          .article-header {
            position: relative;
            height: 280px;
          }
          
          .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .header-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(rgba(0,0,0,0.3), transparent 40%, rgba(0,0,0,0.6));
            padding: ${spacing.lg}px;
            padding-top: max(${spacing.lg}px, env(safe-area-inset-top));
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .header-actions {
            display: flex;
            justify-content: space-between;
          }
          
          .right-actions {
            display: flex;
            gap: ${spacing.sm}px;
          }
          
          .action-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(0,0,0,0.5);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .article-content {
            padding: ${spacing.lg}px;
          }
          
          h1 {
            font-size: 28px;
            font-weight: 700;
            line-height: 1.3;
            margin: 0 0 ${spacing.lg}px;
          }
          
          .article-meta {
            display: flex;
            flex-direction: column;
            gap: ${spacing.sm}px;
            margin-bottom: ${spacing.lg}px;
            padding-bottom: ${spacing.lg}px;
            border-bottom: 1px solid ${theme.border};
          }
          
          .author-info {
            display: flex;
            align-items: center;
            gap: ${spacing.sm}px;
          }
          
          .author-image {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            object-fit: cover;
          }
          
          .author-placeholder {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .meta-details {
            display: flex;
            align-items: center;
            gap: ${spacing.md}px;
            font-size: 14px;
          }
          
          .meta-details span {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .excerpt {
            font-size: 18px;
            font-style: italic;
            line-height: 1.6;
            margin: 0 0 ${spacing.xl}px;
          }
          
          .content-body {
            font-size: 16px;
            line-height: 1.8;
          }
          
          .content-body :global(p) {
            margin: 0 0 ${spacing.lg}px;
          }
          
          .content-body :global(h2) {
            font-size: 22px;
            font-weight: 600;
            margin: ${spacing.xl}px 0 ${spacing.md}px;
          }
          
          .content-body :global(h3) {
            font-size: 18px;
            font-weight: 600;
            margin: ${spacing.lg}px 0 ${spacing.sm}px;
          }
          
          .content-body :global(img) {
            width: 100%;
            border-radius: ${borderRadius.lg}px;
            margin: ${spacing.lg}px 0;
          }
          
          .content-body :global(blockquote) {
            border-left: 4px solid ${theme.primary};
            margin: ${spacing.lg}px 0;
            padding-left: ${spacing.lg}px;
            font-style: italic;
          }
          
          .content-placeholder {
            padding: 40px;
            text-align: center;
          }
          
          .tags-section {
            margin-top: ${spacing.xl}px;
            padding-top: ${spacing.lg}px;
            border-top: 1px solid ${theme.border};
          }
          
          .tags-section h3 {
            font-size: 16px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: ${spacing.sm}px;
          }
          
          .tag {
            padding: 6px 12px;
            border-radius: ${borderRadius.full}px;
            font-size: 13px;
          }
          
          .related-section {
            margin-top: ${spacing.xl}px;
          }
          
          .related-section h3 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 ${spacing.md}px;
          }
          
          .related-list {
            display: flex;
            flex-direction: column;
            gap: ${spacing.md}px;
          }
          
          .related-card {
            display: flex;
            gap: ${spacing.md}px;
            padding: ${spacing.sm}px;
            border-radius: ${borderRadius.lg}px;
            text-decoration: none;
          }
          
          .related-image {
            width: 80px;
            height: 60px;
            border-radius: ${borderRadius.md}px;
            object-fit: cover;
          }
          
          .related-placeholder {
            width: 80px;
            height: 60px;
            border-radius: ${borderRadius.md}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          
          .related-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .related-info h4 {
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 4px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .related-info span {
            font-size: 12px;
          }
        `}</style>
      </AppLayout>
    </>
  );
}
