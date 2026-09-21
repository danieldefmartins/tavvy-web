import { useEffect, useRef } from 'react';
import { createOwnerRequestScope } from '../lib/ownerRequestScope';
/** Invalidate at render time on identity changes, and on unmount. */
export function useOwnerRequestScope(identity: string) {
  const scope = useRef(createOwnerRequestScope(identity));
  scope.current.setIdentity(identity);
  useEffect(() => { scope.current.activate(); return () => scope.current.close(); }, []);
  return scope.current;
}
