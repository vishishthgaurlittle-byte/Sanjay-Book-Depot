import type { MetadataRoute } from 'next';
import { createClient } from '@libsql/client';

/** Resolve the public origin across local, Vercel preview, and production. */
function baseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/**
 * Dynamic sitemap. Static marketing routes + every live category and product,
 * pulled straight from Turso so it always matches the catalogue.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/brands`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let productRoutes: MetadataRoute.Sitemap = [];

  try {
    const db = createClient({ url: process.env.TURSO_URL!, authToken: process.env.TURSO_TOKEN! });

    const cats = await db.execute(
      `SELECT slug FROM categories WHERE parent_id IS NOT NULL ORDER BY slug`,
    );
    categoryRoutes = cats.rows.map((r) => ({
      url: `${base}/shop?category=${r.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const prods = await db.execute(
      `SELECT slug, updated_at FROM products WHERE is_active = 1 ORDER BY updated_at DESC`,
    );
    productRoutes = prods.rows.map((r) => ({
      url: `${base}/product/${r.slug}`,
      lastModified: r.updated_at ? new Date(String(r.updated_at)) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    db.close();
  } catch {
    // If the DB is unreachable at build time, still emit the static routes.
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
