/** Bounded, short-lived cache for public search results. Never caches failures. */
export function createSearchCache<T>(ttlMs = 30_000, capacity = 80) {
  const values = new Map<string, { value: T; expires: number }>();
  const pending = new Map<string, Promise<T>>();
  return (key: string, fetcher: () => Promise<T>): Promise<T> => {
    const cached = values.get(key);
    if (cached && cached.expires > Date.now()) {
      values.delete(key);
      values.set(key, cached);
      return Promise.resolve(cached.value);
    }
    values.delete(key);
    const active = pending.get(key);
    if (active) return active;
    const request = Promise.resolve().then(fetcher).then(value => {
      if (values.size >= capacity) {
        const oldest = values.keys().next().value;
        if (oldest !== undefined) values.delete(oldest);
      }
      values.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}
