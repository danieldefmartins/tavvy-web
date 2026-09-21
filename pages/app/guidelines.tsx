import Head from 'next/head';
import Link from 'next/link';
import AppLayout from '../../components/AppLayout';
import { useThemeContext } from '../../contexts/ThemeContext';
import { ArrowLeft, Heart, CheckCircle2 } from 'lucide-react';
import guidelines from '../../config/communityGuidelines.json';

export default function CommunityGuidelines() {
  const { theme, isDark } = useThemeContext();
  return <AppLayout requiredAccess="public">
    <Head><title>Community Guidelines | Tavvy</title></Head>
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 120px', color: theme.text }}>
      <Link href="/app/settings" style={{ color: theme.text, display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48 }}><ArrowLeft size={18} /> Settings</Link>
      <Heart size={36} color="#8A05BE" style={{ display: 'block', marginTop: 24 }} />
      <h1 style={{ fontSize: 36, letterSpacing: -1 }}>A community that feels good.</h1>
      <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>Tavvy is built on trust and authentic experiences. These guidelines help us maintain a helpful, respectful community for everyone.</p>
      {guidelines.map(item => <section key={item.title} style={{ display: 'flex', gap: 16, padding: 22, marginTop: 12, borderRadius: 20, background: isDark ? '#21182E' : '#F4F0FF' }}>
        <CheckCircle2 size={22} color="#8A05BE" style={{ flexShrink: 0, marginTop: 3 }} />
        <div><h2 style={{ fontSize: 18, margin: '0 0 8px' }}>{item.title}</h2><p style={{ margin: 0, lineHeight: 1.65, color: theme.textSecondary }}>{item.description}</p></div>
      </section>)}
      <h2>Enforcement</h2>
      <p style={{ lineHeight: 1.7 }}>Violations may result in content removal, temporary suspension, or account termination depending on their severity and frequency.</p>
      <Link href="/app/help" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px', background: '#8A05BE', color: '#fff', borderRadius: 14, textDecoration: 'none' }}>Contact support</Link>
    </main>
  </AppLayout>;
}
