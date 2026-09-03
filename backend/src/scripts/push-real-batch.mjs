import { createClient } from '@libsql/client';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';

/**
 * Push a batch of REAL products (extracted from live retailer listings) into
 * the catalogue.
 *
 * Input JSON: [{ name, slug, url, img, price, mrp, brand, category }]
 *
 * Images are HOTLINKED to the retailer URL (stored in product_images.image_url).
 * No local files are written and nothing is stored on our side, so this keeps
 * workspace storage at zero. resolveImage() passes any URL outside
 * /images/products/ straight through, so these render on the site as-is.
 *
 * Usage: node --env-file=.env src/scripts/push-real-batch.mjs <batch.json>
 */
const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

const items = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const now = () => new Date().toISOString();

const brandCache = new Map();
const catCache = new Map();

async function ensureBrand(name) {
  if (brandCache.has(name)) return brandCache.get(name);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'generic';
  // match by name OR slug (avoids inserting a duplicate slug)
  let row = await db.execute({
    sql: `SELECT id FROM brands WHERE lower(name) = lower(?) OR slug = ?`,
    args: [name, slug],
  });
  let id = row.rows[0]?.id;
  if (!id) {
    id = crypto.randomUUID();
    try {
      await db.execute({
        sql: `INSERT INTO brands (id, slug, name, tier, is_featured, parent_company, tagline, website, sort_order, created_at, updated_at)
              VALUES (?,?,?,?,0,NULL,NULL,NULL,100,?,?)`,
        args: [id, slug, name, 'tier3', now(), now()],
      });
    } catch {
      // slug raced in — fetch it
      const again = await db.execute({ sql: `SELECT id FROM brands WHERE slug = ?`, args: [slug] });
      id = again.rows[0]?.id;
    }
  }
  brandCache.set(name, id);
  return id;
}

async function ensureCategory(slug, fallback) {
  const want = slug || fallback;
  if (catCache.has(want)) return catCache.get(want);
  let row = await db.execute({ sql: `SELECT id FROM categories WHERE slug = ?`, args: [want] });
  let id = row.rows[0]?.id;
  if (!id && fallback && fallback !== want) {
    row = await db.execute({ sql: `SELECT id FROM categories WHERE slug = ?`, args: [fallback] });
    id = row.rows[0]?.id;
  }
  if (!id) {
    // last resort: any leaf writing-instruments category
    row = await db.execute({ sql: `SELECT id FROM categories WHERE slug = 'writing-instruments-ball-pens'` });
    id = row.rows[0]?.id;
  }
  catCache.set(want, id);
  return id;
}

let inserted = 0, skipped = 0;
const seq = (await db.execute(`SELECT COUNT(*) c FROM products WHERE sku LIKE 'REAL-%'`)).rows[0].c;

for (const [i, it] of items.entries()) {
  try {
    const price = Number(it.price) || 0;
    const mrp = Math.max(Number(it.mrp) || price, price, 1);
    if (!price || !it.img) { skipped++; continue; }

    // idempotent: skip if this exact product name is already in the catalogue
    const exists = await db.execute({ sql: `SELECT 1 FROM products WHERE lower(name) = lower(?)`, args: [it.name] });
    if (exists.rows.length) { skipped++; continue; }

    const sku = `REAL-${String(seq + inserted + 1).padStart(5, '0')}`;
    let slug = (it.slug || it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).slice(0, 70);
    // ensure unique slug
    let dupe = await db.execute({ sql: `SELECT 1 FROM products WHERE slug = ?`, args: [slug] });
    let n = 2;
    while (dupe.rows.length) { slug = `${slug}-${n++}`; dupe = await db.execute({ sql: `SELECT 1 FROM products WHERE slug = ?`, args: [slug] }); }

    const brandId = await ensureBrand(it.brand || 'Generic');
    const catId = await ensureCategory(it.category, 'writing-instruments-ball-pens');
    const id = crypto.randomUUID();

    await db.execute({
      sql: `INSERT INTO products (id, sku, name, slug, brand_id, category_id, short_description, description,
             mrp, selling_price, stock_quantity, low_stock_threshold, specifications, tags, seo,
             rating_average, rating_count, units_sold, is_featured, is_bestseller, is_active, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        id, sku, it.name, slug, brandId, catId,
        `${it.name} - genuine product with GST invoice and pan-India delivery.`,
        `${it.name}. Sourced from a live retailer listing. Every order ships with a GST invoice and is covered by Sanjay Book Depot's replacement policy.`,
        mrp, price, 40 + ((i * 37) % 200), 10,
        JSON.stringify({ Source: 'live retailer listing', 'Listing URL': it.url }),
        JSON.stringify([(it.brand || '').toLowerCase(), 'stationery', 'india'].filter(Boolean)),
        JSON.stringify({ title: `${it.name} | Buy Online at Sanjay Book Depot`, description: `Buy ${it.name} online at best price in India. MRP Rs.${mrp}, now Rs.${price}.` }),
        0, 0, 0,
        inserted % 5 === 0 ? 1 : 0,
        inserted % 7 === 0 ? 1 : 0,
        1, now(), now(),
      ],
    });

    await db.execute({
      sql: `INSERT INTO product_images (id, product_id, image_url, alt_text, position, is_primary, created_at, updated_at)
            VALUES (?,?,?,?,0,1,?,?)`,
      args: [`${id}-1`, id, it.img, it.name, now(), now()],
    });
    inserted++;
  } catch (e) {
    skipped++;
    console.log(`  ! skipped ${it.name?.slice(0, 40)}: ${e.message?.slice(0, 80)}`);
  }
}

const total = (await db.execute(`SELECT COUNT(*) c FROM products`)).rows[0].c;
const real = (await db.execute(`SELECT COUNT(*) c FROM products WHERE sku LIKE 'REAL-%'`)).rows[0].c;
console.log(`inserted ${inserted}, skipped ${skipped}`);
console.log(`REAL-* products now: ${real} | total products: ${total}`);
db.close();
