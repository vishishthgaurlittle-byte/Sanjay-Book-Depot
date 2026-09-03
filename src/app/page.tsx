import Link from 'next/link';

import Hero3D from '@/components/Hero3D';
import ProductCard from '@/components/ProductCard';
import { homepageData, getTestimonials } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const VALUES = [
  { title: 'Dispatched in 24 hours', copy: 'Every order leaves our Lucknow warehouse the next working day.' },
  { title: 'Authentic, always', copy: 'Sourced direct from 52 brands. No grey market, no substitutes.' },
  { title: 'Free shipping over ₹499', copy: 'Flat ₹49 below that, everywhere in India.' },
  { title: '7-day returns', copy: 'Unopened and unused — we collect from your door.' },
];

export default async function HomePage() {
  const { featured, bestsellers, categories, brands } = await homepageData();
  const testimonials = await getTestimonials(3);

  return (
    <>
      {/* ══ Hero ══════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <Hero3D />

        {/* Vignette keeps the copy legible over the 3D scene in any theme. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(75% 60% at 50% 45%, color-mix(in oklab, var(--color-ink-950) 72%, transparent), transparent 78%)',
          }}
        />

        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-[1400px] flex-col justify-center px-4 py-24 sm:px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="eyebrow">Lucknow · Est. 1998</p>

            <h1 className="display mt-7 text-[clamp(2.8rem,8.5vw,6.5rem)]">
              The finest stationery,
              <br />
              <em className="italic text-saffron-500">quietly</em> assembled.
            </h1>

            <p className="mt-8 max-w-xl text-[15px] leading-[1.8] text-ink-400">
              Five hundred products from fifty-two of India&rsquo;s most respected
              houses — notebooks, drafting instruments, art papers and writing
              instruments, chosen the way a shopkeeper would choose them.
            </p>

            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Link href="/shop" className="lux-btn group">
                Explore the collection
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/brands" className="lux-btn-ghost hover:border-saffron-500 hover:text-saffron-500">
                Our brands
              </Link>
            </div>
          </div>

          {/* Hero stats */}
          <dl className="mt-20 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 border-t pt-8 sm:grid-cols-4"
            style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}
          >
            {[
              ['500+', 'Products'],
              ['52', 'Brands'],
              ['28', 'Years'],
              ['4.6★', 'Rated'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="display text-3xl text-saffron-500">{v}</dt>
                <dd className="mt-1.5 text-[10px] uppercase tracking-[0.2em] text-ink-500">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ══ Brand marquee ═════════════════════════════════ */}
      <section className="border-y py-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 px-4">
          {brands.map((b) => (
            <Link
              key={b.id}
              href={`/brands#${b.slug}`}
              className="text-[11px] font-medium uppercase tracking-[0.26em] text-ink-500 transition-colors duration-300 hover:text-saffron-500"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {/* ══ Categories ════════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-4 py-28 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Departments</p>
            <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.5rem)]">Shop by discipline</h2>
          </div>
          <Link href="/shop" className="lux-link hover:text-saffron-500">
            View all →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px md:grid-cols-3 lg:grid-cols-4"
          style={{ background: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}
        >
          {categories.slice(0, 8).map((c, i) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group relative bg-ink-950 p-8 transition-colors duration-500 hover:bg-ink-900"
            >
              <span className="display block text-[42px] leading-none text-ink-750 transition-colors duration-500 group-hover:text-saffron-600">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-6 text-[15px] font-medium leading-snug text-ink-100">
                {c.name}
              </h3>
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-ink-500">
                {c.product_count} products
              </p>
              <span className="mt-6 block h-px w-0 bg-saffron-500 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-10" />
            </Link>
          ))}
        </div>
      </section>

      {/* ══ Featured collection ═══════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">The selection</p>
            <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.5rem)]">Featured this season</h2>
          </div>
          <Link href="/shop?featured=1" className="lux-link hover:text-saffron-500">
            All featured →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* ══ Editorial split ═══════════════════════════════ */}
      <section className="mx-auto mt-28 max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div
            className="relative aspect-square overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--color-saffron-500) 18%, var(--color-ink-900)), var(--color-ink-900) 70%)',
            }}
          >
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <span className="display block text-[clamp(5rem,14vw,11rem)] leading-none text-saffron-500/90">
                  28
                </span>
                <span className="mt-2 block text-[11px] uppercase tracking-[0.34em] text-ink-300">
                  Years of service
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="eyebrow">Our house</p>
            <h2 className="display mt-5 text-[clamp(2rem,4vw,3.25rem)]">
              A shopkeeper&rsquo;s eye,
              <br />
              <em className="italic text-saffron-500">online</em>.
            </h2>
            <div className="mt-8 space-y-5 text-[15px] leading-[1.85] text-ink-400">
              <p>
                Sanjay Book Depot began as a single counter on Hazratganj in 1998,
                selling exercise books to students from three surrounding schools.
                Twenty-eight years later we still stock by hand.
              </p>
              <p>
                That has not changed. Every line you see here has been held,
                written on, and judged before it reached the shelf — because a
                catalogue of five thousand mediocre products is worth less than
                five hundred good ones.
              </p>
            </div>
            <Link href="/about" className="lux-btn-ghost mt-10 hover:border-saffron-500 hover:text-saffron-500">
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* ══ Bestsellers ═══════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-4 py-28 sm:px-6 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Most requested</p>
            <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.5rem)]">Bestsellers</h2>
          </div>
          <Link href="/shop?bestseller=1" className="lux-link hover:text-saffron-500">
            See all →
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
          {bestsellers.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* ══ Testimonials ══════════════════════════════════ */}
      {testimonials.length > 0 && (
        <section className="border-y py-24" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}>
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
            <p className="eyebrow text-center">In their words</p>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.id}>
                  <blockquote className="display text-[22px] leading-relaxed text-ink-100">
                    &ldquo;{t.comment}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 text-[11px] uppercase tracking-[0.2em] text-ink-500">
                    {t.customer_name} · {t.rating}★
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ Values ════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-6 lg:px-10">
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4"
          style={{ background: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}
        >
          {VALUES.map((v) => (
            <div key={v.title} className="bg-ink-950 p-8">
              <h3 className="text-[12px] font-medium uppercase tracking-[0.16em] text-saffron-500">
                {v.title}
              </h3>
              <p className="mt-4 text-[13px] leading-relaxed text-ink-400">{v.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
