'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

import { money } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';
import { useCart } from '@/store/cart';

export function Stars({ value, size = 11 }: { value: number; size?: number }) {
  const pct = Math.round(value * 10);
  return (
    <div className="flex items-center gap-[1px]" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i + 1));
        const id = `star-${i}-${pct}`;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={id}>
                <stop offset={`${fill * 100}%`} stopColor="var(--color-saffron-500)" />
                <stop offset={`${fill * 100}%`} stopColor="var(--color-ink-700)" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#${id})`}
              d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z"
            />
          </svg>
        );
      })}
    </div>
  );
}

export default function ProductCard({
  product,
  index = 0,
}: {
  product: ProductSummary;
  index?: number;
}) {
  const add = useCart((s) => s.add);
  const discount = product.discount_percent;
  const image = product.primary_image ?? `/images/products/${product.sku}-1.svg`;
  const outOfStock = product.stock_quantity <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
      className="group lux-card"
    >
      {/* ── Image ─────────────────────────────────────────── */}
      <Link href={`/product/${product.slug}`} className="block overflow-hidden">
        <div
          className="relative aspect-[4/5] w-full overflow-hidden"
          style={{
            background:
              'radial-gradient(120% 90% at 50% 25%, color-mix(in oklab, var(--color-ink-50) 6%, transparent), transparent 70%)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            className="h-full w-full object-contain p-8 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          />

          {discount > 0 && !outOfStock && (
            <span className="absolute left-4 top-4 bg-saffron-500 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-saffron-on">
              −{discount}%
            </span>
          )}

          {outOfStock && (
            <div className="absolute inset-0 grid place-items-center bg-ink-950/70">
              <span className="text-[10px] uppercase tracking-[0.28em] text-ink-300">
                Sold Out
              </span>
            </div>
          )}

          {!outOfStock && (
            <button
              onClick={(e) => {
                e.preventDefault();
                add(
                  {
                    productId: product.id,
                    sku: product.sku,
                    name: product.name,
                    slug: product.slug,
                    image: product.primary_image,
                    brandName: product.brand_name,
                    unitPrice: product.selling_price,
                    maxStock: product.stock_quantity,
                    variant: null,
                  },
                  1,
                );
              }}
              className="absolute inset-x-0 bottom-0 translate-y-full bg-saffron-500 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-saffron-on transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
            >
              Add to Cart
            </button>
          )}
        </div>
      </Link>

      {/* ── Details ───────────────────────────────────────── */}
      <div className="px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-[9px] font-medium uppercase tracking-[0.24em] text-ink-500">
            {product.brand_name}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <Stars value={product.rating_average ?? 0} size={10} />
            <span className="text-[10px] tabular-nums text-ink-500">
              {product.rating_count}
            </span>
          </div>
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="mt-2.5 block text-[14px] font-medium leading-snug text-ink-100 transition-colors duration-300 group-hover:text-saffron-500"
        >
          <span className="line-clamp-2">{product.name}</span>
        </Link>

        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className="text-[16px] font-semibold tabular-nums text-ink-50">
            {money(product.selling_price)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-[12px] tabular-nums text-ink-500 line-through">
                {money(product.mrp)}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-saffron-600">
                {discount}% off
              </span>
            </>
          )}
        </div>

        {product.stock_quantity > 0 && product.stock_quantity <= 8 && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-saffron-600">
            Only {product.stock_quantity} left
          </p>
        )}
      </div>
    </motion.div>
  );
}
