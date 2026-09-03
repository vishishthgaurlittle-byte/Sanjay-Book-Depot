/**
 * 50+ Indian stationery brands, in the three tiers from the plan.
 *
 * The plan lists "Hindustan Pencils (Apsara/Nataraj)" as one Tier-1 entry, but
 * section 1.2 sells Apsara and Nataraj as separate brands - so both get their
 * own row under parent_company "Hindustan Pencils" (51 rows total).
 *
 * featured = the 10 Tier-1 brands named in section 1.2.
 */

const slugify = (s) =>
  s.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const b = (name, tier, extra = {}) => ({
  slug: extra.slug || slugify(name),
  name: extra.name || name,
  tier,
  is_featured: extra.featured ? 1 : 0,
  parent_company: extra.parent_company || null,
  tagline: extra.tagline || null,
  website: extra.website || null,
});

export const BRANDS = [
  /* Tier 1 (20) */
  b('DOMS Industries', 'tier1', { featured: true, tagline: 'Har khushi ki shuruaat' }),
  b('Kokuyo Camlin', 'tier1', {
    featured: true, slug: 'camlin-kokuyo', name: 'Camlin Kokuyo',
    parent_company: 'Kokuyo Co., Ltd.', tagline: 'Learning made colourful',
  }),
  b('Navneet Education', 'tier1', { tagline: 'Youva notebooks and publications' }),
  b('Flair Writing Industries', 'tier1', { featured: true, slug: 'flair', name: 'Flair', tagline: 'Write in style' }),
  b('Linc Ltd', 'tier1', { slug: 'linc', name: 'Linc', tagline: 'Pens that last' }),
  b('Hindustan Pencils', 'tier1', { tagline: 'Parent of Apsara and Nataraj' }),
  b('ITC Classmate', 'tier1', {
    featured: true, slug: 'classmate', name: 'ITC Classmate',
    parent_company: 'ITC Limited', tagline: 'India ki copy',
  }),
  b('Cello Writing', 'tier1', { featured: true, slug: 'cello', name: 'Cello', tagline: 'Butterflow smoothness' }),
  b('Kangaro Industries', 'tier1', { featured: true, slug: 'kangaro', name: 'Kangaro', tagline: 'Office essentials' }),
  b('Reynolds Pens', 'tier1', { featured: true, slug: 'reynolds', name: 'Reynolds', tagline: 'Likhte raho' }),
  b('Luxor Writing', 'tier1', { slug: 'luxor', name: 'Luxor', tagline: 'Parker and highlighters' }),
  b('Pidilite (Fevicol)', 'tier1', {
    featured: true, slug: 'fevicol', name: 'Fevicol',
    parent_company: 'Pidilite Industries', tagline: 'Dum laga ke chipka',
  }),
  b('Sundaram', 'tier1'),
  b('Faber-Castell India', 'tier1', { slug: 'faber-castell', name: 'Faber-Castell' }),
  b('Artline (IPIA India)', 'tier1', { slug: 'artline', name: 'Artline', parent_company: 'IPIA India' }),
  b('Anupam', 'tier1'),
  b('Oddy Uniwrite', 'tier1', { slug: 'oddy-uniwrite', name: 'Oddy Uniwrite' }),
  b('Rorito', 'tier1'),
  b('Add Gel', 'tier1', { slug: 'add-gel', name: 'Add Gel' }),
  b('Youva', 'tier1', { parent_company: 'Navneet Education' }),

  /* Tier 2 (15) */
  b('Sundaram Clayton', 'tier2', { slug: 'sundaram-clayton', name: 'Sundaram Clayton' }),
  b('Toppoint', 'tier2'),
  b('Dollar Industries', 'tier2', { slug: 'dollar', name: 'Dollar' }),
  b('Sinar', 'tier2'),
  b('Lexi', 'tier2'),
  b('Bilt', 'tier2', { tagline: 'Paper and notebooks' }),
  b('ITC Paperkraft', 'tier2', { slug: 'paperkraft', name: 'ITC Paperkraft', parent_company: 'ITC Limited' }),
  b('Ajanta', 'tier2'),
  b('Techno-Aids', 'tier2', { slug: 'techno-aids', name: 'Techno-Aids' }),
  b('Shalimar', 'tier2'),
  b('Navneet Youva', 'tier2', { slug: 'navneet-youva', name: 'Navneet Youva', parent_company: 'Navneet Education' }),
  b('Faber Chisel', 'tier2', { slug: 'faber-chisel', name: 'Faber Chisel' }),
  b('Pentel India', 'tier2', { slug: 'pentel', name: 'Pentel' }),
  b('Kaco', 'tier2'),
  b('Deli', 'tier2'),

  /* Tier 3 - premium & boutique (15) */
  b('Endless Stationery', 'tier3', { slug: 'endless-stationery', name: 'Endless Stationery' }),
  b('Scooboo', 'tier3'),
  b('Menorah', 'tier3'),
  b('Willsmeet', 'tier3'),
  b('Matrikas', 'tier3'),
  b('Nightingale', 'tier3'),
  b('Superscribe', 'tier3'),
  b('Makoba', 'tier3'),
  b('Odd Giraffe', 'tier3', { slug: 'odd-giraffe', name: 'Odd Giraffe' }),
  b('Origin', 'tier3'),
  b('The Papier Project', 'tier3', { slug: 'the-papier-project', name: 'The Papier Project' }),
  b('Scribble & Script', 'tier3', { slug: 'scribble-script', name: 'Scribble & Script' }),
  b('Pulp Fiction', 'tier3', { slug: 'pulp-fiction', name: 'Pulp Fiction' }),
  b('Bombay Paperie', 'tier3', { slug: 'bombay-paperie', name: 'Bombay Paperie' }),
  b('The Journal Shop', 'tier3', { slug: 'the-journal-shop', name: 'The Journal Shop' }),

  /* Apsara + Nataraj as standalone storefront brands */
  b('Apsara (Hindustan Pencils)', 'tier1', {
    featured: true, slug: 'apsara', name: 'Apsara',
    parent_company: 'Hindustan Pencils', tagline: 'India ka pencil',
  }),
  b('Nataraj (Hindustan Pencils)', 'tier1', {
    featured: true, slug: 'nataraj', name: 'Nataraj',
    parent_company: 'Hindustan Pencils', tagline: 'Sharp every time',
  }),
];

/** Brands called out in section 1.2 as the initial Tier-1 focus. */
export const FEATURED_BRAND_SLUGS = BRANDS.filter((x) => x.is_featured).map((x) => x.slug);
