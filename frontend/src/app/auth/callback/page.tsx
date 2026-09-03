'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { saveOAuthSession } from '@/lib/auth-client';
import { insforgeBrowser } from '@/lib/insforge-browser';

const VERIFIER_KEY = 'sbd.oauth.verifier';

/**
 * Lands here after Google consent. Insforge redirects back with ?code=...;
 * we exchange it (with the PKCE verifier stashed at sign-in start) for an
 * Insforge session, store it, and send the user on their way.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    // Insforge appends ?insforge_code=... on success, or ?error=... on failure.
    const code = params.get('insforge_code') ?? params.get('code');
    const oauthError = params.get('error') ?? params.get('error_description');
    const next = localStorage.getItem('sbd.oauth.next') || '/';
    const verifier = localStorage.getItem(VERIFIER_KEY);

    if (oauthError) {
      localStorage.removeItem(VERIFIER_KEY);
      localStorage.removeItem('sbd.oauth.next');
      setError(`Google sign-in was cancelled or failed: ${oauthError}`);
      return;
    }
    if (!code) {
      setError('No authorization code returned. Please try signing in again.');
      return;
    }

    (async () => {
      const { data, error: err } = await insforgeBrowser().auth.exchangeOAuthCode(code, verifier ?? undefined);
      localStorage.removeItem(VERIFIER_KEY);
      localStorage.removeItem('sbd.oauth.next');
      if (err || !data) {
        setError(err?.message ?? 'Could not complete Google sign-in.');
        return;
      }
      saveOAuthSession(data);
      router.replace(next);
      router.refresh();
    })();
  }, [router]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {error ? (
        <>
          <h1 className="display text-[clamp(1.6rem,4vw,2.2rem)]">Sign-in failed</h1>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-500">{error}</p>
          <a href="/login" className="lux-btn-ghost mt-8 hover:border-saffron-500 hover:text-saffron-500">
            Back to sign in
          </a>
        </>
      ) : (
        <p className="text-[11px] uppercase tracking-[0.24em] text-ink-500">Completing sign-in…</p>
      )}
    </div>
  );
}
