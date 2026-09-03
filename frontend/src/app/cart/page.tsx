'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { money, round2 } from '@/lib/format';
import { cartShipping, cartSubtotal, FREE_SHIPPING_THRESHOLD, useCart } from '@/store/cart';

interface CouponResult {
  valid: boolean;
  reason?: string;
  code?: string;
  discount?: number;
  description?: string | null;
}

const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

export default function CartPage() {
  const { lines, setQuantity, remove, clear } = useCart();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Zustand persist rehydrates from localStorage after mount; rendering the
  // stored cart during SSR would mismatch the server HTML.
  useEffect(() => setMounted(true), []);

  const subtotal = cartSubtotal(lines);
  const discount = coupon?.valid ? round2(coupon.discount ?? 0) : 0;
  const shipping = cartShipping(Math.max(0, subtotal - discount));
  const total = round2(Math.max(0, subtotal - discount) + shipping);
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - (subtotal - discount));
  const progress = Math.min(100, ((subtotal - discount) / FREE_SHIPPING_THRESHOLD) * 100);

  async function applyCoupon(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      setCoupon((await res.json()) as CouponResult);
    } catch {
      setCoupon({ valid: false, reason: 'Could not reach the server. Try again.' });
    } finally {
      setChecking(false);
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-32 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-ink-500">Loading your cart…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-32 text-center sm:px-6 lg:px-10">
        <p className="eyebrow">Your basket</p>
        <h1 className="display mt-6 text-[clamp(2.2rem,5vw,3.75rem)]">Nothing here yet</h1>
        <p className="mx-auto mt-6 max-w-md text-[14px] leading-relaxed text-ink-400">
          Five hundred products from fifty-two Indian houses are waiting.
          Start with the notebooks — they are what we are known for.
        </p>
        <Link href="/shop" className="lux-btn mt-10 inline-flex">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      <header className="border-b pb-10" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
        <p className="eyebrow">Your basket</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="display text-[clamp(2.2rem,5vw,3.75rem)]">Your cart</h1>
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
            {lines.length} line item{lines.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_380px]">
        {/* ── Lines ─────────────────────────────────────── */}
        <div>
          <ul>
            {lines.map((l) => {
              const unit = round2(l.unitPrice + (l.variant?.priceDelta ?? 0));
              return (
                <li
                  key={`${l.productId}-${l.variant?.value ?? ''}`}
                  className="flex gap-5 py-7 sm:gap-7"
                  style={{ borderBottom: HAIRLINE }}
                >
                  <Link
                    href={`/product/${l.slug}`}
                    className="h-24 w-20 shrink-0 overflow-hidden p-2 sm:h-28 sm:w-24"
                    style={{
                      border: '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)',
                      borderRadius: 'var(--radius-lux)',
                      background: 'var(--color-ink-900)',
                    }}
                  >
                    {l.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={l.image} alt={l.name} className="h-full w-full object-contain" />
                    ) : null}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-ink-500">
                      {l.brandName}
                    </p>
                    <Link
                      href={`/product/${l.slug}`}
                      className="mt-2 line-clamp-2 block text-[14px] font-medium leading-snug text-ink-100 transition-colors duration-300 hover:text-saffron-500"
                    >
                      {l.name}
                    </Link>
                    {l.variant && (
                      <p className="mt-1.5 text-[12px] text-ink-400">
                        {l.variant.type}: {l.variant.value}
                      </p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-5">
                      <div
                        className="flex items-center"
                        style={{
                          border: '1px solid color-mix(in oklab, var(--color-ink-50) 16%, transparent)',
                          borderRadius: 'var(--radius-lux)',
                        }}
                      >
                        <button
                          onClick={() => setQuantity(l.productId, l.variant?.value, l.quantity - 1)}
                          className="px-3.5 py-1.5 text-ink-400 transition-colors hover:text-ink-50"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-[13px] tabular-nums text-ink-50">
                          {l.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(l.productId, l.variant?.value, l.quantity + 1)}
                          className="px-3.5 py-1.5 text-ink-400 transition-colors hover:text-ink-50"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => remove(l.productId, l.variant?.value)}
                        className="text-[10px] uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-saffron-600"
                      >
                        Remove
                      </button>

                      {l.quantity >= l.maxStock && l.maxStock > 0 && (
                        <span className="text-[10px] uppercase tracking-[0.16em] text-saffron-600">
                          Max stock reached
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-[15px] font-semibold tabular-nums text-ink-50">
                      {money(unit * l.quantity)}
                    </p>
                    {l.quantity > 1 && (
                      <p className="mt-1 text-[11px] tabular-nums text-ink-500">
                        {money(unit)} each
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            onClick={clear}
            className="mt-7 text-[10px] uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-saffron-600"
          >
            Clear cart
          </button>
        </div>

        {/* ── Summary ───────────────────────────────────── */}
        <aside className="h-fit lg:sticky lg:top-32">
          <h2 className="text-[10px] font-medium uppercase tracking-[0.24em] text-ink-500">
            Order summary
          </h2>

          {/* Free-shipping progress */}
          <div className="mt-6">
            <div
              className="h-px w-full overflow-hidden"
              style={{ background: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}
            >
              <div
                className="h-px transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progress}%`, background: 'var(--color-saffron-500)' }}
              />
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              {toFreeShipping > 0 ? (
                <>Add {money(toFreeShipping)} more for complimentary shipping.</>
              ) : (
                <span className="text-saffron-500">Complimentary shipping unlocked.</span>
              )}
            </p>
          </div>

          {/* Coupon */}
          <form onSubmit={applyCoupon} className="mt-8">
            <div
              className="flex items-center gap-3 border-b py-2 transition-colors focus-within:border-saffron-500"
              style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }}
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="min-w-0 flex-1 bg-transparent text-[12px] uppercase tracking-[0.14em] text-ink-100 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-500"
              />
              <button
                type="submit"
                disabled={checking}
                className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-saffron-500 transition-opacity disabled:opacity-40"
              >
                {checking ? 'Checking…' : 'Apply'}
              </button>
            </div>
          </form>

          {coupon && (
            <p
              className="mt-3 text-[11px] leading-relaxed"
              style={{ color: coupon.valid ? 'var(--color-saffron-500)' : 'var(--color-saffron-600)' }}
            >
              {coupon.valid ? `${coupon.code} applied` : coupon.reason}
            </p>
          )}
          <p className="mt-2 text-[10px] leading-relaxed text-ink-600">
            Try WELCOME10, SCHOOL25, SBD200, BULK500 or FREESHIP
          </p>

          {/* Totals */}
          <dl className="mt-9 space-y-3.5 text-[13px]" style={{ borderTop: HAIRLINE, paddingTop: '1.75rem' }}>
            <Row label="Subtotal" value={money(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`− ${money(discount)}`} accent />}
            <Row label="Shipping" value={shipping === 0 ? 'Complimentary' : money(shipping)} />
            <div
              className="flex items-baseline justify-between pt-4"
              style={{ borderTop: HAIRLINE, marginTop: '1.25rem' }}
            >
              <dt className="text-[11px] uppercase tracking-[0.2em] text-ink-400">Total</dt>
              <dd className="display text-[28px] tabular-nums text-saffron-500">{money(total)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="lux-btn mt-9 w-full">
            Proceed to checkout
          </Link>
          <Link
            href="/shop"
            className="mt-4 block text-center text-[10px] uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-saffron-500"
          >
            Continue shopping
          </Link>

          <p className="mt-8 text-[10px] leading-relaxed text-ink-600">
            Taxes calculated at checkout. Dispatched from our Lucknow packing centre within 24 hours.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-ink-400">{label}</dt>
      <dd
        className="tabular-nums"
        style={{ color: accent ? 'var(--color-saffron-500)' : 'var(--color-ink-100)' }}
      >
        {value}
      </dd>
    </div>
  );
}
