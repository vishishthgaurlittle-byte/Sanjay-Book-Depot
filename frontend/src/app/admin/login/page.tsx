'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const TOKEN_KEY = 'sbd-admin-token';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = useCallback((tk: string) => {
    localStorage.setItem(TOKEN_KEY, tk);
    router.push('/admin/products');
  }, [router]);

  const onCredential = useCallback(async (credential: string) => {
    setBusy(true); setError(null);
    try {
      const r = await fetch('/api/admin/auth/google', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const b = await r.json();
      if (!r.ok) { setError(b.error ?? 'Google sign-in failed'); setBusy(false); return; }
      finish(b.token);
    } catch { setError('Google sign-in failed'); setBusy(false); }
  }, [finish]);

  // Load Google Identity Services when a client id is configured.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const existing = document.getElementById('gsi-script');
    const init = () => {
      window.google?.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => onCredential(r.credential) });
      if (btnRef.current) btnRef.current.innerHTML = '';
      if (btnRef.current) window.google?.accounts.id.renderButton(btnRef.current, { theme: 'filled_black', size: 'large', width: 320, text: 'continue_with' });
    };
    if (existing) { init(); return; }
    const s = document.createElement('script');
    s.id = 'gsi-script'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init;
    document.body.appendChild(s);
  }, [onCredential]);

  function submitToken(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    finish(token.trim());
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-20">
      <p className="eyebrow">Sanjay Book Depot</p>
      <h1 className="display mt-4 text-[clamp(2rem,6vw,3rem)]">Admin sign in</h1>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
        Use your Google account, or the admin token, to open the management panel.
      </p>

      {error && (
        <p className="mt-6 border-l-2 py-2 pl-4 text-[12px] text-ink-200" style={{ borderColor: 'var(--color-saffron-600)' }} role="alert">
          {error}
        </p>
      )}

      {/* Google */}
      <div className="mt-8">
        {GOOGLE_CLIENT_ID ? (
          <div ref={btnRef} className="flex justify-start" />
        ) : (
          <p className="border-l-2 py-2 pl-4 text-[12px] text-ink-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }}>
            Google sign-in activates once <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> is set in the environment.
          </p>
        )}
        {busy && <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-ink-500">Verifying…</p>}
      </div>

      <div className="my-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-ink-600">
        <span className="h-px flex-1" style={{ background: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }} />
        or
        <span className="h-px flex-1" style={{ background: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }} />
      </div>

      {/* Token fallback */}
      <form onSubmit={submitToken}>
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">Admin token</span>
        <div className="mt-3 flex gap-3">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="ADMIN_TOKEN"
            className="min-w-0 flex-1 border-b bg-transparent py-2.5 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500"
            style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
          <button className="lux-btn-ghost shrink-0 hover:border-saffron-500 hover:text-saffron-500">Enter</button>
        </div>
      </form>
    </div>
  );
}
