import 'server-only';

import { NextResponse } from 'next/server';

import { one } from '@/lib/db';
import { INF_BASE_URL } from '@/lib/insforge';

interface SessionUser {
  id: string;
  email: string;
  role?: string;
}

interface AdminRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export type AdminResult =
  | { ok: true; admin: AdminRow; via: 'insforge' | 'token' }
  | { ok: false; response: NextResponse };

/** The allowlisted owner row, used when authenticating by ADMIN_TOKEN. */
async function ownerRow(): Promise<AdminRow | null> {
  return one<AdminRow>(
    `SELECT id, email, full_name, role FROM admin_users
      WHERE is_active = 1
      ORDER BY CASE role WHEN 'owner' THEN 0 ELSE 1 END, created_at ASC
      LIMIT 1`,
  );
}

/**
 * Resolve the caller to an admin row, or return a ready-made error response.
 *
 * Two accepted credentials:
 *
 *   A. An Insforge session token whose account email exists in Turso's
 *      `admin_users` with is_active = 1. Insforge proves the caller logged in;
 *      the Turso row proves they are staff. Registering on the public site
 *      does not create that row, so a customer token is rejected.
 *
 *   B. The server-side ADMIN_TOKEN, matched against the request's bearer
 *      token. This exists because the Insforge project currently has
 *      requireEmailVerification = true with no SMTP configured, so no account
 *      can obtain a session and path A is unreachable. It is a shared secret
 *      that never reaches the browser; delete ADMIN_TOKEN from the
 *      environment to disable it.
 *
 * Keeping the allowlist in Turso rather than Insforge means promoting or
 * revoking an admin is a single SQL row.
 */
export async function requireAdmin(request: Request): Promise<AdminResult> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Missing bearer token' }, { status: 401 }),
    };
  }

  // ── Path B: shared admin token ──────────────────────────────────────
  const configured = process.env.ADMIN_TOKEN;
  if (configured && token === configured) {
    const admin = await ownerRow();
    if (!admin) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'ADMIN_TOKEN accepted but no active admin_users row exists' },
          { status: 500 },
        ),
      };
    }
    return { ok: true, admin, via: 'token' };
  }

  // ── Path A: Insforge session ────────────────────────────────────────
  let user: SessionUser;
  try {
    const res = await fetch(`${INF_BASE_URL}/api/auth/sessions/current`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
      };
    }
    const data = (await res.json()) as { user?: SessionUser };
    if (!data.user?.email) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Malformed session' }, { status: 401 }),
      };
    }
    user = data.user;
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Auth service unreachable' }, { status: 502 }),
    };
  }

  try {
    const admin = await one<AdminRow>(
      `SELECT id, email, full_name, role FROM admin_users
        WHERE email = ? AND is_active = 1`,
      [user.email.toLowerCase()],
    );

    if (!admin) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'This account is not authorised for the admin panel' },
          { status: 403 },
        ),
      };
    }

    return { ok: true, admin, via: 'insforge' };
  } catch (err) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: err instanceof Error ? err.message : 'Database error' },
        { status: 500 },
      ),
    };
  }
}
