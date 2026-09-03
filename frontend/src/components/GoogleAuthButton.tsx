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

/** The official Google "G" mark. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * "Continue with Google" — customer login + signup.
 * Always renders a visible Google button. When NEXT_PUBLIC_GOOGLE_CLIENT_ID is
 * set it runs the real Google Identity Services flow; otherwise it explains the
 * one missing config value instead of disappearing.
 */
export default function GoogleAuthButton({ redirectTo = '/' }: { redirectTo?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfig, setNeedsConfig] = useState(false);

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

  // Configured → the real Google button.
  if (CLIENT_ID) {
    return (
      <div>
        <div ref={ref} className="flex justify-center" />
        {busy && <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-ink-500">Signing you in…</p>}
        {error && <p className="mt-3 text-center text-[12px] text-saffron-600">{error}</p>}
      </div>
    );
  }

  // Not configured yet → still show the button, explain on click.
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => setNeedsConfig(true)}
        className="inline-flex items-center justify-center gap-3 rounded-[var(--radius-lux)] border px-6 py-3 text-[13px] font-medium transition-colors"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 22%, transparent)', color: 'var(--color-ink-100)' }}
      >
        <GoogleG />
        Continue with Google
      </button>
      {needsConfig && (
        <p className="mt-3 max-w-sm text-center text-[12px] leading-relaxed text-ink-500">
          Google sign-in is built and ready — it just needs a Google OAuth Client ID.
          Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> (and <code>GOOGLE_CLIENT_ID</code>) in the
          Vercel environment variables, then redeploy.
        </p>
      )}
    </div>
  );
}
