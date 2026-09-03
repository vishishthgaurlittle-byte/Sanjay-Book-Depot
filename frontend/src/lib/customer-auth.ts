/**
 * Verify a customer's Insforge session token (the one stored client-side after
 * Google/email login) and return the user. Used by the orders/checkout APIs.
 */
import { verifyCustomerSession } from './customer-session';

export type CustomerIdentity = { id: string; email: string; name: string | null };

export async function verifyCustomer(token?: string | null): Promise<CustomerIdentity | null> {
  // Stable self-signed session (minted after Insforge/Google OAuth) — verify locally.
  const local = verifyCustomerSession(token);
  if (local) return local;

  const base = process.env.INF_BASE_URL;
  if (!token || !base) return null;
  try {
    const res = await fetch(`${base}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    const u = json.user ?? json;
    const email = typeof u.email === 'string' ? u.email : null;
    if (!email) return null;
    const name =
      u.name || u.full_name || u.user_metadata?.full_name || u.user_metadata?.name || null;
    return { id: String(u.id ?? email), email, name };
  } catch {
    return null;
  }
}

/** Pull the bearer token out of a request (Authorization header). */
export function bearerFrom(req: Request): string | null {
  const h = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}
