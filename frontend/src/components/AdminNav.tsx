'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/khata', label: 'Khata' },
  { href: '/admin/payments', label: 'Payments' },
  { href: '/admin/settings', label: 'Appearance' },
];

/** Shared tab bar across the admin panel. */
export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mb-12 flex gap-1 border-b"
      style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
    >
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className="relative px-5 py-3 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-300"
            style={{ color: active ? 'var(--color-saffron-500)' : 'var(--color-ink-400)' }}
          >
            {l.label}
            <span
              className="absolute inset-x-0 -bottom-px h-px transition-transform duration-300"
              style={{
                background: 'var(--color-saffron-500)',
                transform: active ? 'scaleX(1)' : 'scaleX(0)',
              }}
            />
          </Link>
        );
      })}
      <a
        href="/"
        className="ml-auto self-center pb-3 text-[10px] uppercase tracking-[0.18em] text-ink-500 transition-colors hover:text-saffron-500"
      >
        View storefront →
      </a>
    </nav>
  );
}
