import { useEffect } from 'react';
import { useRouter } from 'next/router';

const DEPTH = '__tavvyNavigationDepth';
/** Only entries visited by this Tavvy document count toward in-app Back. */
export function canGoBackInApp(): boolean {
  return typeof window !== 'undefined' && Number.isInteger(window.history.state?.[DEPTH]) && window.history.state[DEPTH] > 0;
}

export function useAppNavigationHistory() {
  const router = useRouter();
  useEffect(() => {
    let key = window.history.state?.key;
    let depth = Number.isInteger(window.history.state?.[DEPTH]) ? window.history.state[DEPTH] : 0;
    const mark = () => window.history.replaceState({ ...window.history.state, [DEPTH]: depth }, '', window.location.href);
    mark();
    const completed = () => {
      const state = window.history.state;
      // Browser Back/Forward restores our marker; Next push creates a new key,
      // while replace keeps the current key and must not create a Back entry.
      depth = Number.isInteger(state?.[DEPTH]) ? state[DEPTH] : state?.key !== key ? depth + 1 : depth;
      key = state?.key;
      mark();
    };
    router.events.on('routeChangeComplete', completed);
    router.events.on('hashChangeComplete', completed);
    return () => {
      router.events.off('routeChangeComplete', completed);
      router.events.off('hashChangeComplete', completed);
    };
  }, [router.events]);
}
