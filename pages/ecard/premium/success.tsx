import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../../contexts/AuthContext';
import { useECardEntitlement } from '../../../hooks/useECardEntitlement';
import { useThemeContext } from '../../../contexts/ThemeContext';
export default function ECardCheckoutReturn() {
  const { user, loading: authLoading } = useAuth();
  const { entitlement, loading, error, refresh } = useECardEntitlement();
  const { theme } = useThemeContext();
  const pending = authLoading || loading;
  return <main style={{minHeight:'100vh',background:theme.background,color:theme.text,padding:'64px 24px'}}><Head><title>Check your eCard plan | Tavvy</title><meta name="robots" content="noindex" /></Head><div style={{maxWidth:560,margin:'auto'}}>
    <h1>{pending ? 'Checking your plan…' : entitlement?.ecard_active ? 'Your eCard Pro access is active' : 'Check your eCard plan'}</h1>
    {!pending && !user ? <p><Link href="/app/login?returnTo=%2Fecard%2Fpremium%2Fsuccess">Sign in to verify your plan</Link></p> : null}
    {!pending && user && <><p role={error ? 'alert' : 'status'}>{error || (entitlement?.ecard_active ? 'Your subscription has been confirmed by our billing service. Your draft cards are ready for you to review and publish.' : 'We have not confirmed an active eCard subscription yet. Processing can take a moment. Check again before starting another checkout.')}</p><button onClick={() => void refresh()} disabled={loading} style={{padding:14,font:'inherit'}}>Check again</button></>}
    <p><Link href="/app/ecard">Go to my eCards</Link></p><p><Link href="/app">Tavvy Home</Link></p>
  </div></main>;
}
