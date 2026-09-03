import { NextRequest, NextResponse } from 'next/server';

import { signSession } from '@/lib/admin';
import { one } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Verify a Google Identity Services ID token and, if the email is an active
 * admin, return a signed session token the panel can use as its bearer.
 *
 * Requires GOOGLE_CLIENT_ID (the OAuth client used by the sign-in button).
 */
export async function POST(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in the environment.' },
      { status: 501 },
    );
  }

  const body = await request.json().catch(() => null);
  const credential = body && typeof body === 'object' ? (body as { credential?: string }).credential : '';
  if (!credential) return NextResponse.json({ error: 'Missing credential' }, { status: 400 });

  // Verify the ID token with Google.
  let info: { aud?: string; email?: string; email_verified?: boolean | string };
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
      cache: 'no-store',
    });
    if (!r.ok) return NextResponse.json({ error: 'Invalid Google credential' }, { status: 401 });
    info = (await r.json()) as typeof info;
  } catch {
    return NextResponse.json({ error: 'Could not reach Google to verify the token' }, { status: 502 });
  }

  const verified = info.email_verified === true || info.email_verified === 'true';
  if (info.aud !== clientId || !verified || !info.email) {
    return NextResponse.json({ error: 'Google token failed verification' }, { status: 401 });
  }

  const email = String(info.email).toLowerCase();
  const admin = await one<{ id: string; email: string }>(
    `SELECT id, email FROM admin_users WHERE email = ? AND is_active = 1`,
    [email],
  );
  if (!admin) {
    return NextResponse.json(
      { error: 'This Google account is not authorised for the admin panel. Add it to admin_users first.' },
      { status: 403 },
    );
  }

  return NextResponse.json({ token: signSession(email), email });
}
