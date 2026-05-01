import Head from 'next/head';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Head>
        <title>Tavvy — Real Experiences, Not Fake Stars</title>
        <meta name="description" content="Stop guessing with meaningless star ratings. Tavvy shows you real signals from real people — what's actually great, the vibe, and what to watch out for." key="description" />
        <meta property="og:title" content="Tavvy — Real Experiences, Not Fake Stars" key="og:title" />
        <meta property="og:description" content="Stop guessing with meaningless star ratings. Tavvy shows you real signals from real people." key="og:description" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com" />
        <link rel="canonical" href="https://tavvy.com" />
      </Head>

      <div className="landing">
        {/* Nav */}
        <nav className="landing-nav">
          <div className="nav-inner">
            <img src="/tavvy-logo-white.png" alt="Tavvy" className="nav-logo" />
            <div className="nav-links">
              <Link href="/ecard" className="nav-link">eCards</Link>
              <Link href="/about-us" className="nav-link">About</Link>
              <Link href="/app" className="nav-cta">Open App</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-glow-purple" />
          <div className="hero-glow-teal" />
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              The future of reviews
            </div>
            <h1 className="hero-title">
              Real experiences,<br />
              <span className="hero-gradient">not fake stars.</span>
            </h1>
            <p className="hero-subtitle">
              Star ratings are broken. A "4.5" tells you nothing about the food, the vibe, or the service.
              Tavvy shows you specific signals from real people — so you always know exactly what to expect.
            </p>
            <div className="hero-actions">
              <Link href="/app" className="btn-primary">
                Explore Tavvy
              </Link>
              <Link href="/app/pros" className="btn-ghost">
                I'm a Pro
              </Link>
            </div>
          </div>
        </section>

        {/* Stars vs Signals */}
        <section className="compare-section">
          <div className="compare-inner">
            <div className="compare-old">
              <div className="compare-label-old">What stars tell you</div>
              <div className="stars-display">★★★★☆</div>
              <div className="stars-number">4.2</div>
              <p className="compare-desc">Is the food good? Is the service slow? Is it good for a date? You have no idea.</p>
            </div>

            <div className="compare-vs">vs</div>

            <div className="compare-new">
              <div className="compare-label-new">What Tavvy tells you</div>
              <div className="pills-display">
                <span className="pill pill-good">🍕 Amazing Food ×42</span>
                <span className="pill pill-good">☕ Best Latte ×38</span>
                <span className="pill pill-vibe">💑 Perfect Date Night ×23</span>
                <span className="pill pill-heads">🐌 Slow Service ×15</span>
                <span className="pill pill-good">😊 Friendly Staff ×12</span>
              </div>
              <p className="compare-desc-new">Now you know. Great food, perfect for a date, just don't rush.</p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="how-section">
          <h2 className="section-title">How Tavvy Works</h2>
          <p className="section-subtitle">Three signal categories tell you everything star ratings hide.</p>

          <div className="how-grid">
            <div className="how-card">
              <div className="how-dot" style={{ background: '#00C2CB' }} />
              <h3 className="how-name">The Good</h3>
              <p className="how-desc">What this place does best. Best Tacos, Great WiFi, Friendly Staff, Punctual — specific qualities that matter to you.</p>
              <div className="how-pills">
                <span className="mini-pill pill-good">🌮 Best Tacos</span>
                <span className="mini-pill pill-good">📶 Great WiFi</span>
                <span className="mini-pill pill-good">⏰ Punctual</span>
              </div>
            </div>

            <div className="how-card">
              <div className="how-dot" style={{ background: '#8A05BE' }} />
              <h3 className="how-name">The Vibe</h3>
              <p className="how-desc">What it feels like to be there. Cozy, Lively, Romantic, Family-Friendly — context that numbers can't capture.</p>
              <div className="how-pills">
                <span className="mini-pill pill-vibe">🛋️ Cozy Vibes</span>
                <span className="mini-pill pill-vibe">🎵 Live Music</span>
                <span className="mini-pill pill-vibe">💑 Date Night</span>
              </div>
            </div>

            <div className="how-card">
              <div className="how-dot" style={{ background: '#F5A623' }} />
              <h3 className="how-name">Heads Up</h3>
              <p className="how-desc">What to watch out for. Slow Service, Cash Only, Hard to Park — honest warnings that help you plan ahead.</p>
              <div className="how-pills">
                <span className="mini-pill pill-heads">🐌 Slow Service</span>
                <span className="mini-pill pill-heads">💰 Cash Only</span>
                <span className="mini-pill pill-heads">🅿️ Hard to Park</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pros */}
        <section className="pros-section">
          <div className="pros-inner">
            <div className="pros-text">
              <h2 className="section-title" style={{ textAlign: 'left' }}>Built for Pros, too.</h2>
              <p className="pros-desc">
                Contractors, plumbers, realtors, and service providers build verified reputations on Tavvy.
                No pay-per-lead fees. No fake reviews. Just real signals from real clients.
              </p>
              <div className="how-pills" style={{ justifyContent: 'flex-start' }}>
                <span className="mini-pill pill-good">⏰ Punctual ×34</span>
                <span className="mini-pill pill-good">💬 Communicates Well ×29</span>
                <span className="mini-pill pill-good">💰 Fairly Priced ×25</span>
                <span className="mini-pill pill-good">🧹 Clean Work ×19</span>
              </div>
              <Link href="/app/pros" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
                Join Tavvy Pros — it's free
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <h2 className="cta-title">Stop guessing.<br /><span className="hero-gradient">Start experiencing.</span></h2>
          <p className="cta-subtitle">Join the platform where stars are dead and real signals thrive.</p>
          <Link href="/app" className="btn-primary btn-large">
            Explore Tavvy
          </Link>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-inner">
            <img src="/tavvy-logo-white.png" alt="Tavvy" className="footer-logo" />
            <div className="footer-links">
              <Link href="/about-us">About</Link>
              <Link href="/ecard">eCards</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
            <p className="footer-copy">© {new Date().getFullYear()} Tavvy. Real experiences, not fake stars.</p>
          </div>
        </footer>
      </div>

      <style jsx>{`
        .landing {
          background: #17013A;
          color: #F1F5F9;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Nav */
        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 24px;
          background: rgba(23, 1, 58, 0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo { height: 28px; }
        .nav-links { display: flex; align-items: center; gap: 32px; }
        .landing-nav :global(.nav-link) {
          color: #9394A1;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .landing-nav :global(.nav-link:hover) { color: #F1F5F9; }
        .landing-nav :global(.nav-cta) {
          background: #8A05BE;
          color: white;
          padding: 10px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .landing-nav :global(.nav-cta:hover) { background: #9B10D4; }

        /* Hero */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 120px 24px 80px;
          position: relative;
          overflow: hidden;
        }
        .hero-glow-purple {
          position: absolute;
          top: -200px;
          right: -200px;
          width: 600px;
          height: 600px;
          background: rgba(138, 5, 190, 0.12);
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }
        .hero-glow-teal {
          position: absolute;
          bottom: -150px;
          left: -150px;
          width: 400px;
          height: 400px;
          background: rgba(0, 194, 203, 0.08);
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 800px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          background: rgba(138, 5, 190, 0.15);
          border: 1px solid rgba(138, 5, 190, 0.25);
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          color: #C77DFF;
          margin-bottom: 28px;
        }
        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00C2CB;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hero-title {
          font-size: 72px;
          font-weight: 900;
          letter-spacing: -3px;
          line-height: 1.05;
          margin-bottom: 24px;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #8A05BE, #00C2CB);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 20px;
          line-height: 1.7;
          color: #9394A1;
          max-width: 600px;
          margin: 0 auto 40px;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .landing :global(.btn-primary) {
          padding: 16px 36px;
          background: #8A05BE;
          color: white;
          border-radius: 14px;
          font-weight: 700;
          font-size: 17px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .landing :global(.btn-primary:hover) { background: #9B10D4; transform: translateY(-2px); }
        .landing :global(.btn-large) { padding: 20px 48px; font-size: 19px; }
        .landing :global(.btn-ghost) {
          padding: 16px 36px;
          background: rgba(0, 194, 203, 0.1);
          color: #00C2CB;
          border: 1px solid rgba(0, 194, 203, 0.2);
          border-radius: 14px;
          font-weight: 700;
          font-size: 17px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .landing :global(.btn-ghost:hover) { background: rgba(0, 194, 203, 0.18); transform: translateY(-2px); }

        /* Compare */
        .compare-section {
          padding: 100px 24px;
          background: #0D0127;
        }
        .compare-inner {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 60px 1fr;
          align-items: center;
          gap: 0;
        }
        .compare-old {
          background: rgba(255,255,255,0.03);
          border-radius: 24px;
          padding: 48px 40px;
          text-align: center;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .compare-label-old {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #6B6B80;
          margin-bottom: 24px;
        }
        .stars-display {
          font-size: 48px;
          color: #D4A843;
          margin-bottom: 8px;
          opacity: 0.5;
        }
        .stars-number {
          font-size: 40px;
          font-weight: 900;
          color: #6B6B80;
          margin-bottom: 16px;
        }
        .compare-desc {
          font-size: 15px;
          color: #6B6B80;
          line-height: 1.6;
        }
        .compare-vs {
          text-align: center;
          font-size: 24px;
          font-weight: 900;
          color: #6B6B80;
        }
        .compare-new {
          background: rgba(138, 5, 190, 0.06);
          border-radius: 24px;
          padding: 48px 40px;
          text-align: center;
          border: 1px solid rgba(138, 5, 190, 0.15);
        }
        .compare-label-new {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #00C2CB;
          margin-bottom: 24px;
        }
        .pills-display {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-bottom: 20px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
        }
        .pill-good { background: rgba(0,194,203,0.12); color: #5EEAEF; border: 1px solid rgba(0,194,203,0.2); }
        .pill-vibe { background: rgba(138,5,190,0.12); color: #C77DFF; border: 1px solid rgba(138,5,190,0.2); }
        .pill-heads { background: rgba(245,166,35,0.12); color: #FFB84D; border: 1px solid rgba(245,166,35,0.2); }
        .compare-desc-new {
          font-size: 15px;
          color: #00C2CB;
          line-height: 1.6;
          font-weight: 500;
        }

        /* How it works */
        .how-section {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .section-title {
          font-size: 42px;
          font-weight: 900;
          text-align: center;
          letter-spacing: -1px;
          margin-bottom: 12px;
        }
        .section-subtitle {
          text-align: center;
          font-size: 18px;
          color: #9394A1;
          margin-bottom: 60px;
        }
        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .how-card {
          background: #1E0A3C;
          border-radius: 24px;
          padding: 36px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .how-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-bottom: 16px;
        }
        .how-name {
          font-size: 22px;
          font-weight: 800;
          margin-bottom: 12px;
        }
        .how-desc {
          font-size: 15px;
          color: #9394A1;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .how-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .mini-pill {
          padding: 8px 14px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
        }

        /* Pros */
        .pros-section {
          padding: 100px 24px;
          background: #0D0127;
        }
        .pros-inner {
          max-width: 800px;
          margin: 0 auto;
        }
        .pros-desc {
          font-size: 18px;
          color: #9394A1;
          line-height: 1.7;
          margin-bottom: 24px;
        }

        /* CTA */
        .cta-section {
          padding: 120px 24px;
          text-align: center;
        }
        .cta-title {
          font-size: 52px;
          font-weight: 900;
          letter-spacing: -2px;
          margin-bottom: 16px;
        }
        .cta-subtitle {
          font-size: 18px;
          color: #9394A1;
          margin-bottom: 40px;
        }

        /* Footer */
        .landing-footer {
          padding: 48px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-logo { height: 24px; opacity: 0.5; }
        .footer-links { display: flex; gap: 24px; }
        .footer-links :global(a) { color: #6B6B80; text-decoration: none; font-size: 14px; }
        .footer-links :global(a:hover) { color: #F1F5F9; }
        .footer-copy { font-size: 13px; color: #6B6B80; }

        @media (max-width: 768px) {
          .hero-title { font-size: 42px; letter-spacing: -2px; }
          .hero-subtitle { font-size: 17px; }
          .compare-inner { grid-template-columns: 1fr; gap: 16px; }
          .compare-vs { padding: 8px 0; }
          .how-grid { grid-template-columns: 1fr; }
          .section-title { font-size: 32px; }
          .cta-title { font-size: 36px; }
          .hero-actions { flex-direction: column; align-items: center; }
          .footer-inner { flex-direction: column; gap: 16px; text-align: center; }
          .nav-links { gap: 16px; }
        }
      `}</style>
    </>
  );
}

export const getStaticProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
