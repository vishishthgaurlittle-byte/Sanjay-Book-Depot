import type { Metadata } from 'next';
import Link from 'next/link';

import { getBrands } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Brands',
  description:
    'All 52 Indian stationery brands stocked at Sanjay Book Depot, across three tiers.',
};

const TIER_LABEL: Record<string, string> = {
  tier1: 'Major manufacturers',
  tier2: 'Regional & growing',
  tier3: 'Premium & boutique',
};

const TIER_NOTE: Record<string, string> = {
  tier1: 'The houses every Indian desk already knows.',
  tier2: 'Smaller makers earning their place on our shelves.',
  tier3: 'For people who care about paper, nibs and binding.',
};

const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

export default async function BrandsPage() {
  const brands = await getBrands();
  const tiers = ['tier1', 'tier2', 'tier3'] as const;
  const totalProducts = brands.reduce((n, b) => n + b.product_count, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      <header
        className="max-w-3xl border-b pb-12"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
      >
        <p className="eyebrow">The houses we carry</p>
        <h1 className="display mt-5 text-[clamp(2.4rem,5.5vw,4rem)]">Our brands</h1>
        <p className="mt-7 text-[15px] leading-[1.85] text-ink-400">
          {brands.length} Indian stationery manufacturers, {totalProducts} products between them.
          Every item is genuine stock sourced through authorised distribution — no grey market,
          no substitutes, GST invoice with every order.
        </p>
      </header>

      {tiers.map((tier) => {
        const rows = brands.filter((b) => b.tier === tier);
        if (!rows.length) return null;

        return (
          <section key={tier} className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="display text-[clamp(1.6rem,3vw,2.4rem)]">{TIER_LABEL[tier]}</h2>
                <p className="mt-3 text-[13px] text-ink-500">{TIER_NOTE[tier]}</p>
              </div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
                {rows.length} brand{rows.length === 1 ? '' : 's'}
              </p>
            </div>

            <div
              className="mt-10 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              style={{ background: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}
            >
              {rows.map((b) => (
                <Link
                  key={b.id}
                  id={b.slug}
                  href={`/shop?brand=${b.slug}`}
                  className="group bg-ink-950 p-7 transition-colors duration-500 hover:bg-ink-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-[15px] font-medium leading-snug text-ink-100 transition-colors duration-300 group-hover:text-saffron-500">
                      {b.name}
                    </h3>
                    {b.is_featured === 1 && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" title="Featured" />
                    )}
                  </div>

                  {b.tagline && (
                    <p className="display mt-3 text-[15px] italic leading-snug text-ink-400">
                      {b.tagline}
                    </p>
                  )}

                  {b.parent_company && (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-ink-600">
                      {b.parent_company}
                    </p>
                  )}

                  <div className="mt-6 flex items-center justify-between" style={{ borderTop: HAIRLINE, paddingTop: '1rem' }}>
                    <span className="text-[11px] tabular-nums text-ink-500">
                      {b.product_count} products
                    </span>
                    <span className="text-[11px] text-ink-500 transition-colors duration-300 group-hover:text-saffron-500">
                      Shop →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
