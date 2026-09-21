import Link from 'next/link';
import { DEMO_GUIDE, DEMO_HOME } from '../../lib/demoRestaurant';

export default function DemoBanner({ compact = false }: { compact?: boolean }) {
  return <aside className="demo-notice" aria-label="Restaurant demonstration">
    <Link href={DEMO_HOME}>Tavvy restaurant demo</Link>
    {!compact && <span>Fictional restaurant · Try every feature</span>}
    <Link href={DEMO_GUIDE}>For restaurant owners ↗</Link>
    <style jsx>{`.demo-notice { display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:11px 16px;background:#eaf7f5;color:#175752;font:12px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; } .demo-notice :global(a){color:inherit;font-weight:700;text-decoration:none}.demo-notice span{font-size:11px}`}</style>
  </aside>;
}
