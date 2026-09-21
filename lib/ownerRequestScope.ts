/** UI-only stale response guard. Server authorization remains mandatory. */
export function createOwnerRequestScope(initialIdentity: string) {
  let identity = initialIdentity, epoch = 0, alive = true;
  return {
    setIdentity(next: string) { if (next !== identity) { identity = next; epoch++; } },
    activate() { alive = true; },
    close() { alive = false; epoch++; },
    capture() { const current = epoch; return () => alive && current === epoch; },
  };
}
