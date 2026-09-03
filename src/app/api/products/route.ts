import { NextResponse } from 'next/server';
import { listProducts, getFacets, type ProductFilters } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/** GET /api/products?q=&category=&brand=&min=&max=&sort=&limit=&offset= */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const num = (k: string) => {
    const v = sp.get(k);
    if (v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const bool = (k: string) => ['1', 'true', 'yes'].includes((sp.get(k) ?? '').toLowerCase());

  const filters: ProductFilters = {
    q: sp.get('q') ?? undefined,
    categorySlug: sp.get('category') ?? undefined,
    brandSlug: sp.get('brand') ?? undefined,
    minPrice: num('min'),
    maxPrice: num('max'),
    minRating: num('rating'),
    inStockOnly: bool('inStock'),
    featured: bool('featured'),
    bestseller: bool('bestseller'),
    sort: (sp.get('sort') as ProductFilters['sort']) ?? 'relevance',
    limit: num('limit') ?? 24,
    offset: num('offset') ?? 0,
  };

  const { products, total, limit, offset } = await listProducts(filters);

  return NextResponse.json({
    products,
    pagination: {
      total,
      limit,
      offset,
      pages: Math.max(1, Math.ceil(total / limit)),
      page: Math.floor(offset / limit) + 1,
    },
  });
}
