import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { one, run } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/products/:id
 *
 * Hard-deletes a product. The schema cascades product_images,
 * product_variants and product_reviews, and order_items.product_id is
 * ON DELETE SET NULL so completed orders survive — an order must keep its
 * totals even after the line item is removed from the catalogue. The FTS
 * index is cleaned by a trigger on the products table.
 */
export async function DELETE(request: Request, ctx: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'Product id is required' }, { status: 400 });
  }

  const existing = await one<{
    id: string;
    sku: string;
    name: string;
    images: number;
    variants: number;
    reviews: number;
    order_items: number;
  }>(
    `SELECT p.id, p.sku, p.name,
            (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) AS images,
            (SELECT COUNT(*) FROM product_variants v WHERE v.product_id = p.id) AS variants,
            (SELECT COUNT(*) FROM product_reviews r WHERE r.product_id = p.id) AS reviews,
            (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS order_items
       FROM products p WHERE p.id = ?`,
    [id],
  );

  if (!existing) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Wrap in a transaction so a partial failure cannot leave orphans.
  try {
    await run(`DELETE FROM products WHERE id = ?`, [id]);
  } catch (err) {
    return NextResponse.json(
      {
        error: 'Delete failed',
        detail: err instanceof Error ? err.message : String(err),
        hint: 'This usually means a RESTRICT foreign key still references the row.',
      },
      { status: 409 },
    );
  }

  // Confirm it is really gone rather than trusting the statement.
  const after = await one<{ n: number }>(`SELECT COUNT(*) AS n FROM products WHERE id = ?`, [id]);
  if (Number(after?.n ?? 0) !== 0) {
    return NextResponse.json(
      { error: 'Delete reported success but the row is still present' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: {
      id: existing.id,
      sku: existing.sku,
      name: existing.name,
      cascaded: {
        images: existing.images,
        variants: existing.variants,
        reviews: existing.reviews,
      },
      order_items_detached: existing.order_items,
    },
    deletedBy: auth.admin.email,
  });
}

/** PATCH /api/admin/products/:id — toggle featured / bestseller / active. */
export async function PATCH(request: Request, ctx: Ctx) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { id } = await ctx.params;
  const body = (await request.json().catch(() => ({}))) as {
    is_featured?: boolean;
    is_bestseller?: boolean;
    is_active?: boolean;
  };

  const sets: string[] = [];
  const args: (string | number)[] = [];
  for (const key of ['is_featured', 'is_bestseller', 'is_active'] as const) {
    if (typeof body[key] === 'boolean') {
      sets.push(`${key} = ?`);
      args.push(body[key] ? 1 : 0);
    }
  }

  if (!sets.length) {
    return NextResponse.json(
      { error: 'Nothing to update', valid: ['is_featured', 'is_bestseller', 'is_active'] },
      { status: 422 },
    );
  }

  const existing = await one<{ id: string }>(`SELECT id FROM products WHERE id = ?`, [id]);
  if (!existing) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  await run(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, [...args, id]);

  const updated = await one<{ is_featured: number; is_bestseller: number; is_active: number }>(
    `SELECT is_featured, is_bestseller, is_active FROM products WHERE id = ?`,
    [id],
  );

  return NextResponse.json({ ok: true, product: updated, updatedBy: auth.admin.email });
}
