/**
 * LocaleLink - A Link component that preserves the current locale
 * 
 * This component wraps Next.js Link to ensure the current locale
 * is preserved when navigating between pages.
 */

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LocaleLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export default function LocaleLink({ href, children, className, style, onClick }: LocaleLinkProps) {
  const router = useRouter();
  const { locale } = router;
  
  return (
    <Link
      href={href}
      locale={locale}
      className={className}
      style={style}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
