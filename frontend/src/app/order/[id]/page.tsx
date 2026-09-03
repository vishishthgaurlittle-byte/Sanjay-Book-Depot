'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

import { getToken } from '@/lib/auth-client';

const rupees = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

type Item = { product_name: string; brand_name: string | null; image_url: string | null; quantity: number; unit_price: number; total_price: number };
type Order = { id: string; order_number: string; status: string; payment_method: string; payment_status: string; subtotal: number; shipping_fee: number; total: number; shipping_address: string; placed_at: string; items: Item[] };

export default function OrderPage() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const placed = search.get('placed') === '1';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('Please sign in to view this order.');
      setLoading(false);
      return;
    }
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        const found = (j.orders || []).find((o: Order) => o.id === params.id) || null;
        setOrder(found);
        if (!found) setError('Order not found.');
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load the order.');
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center text-[11px] uppercase tracking-[0.24em] text-ink-500">Loading order…</div>;

  if (error || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="display text-[clamp(1.6rem,4vw,2.2rem)]">{error || 'Order not found'}</h1>
        <Link href="/account" className="lux-btn-ghost mt-8 hover:border-saffron-500 hover:text-saffron-500">Back to account</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[820px] px-4 py-10 sm:px-6 lg:px-10">
      {placed && (
        <div className="mb-8 rounded-[var(--radius-lux)] border p-6 text-center" style={{ borderColor: 'color-mix(in oklab, var(--color-saffron-500) 40%, transparent)', background: 'color-mix(in oklab, var(--color-saffron-500) 8%, transparent)' }}>
          <p className="display text-[clamp(1.5rem,4vw,2rem)]">Thank you — order placed! 🎉</p>
          <p className="mt-2 text-[13px] text-ink-400">We&apos;ve emailed the details. You can track it any time from your account.</p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lux-eyebrow">Order</p>
          <h1 className="display mt-2 text-[clamp(1.6rem,4vw,2.2rem)]">{order.order_number}</h1>
        </div>
        <span className="lux-pill text-[10px] uppercase tracking-[0.16em]">{order.status}</span>
      </div>

      <section className="mt-8 rounded-[var(--radius-lux)] border p-6 sm:p-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
        <ul className="space-y-5">
          {order.items.map((it, i) => (
            <li key={i} className="flex gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
                {it.image_url ? <img src={it.image_url} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-ink-500">SBD</span>}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px]">{it.product_name}</span>
                {it.brand_name && <span className="mt-0.5 block text-[12px] text-ink-500">{it.brand_name}</span>}
                <span className="mt-1 block text-[12px] text-ink-500">Qty {it.quantity} × {rupees(it.unit_price)}</span>
              </span>
              <span className="text-[14px]">{rupees(it.total_price)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t pt-5 text-[13px]" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
          <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{rupees(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{Number(order.shipping_fee) === 0 ? 'Free' : rupees(order.shipping_fee)}</dd></div>
          <div className="flex justify-between pt-2 text-[16px] font-medium"><dt>Total</dt><dd className="text-saffron-500">{rupees(order.total)}</dd></div>
          <div className="flex justify-between pt-1"><dt className="text-ink-500">Payment</dt><dd className="uppercase">{order.payment_method} · {order.payment_status}</dd></div>
        </dl>
      </section>

      <section className="mt-6 rounded-[var(--radius-lux)] border p-6 sm:p-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
        <h2 className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Shipping to</h2>
        <p className="mt-3 text-[13px] leading-relaxed">{order.shipping_address}</p>
      </section>

      <div className="mt-8 flex gap-4">
        <Link href="/account" className="lux-btn-ghost hover:border-saffron-500 hover:text-saffron-500">My account</Link>
        <Link href="/shop" className="lux-btn-gold">Continue shopping</Link>
      </div>
    </div>
  );
}
