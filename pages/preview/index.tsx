import Head from 'next/head';
import { CONFIGS, TYPE_ORDER, TYPE_LABEL } from '../../components/previewConfigs';

export default function PreviewIndex() {
  return (
    <>
      <Head>
        <title>Tavvy — Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <div className="wrap">
        <div className="head">
          <img src="/tavvy-icon.png" alt="Tavvy" className="logo" />
          <div>
            <h1>Tavvy — design preview</h1>
            <p>One review system, every business type. Tap any to open the full screen.</p>
          </div>
        </div>

        <a className="card wide" href="/preview/search">
          <div className="ic">🔍</div>
          <div className="ct"><span className="t">Search results</span><span className="s">Review cards · pick a favorite, tap in</span></div>
          <span className="chev">›</span>
        </a>

        <div className="grid">
          {TYPE_ORDER.map(type => {
            const c = CONFIGS[type];
            return (
              <a className="tile" href={`/preview/${type}`} key={type}>
                <div className="ph"><img src={c.photo} alt={c.name} /><span className="badge">{TYPE_LABEL[type]}</span></div>
                <div className="meta"><span className="name">{c.name}</span><span className="sub">{c.type}</span></div>
              </a>
            );
          })}
        </div>
        <p className="foot">Preview only · not linked in the app · built from real Tavvy components</p>
      </div>

      <style jsx>{`
        .wrap { max-width: 760px; margin: 0 auto; padding: 26px 18px 60px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .head { display: flex; align-items: center; gap: 14px; margin-bottom: 22px; }
        .logo { width: 52px; height: 52px; border-radius: 14px; }
        h1 { font-size: 21px; font-weight: 800; color: #17013A; margin: 0; letter-spacing: -0.3px; }
        .head p { font-size: 13.5px; color: #6b6880; margin: 3px 0 0; }
        .card { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid rgba(23,1,58,0.08); border-radius: 16px; padding: 15px 16px; text-decoration: none; margin-bottom: 18px; box-shadow: 0 4px 16px rgba(23,1,58,0.05); }
        .ic { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg,#00C2CB,#8A05BE); display: flex; align-items: center; justify-content: center; font-size: 20px; flex: none; }
        .ct { flex: 1; display: flex; flex-direction: column; }
        .ct .t { font-size: 16px; font-weight: 800; color: #17013A; }
        .ct .s { font-size: 13px; color: #8b8898; }
        .chev { font-size: 24px; color: #c7c4d0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .tile { background: #fff; border: 1px solid rgba(23,1,58,0.06); border-radius: 16px; overflow: hidden; text-decoration: none; box-shadow: 0 4px 16px rgba(23,1,58,0.05); }
        .ph { position: relative; width: 100%; height: 116px; }
        .ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .badge { position: absolute; top: 9px; left: 9px; font-size: 10.5px; font-weight: 800; color: #17013A; background: rgba(255,255,255,0.92); padding: 3px 9px; border-radius: 20px; }
        .meta { padding: 11px 13px 13px; display: flex; flex-direction: column; gap: 2px; }
        .name { font-size: 14.5px; font-weight: 800; color: #17013A; line-height: 1.25; }
        .sub { font-size: 12px; color: #8b8898; }
        .foot { text-align: center; font-size: 12px; color: #b3b0bd; margin-top: 26px; }
      `}</style>
      <style jsx global>{`html, body { margin: 0; padding: 0; background: #f4f5f7; } *, *::before, *::after { box-sizing: border-box; }`}</style>
    </>
  );
}
