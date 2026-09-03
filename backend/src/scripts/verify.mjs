/**
 * Verify the seeded database by exercising real query paths - joins, FTS
 * search, the generated discount column across every row, CHECK/FK
 * enforcement, and the partial low-stock index.
 *
 *   npm run verify
 *
 * Exits non-zero on any failure.
 */
import { all, assertForeignKeysEnabled, db, get } from '../lib/db.mjs';

let pass = 0;
let fail = 0;
const check = (name, cond, detail = '') => {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` \x1b[90m${detail}\x1b[0m` : ''}`);
  } else {
    fail++;
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` \x1b[90m${detail}\x1b[0m` : ''}`);
  }
};

/** Assert a statement is REJECTED by a constraint. */
async function rejected(name, sql, args = []) {
  try {
    await db.execute({ sql, args });
    check(name, false, 'insert unexpectedly succeeded');
  } catch (e) {
    check(name, e.code === 'SQLITE_CONSTRAINT', `${e.code || e.message.split('\n')[0]}`);
  }
}

async function main() {
  console.log('\nSanjay Book Depot - database verification');
  console.log(`Database: ${process.env.TURSO_URL}\n`);

  /* integrity ---------------------------------------------------------- */
  console.log('Integrity');
  await assertForeignKeysEnabled();
  check('foreign key enforcement ON', true);

  const ik = await db.execute('PRAGMA integrity_check');
  check('PRAGMA integrity_check', ik.rows[0].integrity_check === 'ok', ik.rows[0].integrity_check);

  const fk = await db.execute('PRAGMA foreign_key_check');
  check('PRAGMA foreign_key_check (no orphans)', fk.rows.length === 0, `${fk.rows.length} violations`);

  /* counts ------------------------------------------------------------- */
  console.log('\nRow counts');
  const counts = {};
  for (const t of ['brands', 'categories', 'products', 'product_images', 'product_variants', 'customers', 'product_reviews', 'coupons', 'admin_users']) {
    counts[t] = Number((await get(`SELECT COUNT(*) AS n FROM ${t}`)).n);
    console.log(`    ${t.padEnd(18)} ${counts[t]}`);
  }
  check('52 brands', counts.brands === 52);
  check('65 categories (15 parents + 50 subs)', counts.categories === 65);
  check('500 products', counts.products === 500);
  check('10 featured brands', Number((await get('SELECT COUNT(*) AS n FROM brands WHERE is_featured=1')).n) === 10);
  check('every product has a brand and category',
    Number((await get('SELECT COUNT(*) AS n FROM products WHERE brand_id IS NULL OR category_id IS NULL')).n) === 0);
  check('every product has 3 images',
    Number((await get(`SELECT COUNT(*) AS n FROM (
      SELECT product_id FROM product_images GROUP BY product_id HAVING COUNT(*) <> 3)`)).n) === 0);

  /* the generated column, across EVERY row ------------------------------ */
  console.log('\nGenerated column (discount_percent)');
  const bad = await all(
    `SELECT sku, mrp, selling_price, discount_percent FROM products
     WHERE discount_percent <> CAST(ROUND((mrp - selling_price) * 100.0 / mrp) AS INTEGER)`,
  );
  check('discount_percent correct on all 500 rows', bad.length === 0, bad.length ? `first bad: ${bad[0].sku}` : '0 mismatches');
  const range = await get('SELECT MIN(discount_percent) AS lo, MAX(discount_percent) AS hi, ROUND(AVG(discount_percent),1) AS avg FROM products');
  check('every product has a real discount in 5..40%', range.lo >= 5 && range.hi <= 40, `min=${range.lo} max=${range.hi} avg=${range.avg}%`);
  check('no product priced above MRP',
    Number((await get('SELECT COUNT(*) AS n FROM products WHERE selling_price > mrp')).n) === 0);

  /* join - the query the product detail page actually runs -------------- */
  console.log('\nJoins (product detail shape)');
  const detail = await get(
    `SELECT p.sku, p.name, p.mrp, p.selling_price, p.discount_percent,
            b.name AS brand, b.tier, c.name AS category, pc.name AS parent_category,
            (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) AS images,
            (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variants,
            (SELECT COUNT(*) FROM product_reviews r WHERE r.product_id = p.id) AS reviews
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN categories pc ON pc.id = c.parent_id
      ORDER BY p.sku LIMIT 1`,
  );
  check('product joins to brand + category + parent category', !!detail && !!detail.brand && !!detail.parent_category);
  console.log(`    sample: ${detail.sku} | ${detail.brand} | ${detail.parent_category} > ${detail.category} | Rs.${detail.selling_price} (${detail.discount_percent}% off) | ${detail.images} imgs, ${detail.variants} variants, ${detail.reviews} reviews`);

  /* full text search --------------------------------------------------- */
  console.log('\nFTS5 search');
  for (const q of ['cello', 'notebook', 'fountain', 'geometry']) {
    const r = await all(
      `SELECT p.sku FROM products_fts f JOIN products p ON p.rowid = f.rowid
        WHERE products_fts MATCH ? ORDER BY rank LIMIT 3`, [q],
    );
    check(`search "${q}" returns results`, r.length > 0, `${r.length} hits`);
  }
  // External-content FTS5 tables cannot be COUNT(*)'d on libSQL - there is no
  // stored content to materialise, so it fails with "no such column: T.brand".
  // FTS5's own integrity-check command is the correct way to confirm the index
  // is in sync with the products table.
  let ftsHealthy = true;
  let ftsErr = '';
  try {
    await db.execute(`INSERT INTO products_fts(products_fts) VALUES('integrity-check')`);
  } catch (e) {
    ftsHealthy = false;
    ftsErr = e.message.split('\n')[0];
  }
  check('FTS5 integrity-check passes (index in sync with products)', ftsHealthy, ftsErr);

  /* filters the storefront needs --------------------------------------- */
  console.log('\nStorefront queries');
  const filtered = await all(
    `SELECT p.sku, p.selling_price FROM products p
      JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1 AND c.parent_id = (SELECT id FROM categories WHERE slug = 'writing-instruments')
       AND p.selling_price BETWEEN 50 AND 400
     ORDER BY p.selling_price ASC LIMIT 5`,
  );
  check('category + price filter works', filtered.length > 0, `${filtered.length} rows, cheapest Rs.${filtered[0]?.selling_price}`);

  const low = await all('SELECT sku, stock_quantity, low_stock_threshold FROM products WHERE stock_quantity <= low_stock_threshold');
  check('low-stock partial index query works', low.length > 0, `${low.length} products need restock`);

  const best = await get(`SELECT b.name, COUNT(*) AS n, ROUND(SUM(p.selling_price * p.units_sold)) AS revenue
    FROM products p JOIN brands b ON b.id = p.brand_id
    GROUP BY b.id ORDER BY revenue DESC LIMIT 1`);
  check('top brand by revenue aggregate works', !!best, `${best.name}: Rs.${best.revenue.toLocaleString('en-IN')}`);

  /* constraints -------------------------------------------------------- */
  console.log('\nConstraint enforcement');
  const someBrand = await get('SELECT id FROM brands LIMIT 1');
  const someCat = await get('SELECT id FROM categories LIMIT 1');
  await rejected('CHECK rejects selling_price > mrp',
    `INSERT INTO products (id,sku,name,slug,brand_id,category_id,mrp,selling_price)
     VALUES ('t1','T-CHK-1','t','t-chk-1',? ,?,100,200)`, [someBrand.id, someCat.id]);
  await rejected('CHECK rejects negative stock',
    `INSERT INTO products (id,sku,name,slug,brand_id,category_id,mrp,selling_price,stock_quantity)
     VALUES ('t2','T-CHK-2','t','t-chk-2',?,?,100,90,-5)`, [someBrand.id, someCat.id]);
  await rejected('CHECK rejects rating outside 1..5',
    `INSERT INTO product_reviews (id,product_id,rating) VALUES ('t3',(SELECT id FROM products LIMIT 1),7)`);
  await rejected('FK rejects orphan product (unknown brand)',
    `INSERT INTO products (id,sku,name,slug,brand_id,category_id,mrp,selling_price)
     VALUES ('t4','T-FK-1','t','t-fk-1','no-such-brand',?,100,90)`, [someCat.id]);
  await rejected('UNIQUE rejects duplicate sku',
    `INSERT INTO products (id,sku,name,slug,brand_id,category_id,mrp,selling_price)
     VALUES ('t5',(SELECT sku FROM products LIMIT 1),'t','t-dup',?,?,100,90)`, [someBrand.id, someCat.id]);
  await rejected('RESTRICT blocks deleting a brand with products',
    `DELETE FROM brands WHERE id = (SELECT brand_id FROM products LIMIT 1)`);

  /* cascade - create and delete our OWN row, never a seeded one --------- */
  const testId = 'verify-cascade-test';
  await db.execute(
    `INSERT INTO products (id,sku,name,slug,brand_id,category_id,mrp,selling_price)
     VALUES (?,'T-CASCADE','Cascade test','t-cascade',?,?,100,90)`,
    [testId, someBrand.id, someCat.id],
  );
  await db.execute(
    `INSERT INTO product_images (id,product_id,image_url,position,is_primary)
     VALUES ('verify-img',?,'/x.svg',0,1)`, [testId]);
  const before = Number((await get('SELECT COUNT(*) AS n FROM product_images WHERE product_id=?', [testId])).n);
  const ftsFind = () =>
    all(`SELECT p.id FROM products_fts JOIN products p ON p.rowid = products_fts.rowid
          WHERE products_fts MATCH 'cascade'`);
  const foundBefore = await ftsFind();
  await db.execute('DELETE FROM products WHERE id = ?', [testId]);
  const after = Number((await get('SELECT COUNT(*) AS n FROM product_images WHERE product_id=?', [testId])).n);
  check('CASCADE removes child images when product deleted', before === 1 && after === 0, `${before} -> ${after}`);
  const foundAfter = await ftsFind();
  check(
    'FTS delete trigger removed the row from the index',
    foundBefore.length === 1 && foundAfter.length === 0,
    `searchable before=${foundBefore.length} after=${foundAfter.length}`,
  );
  check('seeded product count untouched by verification',
    Number((await get('SELECT COUNT(*) AS n FROM products')).n) === counts.products);

  /* storage ------------------------------------------------------------ */
  const pageCount = Number((await get("SELECT page_count * page_size AS bytes FROM pragma_page_count(), pragma_page_size()")).bytes);
  console.log(`\nDatabase size: ${(pageCount / 1024 / 1024).toFixed(2)} MB (Turso free tier allows 5 GB)`);
  check('database well under 5 GB', pageCount / 1024 / 1024 < 5000);

  console.log('\n──────────────────────────────────────────');
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('──────────────────────────────────────────\n');
  if (fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error('\nVerification crashed:', e.message);
  process.exit(1);
});
