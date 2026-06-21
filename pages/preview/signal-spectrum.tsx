/**
 * PREVIEW ONLY — full-screen design proposal. Not linked anywhere in the app.
 * Renders the proposed "Signal Spectrum" place screen using the REAL SignalPill
 * component + real design tokens, full-bleed like the actual app so it can be
 * judged at full size on a phone. Delete after the design decision is made.
 */
import React from 'react';
import Head from 'next/head';
import SignalPill, { SignalCategory } from '../../components/SignalPill';

type Sig = { label: string; tapCount: number; category: SignalCategory; emoji?: string };

const SIGNALS: Sig[] = [
  { label: 'Amazing Pastries', tapCount: 142, category: 'good', emoji: '🥐' },
  { label: 'Great Coffee', tapCount: 98, category: 'good', emoji: '☕' },
  { label: 'Cozy', tapCount: 76, category: 'vibe', emoji: '🛋️' },
  { label: 'Long Wait', tapCount: 45, category: 'headsup', emoji: '⏳' },
];

const PHOTO = '/preview-bakery.jpg';

export default function SignalSpectrumPreview() {
  return (
    <>
      <Head>
        <title>Signal Spectrum — preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="screen">
        {/* Full-bleed hero */}
        <div className="hero">
          <img src={PHOTO} alt="Tatte Bakery & Café" className="hero-img" />
          <div className="hero-scrim" />
          <button className="icon-btn back" aria-label="Back">‹</button>
          <button className="icon-btn save" aria-label="Save">♡</button>
          <div className="hero-text">
            <h1 className="name">Tatte Bakery &amp; Café</h1>
            <p className="meta">Bakery · Boston, MA · 0.4 mi · Open till 8pm</p>
          </div>
        </div>

        {/* Content sheet */}
        <div className="sheet">
          <div className="section">
            <div className="section-head">
              <span className="section-title">Signal Spectrum</span>
              <span className="section-sub">361 taps</span>
            </div>
            <p className="section-desc">What people consistently feel about this place — at a glance.</p>
            <div className="spectrum">
              {SIGNALS.map((s, i) => (
                <SignalPill
                  key={i}
                  label={s.label}
                  tapCount={s.tapCount}
                  category={s.category}
                  emoji={s.emoji}
                  size="md"
                  showCount
                />
              ))}
            </div>
          </div>

          <div className="divider" />

          <div className="section">
            <span className="section-title">About</span>
            <p className="about">All-day café and bakery known for shakshuka, flaky pastries and a sunlit room. A local favorite for slow weekend mornings.</p>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="actionbar">
          <button className="act ghost">Directions</button>
          <button className="act primary">Add a Signal</button>
        </div>
      </div>

      <style jsx>{`
        .screen {
          max-width: 480px;
          margin: 0 auto;
          min-height: 100vh;
          background: #fff;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
          padding-bottom: 92px;
        }
        .hero { position: relative; width: 100%; height: 46vh; min-height: 300px; }
        .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .hero-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%);
        }
        .icon-btn {
          position: absolute; top: 18px;
          width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(255,255,255,0.92);
          font-size: 22px; line-height: 1; color: #17013A; cursor: pointer;
          box-shadow: 0 2px 10px rgba(0,0,0,0.18);
          display: flex; align-items: center; justify-content: center;
        }
        .back { left: 16px; }
        .save { right: 16px; font-size: 19px; }
        .hero-text { position: absolute; left: 20px; right: 20px; bottom: 18px; }
        .name { color: #fff; font-size: 28px; font-weight: 800; margin: 0 0 6px; letter-spacing: -0.4px; text-shadow: 0 2px 12px rgba(0,0,0,0.4); }
        .meta { color: rgba(255,255,255,0.92); font-size: 14px; margin: 0; text-shadow: 0 1px 8px rgba(0,0,0,0.4); }
        .sheet {
          position: relative;
          margin-top: -22px;
          background: #fff;
          border-radius: 26px 26px 0 0;
          padding: 26px 20px 8px;
          box-shadow: 0 -8px 24px rgba(23,1,58,0.06);
        }
        .section { padding: 6px 0 18px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; }
        .section-title { font-size: 18px; font-weight: 800; color: #17013A; letter-spacing: -0.2px; }
        .section-sub { font-size: 13px; font-weight: 700; color: #00C2CB; }
        .section-desc { font-size: 13.5px; color: #6b6880; margin: 4px 0 16px; }
        .spectrum { display: flex; flex-wrap: wrap; gap: 10px; }
        .divider { height: 1px; background: rgba(23,1,58,0.07); margin: 2px 0; }
        .about { font-size: 14.5px; line-height: 1.6; color: #4a475c; margin: 8px 0 0; }
        .actionbar {
          position: fixed; left: 0; right: 0; bottom: 0;
          max-width: 480px; margin: 0 auto;
          display: flex; gap: 12px;
          padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(23,1,58,0.07);
        }
        .act { flex: 1; padding: 15px 0; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; }
        .act.ghost { background: rgba(23,1,58,0.06); color: #17013A; }
        .act.primary { background: #00C2CB; color: #fff; box-shadow: 0 6px 18px rgba(0,194,203,0.35); }
      `}</style>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; background: #fff; }
      `}</style>
    </>
  );
}
