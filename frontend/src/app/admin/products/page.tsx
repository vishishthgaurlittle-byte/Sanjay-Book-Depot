'use client';

import { useCallback, useEffect, useState } from 'react';

import AdminNav from '@/components/AdminNav';

import { money } from '@/lib/format';

interface Row {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand_name: string;
  category_name: string;
  mrp: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: number;
  is_bestseller: number;
  is_active: number;
  primary_image: string | null;
}

interface Page {
  products: Row[];
  pagination: { total: number; page: number; pages: number; limit: number };
}

const TOKEN_KEY = 'sbd-admin-token';
const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

export default function AdminProductsPage() {
  const [token, setToken] = useState('');
  const [data, setData] = useState<Page | null>(null);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // Restore the token from a previous session so the panel is not re-entered
  // on every visit. It is never rendered into the HTML.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(
    async (searchQ: string, p: number) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: String(p), limit: '25' });
        if (searchQ) params.set('q', searchQ);
        const res = await fetch(`/api/admin/products?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const body = (await res.json()) as Page & { error?: string };
        if (!res.ok) {
          setError(body.error ?? `HTTP ${res.status}`);
          setData(null);
          return;
        }
        setData(body);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Request failed');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (token) load(q, page);
  }, [token, page, load]); // eslint-disable-line react-hooks/exhaustive-deps

  function saveToken() {
    localStorage.setItem(TOKEN_KEY, token);
    setPage(1);
    load(q, 1);
  }

  async function remove(row: Row) {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/products/${row.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        detail?: string;
        deleted?: { cascaded: { images: number; variants: number; reviews: number } };
      };
      if (!res.ok) {
        setError(body.error ? `${body.error}${body.detail ? ` — ${body.detail}` : ''}` : `HTTP ${res.status}`);
        return;
      }
      const c = body.deleted?.cascaded;
      setNotice(
        `Deleted ${row.sku} — ${c ? `${c.images} images, ${c.variants} variants, ${c.reviews} reviews` : 'row'} removed with it.`,
      );
      setConfirmId(null);
      // Reload; if this was the last row on the page, step back a page.
      const remaining = (data?.pagination.total ?? 1) - 1;
      const maxPage = Math.max(1, Math.ceil(remaining / (data?.pagination.limit ?? 25)));
      const next = Math.min(page, maxPage);
      if (next !== page) setPage(next);
      else load(q, page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleFeatured(row: Row) {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/products/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_featured: row.is_featured !== 1 }),
      });
      if (!res.ok) {
        const b = (await res.json()) as { error?: string };
        setError(b.error ?? `HTTP ${res.status}`);
        return;
      }
      setData((d) =>
        d
          ? {
              ...d,
              products: d.products.map((p) =>
                p.id === row.id ? { ...p, is_featured: row.is_featured === 1 ? 0 : 1 } : p,
              ),
            }
          : d,
      );
      setNotice(`${row.sku} ${row.is_featured === 1 ? 'removed from' : 'added to'} the homepage.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      <AdminNav />
      <header className="border-b pb-10" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
        <p className="eyebrow">Admin · Catalogue</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h1 className="display text-[clamp(2.2rem,5vw,3.5rem)]">Products</h1>
          {data && (
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-500">
              {data.pagination.total} products · page {data.pagination.page} of {data.pagination.pages}
            </p>
          )}
        </div>
      </header>

      {/* ── Auth ───────────────────────────────────────── */}
      <div className="mt-10 max-w-xl">
        <label className="block">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">
            Admin token
          </span>
          <div className="mt-3 flex gap-3">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ADMIN_TOKEN from the server environment"
              className="min-w-0 flex-1 border-b bg-transparent py-2.5 text-[13px] text-ink-100 outline-none transition-colors placeholder:text-ink-600 focus:border-saffron-500"
              style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }}
            />
            <button onClick={saveToken} className="lux-btn-ghost shrink-0 hover:border-saffron-500 hover:text-saffron-500">
              Connect
            </button>
          </div>
        </label>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-600">
          Stored in this browser only. An Insforge session token for an account
          listed in <code>admin_users</code> also works.
        </p>
      </div>

      {error && (
        <p
          className="mt-8 border-l-2 py-2 pl-4 text-[12px] text-ink-200"
          style={{ borderColor: 'var(--color-saffron-600)' }}
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          className="mt-8 border-l-2 py-2 pl-4 text-[12px] text-ink-200"
          style={{ borderColor: 'var(--color-saffron-500)' }}
        >
          {notice}
        </p>
      )}

      {/* ── Search ─────────────────────────────────────── */}
      {data && (
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              load(q, 1);
            }}
            className="flex min-w-[260px] flex-1 items-center gap-3 border-b py-2 transition-colors focus-within:border-saffron-500"
            style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, SKU or brand"
              className="w-full bg-transparent text-[13px] text-ink-100 outline-none placeholder:text-ink-600"
            />
            <button type="submit" className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-saffron-500">
              Search
            </button>
          </form>
          <button
            onClick={() => load(q, page)}
            className="text-[10px] uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-saffron-500"
          >
            Refresh
          </button>
        </div>
      )}

      {loading && (
        <p className="mt-16 text-center text-[11px] uppercase tracking-[0.24em] text-ink-500">
          Loading…
        </p>
      )}

      {/* ── Table ──────────────────────────────────────── */}
      {data && data.products.length > 0 && (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr style={{ borderBottom: HAIRLINE }}>
                {['Product', 'Brand', 'Category', 'Price', 'Stock', 'Homepage', ''].map((h) => (
                  <th
                    key={h}
                    className="py-3 text-left text-[9px] font-medium uppercase tracking-[0.2em] text-ink-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.products.map((row) => (
                <tr key={row.id} style={{ borderBottom: HAIRLINE }}>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-11 w-11 shrink-0 overflow-hidden p-1"
                        style={{
                          border: '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)',
                          background: 'var(--color-ink-900)',
                          borderRadius: 'var(--radius-lux)',
                        }}
                      >
                        {row.primary_image && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={row.primary_image} alt="" className="h-full w-full object-contain" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={`/product/${row.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block max-w-[280px] truncate text-[13px] text-ink-100 transition-colors hover:text-saffron-500"
                        >
                          {row.name}
                        </a>
                        <span className="text-[10px] uppercase tracking-[0.14em] text-ink-600">
                          {row.sku}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[12px] text-ink-300">{row.brand_name}</td>
                  <td className="py-4 pr-4 text-[12px] text-ink-400">{row.category_name}</td>
                  <td className="py-4 pr-4 text-[12px] tabular-nums text-ink-100">
                    {money(row.selling_price)}
                  </td>
                  <td className="py-4 pr-4 text-[12px] tabular-nums">
                    <span
                      style={{
                        color:
                          row.stock_quantity === 0
                            ? 'var(--color-saffron-600)'
                            : row.stock_quantity <= row.low_stock_threshold
                              ? 'var(--color-saffron-500)'
                              : 'var(--color-ink-300)',
                      }}
                    >
                      {row.stock_quantity}
                    </span>
                  </td>
                  <td className="py-4 pr-4">
                    <button
                      onClick={() => toggleFeatured(row)}
                      disabled={busyId === row.id}
                      title={row.is_featured ? 'Remove from homepage' : 'Feature on homepage'}
                      className="text-[16px] leading-none transition-colors disabled:opacity-40"
                      style={{ color: row.is_featured ? 'var(--color-saffron-500)' : 'var(--color-ink-700)' }}
                    >
                      {row.is_featured ? '★' : '☆'}
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    {confirmId === row.id ? (
                      <span className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => remove(row)}
                          disabled={busyId === row.id}
                          className="bg-saffron-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-saffron-on disabled:opacity-40"
                          style={{ borderRadius: 'var(--radius-lux)' }}
                        >
                          {busyId === row.id ? 'Deleting…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === row.id}
                          className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-500 hover:text-ink-100"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmId(row.id);
                          setNotice(null);
                        }}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-ink-500 transition-colors hover:text-saffron-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.products.length === 0 && !loading && (
        <p className="mt-16 text-center text-[13px] text-ink-400">No products match that search.</p>
      )}

      {/* ── Pagination ─────────────────────────────────── */}
      {data && data.pagination.pages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-ink-400 transition-colors hover:text-saffron-500 disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-[11px] tabular-nums text-ink-500">
            {data.pagination.page} / {data.pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.pages, p + 1))}
            disabled={page >= data.pagination.pages}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-ink-400 transition-colors hover:text-saffron-500 disabled:opacity-30"
          >
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
