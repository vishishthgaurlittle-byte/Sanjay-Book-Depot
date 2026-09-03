import 'server-only';

import crypto from 'node:crypto';

/**
 * Google Sign-In for customers.
 *
 * The browser uses Google Identity Services to obtain an ID token (a popup,
 * no redirect/PKCE). We verify it here against GOOGLE_CLIENT_ID, then mint our
 * own signed customer session so it works independently of Insforge's email
 * verification (which is currently blocked). The session is an HMAC-signed
 * token: sbdc.<base64url payload>.<signature>.
 */

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function secret(): string {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_TOKEN || '';
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

/** Verify a Google ID token and return the profile, or throw. */
export async function verifyGoogleIdToken(credential: string): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google sign-in is not configured (GOOGLE_CLIENT_ID).');

  const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('Invalid Google credential.');

  const info = (await r.json()) as {
    aud?: string; sub?: string; email?: string; email_verified?: boolean | string;
    name?: string; picture?: string;
  };
  const verified = info.email_verified === true || info.email_verified === 'true';
  if (info.aud !== clientId || !verified || !info.email || !info.sub) {
    throw new Error('Google token failed verification.');
  }
  return {
    sub: String(info.sub),
    email: String(info.email).toLowerCase(),
    name: info.name ?? null,
    picture: info.picture ?? null,
  };
}

export interface CustomerSession {
  id: string;
  email: string;
  name?: string | null;
}

/** Mint a signed customer session token. */
export function signCustomerSession(user: CustomerSession): string {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, name: user.name ?? null, exp: Date.now() + SESSION_TTL_MS }),
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  return `sbdc.${payload}.${sig}`;
}

/** Verify a signed customer session token; returns the session or null. */
export function verifyCustomerSession(token: string): CustomerSession | null {
  if (!token.startsWith('sbdc.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, payload, sig] = parts;
  const expect = crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
  if (sig.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString()) as CustomerSession & { exp?: number };
    if (!d.email || !d.exp || Date.now() > d.exp) return null;
    return { id: d.id, email: d.email, name: d.name ?? null };
  } catch {
    return null;
  }
}
