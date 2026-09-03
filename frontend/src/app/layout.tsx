import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { getActiveTheme } from '@/lib/settings';
import { themeCss } from '@/lib/themes';
import './globals.css';

/**
 * Typography pairing chosen for luxury retail: a high-contrast serif for
 * display type (Cormorant Garamond) against a neutral grotesque for UI and
 * body (Inter). Both are self-hosted by next/font, so there is no external
 * request and no FOUT flash.
 */
const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans-next',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sanjay Book Depot — Premium Stationery, Delivered',
    template: '%s — Sanjay Book Depot',
  },
  description:
    '500+ curated stationery products from 52 of India\u2019s finest brands. ' +
    'Notebooks, art supplies, office essentials and writing instruments \u2014 shipped from Lucknow across India.',
  keywords: [
    'stationery India',
    'buy notebooks online',
    'art supplies',
    'office stationery',
    'Camlin',
    'Classmate',
    'Cello',
    'Sanjay Book Depot',
  ],
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read once per request. Cheap, and it means an admin theme switch is live
  // on the very next page load with no build step and no client-side flash.
  const theme = await getActiveTheme();

  return (
    <html
      lang="en"
      data-theme-mode={theme.mode}
      data-theme={theme.id}
      // Next needs this attribute to know the smooth scrolling is intentional,
      // otherwise it warns about disabling it during route transitions.
      data-scroll-behavior="smooth"
      className={`${serif.variable} ${sans.variable}`}
    >
      <body className="min-h-screen bg-ink-950 font-sans text-ink-200 antialiased">
        {/* Injected last so it overrides the default tokens in globals.css. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss(theme) }} />

        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
