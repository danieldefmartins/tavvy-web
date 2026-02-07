import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EcardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/app/ecard');
  }, [router]);
  return null;
}
