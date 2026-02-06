import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app');
  }, [router]);

  return (
    <>
      <Head>
        <title>Tavvy - Signal-Based Community Reviews</title>
        <meta name="description" content="Tavvy is a community-powered, signal-based location review platform." />
        <meta property="og:title" content="Tavvy - Signal-Based Community Reviews" />
        <meta property="og:description" content="Discover what places are good for, how they feel, and what to watch out for — using tap-based signals." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tavvy.com" />
      </Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a' }}>
        <p style={{ color: '#666', fontSize: '14px' }}>Redirecting...</p>
      </div>
    </>
  );
}
