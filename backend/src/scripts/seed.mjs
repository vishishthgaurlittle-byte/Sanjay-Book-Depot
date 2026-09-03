/**
 * Seed the Turso database.
 *
 *   npm run seed
 *
 * Re-runnable: every insert is an upsert keyed on the business-unique column
 * (slug / sku / code / email), so running it twice never duplicates data.
 *
 * Brands and categories are inserted before products because the FTS trigger
 * resolves brand/category names by id at insert time.
 */
import { randomUUID } from 'node:crypto';
import { all, assertForeignKeysEnabled, db, get } from '../lib/db.mjs';
import { BRANDS } from '../lib/data/brands.mjs';
import { CATEGORIES, PARENT_CATEGORIES, CHILD_CATEGORIES } from '../lib/data/categories.mjs';
import { generateProducts, mulberry32, variantsFor } from '../lib/data/catalog.mjs';

const MULTIPLIER = Number(process.env.SEED_MULTIPLIER || 1);
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);

const CHUNK = 400;
async function batchInsert(label, statements) {
  if (!statements.length) return warn(`${label}: nothing to insert`);
  for (let i = 0; i < statements.length; i += CHUNK) {
    await db.batch(statements.slice(i, i + CHUNK), 'write');
  }
  ok(`${label}: ${statements.length} rows`);
}

async function main() {
  console.log('\nSanjay Book Depot - seed');
  console.log(`Database: ${process.env.TURSO_URL}`);
  await assertForeignKeysEnabled();

  const tables = new Set(
    (await all("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name),
  );
  if (!tables.has('products')) {
    throw new Error('Schema not present - run "npm run migrate" first.');
  }

  /* 1. brands ----------------------------------------------------------- */
  console.log('\n[1/7] brands');
  await batchInsert(
    'brands',
    BRANDS.map((b, i) => ({
      sql: `INSERT INTO brands (id, slug, name, tier, tagline, parent_company, is_featured, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(slug) DO UPDATE SET
              name=excluded.name, tier=excluded.tier, tagline=excluded.tagline,
              parent_company=excluded.parent_company, is_featured=excluded.is_featured,
              sort_order=excluded.sort_order`,
      args: [randomUUID(), b.slug, b.name, b.tier, b.tagline, b.parent_company, b.is_featured, (i + 1) * 10],
    })),
  );
  const brandIdBySlug = Object.fromEntries((await all('SELECT id, slug FROM brands')).map((r) => [r.slug, r.id]));

  /* 2. categories ------------------------------------------------------- */
  console.log('\n[2/7] categories');
  const catSql = (c, parentId) => ({
    sql: `INSERT INTO categories (id, slug, name, parent_id, depth, description, icon, is_featured, is_active, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
          ON CONFLICT(slug) DO UPDATE SET
            name=excluded.name, parent_id=excluded.parent_id, depth=excluded.depth,
            description=excluded.description, icon=excluded.icon,
            is_featured=excluded.is_featured, sort_order=excluded.sort_order`,
    args: [randomUUID(), c.slug, c.name, parentId, c.depth, c.description, c.icon, c.is_featured, c.sort_order],
  });
  await batchInsert('parent categories', PARENT_CATEGORIES.map((c) => catSql(c, null)));
  const parentIdBySlug = Object.fromEntries((await all('SELECT id, slug FROM categories')).map((r) => [r.slug, r.id]));
  await batchInsert(
    'subcategories',
    CHILD_CATEGORIES.map((c) => {
      const parentId = parentIdBySlug[c.parentSlug];
      if (!parentId) throw new Error(`parent category "${c.parentSlug}" missing for "${c.slug}"`);
      return catSql(c, parentId);
    }),
  );
  const catIdBySlug = Object.fromEntries((await all('SELECT id, slug FROM categories')).map((r) => [r.slug, r.id]));

  /* 3. products --------------------------------------------------------- */
  console.log('\n[3/7] products');
  const products = generateProducts({ multiplier: MULTIPLIER });
  ok(`generated ${products.length} products across ${CHILD_CATEGORIES.length} subcategories`);

  const productIds = {};
  await batchInsert(
    'products',
    products.map((p) => {
      const brandId = brandIdBySlug[p._brandSlug];
      const categoryId = catIdBySlug[p._categorySlug];
      if (!brandId) throw new Error(`unknown brand slug "${p._brandSlug}" for ${p.sku}`);
      if (!categoryId) throw new Error(`unknown category slug "${p._categorySlug}" for ${p.sku}`);
      const id = randomUUID();
      productIds[p.sku] = id;
      return {
        sql: `INSERT INTO products (id, sku, name, slug, brand_id, category_id, short_description, description,
                mrp, selling_price, stock_quantity, low_stock_threshold, specifications, tags, seo,
                model_3d_url, rating_average, rating_count, units_sold,
                is_featured, is_bestseller, is_active)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(sku) DO UPDATE SET
                name=excluded.name, slug=excluded.slug, brand_id=excluded.brand_id,
                category_id=excluded.category_id, short_description=excluded.short_description,
                description=excluded.description, mrp=excluded.mrp, selling_price=excluded.selling_price,
                stock_quantity=excluded.stock_quantity, specifications=excluded.specifications,
                tags=excluded.tags, seo=excluded.seo, rating_average=excluded.rating_average,
                rating_count=excluded.rating_count, units_sold=excluded.units_sold,
                is_featured=excluded.is_featured, is_bestseller=excluded.is_bestseller`,
        args: [
          id, p.sku, p.name, p.slug, brandId, categoryId, p.short_description, p.description,
          p.mrp, p.selling_price, p.stock_quantity, p.low_stock_threshold,
          JSON.stringify(p.specifications), JSON.stringify(p.tags), JSON.stringify(p.seo),
          p.model_3d_url, p.rating_average, p.rating_count, p.units_sold,
          p.is_featured, p.is_bestseller, p.is_active,
        ],
      };
    }),
  );

  // Re-read real ids: on a re-seed the upsert keeps the ORIGINAL id.
  const liveIds = Object.fromEntries((await all('SELECT id, sku FROM products')).map((r) => [r.sku, r.id]));
  Object.assign(productIds, liveIds);

  /* 4. images ----------------------------------------------------------- */
  console.log('\n[4/7] product images');
  // Deterministic placeholders served from Next.js /public (Vercel CDN), so
  // Insforge storage + bandwidth stay free for real photos and 3D models.
  const imgStmts = [];
  for (const p of products) {
    const pid = liveIds[p.sku];
    for (let i = 0; i < 3; i++) {
      imgStmts.push({
        sql: `INSERT INTO product_images (id, product_id, image_url, alt_text, position, is_primary)
              VALUES (?,?,?,?,?,?)
              ON CONFLICT(id) DO NOTHING`,
        args: [
          // stable id derived from sku+position => idempotent across re-seeds
          `${pid}-${i}`,
          pid,
          `/images/products/${p.sku}-${i + 1}.svg`,
          `${p.name} - view ${i + 1}`,
          i,
          i === 0 ? 1 : 0,
        ],
      });
    }
  }
  // ids must be unique per row; a composite string id is fine for TEXT PK.
  await batchInsert('product_images', imgStmts);

  /* 5. variants --------------------------------------------------------- */
  console.log('\n[5/7] product variants');
  const rand = mulberry32(99001);
  const variantStmts = [];
  for (const p of products) {
    const pid = liveIds[p.sku];
    for (const v of variantsFor(p, rand)) {
      variantStmts.push({
        sql: `INSERT INTO product_variants (id, product_id, sku, variant_type, option_value,
                price_delta, stock_quantity, hex_code, is_active)
              VALUES (?,?,?,?,?,?,?,?,?)
              ON CONFLICT(sku) DO UPDATE SET
                variant_type=excluded.variant_type, option_value=excluded.option_value,
                price_delta=excluded.price_delta, stock_quantity=excluded.stock_quantity,
                hex_code=excluded.hex_code, is_active=excluded.is_active`,
        args: [randomUUID(), pid, v.sku, v.variant_type, v.option_value, v.price_delta, v.stock_quantity, v.hex_code, v.is_active],
      });
    }
  }
  await batchInsert('product_variants', variantStmts);

  /* 6. admin + coupons -------------------------------------------------- */
  console.log('\n[6/7] admin users and coupons');
  const adminEmail = process.env.ADMIN_EMAIL || 'owner@sanjaybookdepot.local';
  await db.execute({
    sql: `INSERT INTO admin_users (id, email, full_name, role, is_active) VALUES (?,?,?,?,1)
          ON CONFLICT(email) DO UPDATE SET full_name=excluded.full_name, role=excluded.role`,
    args: [randomUUID(), adminEmail, 'Sanjay Book Depot Owner', 'owner'],
  });
  ok(`admin_users: ${adminEmail} (owner) - change ADMIN_EMAIL before production`);

  // Date.now() is in milliseconds, so a day is 86_400_000 ms. Using 86_400
  // (seconds) would make inDays(90) add ~2.16 hours and every coupon would
  // expire almost immediately after seeding.
  const day = 86400 * 1000;
  const inDays = (n) => new Date(Date.now() + n * day).toISOString().slice(0, 19).replace('T', ' ');
  const coupons = [
    ['WELCOME10', 'Welcome offer - 10% off your first order', 'percent', 10, 299, 100, null, 1],
    ['SCHOOL25', 'Back to school - 25% off', 'percent', 25, 499, 250, null, 1],
    ['SBD200', 'Flat Rs.200 off on orders above Rs.999', 'flat', 200, 999, null, null, 1],
    ['BULK500', 'Bulk order discount - flat Rs.500 off', 'flat', 500, 2500, null, null, 1],
    ['FREESHIP', 'Free shipping on any order', 'shipping', 0, 0, null, null, 1],
  ];
  await batchInsert(
    'coupons',
    coupons.map(([code, description, type, value, minOrder, maxDiscount, usageLimit, perUser]) => ({
      sql: `INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_value,
              max_discount, usage_limit, per_user_limit, starts_at, expires_at, is_active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,1)
            ON CONFLICT(code) DO UPDATE SET
              description=excluded.description, discount_type=excluded.discount_type,
              discount_value=excluded.discount_value, min_order_value=excluded.min_order_value,
              max_discount=excluded.max_discount, starts_at=excluded.starts_at, expires_at=excluded.expires_at`,
      args: [randomUUID(), code, description, type, value, minOrder, maxDiscount, usageLimit, perUser, inDays(0), inDays(90)],
    })),
  );

  /* 7. demo customer + reviews ----------------------------------------- */
  console.log('\n[7/7] demo customer and reviews');
  // auth_user_id is a placeholder - there is no matching Insforge auth user.
  // It exists so the storefront and admin panel have review/order data to show.
  const demoAuthId = 'demo-00000000-0000-4000-8000-000000000000';
  await db.execute({
    sql: `INSERT INTO customers (id, auth_user_id, full_name, email, phone, is_newsletter_subscribed)
          VALUES (?,?,?,?,?,1)
          ON CONFLICT(auth_user_id) DO UPDATE SET full_name=excluded.full_name, email=excluded.email`,
    args: [randomUUID(), demoAuthId, 'Demo Customer', 'demo@example.com', '9999900000'],
  });
  const demo = await get('SELECT id FROM customers WHERE auth_user_id = ?', [demoAuthId]);
  warn('demo customer created with a PLACEHOLDER auth_user_id (no Insforge user behind it)');

  const names = ['Aarav Sharma', 'Diya Patel', 'Rohan Verma', 'Ananya Iyer', 'Kabir Singh', 'Meera Nair'];
  const bodies = [
    'Exactly as described. Good quality for the price and delivery was quick.',
    'Been using this brand for years, never disappointed. Packaging was intact.',
    'Value for money. Ordered for the whole class and everyone is happy.',
    'Works well but the colour is slightly different from the photos.',
    'Solid build. Will reorder. GST invoice was included as promised.',
  ];
  const reviewStmts = [];
  for (const p of products.slice(0, 80)) {
    const pid = liveIds[p.sku];
    const n = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) {
      const rating = 3 + Math.floor(rand() * 3);
      reviewStmts.push({
        sql: `INSERT INTO product_reviews (id, product_id, customer_id, author_name, rating, title, body,
                is_approved, is_verified_purchase, helpful_count) VALUES (?,?,?,?,?,?,?,1,?,?)`,
        args: [
          randomUUID(), pid, demo.id, names[Math.floor(rand() * names.length)], rating,
          rating >= 4 ? 'Great buy' : 'Decent product',
          bodies[Math.floor(rand() * bodies.length)],
          rand() < 0.7 ? 1 : 0, Math.floor(rand() * 12),
        ],
      });
    }
  }
  // clear previous demo reviews so re-seeding does not pile them up
  await db.execute('DELETE FROM product_reviews WHERE customer_id = ?', [demo.id]);
  await batchInsert('product_reviews', reviewStmts);

  /* summary ------------------------------------------------------------- */
  const countOf = async (t) => (await get(`SELECT COUNT(*) AS n FROM ${t}`)).n;
  console.log('\n──────────────────────────────────────────');
  for (const t of ['brands', 'categories', 'products', 'product_images', 'product_variants', 'customers', 'product_reviews', 'coupons', 'admin_users']) {
    console.log(`  ${t.padEnd(18)} ${String(await countOf(t)).padStart(6)}`);
  }
  console.log('──────────────────────────────────────────');

  // Sanity-check the generated column against a real row.
  const sample = await get(
    'SELECT sku, mrp, selling_price, discount_percent FROM products ORDER BY sku LIMIT 1',
  );
  const expected = Math.round(((sample.mrp - sample.selling_price) / sample.mrp) * 100);
  const gen = Number(sample.discount_percent);
  console.log(
    `  generated discount_percent: stored=${gen} expected=${expected} -> ${gen === expected ? 'MATCH' : 'MISMATCH'}`,
  );
  if (gen !== expected) process.exitCode = 1;
  console.log('');
}

main().catch((e) => {
  console.error('\nSeed failed:', e.message);
  process.exit(1);
});
