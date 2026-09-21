import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DemoBanner from '../../../components/demo/DemoBanner';
import DemoQR from '../../../components/demo/DemoQR';
import DemoContact from '../../../components/demo/DemoContact';
import { DEMO_HOME, DEMO_MENU, DEMO_ORDER, DEMO_CARD, recordDemoEvent, demoImage } from '../../../lib/demoRestaurant';

export default function DemoRestaurantCard() {
  useEffect(() => { recordDemoEvent('ecardViews'); }, []);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const saveContact = () => {
    const vcard = ['BEGIN:VCARD','VERSION:3.0','FN:Trattoria Tavvy (Demo)','ORG:Trattoria Tavvy (Demo)','TEL;TYPE=WORK:+14075550142',`URL:https://tavvy.com${DEMO_HOME}`,'NOTE:Fictional Tavvy restaurant demonstration.','END:VCARD'].join('\r\n');
    if ((window as any).ReactNativeWebView) { (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'download-contact', content: vcard })); return; }
    const url = URL.createObjectURL(new Blob([vcard], { type: 'text/vcard' }));
    const a = document.createElement('a'); a.href = url; a.download = 'trattoria-tavvy-demo.vcf'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const share = async () => {
    const url = `https://tavvy.com${DEMO_CARD}`;
    try { if (navigator.share) await navigator.share({ title: 'Trattoria Tavvy · eCard', url }); else { await navigator.clipboard.writeText(url); setCopied(true); } } catch {}
  };
  return <><Head><title>Trattoria Tavvy · Tavvy eCard</title><meta name="robots" content="noindex,nofollow" /></Head>
    <main className="ecard-page"><div className="ecard-wrap"><DemoBanner /><Link className="back" href={DEMO_HOME}>← Back to the place</Link>
      <article className="ecard"><div className="cover"><img src={demoImage('dining-room')} alt="A warm, candlelit dining room" /><div className="cover-copy"><span>TRATTORIA</span><h1>Tavvy</h1><p>A little Italy. A lot of heart.</p></div></div>
        <div className="body"><span className="eyebrow">YOUR NEXT FAVORITE EVENING</span><h2>Come for the pasta.<br />Stay for the company.</h2><p>Handmade pasta, generous plates and a warm neighborhood table in Winter Park, Florida.</p>
          <div className="main-actions"><Link href={DEMO_MENU}>Explore our Tavvy Menu ↗</Link><Link href={DEMO_ORDER}>Order at your table ↗</Link><Link href={`${DEMO_HOME}?tab=media`}>See the food & stories ↗</Link></div>
          <div className="utility"><button onClick={saveContact}>Save contact</button><button onClick={share}>{copied ? 'Link copied ✓' : 'Share eCard'}</button><button aria-expanded={showQR} onClick={() => setShowQR(v => !v)}>QR code</button></div>
          {showQR && <div className="qr-wrap"><DemoQR path={DEMO_CARD} label="Scan to open this restaurant eCard" /></div>}
          <div className="photos">{['pasta','burrata','tiramisu'].map(p => <Link key={p} href={DEMO_MENU}><img src={demoImage(p)} alt={p === 'pasta' ? 'Handmade rigatoni' : p === 'burrata' ? 'Burrata with tomatoes' : 'House tiramisu'} /></Link>)}</div>
          <DemoContact />
          <div className="hours"><strong>At our table</strong><p>Tuesday–Thursday · 12–3 PM & 5–10 PM<br />Friday · 12–3 PM & 5–11 PM<br />Saturday · 12–11 PM · Sunday · 12–9 PM</p></div>
          <Link className="review-link" href={DEMO_HOME}>See what guests experienced on Tavvy →</Link>
        </div></article><p className="powered">One beautiful link. Every way to find you. · Powered by Tavvy</p>
      </div></main>
    <style jsx>{`.ecard-page{min-height:100vh;background:#eee9df;padding:0 16px 60px;color:#193b32}.ecard-wrap{max-width:620px;margin:auto}.ecard-wrap :global(.back){display:block;padding:18px 0;color:#255e4d;text-decoration:none;font-size:13px}.ecard{overflow:hidden;border-radius:24px;background:#fffcf5;box-shadow:0 18px 70px #15382c20}.cover{height:360px;position:relative}.cover>img{width:100%;height:100%;object-fit:cover}.cover:after{content:'';position:absolute;inset:0;background:linear-gradient(transparent,#071d16dd)}.cover-copy{position:absolute;bottom:30px;left:30px;color:#fff;z-index:1}.cover-copy span{font-size:12px;letter-spacing:5px}.cover-copy h1{font:italic 70px/1.05 Georgia,serif;margin:6px 0}.cover-copy p{font-size:14px;margin:8px 0 0}.body{padding:28px}.eyebrow{letter-spacing:2px;font-size:10px;font-weight:800;color:#9b7038}.body h2{font:32px/1.18 Georgia,serif;margin:12px 0}.body>p{font-size:15px;line-height:1.65;color:#63736c}.main-actions{display:grid;gap:10px;margin:24px 0 16px}.main-actions :global(a){text-decoration:none;background:#195b49;color:white;padding:16px;border-radius:12px;font-size:14px;font-weight:700}.main-actions :global(a:nth-child(n+2)){background:#eef2e8;color:#244d3e}.utility{display:flex;gap:8px;flex-wrap:wrap}.utility button{flex:1;padding:12px 8px;border:1px solid #c2cdbd;border-radius:10px;background:none;color:#234d3e;cursor:pointer;font-size:12px}.photos{display:flex;gap:8px;margin-top:26px}.photos :global(a){width:33.333%}.photos img{width:100%;height:130px;object-fit:cover;border-radius:12px}.qr-wrap{padding:24px 0}.hours{padding:24px 0;font-size:14px;line-height:1.7}.body :global(.review-link){display:block;color:#195b49;text-decoration:none;font-weight:700;font-size:14px}.powered{text-align:center;font-size:11px;color:#607269;margin-top:25px}@media(max-width:420px){.ecard-page{padding:0 8px 40px}.body{padding:22px}.cover{height:300px}}`}</style>
  </>;
}
