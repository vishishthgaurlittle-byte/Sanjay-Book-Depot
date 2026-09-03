'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { money } from '@/lib/format';
import type { BrandRow, CategoryNode } from '@/lib/types';

export interface Facets {
  price: { lo: number; hi: number } | null;
  brands: { slug: string; name: string; n: number }[];
  categories: { slug: string; name: string; n: number }[];
}

const RULE = 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)';
const FIELD_BORDER = 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)';

export default function Filters({
  facets,
  categories,
  brands,
  total,
}: {
  facets: Facets;
  categories: CategoryNode[];
  brands: BrandRow[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const set = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      next.delete('offset'); // filters reset pagination
      next.delete('page');
      router.replace(`/shop?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const activeCategory = params.get('category');
  const activeBrand = params.get('brand');
  const activeSort = params.get('sort') ?? 'relevance';
  const query = params.get('q');

  const brandName = (slug: string | null) => brands.find((b) => b.slug === slug)?.name;
  const hasFilters = Boolean(activeCategory || activeBrand || query);

  return (
    <aside>
      {/* ── Result count ──────────────────────────────── */}
      <div className="pb-8" style={{ borderBottom: `1px solid ${RULE}` }}>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
          {total} product{total === 1 ? '' : 's'}
        </p>

        {query && (
          <p className="mt-3 text-[12px] text-ink-400">
            Searching for <span className="text-ink-100">“{query}”</span>
          </p>
        )}
        {activeBrand && (
          <p className="mt-2 text-[12px] text-ink-400">
            Brand <span className="text-ink-100">{brandName(activeBrand)}</span>
          </p>
        )}

        {hasFilters && (
          <button
            onClick={() => router.replace('/shop', { scroll: false })}
            className="mt-4 text-[10px] uppercase tracking-[0.18em] text-saffron-500 transition-colors hover:text-saffron-400"
          >
            Clear all filters
          </button>
        )}
      </div>

      <FilterGroup title="Sort by">
        <select
          value={activeSort}
          onChange={(e) => set('sort', e.target.value)}
          className="w-full border-b bg-transparent py-2 text-[12px] text-ink-100 outline-none transition-colors focus:border-saffron-500"
          style={{ borderColor: FIELD_BORDER }}
        >
          <option value="relevance">Most popular</option>
          <option value="price_asc">Price · low to high</option>
          <option value="price_desc">Price · high to low</option>
          <option value="discount">Biggest discount</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Newest</option>
        </select>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            placeholder={facets.price ? String(Math.floor(facets.price.lo)) : 'Min'}
            defaultValue={params.get('min') ?? ''}
            onBlur={(e) => set('min', e.target.value)}
            className="w-full border-b bg-transparent py-2 text-[12px] tabular-nums text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-saffron-500"
            style={{ borderColor: FIELD_BORDER }}
          />
          <span className="text-ink-600">–</span>
          <input
            type="number"
            min={0}
            placeholder={facets.price ? String(Math.ceil(facets.price.hi)) : 'Max'}
            defaultValue={params.get('max') ?? ''}
            onBlur={(e) => set('max', e.target.value)}
            className="w-full border-b bg-transparent py-2 text-[12px] tabular-nums text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-saffron-500"
            style={{ borderColor: FIELD_BORDER }}
          />
        </div>
        {facets.price && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-ink-600">
            {money(facets.price.lo)} – {money(facets.price.hi)}
          </p>
        )}
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="flex cursor-pointer items-center gap-3 text-[12px] text-ink-200">
          <input
            type="checkbox"
            checked={params.get('inStock') === '1'}
            onChange={(e) => set('inStock', e.target.checked ? '1' : null)}
            className="h-3.5 w-3.5 accent-saffron-500"
          />
          In stock only
        </label>
      </FilterGroup>

      <FilterGroup title="Rating">
        {[4, 3, 2].map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-3 text-[12px] text-ink-200">
            <input
              type="radio"
              name="rating"
              checked={params.get('rating') === String(r)}
              onChange={() => set('rating', String(r))}
              className="h-3.5 w-3.5 accent-saffron-500"
            />
            {r}★ & up
          </label>
        ))}
      </FilterGroup>

      {facets.categories.length > 0 && (
        <FilterGroup title="Category">
          <OptionList
            items={facets.categories.map((c) => ({ slug: c.slug, name: c.name, n: c.n }))}
            active={activeCategory}
            onPick={(slug) => set('category', activeCategory === slug ? null : slug)}
          />
        </FilterGroup>
      )}

      {facets.brands.length > 0 && (
        <FilterGroup title="Brand">
          <OptionList
            items={facets.brands.map((b) => ({ slug: b.slug, name: b.name, n: b.n }))}
            active={activeBrand}
            onPick={(slug) => set('brand', activeBrand === slug ? null : slug)}
            maxHeight={320}
          />
        </FilterGroup>
      )}

      {categories.length > 0 && (
        <FilterGroup title="All departments">
          <OptionList
            items={categories.map((c) => ({
              slug: c.slug,
              name: c.name,
              n: c.product_count,
            }))}
            active={activeCategory}
            onPick={(slug) => set('category', activeCategory === slug ? null : slug)}
          />
        </FilterGroup>
      )}
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-8" style={{ borderBottom: `1px solid ${RULE}` }}>
      <h3 className="mb-5 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/** A scrollable pick-list. The active row gets a rule and the accent colour. */
function OptionList({
  items,
  active,
  onPick,
  maxHeight = 260,
}: {
  items: { slug: string; name: string; n: number }[];
  active: string | null;
  onPick: (slug: string) => void;
  maxHeight?: number;
}) {
  return (
    <div className="overflow-y-auto pr-1" style={{ maxHeight }}>
      {items.map((item) => {
        const isActive = active === item.slug;
        return (
          <button
            key={item.slug}
            onClick={() => onPick(item.slug)}
            className="flex w-full items-baseline justify-between gap-3 py-2 text-left transition-colors duration-300"
            style={{ color: isActive ? 'var(--color-saffron-500)' : 'var(--color-ink-300)' }}
          >
            <span className="truncate text-[12px]">{item.name}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-ink-600">{item.n}</span>
          </button>
        );
      })}
    </div>
  );
}
