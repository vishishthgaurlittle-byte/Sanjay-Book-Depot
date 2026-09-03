import { NextResponse } from 'next/server';

import { all, one, run } from '@/lib/db';
import { bearerFrom, verifyCustomer } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';

const FREE_SHIPPING_OVER = 499;
const SHIPPING_FEE = 49;

type Row = Record<string, unknown>;

/** Find the customers row for this auth user, creating it on first order. */
async function ensureCustomer(user: { id: string; email: string; name: string | null }) {
  const existing = await one<Row>(
    `SELECT id FROM customers WHERE auth_user_id = ? OR email = ? LIMIT 1`,
    [user.id, user.email],
  );
  if (existing) return String(existing.id);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await run(
    `INSERT INTO customers (id, auth_user_id, full_name, email, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, user.id, user.name, user.email, now, now],
  );
  return id;
}

export async function POST(req: Request) {
  const user = await verifyCustomer(bearerFrom(req));
  if (!user) return NextResponse.json({ error: 'Sign in to place an order.' }, { status: 401 });

  let body: {
    items?: { productId: string; quantity: number }[];
    address?: Record<string, string>;
    paymentMethod?: string;
    paymentProof?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items.filter((i) => i?.productId) : [];
  const a = body.address ?? {};
  if (items.length === 0) return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 });
  for (const f of ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']) {
    if (!a[f] || !String(a[f]).trim()) {
      return NextResponse.json({ error: `Please fill in your ${f}.` }, { status: 400 });
    }
  }

  const customerId = await ensureCustomer(user);

  // Re-price every line from the database — never trust client prices.
  let subtotal = 0;
  const lines: {
    id: string; product_id: string; sku: string; product_name: string;
    brand_name: string | null; image_url: string | null;
    quantity: number; unit_price: number; total_price: number;
  }[] = [];
  for (const item of items) {
    const qty = Math.max(1, Math.min(99, Number(item.quantity) || 1));
    const p = await one<Row>(
      `SELECT p.id, p.sku, p.name, p.selling_price, p.stock_quantity, p.is_active, b.name AS brand_name,
              (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = 1 ORDER BY pi.position LIMIT 1) AS image_url
         FROM products p LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.id = ? LIMIT 1`,
      [item.productId],
    );
    if (!p) return NextResponse.json({ error: 'A product in your cart is no longer available.' }, { status: 400 });
    if (!p.is_active) return NextResponse.json({ error: `${p.name} is unavailable.` }, { status: 400 });
    if (Number(p.stock_quantity) < qty) return NextResponse.json({ error: `${p.name} only has ${p.stock_quantity} left.` }, { status: 400 });

    const unit = Number(p.selling_price) || 0;
    subtotal += unit * qty;
    lines.push({
      id: crypto.randomUUID(),
      product_id: String(p.id),
      sku: String(p.sku),
      product_name: String(p.name),
      brand_name: p.brand_name ? String(p.brand_name) : null,
      image_url: p.image_url ? String(p.image_url) : null,
      quantity: qty,
      unit_price: unit,
      total_price: unit * qty,
    });
  }

  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const now = new Date().toISOString();
  const orderId = crypto.randomUUID();
  const orderNumber = `SBD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`;
  const shippingAddress = `${a.fullName}, ${a.line1}${a.line2 ? ', ' + a.line2 : ''}, ${a.city}, ${a.state} ${a.pincode}, India · ${a.phone}`;

  const payMethod = body.paymentMethod === 'upi' ? 'upi' : body.paymentMethod === 'bank' ? 'netbanking' : 'cod';
  const proof = typeof body.paymentProof === 'string' && body.paymentProof.startsWith('data:image') ? body.paymentProof : null;

  await run(
    `INSERT INTO orders (id, order_number, customer_id, status, payment_status, payment_method,
       subtotal, discount_amount, shipping_fee, tax_amount, total, shipping_address, payment_proof, placed_at, created_at, updated_at)
     VALUES (?, ?, ?, 'confirmed', 'unpaid', ?, ?, 0, ?, 0, ?, ?, ?, ?, ?, ?)`,
    [orderId, orderNumber, customerId, payMethod, subtotal, shipping, total, shippingAddress, proof, now, now, now],
  );

  for (const l of lines) {
    await run(
      `INSERT INTO order_items (id, order_id, product_id, sku, product_name, brand_name, image_url, quantity, unit_price, total_price, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, orderId, l.product_id, l.sku, l.product_name, l.brand_name, l.image_url, l.quantity, l.unit_price, l.total_price, now, now],
    );
    // Decrement stock.
    await run(`UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?`, [l.quantity, l.product_id]);
  }

  // Save the address (default if it's their first).
  const addrCount = await one<Row>(`SELECT COUNT(*) AS n FROM customer_addresses WHERE customer_id = ?`, [customerId]);
  const isFirst = Number(addrCount?.n ?? 0) === 0;
  await run(
    `INSERT INTO customer_addresses (id, customer_id, label, full_name, phone, line1, line2, city, state, pincode, country, is_default_shipping, is_default_billing, created_at, updated_at)
     VALUES (?, ?, 'Home', ?, ?, ?, ?, ?, ?, ?, 'India', ?, ?, ?, ?)`,
    [crypto.randomUUID(), customerId, a.fullName, a.phone, a.line1, a.line2 ?? null, a.city, a.state, a.pincode, isFirst ? 1 : 0, isFirst ? 1 : 0, now, now],
  );

  return NextResponse.json({ order: { id: orderId, orderNumber, total, status: 'confirmed' } });
}

export async function GET(req: Request) {
  const user = await verifyCustomer(bearerFrom(req));
  if (!user) return NextResponse.json({ orders: [] });

  const customer = await one<Row>(`SELECT id FROM customers WHERE auth_user_id = ? OR email = ? LIMIT 1`, [user.id, user.email]);
  if (!customer) return NextResponse.json({ orders: [] });

  const orders = await all<Row>(
    `SELECT id, order_number, status, payment_status, payment_method, subtotal, shipping_fee, total, shipping_address, placed_at
       FROM orders WHERE customer_id = ? ORDER BY placed_at DESC LIMIT 50`,
    [String(customer.id)],
  );

  const result = await Promise.all(
    orders.map(async (o) => {
      const items = await all<Row>(
        `SELECT product_name, brand_name, image_url, quantity, unit_price, total_price FROM order_items WHERE order_id = ?`,
        [String(o.id)],
      );
      return { ...o, items };
    }),
  );

  return NextResponse.json({ orders: result });
}
