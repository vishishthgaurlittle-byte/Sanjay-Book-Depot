'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { cartCount, useCart } from '@/store/cart';

const NAV = [
  { href: '/shop', label: 'Shop All' },
  { href: '/shop?category=notebooks-registers', label: 'Notebooks' },
  { href: '/shop?category=art-drafting', label: 'Art & Drafting' },
  { href: '/shop?category=office-supplies', label: 'Office' },
  { href: '/brands', label: 'Brands' },
  { href: '/about', label: 'About' },
];

export default function Header() {
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname, query]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-saffron-500 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.22em] text-saffron-on">
        Complimentary shipping over ₹499 &nbsp;·&nbsp; Dispatched from Lucknow, India
      </div>

      <div
        className="border-b transition-[background-color,border-color,backdrop-filter] duration-500"
        style={{
          backgroundColor: scrolled
            ? 'color-mix(in oklab, var(--color-ink-950) 88%, transparent)'
            : 'transparent',
          borderColor: scrolled
            ? 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(160%)' : 'none',
        }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-4 py-4 sm:px-6 lg:px-10">
          {/* Mobile menu */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="-ml-2 p-2 text-ink-300 transition-colors hover:text-ink-50 lg:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <div className="space-y-[5px]">
              <span
                className="block h-px w-5 bg-current transition-transform duration-300"
                style={{ transform: menuOpen ? 'translateY(3px) rotate(45deg)' : 'none' }}
              />
              <span
                className="block h-px w-5 bg-current transition-transform duration-300"
                style={{ transform: menuOpen ? 'translateY(-3px) rotate(-45deg)' : 'none' }}
              />
            </div>
          </button>

          <Link href="/" className="group shrink-0">
            <span className="display block text-[22px] leading-none tracking-[0.02em] sm:text-[26px]">
              Sanjay
            </span>
            <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.42em] text-saffron-500">
              Book Depot
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-8 lg:flex">
            {NAV.map((item) => {
              const active = pathname + '' === item.href || (item.href !== '/shop' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-300 transition-colors duration-300 hover:text-ink-50"
                >
                  {item.label}
                  <span
                    className="absolute -bottom-0.5 left-0 h-px bg-saffron-500 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ width: active ? '100%' : '0%' }}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Search */}
          <form
            action="/shop"
            className="ml-auto hidden min-w-0 flex-1 max-w-[300px] items-center xl:flex"
          >
            <div className="group flex w-full items-center gap-2.5 border-b border-ink-700 py-2 transition-colors focus-within:border-saffron-500">
              <svg className="h-3.5 w-3.5 shrink-0 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full bg-transparent text-[12px] tracking-wide text-ink-100 outline-none placeholder:text-ink-500"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2 xl:ml-0">
            <Link
              href="/login"
              className="hidden p-2.5 text-ink-300 transition-colors hover:text-ink-50 sm:block"
              aria-label="Account"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="12" cy="8" r="3.6" />
                <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" />
              </svg>
            </Link>

            <Link
              href="/cart"
              className="relative p-2.5 text-ink-300 transition-colors hover:text-ink-50"
              aria-label={`Cart, ${count} items`}
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M6 8h12l-1 12H7L6 8Z" />
                <path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8" />
              </svg>
              {count > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold tabular-nums"
                  style={{ background: 'var(--color-saffron-500)', color: 'var(--color-saffron-on)' }}
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden"
          style={{ maxHeight: menuOpen ? 420 : 0 }}
        >
          <div className="space-y-px border-t border-ink-800 px-4 py-3">
            <form action="/shop" className="pb-3">
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                className="w-full border-b border-ink-700 bg-transparent py-2 text-[13px] text-ink-100 outline-none placeholder:text-ink-500 focus:border-saffron-500"
              />
            </form>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2.5 text-[12px] uppercase tracking-[0.16em] text-ink-200"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="block py-2.5 text-[12px] uppercase tracking-[0.16em] text-saffron-500"
            >
              Account
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
