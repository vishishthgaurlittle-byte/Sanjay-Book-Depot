import { NextResponse } from 'next/server';

import { one } from '@/lib/db';
import { signSession } from '@/lib/admin';
import { bearerFrom, verifyCustomer } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

/**
 * If the signed-in customer is also an admin (their email is in admin_users),
 * mint a short-lived admin session so they can jump straight into /admin.
 */
export async function GET(req: Request) {
  const user = await verifyCustomer(bearerFrom(req));
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const row = await one<Row>(
    `SELECT role FROM admin_users WHERE lower(email) = lower(?) AND is_active = 1 LIMIT 1`,
    [user.email],
  );
  if (!row) return NextResponse.json({ error: 'Not authorised.' }, { status: 403 });

  return NextResponse.json({ token: signSession(user.email) });
}
