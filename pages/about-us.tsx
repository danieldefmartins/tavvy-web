import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AboutUs() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const sections = document.querySelectorAll('.story-chapter');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Head>
        <title>Our Story - Tavvy</title>
        <meta name="description" content="Discover the story behind Tavvy - a platform born from love, resilience, and the belief that technology should guide, support, and care." />
        <meta property="og:title" content="Our Story - Tavvy" />
        <meta property="og:description" content="Tavvy exists to guide, reduce uncertainty, and help people make better decisions with confidence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com/about-us" />
      </Head>

      <div className="about-page">
        {/* Floating Navigation */}
        <nav className="floating-nav">
          <Link href="/" className="nav-logo">
            <img src="/brand/logo-icon.png" alt="Tavvy" style={{ height: '36px', width: '36px', maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' }} />
          </Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/app">Web App</Link>
          </div>
        </nav>

        {/* Hero Section with Parallax */}
        <header className="hero-section">
          <div className="hero-bg" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
            <div className="hero-gradient"></div>
            <div className="hero-particles">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="particle" style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 4}s`
                }}></div>
              ))}
            </div>
          </div>
          
          <div className="hero-content">
            <div className="heartbeat-container">
              <svg className="heartbeat-line" viewBox="0 0 400 100" preserveAspectRatio="none">
                <path 
                  className="heartbeat-path"
                  d="M0,50 L80,50 L100,50 L120,20 L140,80 L160,30 L180,70 L200,50 L220,50 L400,50"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.6)"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <h1 className="hero-title">
              <span className="title-line">A Name.</span>
              <span className="title-line">A Meaning.</span>
              <span className="title-line title-accent">A Story.</span>
            </h1>
            <p className="hero-subtitle">The heart behind Tavvy</p>
            <div className="scroll-indicator">
              <span>Scroll to discover</span>
              <div className="scroll-arrow"></div>
            </div>
          </div>
        </header>

        {/* Story Chapters */}
        <main className="story-container">
          
          {/* Chapter 1: The Beginning */}
          <section id="chapter-1" className={`story-chapter chapter-beginning ${isVisible['chapter-1'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="chapter-number">01</div>
              <div className="chapter-text">
                <p className="opening-statement">
                  Tavvy wasn't born as just a name.
                </p>
                <p className="emphasis-text">
                  It became a meaning.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 2: The Name */}
          <section id="chapter-2" className={`story-chapter chapter-name ${isVisible['chapter-2'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="chapter-number">02</div>
              <div className="chapter-text">
                <p>
                  When I chose the name <strong>Tavvy</strong>, it sounded warm, friendly, human. 
                  A name that felt easy to say, easy to trust, easy to remember.
                </p>
                <p>
                  It didn't feel like a tech company or an app — it felt like <em>someone</em>. 
                  Like a companion. Like something that walks with you.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 3: The Discovery - Full Width Impact */}
          <section id="chapter-3" className={`story-chapter chapter-discovery ${isVisible['chapter-3'] ? 'visible' : ''}`}>
            <div className="discovery-bg"></div>
            <div className="chapter-content">
              <div className="discovery-statement">
                <p className="discovery-intro">Later, I discovered something that stopped me in my tracks.</p>
              </div>
              <div className="tavi-reveal">
                <div className="tavi-letters">
                  <span>T</span>
                  <span>A</span>
                  <span>V</span>
                  <span>I</span>
                </div>
                <p className="tavi-meaning">
                  Transcatheter Aortic Valve Implantation
                </p>
              </div>
              <div className="discovery-text">
                <p>
                  <strong>TAVI</strong> — pronounced exactly like Tavvy — is the name of the 
                  life-saving heart procedure my son <strong>Bryan</strong> will likely need to undergo, 
                  possibly more than once, throughout his life.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 4: The Moment */}
          <section id="chapter-4" className={`story-chapter chapter-moment ${isVisible['chapter-4'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="moment-statement">
                <p>That moment changed everything.</p>
              </div>
            </div>
          </section>

          {/* Chapter 5: The Meaning */}
          <section id="chapter-5" className={`story-chapter chapter-meaning ${isVisible['chapter-5'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="chapter-number">03</div>
              <div className="chapter-text">
                <p>
                  TAVI is a procedure designed to <strong>restore flow</strong>, to give the heart 
                  a second chance, to allow life to keep moving forward when the path isn't easy.
                </p>
                <p>
                  It exists to reduce risk, to bring clarity, to help people live better lives 
                  when they need help the most.
                </p>
                <div className="realization">
                  <p>And suddenly, Tavvy wasn't just a name anymore.</p>
                  <p className="mirror-text">It was a mirror of our story.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 6: Bryan's Journey */}
          <section id="chapter-6" className={`story-chapter chapter-journey ${isVisible['chapter-6'] ? 'visible' : ''}`}>
            <div className="journey-bg"></div>
            <div className="chapter-content">
              <div className="chapter-number">04</div>
              <div className="chapter-text">
                <p>
                  Bryan's journey taught us what it means to trust systems we don't fully understand. 
                  To rely on experts. To hope that the right decision, at the right moment, 
                  can change everything.
                </p>
                <p>
                  It taught us <strong>resilience</strong>, <strong>patience</strong>, and the value 
                  of <strong>guidance</strong> when you're facing something bigger than yourself.
                </p>
                <p className="journey-conclusion">
                  That's exactly what Tavvy is meant to be.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 7: The Mission */}
          <section id="chapter-7" className={`story-chapter chapter-mission ${isVisible['chapter-7'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="mission-block">
                <div className="mission-item">
                  <div className="mission-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <p>Tavvy exists to <strong>guide</strong>.</p>
                </div>
                <div className="mission-item">
                  <div className="mission-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <p>To <strong>reduce uncertainty</strong>.</p>
                </div>
                <div className="mission-item">
                  <div className="mission-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <p>To help people make <strong>better decisions</strong> with confidence.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 8: The Connection */}
          <section id="chapter-8" className={`story-chapter chapter-connection ${isVisible['chapter-8'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="chapter-text">
                <p>
                  Just like TAVI supports a heart when it needs it most, Tavvy supports people 
                  when they're choosing where to go, who to trust, what to experience, and how 
                  to live better moments with the people they love.
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 9: The Reflection */}
          <section id="chapter-9" className={`story-chapter chapter-reflection ${isVisible['chapter-9'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="reflection-statements">
                <p className="reflection-line">The connection wasn't planned.</p>
                <p className="reflection-line">It was discovered.</p>
                <p className="reflection-emphasis">And sometimes, the most meaningful things are.</p>
              </div>
            </div>
          </section>

          {/* Chapter 10: The Heart */}
          <section id="chapter-10" className={`story-chapter chapter-heart ${isVisible['chapter-10'] ? 'visible' : ''}`}>
            <div className="heart-bg"></div>
            <div className="chapter-content">
              <div className="heart-quote">
                <blockquote>
                  Tavvy carries Bryan's story quietly inside it — a reminder that behind 
                  technology, data, and design, there is life. There are families. 
                  There are second chances. There is love.
                </blockquote>
              </div>
            </div>
          </section>

          {/* Chapter 11: The Values */}
          <section id="chapter-11" className={`story-chapter chapter-values ${isVisible['chapter-11'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <p className="values-intro">Tavvy isn't just about places, experiences, or reviews.</p>
              <div className="values-grid">
                <div className="value-card">
                  <div className="value-icon care"></div>
                  <p>It's about <strong>care</strong>.</p>
                </div>
                <div className="value-card">
                  <div className="value-icon trust"></div>
                  <p>It's about <strong>trust</strong>.</p>
                </div>
                <div className="value-card">
                  <div className="value-icon forward"></div>
                  <p>It's about <strong>moving forward</strong>, even when the road is uncertain.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Chapter 12: The Closing */}
          <section id="chapter-12" className={`story-chapter chapter-closing ${isVisible['chapter-12'] ? 'visible' : ''}`}>
            <div className="chapter-content">
              <div className="closing-text">
                <p>Just like our son did.</p>
                <p className="closing-final">Just like he still does — every single day.</p>
              </div>
              <div className="heart-symbol">
                <svg viewBox="0 0 24 24" fill="currentColor" className="heart-icon">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </section>

        </main>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Join Our Journey</h2>
            <p>Experience a platform built with care, designed to help you discover and trust.</p>
            <div className="cta-buttons">
              <a 
                href="https://apps.apple.com/app/tavvy" 
                className="btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download for iOS
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.tavvy" 
                className="btn-primary btn-android"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Download for Android
              </a>
              <Link href="/" className="btn-secondary">
                Back to Home
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="about-footer">
          <div className="footer-content">
            <div className="footer-links">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <a href="mailto:support@tavvy.com">Contact</a>
            </div>
            <p className="footer-copyright">© {new Date().getFullYear()} Tavvy, Inc. All rights reserved.</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        /* Base Styles */
        .about-page {
          min-height: 100vh;
          background: #0a0a0f;
          color: #ffffff;
          overflow-x: hidden;
        }

        /* Floating Navigation */
        .floating-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          background: linear-gradient(180deg, rgba(10, 10, 15, 0.95) 0%, rgba(10, 10, 15, 0) 100%);
        }

        .nav-logo img {
          height: 36px;
          width: 36px;
          max-width: 36px;
          max-height: 36px;
          object-fit: contain;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-links a {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.3s;
        }

        .nav-links a:hover {
          color: #ffffff;
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-gradient {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 20% 60%, rgba(236, 72, 153, 0.08) 0%, transparent 50%);
        }

        .hero-particles {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(59, 130, 246, 0.4);
          border-radius: 50%;
          animation: float-particle 6s ease-in-out infinite;
        }

        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.8; }
        }

        .hero-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 0 24px;
        }

        .heartbeat-container {
          width: 100%;
          max-width: 400px;
          margin: 0 auto 40px;
          opacity: 0.6;
        }

        .heartbeat-line {
          width: 100%;
          height: 60px;
        }

        .heartbeat-path {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: heartbeat-draw 3s ease-out forwards, heartbeat-pulse 2s ease-in-out 3s infinite;
        }

        @keyframes heartbeat-draw {
          to { stroke-dashoffset: 0; }
        }

        @keyframes heartbeat-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .hero-title {
          font-size: clamp(2.5rem, 8vw, 5rem);
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.03em;
        }

        .title-line {
          display: block;
          opacity: 0;
          transform: translateY(30px);
          animation: title-reveal 0.8s ease-out forwards;
        }

        .title-line:nth-child(1) { animation-delay: 0.5s; }
        .title-line:nth-child(2) { animation-delay: 0.7s; }
        .title-line:nth-child(3) { animation-delay: 0.9s; }

        @keyframes title-reveal {
          to { opacity: 1; transform: translateY(0); }
        }

        .title-accent {
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 60px;
          opacity: 0;
          animation: fade-in 1s ease-out 1.2s forwards;
        }

        @keyframes fade-in {
          to { opacity: 1; }
        }

        .scroll-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          opacity: 0;
          animation: fade-in 1s ease-out 1.5s forwards;
        }

        .scroll-indicator span {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .scroll-arrow {
          width: 24px;
          height: 24px;
          border-right: 2px solid rgba(255, 255, 255, 0.5);
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
          transform: rotate(45deg);
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(8px); }
        }

        /* Story Container */
        .story-container {
          position: relative;
        }

        /* Story Chapters - Base */
        .story-chapter {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          position: relative;
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .story-chapter.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .chapter-content {
          max-width: 800px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .chapter-number {
          font-size: 6rem;
          font-weight: 800;
          color: rgba(59, 130, 246, 0.1);
          position: absolute;
          top: -40px;
          left: -20px;
          line-height: 1;
          user-select: none;
        }

        .chapter-text {
          position: relative;
        }

        .chapter-text p {
          font-size: 1.375rem;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 28px;
        }

        .chapter-text p:last-child {
          margin-bottom: 0;
        }

        .chapter-text strong {
          color: #ffffff;
          font-weight: 600;
        }

        .chapter-text em {
          color: #93C5FD;
          font-style: italic;
        }

        /* Chapter 1: Beginning */
        .chapter-beginning {
          background: linear-gradient(180deg, #0a0a0f 0%, #0f1020 100%);
        }

        .opening-statement {
          font-size: 2.5rem !important;
          font-weight: 600;
          text-align: center;
          color: #ffffff !important;
          margin-bottom: 20px !important;
        }

        .emphasis-text {
          font-size: 2rem !important;
          font-weight: 500;
          text-align: center;
          color: #93C5FD !important;
          font-style: italic;
        }

        /* Chapter 2: Name */
        .chapter-name {
          background: #0f1020;
        }

        /* Chapter 3: Discovery */
        .chapter-discovery {
          min-height: 120vh;
          background: linear-gradient(180deg, #0f1020 0%, #1a1030 50%, #0f1020 100%);
        }

        .discovery-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
        }

        .discovery-statement {
          text-align: center;
          margin-bottom: 60px;
        }

        .discovery-intro {
          font-size: 1.75rem !important;
          color: #C4B5FD !important;
          font-weight: 500;
        }

        .tavi-reveal {
          text-align: center;
          margin-bottom: 60px;
        }

        .tavi-letters {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        .tavi-letters span {
          font-size: 5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          opacity: 0;
          transform: translateY(20px);
          animation: letter-reveal 0.5s ease-out forwards;
        }

        .visible .tavi-letters span:nth-child(1) { animation-delay: 0.3s; }
        .visible .tavi-letters span:nth-child(2) { animation-delay: 0.4s; }
        .visible .tavi-letters span:nth-child(3) { animation-delay: 0.5s; }
        .visible .tavi-letters span:nth-child(4) { animation-delay: 0.6s; }

        @keyframes letter-reveal {
          to { opacity: 1; transform: translateY(0); }
        }

        .tavi-meaning {
          font-size: 1rem !important;
          color: rgba(255, 255, 255, 0.5) !important;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .discovery-text {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        /* Chapter 4: Moment */
        .chapter-moment {
          min-height: 60vh;
          background: linear-gradient(180deg, #0f1020 0%, #0a0a0f 100%);
        }

        .moment-statement p {
          font-size: 3rem !important;
          font-weight: 700;
          text-align: center;
          color: #ffffff !important;
          font-style: italic;
        }

        /* Chapter 5: Meaning */
        .chapter-meaning {
          background: #0a0a0f;
        }

        .realization {
          margin-top: 48px;
          padding: 40px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 20px;
          border-left: 4px solid #3B82F6;
        }

        .realization p {
          text-align: center;
          font-size: 1.5rem !important;
          margin-bottom: 16px !important;
        }

        .mirror-text {
          color: #60A5FA !important;
          font-weight: 600;
          font-size: 1.75rem !important;
          margin-bottom: 0 !important;
        }

        /* Chapter 6: Journey */
        .chapter-journey {
          background: linear-gradient(180deg, #0a0a0f 0%, #0f1525 100%);
        }

        .journey-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 40%);
        }

        .journey-conclusion {
          font-size: 1.75rem !important;
          font-weight: 600;
          color: #ffffff !important;
          text-align: center;
          margin-top: 40px !important;
          font-style: italic;
        }

        /* Chapter 7: Mission */
        .chapter-mission {
          background: linear-gradient(180deg, #0f1525 0%, #0a0a0f 100%);
          padding: 120px 24px;
        }

        .mission-block {
          display: flex;
          flex-direction: column;
          gap: 40px;
          max-width: 600px;
          margin: 0 auto;
        }

        .mission-item {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 32px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: transform 0.3s, background 0.3s;
        }

        .mission-item:hover {
          transform: translateX(8px);
          background: rgba(59, 130, 246, 0.15);
        }

        .mission-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          color: #60A5FA;
        }

        .mission-icon svg {
          width: 100%;
          height: 100%;
        }

        .mission-item p {
          font-size: 1.5rem !important;
          margin: 0 !important;
          color: rgba(255, 255, 255, 0.9) !important;
        }

        /* Chapter 8: Connection */
        .chapter-connection {
          background: #0a0a0f;
          min-height: 70vh;
        }

        .chapter-connection .chapter-text p {
          font-size: 1.5rem !important;
          text-align: center;
          max-width: 700px;
          margin: 0 auto;
        }

        /* Chapter 9: Reflection */
        .chapter-reflection {
          background: linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%);
          min-height: 80vh;
        }

        .reflection-statements {
          text-align: center;
        }

        .reflection-line {
          font-size: 2rem !important;
          color: #A78BFA !important;
          margin-bottom: 24px !important;
          font-weight: 500;
        }

        .reflection-emphasis {
          font-size: 1.5rem !important;
          color: rgba(255, 255, 255, 0.7) !important;
          font-style: italic;
          margin-top: 40px !important;
        }

        /* Chapter 10: Heart */
        .chapter-heart {
          background: linear-gradient(180deg, #0f0f1a 0%, #1a0f1a 50%, #0f0f1a 100%);
          min-height: 80vh;
        }

        .heart-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%);
        }

        .heart-quote {
          max-width: 700px;
          margin: 0 auto;
        }

        .heart-quote blockquote {
          font-size: 1.5rem;
          line-height: 1.9;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
          padding: 48px;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-radius: 24px;
          border: 1px solid rgba(236, 72, 153, 0.2);
          position: relative;
        }

        .heart-quote blockquote::before {
          content: '"';
          position: absolute;
          top: 20px;
          left: 30px;
          font-size: 4rem;
          color: rgba(236, 72, 153, 0.3);
          font-family: Georgia, serif;
          line-height: 1;
        }

        /* Chapter 11: Values */
        .chapter-values {
          background: #0f0f1a;
          padding: 120px 24px;
        }

        .values-intro {
          font-size: 1.5rem !important;
          text-align: center;
          color: rgba(255, 255, 255, 0.7) !important;
          margin-bottom: 60px !important;
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .value-card {
          padding: 40px 24px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
          transition: transform 0.3s, background 0.3s;
        }

        .value-card:hover {
          transform: translateY(-8px);
          background: rgba(255, 255, 255, 0.06);
        }

        .value-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 24px;
          border-radius: 50%;
        }

        .value-icon.care {
          background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%);
        }

        .value-icon.trust {
          background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
        }

        .value-icon.forward {
          background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
        }

        .value-card p {
          font-size: 1.25rem !important;
          color: rgba(255, 255, 255, 0.85) !important;
          margin: 0 !important;
        }

        /* Chapter 12: Closing */
        .chapter-closing {
          background: linear-gradient(180deg, #0f0f1a 0%, #0a0a0f 100%);
          min-height: 80vh;
        }

        .closing-text {
          text-align: center;
          margin-bottom: 48px;
        }

        .closing-text p {
          font-size: 1.75rem !important;
          color: rgba(255, 255, 255, 0.6) !important;
          margin-bottom: 16px !important;
        }

        .closing-final {
          font-size: 2rem !important;
          font-weight: 600;
          color: #ffffff !important;
        }

        .heart-symbol {
          text-align: center;
        }

        .heart-icon {
          width: 80px;
          height: 80px;
          color: #3B82F6;
          animation: heart-beat 1.5s ease-in-out infinite;
        }

        @keyframes heart-beat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.1); }
          35% { transform: scale(1); }
          45% { transform: scale(1.1); }
          55% { transform: scale(1); }
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(135deg, #1E3A8A 0%, #312E81 50%, #4C1D95 100%);
          padding: 100px 24px;
        }

        .cta-content {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .cta-content > p {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 40px;
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          color: #1E3A8A;
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
        }

        .btn-android {
          background: #34D399;
          color: #064E3B;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #ffffff;
          padding: 16px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: border-color 0.2s, background 0.2s;
        }

        .btn-secondary:hover {
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.1);
        }

        /* Footer */
        .about-footer {
          background: #0a0a0f;
          padding: 48px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
        }

        .footer-links {
          display: flex;
          gap: 32px;
          justify-content: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #ffffff;
        }

        .footer-copyright {
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .floating-nav {
            padding: 16px 20px;
          }

          .nav-links {
            display: none;
          }

          .hero-title {
            font-size: clamp(2rem, 10vw, 3.5rem);
          }

          .chapter-number {
            font-size: 4rem;
            top: -20px;
            left: -10px;
          }

          .chapter-text p {
            font-size: 1.125rem;
          }

          .opening-statement {
            font-size: 1.75rem !important;
          }

          .emphasis-text {
            font-size: 1.5rem !important;
          }

          .tavi-letters span {
            font-size: 3rem;
          }

          .moment-statement p {
            font-size: 2rem !important;
          }

          .mission-item {
            flex-direction: column;
            text-align: center;
          }

          .mission-item p {
            font-size: 1.25rem !important;
          }

          .values-grid {
            grid-template-columns: 1fr;
          }

          .reflection-line {
            font-size: 1.5rem !important;
          }

          .heart-quote blockquote {
            font-size: 1.25rem;
            padding: 32px 24px;
          }

          .cta-buttons {
            flex-direction: column;
            align-items: center;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            max-width: 280px;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
