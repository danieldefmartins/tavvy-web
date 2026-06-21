/**
 * eCard Landing Page — Marketing & Conversion
 * Path: pages/ecard.tsx
 * URL: tavvy.com/ecard
 *
 * Showcases all 13 eCard templates, endorsement system,
 * use cases, and drives signups.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { getUserCards, CardData } from '../lib/ecard';
import { getTemplateById } from '../config/eCardTemplates';
import { FullCardPreview } from '../components/ecard/wizard/FullCardPreview';

interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  slug: string; // live demo card slug
  colors?: { name: string; c1: string; c2: string }[];
}

const FREE_TEMPLATES: TemplateInfo[] = [
  { id: 'biz-traditional', name: 'Classic Card', description: 'Traditional business card with centered layout, company logo, and gold accents.', isPremium: false, slug: 'michael-harrison', colors: [{ name: 'Navy & Gold', c1: '#0c1b3a', c2: '#c9a84c' }, { name: 'Charcoal', c1: '#2d2d2d', c2: '#a0a0a0' }, { name: 'Burgundy', c1: '#5a1a1a', c2: '#c8a87c' }, { name: 'Forest', c1: '#1a3c2a', c2: '#d4c5a0' }, { name: 'Black', c1: '#111111', c2: '#e0e0e0' }] },
  { id: 'biz-modern', name: 'Modern Card', description: 'Split-layout design with colored header and clean white contact section.', isPremium: false, slug: 'rachel-torres', colors: [{ name: 'Deep Blue', c1: '#0f2b5b', c2: '#3b82f6' }, { name: 'Slate & Amber', c1: '#1e293b', c2: '#f59e0b' }, { name: 'Teal & Gold', c1: '#134e4a', c2: '#d4af37' }, { name: 'Purple', c1: '#4c1d95', c2: '#f43f5e' }, { name: 'Emerald', c1: '#064e3b', c2: '#fef3c7' }] },
  { id: 'biz-minimalist', name: 'Clean Card', description: 'Ultra-minimalist design with generous whitespace and refined typography.', isPremium: false, slug: 'anna-bergstrom', colors: [{ name: 'White & Black', c1: '#ffffff', c2: '#111111' }, { name: 'Warm Gray', c1: '#fafaf9', c2: '#44403c' }, { name: 'Cream & Navy', c1: '#faf8f5', c2: '#1e3a5f' }, { name: 'Snow & Sage', c1: '#f8faf9', c2: '#3f6b5e' }] },
  { id: 'basic', name: 'Link Page', description: 'Social-first layout perfect for creators who want all links in one place.', isPremium: false, slug: 'sarah-mitchell', colors: [{ name: 'Light', c1: '#FFFFFF', c2: '#2d3436' }, { name: 'Dark', c1: '#1a1a2e', c2: '#e94560' }, { name: 'Green', c1: '#00C853', c2: '#004D40' }, { name: 'Ocean', c1: '#1E90FF', c2: '#00BFFF' }, { name: 'Sunset', c1: '#f97316', c2: '#ec4899' }, { name: 'Purple', c1: '#581c87', c2: '#9333ea' }] },
  { id: 'blogger', name: 'Creative Page', description: 'Expressive layout for bloggers, coaches, and content creators.', isPremium: false, slug: 'emma-rodriguez', colors: [{ name: 'Blush', c1: '#f8e8ee', c2: '#d4a0a0' }, { name: 'Lavender', c1: '#e8e0f0', c2: '#9575cd' }, { name: 'Mint', c1: '#e0f2f1', c2: '#80cbc4' }, { name: 'Peach', c1: '#fff3e0', c2: '#ff8a65' }] },
  { id: 'business-card', name: 'Executive Card', description: 'Formal, executive-style card for finance, law, and consulting professionals.', isPremium: false, slug: 'james-chen', colors: [{ name: 'Navy & Gold', c1: '#0c1b3a', c2: '#c9a84c' }, { name: 'Charcoal', c1: '#2d2d2d', c2: '#a0a0a0' }, { name: 'Forest', c1: '#1a3c2a', c2: '#d4c5a0' }] },
  { id: 'church', name: 'Faith Page', description: 'Beautiful church page with service times, sermons, giving button, and community events.', isPremium: false, slug: 'tdm-church', colors: [{ name: 'Deep Blue', c1: '#0a1628', c2: '#1e3a5f' }, { name: 'Warm Gold', c1: '#2d1810', c2: '#c9a84c' }, { name: 'Purple Grace', c1: '#1a0a2e', c2: '#8A05BE' }] },
];

const PRO_TEMPLATES: TemplateInfo[] = [
  { id: 'pro-card', name: 'Pro Card', description: 'Gradient header with endorsement badge, ideal for tech founders and consultants.', isPremium: true, slug: 'david-kim', colors: [{ name: 'Electric Blue', c1: '#0066FF', c2: '#00D4FF' }, { name: 'Dark Gold', c1: '#1a1a2e', c2: '#d4af37' }, { name: 'Purple Fire', c1: '#4c1d95', c2: '#f43f5e' }] },
  { id: 'cover-card', name: 'Cover Card', description: 'Full-width banner image with wave divider for photographers and creatives.', isPremium: true, slug: 'maya-chen-photo', colors: [{ name: 'Navy & Gold', c1: '#0f172a', c2: '#d4af37' }, { name: 'Blue & Slate', c1: '#1e40af', c2: '#64748b' }, { name: 'Rose & Blush', c1: '#be185d', c2: '#fce7f3' }] },
  { id: 'full-width', name: 'Spotlight', description: 'Hero-image spotlight layout for chefs, artists, and public figures.', isPremium: true, slug: 'chef-marcus', colors: [{ name: 'Noir', c1: '#0a0a0a', c2: '#333333' }, { name: 'Wine', c1: '#4a0e1c', c2: '#c2185b' }, { name: 'Gold', c1: '#1a1508', c2: '#d4af37' }] },
  { id: 'pro-realtor', name: 'Agent Card', description: 'Purpose-built for real estate agents with property showcase areas.', isPremium: true, slug: 'jennifer-walsh', colors: [{ name: 'Navy', c1: '#0c1b3a', c2: '#3b82f6' }, { name: 'Green', c1: '#064e3b', c2: '#10b981' }, { name: 'Burgundy', c1: '#4a0e1c', c2: '#c8a87c' }] },
  { id: 'pro-creative', name: 'Bold Card', description: 'High-impact design for creative directors and brand strategists.', isPremium: true, slug: 'alex-rivera', colors: [{ name: 'Neon', c1: '#0a0a0a', c2: '#00ff88' }, { name: 'Hot Pink', c1: '#1a1a2e', c2: '#ff006e' }, { name: 'Electric', c1: '#0f0f23', c2: '#00d4ff' }] },
  { id: 'pro-corporate', name: 'Corporate Card', description: 'Polished corporate layout for doctors, executives, and enterprise teams.', isPremium: true, slug: 'dr-priya-sharma', colors: [{ name: 'Navy', c1: '#0c1b3a', c2: '#c9a84c' }, { name: 'Slate', c1: '#1e293b', c2: '#94a3b8' }, { name: 'Teal', c1: '#134e4a', c2: '#0d9488' }] },
  { id: 'premium-static', name: 'Premium Hero', description: 'Large hero imagery with premium feel for fitness, wellness, and lifestyle pros.', isPremium: true, slug: 'maya-johnson', colors: [{ name: 'Dark', c1: '#0a0a0a', c2: '#ffffff' }, { name: 'Warm', c1: '#2d1810', c2: '#f59e0b' }, { name: 'Cool', c1: '#0f172a', c2: '#38bdf8' }] },
];

const ALL_TEMPLATES = [...FREE_TEMPLATES, ...PRO_TEMPLATES];

const USE_CASES = [
  { icon: '⚖️', title: 'Lawyers & Attorneys', description: 'Share credentials, case specialties, and office location with a single tap.' },
  { icon: '🏠', title: 'Real Estate Agents', description: 'Showcase listings, service areas, and client testimonials on a dedicated card.' },
  { icon: '💼', title: 'Sales Representatives', description: 'Instantly share contact info at trade shows, conferences, and networking events.' },
  { icon: '🏗️', title: 'Contractors & Trades', description: 'Display licenses, service areas, and project photos to win more jobs.' },
  { icon: '🩺', title: 'Healthcare Providers', description: 'Share practice details, specialties, and booking links with patients.' },
  { icon: '🎨', title: 'Creatives & Freelancers', description: 'Portfolio-ready cards that showcase your work and link to everything.' },
  { icon: '⛪', title: 'Churches & Ministries', description: 'Share service times, sermons, giving links, and events — all on one beautiful Faith Page.' },
];

export default function EcardLanding() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const heroRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [userCards, setUserCards] = useState<CardData[]>([]);
  const router = useRouter();
  const forPlace = typeof router.query.for === 'string' ? router.query.for : '';

  const setCardRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserCards(user.id).then(setUserCards).catch(() => {});
  }, [user]);

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

  // Stagger animation for template cards
  useEffect(() => {
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute('data-card-id');
          if (id && entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(id));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
    );

    cardRefs.current.forEach((el) => cardObserver.observe(el));
    return () => cardObserver.disconnect();
  }, [activeFilter]);

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
            <img src="/brand/tavvy-logo-horizontal-light.png" alt="Tavvy" className="nav-logo-img" />
          </Link>
          <div className="nav-actions">
            <Link href="/app/ecard" className="nav-cta">
              Create Your Card
            </Link>
          </div>
        </nav>

        {/* Place-context banner — shown when someone taps the eCard on a place that hasn't claimed one */}
        {forPlace && (
          <div style={{ padding: '18px 16px 6px' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', background: 'linear-gradient(135deg, rgba(0,194,203,0.12), rgba(138,5,190,0.12))', border: '1px solid rgba(138,5,190,0.3)', borderRadius: 18, padding: '20px 22px' }}>
              <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 800, color: '#00C2CB', background: 'rgba(0,194,203,0.14)', border: '1px solid rgba(0,194,203,0.3)', padding: '4px 11px', borderRadius: 20 }}>🪪 Tavvy eCard</span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '12px 0 6px', lineHeight: 1.25 }}>{forPlace} hasn{'’'}t claimed their Tavvy eCard yet</h2>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)', margin: '0 0 16px' }}>
                Own this place? Get a <strong style={{ color: '#fff' }}>free digital business card</strong> — share it with one tap (NFC/QR), add it to Apple &amp; Google Wallet, and collect endorsements. Set it up in minutes.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Link href="/app/ecard" style={{ display: 'inline-block', padding: '11px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', background: '#00C2CB', color: '#06121a' }}>Create a free eCard</Link>
                <a href="#templates" style={{ display: 'inline-block', padding: '11px 18px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>See templates</a>
              </div>
            </div>
          </div>
        )}

        {/* Existing User Banner */}
        {userCards.length > 0 && (
          <div className="user-banner">
            <div className="banner-inner">
              <div className="banner-left">
                <div className="banner-avatar">
                  {userCards[0].profile_photo_url ? (
                    <img src={userCards[0].profile_photo_url} alt="" />
                  ) : (
                    <span>{(userCards[0].full_name || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="banner-text">
                  <span className="banner-name">{userCards[0].full_name || 'Your Card'}</span>
                  <span className="banner-count">
                    {userCards.length} card{userCards.length !== 1 ? 's' : ''} &middot; {userCards.filter(c => c.is_published).length} live
                  </span>
                </div>
              </div>
              <div className="banner-actions">
                <Link href={`/app/ecard/${userCards[0].id}/edit`} className="banner-btn banner-btn-edit">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit My Card
                </Link>
                <Link href="/app/ecard" className="banner-btn banner-btn-manage">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  Manage All
                </Link>
              </div>
            </div>
          </div>
        )}

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
                <span className="stat-number">14</span>
                <span className="stat-label">Templates</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-number">7</span>
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

        {/* Why Switch Section — Competitor Comparison */}
        <section id="why-switch" className={`why-switch-section animate-section ${isVisible['why-switch'] ? 'visible' : ''}`}>
          <div className="section-header">
            <div className="section-badge">Why Tavvy?</div>
            <h2 className="section-title">Everything Linktree Does.<br /><span className="gradient-text">Plus Everything It Doesn't.</span></h2>
            <p className="section-subtitle">
              Stop paying $24/month for a page of links. Tavvy gives you a real digital business card — free.
            </p>
          </div>

          <div className="comparison-table">
            <div className="compare-header">
              <div className="compare-feature-col">Feature</div>
              <div className="compare-col compare-tavvy">Tavvy</div>
              <div className="compare-col compare-other">Linktree</div>
              <div className="compare-col compare-other">Bento</div>
            </div>
            {[
              { feature: 'Custom Links', tavvy: true, linktree: true, bento: true },
              { feature: 'QR Code', tavvy: true, linktree: true, bento: false },
              { feature: 'NFC Tap Sharing', tavvy: true, linktree: false, bento: false },
              { feature: 'Apple & Google Wallet', tavvy: true, linktree: false, bento: false },
              { feature: 'Endorsement System', tavvy: true, linktree: false, bento: false },
              { feature: 'Professional Templates', tavvy: '13', linktree: '5', bento: '3' },
              { feature: 'Save to Contacts (vCard)', tavvy: true, linktree: false, bento: false },
              { feature: 'Photo Gallery', tavvy: true, linktree: false, bento: true },
              { feature: 'Video Embed', tavvy: true, linktree: true, bento: true },
              { feature: 'Custom Domain', tavvy: true, linktree: '$$$', bento: false },
              { feature: 'Analytics', tavvy: true, linktree: true, bento: true },
              { feature: 'Free Plan', tavvy: 'Forever', linktree: 'Limited', bento: 'Limited' },
              { feature: 'Price', tavvy: 'Free', linktree: '$24/mo', bento: '$8/mo' },
            ].map((row, i) => (
              <div key={i} className="compare-row">
                <div className="compare-feature-col">{row.feature}</div>
                <div className="compare-col compare-tavvy">
                  {row.tavvy === true ? <span className="check-yes">&#10003;</span> :
                   row.tavvy === false ? <span className="check-no">&#10007;</span> :
                   <span className="check-text">{row.tavvy}</span>}
                </div>
                <div className="compare-col compare-other">
                  {row.linktree === true ? <span className="check-yes dim">&#10003;</span> :
                   row.linktree === false ? <span className="check-no">&#10007;</span> :
                   <span className="check-text dim">{row.linktree}</span>}
                </div>
                <div className="compare-col compare-other">
                  {row.bento === true ? <span className="check-yes dim">&#10003;</span> :
                   row.bento === false ? <span className="check-no">&#10007;</span> :
                   <span className="check-text dim">{row.bento}</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/app/ecard" className="btn-primary-lg">
              Create Your Free Card — No Credit Card
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Social Proof Numbers */}
        <section className="social-proof-strip">
          <div className="proof-inner">
            <div className="proof-item">
              <span className="proof-number">14</span>
              <span className="proof-label">Professional Templates</span>
            </div>
            <div className="proof-divider" />
            <div className="proof-item">
              <span className="proof-number">4</span>
              <span className="proof-label">Sharing Methods</span>
            </div>
            <div className="proof-divider" />
            <div className="proof-item">
              <span className="proof-number">100%</span>
              <span className="proof-label">Free to Start</span>
            </div>
            <div className="proof-divider" />
            <div className="proof-item">
              <span className="proof-number">2min</span>
              <span className="proof-label">Setup Time</span>
            </div>
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
            {filteredTemplates.map((template, idx) => {
              const tmplConfig = getTemplateById(template.id);
              const isCardVisible = visibleCards.has(template.id);
              return (
                <div
                  key={template.id}
                  className={`template-card ${isCardVisible ? 'card-visible' : ''}`}
                  style={{ transitionDelay: `${(idx % 3) * 0.1}s` }}
                  data-card-id={template.id}
                  ref={(el) => setCardRef(template.id, el)}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  <div className="template-phone">
                    {/* Phone frame */}
                    <div className="phone-notch" />
                    <div className="template-preview">
                      {tmplConfig ? (
                        <FullCardPreview tmpl={tmplConfig} />
                      ) : (
                        <img
                          src={`/images/templates/${template.id}.png`}
                          alt={template.name}
                          loading="lazy"
                        />
                      )}
                    </div>
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
                    {template.colors && template.colors.length > 0 && (
                      <div className="color-scroll">
                        {template.colors.map((color, i) => (
                          <div
                            key={i}
                            className="color-swatch"
                            title={color.name}
                            style={{ background: `linear-gradient(135deg, ${color.c1}, ${color.c2})` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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

        {/* How It Works */}
        <section className={`how-it-works animate-section ${isVisible['how-it-works'] ? 'visible' : ''}`} id="how-it-works">
          <div className="section-header">
            <h2 className="section-title">Ready in 3 Steps</h2>
            <p className="section-subtitle">No design skills needed. No developers. Just you and 2 minutes.</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Pick a Template</h3>
              <p>Choose from 13 professionally designed templates. 6 are free forever — no strings attached.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Add Your Info</h3>
              <p>Name, photo, links, social media — fill in what you want. Skip what you don't. It auto-saves.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Share Everywhere</h3>
              <p>Get your tavvy.com/yourname link, QR code, NFC, and wallet pass. Share it however you want.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="final-cta">
          <div className="cta-glow" />
          <div className="cta-content">
            <h2>Stop Paying for a Page of Links</h2>
            <p>Linktree charges $24/month for what Tavvy gives you free. Professional digital business cards with NFC, QR, Wallet, endorsements, and 13 templates. Zero cost to start. Zero reason to wait.</p>
            <div className="cta-buttons">
              <Link href="/app/ecard" className="btn-primary-lg btn-white">
                Create Your Free Card Now
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
            <p className="cta-note">No credit card. No trial. Free forever. Upgrade only if you want Pro features.</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <img src="/brand/tavvy-logo-horizontal-light.png" alt="Tavvy" className="footer-logo-img" />
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
          max-width: 100vw;
          width: 100%;
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
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-img {
          height: 32px;
          width: auto;
        }
        .nav-cta {
          padding: 10px 24px;
          background: #8A05BE;
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

        /* ===== USER BANNER ===== */
        .user-banner {
          position: fixed;
          top: 65px;
          left: 0;
          right: 0;
          z-index: 99;
          background: rgba(138, 5, 190, 0.12);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(138, 5, 190, 0.2);
          padding: 10px 32px;
        }
        .banner-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .banner-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .banner-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          overflow: hidden;
          background: linear-gradient(135deg, #8A05BE, #EC4899);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .banner-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .banner-avatar span {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }
        .banner-text {
          display: flex;
          flex-direction: column;
        }
        .banner-name {
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }
        .banner-count {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }
        .banner-actions {
          display: flex;
          gap: 8px;
        }
        .banner-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .banner-btn-edit {
          background: #8A05BE;
          color: #fff;
        }
        .banner-btn-edit:hover {
          background: #7a04a8;
          text-decoration: none;
          transform: translateY(-1px);
        }
        .banner-btn-manage {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .banner-btn-manage:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          text-decoration: none;
        }
        @media (max-width: 480px) {
          .user-banner {
            padding: 8px 16px;
          }
          .banner-text {
            display: none;
          }
          .banner-btn {
            padding: 7px 14px;
            font-size: 12px;
          }
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
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(138, 5, 190, 0.15) 0%, transparent 70%);
          pointer-events: none;
          overflow: hidden;
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
          background: rgba(138, 5, 190, 0.1);
          border: 1px solid rgba(138, 5, 190, 0.2);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 500;
          color: #93bbfc;
          margin-bottom: 24px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          background: #8A05BE;
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
          background: linear-gradient(135deg, #8A05BE 0%, #8A05BE 50%, #EC4899 100%);
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
          background: #8A05BE;
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
          box-shadow: 0 8px 30px rgba(138, 5, 190, 0.3);
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
          background: rgba(138, 5, 190, 0.05);
          border-top: 1px solid rgba(138, 5, 190, 0.1);
          border-bottom: 1px solid rgba(138, 5, 190, 0.1);
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
          color: #8A05BE;
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
          background: rgba(138, 5, 190, 0.1);
          border: 1px solid rgba(138, 5, 190, 0.2);
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
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.6s ease, transform 0.6s ease;
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
          background: #8A05BE;
          border-color: #8A05BE;
          color: #fff;
        }
        .template-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }
        .template-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          transform: translateY(50px) scale(0.95);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .template-card.card-visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .template-card.card-visible:hover {
          transform: translateY(-8px) scale(1.02);
        }
        .template-phone {
          position: relative;
          width: 100%;
          max-width: 240px;
          margin: 0 auto;
          background: #1a1a2e;
          border-radius: 32px;
          padding: 10px 8px 14px;
          border: 2px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05);
          transition: all 0.3s;
        }
        .template-card:hover .template-phone {
          border-color: rgba(138, 5, 190, 0.4);
          box-shadow: 0 16px 48px rgba(138, 5, 190, 0.15), 0 4px 12px rgba(0,0,0,0.3);
        }
        .phone-notch {
          width: 80px;
          height: 6px;
          background: rgba(255,255,255,0.12);
          border-radius: 4px;
          margin: 2px auto 8px;
        }
        .template-preview {
          position: relative;
          aspect-ratio: 9 / 16;
          overflow: hidden;
          border-radius: 22px;
          background: #0d0d15;
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
          background: linear-gradient(135deg, #8A05BE, #EC4899);
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
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 2;
          border-radius: 22px;
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
          background: #8A05BE;
          border-color: #8A05BE;
        }
        .overlay-btn-primary:hover {
          background: #2563EB;
        }
        .template-info {
          padding: 14px 8px 0;
          text-align: center;
        }
        .template-info h3 {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .template-info p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.4;
        }
        .color-scroll {
          display: flex;
          gap: 6px;
          justify-content: center;
          margin-top: 10px;
          overflow-x: auto;
          padding: 2px 0;
          scrollbar-width: none;
        }
        .color-scroll::-webkit-scrollbar { display: none; }
        .color-swatch {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.15);
          cursor: pointer;
          transition: transform 0.2s, border-color 0.2s;
        }
        .color-swatch:hover {
          transform: scale(1.25);
          border-color: rgba(255,255,255,0.5);
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
          background: rgba(138, 5, 190, 0.1);
          border-radius: 12px;
          color: #8A05BE;
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
          background: linear-gradient(135deg, #8A05BE, #8A05BE);
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
          border-color: rgba(138, 5, 190, 0.3);
          transform: translateY(-4px);
        }
        .sharing-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(138, 5, 190, 0.08);
          border-radius: 16px;
          margin: 0 auto 20px;
          color: #8A05BE;
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
          border-color: rgba(138, 5, 190, 0.2);
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
          background: radial-gradient(ellipse, rgba(138, 5, 190, 0.15) 0%, transparent 70%);
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
        .footer-logo-img {
          height: 20px;
          width: auto;
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
        /* ===== WHY SWITCH / COMPARISON ===== */
        .why-switch-section {
          padding: 100px 32px;
          max-width: 900px;
          margin: 0 auto;
        }
        .comparison-table {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.02);
        }
        .compare-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 16px 20px;
          background: rgba(138,5,190,0.1);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          font-weight: 700;
          font-size: 14px;
        }
        .compare-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 12px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          font-size: 14px;
          transition: background 0.15s;
        }
        .compare-row:hover {
          background: rgba(255,255,255,0.03);
        }
        .compare-feature-col {
          color: rgba(255,255,255,0.8);
        }
        .compare-col {
          text-align: center;
        }
        .compare-tavvy {
          color: #8A05BE;
          font-weight: 600;
        }
        .compare-other {
          color: rgba(255,255,255,0.4);
        }
        .check-yes {
          color: #22C55E;
          font-size: 18px;
          font-weight: 700;
        }
        .check-yes.dim {
          color: rgba(34,197,94,0.4);
        }
        .check-no {
          color: #EF4444;
          font-size: 16px;
          opacity: 0.5;
        }
        .check-text {
          font-weight: 600;
        }
        .check-text.dim {
          opacity: 0.5;
        }

        /* ===== SOCIAL PROOF STRIP ===== */
        .social-proof-strip {
          padding: 40px 24px;
          background: rgba(138,5,190,0.06);
          border-top: 1px solid rgba(138,5,190,0.1);
          border-bottom: 1px solid rgba(138,5,190,0.1);
        }
        .proof-inner {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .proof-item {
          text-align: center;
        }
        .proof-number {
          display: block;
          font-size: 32px;
          font-weight: 800;
          color: #8A05BE;
          line-height: 1;
        }
        .proof-label {
          display: block;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          margin-top: 6px;
          font-weight: 500;
        }
        .proof-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.08);
        }

        /* ===== HOW IT WORKS ===== */
        .how-it-works {
          padding: 100px 32px;
          max-width: 900px;
          margin: 0 auto;
        }
        .steps-grid {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 48px;
        }
        .step-card {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 28px 24px;
          text-align: center;
        }
        .step-card h3 {
          font-size: 18px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .step-card p {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          line-height: 1.6;
        }
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(138,5,190,0.15);
          border: 2px solid #8A05BE;
          color: #8A05BE;
          font-weight: 800;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .step-arrow {
          color: rgba(255,255,255,0.15);
          font-size: 24px;
          font-weight: 300;
          flex-shrink: 0;
        }

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
          .why-switch-section,
          .how-it-works {
            padding: 60px 16px;
          }
          .compare-header,
          .compare-row {
            grid-template-columns: 1.5fr 1fr 1fr 1fr;
            padding: 10px 12px;
            font-size: 12px;
          }
          .proof-inner {
            flex-wrap: wrap;
            gap: 24px;
          }
          .proof-divider {
            display: none;
          }
          .proof-item {
            width: 40%;
          }
          .steps-grid {
            flex-direction: column;
          }
          .step-arrow {
            transform: rotate(90deg);
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
          .nav-logo-img {
            height: 26px;
          }
          .nav-cta {
            padding: 8px 16px;
            font-size: 13px;
          }
        }
        @media (max-width: 480px) {
          .hero-title {
            font-size: 36px;
          }
          .nav-logo-img {
            height: 24px;
          }
          .nav-cta {
            padding: 7px 14px;
            font-size: 12px;
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
