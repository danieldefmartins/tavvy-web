/**
 * eCard Template Gallery — Hub Page
 * Path: pages/ecard/templates.tsx
 * URL: /ecard/templates
 *
 * Premium showcase of ALL eCard templates in every color scheme variation.
 * Horizontal scroll rows with phone frames and scroll-snap.
 */
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { TEMPLATES, Template, ColorScheme } from '../../config/eCardTemplates';
import { FullCardPreview } from '../../components/ecard/wizard/FullCardPreview';

type FilterType = 'all' | 'free' | 'pro';

export default function TemplatesHub() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    if (activeFilter === 'free') return TEMPLATES.filter((t) => !t.isPremium);
    if (activeFilter === 'pro') return TEMPLATES.filter((t) => t.isPremium);
    return TEMPLATES;
  }, [activeFilter]);

  const freeCount = TEMPLATES.filter((t) => !t.isPremium).length;
  const proCount = TEMPLATES.filter((t) => t.isPremium).length;

  /** Build a template clone with a specific color scheme forced to index 0 */
  function withColorScheme(template: Template, scheme: ColorScheme): Template {
    return { ...template, colorSchemes: [scheme, ...template.colorSchemes.filter((s) => s.id !== scheme.id)] };
  }

  return (
    <div className="templates-hub">
      <Head>
        <title>eCard Templates Gallery — Tavvy</title>
        <meta name="description" content="Browse every Tavvy eCard template in every color scheme. Premium digital business card designs for professionals, creatives, and businesses." />
        <meta property="og:title" content="eCard Templates Gallery — Tavvy" />
        <meta property="og:description" content="Browse every Tavvy eCard template in every color. Premium digital business card designs." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com/ecard/templates" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {/* ---- Navigation ---- */}
      <nav className="hub-nav">
        <Link href="/" className="nav-logo">
          <img src="/brand/tavvy-logo-horizontal-light.png" alt="Tavvy" className="nav-logo-img" />
        </Link>
        <div className="nav-actions">
          <Link href="/ecard" className="nav-link-back">
            eCard Home
          </Link>
          <Link href="/app/ecard/create" className="nav-cta">
            Create Your Card
          </Link>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="hub-hero">
        <div className="hero-glow" />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="badge-dot" />
            {TEMPLATES.length} Templates &middot; {TEMPLATES.reduce((n, t) => n + t.colorSchemes.length, 0)} Color Variations
          </div>
          <h1 className="hero-title">
            Every Template.<br />
            <span className="gradient-text">Every Color.</span>
          </h1>
          <p className="hero-subtitle">
            Scroll through each template in all its color variations.
            Find the perfect look, then create your card in minutes.
          </p>
        </div>
      </section>

      {/* ---- Filter Bar ---- */}
      <div className="filter-bar">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All ({TEMPLATES.length})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'free' ? 'active' : ''}`}
          onClick={() => setActiveFilter('free')}
        >
          Free ({freeCount})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'pro' ? 'active' : ''}`}
          onClick={() => setActiveFilter('pro')}
        >
          Pro ({proCount})
        </button>
      </div>

      {/* ---- Template Rows ---- */}
      <div className="template-rows">
        {filteredTemplates.map((template) => (
          <section key={template.id} className="template-section">
            <div className="section-head">
              <div className="section-title-row">
                <h2 className="section-name">{template.name}</h2>
                {template.isPremium && <span className="pro-tag">PRO</span>}
              </div>
              <p className="section-desc">{template.description}</p>
              <span className="scheme-count">{template.colorSchemes.length} color schemes</span>
            </div>

            <div className="scroll-row">
              {template.colorSchemes.map((scheme) => {
                const cardKey = `${template.id}-${scheme.id}`;
                const isHovered = hoveredCard === cardKey;
                return (
                  <div
                    key={cardKey}
                    className="card-slot"
                    onMouseEnter={() => setHoveredCard(cardKey)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className="phone-frame">
                      <div className="phone-notch" />
                      <div className="phone-screen">
                        <FullCardPreview tmpl={withColorScheme(template, scheme)} />
                      </div>
                      {/* Hover overlay */}
                      <div className={`card-overlay ${isHovered ? 'visible' : ''}`}>
                        <Link href="/app/ecard/create" className="overlay-cta">
                          Use This Template
                        </Link>
                      </div>
                    </div>
                    <div className="card-label">
                      <div
                        className="swatch"
                        style={{ background: scheme.primary }}
                      />
                      <span className="scheme-name">{scheme.name}</span>
                      {scheme.isFree && <span className="free-chip">Free</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ---- Bottom CTA ---- */}
      <section className="bottom-cta">
        <div className="cta-glow" />
        <div className="cta-inner">
          <h2>Ready to Stand Out?</h2>
          <p>Pick a template, customize your colors, and share your card in minutes.</p>
          <Link href="/app/ecard/create" className="btn-primary">
            Create Your Card
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
          <span className="cta-note">No credit card required. Free forever plan available.</span>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="hub-footer">
        <div className="footer-inner">
          <img src="/brand/tavvy-logo-horizontal-light.png" alt="Tavvy" className="footer-logo" />
          <div className="footer-links">
            <Link href="/ecard">eCard Home</Link>
            <Link href="/about-us">About</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
          <p className="footer-copy">&copy; {new Date().getFullYear()} Tavvy, Inc. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        /* ===== BASE ===== */
        .templates-hub {
          min-height: 100vh;
          background: #0a0a0a;
          color: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
        }

        /* ===== NAV ===== */
        .hub-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 32px;
          background: rgba(10, 10, 10, 0.88);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .nav-logo-img {
          height: 30px;
          width: auto;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-link-back {
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link-back:hover {
          color: #fff;
        }
        .nav-cta {
          padding: 9px 22px;
          background: #8A05BE;
          color: #fff;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .nav-cta:hover {
          background: #7a04a8;
          transform: translateY(-1px);
        }

        /* ===== HERO ===== */
        .hub-hero {
          position: relative;
          padding: 140px 32px 60px;
          text-align: center;
          overflow: hidden;
        }
        .hero-glow {
          position: absolute;
          top: -60px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(138, 5, 190, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-inner {
          position: relative;
          z-index: 2;
          max-width: 700px;
          margin: 0 auto;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: rgba(138, 5, 190, 0.1);
          border: 1px solid rgba(138, 5, 190, 0.2);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.7);
          margin-bottom: 24px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #8A05BE;
          border-radius: 50%;
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -2px;
          margin: 0 0 20px;
        }
        .gradient-text {
          background: linear-gradient(135deg, #8A05BE 0%, #00C2CB 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 17px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.5);
          max-width: 500px;
          margin: 0 auto;
        }

        /* ===== FILTER BAR ===== */
        .filter-bar {
          position: sticky;
          top: 60px;
          z-index: 90;
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          background: rgba(10, 10, 10, 0.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .filter-btn {
          padding: 9px 24px;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(255, 255, 255, 0.55);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .filter-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .filter-btn.active {
          background: #8A05BE;
          border-color: #8A05BE;
          color: #fff;
        }

        /* ===== TEMPLATE ROWS ===== */
        .template-rows {
          max-width: 100%;
          padding: 40px 0 60px;
        }
        .template-section {
          margin-bottom: 64px;
        }
        .section-head {
          padding: 0 48px 20px;
        }
        .section-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .section-name {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
          margin: 0;
        }
        .pro-tag {
          display: inline-block;
          padding: 3px 10px;
          background: linear-gradient(135deg, #8A05BE, #EC4899);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          letter-spacing: 0.5px;
        }
        .section-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.4);
          margin: 0 0 4px;
          line-height: 1.5;
        }
        .scheme-count {
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          font-weight: 500;
        }

        /* ===== SCROLL ROW ===== */
        .scroll-row {
          display: flex;
          gap: 24px;
          padding: 8px 48px 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-padding: 48px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .scroll-row::-webkit-scrollbar {
          height: 6px;
        }
        .scroll-row::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-row::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
        }
        .scroll-row::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }

        /* ===== CARD SLOT ===== */
        .card-slot {
          flex-shrink: 0;
          width: 280px;
          scroll-snap-align: start;
          transition: transform 0.3s ease;
        }
        .card-slot:hover {
          transform: translateY(-6px);
        }

        /* ===== PHONE FRAME ===== */
        .phone-frame {
          position: relative;
          width: 280px;
          background: #1a1a2e;
          border-radius: 32px;
          padding: 10px 8px 14px;
          border: 2px solid rgba(255,255,255,0.08);
          box-shadow:
            0 8px 40px rgba(0,0,0,0.5),
            0 2px 8px rgba(0,0,0,0.25),
            inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .card-slot:hover .phone-frame {
          border-color: rgba(138, 5, 190, 0.35);
          box-shadow:
            0 16px 56px rgba(138, 5, 190, 0.12),
            0 4px 16px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .phone-notch {
          width: 80px;
          height: 5px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          margin: 2px auto 8px;
        }
        .phone-screen {
          border-radius: 22px;
          overflow: hidden;
          aspect-ratio: 9 / 16;
          background: #0d0d15;
          position: relative;
        }

        /* ===== HOVER OVERLAY ===== */
        .card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 5;
          border-radius: 32px;
          pointer-events: none;
        }
        .card-overlay.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .overlay-cta {
          padding: 12px 28px;
          background: #8A05BE;
          color: #fff;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .overlay-cta:hover {
          background: #7a04a8;
          transform: scale(1.05);
          text-decoration: none;
        }

        /* ===== CARD LABEL ===== */
        .card-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 4px 0;
        }
        .swatch {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.15);
          flex-shrink: 0;
        }
        .scheme-name {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
        }
        .free-chip {
          font-size: 10px;
          font-weight: 700;
          color: #00C853;
          background: rgba(0, 200, 83, 0.1);
          border: 1px solid rgba(0, 200, 83, 0.2);
          padding: 2px 8px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ===== BOTTOM CTA ===== */
        .bottom-cta {
          position: relative;
          padding: 100px 32px;
          text-align: center;
          overflow: hidden;
        }
        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          height: 350px;
          background: radial-gradient(ellipse, rgba(138, 5, 190, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-inner {
          position: relative;
          z-index: 2;
        }
        .cta-inner h2 {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin: 0 0 12px;
        }
        .cta-inner p {
          font-size: 17px;
          color: rgba(255,255,255,0.45);
          margin: 0 0 32px;
          max-width: 440px;
          margin-left: auto;
          margin-right: auto;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          background: #8A05BE;
          color: #fff;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s;
        }
        .btn-primary:hover {
          background: #7a04a8;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(138, 5, 190, 0.3);
          text-decoration: none;
        }
        .cta-note {
          display: block;
          margin-top: 16px;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
        }

        /* ===== FOOTER ===== */
        .hub-footer {
          border-top: 1px solid rgba(255,255,255,0.06);
          padding: 36px 32px;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-logo {
          height: 20px;
          width: auto;
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-links a {
          color: rgba(255,255,255,0.4);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #fff;
        }
        .footer-copy {
          font-size: 13px;
          color: rgba(255,255,255,0.2);
          margin: 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .hub-hero {
            padding: 120px 20px 40px;
          }
          .hero-title {
            font-size: 38px;
            letter-spacing: -1px;
          }
          .hero-subtitle {
            font-size: 15px;
          }
          .section-head {
            padding: 0 20px 16px;
          }
          .section-name {
            font-size: 22px;
          }
          .scroll-row {
            padding: 8px 20px 16px;
            gap: 16px;
            scroll-padding: 20px;
          }
          .card-slot {
            width: 240px;
          }
          .phone-frame {
            width: 240px;
          }
          .filter-bar {
            top: 54px;
            padding: 12px 16px;
          }
          .hub-nav {
            padding: 12px 16px;
          }
          .nav-logo-img {
            height: 24px;
          }
          .bottom-cta {
            padding: 60px 20px;
          }
          .cta-inner h2 {
            font-size: 32px;
          }
          .footer-inner {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .hero-title {
            font-size: 32px;
          }
          .card-slot {
            width: 220px;
          }
          .phone-frame {
            width: 220px;
          }
          .nav-cta {
            padding: 7px 14px;
            font-size: 12px;
          }
          .nav-link-back {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
