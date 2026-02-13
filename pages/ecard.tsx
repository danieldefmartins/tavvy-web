/**
 * eCard Landing Page — Marketing & Conversion
 * Path: pages/ecard.tsx
 * URL: tavvy.com/ecard
 *
 * Showcases all 13 eCard templates, endorsement system,
 * use cases, and drives signups.
 */
import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  slug: string; // live demo card slug
}

const FREE_TEMPLATES: TemplateInfo[] = [
  { id: 'biz-traditional', name: 'Classic Card', description: 'Traditional business card with centered layout, company logo, and gold accents.', isPremium: false, slug: 'michael-harrison' },
  { id: 'biz-modern', name: 'Modern Card', description: 'Split-layout design with colored header and clean white contact section.', isPremium: false, slug: 'rachel-torres' },
  { id: 'biz-minimalist', name: 'Clean Card', description: 'Ultra-minimalist design with generous whitespace and refined typography.', isPremium: false, slug: 'anna-bergstrom' },
  { id: 'basic', name: 'Link Page', description: 'Social-first layout perfect for creators who want all links in one place.', isPremium: false, slug: 'sarah-mitchell' },
  { id: 'blogger', name: 'Creative Page', description: 'Expressive layout for bloggers, coaches, and content creators.', isPremium: false, slug: 'emma-rodriguez' },
  { id: 'business-card', name: 'Executive Card', description: 'Formal, executive-style card for finance, law, and consulting professionals.', isPremium: false, slug: 'james-chen' },
];

const PRO_TEMPLATES: TemplateInfo[] = [
  { id: 'pro-card', name: 'Pro Card', description: 'Gradient header with endorsement badge, ideal for tech founders and consultants.', isPremium: true, slug: 'david-kim' },
  { id: 'cover-card', name: 'Cover Card', description: 'Full-width banner image with wave divider for photographers and creatives.', isPremium: true, slug: 'maya-chen-photo' },
  { id: 'full-width', name: 'Spotlight', description: 'Hero-image spotlight layout for chefs, artists, and public figures.', isPremium: true, slug: 'chef-marcus' },
  { id: 'pro-realtor', name: 'Agent Card', description: 'Purpose-built for real estate agents with property showcase areas.', isPremium: true, slug: 'jennifer-walsh' },
  { id: 'pro-creative', name: 'Bold Card', description: 'High-impact design for creative directors and brand strategists.', isPremium: true, slug: 'alex-rivera' },
  { id: 'pro-corporate', name: 'Corporate Card', description: 'Polished corporate layout for doctors, executives, and enterprise teams.', isPremium: true, slug: 'dr-priya-sharma' },
  { id: 'premium-static', name: 'Premium Hero', description: 'Large hero imagery with premium feel for fitness, wellness, and lifestyle pros.', isPremium: true, slug: 'maya-johnson' },
];

const ALL_TEMPLATES = [...FREE_TEMPLATES, ...PRO_TEMPLATES];

const USE_CASES = [
  { icon: '⚖️', title: 'Lawyers & Attorneys', description: 'Share credentials, case specialties, and office location with a single tap.' },
  { icon: '🏠', title: 'Real Estate Agents', description: 'Showcase listings, service areas, and client testimonials on a dedicated card.' },
  { icon: '💼', title: 'Sales Representatives', description: 'Instantly share contact info at trade shows, conferences, and networking events.' },
  { icon: '🏗️', title: 'Contractors & Trades', description: 'Display licenses, service areas, and project photos to win more jobs.' },
  { icon: '🩺', title: 'Healthcare Providers', description: 'Share practice details, specialties, and booking links with patients.' },
  { icon: '🎨', title: 'Creatives & Freelancers', description: 'Portfolio-ready cards that showcase your work and link to everything.' },
];

export default function EcardLanding() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = activeFilter === 'all' ? ALL_TEMPLATES
    : activeFilter === 'free' ? FREE_TEMPLATES
    : PRO_TEMPLATES;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const sections = document.querySelectorAll('.animate-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Digital Business Cards — Tavvy eCard</title>
        <meta name="description" content="Create a stunning digital business card in minutes. 13 professional templates, endorsement system, NFC sharing, Apple & Google Wallet. Free to start." />
        <meta property="og:title" content="Digital Business Cards — Tavvy eCard" />
        <meta property="og:description" content="Create a stunning digital business card in minutes. 13 professional templates, endorsement system, NFC sharing. Free to start." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com/ecard" />
        <meta property="og:image" content="https://tavvy.com/api/og/david-kim" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Business Cards — Tavvy eCard" />
        <meta name="twitter:description" content="13 professional templates. Endorsement system. NFC sharing. Free to start." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      <div className="ecard-landing">
        {/* Navigation */}
        <nav className="landing-nav">
          <Link href="/" className="nav-logo">
            <img src="/brand/logo-icon.png" alt="Tavvy" />
            <span className="logo-text">Tavvy</span>
          </Link>
          <div className="nav-actions">
            <Link href="/app/ecard" className="nav-cta">
              Create Your Card
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero" ref={heroRef}>
          <div className="hero-glow" />
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              Now with 13 Professional Templates
            </div>
            <h1 className="hero-title">
              Your Digital<br />
              <span className="gradient-text">Business Card</span>
            </h1>
            <p className="hero-subtitle">
              Create a stunning digital card in minutes. Share via link, QR code, NFC, 
              or Apple &amp; Google Wallet. Collect endorsements. Track analytics.
            </p>
            <div className="hero-ctas">
              <Link href="/app/ecard" className="btn-primary-lg">
                Create Free Card
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <a href="#templates" className="btn-secondary-lg">
                View Templates
              </a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">13</span>
                <span className="stat-label">Templates</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-number">6</span>
                <span className="stat-label">Free Forever</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-number">NFC</span>
                <span className="stat-label">Tap to Share</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-frame">
                <img src="/images/templates/pro-card.png" alt="Pro Card Template" className="phone-screen" />
              </div>
            </div>
            <div className="phone-mockup phone-back">
              <div className="phone-frame">
                <img src="/images/templates/cover-card.png" alt="Cover Card Template" className="phone-screen" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Strip */}
        <section className="features-strip">
          <div className="strip-inner">
            {['QR Code Sharing', 'NFC Tap', 'Apple Wallet', 'Google Wallet', 'Save Contact (vCard)', 'Endorsements', 'Analytics', 'Custom Colors'].map((feature, i) => (
              <span key={i} className="strip-item">
                <span className="strip-check">&#10003;</span>
                {feature}
              </span>
            ))}
          </div>
        </section>

        {/* Template Gallery */}
        <section id="templates" className={`templates-section animate-section ${isVisible['templates'] ? 'visible' : ''}`}>
          <div className="section-header">
            <h2 className="section-title">Choose Your Template</h2>
            <p className="section-subtitle">
              From clean business cards to bold creative pages — find the perfect design for your brand.
            </p>
          </div>

          <div className="template-filters">
            <button
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Templates ({ALL_TEMPLATES.length})
            </button>
            <button
              className={`filter-btn ${activeFilter === 'free' ? 'active' : ''}`}
              onClick={() => setActiveFilter('free')}
            >
              Free ({FREE_TEMPLATES.length})
            </button>
            <button
              className={`filter-btn ${activeFilter === 'pro' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pro')}
            >
              Pro ({PRO_TEMPLATES.length})
            </button>
          </div>

          <div className="template-grid">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="template-card"
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
              >
                <div className="template-preview">
                  <img
                    src={`/images/templates/${template.id}.png`}
                    alt={template.name}
                    loading="lazy"
                  />
                  {template.isPremium && (
                    <span className="pro-badge">PRO</span>
                  )}
                  <div className={`template-overlay ${hoveredTemplate === template.id ? 'show' : ''}`}>
                    <a
                      href={`https://tavvy.com/${template.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overlay-btn"
                    >
                      Live Preview
                    </a>
                    <Link href="/app/ecard/create" className="overlay-btn overlay-btn-primary">
                      Use Template
                    </Link>
                  </div>
                </div>
                <div className="template-info">
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Endorsement Section */}
        <section id="endorsements" className={`endorsement-section animate-section ${isVisible['endorsements'] ? 'visible' : ''}`}>
          <div className="endorsement-content">
            <div className="endorsement-text">
              <div className="section-badge">Built-in Trust</div>
              <h2 className="section-title">Endorsements That<br /><span className="gradient-text">Build Credibility</span></h2>
              <p className="section-description">
                Every Tavvy eCard includes a built-in endorsement system. Clients, colleagues, 
                and partners can endorse your card with a single tap — building social proof 
                that new contacts can see instantly.
              </p>
              <div className="endorsement-features">
                <div className="endorse-feature">
                  <div className="endorse-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                  <div>
                    <strong>Star Rating Badge</strong>
                    <p>Your endorsement count displays prominently on your card as a trust signal.</p>
                  </div>
                </div>
                <div className="endorse-feature">
                  <div className="endorse-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <strong>Verified Endorsers</strong>
                    <p>Only real Tavvy users can endorse — no fake reviews, no bots.</p>
                  </div>
                </div>
                <div className="endorse-feature">
                  <div className="endorse-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <div>
                    <strong>One-Tap Endorsing</strong>
                    <p>Visitors tap the star badge to endorse — no forms, no friction.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="endorsement-visual">
              <div className="endorse-card-demo">
                <div className="endorse-badge-large">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#FFD700">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="endorse-count">36</span>
                </div>
                <p className="endorse-demo-label">Endorsements from verified users</p>
                <div className="endorse-avatars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="endorse-avatar" style={{ animationDelay: `${i * 0.2}s` }}>
                      <div className="avatar-placeholder" />
                    </div>
                  ))}
                  <span className="endorse-more">+31</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sharing Methods */}
        <section id="sharing" className={`sharing-section animate-section ${isVisible['sharing'] ? 'visible' : ''}`}>
          <div className="section-header">
            <h2 className="section-title">Share Your Card<br /><span className="gradient-text">Everywhere</span></h2>
            <p className="section-subtitle">
              Multiple ways to share your digital card — from a simple link to tapping phones together.
            </p>
          </div>
          <div className="sharing-grid">
            <div className="sharing-card">
              <div className="sharing-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3>Direct Link</h3>
              <p>Share your unique tavvy.com/yourname link via text, email, or social media.</p>
            </div>
            <div className="sharing-card">
              <div className="sharing-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="8" height="8" rx="1" />
                </svg>
              </div>
              <h3>QR Code</h3>
              <p>Generate a QR code that anyone can scan to instantly view your card.</p>
            </div>
            <div className="sharing-card">
              <div className="sharing-icon nfc-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 8.32a7.43 7.43 0 0 1 0 7.36" /><path d="M9.46 6.21a11.76 11.76 0 0 1 0 11.58" /><path d="M12.91 4.1a16.1 16.1 0 0 1 0 15.8" /><path d="M16.37 2a20.16 20.16 0 0 1 0 20" />
                </svg>
              </div>
              <h3>NFC Tap</h3>
              <p>Tap your phone to share your card instantly — no app needed for the recipient.</p>
            </div>
            <div className="sharing-card">
              <div className="sharing-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="3" /><path d="M12 10v4" /><path d="M10 12h4" />
                </svg>
              </div>
              <h3>Wallet Pass</h3>
              <p>Add to Apple Wallet or Google Wallet for instant access right from your phone.</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section id="use-cases" className={`usecases-section animate-section ${isVisible['use-cases'] ? 'visible' : ''}`}>
          <div className="section-header">
            <h2 className="section-title">Built for Every Professional</h2>
            <p className="section-subtitle">
              Whether you are a solo practitioner or part of a team, Tavvy eCards adapt to your industry.
            </p>
          </div>
          <div className="usecases-grid">
            {USE_CASES.map((useCase, i) => (
              <div key={i} className="usecase-card">
                <span className="usecase-icon">{useCase.icon}</span>
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="final-cta">
          <div className="cta-glow" />
          <div className="cta-content">
            <h2>Ready to Go Digital?</h2>
            <p>Create your professional digital business card in under 2 minutes. Free forever — upgrade anytime.</p>
            <div className="cta-buttons">
              <Link href="/app/ecard" className="btn-primary-lg btn-white">
                Create Your Free Card
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
            <p className="cta-note">No credit card required. 6 templates free forever.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <img src="/brand/logo-icon.png" alt="Tavvy" className="footer-logo" />
              <span>Tavvy</span>
            </div>
            <div className="footer-links">
              <Link href="/about-us">About</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:support@tavvy.com">Contact</a>
            </div>
            <p className="footer-copy">&copy; {new Date().getFullYear()} Tavvy, Inc. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        /* ===== BASE ===== */
        .ecard-landing {
          min-height: 100vh;
          background: #050510;
          color: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          overflow-x: hidden;
        }

        /* ===== NAV ===== */
        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
          background: rgba(5, 5, 16, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #fff;
        }
        .nav-logo img {
          height: 32px;
          width: 32px;
          max-width: 32px;
          max-height: 32px;
          object-fit: contain;
        }
        .logo-text {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .nav-cta {
          padding: 10px 24px;
          background: #3B82F6;
          color: #fff;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .nav-cta:hover {
          background: #2563EB;
          text-decoration: none;
          transform: translateY(-1px);
        }

        /* ===== HERO ===== */
        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 120px 48px 80px;
          gap: 60px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .hero-glow {
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-content {
          flex: 1;
          position: relative;
          z-index: 2;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: #93bbfc;
          margin-bottom: 24px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #3B82F6;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hero-title {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 24px;
        }
        .gradient-text {
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.6);
          max-width: 480px;
          margin-bottom: 36px;
        }
        .hero-ctas {
          display: flex;
          gap: 16px;
          margin-bottom: 48px;
        }
        .btn-primary-lg {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: #3B82F6;
          color: #fff;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s;
          border: none;
          cursor: pointer;
        }
        .btn-primary-lg:hover {
          background: #2563EB;
          text-decoration: none;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(59, 130, 246, 0.3);
        }
        .btn-secondary-lg {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 32px;
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.25s;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn-secondary-lg:hover {
          background: rgba(255, 255, 255, 0.1);
          text-decoration: none;
          transform: translateY(-2px);
        }
        .hero-stats {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .stat {
          display: flex;
          flex-direction: column;
        }
        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
        }
        .stat-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
        }
        .stat-divider {
          width: 1px;
          height: 36px;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Hero Visual */
        .hero-visual {
          position: relative;
          flex-shrink: 0;
          width: 320px;
          height: 560px;
        }
        .phone-mockup {
          position: absolute;
          width: 260px;
          height: 520px;
          border-radius: 36px;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
          transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }
        .phone-mockup:first-child {
          z-index: 2;
          top: 0;
          left: 0;
        }
        .phone-mockup.phone-back {
          z-index: 1;
          top: 40px;
          left: 80px;
          transform: rotate(6deg);
          opacity: 0.85;
        }
        .phone-frame {
          width: 100%;
          height: 100%;
          background: #111;
          border-radius: 36px;
          overflow: hidden;
        }
        .phone-screen {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
        }

        /* ===== FEATURES STRIP ===== */
        .features-strip {
          background: rgba(59, 130, 246, 0.05);
          border-top: 1px solid rgba(59, 130, 246, 0.1);
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
          padding: 20px 0;
          overflow: hidden;
        }
        .strip-inner {
          display: flex;
          gap: 40px;
          animation: scroll-strip 30s linear infinite;
          white-space: nowrap;
          width: max-content;
        }
        @keyframes scroll-strip {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .strip-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
        }
        .strip-check {
          color: #3B82F6;
          font-weight: 700;
        }

        /* ===== SECTIONS COMMON ===== */
        .section-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .section-title {
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.15;
          margin-bottom: 16px;
        }
        .section-subtitle {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.5);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .section-badge {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          color: #93bbfc;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .section-description {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.55);
          line-height: 1.7;
          margin-bottom: 32px;
        }

        /* Animate sections */
        .animate-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .animate-section.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ===== TEMPLATE GALLERY ===== */
        .templates-section {
          padding: 100px 48px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .template-filters {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 40px;
        }
        .filter-btn {
          padding: 10px 24px;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
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
          background: #3B82F6;
          border-color: #3B82F6;
          color: #fff;
        }
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .template-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.3s;
        }
        .template-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }
        .template-preview {
          position: relative;
          aspect-ratio: 9 / 16;
          overflow: hidden;
          background: #111;
        }
        .template-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top;
          transition: transform 0.5s;
        }
        .template-card:hover .template-preview img {
          transform: scale(1.03);
        }
        .pro-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          border-radius: 6px;
          letter-spacing: 0.5px;
          z-index: 3;
        }
        .template-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 2;
        }
        .template-overlay.show {
          opacity: 1;
        }
        .overlay-btn {
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.2s;
        }
        .overlay-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          text-decoration: none;
        }
        .overlay-btn-primary {
          background: #3B82F6;
          border-color: #3B82F6;
        }
        .overlay-btn-primary:hover {
          background: #2563EB;
        }
        .template-info {
          padding: 16px 20px;
        }
        .template-info h3 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .template-info p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.5;
        }

        /* ===== ENDORSEMENT SECTION ===== */
        .endorsement-section {
          padding: 100px 48px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .endorsement-content {
          display: flex;
          align-items: center;
          gap: 80px;
        }
        .endorsement-text {
          flex: 1;
        }
        .endorsement-features {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .endorse-feature {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .endorse-icon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          color: #3B82F6;
        }
        .endorse-feature strong {
          display: block;
          font-size: 15px;
          margin-bottom: 4px;
        }
        .endorse-feature p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          margin: 0;
        }
        .endorsement-visual {
          flex-shrink: 0;
          width: 340px;
        }
        .endorse-card-demo {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
        }
        .endorse-badge-large {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 28px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .endorse-count {
          font-size: 32px;
          font-weight: 800;
          color: #FFD700;
        }
        .endorse-demo-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
        }
        .endorse-avatars {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
        }
        .endorse-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #050510;
          margin-left: -8px;
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
        }
        .endorse-avatar:first-child {
          margin-left: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
        }
        .endorse-more {
          margin-left: 8px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
        }

        /* ===== SHARING SECTION ===== */
        .sharing-section {
          padding: 100px 48px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .sharing-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .sharing-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 32px 24px;
          text-align: center;
          transition: all 0.3s;
        }
        .sharing-card:hover {
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-4px);
        }
        .sharing-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.08);
          border-radius: 16px;
          margin: 0 auto 20px;
          color: #3B82F6;
        }
        .sharing-card h3 {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .sharing-card p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.5;
        }

        /* ===== USE CASES ===== */
        .usecases-section {
          padding: 100px 48px;
          max-width: 1280px;
          margin: 0 auto;
        }
        .usecases-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .usecase-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 32px 28px;
          transition: all 0.3s;
        }
        .usecase-card:hover {
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
        }
        .usecase-icon {
          font-size: 32px;
          margin-bottom: 16px;
          display: block;
        }
        .usecase-card h3 {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .usecase-card p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          line-height: 1.5;
        }

        /* ===== FINAL CTA ===== */
        .final-cta {
          position: relative;
          padding: 120px 48px;
          text-align: center;
          overflow: hidden;
        }
        .cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .cta-content {
          position: relative;
          z-index: 2;
        }
        .cta-content h2 {
          font-size: 48px;
          font-weight: 800;
          letter-spacing: -1.5px;
          margin-bottom: 16px;
        }
        .cta-content > p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 36px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .cta-buttons {
          margin-bottom: 16px;
        }
        .btn-white {
          background: #fff;
          color: #050510;
        }
        .btn-white:hover {
          background: #f0f0f0;
          color: #050510;
          box-shadow: 0 8px 30px rgba(255, 255, 255, 0.15);
        }
        .cta-note {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.35);
        }

        /* ===== FOOTER ===== */
        .landing-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          padding: 40px 48px;
        }
        .footer-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 16px;
        }
        .footer-logo {
          width: 24px;
          height: 24px;
          max-width: 24px;
          max-height: 24px;
          object-fit: contain;
        }
        .footer-links {
          display: flex;
          gap: 24px;
        }
        .footer-links a {
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #fff;
          text-decoration: none;
        }
        .footer-copy {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.25);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .hero {
            flex-direction: column;
            text-align: center;
            padding: 120px 24px 60px;
            gap: 40px;
          }
          .hero-subtitle {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-ctas {
            justify-content: center;
          }
          .hero-stats {
            justify-content: center;
          }
          .hero-visual {
            width: 280px;
            height: 480px;
          }
          .phone-mockup {
            width: 220px;
            height: 440px;
          }
          .phone-mockup.phone-back {
            left: 60px;
          }
          .endorsement-content {
            flex-direction: column;
            gap: 40px;
          }
          .endorsement-visual {
            width: 100%;
            max-width: 340px;
          }
          .sharing-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 768px) {
          .hero-title {
            font-size: 42px;
            letter-spacing: -1px;
          }
          .section-title {
            font-size: 32px;
          }
          .templates-section,
          .endorsement-section,
          .sharing-section,
          .usecases-section {
            padding: 60px 20px;
          }
          .template-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          .usecases-grid {
            grid-template-columns: 1fr;
          }
          .sharing-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .hero-ctas {
            flex-direction: column;
            align-items: center;
          }
          .footer-inner {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          .cta-content h2 {
            font-size: 36px;
          }
          .final-cta {
            padding: 80px 24px;
          }
          .landing-nav {
            padding: 12px 16px;
          }
        }
        @media (max-width: 480px) {
          .hero-title {
            font-size: 36px;
          }
          .template-grid {
            grid-template-columns: 1fr;
            max-width: 320px;
            margin: 0 auto;
          }
          .sharing-grid {
            grid-template-columns: 1fr;
          }
          .hero-visual {
            width: 240px;
            height: 420px;
          }
          .phone-mockup {
            width: 190px;
            height: 380px;
            border-radius: 28px;
          }
          .phone-frame {
            border-radius: 28px;
          }
          .phone-mockup.phone-back {
            left: 50px;
          }
        }
      `}</style>
    </>
  );
}
