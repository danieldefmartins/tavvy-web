import { useEffect, useRef } from 'react';
export default function DemoQR({ path, label }: { path: string; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const qr = useRef<any>(null);
  useEffect(() => {
    let cancelled = false;
    import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !el.current) return;
      el.current.innerHTML = '';
      qr.current = new QRCodeStyling({ width: 200, height: 200, type: 'svg', data: `https://tavvy.com${path}`, margin: 12, dotsOptions: { color: '#153b32', type: 'rounded' }, backgroundOptions: { color: '#ffffff' }, qrOptions: { errorCorrectionLevel: 'M' } });
      qr.current.append(el.current);
    });
    return () => { cancelled = true; };
  }, [path]);
  const download = async () => {
    if ((window as any).ReactNativeWebView && qr.current) {
      const raw = await qr.current.getRawData('svg');
      if (raw) (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'download-qr', content: await raw.text() }));
    } else await qr.current?.download({ name: 'trattoria-tavvy-demo-qr', extension: 'svg' });
  };
  return <div className="qr"><div ref={el} role="img" aria-label={label} /><button onClick={download}>Download QR code</button><style jsx>{`.qr{display:flex;flex-direction:column;align-items:center;gap:12px}.qr button{padding:10px 16px;border:1px solid #b9cfc6;border-radius:20px;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:13px}`}</style></div>;
}
