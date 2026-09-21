import { ReactNode, useEffect, useRef } from 'react';
export default function DemoDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} onCancel={onClose} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="dialog-head"><h2>{title}</h2><button aria-label="Close dialog" onClick={onClose}>×</button></div>
    {children}
    <style jsx>{`dialog{width:min(480px,calc(100vw - 32px));box-sizing:border-box;max-height:85dvh;overflow:auto;padding:24px;border:1px solid #d7dfdc;border-radius:24px;background:var(--background,#fff);color:var(--text,#162622);box-shadow:0 20px 80px #0005}dialog::backdrop{background:#080c14a8}.dialog-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}.dialog-head h2{font-size:22px;margin:0}.dialog-head button{border:0;background:#edf3f0;color:#183d34;font-size:28px;border-radius:50%;width:40px;height:40px;cursor:pointer}dialog :global(p){line-height:1.6}dialog :global(.demo-primary){display:block;width:100%;margin-top:20px;padding:14px;background:#155d50;color:white;border:0;border-radius:12px;font:inherit;font-weight:700;cursor:pointer}dialog :global(.demo-primary:disabled){opacity:.45;cursor:not-allowed}`}</style>
  </dialog>;
}
