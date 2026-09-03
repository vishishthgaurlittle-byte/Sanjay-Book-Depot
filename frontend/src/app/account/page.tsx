'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { currentUser, logout, getToken, type SessionUser } from '@/lib/auth-client';
import { useCart } from '@/store/cart';

type Order = { id: string; order_number: string; status: string; total: number; placed_at: string; items: { product_name: string; quantity: number }[] };
type Address = { id: string; label: string; full_name: string; phone: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; is_default_shipping: number };
const rupees = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

type Section = 'profile' | 'orders' | 'addresses' | 'wishlist' | 'security';

const NAV: { id: Section; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6' },
  { id: 'orders', label: 'Your Orders', icon: 'M3 7h18M3 7l2 12h14l2-12M3 7l1-3h16l1 3M9 11h6' },
  { id: 'addresses', label: 'Addresses', icon: 'M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11zM12 10a2 2 0 100-4 2 2 0 000 4z' },
  { id: 'wishlist', label: 'Wishlist', icon: 'M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z' },
  { id: 'security', label: 'Security', icon: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [section, setSection] = useState<Section>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const token = getToken();
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    fetch('/api/orders', { headers: h }).then((r) => r.json()).then((j) => setOrders(j.orders || [])).catch(() => {});
    fetch('/api/addresses', { headers: h }).then((r) => r.json()).then((j) => setAddresses(j.addresses || [])).catch(() => {});
    fetch('/api/account/is-admin', { headers: h })
      .then((r) => r.json())
      .then((j) => {
        setIsAdmin(!!j.isAdmin);
        setAdminName(j.name ?? null);
        setAdminRole(j.role ?? null);
      })
      .catch(() => {});
  }, [ready]);

  useEffect(() => {
    currentUser()
      .then((u) => {
        if (!u) {
          router.replace('/login?next=/account');
          return;
        }
        setUser(u);
        setReady(true);
      })
      .catch(() => router.replace('/login?next=/account'));
  }, [router]);

  async function signOut() {
    await logout();
    useCart.getState().clear();
    router.replace('/');
    router.refresh();
  }

  async function openAdmin() {
    const token = getToken();
    if (!token) return router.push('/admin/login');
    const res = await fetch('/api/account/admin-session', { headers: { Authorization: `Bearer ${token}` } });
    const j = (await res.json().catch(() => null)) as { token?: string } | null;
    if (res.ok && j?.token) {
      localStorage.setItem('sbd-admin-token', j.token);
      router.push('/admin');
    } else {
      router.push('/admin/login');
    }
  }

  if (!ready || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center">
        <p className="text-[11px] uppercase tracking-[0.24em] text-ink-500">Loading your account…</p>
      </div>
    );
  }

  const prettyEmail = (user.email || '').split('@')[0].replace(/[._\d]+/g, ' ').trim();
  const displayName =
    user.name || adminName || (prettyEmail ? prettyEmail.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Customer');
  const firstName = displayName.split(' ')[0] || 'there';
  const initial = (displayName || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
      <p className="lux-eyebrow">My Account</p>
      <h1 className="display mt-3 text-[clamp(2rem,5vw,3rem)]">Hello, {firstName}</h1>

      <div className="mt-10 grid gap-8 lg:grid-cols-[248px_1fr]">
        {/* Sidebar */}
        <aside className="h-fit rounded-[var(--radius-lux)] border p-2" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
          <div className="mb-2 flex items-center gap-3 px-3 py-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-saffron-500 text-[16px] font-semibold text-saffron-on">{initial}</span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="block truncate text-[13px] font-medium">{displayName}</span>
                {isAdmin && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]"
                    style={{ background: 'color-mix(in oklab, var(--color-saffron-500) 16%, transparent)', color: 'var(--color-saffron-500)' }}
                  >
                    {adminRole || 'Admin'}
                  </span>
                )}
              </span>
              <span className="block truncate text-[11px] text-ink-500">{user.email}</span>
            </span>
          </div>
          <nav className="flex flex-col">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setSection(n.id)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition-colors"
                style={{
                  color: section === n.id ? 'var(--color-saffron-500)' : 'var(--color-ink-200)',
                  backgroundColor: section === n.id ? 'color-mix(in oklab, var(--color-saffron-500) 12%, transparent)' : 'transparent',
                }}
              >
                <Icon d={n.icon} />
                {n.label}
              </button>
            ))}
            {isAdmin && (
              <button
                onClick={openAdmin}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-saffron-500 transition-colors"
                style={{ backgroundColor: 'color-mix(in oklab, var(--color-saffron-500) 10%, transparent)' }}
              >
                <Icon d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                Admin panel
              </button>
            )}
            <button onClick={signOut} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-ink-400 transition-colors hover:text-ink-100">
              <Icon d="M15 12H4m0 0l4-4m-4 4l4 4M10 4h7a2 2 0 012 2v12a2 2 0 01-2 2h-7" />
              Sign out
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="rounded-[var(--radius-lux)] border p-6 sm:p-8" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
          {section === 'profile' && (
            <div>
              <h2 className="display text-[22px]">Profile</h2>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Full name</dt>
                  <dd className="mt-1.5 text-[15px]">{user.name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-500">Email</dt>
                  <dd className="mt-1.5 text-[15px]">{user.email || '—'}</dd>
                </div>
              </dl>
              <p className="mt-8 text-[12px] leading-relaxed text-ink-500">
                Your profile is managed through your {user.email ? 'Google' : 'account'} sign-in. To change your name or email, update it with your sign-in provider.
              </p>
            </div>
          )}

          {section === 'orders' && (
            orders.length === 0 ? (
              <Empty title="No orders yet" body="When you place an order it will appear here with tracking and invoices." cta={{ href: '/shop', label: 'Start shopping' }} />
            ) : (
              <div>
                <h2 className="display text-[22px]">Your Orders</h2>
                <ul className="mt-6 space-y-3">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link href={`/order/${o.id}`} className="flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors hover:border-saffron-500" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium">{o.order_number}</span>
                          <span className="mt-0.5 block text-[12px] text-ink-500">
                            {new Date(o.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {o.items.length} item{o.items.length !== 1 ? 's' : ''}
                          </span>
                          <span className="mt-1 block truncate text-[12px] text-ink-400">{o.items.map((i) => i.product_name).join(', ')}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-[14px] text-saffron-500">{rupees(o.total)}</span>
                          <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]" style={{ background: 'color-mix(in oklab, var(--color-saffron-500) 14%, transparent)', color: 'var(--color-saffron-500)' }}>{o.status}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          {section === 'addresses' && (
            addresses.length === 0 ? (
              <Empty title="No addresses saved" body="Your delivery address is saved automatically when you place an order." cta={{ href: '/shop', label: 'Start shopping' }} />
            ) : (
              <div>
                <h2 className="display text-[22px]">Your Addresses</h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {addresses.map((ad) => (
                    <li key={ad.id} className="rounded-xl border p-4" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{ad.full_name}</span>
                        {ad.is_default_shipping ? <span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em]" style={{ background: 'color-mix(in oklab, var(--color-saffron-500) 14%, transparent)', color: 'var(--color-saffron-500)' }}>Default</span> : null}
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-ink-400">{ad.line1}{ad.line2 ? `, ${ad.line2}` : ''}, {ad.city}, {ad.state} {ad.pincode}</p>
                      <p className="mt-1 text-[12px] text-ink-500">{ad.phone}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
          {section === 'wishlist' && <Empty title="Your wishlist is empty" body="Tap the heart on any product to save it here for later." cta={{ href: '/shop', label: 'Browse products' }} />}

          {section === 'security' && (
            <div>
              <h2 className="display text-[22px]">Security</h2>
              <div className="mt-6 space-y-4">
                <Row label="Sign-in method" value={user.email ? 'Google (via Insforge)' : 'Email & password'} />
                <Row label="Email" value={user.email || '—'} />
              </div>
              <button onClick={signOut} className="lux-btn-ghost mt-8 hover:border-saffron-500 hover:text-saffron-500">
                Sign out of this device
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
      <span className="text-[13px] text-ink-400">{label}</span>
      <span className="text-[13px]">{value}</span>
    </div>
  );
}

function Empty({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-start">
      <h2 className="display text-[22px]">{title}</h2>
      <p className="mt-3 max-w-md text-[13px] leading-relaxed text-ink-500">{body}</p>
      {cta && (
        <Link href={cta.href} className="lux-btn-ghost mt-6 hover:border-saffron-500 hover:text-saffron-500">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
