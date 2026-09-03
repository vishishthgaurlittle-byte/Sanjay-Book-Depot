import { NextResponse } from 'next/server';

import { all, one, run } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

type Row = Record<string, unknown>;

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAY_STATUSES = ['unpaid', 'paid', 'refunded', 'failed'];

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const order = await one<Row>(
    `SELECT o.*, c.email AS customer_email, c.full_name AS customer_name
       FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.id = ?`,
    [id],
  );
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  const items = await all<Row>(
    `SELECT product_name, brand_name, image_url, quantity, unit_price, total_price FROM order_items WHERE order_id = ?`,
    [id],
  );
  return NextResponse.json({ order: { ...order, items } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; payment_status?: string };

  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (body.status && STATUSES.includes(body.status)) {
    sets.push('status = ?');
    args.push(body.status);
  }
  if (body.payment_status && PAY_STATUSES.includes(body.payment_status)) {
    sets.push('payment_status = ?');
    args.push(body.payment_status);
  }
  if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  sets.push("updated_at = datetime('now')");
  args.push(id);
  await run(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`, args);

  const order = await one<Row>(`SELECT id, order_number, status, payment_status FROM orders WHERE id = ?`, [id]);
  return NextResponse.json({ order });
}
