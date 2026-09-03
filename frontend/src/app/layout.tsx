import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { SplashScreen } from '@/components/SplashScreen';
import { ServiceWorker } from '@/components/ServiceWorker';
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

export const SITE_URL = (() => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'https://sanjay-book-depot.vercel.app';
})();
const LOGO_URL = `${SITE_URL}/icons/icon-512.png`;

const ORGANIZATION_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Sanjay Book Depot',
  alternateName: ['SBD', 'Sanjay Books'],
  url: `${SITE_URL}/`,
  logo: LOGO_URL,
  image: LOGO_URL,
  description:
    'Premium stationery retailer — notebooks, art supplies, office essentials and writing instruments from 52 of India’s finest brands, shipped from Lucknow across India.',
  foundingDate: '1994',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Lucknow',
    addressRegion: 'Uttar Pradesh',
    addressCountry: 'IN',
  },
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', areaServed: 'IN' },
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  manifest: '/manifest.webmanifest',
  applicationName: 'Sanjay Book Depot',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sanjay Book Depot',
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/`,
    siteName: 'Sanjay Book Depot',
    title: 'Sanjay Book Depot — Premium Stationery, Delivered',
    description:
      'Premium stationery from 52 of India’s finest brands — shipped from Lucknow across India.',
    images: [{ url: LOGO_URL, width: 512, height: 512, alt: 'Sanjay Book Depot logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Sanjay Book Depot',
    description: 'Premium stationery from 52 of India’s finest brands.',
    images: [LOGO_URL],
  },
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
        <SplashScreen />
        <ServiceWorker />
        {/* Organization + logo structured data → Google shows the logo in search results. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_LD) }}
        />
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
