'use client';

import { useState } from 'react';

import { money, round2 } from '@/lib/format';
import { useCart } from '@/store/cart';

interface Variant {
  id: string;
  sku: string;
  variant_type: string;
  option_value: string;
  price_delta: number;
  stock_quantity: number;
  hex_code: string | null;
}

const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 14%, transparent)';

export default function BuyBox({
  product,
  variants,
}: {
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    brand_name: string;
    mrp: number;
    selling_price: number;
    stock_quantity: number;
    primary_image: string | null;
  };
  variants: Variant[];
}) {
  const add = useCart((s) => s.add);
  const [selected, setSelected] = useState<Variant | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const unitPrice = round2(product.selling_price + (selected?.price_delta ?? 0));
  const stock = selected ? selected.stock_quantity : product.stock_quantity;
  const out = stock <= 0;
  const effectiveDiscount =
    product.mrp > 0 ? Math.max(0, Math.round(((product.mrp - unitPrice) / product.mrp) * 100)) : 0;

  const byType = variants.reduce<Record<string, Variant[]>>((acc, v) => {
    (acc[v.variant_type] ??= []).push(v);
    return acc;
  }, {});

  function onAdd() {
    add(
      {
        productId: product.id,
        sku: selected?.sku ?? product.sku,
        name: product.name,
        slug: product.slug,
        image: product.primary_image,
        brandName: product.brand_name,
        unitPrice: product.selling_price,
        maxStock: stock,
        variant: selected
          ? {
              type: selected.variant_type,
              value: selected.option_value,
              priceDelta: selected.price_delta,
            }
          : null,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div>
      {/* ── Price ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="display text-[40px] leading-none text-ink-50">{money(unitPrice)}</span>
        {product.mrp > unitPrice && (
          <>
            <span className="text-[15px] tabular-nums text-ink-500 line-through">
              {money(product.mrp)}
            </span>
            <span
              className="px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]"
              style={{ background: 'var(--color-saffron-500)', color: 'var(--color-saffron-on)' }}
            >
              {effectiveDiscount}% off
            </span>
          </>
        )}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-ink-500">
        Inclusive of all taxes · SKU {selected?.sku ?? product.sku}
      </p>

      {/* ── Variants ──────────────────────────────────── */}
      {Object.entries(byType).map(([type, options]) => (
        <div key={type} className="mt-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">
            {type}
            {selected?.variant_type === type && (
              <span className="ml-3 normal-case tracking-normal text-saffron-500">
                {selected.option_value}
              </span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {options.map((v) => {
              const active = selected?.id === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={v.stock_quantity <= 0}
                  onClick={() => {
                    setSelected(active ? null : v);
                    setQty(1);
                  }}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-35"
                  style={{
                    border: '1px solid',
                    borderRadius: 'var(--radius-lux)',
                    borderColor: active
                      ? 'var(--color-saffron-500)'
                      : 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)',
                    color: active ? 'var(--color-saffron-500)' : 'var(--color-ink-200)',
                    backgroundColor: active
                      ? 'color-mix(in oklab, var(--color-saffron-500) 12%, transparent)'
                      : 'transparent',
                  }}
                >
                  {v.hex_code && (
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{
                        backgroundColor: v.hex_code,
                        border: '1px solid color-mix(in oklab, var(--color-ink-50) 22%, transparent)',
                      }}
                    />
                  )}
                  {v.option_value}
                  {v.price_delta !== 0 && (
                    <span className="text-[11px] tabular-nums text-ink-500">
                      {v.price_delta > 0 ? '+' : '−'}
                      {money(Math.abs(v.price_delta))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── Quantity ──────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center gap-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">
          Quantity
        </p>
        <div
          className="flex items-center"
          style={{ border: `1px solid`, borderRadius: 'var(--radius-lux)', borderColor: 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)' }}
        >
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-ink-400 transition-colors hover:text-ink-50"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-[13px] tabular-nums text-ink-50">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stock || 1, q + 1))}
            className="px-4 py-2 text-ink-400 transition-colors hover:text-ink-50"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <span
          className="text-[10px] uppercase tracking-[0.16em]"
          style={{
            color: out
              ? 'var(--color-saffron-600)'
              : stock <= 10
                ? 'var(--color-saffron-600)'
                : 'var(--color-ink-500)',
          }}
        >
          {out ? 'Out of stock' : `${stock} in stock`}
        </span>
      </div>

      {/* ── Actions ───────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={out} onClick={onAdd} className="lux-btn flex-1">
          {added ? 'Added to cart ✓' : out ? 'Out of stock' : 'Add to cart'}
        </button>
        <button
          type="button"
          disabled={out}
          onClick={() => {
            onAdd();
            window.location.href = '/cart';
          }}
          className="lux-btn-ghost flex-1 hover:border-saffron-500 hover:text-saffron-500"
        >
          Buy now
        </button>
      </div>

      {/* ── Reassurance ───────────────────────────────── */}
      <ul className="mt-10 space-y-2.5" style={{ borderTop: HAIRLINE, paddingTop: '1.75rem' }}>
        {[
          'Complimentary shipping above ₹499',
          'GST invoice included',
          'Seven-day replacement on damaged goods',
        ].map((line) => (
          <li key={line} className="flex items-center gap-3 text-[11px] text-ink-400">
            <span className="h-px w-3.5 bg-saffron-500" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
