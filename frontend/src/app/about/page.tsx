import type { Metadata } from 'next';
import Link from 'next/link';

import { one } from '@/lib/db';
import { getBrands, getCategories } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About us',
  description:
    'Sanjay Book Depot — a Lucknow stationery house serving students, studios and offices across India since 1998.',
};

const PROMISES = [
  'Genuine stock only — no grey-market or duplicate goods',
  'GST invoice with every order',
  'Complimentary shipping above ₹499',
  'Seven-day replacement on damaged or incorrect items',
  'Bulk and corporate pricing on request',
];

const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

export default async function AboutPage() {
  const [stats, brands, categories] = await Promise.all([
    one<{ products: number; orders: number }>(
      `SELECT (SELECT COUNT(*) FROM products) AS products,
              (SELECT COUNT(*) FROM orders) AS orders`,
    ),
    getBrands(),
    getCategories(),
  ]);

  const years = new Date().getFullYear() - 1998;

  const facts: [string, string][] = [
    ['1998', 'Founded in Lucknow'],
    [`${brands.length}`, 'Indian brands stocked'],
    [`${stats?.products ?? 0}`, 'Products listed'],
    [`${categories.length}`, 'Departments'],
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      {/* ── Opening ───────────────────────────────────── */}
      <header
        className="max-w-3xl border-b pb-14"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
      >
        <p className="eyebrow">Lucknow · Est. 1998</p>
        <h1 className="display mt-5 text-[clamp(2.4rem,6vw,4.5rem)]">
          A counter, a ledger,
          <br />
          and <em className="italic text-saffron-500">twenty-eight years</em>.
        </h1>
      </header>

      {/* ── Story ─────────────────────────────────────── */}
      <div className="mt-16 grid gap-14 lg:grid-cols-[1fr_360px]">
        <div className="max-w-2xl space-y-7 text-[15px] leading-[1.95] text-ink-300">
          <p>
            Sanjay Book Depot began in 1998 as a single shop counter in Lucknow, selling
            notebooks to the school run across the road. {years === 28 ? 'Twenty-eight' : `${years}`}{' '}
            years later we still do the same thing — we just do it for customers all over India.
          </p>
          <p>
            We stock only genuine product, sourced through authorised distribution for every
            brand we carry. That is the whole reason the business has lasted: a Classmate
            notebook bought from us is a Classmate notebook, a Cello Butterflow writes like it
            should, and every order leaves with a GST invoice.
          </p>
          <p>
            Our catalogue spans {categories.length} departments and {brands.length} brands — from
            the notebooks and pencils every school needs, through office staples and files, up to
            fountain pens and hand-bound journals for people who care about paper.
          </p>
          <p>
            The website is new. The judgement behind it is not. Every line here has been held,
            written on and weighed before it reached the shelf, because a catalogue of five
            thousand mediocre products is worth less than five hundred good ones.
          </p>
        </div>

        {/* Stats rail */}
        <dl className="h-fit lg:sticky lg:top-32">
          {facts.map(([value, label]) => (
            <div key={label} className="py-6" style={{ borderBottom: HAIRLINE }}>
              <dt className="display text-[42px] leading-none text-saffron-500">{value}</dt>
              <dd className="mt-2.5 text-[10px] uppercase tracking-[0.22em] text-ink-500">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* ── Promises ──────────────────────────────────── */}
      <section className="mt-28">
        <p className="eyebrow">Our word</p>
        <h2 className="display mt-4 text-[clamp(1.9rem,4vw,3rem)]">What we promise</h2>

        <ul className="mt-12 max-w-3xl">
          {PROMISES.map((p, i) => (
            <li
              key={p}
              className="flex items-baseline gap-6 py-5"
              style={{ borderBottom: HAIRLINE }}
            >
              <span className="display shrink-0 text-[15px] text-ink-700 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-[15px] leading-relaxed text-ink-200">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Close ─────────────────────────────────────── */}
      <section
        className="mt-28 border-t py-20 text-center"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
      >
        <h2 className="display text-[clamp(1.9rem,4vw,3rem)]">Come and see for yourself</h2>
        <p className="mx-auto mt-6 max-w-md text-[14px] leading-relaxed text-ink-400">
          Browse the full catalogue, or write to us about bulk and institutional pricing.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/shop" className="lux-btn">
            Shop the collection
          </Link>
          <Link href="/contact" className="lux-btn-ghost hover:border-saffron-500 hover:text-saffron-500">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
