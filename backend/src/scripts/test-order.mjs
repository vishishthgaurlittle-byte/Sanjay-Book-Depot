// Verifies the checkout/order SQL end-to-end against the real DB, then cleans up.
import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../../../frontend/.env.local', import.meta.url), 'utf8').split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const db = createClient({ url: env.TURSO_URL, authToken: env.TURSO_TOKEN });
const now = new Date().toISOString();

// 1. Pick a real active product
const p = (await db.execute(`SELECT p.id, p.sku, p.name, p.selling_price, p.stock_quantity, b.name AS brand_name,
    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.id AND pi.is_primary=1 ORDER BY pi.position LIMIT 1) AS image_url
  FROM products p LEFT JOIN brands b ON b.id=p.brand_id WHERE p.is_active=1 AND p.stock_quantity>2 LIMIT 1`)).rows[0];
console.log('Product:', p.name, '| ₹' + p.selling_price, '| stock', p.stock_quantity);

// 2. Test customer (find-or-create, same as route)
const authId = 'test-order-' + Date.now();
const email = `test-order-${Date.now()}@example.com`;
const custId = crypto.randomUUID();
await db.execute({ sql: `INSERT INTO customers (id, auth_user_id, full_name, email, created_at, updated_at) VALUES (?,?,?,?,?,?)`, args: [custId, authId, 'Test Customer', email, now, now] });

// 3. Order + item + address (same SQL as /api/orders)
const qty = 2, unit = Number(p.selling_price), subtotal = unit * qty;
const shipping = subtotal >= 499 ? 0 : 49, total = subtotal + shipping;
const orderId = crypto.randomUUID();
const orderNumber = `SBD-${Date.now().toString(36).toUpperCase()}42`;
const addr = `${'Test Customer'}, ${'12 Test St'}, ${'Lucknow'}, ${'Uttar Pradesh'} ${'226001'}, India · ${'9999999999'}`;
await db.execute({ sql: `INSERT INTO orders (id, order_number, customer_id, status, payment_status, payment_method, subtotal, discount_amount, shipping_fee, tax_amount, total, shipping_address, placed_at, created_at, updated_at) VALUES (?,?,?,'confirmed','unpaid','cod',?,0,?,0,?,?,?,?,?)`, args: [orderId, orderNumber, custId, subtotal, shipping, total, addr, now, now, now] });
await db.execute({ sql: `INSERT INTO order_items (id, order_id, product_id, sku, product_name, brand_name, image_url, quantity, unit_price, total_price, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, args: [crypto.randomUUID(), orderId, p.id, p.sku, p.name, p.brand_name, p.image_url, qty, unit, unit * qty, now, now] });
await db.execute({ sql: `INSERT INTO customer_addresses (id, customer_id, label, full_name, phone, line1, line2, city, state, pincode, country, is_default_shipping, is_default_billing, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,'India',1,1,?,?)`, args: [crypto.randomUUID(), custId, 'Home', 'Test Customer', '9999999999', '12 Test St', null, 'Lucknow', 'Uttar Pradesh', '226001', now, now] });

// 4. Read back exactly like GET /api/orders
const orders = (await db.execute({ sql: `SELECT id, order_number, status, payment_method, subtotal, shipping_fee, total, shipping_address, placed_at FROM orders WHERE customer_id=? ORDER BY placed_at DESC`, args: [custId] })).rows;
const items = (await db.execute({ sql: `SELECT product_name, brand_name, image_url, quantity, unit_price, total_price FROM order_items WHERE order_id=?`, args: [orderId] })).rows;
const addresses = (await db.execute({ sql: `SELECT full_name, line1, city, state, pincode, is_default_shipping FROM customer_addresses WHERE customer_id=?`, args: [custId] })).rows;

console.log('\n--- READ BACK ---');
console.log('Orders:', orders.length, '| number:', orders[0]?.order_number, '| status:', orders[0]?.status, '| total: ₹' + orders[0]?.total);
console.log('Items:', items.length, '|', items[0]?.product_name, '| qty', items[0]?.quantity, '| ₹' + items[0]?.total_price, '| image:', items[0]?.image_url ? 'yes' : 'none');
console.log('Addresses:', addresses.length, '|', addresses[0]?.full_name + ', ' + addresses[0]?.city);
console.log('Totals math:', subtotal, '+', shipping, '=', total, (subtotal + shipping === total ? '✓' : '✗'));

// 5. Clean up
await db.execute({ sql: `DELETE FROM order_items WHERE order_id=?`, args: [orderId] });
await db.execute({ sql: `DELETE FROM orders WHERE id=?`, args: [orderId] });
await db.execute({ sql: `DELETE FROM customer_addresses WHERE customer_id=?`, args: [custId] });
await db.execute({ sql: `DELETE FROM customers WHERE id=?`, args: [custId] });
console.log('\nCleaned up test data ✓');
