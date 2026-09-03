import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { all, one } from '@/lib/db';
import { resolveImage } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/products — paginated product list for the admin panel.
 *
 * Separate from the public /api/products because it returns admin-only fields
 * (cost-side stock, low-stock flags, inactive rows) and requires auth.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
  const offset = (page - 1) * limit;

  const args: (string | number)[] = [];
  let where = 'WHERE 1=1';
  if (q) {
    where += ' AND (p.name LIKE ? OR p.sku LIKE ? OR b.name LIKE ?)';
    const like = `%${q}%`;
    args.push(like, like, like);
  }

  const totalRow = await one<{ n: number }>(
    `SELECT COUNT(*) AS n FROM products p JOIN brands b ON b.id = p.brand_id ${where}`,
    args,
  );
  const total = Number(totalRow?.n ?? 0);

  const products = await all<{
    id: string;
    sku: string;
    name: string;
    slug: string;
    brand_name: string;
    category_name: string;
    mrp: number;
    selling_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
    is_featured: number;
    is_bestseller: number;
    is_active: number;
    primary_image: string | null;
  }>(
    `SELECT p.id, p.sku, p.name, p.slug, b.name AS brand_name, c.name AS category_name,
            p.mrp, p.selling_price, p.stock_quantity, p.low_stock_threshold,
            p.is_featured, p.is_bestseller, p.is_active,
            (SELECT image_url FROM product_images i
              WHERE i.product_id = p.id ORDER BY i.position ASC LIMIT 1) AS primary_image
       FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       ${where}
      ORDER BY p.created_at DESC, p.sku ASC
      LIMIT ? OFFSET ?`,
    [...args, limit, offset],
  );

  return NextResponse.json({
    products: products.map((row) => ({ ...row, primary_image: resolveImage(row.primary_image) })),
    pagination: { total, page, pages: Math.max(1, Math.ceil(total / limit)), limit },
  });
}
