'use client';

import { useEffect, useState } from 'react';

import AdminNav from '@/components/AdminNav';

const TOKEN_KEY = 'sbd-admin-token';

type Cfg = {
  cod: boolean; upi: boolean; bank: boolean;
  upiId: string; upiName: string; bankName: string; bankHolder: string;
  bankAccount: string; bankIfsc: string; qrDataUrl: string | null; note: string;
};

function qrFromFile(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export default function AdminPaymentsPage() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => {});
  }, [token]);

  const set = <K extends keyof Cfg>(k: K, v: Cfg[K]) => setCfg((c) => (c ? { ...c, [k]: v } : c));

  async function save() {
    if (!token || !cfg) return;
    const r = await fetch('/api/admin/payments', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cfg),
    });
    if (r.ok) {
      setMsg('Saved ✓ Live on checkout now.');
      setTimeout(() => setMsg(null), 2000);
    }
  }

  if (!cfg) return <div className="min-h-screen"><AdminNav /><main className="px-6 py-10 text-[13px] text-ink-500">Loading payment settings…</main></div>;

  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">Payment Settings</h1>
        <p className="mt-2 text-[13px] text-ink-500">Turn methods on/off and manage your UPI QR &amp; bank details.</p>

        {/* Toggles */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {([['cod', 'Cash on Delivery'], ['upi', 'UPI (QR)'], ['bank', 'Bank Transfer']] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => set(k, !cfg[k])}
              className="flex items-center justify-between rounded-xl border p-4 text-left"
              style={{ borderColor: cfg[k] ? 'var(--color-saffron-500)' : 'color-mix(in oklab, var(--color-ink-50) 14%, transparent)' }}
            >
              <span className="text-[13px] font-medium">{label}</span>
              <span className="relative h-6 w-11 rounded-full" style={{ background: cfg[k] ? 'var(--color-saffron-500)' : 'color-mix(in oklab, var(--color-ink-50) 25%, transparent)' }}>
                <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: cfg[k] ? '22px' : '2px' }} />
              </span>
            </button>
          ))}
        </section>

        {/* UPI */}
        <section className="mt-8 rounded-[var(--radius-lux)] border p-6" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
          <h2 className="display text-[18px]">UPI</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="UPI ID" value={cfg.upiId} onChange={(v) => set('upiId', v)} />
            <Field label="Account name" value={cfg.upiName} onChange={(v) => set('upiName', v)} />
          </div>
          <div className="mt-5 flex items-start gap-5">
            {cfg.qrDataUrl && <img src={cfg.qrDataUrl} alt="UPI QR" className="h-40 w-40 rounded-lg bg-white p-2" />}
            <div>
              <label className="lux-btn-ghost inline-block cursor-pointer">
                Upload QR image
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set('qrDataUrl', await qrFromFile(f)); }} />
              </label>
              <p className="mt-2 max-w-xs text-[11px] text-ink-500">Shown to customers when they choose UPI. They must upload a payment screenshot after paying.</p>
            </div>
          </div>
        </section>

        {/* Bank */}
        <section className="mt-6 rounded-[var(--radius-lux)] border p-6" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
          <h2 className="display text-[18px]">Bank account</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Account holder" value={cfg.bankHolder} onChange={(v) => set('bankHolder', v)} />
            <Field label="Bank name" value={cfg.bankName} onChange={(v) => set('bankName', v)} />
            <Field label="Account number" value={cfg.bankAccount} onChange={(v) => set('bankAccount', v)} />
            <Field label="IFSC" value={cfg.bankIfsc} onChange={(v) => set('bankIfsc', v)} />
          </div>
        </section>

        <section className="mt-6 rounded-[var(--radius-lux)] border p-6" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
          <Field label="Instruction shown to customers" value={cfg.note} onChange={(v) => set('note', v)} />
        </section>

        <div className="mt-8 flex items-center gap-4">
          <button onClick={save} className="lux-btn-gold">Save payments</button>
          {msg && <span className="text-[13px] text-saffron-500">{msg}</span>}
        </div>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.16em] text-ink-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-4 py-2.5 text-[13px] outline-none focus:border-saffron-500"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)' }}
      />
    </label>
  );
}
