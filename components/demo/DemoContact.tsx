import { useState } from 'react';
import Link from 'next/link';
import DemoDialog from './DemoDialog';
import { DEMO_ORDER, DEMO_HOME } from '../../lib/demoRestaurant';
export default function DemoContact() {
  const [action, setAction] = useState<string | null>(null);
  const [reserved, setReserved] = useState(false);
  const [date, setDate] = useState('');
  return <section className="contact-demo">
    <h2>Plan your visit</h2><p>Everything you need for a good evening.</p>
    <div className="contact-grid"><button onClick={() => setAction('Call')}>☎ Call the restaurant<span>(407) 555-0142</span></button><button onClick={() => { setReserved(false); setAction('Reserve a table'); }}>◷ Reserve a table<span>Choose your evening</span></button><Link href="/app/demo/restaurant-website">↗ Website<span>Meet the restaurant</span></Link><a href="https://www.google.com/maps/search/?api=1&query=Winter+Park+Florida" target="_blank" rel="noopener noreferrer">⌖ Neighborhood<span>Explore Winter Park, FL</span></a></div>
    <h3>Order your way</h3><div className="contact-links"><Link href={DEMO_ORDER}>Tavvy table ordering</Link>{['DoorDash', 'Uber Eats', 'Grubhub'].map(p => <button key={p} onClick={() => setAction(p)}>{p}</button>)}</div>
    <h3>Follow the food & the room</h3><div className="contact-links">{['Instagram', 'TikTok', 'Facebook'].map(p => <button key={p} onClick={() => setAction(p)}>{p}</button>)}</div>
    {action && <DemoDialog title={action} onClose={() => setAction(null)}>
      {action === 'Reserve a table' ? reserved ? <><p><strong>Your demo reservation is confirmed.</strong></p><p>{date} · A table for your evening. No real booking has been made.</p><button className="demo-primary" onClick={() => setAction(null)}>Back to the restaurant</button></> : <form onSubmit={e => { e.preventDefault(); setReserved(true); }}>
        <p>Try a reservation flow. A restaurant can link its own reservation provider here.</p>
        <label>Date<input required type="date" value={date} min={new Date().toLocaleDateString('en-CA')} onChange={e => setDate(e.target.value)} /></label>
        <label>Time<select><option>5:00 PM</option><option>6:30 PM</option><option>8:00 PM</option></select></label>
        <label>Party size<select>{[2,3,4,5,6].map(n => <option key={n}>{n} guests</option>)}</select></label><button className="demo-primary">Try a reservation</button>
      </form> : action === 'Call' ? <><p>One tap on a real restaurant’s phone number opens the phone app.</p><p>This fictional restaurant uses a reserved demonstration number: <strong>(407) 555-0142</strong>.</p></> : ['DoorDash','Uber Eats','Grubhub'].includes(action) ? <><p>A restaurant’s verified {action} listing opens here. Trattoria Tavvy is fictional and has no delivery listing.</p><a className="demo-primary" href={DEMO_ORDER}>Try Tavvy ordering instead</a></> : <><p>A restaurant’s own {action} profile opens here. See the food and stories in this demo to explore the same decision-making experience.</p><a className="demo-primary" href={`${DEMO_HOME}?tab=media`}>See photos & stories</a></>}
    </DemoDialog>}
    <style jsx>{`.contact-demo{padding:24px 0;border-bottom:1px solid #d7dfdc}.contact-demo h2{font-size:22px;margin:0 0 6px}.contact-demo p{font-size:14px;opacity:.75}.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}.contact-grid button,.contact-grid :global(a){padding:15px;border:1px solid #b9cfc6;border-radius:14px;background:transparent;color:inherit;text-decoration:none;text-align:left;font:inherit;font-size:14px;font-weight:700;cursor:pointer}.contact-grid span{display:block;font-size:12px;font-weight:400;margin-top:8px;opacity:.75}h3{font-size:15px;margin:24px 0 10px}.contact-links{display:flex;flex-wrap:wrap;gap:8px}.contact-links button,.contact-links :global(a){padding:10px 13px;border:1px solid #b9cfc6;border-radius:20px;background:transparent;color:inherit;text-decoration:none;font:inherit;font-size:13px;cursor:pointer}label{display:block;font-size:14px;font-weight:700;margin:16px 0}input,select{display:block;width:100%;box-sizing:border-box;padding:12px;border:1px solid #b9cfc6;border-radius:10px;margin-top:8px;background:white;color:#152921;font:inherit}`}</style>
  </section>;
}
