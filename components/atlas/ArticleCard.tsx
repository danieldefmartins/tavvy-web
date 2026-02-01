/**
 * ARTICLE CARD COMPONENT - Atlas v2.0 (Web Version)
 * Reusable card component for displaying articles
 * Matches iOS design from tavvy-mobile
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IoHeart, IoTime } from 'react-icons/io5';

const TEAL_PRIMARY = '#14b8a6';

interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    slug?: string;
    excerpt?: string;
    cover_image_url?: string;
    author_name?: string;
    author_avatar_url?: string;
    read_time_minutes?: number;
    love_count?: number;
    category?: {
      name: string;
      color: string;
    };
  };
  variant?: 'horizontal' | 'vertical' | 'featured';
  isDark?: boolean;
  theme?: {
    text: string;
    textSecondary: string;
    surface: string;
    cardBackground: string;
  };
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100';

export default function ArticleCard({ article, variant = 'horizontal', isDark = false, theme }: ArticleCardProps) {
  const router = useRouter();
  const { locale } = router;
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const textColor = theme?.text || (isDark ? '#F5F5F5' : '#1F2937');
  const secondaryTextColor = theme?.textSecondary || (isDark ? '#9CA3AF' : '#6B7280');
  const surfaceColor = theme?.surface || (isDark ? '#1F2937' : '#FFFFFF');

  if (variant === 'featured') {
    return (
      <Link
        href={`/app/article/${article.slug || article.id} locale={locale}`}
        className="featured-card"
      >
        <img
          src={article.cover_image_url || PLACEHOLDER_IMAGE}
          alt={article.title}
          className="featured-image"
        />
        <div className="featured-gradient">
          <div className="featured-label">
            <span>FEATURED</span>
          </div>
          <h2 className="featured-title">{article.title}</h2>
          <div className="author-row">
            <img
              src={article.author_avatar_url || PLACEHOLDER_AVATAR}
              alt={article.author_name}
              className="author-avatar"
            />
            <span className="author-name">
              By {article.author_name || 'Tavvy Team'}
            </span>
          </div>
        </div>

        <style jsx>{`
          .featured-card {
            display: block;
            border-radius: 20px;
            overflow: hidden;
            height: 320px;
            position: relative;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .featured-card:hover {
            transform: scale(1.01);
          }

          .featured-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .featured-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 24px;
            padding-top: 80px;
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
          }

          .featured-label {
            display: inline-block;
            background: #667EEA;
            padding: 6px 12px;
            border-radius: 8px;
            margin-bottom: 12px;
          }

          .featured-label span {
            color: white;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .featured-title {
            font-size: 22px;
            font-weight: 700;
            color: white;
            margin: 0 0 12px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .author-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .author-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255,255,255,0.3);
          }

          .author-name {
            font-size: 14px;
            color: rgba(255,255,255,0.9);
            font-weight: 500;
          }
        `}</style>
      </Link>
    );
  }

  if (variant === 'vertical') {
    return (
      <Link
        href={`/app/article/${article.slug || article.id} locale={locale}`}
        className="vertical-card"
      >
        <img
          src={article.cover_image_url || PLACEHOLDER_IMAGE}
          alt={article.title}
          className="card-image"
        />
        <div className="card-content">
          <h3 className="card-title">{article.title}</h3>
          {article.excerpt && (
            <p className="card-excerpt">{article.excerpt}</p>
          )}
          <div className="card-meta">
            <span>{article.author_name || 'Tavvy Team'}</span>
            {article.read_time_minutes && (
              <>
                <span className="dot">•</span>
                <span><IoTime size={12} /> {article.read_time_minutes} min</span>
              </>
            )}
          </div>
        </div>

        <style jsx>{`
          .vertical-card {
            display: block;
            background: ${surfaceColor};
            border-radius: 16px;
            overflow: hidden;
            text-decoration: none;
            transition: transform 0.2s;
            box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'};
          }

          .vertical-card:hover {
            transform: scale(1.02);
          }

          .card-image {
            width: 100%;
            height: 140px;
            object-fit: cover;
          }

          .card-content {
            padding: 14px;
          }

          .card-title {
            font-size: 15px;
            font-weight: 600;
            color: ${textColor};
            margin: 0 0 8px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-excerpt {
            font-size: 13px;
            color: ${secondaryTextColor};
            margin: 0 0 8px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-meta {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: ${secondaryTextColor};
          }

          .dot {
            margin: 0 2px;
          }
        `}</style>
      </Link>
    );
  }

  // Default: horizontal variant
  return (
    <Link
      href={`/app/article/${article.slug || article.id} locale={locale}`}
      className="horizontal-card"
    >
      <img
        src={article.cover_image_url || PLACEHOLDER_IMAGE}
        alt={article.title}
        className="card-image"
      />
      <div className="card-content">
        {article.category && (
          <div
            className="category-badge"
            style={{ backgroundColor: article.category.color || TEAL_PRIMARY }}
          >
            {article.category.name || 'ARTICLE'}
          </div>
        )}
        <h3 className="card-title">{article.title}</h3>
        {article.excerpt && (
          <p className="card-excerpt">{article.excerpt}</p>
        )}
        <div className="card-meta">
          <span>{article.author_name || 'Tavvy Team'}</span>
          <span className="dot">•</span>
          <span>{article.read_time_minutes || 5} min read</span>
          {article.love_count && article.love_count > 0 && (
            <>
              <span className="dot">•</span>
              <span className="loves">
                <IoHeart size={12} color="#ef4444" />
                {formatNumber(article.love_count)}
              </span>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .horizontal-card {
          display: flex;
          background: ${surfaceColor};
          border-radius: 12px;
          overflow: hidden;
          text-decoration: none;
          transition: transform 0.2s;
          box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'};
        }

        .horizontal-card:hover {
          transform: scale(1.01);
        }

        .card-image {
          width: 120px;
          height: 140px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .card-content {
          flex: 1;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .category-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          color: white;
          margin-bottom: 6px;
          align-self: flex-start;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: ${textColor};
          margin: 0 0 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-excerpt {
          font-size: 13px;
          color: ${secondaryTextColor};
          margin: 0 0 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          font-size: 12px;
          color: ${secondaryTextColor};
        }

        .dot {
          margin: 0 2px;
        }

        .loves {
          display: flex;
          align-items: center;
          gap: 3px;
        }

        @media (max-width: 480px) {
          .card-image {
            width: 100px;
            height: 120px;
          }
        }
      `}</style>
    </Link>
  );
}
