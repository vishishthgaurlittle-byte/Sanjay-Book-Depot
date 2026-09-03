import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import Filters from '@/components/Filters';
import ProductCard from '@/components/ProductCard';
import { getBrands, getCategories, getFacets, listProducts, type ProductFilters } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shop Stationery',
  description:
    'Browse 500+ Indian stationery products across 15 categories and 52 brands. Filter by price, brand, rating and availability.',
};

type SearchParams = { [key: string]: string | string[] | undefined };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | undefined): number | undefined {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams;

  const q = first(sp.q);
  const category = first(sp.category);
  const brand = first(sp.brand);
  const limit = 24;
  const page = Math.max(1, num(first(sp.page)) ?? 1);

  const filters: ProductFilters = {
    q,
    categorySlug: category,
    brandSlug: brand,
    minPrice: num(first(sp.min)),
    maxPrice: num(first(sp.max)),
    minRating: num(first(sp.rating)),
    inStockOnly: first(sp.inStock) === '1',
    featured: first(sp.featured) === '1',
    bestseller: first(sp.bestseller) === '1',
    sort: (first(sp.sort) as ProductFilters['sort']) ?? 'relevance',
    limit,
    offset: (page - 1) * limit,
  };

  const [{ products, total, pages }, facets, categories, brands] = await Promise.all([
    listProducts(filters),
    getFacets(category, brand),
    getCategories(),
    getBrands(),
  ]);

  const heading =
    q ? `Results for “${q}”`
    : brand ? brands.find((b) => b.slug === brand)?.name ?? 'Brand'
    : category ? categories.find((c) => c.slug === category)?.name ?? 'Category'
    : filters.featured ? 'Featured products'
    : filters.bestseller ? 'Bestsellers'
    : 'The full collection';

  /** Preserve the current query string while changing one parameter. */
  const withParam = (key: string, value: string) => {
    const next = new URLSearchParams(
      Object.fromEntries(
        Object.entries(sp)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ),
    );
    next.set(key, value);
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      {/* ── Page head ─────────────────────────────────── */}
      <nav className="text-[10px] uppercase tracking-[0.2em] text-ink-500">
        <Link href="/" className="transition-colors hover:text-saffron-500">Home</Link>
        <span className="mx-3 text-ink-700">/</span>
        <span className="text-ink-400">Shop</span>
      </nav>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-8 border-b pb-10"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
      >
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.75rem)]">{heading}</h1>
          <p className="mt-5 text-[12px] uppercase tracking-[0.18em] text-ink-500">
            {total} product{total === 1 ? '' : 's'}
            {pages > 1 ? ` · page ${page} of ${pages}` : ''}
          </p>
        </div>

        {/* Sorting lives in the <Filters /> client component, which owns the
            query-string updates. Duplicating it here as a server-rendered
            <select> would render but never navigate. */}
        <p className="max-w-xs text-[13px] leading-relaxed text-ink-500">
          Refine by department, brand, price and rating using the filters.
          Sorting is at the top of that panel.
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
        <Suspense
          fallback={
            <div className="h-64 animate-pulse" style={{ background: 'var(--color-ink-900)' }} />
          }
        >
          <Filters facets={facets} categories={categories} brands={brands} total={total} />
        </Suspense>

        <div>
          {products.length === 0 ? (
            <div
              className="border border-dashed p-16 text-center"
              style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 18%, transparent)' }}
            >
              <p className="display text-2xl">No products match those filters</p>
              <p className="mx-auto mt-4 max-w-sm text-[13px] leading-relaxed text-ink-400">
                Try widening the price range, or clear the filters to see the
                full catalogue.
              </p>
              <Link href="/shop" className="lux-btn mt-8 inline-flex">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3 xl:gap-6">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i % 6} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-16 flex items-center justify-center gap-1.5">
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center gap-1.5">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-1 text-ink-600">…</span>
                    )}
                    <Link
                      href={withParam('page', String(p))}
                      className="min-w-10 px-3.5 py-2.5 text-center text-[12px] tabular-nums transition-colors duration-300"
                      style={{
                        border: '1px solid',
                        borderRadius: 'var(--radius-lux)',
                        borderColor:
                          p === page
                            ? 'var(--color-saffron-500)'
                            : 'color-mix(in oklab, var(--color-ink-50) 14%, transparent)',
                        color: p === page ? 'var(--color-saffron-500)' : 'var(--color-ink-300)',
                      }}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
