import { NextResponse } from 'next/server';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** GET /api/products/:slug - product detail plus related items. */
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  const related = await getRelatedProducts(product.id, product.category_id, 4);
  return NextResponse.json({ product, related });
}
