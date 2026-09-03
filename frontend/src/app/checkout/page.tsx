'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getToken, currentUser } from '@/lib/auth-client';
import { useCart } from '@/store/cart';

const FREE_OVER = 499;
const SHIP = 49;
const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const FIELDS: { key: string; label: string; half?: boolean; type?: string }[] = [
  { key: 'fullName', label: 'Full name', half: true },
  { key: 'phone', label: 'Phone', half: true, type: 'tel' },
  { key: 'line1', label: 'Address (house, street)' },
  { key: 'line2', label: 'Area / landmark (optional)' },
  { key: 'city', label: 'City', half: true },
  { key: 'pincode', label: 'PIN code', half: true },
  { key: 'state', label: 'State' },
];

type PayCfg = {
  cod: boolean; upi: boolean; bank: boolean;
  upiId: string; upiName: string; bankName: string; bankHolder: string;
  bankAccount: string; bankIfsc: string; qrDataUrl: string | null; note: string;
};

/** Read + downscale an uploaded payment screenshot into a JPEG data URL. */
function fileToDataUrl(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) return reject(new Error('canvas'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = reject;
      img.src = String(fr.result);
    };
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ state: 'Uttar Pradesh' });
  const [payment, setPayment] = useState<'cod' | 'upi' | 'bank'>('cod');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payCfg, setPayCfg] = useState<PayCfg | null>(null);
  const [proof, setProof] = useState<string | null>(null);

  useEffect(() => {
    currentUser().then((u) => {
      if (!u) router.replace('/login?next=/checkout');
      else setReady(true);
    });
    fetch('/api/payments')
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c) {
          setPayCfg(c);
          setPayment(c.cod ? 'cod' : c.upi ? 'upi' : 'bank');
        }
      })
      .catch(() => {});
  }, [router]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0), [lines]);
  const shipping = lines.length === 0 || subtotal >= FREE_OVER ? 0 : SHIP;
  const total = subtotal + shipping;

  const en = { cod: payCfg?.cod ?? true, upi: payCfg?.upi ?? true, bank: payCfg?.bank ?? true };
  const payMethods = (
    [
      en.cod && { id: 'cod' as const, title: 'Cash on Delivery', desc: 'Pay when your order arrives.' },
      en.upi && { id: 'upi' as const, title: 'UPI', desc: 'Pay via any UPI app, then upload the payment screenshot.' },
      en.bank && { id: 'bank' as const, title: 'Bank Transfer', desc: 'NEFT / IMPS to our account, then upload the payment screenshot.' },
    ] as ({ id: 'cod' | 'upi' | 'bank'; title: string; desc: string } | false)[]
  ).filter((x): x is { id: 'cod' | 'upi' | 'bank'; title: string; desc: string } => Boolean(x));

  async function onProof(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setProof(await fileToDataUrl(f));
      setError(null);
    } catch {
      setError('Could not read that image. Try another screenshot.');
    }
  }

  async function placeOrder() {
    setError(null);
    const token = getToken();
    if (!token) {
      router.replace('/login?next=/checkout');
      return;
    }
    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          address: form,
          paymentMethod: payment,
          paymentProof: payment === 'cod' ? null : proof,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.order) {
        setError(json.error || 'Could not place the order.');
        setPlacing(false);
        return;
      }
      clear();
      router.replace(`/order/${json.order.id}?placed=1`);
    } catch {
      setError('Something went wrong. Please try again.');
      setPlacing(false);
    }
  }

  if (!ready) {
    return <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center text-[11px] uppercase tracking-[0.24em] text-ink-500">Loading checkout…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="display text-[clamp(1.8rem,5vw,2.6rem)]">Your cart is empty</h1>
        <p className="mt-4 text-[13px] text-ink-500">Add a few things before checking out.</p>
        <Link href="/shop" className="lux-btn-gold mt-8">Browse products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <p className="lux-eyebrow">Checkout</p>
      <h1 className="display mt-3 text-[clamp(2rem,5vw,3rem)]">Complete your order</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: address + payment */}
        <div className="space-y-8">
          <section className="rounded-[var(--radius-lux)] border p-6 sm:p-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
            <h2 className="display text-[20px]">Shipping address</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <label key={f.key} className={f.half ? 'block' : 'block sm:col-span-2'}>
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.16em] text-ink-500">{f.label}</span>
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-xl border bg-transparent px-4 py-3 text-[14px] outline-none transition-colors focus:border-saffron-500"
                    style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 16%, transparent)' }}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-[var(--radius-lux)] border p-6 sm:p-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
            <h2 className="display text-[20px]">Payment method</h2>
            <div className="mt-5 space-y-3">
              {payMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPayment(m.id)}
                  className="flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors"
                  style={{ borderColor: payment === m.id ? 'var(--color-saffron-500)' : 'color-mix(in oklab, var(--color-ink-50) 14%, transparent)' }}
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border" style={{ borderColor: payment === m.id ? 'var(--color-saffron-500)' : 'color-mix(in oklab, var(--color-ink-50) 30%, transparent)' }}>
                    {payment === m.id && <span className="h-2.5 w-2.5 rounded-full bg-saffron-500" />}
                  </span>
                  <span>
                    <span className="block text-[14px] font-medium">{m.title}</span>
                    <span className="mt-0.5 block text-[12px] text-ink-500">{m.desc}</span>
                  </span>
                </button>
              ))}
            </div>

            {payment !== 'cod' && payCfg && (
              <div className="mt-6 rounded-xl border p-5" style={{ borderColor: 'color-mix(in oklab, var(--color-saffron-500) 30%, transparent)', background: 'color-mix(in oklab, var(--color-saffron-500) 6%, transparent)' }}>
                {payment === 'upi' && payCfg.qrDataUrl && (
                  <div className="flex items-start gap-5">
                    <img src={payCfg.qrDataUrl} alt="UPI QR code" className="h-36 w-36 shrink-0 rounded-lg bg-white p-2" />
                    <div className="text-[13px]">
                      <p className="font-medium">Scan &amp; pay via UPI</p>
                      <p className="mt-1 text-ink-400">{payCfg.upiName}</p>
                      <p className="mt-0.5 font-mono text-saffron-500">{payCfg.upiId}</p>
                    </div>
                  </div>
                )}
                {payment === 'bank' && (
                  <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
                    <div><dt className="text-[10px] uppercase tracking-[0.14em] text-ink-500">Account name</dt><dd className="mt-0.5">{payCfg.bankHolder}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.14em] text-ink-500">Bank</dt><dd className="mt-0.5">{payCfg.bankName}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.14em] text-ink-500">Account no.</dt><dd className="mt-0.5 font-mono">{payCfg.bankAccount}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-[0.14em] text-ink-500">IFSC</dt><dd className="mt-0.5 font-mono">{payCfg.bankIfsc}</dd></div>
                  </dl>
                )}
                <p className="mt-4 text-[12px] leading-relaxed text-ink-400">{payCfg.note}</p>
                <label className="mt-4 inline-block cursor-pointer">
                  <span className="lux-btn-ghost inline-block">{proof ? 'Replace screenshot' : 'Upload payment screenshot'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onProof} />
                </label>
                {proof && <p className="mt-2 text-[12px] text-saffron-500">Payment screenshot attached ✓</p>}
              </div>
            )}
          </section>
        </div>

        {/* Right: summary */}
        <aside className="h-fit rounded-[var(--radius-lux)] border p-6 sm:p-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
          <h2 className="display text-[20px]">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {lines.map((l) => (
              <li key={`${l.productId}-${l.variant?.value ?? ''}`} className="flex gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
                  {l.image ? <img src={l.image} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-ink-500">SBD</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px]">{l.name}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-500">Qty {l.quantity}</span>
                </span>
                <span className="text-[13px]">{rupees(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t pt-5 text-[13px]" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
            <div className="flex justify-between"><dt className="text-ink-500">Subtotal</dt><dd>{rupees(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-500">Shipping</dt><dd>{shipping === 0 ? 'Free' : rupees(shipping)}</dd></div>
            <div className="flex justify-between pt-2 text-[16px] font-medium"><dt>Total</dt><dd className="text-saffron-500">{rupees(total)}</dd></div>
          </dl>
          {subtotal < FREE_OVER && <p className="mt-3 text-[11px] text-ink-500">Add {rupees(FREE_OVER - subtotal)} more for free shipping.</p>}
          {error && <p className="mt-4 text-[12px] text-saffron-600">{error}</p>}
          <button onClick={placeOrder} disabled={placing} className="lux-btn-gold mt-6 w-full disabled:opacity-50">
            {placing ? 'Placing order…' : `Place order · ${rupees(total)}`}
          </button>
          <p className="mt-3 text-center text-[11px] text-ink-500">By placing this order you agree to our terms.</p>
        </aside>
      </div>
    </div>
  );
}
