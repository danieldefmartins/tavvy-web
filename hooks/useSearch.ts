/**
 * useSearch — React hook for the canonical Search API
 *
 * Features:
 *   - 300ms debounce
 *   - AbortController (cancels in-flight on new query)
 *   - Loading / error / empty states
 *   - Pagination helpers
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  searchPlaces,
  searchAutocomplete,
  SearchHit,
  SearchResponse,
  SearchClientOptions,
} from '../lib/searchClient';

// ─── Debounced search hook ──────────────────────────────────────────────────

export interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  autocomplete?: boolean;
  enabled?: boolean; // set false to disable auto-search
}

export interface UseSearchReturn {
  results: SearchHit[];
  found: number;
  searchTimeMs: number;
  page: number;
  loading: boolean;
  error: string | null;
  query: string;
  setQuery: (q: string) => void;
  search: (q?: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (p: number) => void;
  clear: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    limit = 20,
    lat,
    lng,
    radius,
    category,
    autocomplete = false,
    enabled = true,
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [found, setFound] = useState(0);
  const [searchTimeMs, setSearchTimeMs] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executeSearch = useCallback(async (q: string, p: number) => {
    // Cancel previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (!q.trim() && !autocomplete) {
      setResults([]);
      setFound(0);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await searchPlaces({
        q: q.trim() || '*',
        lat,
        lng,
        radius: radius || (lat ? 50 : undefined),
        category,
        page: p,
        limit,
        autocomplete,
        signal: controller.signal,
      });

      // Only update if not aborted
      if (!controller.signal.aborted) {
        setResults(response.hits);
        setFound(response.found);
        setSearchTimeMs(response.searchTimeMs);
        setLoading(false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // Expected
      if (!controller.signal.aborted) {
        setError(err.message || 'Search failed');
        setLoading(false);
      }
    }
  }, [lat, lng, radius, category, limit, autocomplete]);

  // Debounced auto-search on query change
  useEffect(() => {
    if (!enabled) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setFound(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      executeSearch(query, 1);
      setPage(1);
    }, debounceMs);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, enabled, debounceMs, executeSearch]);

  // Manual search trigger
  const search = useCallback((q?: string) => {
    const searchQuery = q !== undefined ? q : query;
    if (q !== undefined) setQuery(q);
    setPage(1);
    executeSearch(searchQuery, 1);
  }, [query, executeSearch]);

  // Pagination
  const nextPage = useCallback(() => {
    const next = page + 1;
    if (next > 10) return; // shallow paging cap
    setPage(next);
    executeSearch(query, next);
  }, [page, query, executeSearch]);

  const prevPage = useCallback(() => {
    const prev = page - 1;
    if (prev < 1) return;
    setPage(prev);
    executeSearch(query, prev);
  }, [page, query, executeSearch]);

  const setPageManual = useCallback((p: number) => {
    setPage(p);
    executeSearch(query, p);
  }, [query, executeSearch]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setFound(0);
    setError(null);
    setPage(1);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    results,
    found,
    searchTimeMs,
    page,
    loading,
    error,
    query,
    setQuery,
    search,
    nextPage,
    prevPage,
    setPage: setPageManual,
    clear,
  };
}
