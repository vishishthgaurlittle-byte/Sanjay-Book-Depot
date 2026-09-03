import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Insforge redirects here (server-side) right after Google consent, on the very
 * first hop. We exchange the one-time `insforge_code` immediately on the server
 * (no client-JS timing / double-run), then hand the session to the browser via
 * the URL fragment and let /auth/done store it.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = process.env.INF_BASE_URL;
  const code = url.searchParams.get('insforge_code') ?? url.searchParams.get('code');
  const oauthError = url.searchParams.get('error') ?? url.searchParams.get('error_description');

  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/auth/callback?error=${encodeURIComponent(msg)}`, url.origin));

  if (oauthError) return fail(oauthError);
  if (!code || !base) return fail('No authorization code returned.');

  const cookie = req.headers.get('cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)sbd_pkce=([^;]+)/);
  const verifier = m ? decodeURIComponent(m[1]) : undefined;

  try {
    const res = await fetch(`${base}/api/auth/oauth/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, code_verifier: verifier }),
    });
    const json: unknown = await res.json().catch(() => null);

    if (!res.ok || !json) {
      const msg =
        (json as { message?: string; error?: string })?.message ??
        (json as { error?: string })?.error ??
        'Invalid or expired code.';
      return fail(msg);
    }

    const payload = Buffer.from(JSON.stringify(json), 'utf8').toString('base64url');
    const done = NextResponse.redirect(new URL(`/auth/done#s=${payload}`, url.origin));
    done.cookies.set('sbd_pkce', '', { path: '/', maxAge: 0 });
    return done;
  } catch {
    return fail('Could not complete sign-in.');
  }
}
