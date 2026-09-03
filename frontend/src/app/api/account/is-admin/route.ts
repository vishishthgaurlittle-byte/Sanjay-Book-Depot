import { NextResponse } from 'next/server';

import { one } from '@/lib/db';
import { bearerFrom, verifyCustomer } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

/** Tells the account page whether the signed-in customer is also an admin/owner. */
export async function GET(req: Request) {
  const user = await verifyCustomer(bearerFrom(req));
  if (!user) return NextResponse.json({ isAdmin: false });
  const row = await one<Row>(
    `SELECT role, full_name FROM admin_users WHERE lower(email) = lower(?) AND is_active = 1 LIMIT 1`,
    [user.email],
  );
  return NextResponse.json({
    isAdmin: !!row,
    role: row ? String(row.role) : null,
    name: row && row.full_name ? String(row.full_name) : null,
  });
}
