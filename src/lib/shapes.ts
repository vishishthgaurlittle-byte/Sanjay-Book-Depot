/**
 * Pure module — no React, no Three.js imports, safe on both server and client.
 *
 * Maps a product's category slug onto a primitive "shape" name that the 3D
 * components know how to build procedurally. Keeping the mapping here (rather
 * than in the R3F component) means a Server Component can resolve a product's
 * shape before passing it down, which avoids the "function from a 'use client'
 * module called on the server" error.
 */

export type Shape3D =
  | 'notebook'
  | 'register'
  | 'pen'
  | 'pencil'
  | 'eraser'
  | 'marker'
  | 'highlighter'
  | 'ruler'
  | 'geometry'
  | 'stapler'
  | 'punch'
  | 'glue'
  | 'ink-bottle'
  | 'scissors'
  | 'file'
  | 'chalk'
  | 'sharpener'
  | 'calculator'
  | 'diary'
  | 'craft'
  | 'giftbox'
  | 'default';

const CATEGORY_SHAPE: Record<string, Shape3D> = {
  // Notebooks & registers
  'ruled-notebooks': 'notebook',
  'graph-millimetre-books': 'notebook',
  'hardcover-registers': 'register',
  'interleaf-registers-ledgers': 'register',
  'spiral-bound-notebooks': 'notebook',
  'exam-pads-boards': 'file',
  'long-books-short-books': 'register',
  'practice-sets-copies': 'notebook',
  'diary-planner-almanac': 'diary',
  'scrapbooks-creative-books': 'craft',

  // Art & drafting
  'drawing-craft-paper': 'craft',
  'art-pencil-drawing-pencil': 'pencil',
  'pencil-crayon': 'pencil',
  'oil-pastel': 'pencil',
  'wax-crayon': 'pencil',
  'geometry-box-instruments': 'geometry',
  'compass-divider': 'geometry',
  'drawing-pens-stencils-templates': 'geometry',
  'poster-water-fabric-colour': 'craft',
  'brush-palette-knife': 'marker',
  'easel-drafting-table': 'default',
  'calligraphy-set': 'ink-bottle',
  'adhesive-glue': 'glue',
  'scrapbook-diy-craft-material': 'craft',

  // Writing instruments
  'ball-pen': 'pen',
  'gel-roller-pen': 'pen',
  'fountain-pen': 'pen',
  'marker-sketch-pen': 'marker',
  'highlighter': 'highlighter',
  'pencil-writing': 'pencil',
  'mechanical-pencil': 'pencil',
  'refill-lead-eraser': 'eraser',
  'sharpener': 'sharpener',
  'pen-stand-tray': 'file',
  'writing-set-combo': 'giftbox',
  'marker': 'marker',

  // Office supplies
  'stapler-staple-pin': 'stapler',
  'punching-machine': 'punch',
  'scissors-cutter-blade': 'scissors',
  'tape-adhesive': 'default',
  'file-folder': 'file',
  'envelope-folder': 'file',
  'calculator': 'calculator',
  'desk-organiser-stand': 'default',
  'office-stationery-combo': 'giftbox',
  'rubber-stamp-pad': 'default',
  'whiteboard-markers-duster': 'marker',
  'paper-clips-pins-bands': 'default',
  'ink-bottle': 'ink-bottle',

  // School essentials
  'school-bag': 'default',
  'lunch-box-bottle': 'default',
  'geometry-set': 'geometry',
  'chalk-blackboard': 'chalk',
  'school-combo-kit': 'giftbox',
  'book-cover-labels': 'notebook',
  'school-stationery-combo': 'giftbox',
  'pencil-box-pouch': 'default',
  'exam-essentials-kit': 'giftbox',

  // Computer & tech stationery
  'printer-paper': 'notebook',
  'ink-toner-cartridge': 'ink-bottle',
  'usb-pen-drive': 'default',
  'mouse-pad': 'default',
  'laminating-spiral-binding': 'default',
  'computer-stationery': 'default',

  // Gifting
  'gift-hamper': 'giftbox',
  'desk-accessories': 'giftbox',
  'leather-goods': 'diary',
  'premium-pen-set': 'pen',
  'personalised-gifting': 'giftbox',

  // Paper products
  'a4-copy-paper': 'notebook',
  'coloured-paper-sheets': 'craft',
  'card-stock-chart-paper': 'craft',
  'photo-paper': 'notebook',
  'tissue-tracing-paper': 'craft',
  'printing-photocopy-paper': 'notebook',
  'envelopes': 'file',
  'sticky-notes-pads': 'notebook',
};

const NAME_HINTS: [RegExp, Shape3D][] = [
  [/geometry|compass|divider/i, 'geometry'],
  [/fountain/i, 'pen'],
  [/gel|roller/i, 'pen'],
  [/highlight/i, 'highlighter'],
  [/marker|sketch pen/i, 'marker'],
  [/mechanical pencil/i, 'pencil'],
  [/crayon|pastel/i, 'pencil'],
  [/stapler|staple/i, 'stapler'],
  [/punch/i, 'punch'],
  [/scissor|cutter/i, 'scissors'],
  [/glue|adhesive|fevicol/i, 'glue'],
  [/ink/i, 'ink-bottle'],
  [/sharpener/i, 'sharpener'],
  [/eraser/i, 'eraser'],
  [/calculator/i, 'calculator'],
  [/chalk/i, 'chalk'],
  [/ruler|scale/i, 'ruler'],
  [/diary|planner|almanac/i, 'diary'],
  [/register|ledger|long book/i, 'register'],
  [/notebook|copy|journal/i, 'notebook'],
  [/file|folder/i, 'file'],
  [/gift|hamper|combo|set/i, 'giftbox'],
  [/pen\b/i, 'pen'],
  [/pencil/i, 'pencil'],
];

export function shapeFromCategory(categorySlug?: string | null, productName?: string | null): Shape3D {
  if (categorySlug && CATEGORY_SHAPE[categorySlug]) return CATEGORY_SHAPE[categorySlug];
  if (productName) {
    for (const [re, shape] of NAME_HINTS) if (re.test(productName)) return shape;
  }
  return 'default';
}

/** Shapes that read as tall/vertical objects — used for layout proportions. */
export const VERTICAL_SHAPES: Shape3D[] = [
  'pen',
  'pencil',
  'marker',
  'highlighter',
  'glue',
  'ink-bottle',
  'sharpener',
  'chalk',
];
