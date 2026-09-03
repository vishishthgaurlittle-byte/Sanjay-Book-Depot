import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import BuyBox from '@/components/BuyBox';
import Product3D from '@/components/Product3D';
import ProductCard, { Stars } from '@/components/ProductCard';
import { money } from '@/lib/format';
import { getProductBySlug, getRelatedProducts } from '@/lib/queries';
import { shapeFromCategory } from '@/lib/shapes';
import { SITE_URL, abs } from '@/lib/site';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };
  return {
    title: product.seo.title ?? product.name,
    description: product.seo.description ?? product.short_description ?? undefined,
    keywords: product.seo.keywords,
  };
}

const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category_id, 4);
  const specs = Object.entries(product.specifications);

  // Product structured data → rich snippet (price, rating, availability) in Google.
  const images = (product.images.length ? product.images.map((i) => i.image_url) : [product.primary_image])
    .filter((u): u is string => Boolean(u))
    .map((u) => abs(u));
  const productLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${SITE_URL}/product/${product.slug}#product`,
    name: product.name,
    sku: product.sku,
    image: images,
    description: product.short_description || product.description || product.name,
    brand: { '@type': 'Brand', name: product.brand_name },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${product.slug}`,
      priceCurrency: 'INR',
      price: Number(product.selling_price),
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Sanjay Book Depot', url: `${SITE_URL}/` },
    },
  };
  if (Number(product.rating_count) > 0) {
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(product.rating_average),
      reviewCount: Number(product.rating_count),
    };
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      {/* ── Breadcrumbs ───────────────────────────────── */}
      <nav className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink-500">
        {product.breadcrumbs.map((b, i) => (
          <span key={`${b.slug}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span className="text-ink-700">/</span>}
            <Link href={b.slug} className="transition-colors hover:text-saffron-500">
              {b.name}
            </Link>
          </span>
        ))}
        <span className="text-ink-700">/</span>
        <span className="truncate normal-case tracking-normal text-ink-400">{product.name}</span>
      </nav>

      {/* ── Gallery + buy column ──────────────────────── */}
      <div className="mt-10 grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <Product3D
            shape={shapeFromCategory(product.category_slug, product.name)}
            modelUrl={product.model_3d_url}
            height={520}
          />

          {product.images.length > 0 && (
            <div className="mt-5 grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <div
                  key={`${img.image_url}-${i}`}
                  className="aspect-square overflow-hidden p-3 transition-colors duration-300 hover:border-saffron-500"
                  style={{
                    border: '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)',
                    borderRadius: 'var(--radius-lux)',
                    background: 'var(--color-ink-900)',
                  }}
                >
                  {/* Placeholder art is an inline SVG in /public; swap for
                      next/image once real photos land in Insforge storage. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt={img.alt_text ?? product.name}
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-saffron-500">
            {product.brand_name}
          </p>

          <h1 className="display mt-5 text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.15]">
            {product.name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-ink-400">
            <Stars value={Number(product.rating_average)} size={13} />
            <span className="tabular-nums">
              {Number(product.rating_average).toFixed(1)} · {product.rating_count} ratings
            </span>
            <span className="text-ink-700">|</span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-500">
              SKU {product.sku}
            </span>
          </div>

          <div className="mt-10" style={{ borderTop: HAIRLINE, paddingTop: '2.5rem' }}>
            <BuyBox
              product={{
                id: product.id,
                sku: product.sku,
                name: product.name,
                slug: product.slug,
                brand_name: product.brand_name,
                mrp: product.mrp,
                selling_price: product.selling_price,
                stock_quantity: product.stock_quantity,
                primary_image: product.primary_image,
              }}
              variants={product.variants}
            />
          </div>

          {product.short_description && (
            <p className="mt-10 text-[14px] leading-[1.9] text-ink-300" style={{ borderTop: HAIRLINE, paddingTop: '2rem' }}>
              {product.short_description}
            </p>
          )}

          {/* Delivery reassurance */}
          <ul className="mt-10 space-y-3" style={{ borderTop: HAIRLINE, paddingTop: '2rem' }}>
            {[
              'Dispatched within 24 hours from Lucknow',
              'Free shipping on orders above ₹499',
              '7-day returns on unopened items',
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-[12px] text-ink-400">
                <span className="h-px w-4 bg-saffron-500" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Details + reviews ─────────────────────────── */}
      <div className="mt-28 grid gap-16 lg:grid-cols-[1fr_380px]">
        <section>
          <p className="eyebrow">The detail</p>
          <h2 className="display mt-4 text-[clamp(1.6rem,3vw,2.4rem)]">Product information</h2>

          <p className="mt-8 max-w-2xl whitespace-pre-line text-[15px] leading-[1.95] text-ink-300">
            {product.description}
          </p>

          {specs.length > 0 && (
            <>
              <h3 className="mt-14 text-[10px] font-medium uppercase tracking-[0.24em] text-ink-500">
                Specifications
              </h3>
              <dl className="mt-6 grid gap-x-14 sm:grid-cols-2">
                {specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-6 py-3"
                    style={{ borderBottom: HAIRLINE }}
                  >
                    <dt className="text-[13px] text-ink-400">{k}</dt>
                    <dd className="text-right text-[13px] text-ink-100">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {product.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Link
                  key={t}
                  href={`/shop?q=${encodeURIComponent(t)}`}
                  className="px-3.5 py-1.5 text-[11px] tracking-wide text-ink-300 transition-colors duration-300 hover:text-saffron-500"
                  style={{
                    border: '1px solid color-mix(in oklab, var(--color-ink-50) 14%, transparent)',
                    borderRadius: 'var(--radius-lux)',
                  }}
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className="eyebrow">Ratings</p>
          <h2 className="display mt-4 text-[clamp(1.6rem,3vw,2.4rem)]">Reviews</h2>

          {product.reviews.length === 0 ? (
            <p className="mt-6 text-[13px] text-ink-400">No reviews yet for this product.</p>
          ) : (
            <ul className="mt-8 space-y-8">
              {product.reviews.map((r) => (
                <li key={r.id} style={{ borderBottom: HAIRLINE, paddingBottom: '2rem' }}>
                  <div className="flex items-center justify-between gap-3">
                    <Stars value={r.rating} size={12} />
                    {r.is_verified_purchase === 1 && (
                      <span className="text-[9px] uppercase tracking-[0.2em] text-saffron-500">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[14px] font-medium text-ink-50">{r.title}</p>
                  <p className="mt-2 text-[13px] leading-[1.8] text-ink-400">{r.body}</p>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-ink-500">
                    {r.author_name} · {String(r.created_at).slice(0, 10)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── Related ───────────────────────────────────── */}
      {related.length > 0 && (
        <section className="mt-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Continues with</p>
              <h2 className="display mt-4 text-[clamp(1.8rem,3.6vw,2.8rem)]">You may also like</h2>
            </div>
            <Link href={`/shop?category=${product.category_slug}`} className="lux-link hover:text-saffron-500">
              More in {product.category_name} →
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-20 text-center text-[11px] uppercase tracking-[0.18em] text-ink-600">
        From {money(product.selling_price)} · {product.category_name}
      </p>
    </div>
  );
}
