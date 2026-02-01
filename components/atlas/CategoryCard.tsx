/**
 * CATEGORY CARD COMPONENT - Atlas v2.0 (Web Version)
 * Reusable card component for displaying categories
 * Matches iOS design from tavvy-mobile
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug?: string;
    icon?: string;
    color?: string;
    description?: string;
    article_count?: number;
  };
  variant?: 'default' | 'compact' | 'chip';
  isDark?: boolean;
  theme?: {
    text: string;
    textSecondary: string;
    surface: string;
  };
}

export default function CategoryCard({ category, variant = 'default', isDark = false, theme }: CategoryCardProps) {
  const router = useRouter();
  const { locale } = router;
  const textColor = theme?.text || (isDark ? '#F5F5F5' : '#1F2937');
  const secondaryTextColor = theme?.textSecondary || (isDark ? '#9CA3AF' : '#6B7280');
  const surfaceColor = theme?.surface || (isDark ? '#1F2937' : '#FFFFFF');
  const categoryColor = category.color || '#14b8a6';

  if (variant === 'chip') {
    return (
      <Link
        href={`/app/atlas/category/${category.slug || category.id} locale={locale}`}
        className="chip-card"
        style={{ backgroundColor: `${categoryColor}20` }}
      >
        <span className="chip-icon">{category.icon || '📚'}</span>
        <span className="chip-name">{category.name}</span>

        <style jsx>{`
          .chip-card {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            border-radius: 20px;
            text-decoration: none;
            transition: transform 0.2s, opacity 0.2s;
          }

          .chip-card:hover {
            transform: scale(1.02);
            opacity: 0.9;
          }

          .chip-icon {
            font-size: 18px;
          }

          .chip-name {
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
          }
        `}</style>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/app/atlas/category/${category.slug || category.id} locale={locale}`}
        className="compact-card"
      >
        <div 
          className="icon-container"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <span className="category-icon">{category.icon || '📚'}</span>
        </div>
        <span className="category-name">{category.name}</span>

        <style jsx>{`
          .compact-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .compact-card:hover {
            transform: scale(1.05);
          }

          .icon-container {
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .category-icon {
            font-size: 28px;
          }

          .category-name {
            font-size: 13px;
            font-weight: 600;
            color: ${textColor};
            text-align: center;
          }
        `}</style>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/app/atlas/category/${category.slug || category.id} locale={locale}`}
      className="default-card"
    >
      <div 
        className="card-header"
        style={{ backgroundColor: `${categoryColor}20` }}
      >
        <span className="category-icon">{category.icon || '📚'}</span>
      </div>
      <div className="card-content">
        <h3 className="category-name">{category.name}</h3>
        {category.description && (
          <p className="category-description">{category.description}</p>
        )}
        <span className="article-count">
          {category.article_count || 0} articles
        </span>
      </div>

      <style jsx>{`
        .default-card {
          display: block;
          background: ${surfaceColor};
          border-radius: 16px;
          overflow: hidden;
          text-decoration: none;
          transition: transform 0.2s;
          box-shadow: ${isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'};
        }

        .default-card:hover {
          transform: scale(1.02);
        }

        .card-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-icon {
          font-size: 48px;
        }

        .card-content {
          padding: 16px;
        }

        .category-name {
          font-size: 18px;
          font-weight: 700;
          color: ${textColor};
          margin: 0 0 8px;
        }

        .category-description {
          font-size: 14px;
          color: ${secondaryTextColor};
          margin: 0 0 12px;
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-count {
          font-size: 13px;
          color: ${categoryColor};
          font-weight: 600;
        }
      `}</style>
    </Link>
  );
}
