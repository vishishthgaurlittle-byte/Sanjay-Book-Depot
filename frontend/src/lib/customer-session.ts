import crypto from 'crypto';

/**
 * Stable, long-lived signed customer session (sbdc.*).
 *
 * Google sign-in is performed through Insforge (OAuth). Once Insforge returns
 * the user, we mint our OWN HMAC-signed token that lasts 30 days so the login
 * persists across refresh/restart and is verifiable server-side for orders —
 * independent of Insforge's short-lived access tokens.
 */
const SECRET = () => process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_TOKEN || 'sbd-customer-secret';

export type CustomerUser = { id: string; email: string; name: string | null };

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o), 'utf8').toString('base64url');

export function signCustomerSession(user: CustomerUser, days = 30): string {
  const payload = { ...user, exp: Date.now() + days * 86_400_000 };
  const body = b64(payload);
  const sig = crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
  return `sbdc.${body}.${sig}`;
}

export function verifyCustomerSession(token?: string | null): CustomerUser | null {
  if (!token || !token.startsWith('sbdc.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, body, sig] = parts;
  const expect = crypto.createHmac('sha256', SECRET()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as CustomerUser & { exp?: number };
    if (payload.exp && Date.now() > payload.exp) return null;
    if (!payload.email) return null;
    return { id: String(payload.id ?? payload.email), email: payload.email, name: payload.name ?? null };
  } catch {
    return null;
  }
}
