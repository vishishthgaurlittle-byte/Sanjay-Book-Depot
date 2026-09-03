'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

import { applySession, type SessionUser } from '@/lib/auth-client';

/** Decode a base64url UTF-8 string in the browser (no Buffer). */
function b64urlDecode(s: string): string {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  const bin = atob(b);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Lands here after the server exchanged the OAuth code. Stores session, redirects. */
export default function AuthDonePage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const s = params.get('s');
    if (s) {
      try {
        const data = JSON.parse(b64urlDecode(s)) as { token?: string; user?: SessionUser };
        if (data.token) applySession(data.token, data.user ?? null);
      } catch {
        /* ignore */
      }
    }
    const next = localStorage.getItem('sbd.oauth.next') || '/';
    localStorage.removeItem('sbd.oauth.next');
    router.replace(next);
    router.refresh();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
      <p className="text-[11px] uppercase tracking-[0.24em] text-ink-500">Signing you in…</p>
    </div>
  );
}
