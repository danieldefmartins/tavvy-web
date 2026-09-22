import Head from 'next/head';
import { DEMO_PLACE_SHARE } from '../../../lib/placeShareMetadata';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import PlaceScreen, { PlaceConfig } from '../../../components/PreviewPlace';
import DemoReview from '../../../components/demo/DemoReview';
import DemoContact from '../../../components/demo/DemoContact';
import { buildPlaceEvidence, EvidenceVisit } from '../../../lib/placeEvidence';
import { DEMO_MENU, DEMO_ORDER, DEMO_CARD, DEMO_GUIDE, DEMO_REVIEW_KEY, DEMO_STORY_KEY, recordDemoEvent, demoImage, demoVisits } from '../../../lib/demoRestaurant';

export default function DemoRestaurant() {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [yourReview, setYourReview] = useState<EvidenceVisit | null>(null);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [ownerStory, setOwnerStory] = useState<any>(null);
  useEffect(() => {
    recordDemoEvent('placeViews');
    try {
      const story = JSON.parse(localStorage.getItem(DEMO_STORY_KEY) || 'null');
      if (story?.media_url?.startsWith('/images/demo-trattoria/')) setOwnerStory(story);
      const stored = JSON.parse(localStorage.getItem(DEMO_REVIEW_KEY) || 'null');
      if (stored?.userId === 'demo-you' && Array.isArray(stored.signals)) setYourReview(stored);
      setSaved(localStorage.getItem('tavvy:restaurant-demo:saved') === 'true');
    } catch {}
  }, []);
  const visits = [...demoVisits(), ...(yourReview ? [yourReview] : [])];
  const evidence = buildPlaceEvidence(visits, 'restaurant');
  const names = ['Chris T.', 'Maya R.', 'Alex P.', 'Jordan K.', 'Leah M.', 'Riley C.', 'Emilia S.', 'Sofia D.', 'Oliver B.'];
  const config: PlaceConfig = {
    type: 'Restaurant', name: 'Trattoria Tavvy', photo: demoImage('dining-room'),
    meta: 'Italian · Winter Park', openLine: 'Lunch & dinner', reviewsSub: `${visits.length} guest experiences`,
    actions: [{ key: 'menu', label: 'Tavvy Menu' }, { key: 'ecard', label: 'eCard' }, { key: 'order', label: 'Order' }, { key: 'website', label: 'Website' }, { key: 'share', label: 'Share' }],
    groups: [], description: 'Pasta rolled by hand. Tomatoes at their sweetest. A candlelit table and one more story before dessert. Welcome to our little corner of Italy in Winter Park.',
    popularLabel: 'Good to know', popular: ['Handmade pasta', 'Vegetarian options', 'Date night', 'Outdoor seating'],
    info: [
      { icon: '🕒', main: 'Tuesday–Sunday · See weekly hours', hours: [['Monday', 'Closed'], ['Tuesday', '12–3 PM · 5–10 PM'], ['Wednesday', '12–3 PM · 5–10 PM'], ['Thursday', '12–3 PM · 5–10 PM'], ['Friday', '12–3 PM · 5–11 PM'], ['Saturday', '12–11 PM'], ['Sunday', '12–9 PM']] },
      { icon: '📍', main: 'Winter Park, Florida · Sample location' },
      { icon: '💳', main: 'Cards, contactless payments & cash' },
      { icon: '♿', main: 'Step-free entrance · Accessible restroom' },
    ],
    reviews: visits.map((v, i) => ({ initial: v.userId === 'demo-you' ? 'Y' : names[i][0], color: ['#155d50','#8A05BE','#A85B28'][i % 3], name: v.userId === 'demo-you' ? 'You · Demo visit' : names[i], text: names[i] === 'Oliver B.' ? 'The pasta tasted fresh, and our server helped us choose a sauce. We settled in quickly and stayed for dessert.' : names[i] === 'Sofia D.' ? 'A cozy spot for a quiet meal. The handmade pasta was the highlight, and service felt friendly without rushing us.' : undefined, when: v.userId === 'demo-you' ? 'Just now' : `${Math.round((Date.now() - Date.parse(v.visitedAt)) / 86400000)} days ago`, signals: v.signals })).reverse(),
    cta: 'Add your taps', evidence, demo: true,
    gallery: ['pasta','burrata','pizza','tiramisu','dining-room','kitchen'].map(demoImage),
    stories: [
      ...(ownerStory ? [ownerStory] : []),
      { id: 'demo-story-video', media_url: '/images/demo-trattoria/an-evening-at-tavvy.mp4', media_type: 'video', caption: 'From our kitchen to your evening · A photo story', created_at: new Date().toISOString() },
      { id: 'demo-story-kitchen', media_url: demoImage('kitchen'), media_type: 'image', caption: 'Rolled by hand. Every day.', created_at: new Date().toISOString() },
      { id: 'demo-story-burrata', media_url: demoImage('burrata'), media_type: 'image', caption: 'A little something to share', created_at: new Date().toISOString() },
    ],
    detailsContent: <DemoContact />,
  };
  return <><Head><title>Trattoria Tavvy · The complete Tavvy restaurant demo</title><meta name="robots" content="noindex,nofollow" /><meta name="description" content="Explore the complete Tavvy restaurant experience: food, stories, a visual menu, eCard and table ordering." /></Head>
    <PlaceScreen config={config} hrefs={{ share: DEMO_PLACE_SHARE.url, menu: DEMO_MENU, ecard: DEMO_CARD, order: DEMO_ORDER, website: '/app/demo/restaurant-website' }} saved={saved} onSave={() => { const next = !saved; setSaved(next); try { localStorage.setItem('tavvy:restaurant-demo:saved', String(next)); } catch {} setMessage(next ? 'Saved to your demo favorites.' : 'Removed from demo favorites.'); }} onAddReview={() => setReviewOpen(true)} />
    {reviewOpen && <DemoReview onClose={() => setReviewOpen(false)} onSave={review => { recordDemoEvent('reviews'); setYourReview(review); try { localStorage.setItem(DEMO_REVIEW_KEY, JSON.stringify(review)); } catch {} setReviewOpen(false); setMessage('Your taps now count in the review bars.'); }} />}
    {message && <div className="demo-toast" role="status">{message}<button aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button></div>}
    <style jsx>{`:global(.tavvy-demo-next){display:grid;gap:10px;margin-top:12px}:global(.tavvy-demo-next a){padding:14px;border:1px solid #b9cfc6;border-radius:12px;color:inherit;text-decoration:none;font-size:14px;font-weight:700}.demo-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:90px;width:min(420px,calc(100vw - 40px));box-sizing:border-box;padding:15px;background:#155d50;color:white;border-radius:14px;z-index:80;box-shadow:0 6px 30px #0003;display:flex;align-items:center;gap:16px;font-size:14px}.demo-toast button{background:none;border:0;color:white;font-size:24px;cursor:pointer}`}</style>
  </>;
}
