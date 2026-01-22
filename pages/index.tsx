import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>Tavvy - Signal-Based Community Reviews</title>
        <meta name="description" content="Tavvy is a community-powered, signal-based location review platform. Replace star ratings with structured, tap-based signals." />
        <meta property="og:title" content="Tavvy - Signal-Based Community Reviews" />
        <meta property="og:description" content="Discover what places are good for, how they feel, and what to watch out for — using tap-based signals." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com" />
      </Head>

      <div className="landing-page">
        <header className="landing-hero">
          <img src="/logo-white.png" alt="Tavvy" className="landing-logo" />
          <h1>Reviews, Reimagined</h1>
          <p>
            Tavvy replaces star ratings and long reviews with structured, tap-based signals. 
            Discover what places are good for, how they feel, and what to watch out for.
          </p>
          <div className="landing-cta">
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
            <a href="#features" className="btn-secondary">
              Learn More
            </a>
          </div>
        </header>

        <section id="features" className="landing-features">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👆</div>
              <h3>Tap-Based Signals</h3>
              <p>
                No more writing paragraphs. Just tap on signals that match your experience — 
                1 tap for mild, 2 for moderate, 3 for strong.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Structured Insights</h3>
              <p>
                See what a place is actually good for at a glance. Great for dates? 
                Family-friendly? Good for working? Find out instantly.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Honest</h3>
              <p>
                Review in seconds, not minutes. Our signal system captures real experiences 
                without the fluff or fake reviews.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Location-Aware</h3>
              <p>
                Discover places near you, sorted by what matters. Filter by signals to find 
                exactly what you're looking for.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Community-Powered</h3>
              <p>
                Real signals from real people. See how the community experiences places, 
                not just what businesses want you to see.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏢</div>
              <h3>Tavvy Pros</h3>
              <p>
                For business owners and service professionals. Connect with customers, 
                manage your presence, and grow your business.
              </p>
            </div>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footer-links">
            <Link href="/about-us">About Us</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="mailto:support@tavvy.com">Contact</a>
          </div>
          <p>© 2026 Tavvy, Inc. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
