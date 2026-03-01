/**
 * eCard Edit Page — /app/ecard/[cardId]/edit
 * Thin shell: loads card data, wraps in EditorProvider, renders EditorLayout.
 */

import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || authLoading) return;

    if (!user) {
      router.replace('/auth/login');
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
        backgroundColor: CANVAS_BG,
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

  if (state.loadError) {
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
        backgroundColor: CANVAS_BG,
      }}>
        <p style={{ fontSize: 16, color: '#EF4444', fontWeight: 500 }}>
          {state.loadError}
        </p>
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
        <title>Edit eCard | TavvY</title>
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
