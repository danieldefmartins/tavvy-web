/** Restrict post-login navigation to paths within Tavvy. */
export function safeAuthRedirect(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u001f]/.test(value)) return '/app';
  try {
    const url = new URL(value, 'https://tavvy.com');
    if (url.origin !== 'https://tavvy.com' || url.pathname.startsWith('/auth/') || url.pathname === '/app/login') return '/app';
    return url.pathname + url.search + url.hash;
  } catch { return '/app'; }
}
