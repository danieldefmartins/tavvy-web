import Head from 'next/head';
import Link from 'next/link';
import { useThemeContext } from '../../../contexts/ThemeContext';
export default function ECardCheckoutCancel() {
  const { theme } = useThemeContext();
  return <main style={{minHeight:'100vh',background:theme.background,color:theme.text,padding:'64px 24px'}}><Head><title>Checkout closed | Tavvy</title><meta name="robots" content="noindex" /></Head><div style={{maxWidth:560,margin:'auto'}}><h1>Checkout closed</h1><p>Your drafts are still available. You can check your current plan or return to editing.</p><p><Link href="/ecard/premium/success">Check my plan</Link></p><p><Link href="/app/ecard">Go to my eCards</Link></p><p><Link href="/app/ecard/premium">View plans</Link></p></div></main>;
}
