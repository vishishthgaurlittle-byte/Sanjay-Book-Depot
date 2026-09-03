/**
 * Generates the placeholder product artwork that the seeded product_images rows
 * point at (/images/products/{SKU}-{n}.svg).
 *
 * These are served from /public via Vercel's CDN so they cost nothing against
 * the Insforge 1 GB storage / 5 GB bandwidth allowance. When real photos are
 * uploaded to Insforge storage, replace product_images.image_url and delete
 * this folder.
 *
 *   npm run placeholders
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'products');

const PALETTE = [
  ['#f97316', '#7c2d12'],
  ['#1d4ed8', '#172554'],
  ['#15803d', '#14532d'],
  ['#b91c1c', '#450a0a'],
  ['#7e22ce', '#3b0764'],
  ['#0e7490', '#083344'],
  ['#a16207', '#422006'],
  ['#be185d', '#500724'],
];

/** Stable 32-bit hash so a given SKU always gets the same colours. */
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A different simple glyph per category prefix in the SKU. */
function glyph(prefix) {
  switch (prefix) {
    case 'WRI': // pens
      return `<rect x="86" y="52" width="28" height="112" rx="8" fill="FG"/><path d="M86 164h28l-14 26z" fill="FG"/>`;
    case 'PEN':
      return `<path d="M100 46l16 108h-32z" fill="FG"/><rect x="88" y="154" width="24" height="30" fill="FG" opacity=".7"/>`;
    case 'NOT': // notebooks
      return `<rect x="66" y="44" width="70" height="112" rx="6" fill="FG"/><rect x="66" y="44" width="10" height="112" fill="BG"/>`;
    case 'ART':
      return `<circle cx="100" cy="100" r="46" fill="FG"/><circle cx="82" cy="86" r="9" fill="BG"/><circle cx="118" cy="92" r="9" fill="BG"/>`;
    case 'OFF':
      return `<rect x="62" y="66" width="76" height="24" rx="6" fill="FG"/><rect x="62" y="96" width="76" height="44" rx="6" fill="FG" opacity=".7"/>`;
    case 'ADH':
      return `<rect x="76" y="70" width="48" height="80" rx="8" fill="FG"/><rect x="88" y="50" width="24" height="22" rx="4" fill="FG"/>`;
    case 'GEO':
      return `<path d="M100 44v56M100 100l-34 56M100 100l34 56" stroke="FG" stroke-width="10" fill="none" stroke-linecap="round"/>`;
    case 'FIL':
      return `<path d="M60 60h34l10 16h36v84H60z" fill="FG"/>`;
    case 'ERA':
      return `<rect x="66" y="82" width="68" height="36" rx="8" fill="FG"/><rect x="66" y="82" width="68" height="12" fill="BG" opacity=".5"/>`;
    case 'DES':
      return `<rect x="60" y="76" width="80" height="20" rx="5" fill="FG"/><rect x="70" y="96" width="12" height="60" fill="FG"/><rect x="118" y="96" width="12" height="60" fill="FG"/>`;
    case 'BAG':
      return `<rect x="64" y="70" width="72" height="86" rx="10" fill="FG"/><path d="M82 70V58a18 18 0 0 1 36 0v12" stroke="FG" stroke-width="9" fill="none"/>`;
    case 'DIA':
      return `<rect x="66" y="46" width="68" height="108" rx="6" fill="FG"/><rect x="94" y="46" width="6" height="108" fill="BG"/>`;
    case 'SCH':
      return `<rect x="56" y="76" width="88" height="60" rx="8" fill="FG"/><circle cx="78" cy="106" r="10" fill="BG"/><circle cx="122" cy="106" r="10" fill="BG"/>`;
    case 'PAP':
      return `<rect x="66" y="48" width="68" height="104" fill="FG"/><rect x="72" y="54" width="68" height="104" fill="FG" opacity=".55"/>`;
    case 'PRE':
      return `<path d="M100 42l46 40-46 76-46-76z" fill="FG"/><path d="M54 82h92" stroke="BG" stroke-width="6"/>`;
    default:
      return `<rect x="62" y="62" width="76" height="76" rx="12" fill="FG"/>`;
  }
}

function svg(sku, view) {
  const h = hash(sku + view);
  const [fg, bg] = PALETTE[h % PALETTE.length];
  const prefix = sku.split('-')[1] ?? '';
  const g = glyph(prefix).replaceAll('FG', fg).replaceAll('BG', bg);
  const rotate = ((h >> 7) % 21) - 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="${sku} view ${view}">
<rect width="200" height="200" rx="18" fill="${bg}"/>
<g transform="rotate(${rotate} 100 100)">${g}</g>
<text x="100" y="188" text-anchor="middle" font-family="ui-monospace,monospace" font-size="9" fill="${fg}" opacity=".75">${sku}</text>
</svg>`;
}

async function main() {
  const url = process.env.TURSO_URL;
  const authToken = process.env.TURSO_TOKEN;
  if (!url || !authToken) throw new Error('TURSO_URL and TURSO_TOKEN must be set');

  const db = createClient({ url, authToken });
  const { rows } = await db.execute('SELECT DISTINCT product_id FROM product_images');
  const skus = (await db.execute(`SELECT id, sku FROM products`)).rows;
  const skuById = Object.fromEntries(skus.map((r) => [r.id, r.sku]));

  mkdirSync(OUT, { recursive: true });

  let written = 0;
  for (const row of rows) {
    const sku = skuById[row.product_id];
    if (!sku) continue;
    for (const view of [1, 2, 3]) {
      writeFileSync(join(OUT, `${sku}-${view}.svg`), svg(sku, view), 'utf8');
      written++;
    }
  }
  console.log(`Generated ${written} placeholder images for ${rows.length} products -> ${OUT}`);
}

main().catch((e) => {
  console.error('Placeholder generation failed:', e.message);
  process.exit(1);
});
