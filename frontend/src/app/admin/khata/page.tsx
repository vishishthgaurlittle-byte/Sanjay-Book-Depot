'use client';

import { useCallback, useEffect, useState } from 'react';

import AdminNav from '@/components/AdminNav';
import { money } from '@/lib/format';

const TOKEN_KEY = 'sbd-admin-token';
const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

interface Party {
  id: string; name: string; phone: string | null; opening_balance: number;
  balance: number; last_entry: string | null; is_active: number;
}
interface Txn {
  id: string; type: 'credit' | 'debit'; amount: number; note: string | null;
  reference: string | null; entry_date: string;
}
interface Summary {
  toCollect: number; toPay: number; net: number; parties: number;
  entries: number; totalSales: number; totalPayments: number;
}

export default function AdminKhataPage() {
  const [token, setToken] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [parties, setParties] = useState<Party[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ party: Party; transactions: Txn[] } | null>(null);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // new-party form
  const [np, setNp] = useState({ name: '', phone: '', opening_balance: '' });
  // new-entry form
  const [ne, setNe] = useState({ type: 'credit' as 'credit' | 'debit', amount: '', note: '', entry_date: new Date().toISOString().slice(0, 10) });

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const auth = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadSummary = useCallback(async () => {
    if (!token) return;
    const r = await fetch('/api/admin/khata/summary', { headers: auth(), cache: 'no-store' });
    if (r.ok) setSummary(await r.json());
  }, [token, auth]);

  const loadParties = useCallback(async (search = '') => {
    if (!token) return;
    const r = await fetch(`/api/admin/khata/parties${search ? `?q=${encodeURIComponent(search)}` : ''}`, { headers: auth(), cache: 'no-store' });
    const b = await r.json();
    if (r.ok) setParties(b.parties);
    else setError(b.error ?? `HTTP ${r.status}`);
  }, [token, auth]);

  const loadDetail = useCallback(async (id: string) => {
    if (!token) return;
    const r = await fetch(`/api/admin/khata/parties/${id}`, { headers: auth(), cache: 'no-store' });
    if (r.ok) setDetail(await r.json());
  }, [token, auth]);

  useEffect(() => { if (token) { loadSummary(); loadParties(); } }, [token, loadSummary, loadParties]);
  useEffect(() => { if (selected) loadDetail(selected); }, [selected, loadDetail]);

  function saveToken() { localStorage.setItem(TOKEN_KEY, token); loadSummary(); loadParties(); }

  async function addParty(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setNotice(null);
    const r = await fetch('/api/admin/khata/parties', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ name: np.name, phone: np.phone, opening_balance: Number(np.opening_balance) || 0 }),
    });
    const b = await r.json();
    if (!r.ok) { setError(b.error ?? 'Could not add party'); return; }
    setNp({ name: '', phone: '', opening_balance: '' });
    setNotice(`Added ${np.name} to the khata.`);
    await loadParties(q); await loadSummary();
  }

  async function addTxn(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null); setNotice(null);
    const r = await fetch(`/api/admin/khata/parties/${selected}/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...auth() },
      body: JSON.stringify({ type: ne.type, amount: Number(ne.amount), note: ne.note, entry_date: ne.entry_date }),
    });
    const b = await r.json();
    if (!r.ok) { setError(b.error ?? 'Could not add entry'); return; }
    setNe({ ...ne, amount: '', note: '' });
    setNotice(ne.type === 'credit' ? 'Recorded a sale (You Gave).' : 'Recorded a payment (You Got).');
    await loadDetail(selected); await loadParties(q); await loadSummary();
  }

  async function delTxn(id: string) {
    if (!selected) return;
    await fetch(`/api/admin/khata/transactions/${id}`, { method: 'DELETE', headers: auth() });
    await loadDetail(selected); await loadParties(q); await loadSummary();
  }

  async function delParty(id: string, name: string) {
    if (!confirm(`Delete ${name} and all their entries?`)) return;
    await fetch(`/api/admin/khata/parties/${id}`, { method: 'DELETE', headers: auth() });
    if (selected === id) { setSelected(null); setDetail(null); }
    await loadParties(q); await loadSummary();
  }

  const balColor = (b: number) => b > 0 ? 'var(--color-saffron-600)' : b < 0 ? 'var(--color-saffron-500)' : 'var(--color-ink-400)';

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      <AdminNav />
      <header className="border-b pb-10" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
        <p className="eyebrow">Admin · Khata Book</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.5rem)]">Sales &amp; Payments Ledger</h1>
      </header>

      {/* Auth */}
      <div className="mt-10 max-w-xl">
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">Admin token</span>
        <div className="mt-3 flex gap-3">
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN" className="min-w-0 flex-1 border-b bg-transparent py-2.5 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500"
            style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
          <button onClick={saveToken} className="lux-btn-ghost shrink-0 hover:border-saffron-500 hover:text-saffron-500">Connect</button>
        </div>
      </div>

      {error && <p className="mt-6 border-l-2 py-2 pl-4 text-[12px] text-ink-200" style={{ borderColor: 'var(--color-saffron-600)' }} role="alert">{error}</p>}
      {notice && <p className="mt-6 border-l-2 py-2 pl-4 text-[12px] text-ink-200" style={{ borderColor: 'var(--color-saffron-500)' }}>{notice}</p>}

      {summary && (
        <>
          {/* Summary cards */}
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'To Collect', value: summary.toCollect, tone: 'var(--color-saffron-600)' },
              { label: 'To Pay', value: summary.toPay, tone: 'var(--color-saffron-500)' },
              { label: 'Total Sales', value: summary.totalSales, tone: 'var(--color-ink-100)' },
              { label: 'Total Payments', value: summary.totalPayments, tone: 'var(--color-ink-100)' },
            ].map((c) => (
              <div key={c.label} className="p-5" style={{ border: HAIRLINE, borderRadius: 'var(--radius-lux)' }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">{c.label}</p>
                <p className="mt-2 text-[clamp(1.3rem,3vw,1.9rem)] tabular-nums" style={{ color: c.tone }}>{money(c.value)}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-ink-600">{summary.parties} parties · {summary.entries} entries</p>

          <div className="mt-10 grid gap-10 lg:grid-cols-[380px_1fr]">
            {/* Left: add party + list */}
            <div>
              <form onSubmit={addParty} className="p-5" style={{ border: HAIRLINE, borderRadius: 'var(--radius-lux)' }}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">Add party</p>
                <input value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="Name *" required
                  className="mt-3 w-full border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
                <input value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} placeholder="Phone"
                  className="mt-3 w-full border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
                <input value={np.opening_balance} onChange={(e) => setNp({ ...np, opening_balance: e.target.value })} placeholder="Opening balance (₹, +ve = they owe)" type="number" step="0.01"
                  className="mt-3 w-full border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
                <button className="lux-btn-ghost mt-4 w-full hover:border-saffron-500 hover:text-saffron-500">Add party</button>
              </form>

              <form onSubmit={(e) => { e.preventDefault(); loadParties(q); }} className="mt-6">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search parties…"
                  className="w-full border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
              </form>

              <div className="mt-4">
                {parties.map((p) => (
                  <div key={p.id} onClick={() => setSelected(p.id)}
                    className="flex cursor-pointer items-center justify-between gap-3 py-3 transition-colors hover:text-saffron-500"
                    style={{ borderBottom: HAIRLINE, color: selected === p.id ? 'var(--color-saffron-500)' : undefined }}>
                    <div className="min-w-0">
                      <p className="truncate text-[13px]">{p.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-600">{p.phone || '—'}</p>
                    </div>
                    <p className="shrink-0 text-[13px] tabular-nums" style={{ color: balColor(p.balance) }}>{money(p.balance)}</p>
                  </div>
                ))}
                {parties.length === 0 && <p className="py-6 text-center text-[12px] text-ink-500">No parties yet.</p>}
              </div>
            </div>

            {/* Right: ledger */}
            <div>
              {detail ? (
                <>
                  <div className="flex items-end justify-between gap-4 border-b pb-4" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
                    <div>
                      <h2 className="display text-[clamp(1.4rem,3vw,2rem)]">{detail.party.name}</h2>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ink-500">{detail.party.phone || 'no phone'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-ink-500">Balance</p>
                      <p className="text-[clamp(1.3rem,3vw,1.8rem)] tabular-nums" style={{ color: balColor(detail.party.balance) }}>{money(detail.party.balance)}</p>
                    </div>
                  </div>

                  {/* Add entry */}
                  <form onSubmit={addTxn} className="mt-6 grid gap-3 sm:grid-cols-[110px_1fr_1fr_140px_auto]">
                    <select value={ne.type} onChange={(e) => setNe({ ...ne, type: e.target.value as 'credit' | 'debit' })}
                      className="border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }}>
                      <option value="credit">You Gave</option>
                      <option value="debit">You Got</option>
                    </select>
                    <input value={ne.amount} onChange={(e) => setNe({ ...ne, amount: e.target.value })} placeholder="Amount ₹ *" type="number" step="0.01" required
                      className="border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
                    <input value={ne.note} onChange={(e) => setNe({ ...ne, note: e.target.value })} placeholder="Note / item"
                      className="border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-600 focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
                    <input value={ne.entry_date} onChange={(e) => setNe({ ...ne, entry_date: e.target.value })} type="date"
                      className="border-b bg-transparent py-2 text-[13px] text-ink-100 outline-none focus:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }} />
                    <button className="lux-btn-ghost hover:border-saffron-500 hover:text-saffron-500">Add</button>
                  </form>

                  {/* Entries */}
                  <div className="mt-6">
                    {detail.transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between gap-3 py-3" style={{ borderBottom: HAIRLINE }}>
                        <div className="min-w-0">
                          <p className="text-[13px] text-ink-100">{t.note || (t.type === 'credit' ? 'Sale' : 'Payment')}</p>
                          <p className="text-[10px] uppercase tracking-[0.14em] text-ink-600">{t.entry_date} · {t.type === 'credit' ? 'You Gave' : 'You Got'}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-[13px] tabular-nums" style={{ color: t.type === 'credit' ? 'var(--color-saffron-600)' : 'var(--color-saffron-500)' }}>
                            {t.type === 'credit' ? '+' : '−'}{money(t.amount)}
                          </span>
                          <button onClick={() => delTxn(t.id)} className="text-[10px] uppercase tracking-[0.14em] text-ink-600 hover:text-saffron-600">Del</button>
                        </div>
                      </div>
                    ))}
                    {detail.transactions.length === 0 && <p className="py-6 text-center text-[12px] text-ink-500">No entries yet. Add the first one above.</p>}
                  </div>

                  <button onClick={() => delParty(detail.party.id, detail.party.name)} className="mt-6 text-[10px] uppercase tracking-[0.16em] text-ink-600 hover:text-saffron-600">Delete this party</button>
                </>
              ) : (
                <p className="py-20 text-center text-[13px] text-ink-500">Select a party to open their ledger.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
