/**
 * Pros Screen - Web Version
 * Pixel-perfect port from tavvy-mobile-app/screens/ProsHomeScreen.tsx
 * 
 * V2 "The Tavvy Way" Design:
 * - Match guarantee, Privacy protection, Expert guidance
 * - Social proof (no star rating)
 * - How It Works (3 steps)
 * - Tavvy Shield (prominent card after How It Works)
 * - Before You Hire (education)
 * - Project Types (Quick/Medium/Major)
 * - Popular Services
 * - Best practices (Do's/Don'ts/What to Expect)
 */

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useRoles } from '../../../hooks/useRoles';
import AppLayout from '../../../components/AppLayout';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { 
  IoAddCircleOutline, IoChevronForward, IoTimeOutline, IoCheckmark,
  IoShieldCheckmark, IoHelpCircleOutline, IoCashOutline, IoFlagOutline,
  IoScaleOutline, IoFlash, IoHammer, IoBusiness, IoHomeOutline,
  IoCarOutline, IoBoatOutline, IoCameraOutline, IoBriefcaseOutline,
  IoColorPaletteOutline, IoConstruct, IoLeafOutline, IoFlashOutline,
  IoWaterOutline, IoCheckmarkCircle, IoCloseCircle, IoStar, IoStarOutline
} from 'react-icons/io5';

// V2 Design System Colors
const COLORS = {
  primaryBlue: '#6B7FFF',
  accentTeal: '#00CED1',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',
  errorRed: '#EF4444',
};

// Category configuration
const CATEGORY_CONFIG = [
  { slug: 'home', label: 'Home', icon: IoHomeOutline, color: '#6B7FFF' },
  { slug: 'auto', label: 'Auto', icon: IoCarOutline, color: '#10B981' },
  { slug: 'marine', label: 'Marine', icon: IoBoatOutline, color: '#00CED1' },
  { slug: 'events', label: 'Events', icon: IoCameraOutline, color: '#F59E0B' },
  { slug: 'business', label: 'Business', icon: IoBriefcaseOutline, color: '#8B5CF6' },
  { slug: 'creative', label: 'Creative', icon: IoColorPaletteOutline, color: '#EC4899' },
];

// Popular Services
const POPULAR_SERVICES = [
  { slug: 'auto-mechanic', label: 'Auto Mechanic', icon: IoConstruct, color: '#6B7FFF', desc: 'Car repairs' },
  { slug: 'landscaping', label: 'Landscaping', icon: IoLeafOutline, color: '#10B981', desc: 'Lawn & garden' },
  { slug: 'electrical', label: 'Electrician', icon: IoFlashOutline, color: '#F59E0B', desc: 'Electrical work' },
  { slug: 'contractor', label: 'Contractor', icon: IoHammer, color: '#8B5CF6', desc: 'Remodeling' },
  { slug: 'plumbing', label: 'Plumber', icon: IoWaterOutline, color: '#EF4444', desc: 'Plumbing' },
  { slug: 'boat-mechanic', label: 'Boat Mechanic', icon: IoBoatOutline, color: '#00CED1', desc: 'Marine repairs' },
];

// Best Practices Content
const BEST_PRACTICES = {
  dos: [
    'Get multiple quotes before deciding',
    'Check licenses and insurance',
    'Read reviews from verified customers',
    'Get everything in writing',
  ],
  donts: [
    'Pay full amount upfront',
    'Hire without checking references',
    'Skip the written contract',
    'Rush into a decision',
  ],
  expect: [
    'Clear communication and timelines',
    'Professional behavior and respect',
    'Quality workmanship',
    'Fair and transparent pricing',
  ],
};

// Before You Hire Education Content
const EDUCATION_CONTENT = [
  { icon: IoHelpCircleOutline, title: '5 Questions to Ask Every Contractor', subtitle: '2 min read' },
  { icon: IoCashOutline, title: 'How Much Should It Cost?', subtitle: 'Price guide' },
  { icon: IoFlagOutline, title: 'Red Flags to Watch For', subtitle: 'Stay safe' },
  { icon: IoScaleOutline, title: 'Your Rights as a Homeowner', subtitle: 'FL laws' },
];

export default function ProsScreen() {
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const { isPro } = useRoles();
  const router = useRouter();
  const { locale } = router;
  const { t } = useTranslation('common');

  const bgColor = isDark ? '#121212' : '#FAFAFA';
  const surfaceColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const surfaceAltColor = isDark ? '#2A2A2A' : '#F3F4F6';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#333333' : '#E5E7EB';

  return (
    <>
      <Head>
        <title>Pros | TavvY</title>
        <meta name="description" content="Connect with any professional. Any job. Any service. We'll match you." />
      </Head>

      <AppLayout>
        <div className="pros-screen" style={{ backgroundColor: bgColor, minHeight: '100vh' }}>
          {/* Header */}
          <div className="header">
            <h1 className="title">Pros</h1>
            <p className="hero-tagline">
              Connect with any professional.<br />
              Any job. Any service. We'll match you.
            </p>
          </div>

          {/* Segmented Control */}
          <div className="segmented-control-container">
            <div className="segmented-control" style={{ backgroundColor: surfaceColor }}>
              <button className="segment active">
                Find a Pro
              </button>
              <button
                className="segment"
                onClick={() => {
                  if (!user) {
                    router.push('/app/login');
                  } else if (isPro) {
                    router.push('/app/pros/dashboard');
                  } else {
                    router.push('/app/pros/register');
                  }
                }}
              >
                I'm a Pro
              </button>
            </div>
          </div>

          {/* Start a Project Card - Primary CTA */}
          <Link href="/app/pros/new-project" locale={locale} className="start-project-card">
            <div className="start-project-gradient">
              <div className="start-project-icon">
                <IoAddCircleOutline size={28} color="#FFFFFF" />
              </div>
              <div className="start-project-content">
                <h3 className="start-project-title">Start a Project</h3>
                <p className="start-project-subtitle">Tell us what you need, get matched with pros</p>
              </div>
              <IoChevronForward size={24} color="#FFFFFF" />
            </div>
          </Link>

          {/* Social Proof - No star rating */}
          <div className="social-proof" style={{ borderColor }}>
            <div className="proof-item">
              <div className="proof-number">12,450+</div>
              <div className="proof-label">PROJECTS</div>
            </div>
            <div className="proof-divider" />
            <div className="proof-item">
              <div className="proof-number">$340</div>
              <div className="proof-label">AVG SAVINGS</div>
            </div>
          </div>

          {/* How It Works */}
          <div className="section">
            <h2 className="section-title">✨ How It Works</h2>
            <div className="steps-container">
              <div className="step-card" style={{ backgroundColor: surfaceColor, borderColor }}>
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">Tell us what you need</h3>
                  <p className="step-desc">From car repair to home renovation to event planning</p>
                </div>
              </div>
              <div className="step-card" style={{ backgroundColor: surfaceColor, borderColor }}>
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">We match you with pros</h3>
                  <p className="step-desc">Get quotes from vetted professionals in your area</p>
                </div>
              </div>
              <div className="step-card" style={{ backgroundColor: surfaceColor, borderColor }}>
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">Chat & hire securely</h3>
                  <p className="step-desc">Your contact info stays private until you're ready</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tavvy Shield - Prominent Card */}
          <Link href="/app/pros/shield" locale={locale} className="tavvy-shield-card">
            <div className="tavvy-shield-gradient">
              <div className="shield-icon-container">
                <IoShieldCheckmark size={32} color={COLORS.primaryBlue} />
              </div>
              <div className="shield-content">
                <h3 className="shield-title">Tavvy Shield</h3>
                <p className="shield-desc">Want payment protection? Get covered with Tavvy Shield.</p>
              </div>
              <IoChevronForward size={20} color={COLORS.accentTeal} />
            </div>
          </Link>

          {/* Before You Hire - Education */}
          <div className="section">
            <h2 className="section-title">📚 Before You Hire</h2>
            <div className="edu-scroll">
              {EDUCATION_CONTENT.map((item, index) => (
                <div key={index} className="edu-card" style={{ backgroundColor: surfaceColor, borderColor }}>
                  <item.icon size={28} color={COLORS.accentTeal} />
                  <h3 className="edu-title">{item.title}</h3>
                  <p className="edu-subtitle">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Project Types */}
          <div className="section">
            <h2 className="section-title">📊 By Project Size</h2>
            <div className="project-types-row">
              <div className="project-type-card green" style={{ backgroundColor: surfaceColor, borderColor }}>
                <IoFlash size={28} color={COLORS.successGreen} />
                <h3 className="project-type-title">Quick Jobs</h3>
                <p className="project-type-desc">Same day</p>
              </div>
              <div className="project-type-card amber" style={{ backgroundColor: surfaceColor, borderColor }}>
                <IoHammer size={28} color={COLORS.warningAmber} />
                <h3 className="project-type-title">Medium</h3>
                <p className="project-type-desc">1-2 weeks</p>
              </div>
              <div className="project-type-card red" style={{ backgroundColor: surfaceColor, borderColor }}>
                <IoBusiness size={28} color={COLORS.errorRed} />
                <h3 className="project-type-title">Major</h3>
                <p className="project-type-desc">1+ months</p>
              </div>
            </div>
          </div>

          {/* Browse by Category */}
          <div className="section">
            <h2 className="section-title">🔍 Browse by Category</h2>
            <div className="category-scroll">
              {CATEGORY_CONFIG.map((cat) => (
                <button 
                  key={cat.slug} 
                  className="category-chip" 
                  style={{ backgroundColor: surfaceColor, borderColor }}
                >
                  <cat.icon size={18} color={cat.color} />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Services */}
          <div className="section">
            <h2 className="section-title">🔥 Popular Services</h2>
            <div className="services-grid">
              {POPULAR_SERVICES.map((service) => (
                <button 
                  key={service.slug} 
                  className="service-card" 
                  style={{ backgroundColor: surfaceColor, borderColor }}
                >
                  <div className="service-icon" style={{ backgroundColor: `${service.color}20` }}>
                    <service.icon size={24} color={service.color} />
                  </div>
                  <div className="service-label">{service.label}</div>
                  <div className="service-desc">{service.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* The Tavvy Promise */}
          <div className="section">
            <div className="promise-card">
              <div className="promise-gradient" style={{ backgroundColor: surfaceColor, borderColor }}>
                <h3 className="promise-title">🛡️ The Tavvy Promise</h3>
                <div className="promise-list">
                  <div className="promise-item">
                    <div className="promise-check">
                      <IoCheckmark size={14} color="#FFFFFF" />
                    </div>
                    <p className="promise-text">
                      <strong>Privacy protected</strong> - Contact info stays private until you hire
                    </p>
                  </div>
                  <div className="promise-item">
                    <div className="promise-check">
                      <IoCheckmark size={14} color="#FFFFFF" />
                    </div>
                    <p className="promise-text">
                      <strong>Vetted pros</strong> - We verify licenses and reviews
                    </p>
                  </div>
                  <div className="promise-item">
                    <div className="promise-check">
                      <IoCheckmark size={14} color="#FFFFFF" />
                    </div>
                    <p className="promise-text">
                      <strong>Match guarantee</strong> - We'll find the right pro for you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expert Guidance - Do's/Don'ts */}
          <div className="section">
            <h2 className="section-title">💡 Expert Guidance</h2>
            
            {/* Do's */}
            <div className="practice-card" style={{ backgroundColor: surfaceColor, borderColor }}>
              <div className="practice-header">
                <div className="practice-icon-bg green">
                  <IoCheckmarkCircle size={20} color={COLORS.successGreen} />
                </div>
                <h3 className="practice-title green">Do's</h3>
              </div>
              {BEST_PRACTICES.dos.map((item, index) => (
                <div key={index} className="practice-item">
                  <IoCheckmark size={16} color={COLORS.successGreen} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* Don'ts */}
            <div className="practice-card" style={{ backgroundColor: surfaceColor, borderColor }}>
              <div className="practice-header">
                <div className="practice-icon-bg red">
                  <IoCloseCircle size={20} color={COLORS.errorRed} />
                </div>
                <h3 className="practice-title red">Don'ts</h3>
              </div>
              {BEST_PRACTICES.donts.map((item, index) => (
                <div key={index} className="practice-item">
                  <IoCheckmark size={16} color={COLORS.errorRed} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* What to Expect */}
            <div className="practice-card" style={{ backgroundColor: surfaceColor, borderColor }}>
              <div className="practice-header">
                <div className="practice-icon-bg blue">
                  <IoStar size={20} color={COLORS.primaryBlue} />
                </div>
                <h3 className="practice-title blue">What to Expect</h3>
              </div>
              {BEST_PRACTICES.expect.map((item, index) => (
                <div key={index} className="practice-item">
                  <IoStarOutline size={16} color={COLORS.primaryBlue} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 100 }} />

          <style jsx>{`
            .pros-screen {
              padding-bottom: 80px;
            }

            /* Header */
            .header {
              padding: 24px 20px;
            }

            .title {
              font-size: 34px;
              font-weight: 800;
              color: ${textColor};
              margin: 0;
            }

            .hero-tagline {
              font-size: 17px;
              font-weight: 500;
              color: ${COLORS.accentTeal};
              margin: 8px 0 0;
              line-height: 1.5;
            }

            /* Segmented Control */
            .segmented-control-container {
              padding: 0 20px 20px;
            }

            .segmented-control {
              display: flex;
              border-radius: 12px;
              padding: 4px;
              gap: 4px;
            }

            .segment {
              flex: 1;
              padding: 12px;
              border: none;
              border-radius: 8px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
              background: transparent;
              color: ${secondaryTextColor};
            }

            .segment.active {
              background: ${COLORS.primaryBlue};
              color: #FFFFFF;
            }

            /* Start Project Card */
            .start-project-card {
              display: block;
              margin: 0 20px 20px;
              text-decoration: none;
              border-radius: 16px;
              overflow: hidden;
              transition: transform 0.2s;
            }

            .start-project-card:hover {
              transform: translateY(-2px);
            }

            .start-project-gradient {
              background: linear-gradient(90deg, #6B7FFF 0%, #5563E8 100%);
              padding: 20px;
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .start-project-icon {
              width: 48px;
              height: 48px;
              background: rgba(255, 255, 255, 0.2);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            .start-project-content {
              flex: 1;
            }

            .start-project-title {
              font-size: 18px;
              font-weight: 700;
              color: #FFFFFF;
              margin: 0 0 4px;
            }

            .start-project-subtitle {
              font-size: 14px;
              color: rgba(255, 255, 255, 0.9);
              margin: 0;
            }

            /* Social Proof */
            .social-proof {
              display: flex;
              margin: 0 20px 24px;
              padding: 20px;
              background: ${surfaceColor};
              border: 1px solid;
              border-radius: 12px;
              gap: 24px;
            }

            .proof-item {
              flex: 1;
              text-align: center;
            }

            .proof-number {
              font-size: 28px;
              font-weight: 700;
              color: ${COLORS.successGreen};
              margin-bottom: 4px;
            }

            .proof-label {
              font-size: 11px;
              font-weight: 600;
              color: ${secondaryTextColor};
              letter-spacing: 0.5px;
            }

            .proof-divider {
              width: 1px;
              background: ${borderColor};
            }

            /* Section */
            .section {
              padding: 0 20px 32px;
            }

            .section-title {
              font-size: 20px;
              font-weight: 700;
              color: ${textColor};
              margin: 0 0 16px;
            }

            /* Steps */
            .steps-container {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .step-card {
              display: flex;
              align-items: flex-start;
              gap: 16px;
              padding: 16px;
              border: 1px solid;
              border-radius: 12px;
            }

            .step-number {
              width: 32px;
              height: 32px;
              background: ${COLORS.primaryBlue};
              color: #FFFFFF;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 700;
              flex-shrink: 0;
            }

            .step-content {
              flex: 1;
            }

            .step-title {
              font-size: 16px;
              font-weight: 600;
              color: ${textColor};
              margin: 0 0 4px;
            }

            .step-desc {
              font-size: 14px;
              color: ${secondaryTextColor};
              margin: 0;
            }

            /* Tavvy Shield */
            .tavvy-shield-card {
              display: block;
              margin: 0 20px 24px;
              text-decoration: none;
              border-radius: 16px;
              overflow: hidden;
              transition: transform 0.2s;
            }

            .tavvy-shield-card:hover {
              transform: translateY(-2px);
            }

            .tavvy-shield-gradient {
              background: linear-gradient(90deg, rgba(107, 127, 255, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
              border: 1px solid rgba(107, 127, 255, 0.3);
              padding: 20px;
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .shield-icon-container {
              width: 56px;
              height: 56px;
              background: rgba(107, 127, 255, 0.1);
              border-radius: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            .shield-content {
              flex: 1;
            }

            .shield-title {
              font-size: 17px;
              font-weight: 700;
              color: ${textColor};
              margin: 0 0 4px;
            }

            .shield-desc {
              font-size: 14px;
              color: ${secondaryTextColor};
              margin: 0;
              line-height: 1.4;
            }

            /* Education Cards */
            .edu-scroll {
              display: flex;
              gap: 12px;
              overflow-x: auto;
              padding-bottom: 8px;
              scrollbar-width: none;
            }

            .edu-scroll::-webkit-scrollbar {
              display: none;
            }

            .edu-card {
              min-width: 200px;
              padding: 20px;
              border: 1px solid;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: 8px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .edu-card:hover {
              transform: translateY(-2px);
            }

            .edu-title {
              font-size: 14px;
              font-weight: 600;
              color: ${textColor};
              margin: 0;
            }

            .edu-subtitle {
              font-size: 12px;
              color: ${secondaryTextColor};
              margin: 0;
            }

            /* Project Types */
            .project-types-row {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 12px;
            }

            .project-type-card {
              padding: 20px;
              border: 1px solid;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: 8px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .project-type-card.green {
              border-top: 3px solid ${COLORS.successGreen};
            }

            .project-type-card.amber {
              border-top: 3px solid ${COLORS.warningAmber};
            }

            .project-type-card.red {
              border-top: 3px solid ${COLORS.errorRed};
            }

            .project-type-card:hover {
              transform: translateY(-2px);
            }

            .project-type-title {
              font-size: 16px;
              font-weight: 600;
              color: ${textColor};
              margin: 0;
            }

            .project-type-desc {
              font-size: 13px;
              color: ${secondaryTextColor};
              margin: 0;
            }

            /* Categories */
            .category-scroll {
              display: flex;
              gap: 8px;
              overflow-x: auto;
              padding-bottom: 8px;
              scrollbar-width: none;
            }

            .category-scroll::-webkit-scrollbar {
              display: none;
            }

            .category-chip {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 16px;
              border: 1px solid;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              color: ${textColor};
              cursor: pointer;
              white-space: nowrap;
              transition: transform 0.2s;
            }

            .category-chip:hover {
              transform: scale(1.05);
            }

            /* Services Grid */
            .services-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 12px;
            }

            .service-card {
              padding: 16px;
              border: 1px solid;
              border-radius: 12px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: 8px;
              cursor: pointer;
              transition: transform 0.2s;
            }

            .service-card:hover {
              transform: translateY(-2px);
            }

            .service-icon {
              width: 48px;
              height: 48px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .service-label {
              font-size: 14px;
              font-weight: 600;
              color: ${textColor};
            }

            .service-desc {
              font-size: 12px;
              color: ${secondaryTextColor};
            }

            /* Promise Card */
            .promise-card {
              margin-bottom: 24px;
            }

            .promise-gradient {
              padding: 24px;
              border: 1px solid;
              border-radius: 16px;
            }

            .promise-title {
              font-size: 20px;
              font-weight: 700;
              color: ${textColor};
              margin: 0 0 16px;
            }

            .promise-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }

            .promise-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
            }

            .promise-check {
              width: 20px;
              height: 20px;
              background: ${COLORS.successGreen};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              margin-top: 2px;
            }

            .promise-text {
              flex: 1;
              font-size: 14px;
              color: ${secondaryTextColor};
              margin: 0;
              line-height: 1.5;
            }

            .promise-text strong {
              color: ${textColor};
              font-weight: 600;
            }

            /* Practice Cards */
            .practice-card {
              padding: 20px;
              border: 1px solid;
              border-radius: 12px;
              margin-bottom: 16px;
            }

            .practice-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
            }

            .practice-icon-bg {
              width: 36px;
              height: 36px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .practice-icon-bg.green {
              background: rgba(16, 185, 129, 0.15);
            }

            .practice-icon-bg.red {
              background: rgba(239, 68, 68, 0.15);
            }

            .practice-icon-bg.blue {
              background: rgba(107, 127, 255, 0.15);
            }

            .practice-title {
              font-size: 18px;
              font-weight: 700;
              margin: 0;
            }

            .practice-title.green {
              color: ${COLORS.successGreen};
            }

            .practice-title.red {
              color: ${COLORS.errorRed};
            }

            .practice-title.blue {
              color: ${COLORS.primaryBlue};
            }

            .practice-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 12px;
              font-size: 14px;
              color: ${textColor};
            }

            .practice-item:last-child {
              margin-bottom: 0;
            }

            @media (max-width: 768px) {
              .services-grid {
                grid-template-columns: repeat(2, 1fr);
              }

              .project-types-row {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </div>
      </AppLayout>
    </>
  );
}

export async function getServerSideProps({ locale, res }: { locale: string; res: any }) {
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
