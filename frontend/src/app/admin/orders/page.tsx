'use client';

import { useCallback, useEffect, useState } from 'react';

import AdminNav from '@/components/AdminNav';

const TOKEN_KEY = 'sbd-admin-token';
const rupees = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

type Order = {
  id: string; order_number: string; status: string; payment_status: string; payment_method: string;
  total: number; shipping_address: string; placed_at: string;
  customer_email: string | null; customer_name: string | null; item_count: number; has_proof: number;
  items?: { product_name: string; quantity: number; unit_price: number; total_price: number; image_url: string | null }[];
  payment_proof?: string | null;
};

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const PAY = ['unpaid', 'paid', 'refunded', 'failed'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sel, setSel] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  const load = useCallback(() => {
    if (!token) return;
    fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => setOrders(j.orders || []))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(load, [load]);

  async function open(o: Order) {
    if (!token) return;
    const r = await fetch(`/api/admin/orders/${o.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const j = await r.json();
    setSel(j.order ?? null);
  }

  async function update(patch: { status?: string; payment_status?: string }) {
    if (!token || !sel) return;
    const r = await fetch(`/api/admin/orders/${sel.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    const j = await r.json();
    if (r.ok) {
      setSel({ ...sel, ...j.order });
      setMsg('Updated ✓');
      setTimeout(() => setMsg(null), 1500);
      load();
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
        <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Customer Orders</h1>
        <p className="mt-2 text-[13px] text-ink-500">Every order placed on the store, with payment proof.</p>

        {loading ? (
          <p className="mt-10 text-[13px] text-ink-500">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="mt-10 text-[13px] text-ink-500">No orders yet. They&apos;ll appear here as customers buy.</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-[var(--radius-lux)] border" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b text-[10px] uppercase tracking-[0.16em] text-ink-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
                  <th className="px-4 py-3">Order</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Proof</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} onClick={() => open(o)} className="cursor-pointer border-b transition-colors hover:bg-saffron-500/5" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}>
                    <td className="px-4 py-3 font-medium">{o.order_number}<span className="block text-[11px] text-ink-500">{new Date(o.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></td>
                    <td className="px-4 py-3">{o.customer_name || o.customer_email || '—'}</td>
                    <td className="px-4 py-3">{o.item_count}</td>
                    <td className="px-4 py-3 text-saffron-500">{rupees(o.total)}</td>
                    <td className="px-4 py-3 uppercase">{o.payment_method} · {o.payment_status}</td>
                    <td className="px-4 py-3">{o.status}</td>
                    <td className="px-4 py-3">{Number(o.has_proof) ? '📄' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sel && (
          <section className="mt-8 rounded-[var(--radius-lux)] border p-6" style={{ borderColor: 'color-mix(in oklab, var(--color-saffron-500) 30%, transparent)' }}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="display text-[20px]">{sel.order_number}</h2>
              {msg && <span className="text-[12px] text-saffron-500">{msg}</span>}
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Items</h3>
                <ul className="mt-3 space-y-3">
                  {(sel.items || []).map((it, i) => (
                    <li key={i} className="flex justify-between gap-4 text-[13px]">
                      <span>{it.product_name} × {it.quantity}</span>
                      <span>{rupees(it.total_price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[12px] leading-relaxed text-ink-500">{sel.shipping_address}</p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Order status</span>
                  <select value={sel.status} onChange={(e) => update({ status: e.target.value })} className="mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] outline-none" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)' }}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Payment status</span>
                  <select value={sel.payment_status} onChange={(e) => update({ payment_status: e.target.value })} className="mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] outline-none" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)' }}>
                    {PAY.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                {sel.payment_proof ? (
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Payment screenshot</h3>
                    <img src={sel.payment_proof} alt="Payment proof" className="mt-2 max-h-72 rounded-lg border" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)' }} />
                  </div>
                ) : (
                  <p className="text-[12px] text-ink-500">No payment screenshot uploaded.</p>
                )}
              </div>
            </div>

            <button onClick={() => setSel(null)} className="lux-btn-ghost mt-6 hover:border-saffron-500 hover:text-saffron-500">Close</button>
          </section>
        )}
      </main>
    </div>
  );
}
