import Head from 'next/head';
import Link from 'next/link';

export default function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us - Tavvy</title>
        <meta name="description" content="Discover the story behind Tavvy - a platform born from love, resilience, and the belief that technology should guide, support, and care." />
        <meta property="og:title" content="About Us - Tavvy" />
        <meta property="og:description" content="Tavvy exists to guide, reduce uncertainty, and help people make better decisions with confidence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com/about-us" />
      </Head>

      <div className="about-page">
        {/* Hero Section */}
        <header className="about-hero">
          <Link href="/" className="about-logo-link">
            <img src="/logo-white.png" alt="Tavvy" className="about-logo" />
          </Link>
          <div className="about-hero-content">
            <h1>Why Tavvy Exists</h1>
            <p className="about-hero-subtitle">A story of meaning, resilience, and love</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="about-content">
          <article className="about-story">
            {/* Opening */}
            <section className="story-section story-opening">
              <p className="story-lead">
                Tavvy wasn't born as just a name.
              </p>
              <p className="story-lead story-emphasis">
                It became a meaning.
              </p>
            </section>

            {/* The Name */}
            <section className="story-section">
              <p>
                When I chose the name Tavvy, it sounded warm, friendly, human. A name that felt easy to say, 
                easy to trust, easy to remember. It didn't feel like a tech company or an app — it felt like 
                someone. Like a companion. Like something that walks with you.
              </p>
            </section>

            {/* The Discovery */}
            <section className="story-section story-discovery">
              <p className="story-highlight">
                Later, I discovered something that stopped me in my tracks.
              </p>
              <p>
                <strong>TAVI</strong> — pronounced exactly like Tavvy — is the name of the life-saving heart procedure 
                my son Bryan will likely need to undergo, possibly more than once, throughout his life.
              </p>
              <p className="story-emphasis">
                That moment changed everything.
              </p>
            </section>

            {/* The Meaning */}
            <section className="story-section">
              <p>
                TAVI is a procedure designed to restore flow, to give the heart a second chance, to allow life 
                to keep moving forward when the path isn't easy. It exists to reduce risk, to bring clarity, 
                to help people live better lives when they need help the most.
              </p>
              <p className="story-emphasis">
                And suddenly, Tavvy wasn't just a name anymore.
              </p>
              <p className="story-highlight">
                It was a mirror of our story.
              </p>
            </section>

            {/* Bryan's Journey */}
            <section className="story-section story-journey">
              <p>
                Bryan's journey taught us what it means to trust systems we don't fully understand. To rely on 
                experts. To hope that the right decision, at the right moment, can change everything. It taught 
                us resilience, patience, and the value of guidance when you're facing something bigger than yourself.
              </p>
              <p className="story-emphasis">
                That's exactly what Tavvy is meant to be.
              </p>
            </section>

            {/* Mission */}
            <section className="story-section story-mission">
              <div className="mission-block">
                <p>Tavvy exists to <strong>guide</strong>.</p>
                <p>To <strong>reduce uncertainty</strong>.</p>
                <p>To help people make <strong>better decisions</strong> with confidence.</p>
              </div>
            </section>

            {/* The Connection */}
            <section className="story-section">
              <p>
                Just like TAVI supports a heart when it needs it most, Tavvy supports people when they're 
                choosing where to go, who to trust, what to experience, and how to live better moments with 
                the people they love.
              </p>
            </section>

            {/* Reflection */}
            <section className="story-section story-reflection">
              <p className="story-highlight">
                The connection wasn't planned.
              </p>
              <p className="story-highlight">
                It was discovered.
              </p>
              <p className="story-emphasis">
                And sometimes, the most meaningful things are.
              </p>
            </section>

            {/* The Heart */}
            <section className="story-section story-heart">
              <p>
                Tavvy carries Bryan's story quietly inside it — a reminder that behind technology, data, and 
                design, there is life. There are families. There are second chances. There is love.
              </p>
            </section>

            {/* Values */}
            <section className="story-section story-values">
              <p>Tavvy isn't just about places, experiences, or reviews.</p>
              <div className="values-block">
                <p>It's about <strong>care</strong>.</p>
                <p>It's about <strong>trust</strong>.</p>
                <p>It's about <strong>moving forward</strong>, even when the road is uncertain.</p>
              </div>
            </section>

            {/* Closing */}
            <section className="story-section story-closing">
              <p>Just like our son did.</p>
              <p className="story-final">Just like he still does — every single day.</p>
              <div className="heart-emoji">💙</div>
            </section>
          </article>

          {/* Call to Action */}
          <section className="about-cta">
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
              <Link href="/" className="btn-secondary">
                Back to Home
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="about-footer">
          <div className="footer-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="mailto:support@tavvy.com">Contact</a>
          </div>
          <p className="footer-copyright">© {new Date().getFullYear()} Tavvy, Inc. All rights reserved.</p>
        </footer>
      </div>

      <style jsx>{`
        .about-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0F1233 0%, #1a1f4e 100%);
        }

        /* Hero Section */
        .about-hero {
          background: linear-gradient(135deg, #0F1233 0%, #1E293B 50%, #0F1233 100%);
          padding: 60px 24px 80px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .about-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 70% 70%, rgba(249, 115, 22, 0.08) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-2%, 2%) rotate(1deg); }
        }

        .about-logo-link {
          display: inline-block;
          position: relative;
          z-index: 1;
        }

        .about-logo {
          height: 50px;
          width: auto;
          margin-bottom: 40px;
        }

        .about-hero-content {
          position: relative;
          z-index: 1;
        }

        .about-hero h1 {
          font-size: 3rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        .about-hero-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        /* Main Content */
        .about-content {
          flex: 1;
          background: #FFFFFF;
          border-radius: 32px 32px 0 0;
          margin-top: -32px;
          position: relative;
          z-index: 2;
        }

        .about-story {
          max-width: 720px;
          margin: 0 auto;
          padding: 64px 24px;
        }

        /* Story Sections */
        .story-section {
          margin-bottom: 40px;
        }

        .story-section p {
          font-size: 1.125rem;
          line-height: 1.8;
          color: #334155;
          margin-bottom: 20px;
        }

        .story-lead {
          font-size: 1.5rem !important;
          font-weight: 500;
          color: #0F172A !important;
          text-align: center;
        }

        .story-emphasis {
          font-size: 1.25rem !important;
          font-weight: 600;
          color: #0F172A !important;
          font-style: italic;
        }

        .story-highlight {
          font-size: 1.375rem !important;
          font-weight: 600;
          color: #3B82F6 !important;
          text-align: center;
        }

        /* Mission Block */
        .story-mission {
          background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%);
          border-radius: 20px;
          padding: 40px 32px;
          margin: 48px 0;
        }

        .mission-block p {
          font-size: 1.5rem !important;
          font-weight: 600;
          color: #1E40AF !important;
          text-align: center;
          margin-bottom: 12px !important;
        }

        .mission-block p:last-child {
          margin-bottom: 0 !important;
        }

        /* Values Block */
        .story-values {
          text-align: center;
        }

        .values-block {
          background: linear-gradient(135deg, #FFF7ED 0%, #FFFBEB 100%);
          border-radius: 20px;
          padding: 32px;
          margin-top: 24px;
        }

        .values-block p {
          font-size: 1.375rem !important;
          font-weight: 600;
          color: #C2410C !important;
          margin-bottom: 8px !important;
        }

        .values-block p:last-child {
          margin-bottom: 0 !important;
        }

        /* Story Heart Section */
        .story-heart {
          background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
          border-radius: 20px;
          padding: 32px;
          border-left: 4px solid #10B981;
        }

        .story-heart p {
          color: #065F46 !important;
          font-size: 1.125rem !important;
          margin-bottom: 0 !important;
        }

        /* Closing Section */
        .story-closing {
          text-align: center;
          padding-top: 24px;
        }

        .story-closing p {
          font-size: 1.25rem !important;
          color: #64748B !important;
        }

        .story-final {
          font-weight: 600;
          color: #0F172A !important;
        }

        .heart-emoji {
          font-size: 3rem;
          margin-top: 32px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* CTA Section */
        .about-cta {
          background: linear-gradient(135deg, #0F1233 0%, #1E293B 100%);
          padding: 64px 24px;
          text-align: center;
        }

        .about-cta h2 {
          font-size: 2rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 16px;
        }

        .about-cta > p {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 32px;
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
          gap: 8px;
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          color: #FFFFFF;
          padding: 16px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
          text-decoration: none;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          background: transparent;
          color: #FFFFFF;
          padding: 16px 32px;
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
          text-decoration: none;
        }

        /* Footer */
        .about-footer {
          background: #0F1233;
          padding: 32px 24px;
          text-align: center;
        }

        .footer-links {
          display: flex;
          gap: 24px;
          justify-content: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .footer-links a {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-links a:hover {
          color: #FFFFFF;
        }

        .footer-copyright {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .about-hero {
            padding: 40px 20px 60px;
          }

          .about-hero h1 {
            font-size: 2.25rem;
          }

          .about-hero-subtitle {
            font-size: 1.1rem;
          }

          .about-story {
            padding: 48px 20px;
          }

          .story-section p {
            font-size: 1rem;
          }

          .story-lead {
            font-size: 1.25rem !important;
          }

          .story-highlight {
            font-size: 1.125rem !important;
          }

          .mission-block p {
            font-size: 1.25rem !important;
          }

          .values-block p {
            font-size: 1.125rem !important;
          }

          .about-cta h2 {
            font-size: 1.5rem;
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
