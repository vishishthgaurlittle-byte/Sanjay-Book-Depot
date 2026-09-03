import Link from 'next/link';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', href: '/shop' },
      { label: 'Notebooks & Registers', href: '/shop?category=notebooks-registers' },
      { label: 'Art & Drafting', href: '/shop?category=art-drafting' },
      { label: 'Writing Instruments', href: '/shop?category=writing-instruments' },
      { label: 'Office Supplies', href: '/shop?category=office-supplies' },
      { label: 'Gift Sets', href: '/shop?category=gift-sets-hampers' },
    ],
  },
  {
    title: 'House',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Brands', href: '/brands' },
      { label: 'Contact', href: '/contact' },
      { label: 'Store Locator', href: '/contact' },
    ],
  },
  {
    title: 'Service',
    links: [
      { label: 'Shipping & Delivery', href: '/about' },
      { label: 'Returns & Refunds', href: '/about' },
      { label: 'Bulk & Corporate', href: '/contact' },
      { label: 'Track Order', href: '/login' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 border-t" style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* Newsletter */}
        <div className="grid gap-10 border-b py-16 lg:grid-cols-2 lg:items-end"
          style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}
        >
          <div>
            <p className="eyebrow">The Depot Letter</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">
              New arrivals, <em className="text-saffron-500">quietly</em> curated.
            </h2>
          </div>
          <form className="flex w-full max-w-md items-center gap-3 lg:justify-self-end">
            <input
              type="email"
              required
              placeholder="Your email address"
              className="w-full border-b bg-transparent py-3 text-[13px] text-ink-100 outline-none transition-colors placeholder:text-ink-500 focus:border-saffron-500"
              style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)' }}
            />
            <button type="submit" className="lux-btn shrink-0">
              Join
            </button>
          </form>
        </div>

        {/* Links */}
        <div className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="display block text-[26px] leading-none">Sanjay</span>
              <span className="mt-1.5 block text-[9px] font-medium uppercase tracking-[0.42em] text-saffron-500">
                Book Depot
              </span>
            </Link>
            <p className="mt-6 max-w-xs text-[13px] leading-relaxed text-ink-400">
              A stationery house serving students, studios and offices across India
              since 1994. Every product on this site is stocked, tested and
              dispatched by us.
            </p>
            <address className="mt-6 not-italic text-[13px] leading-relaxed text-ink-500">
              Hazratganj, Lucknow 226001
              <br />
              Uttar Pradesh, India
              <br />
              <a href="tel:+915221234567" className="transition-colors hover:text-saffron-500">
                +91 522 123 4567
              </a>
            </address>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[10px] font-medium uppercase tracking-[0.24em] text-ink-500">
                {col.title}
              </h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-ink-300 transition-colors duration-300 hover:text-saffron-500"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Base */}
        <div
          className="flex flex-col gap-4 border-t py-8 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}
        >
          <p className="text-[11px] tracking-wide text-ink-500">
            © {year} Sanjay Book Depot. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] uppercase tracking-[0.14em] text-ink-500">
            <span>UPI</span>
            <span>Cards</span>
            <span>Net Banking</span>
            <span>COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
