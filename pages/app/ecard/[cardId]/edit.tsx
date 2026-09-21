/**
 * eCard Edit Page — /app/ecard/[cardId]/edit
 * Thin shell: loads card data, wraps in EditorProvider, renders EditorLayout.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useThemeContext } from '../../../../contexts/ThemeContext';
import { useAuth } from '../../../../contexts/AuthContext';
import AppLayout from '../../../../components/AppLayout';
import { EditorProvider, useEditor } from '../../../../lib/ecard/EditorContext';
import CardStudioLayout from '../../../../components/ecard/editor/CardStudioLayout';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const AMBER = '#FF9F0A';
const CANVAS_BG = '#1C1C1E';

function EditorShell() {
  const router = useRouter();
  const { cardId } = router.query;
  const { user, loading: authLoading } = useAuth();
  const { state, loadCard } = useEditor();
  const { isDark } = useThemeContext();
  const canvas = isDark ? '#111018' : '#F7F7FA';
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    if (!user) {
      router.replace(`/app/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (typeof cardId === 'string' && cardId) {
      loadCard(cardId).finally(() => setInitialLoading(false));
    }
  }, [router.isReady, cardId, user, authLoading, loadCard]);

  if (initialLoading || authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: canvas,
      }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: AMBER,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const ownershipError = state.card.id && state.card.user_id !== user?.id ? 'This card belongs to another account. Open one of your own cards to edit it.' : null;
  if (state.loadError || ownershipError) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
        textAlign: 'center',
        backgroundColor: canvas,
      }}>
        <p style={{ fontSize: 16, color: '#EF4444', fontWeight: 500 }}>
          {state.loadError || ownershipError}
        </p>
        {!ownershipError && <button onClick={() => { setInitialLoading(true); void loadCard(String(cardId)).finally(() => setInitialLoading(false)); }} style={{ minHeight:44,padding:'10px 20px',borderRadius:8,border:'1px solid #89769A',background:'transparent',color:isDark?'#fff':'#202124' }}>Retry loading</button>}
        <button
          onClick={() => router.push('/app/ecard')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: 8,
            background: AMBER,
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Back to Cards
        </button>
      </div>
    );
  }

  return <CardStudioLayout />;
}

export default function ECardEditPage() {
  return (
    <>
      <Head>
        <title>Edit eCard | Tavvy</title>
      </Head>
      <AppLayout hideTabBar>
        <EditorProvider>
          <EditorShell />
        </EditorProvider>
      </AppLayout>
    </>
  );
}

export const getServerSideProps = async ({ locale }: { locale: string }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? 'en', ['common'])),
  },
});
