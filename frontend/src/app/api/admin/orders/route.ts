import { NextResponse } from 'next/server';

import { all } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

/** Admin: list customer orders (no heavy payment proof blobs). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const orders = await all<Row>(
    `SELECT o.id, o.order_number, o.status, o.payment_status, o.payment_method,
            o.subtotal, o.shipping_fee, o.total, o.shipping_address, o.placed_at,
            c.email AS customer_email, c.full_name AS customer_name,
            (SELECT COUNT(*) FROM order_items i WHERE i.order_id = o.id) AS item_count,
            (o.payment_proof IS NOT NULL AND o.payment_proof != '') AS has_proof
       FROM orders o LEFT JOIN customers c ON c.id = o.customer_id
      ORDER BY o.placed_at DESC LIMIT 200`,
  );
  return NextResponse.json({ orders });
}
