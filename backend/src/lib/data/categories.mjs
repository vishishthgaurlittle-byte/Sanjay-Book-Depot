/**
 * 15 main categories with the subcategories named in section 1.2 of the plan.
 * Hierarchy is one level deep: child.parentSlug resolves to the parent's id.
 *
 * `&` is dropped rather than expanded to "and" so slugs stay compact and match
 * the catalogue template keys ("Notebooks & Registers" -> "notebooks-registers").
 */

const slugify = (s) => s.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ICONS = {
  'Writing Instruments': 'pen',
  'Notebooks & Registers': 'notebook',
  'Pencils & Lead': 'pencil',
  'Art Supplies': 'palette',
  'Office Supplies': 'stapler',
  'Adhesives & Tapes': 'glue',
  'Geometry Instruments': 'compass',
  'Files & Folders': 'folder',
  'Erasers & Sharpeners': 'eraser',
  'Desk Organizers': 'desk',
  'Bags & Pouches': 'bag',
  'Diaries & Planners': 'calendar',
  'School Essentials Kits': 'kit',
  'Paper Products': 'paper',
  'Premium & Luxury': 'gem',
};

/** [name, [subcategories]] in the plan's order. */
const SPEC = [
  ['Writing Instruments', ['Ball Pens', 'Gel Pens', 'Markers', 'Highlighters']],
  ['Notebooks & Registers', ['Single-line Notebooks', 'Four-line Notebooks', 'Graph Notebooks', 'Long Books']],
  ['Pencils & Lead', ['Graphite Pencils', 'Colored Pencils', 'Mechanical Pencils']],
  ['Art Supplies', ['Colours', 'Brushes', 'Sketchbooks', 'Pastels']],
  ['Office Supplies', ['Staplers', 'Clips', 'Punches', 'Sticky Notes']],
  ['Adhesives & Tapes', ['Glue', 'Tape', 'Correction Products']],
  ['Geometry Instruments', ['Compasses', 'Protractors', 'Rulers', 'Scales']],
  ['Files & Folders', ['Box Files', 'Lever Arch Files', 'Display Files']],
  ['Erasers & Sharpeners', ['Erasers', 'Sharpeners', 'Correction Pens']],
  ['Desk Organizers', ['Pen Stands', 'Trays', 'Calendars']],
  ['Bags & Pouches', ['Pencil Cases', 'School Bags', 'Pouches']],
  ['Diaries & Planners', ['Corporate Diaries', 'Planners', 'Journals']],
  ['School Essentials Kits', ['Combo Packs', 'Exam Kits']],
  ['Paper Products', ['A4 Paper', 'Chart Paper', 'Origami Paper', 'Tracing Paper']],
  ['Premium & Luxury', ['High-end Notebooks', 'Fountain Pens', 'Gift Sets']],
];

export const CATEGORIES = SPEC.flatMap(([name, subs], i) => {
  const parentSlug = slugify(name);
  const parent = {
    slug: parentSlug,
    name,
    parentSlug: null,
    depth: 1,
    icon: ICONS[name] || 'box',
    is_featured: i < 8 ? 1 : 0,
    sort_order: (i + 1) * 10,
    description: `Shop ${name.toLowerCase()} from top Indian stationery brands with fast delivery across India.`,
  };
  const children = subs.map((sub, j) => ({
    slug: `${parentSlug}-${slugify(sub)}`,
    name: sub,
    parentSlug,
    depth: 2,
    icon: ICONS[name] || 'box',
    is_featured: 0,
    sort_order: (i + 1) * 10 + j + 1,
    description: `${sub} - curated picks at wholesale-friendly prices.`,
  }));
  return [parent, ...children];
});

export const PARENT_CATEGORIES = CATEGORIES.filter((c) => c.depth === 1);
export const CHILD_CATEGORIES = CATEGORIES.filter((c) => c.depth === 2);
