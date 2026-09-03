import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

import { verifyGoogleIdToken, signCustomerSession } from '@/lib/google-auth';
import { one, run } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Customer Google Sign-In. Verifies the Google ID token, finds or creates the
 * customer, and returns a signed session token + user for the browser to store.
 * Handles both login and signup (a new Google user is registered on first use).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const credential = body && typeof body === 'object' ? (body as { credential?: string }).credential : '';
  if (!credential) return NextResponse.json({ error: 'Missing credential' }, { status: 400 });

  let profile;
  try {
    profile = await verifyGoogleIdToken(credential);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Google verification failed' }, { status: 401 });
  }

  const authUserId = `google:${profile.sub}`;

  // Find an existing customer by email or by this Google account.
  let customer = await one<{ id: string; email: string; full_name: string | null }>(
    `SELECT id, email, full_name FROM customers WHERE lower(email) = ? OR auth_user_id = ? LIMIT 1`,
    [profile.email, authUserId],
  );

  let created = false;
  if (!customer) {
    const id = crypto.randomUUID();
    await run(
      `INSERT INTO customers (id, auth_user_id, full_name, email, avatar_url, created_at, updated_at)
       VALUES (?,?,?,?,?,datetime('now'),datetime('now'))`,
      [id, authUserId, profile.name, profile.email, profile.picture],
    );
    customer = { id, email: profile.email, full_name: profile.name };
    created = true;
  } else if (profile.picture && profile.name) {
    // keep the profile fresh (name/avatar) on each sign-in
    await run(`UPDATE customers SET full_name = COALESCE(?, full_name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?`,
      [profile.name, profile.picture, customer.id]);
  }

  const user = { id: customer.id, email: customer.email, name: customer.full_name };
  const token = signCustomerSession(user);
  return NextResponse.json({ token, user, created });
}
