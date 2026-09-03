import 'server-only';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { all, one, placeholders } from './db';
import { parseJson } from './format';

/** Server-side data access. All functions are read-only except where noted. */

/* ───────────────────── product image resolution ─────────────────────
 *
 * product_images rows point at /images/products/{SKU}-{n}.svg. Only the
 * first batch of placeholder art exists on disk; the rest arrive in batches
 * as real photographs are approved and uploaded to Insforge storage.
 *
 * Rather than emit 6,000 broken <img> srcs, substitute a single shared
 * placeholder for any file that is not actually present. The directory is
 * read once and cached, so this costs one readdir for the process lifetime.
 */
const IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'products');
export const FALLBACK_IMAGE = '/images/products/_fallback.svg';

let cachedFiles: Set<string> | null = null;
function existingImageFiles(): Set<string> {
  if (cachedFiles) return cachedFiles;
  try {
    cachedFiles = new Set(readdirSync(IMAGE_DIR));
  } catch {
    cachedFiles = new Set();
  }
  return cachedFiles;
}

/** Map a stored image URL to one that actually resolves, or the fallback. */
export function resolveImage(url: string | null | undefined): string | null {
  if (!url) return FALLBACK_IMAGE;
  const file = url.split('/').pop();
  if (!file) return FALLBACK_IMAGE;
  // Anything outside the generated-art directory (e.g. an Insforge CDN URL
  // added later) is passed through untouched.
  if (!url.startsWith('/images/products/')) return url;
  return existingImageFiles().has(file) ? url : FALLBACK_IMAGE;
}

/** Same, but for a list of image rows. */
function resolveImageRows<T extends { image_url: string }>(rows: T[]): T[] {
  return rows.map((r) => ({ ...r, image_url: resolveImage(r.image_url) ?? FALLBACK_IMAGE }));
}


export type Specifications = Record<string, string>;
export type Seo = { title?: string; description?: string; keywords?: string };

export interface ProductSummary {
  id: string;
  sku: string;
  name: string;
  slug: string;
  mrp: number;
  selling_price: number;
  discount_percent: number;
  stock_quantity: number;
  rating_average: number;
  rating_count: number;
  is_featured: number;
  is_bestseller: number;
  brand_id: string;
  brand_name: string;
  brand_slug: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  primary_image: string | null;
}

export interface ProductDetail extends ProductSummary {
  short_description: string | null;
  description: string | null;
  specifications: Specifications;
  tags: string[];
  seo: Seo;
  model_3d_url: string | null;
  units_sold: number;
  images: { image_url: string; alt_text: string | null; position: number; is_primary: number }[];
  variants: {
    id: string;
    sku: string;
    variant_type: string;
    option_value: string;
    price_delta: number;
    stock_quantity: number;
    hex_code: string | null;
  }[];
  reviews: {
    id: string;
    author_name: string | null;
    rating: number;
    title: string | null;
    body: string | null;
    is_verified_purchase: number;
    created_at: string;
  }[];
  breadcrumbs: { name: string; slug: string }[];
}

const SUMMARY_SELECT = `
  SELECT p.id, p.sku, p.name, p.slug, p.mrp, p.selling_price, p.discount_percent,
         p.stock_quantity, p.rating_average, p.rating_count, p.is_featured, p.is_bestseller,
         p.brand_id, b.name AS brand_name, b.slug AS brand_slug,
         p.category_id, c.name AS category_name, c.slug AS category_slug,
         (SELECT i.image_url FROM product_images i
           WHERE i.product_id = p.id ORDER BY i.is_primary DESC, i.position ASC LIMIT 1) AS primary_image
    FROM products p
    JOIN brands b ON b.id = p.brand_id
    JOIN categories c ON c.id = p.category_id`;

export interface ProductFilters {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'discount';
  limit?: number;
  offset?: number;
}

const SORTS: Record<string, string> = {
  price_asc: 'p.selling_price ASC',
  price_desc: 'p.selling_price DESC',
  rating: 'p.rating_average DESC, p.rating_count DESC',
  newest: 'p.created_at DESC',
  discount: 'p.discount_percent DESC',
  relevance: 'p.units_sold DESC',
};

/**
 * Catalogue listing. Uses the FTS5 index when `q` is present - note that FTS5
 * MATCH requires the UNALIASED table name, and libsql cannot COUNT(*) an
 * external-content FTS table directly.
 */
export async function listProducts(f: ProductFilters = {}) {
  const where: string[] = ['p.is_active = 1'];
  const args: (string | number)[] = [];
  let from = '';

  if (f.q?.trim()) {
    // Sanitise for FTS: quote each term so punctuation cannot alter the query.
    const terms = f.q.trim().split(/\s+/).slice(0, 8).map((t) => `"${t.replace(/"/g, '""')}"`);
    from = ` JOIN products_fts ON products_fts.rowid = p.rowid`;
    where.push(`products_fts MATCH ?`);
    args.push(terms.join(' AND '));
  }

  if (f.categorySlug) {
    where.push(`(c.slug = ? OR pc.slug = ?)`);
    args.push(f.categorySlug, f.categorySlug);
  }
  if (f.brandSlug) {
    where.push(`b.slug = ?`);
    args.push(f.brandSlug);
  }
  if (typeof f.minPrice === 'number' && Number.isFinite(f.minPrice)) {
    where.push(`p.selling_price >= ?`);
    args.push(f.minPrice);
  }
  if (typeof f.maxPrice === 'number' && Number.isFinite(f.maxPrice)) {
    where.push(`p.selling_price <= ?`);
    args.push(f.maxPrice);
  }
  if (typeof f.minRating === 'number' && Number.isFinite(f.minRating)) {
    where.push(`p.rating_average >= ?`);
    args.push(f.minRating);
  }
  if (f.inStockOnly) where.push(`p.stock_quantity > 0`);
  if (f.featured) where.push(`p.is_featured = 1`);
  if (f.bestseller) where.push(`p.is_bestseller = 1`);

  const orderBy = SORTS[f.sort ?? 'relevance'] ?? SORTS.relevance;
  const limit = Math.min(Math.max(f.limit ?? 24, 1), 100);
  const offset = Math.max(f.offset ?? 0, 0);

  const parentJoin = f.categorySlug ? ` LEFT JOIN categories pc ON pc.id = c.parent_id` : '';
  const whereSql = where.join(' AND ');

  const rows = await all<ProductSummary>(
    `${SUMMARY_SELECT}${from}${parentJoin}
      WHERE ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
    [...args, limit, offset],
  );

  const totalRow = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id${from}${parentJoin}
      WHERE ${whereSql}`,
    args,
  );

  return {
    products: rows.map((r) => ({ ...r, primary_image: resolveImage(r.primary_image) })),
    total: Number(totalRow?.n ?? 0),
    limit,
    offset,
    pages: Math.max(1, Math.ceil(Number(totalRow?.n ?? 0) / limit)),
  };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const p = await one<ProductSummary & {
    short_description: string | null;
    description: string | null;
    specifications: string | null;
    tags: string | null;
    seo: string | null;
    model_3d_url: string | null;
    units_sold: number;
    low_stock_threshold: number;
  }>(
    `${SUMMARY_SELECT.replace(/p\.is_featured, p\.is_bestseller,/, 'p.is_featured, p.is_bestseller, p.short_description, p.description, p.specifications, p.tags, p.seo, p.model_3d_url, p.units_sold, p.low_stock_threshold,')}
      WHERE p.slug = ? AND p.is_active = 1`,
    [slug],
  );
  if (!p) return null;

  const [images, variants, reviews, parent] = await Promise.all([
    all<{ image_url: string; alt_text: string | null; position: number; is_primary: number }>(
      `SELECT image_url, alt_text, position, is_primary FROM product_images
        WHERE product_id = ? ORDER BY is_primary DESC, position ASC`,
      [p.id],
    ),
    all<ProductDetail['variants'][number]>(
      `SELECT id, sku, variant_type, option_value, price_delta, stock_quantity, hex_code
         FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY option_value`,
      [p.id],
    ),
    all<ProductDetail['reviews'][number]>(
      `SELECT id, author_name, rating, title, body, is_verified_purchase, created_at
         FROM product_reviews WHERE product_id = ? AND is_approved = 1
        ORDER BY created_at DESC LIMIT 20`,
      [p.id],
    ),
    one<{ name: string; slug: string }>(
      `SELECT pc.name, pc.slug FROM categories c
         JOIN categories pc ON pc.id = c.parent_id
        WHERE c.slug = (SELECT slug FROM categories WHERE id = ?)`,
      [p.category_id],
    ),
  ]);

  return {
    ...p,
    primary_image: resolveImage(p.primary_image),
    specifications: parseJson<Specifications>(p.specifications, {}),
    tags: parseJson<string[]>(p.tags, []),
    seo: parseJson<Seo>(p.seo, {}),
    images: resolveImageRows(images),
    variants,
    reviews,
    breadcrumbs: [
      { name: 'Shop', slug: '/shop' },
      ...(parent ? [{ name: parent.name, slug: `/shop?category=${parent.slug}` }] : []),
      { name: p.category_name, slug: `/shop?category=${p.category_slug}` },
    ],
  };
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 4) {
  const rows = await all<ProductSummary>(
    `${SUMMARY_SELECT}
      WHERE p.is_active = 1 AND p.category_id = ? AND p.id <> ?
      ORDER BY p.units_sold DESC LIMIT ?`,
    [categoryId, productId, limit],
  );
  return rows.map((r) => ({ ...r, primary_image: resolveImage(r.primary_image) }));
}

export async function getCategories() {
  const rows = await all<{
    id: string; slug: string; name: string; parent_id: string | null; depth: number;
    icon: string | null; description: string | null; is_featured: number; sort_order: number;
    product_count: number;
  }>(
    `SELECT c.id, c.slug, c.name, c.parent_id, c.depth, c.icon, c.description, c.is_featured, c.sort_order,
            (SELECT COUNT(*) FROM products p WHERE p.is_active = 1 AND
               (p.category_id = c.id OR p.category_id IN
                 (SELECT id FROM categories WHERE parent_id = c.id))) AS product_count
       FROM categories c
      WHERE c.is_active = 1
      ORDER BY c.depth ASC, c.sort_order ASC`,
  );
  const parents = rows.filter((r) => r.depth === 1);
  return parents.map((parent) => ({
    ...parent,
    children: rows.filter((r) => r.parent_id === parent.id),
  }));
}

export async function getBrands() {
  return all<{
    id: string; slug: string; name: string; tier: string; tagline: string | null;
    parent_company: string | null; is_featured: number; product_count: number;
  }>(
    `SELECT b.id, b.slug, b.name, b.tier, b.tagline, b.parent_company, b.is_featured,
            (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = 1) AS product_count
       FROM brands b
      WHERE b.is_active = 1
      ORDER BY b.sort_order ASC`,
  );
}

export async function getFacets(categorySlug?: string, brandSlug?: string) {
  const args: (string | number)[] = [];
  let where = 'p.is_active = 1';
  if (categorySlug) {
    where += ' AND (c.slug = ? OR pc.slug = ?)';
    args.push(categorySlug, categorySlug);
  }
  if (brandSlug) {
    where += ' AND b.slug = ?';
    args.push(brandSlug);
  }
  const base = `FROM products p
     JOIN brands b ON b.id = p.brand_id
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories pc ON pc.id = c.parent_id
    WHERE ${where}`;

  const [price, brands, categories] = await Promise.all([
    one<{ lo: number; hi: number }>(`SELECT MIN(p.selling_price) AS lo, MAX(p.selling_price) AS hi ${base}`, args),
    all<{ slug: string; name: string; n: number }>(
      `SELECT b.slug, b.name, COUNT(*) AS n ${base} GROUP BY b.id HAVING n > 0 ORDER BY n DESC LIMIT 30`,
      args,
    ),
    all<{ slug: string; name: string; n: number }>(
      `SELECT pc.slug, pc.name, COUNT(*) AS n ${base} GROUP BY pc.id HAVING n > 0 ORDER BY n DESC`,
      args,
    ),
  ]);
  return { price, brands, categories };
}

/** Coupon validation. Read-only: redemption count is updated at order time. */
export async function validateCoupon(code: string, subtotal: number) {
  const c = await one<{
    id: string; code: string; description: string | null; discount_type: string;
    discount_value: number; min_order_value: number; max_discount: number | null;
    usage_limit: number | null; used_count: number; starts_at: string | null;
    expires_at: string | null; is_active: number;
  }>(`SELECT * FROM coupons WHERE code = ? COLLATE NOCASE`, [code.trim()]);

  if (!c) return { valid: false as const, reason: 'Coupon code not found.' };
  if (!c.is_active) return { valid: false as const, reason: 'This coupon is no longer active.' };
  if (c.expires_at && c.expires_at < new Date().toISOString().slice(0, 19).replace('T', ' ')) {
    return { valid: false as const, reason: 'This coupon has expired.' };
  }
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) {
    return { valid: false as const, reason: 'This coupon has reached its usage limit.' };
  }
  if (subtotal < c.min_order_value) {
    return {
      valid: false as const,
      reason: `Minimum order value for this coupon is Rs.${c.min_order_value}.`,
    };
  }

  let discount = 0;
  if (c.discount_type === 'percent') discount = (subtotal * c.discount_value) / 100;
  else if (c.discount_type === 'flat') discount = c.discount_value;
  else discount = 0; // shipping coupons are applied to shipping_fee at order time
  if (c.max_discount !== null) discount = Math.min(discount, c.max_discount);
  discount = Math.round(discount * 100) / 100;

  return {
    valid: true as const,
    code: c.code,
    discount,
    discount_type: c.discount_type,
    description: c.description,
  };
}

/** Atomically decrement stock. Returns false if there was not enough left. */
export async function decrementStock(productId: string, qty: number): Promise<boolean> {
  const res = await (await import('./db')).run(
    `UPDATE products SET stock_quantity = stock_quantity - ?
      WHERE id = ? AND stock_quantity >= ?`,
    [qty, productId, qty],
  );
  return Number(res.rowsAffected) === 1;
}

/** Convenience for the homepage. */
export async function homepageData() {
  const [featured, bestsellers, deals, categories, brands] = await Promise.all([
    listProducts({ featured: true, limit: 8 }),
    listProducts({ bestseller: true, limit: 8 }),
    listProducts({ featured: true, sort: 'discount', limit: 8 }),
    getCategories(),
    getBrands(),
  ]);
  return {
    featured: featured.products,
    bestsellers: bestsellers.products,
    deals: deals.products,
    categories: categories.slice(0, 12),
    brands: brands.filter((b) => b.is_featured).slice(0, 10),
  };
}

export async function lowStockAlerts(limit = 10) {
  return all<{ sku: string; name: string; stock_quantity: number; low_stock_threshold: number }>(
    `SELECT sku, name, stock_quantity, low_stock_threshold FROM products
      WHERE stock_quantity <= low_stock_threshold
      ORDER BY stock_quantity ASC LIMIT ?`,
    [limit],
  );
}

export async function adminStats() {
  const s = await one<{
    products: number; brands: number; categories: number; customers: number;
    orders: number; low_stock: number; out_of_stock: number; inventory_value: number;
  }>(`SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM brands) AS brands,
        (SELECT COUNT(*) FROM categories) AS categories,
        (SELECT COUNT(*) FROM customers) AS customers,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM products WHERE stock_quantity <= low_stock_threshold) AS low_stock,
        (SELECT COUNT(*) FROM products WHERE stock_quantity = 0) AS out_of_stock,
        (SELECT COALESCE(ROUND(SUM(stock_quantity * selling_price), 2), 0) FROM products) AS inventory_value`);
  return s;
}

export async function topBrandsByRevenue(limit = 5) {
  return all<{ name: string; products: number; revenue: number }>(
    `SELECT b.name, COUNT(p.id) AS products,
            ROUND(SUM(p.selling_price * p.units_sold)) AS revenue
       FROM products p JOIN brands b ON b.id = p.brand_id
      GROUP BY b.id ORDER BY revenue DESC LIMIT ?`,
    [limit],
  );
}

export { placeholders };

/** Highest-rated approved reviews, used as homepage testimonials. */
export async function getTestimonials(limit = 3) {
  return all<{
    id: string;
    comment: string;
    rating: number;
    customer_name: string;
  }>(
    `SELECT r.id,
            r.body        AS comment,
            r.rating,
            COALESCE(NULLIF(TRIM(r.author_name), ''), 'Verified Buyer') AS customer_name
       FROM product_reviews r
      WHERE r.is_approved = 1 AND LENGTH(r.body) > 40
      ORDER BY r.helpful_count DESC, r.rating DESC, r.created_at DESC
      LIMIT ?`,
    [limit],
  );
}
