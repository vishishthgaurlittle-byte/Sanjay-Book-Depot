'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { loginWithGoogle } from '@/lib/auth-client';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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

/**
 * "Continue with Google" button for customer login + signup.
 * Renders nothing-but-a-hint until NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 */
export default function GoogleAuthButton({ redirectTo = '/' }: { redirectTo?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onCredential = useCallback(
    async (credential: string) => {
      setBusy(true);
      setError(null);
      const res = await loginWithGoogle(credential);
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      router.push(redirectTo);
      router.refresh();
    },
    [router, redirectTo],
  );

  useEffect(() => {
    if (!CLIENT_ID) return;
    const init = () => {
      window.google?.accounts.id.initialize({ client_id: CLIENT_ID, callback: (r) => onCredential(r.credential) });
      if (ref.current) {
        ref.current.innerHTML = '';
        window.google?.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
    };
    if (document.getElementById('gsi-client')) {
      init();
      return;
    }
    const s = document.createElement('script');
    s.id = 'gsi-client';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = init;
    document.body.appendChild(s);
  }, [onCredential]);

  if (!CLIENT_ID) {
    return (
      <p className="border-l-2 py-2 pl-4 text-[12px] text-ink-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 18%, transparent)' }}>
        Google sign-in activates once <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> is set.
      </p>
    );
  }

  return (
    <div>
      <div ref={ref} className="flex justify-center" />
      {busy && <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-ink-500">Signing you in…</p>}
      {error && <p className="mt-3 text-center text-[12px] text-saffron-600">{error}</p>}
    </div>
  );
}
