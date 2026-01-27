/**
 * UNIVERSE CARD COMPONENT - Atlas v2.0 (Web Version)
 * Reusable card component for displaying universes
 * Matches iOS design from tavvy-mobile
 */

import React from 'react';
import Link from 'next/link';
import { IoLocationOutline, IoDocumentTextOutline } from 'react-icons/io5';

const TEAL_PRIMARY = '#14b8a6';

interface UniverseCardProps {
  universe: {
    id: string;
    name: string;
    slug?: string;
    location?: string;
    banner_image_url?: string;
    place_count?: number;
    article_count?: number;
  };
  variant?: 'default' | 'compact' | 'large';
  isDark?: boolean;
  theme?: {
    text: string;
    textSecondary: string;
    surface: string;
  };
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function UniverseCard({ universe, variant = 'default', isDark = false, theme }: UniverseCardProps) {
  const textColor = theme?.text || (isDark ? '#F5F5F5' : '#1F2937');
  const secondaryTextColor = theme?.textSecondary || (isDark ? '#9CA3AF' : '#6B7280');
  const surfaceColor = theme?.surface || (isDark ? '#1F2937' : '#FFFFFF');

  if (variant === 'large') {
    return (
      <Link
        href={`/app/atlas/universe/${universe.slug || universe.id}`}
        className="large-card"
      >
        <img
          src={universe.banner_image_url || PLACEHOLDER_IMAGE}
          alt={universe.name}
          className="card-image"
        />
        <div className="card-gradient">
          <div className="universe-badge">
            <span>UNIVERSE</span>
          </div>
          <h2 className="card-title">{universe.name}</h2>
          {universe.location && (
            <p className="card-location">{universe.location}</p>
          )}
          <div className="card-stats">
            <span>
              <IoLocationOutline size={14} />
              {universe.place_count || 0} places
            </span>
            <span>
              <IoDocumentTextOutline size={14} />
              {universe.article_count || 0} articles
            </span>
          </div>
        </div>

        <style jsx>{`
          .large-card {
            display: block;
            border-radius: 20px;
            overflow: hidden;
            height: 240px;
            position: relative;
            text-decoration: none;
            transition: transform 0.2s;
          }

          .large-card:hover {
            transform: scale(1.01);
          }

          .card-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .card-gradient {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 20px;
            padding-top: 60px;
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
          }

          .universe-badge {
            display: inline-block;
            background: ${TEAL_PRIMARY};
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 8px;
          }

          .universe-badge span {
            color: white;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
          }

          .card-title {
            font-size: 22px;
            font-weight: 700;
            color: white;
            margin: 0 0 4px;
          }

          .card-location {
            font-size: 14px;
            color: rgba(255,255,255,0.8);
            margin: 0 0 12px;
          }

          .card-stats {
            display: flex;
            gap: 16px;
          }

          .card-stats span {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: rgba(255,255,255,0.9);
          }
        `}</style>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/app/atlas/universe/${universe.slug || universe.id}`}
        className="compact-card"
      >
        <img
          src={universe.banner_image_url || PLACEHOLDER_IMAGE}
          alt={universe.name}
          className="card-image"
        />
        <div className="card-info">
          <span className="card-name">{universe.name}</span>
          <span className="card-count">{universe.place_count || 0} places</span>
        </div>

        <style jsx>{`
          .compact-card {
            display: block;
            border-radius: 12px;
            overflow: hidden;
            background: ${surfaceColor};
            text-decoration: none;
            transition: transform 0.2s;
          }

          .compact-card:hover {
            transform: scale(1.02);
          }

          .card-image {
            width: 100%;
            height: 100px;
            object-fit: cover;
          }

          .card-info {
            padding: 12px;
          }

          .card-name {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: ${textColor};
            margin-bottom: 4px;
          }

          .card-count {
            font-size: 12px;
            color: ${secondaryTextColor};
          }
        `}</style>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/app/atlas/universe/${universe.slug || universe.id}`}
      className="default-card"
    >
      <img
        src={universe.banner_image_url || PLACEHOLDER_IMAGE}
        alt={universe.name}
        className="card-image"
      />
      <div className="card-content">
        <div className="universe-badge">
          <span>UNIVERSE</span>
        </div>
        <h3 className="card-title">{universe.name}</h3>
        {universe.location && (
          <p className="card-location">{universe.location}</p>
        )}
        <div className="card-stats">
          <span>
            <IoLocationOutline size={14} />
            {universe.place_count || 0} places
          </span>
          <span>
            <IoDocumentTextOutline size={14} />
            {universe.article_count || 0} articles
          </span>
        </div>
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

        .card-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }

        .card-content {
          padding: 16px;
        }

        .universe-badge {
          display: inline-block;
          background: ${TEAL_PRIMARY};
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .universe-badge span {
          color: white;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: ${textColor};
          margin: 0 0 4px;
        }

        .card-location {
          font-size: 14px;
          color: ${secondaryTextColor};
          margin: 0 0 12px;
        }

        .card-stats {
          display: flex;
          gap: 16px;
        }

        .card-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: ${secondaryTextColor};
        }
      `}</style>
    </Link>
  );
}
