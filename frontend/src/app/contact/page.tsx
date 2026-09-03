import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact us',
  description:
    'Get in touch with Sanjay Book Depot for orders, bulk enquiries and support.',
};

const CHANNELS: [string, string, string, string | null][] = [
  ['Email', 'support@sanjaybookdepot.in', 'Orders, returns and invoices', 'mailto:support@sanjaybookdepot.in'],
  ['Phone', '+91 522 123 4567', 'Mon–Sat, 10am–7pm IST', 'tel:+915221234567'],
  ['Bulk & corporate', 'bulk@sanjaybookdepot.in', 'Institutional and reseller pricing', 'mailto:bulk@sanjaybookdepot.in'],
  ['The shop', 'Hazratganj, Lucknow 226001', 'Uttar Pradesh, India', null],
];

const HAIRLINE = '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)';

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-10">
      <header
        className="max-w-3xl border-b pb-12"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
      >
        <p className="eyebrow">Get in touch</p>
        <h1 className="display mt-5 text-[clamp(2.4rem,5.5vw,4rem)]">Contact us</h1>
        <p className="mt-7 text-[15px] leading-[1.85] text-ink-400">
          Questions about an order, bulk pricing, or a product you cannot find? A real person
          reads these, and we reply within one working day.
        </p>
      </header>

      {/* ── Channels ──────────────────────────────────── */}
      <div
        className="mt-16 grid grid-cols-1 gap-px sm:grid-cols-2"
        style={{ background: 'color-mix(in oklab, var(--color-ink-50) 8%, transparent)' }}
      >
        {CHANNELS.map(([label, value, sub, href]) => (
          <div key={label} className="group bg-ink-950 p-9 transition-colors duration-500 hover:bg-ink-900">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-ink-500">
              {label}
            </p>
            {href ? (
              <a
                href={href}
                className="display mt-5 block text-[24px] leading-snug transition-colors duration-300 hover:text-saffron-500"
              >
                {value}
              </a>
            ) : (
              <p className="display mt-5 text-[24px] leading-snug">{value}</p>
            )}
            <p className="mt-3 text-[12px] text-ink-500">{sub}</p>
            <span className="mt-6 block h-px w-0 bg-saffron-500 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-10" />
          </div>
        ))}
      </div>

      {/* ── Two-column detail ─────────────────────────── */}
      <div className="mt-24 grid gap-14 lg:grid-cols-2">
        <section>
          <p className="eyebrow">Before you write</p>
          <h2 className="display mt-4 text-[clamp(1.7rem,3.4vw,2.6rem)]">Faster answers</h2>
          <ul className="mt-8">
            {[
              ['Order status', 'Include your order number and we will trace it the same day.'],
              ['Returns', 'Unopened within seven days. We arrange collection.'],
              ['Missing a product', 'Tell us the brand and specification — we often source to order.'],
              ['Invoices & GST', 'Every order ships with a GST invoice; duplicates on request.'],
            ].map(([title, body]) => (
              <li key={title} className="py-5" style={{ borderBottom: HAIRLINE }}>
                <p className="text-[13px] font-medium text-ink-100">{title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-400">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className="eyebrow">Visit</p>
          <h2 className="display mt-4 text-[clamp(1.7rem,3.4vw,2.6rem)]">The shop</h2>

          <div
            className="mt-8 flex aspect-[4/3] items-center justify-center"
            style={{
              background:
                'radial-gradient(80% 70% at 40% 35%, color-mix(in oklab, var(--color-saffron-500) 14%, var(--color-ink-900)), var(--color-ink-900) 72%)',
              border: '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)',
              borderRadius: 'var(--radius-lux)',
            }}
          >
            <div className="text-center">
              <span className="display block text-[64px] leading-none text-saffron-500/80">LKO</span>
              <span className="mt-3 block text-[10px] uppercase tracking-[0.3em] text-ink-400">
                Hazratganj · Lucknow
              </span>
            </div>
          </div>

          <address className="mt-8 not-italic text-[14px] leading-[1.9] text-ink-400">
            Sanjay Book Depot
            <br />
            Hazratganj, Lucknow 226001
            <br />
            Uttar Pradesh, India
            <br />
            Monday to Saturday, 10am–7pm IST
          </address>

          <p className="mt-8 text-[12px] leading-relaxed text-ink-500">
            The contact form and support-ticket integration arrive with the admin panel.
            Until then, email reaches us fastest.
          </p>

          <Link href="/shop" className="lux-btn-ghost mt-8 hover:border-saffron-500 hover:text-saffron-500">
            Browse the catalogue
          </Link>
        </section>
      </div>
    </div>
  );
}
