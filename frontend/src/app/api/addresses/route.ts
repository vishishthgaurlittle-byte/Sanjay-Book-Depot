import { NextResponse } from 'next/server';

import { all, one } from '@/lib/db';
import { bearerFrom, verifyCustomer } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

export async function GET(req: Request) {
  const user = await verifyCustomer(bearerFrom(req));
  if (!user) return NextResponse.json({ addresses: [] });

  const customer = await one<Row>(`SELECT id FROM customers WHERE auth_user_id = ? OR email = ? LIMIT 1`, [user.id, user.email]);
  if (!customer) return NextResponse.json({ addresses: [] });

  const addresses = await all<Row>(
    `SELECT id, label, full_name, phone, line1, line2, city, state, pincode, is_default_shipping
       FROM customer_addresses WHERE customer_id = ? ORDER BY is_default_shipping DESC, created_at DESC`,
    [String(customer.id)],
  );
  return NextResponse.json({ addresses });
}
