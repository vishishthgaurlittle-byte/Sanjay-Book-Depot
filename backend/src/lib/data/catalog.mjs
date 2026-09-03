/**
 * Deterministic catalogue generator.
 *
 * Seeded PRNG (mulberry32) => identical SKUs, prices and stock on every run, so
 * `npm run seed` is safely re-runnable and the same code scales from the
 * Phase-1 ~500 products to the 2500-3000 Phase-4 target by raising `multiplier`.
 */
import { BRANDS } from './brands.mjs';
import { CHILD_CATEGORIES, PARENT_CATEGORIES } from './categories.mjs';

/* ------------------------------- PRNG ---------------------------------- */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

/* -------------------------- brand product lines ------------------------- */

export const BRAND_LINES = {
  cello: ['Butterflow', 'Gripper', 'Techno', 'Maxtendo', 'Signature'],
  classmate: ['Notebook', 'Pulse', 'Unbound', 'Sparkles', 'Frontline'],
  apsara: ['Absolute', 'Non-Dust', 'Extra Dark', 'Champ'],
  nataraj: ['621', 'Xtreme', 'Power', 'Trendy'],
  reynolds: ['Jetter', '045', 'Liquid Flo', 'Winner'],
  flair: ['Writometer', 'Elegant', 'Vibe', 'Cool'],
  luxor: ['Parker Vector', 'Highlighter Pro', 'Executive', 'Signature'],
  'camlin-kokuyo': ['Oil Pastel', 'Water Colour', 'Geometry Box', 'Sketch Pen'],
  'doms-industries': ['Colour Burst', 'Sketch', 'Neon', 'Craft'],
  fevicol: ['MR', 'SH', 'Speedex', 'White Glue'],
  kangaro: ['Stapler', 'Punch', 'Clip', 'Organizer'],
  linc: ['Pentonic', 'Uniball', 'Glidy'],
  'faber-castell': ['Goldfaber', 'Polychromos', 'Graph', 'Classic'],
  artline: ['EK-440', 'Stick', 'Whiteboard', 'Stikk'],
  'navneet-education': ['Youva', 'Soft Touch', 'Premium'],
  paperkraft: ['Business File', 'Executive', 'Classic'],
  pentel: ['EnerGel', 'Ain Stein', 'GraphGear'],
  dollar: ['Octagrip', 'Big Ben'],
  bilt: ['Matrix', 'Paperline'],
  sundaram: ['Classic', 'Premium'],
  'the-papier-project': ['Handbound', 'Heritage', 'Ivory'],
  'bombay-paperie': ['Kagzi', 'Indigo', 'Block Print'],
  'the-journal-shop': ['Daily', 'Refillable', 'Leatherette'],
  'scribble-script': ['Calligraphy', 'Script'],
};

const GENERIC_LINES = ['Essentials', 'Pro', 'Classic', 'Everyday', 'Prime', 'Ultra', 'Select', 'Value'];

/* ---------------------- per-subcategory templates ----------------------- */
/* price = [min, max] rupees for ONE unit; pack = typical pack sizes. */

const T = (price, pack, specs, variants = null) => ({ price, pack, specs, variants });

const COLOURS = ['Blue', 'Black', 'Red', 'Green'];
const HEX = { Blue: '#1d4ed8', Black: '#111827', Red: '#dc2626', Green: '#16a34a' };

export const SUBCAT_TEMPLATES = {
  /* Writing Instruments */
  'writing-instruments-ball-pens': T([8, 45], [1, 5, 10, 25], (r) => ({
    'Tip Size': `${['0.5', '0.6', '0.7', '1.0'][r(4)]} mm`,
    'Ink Colour': COLOURS[r(4)],
    'Body Material': ['ABS Plastic', 'Polycarbonate', 'Metal'][r(3)],
    'Write Length': `${[800, 1000, 1200, 1500][r(4)]} m`,
    Grip: ['Rubberised', 'Textured', 'Smooth'][r(3)],
  }), { type: 'colour', options: COLOURS }),
  'writing-instruments-gel-pens': T([20, 120], [1, 3, 5, 10], (r) => ({
    'Tip Size': `${['0.5', '0.7', '1.0'][r(3)]} mm`,
    'Ink Type': ['Gel', 'Liquid Gel', 'Hybrid Gel'][r(3)],
    'Ink Colour': COLOURS[r(4)],
    'Drying Time': `${[1, 2, 3][r(3)]} sec`,
  }), { type: 'colour', options: COLOURS }),
  'writing-instruments-markers': T([40, 260], [1, 4, 6, 10], (r) => ({
    'Tip Type': ['Chisel', 'Fine', 'Bullet', 'Brush'][r(4)],
    'Ink Base': ['Water', 'Alcohol', 'Permanent'][r(3)],
    Colour: ['Black', 'Blue', 'Red', 'Multicolour'][r(4)],
    Refillable: r(2) ? 'Yes' : 'No',
  })),
  'writing-instruments-highlighters': T([25, 160], [1, 5, 10], (r) => ({
    'Tip Type': ['Chisel', 'Fine'][r(2)],
    Colour: ['Yellow', 'Pink', 'Green', 'Orange', 'Assorted'][r(5)],
    'Ink Type': ['Fluorescent', 'Pastel', 'Gel'][r(3)],
    'Smear Proof': r(2) ? 'Yes' : 'No',
  })),

  /* Notebooks & Registers */
  'notebooks-registers-single-line-notebooks': T([30, 130], [1, 4, 6, 12], (r) => ({
    Pages: `${[96, 120, 140, 172, 200, 288][r(6)]}`,
    'Paper GSM': `${[60, 70, 75, 90][r(4)]} GSM`,
    Size: ['A4', 'A5', 'Long Book', 'Medium'][r(4)],
    Binding: ['Stitched', 'Spiral', 'Perfect Bound', 'Section Sewn'][r(4)],
    Ruling: 'Single Line (7mm)',
    Cover: ['Hard Cover', 'Soft Cover', 'PP Cover'][r(3)],
  }), { type: 'size', options: ['A4', 'A5', 'Long Book'] }),
  'notebooks-registers-four-line-notebooks': T([30, 120], [1, 4, 6, 12], (r) => ({
    Pages: `${[96, 120, 172, 200][r(4)]}`,
    'Paper GSM': `${[60, 70, 75][r(3)]} GSM`,
    Ruling: 'Four Line (handwriting practice)',
    Binding: ['Stitched', 'Spiral'][r(2)],
    Cover: ['Hard Cover', 'Soft Cover'][r(2)],
  })),
  'notebooks-registers-graph-notebooks': T([35, 140], [1, 4, 6], (r) => ({
    Pages: `${[72, 96, 120, 172][r(4)]}`,
    'Grid Size': `${[4, 5, 7][r(3)]} mm`,
    'Paper GSM': `${[70, 75, 90][r(3)]} GSM`,
    Size: ['A4', 'A5'][r(2)],
    Binding: ['Stitched', 'Spiral', 'Hard Bound'][r(3)],
  })),
  'notebooks-registers-long-books': T([25, 90], [1, 6, 12, 24], (r) => ({
    Pages: `${[72, 96, 120, 140][r(4)]}`,
    'Paper GSM': `${[58, 60, 70][r(3)]} GSM`,
    Ruling: ['Single Line', 'Four Line'][r(2)],
    Binding: 'Stitched',
  })),

  /* Pencils & Lead */
  'pencils-lead-graphite-pencils': T([3, 25], [1, 10, 20, 50], (r) => ({
    Grade: ['HB', 'H', '2H', '2B', '4B', '6B'][r(6)],
    'Body Shape': ['Hexagonal', 'Round', 'Triangular'][r(3)],
    'Lead Strength': ['Break Resistant', 'Standard'][r(2)],
    Eraser: r(2) ? 'Attached' : 'None',
  }), { type: 'colour', options: ['HB', '2B', '4B'] }),
  'pencils-lead-colored-pencils': T([90, 900], [1], (r) => ({
    Colours: `${[12, 18, 24, 36, 48, 60][r(6)]}`,
    'Pigment Type': ['Wax', 'Oil', 'Watercolour'][r(3)],
    'Core Diameter': `${[2.8, 3.0, 3.8][r(3)]} mm`,
    Packaging: ['Cardboard Box', 'Tin Box', 'Paper Wrap'][r(3)],
  }), { type: 'pack', options: ['12 Colours', '24 Colours', '36 Colours', '48 Colours'] }),
  'pencils-lead-mechanical-pencils': T([40, 450], [1, 2], (r) => ({
    'Lead Size': `${['0.3', '0.5', '0.7', '0.9'][r(4)]} mm`,
    Mechanism: ['Retractable', 'Fixed Sleeve', 'Auto Rotate'][r(3)],
    'Grip Type': ['Rubber', 'Knurled Metal', 'Cushion'][r(3)],
    Eraser: r(2) ? 'Built-in' : 'None',
  }), { type: 'size', options: ['0.5 mm', '0.7 mm', '0.9 mm'] }),

  /* Art Supplies */
  'art-supplies-colours': T([45, 850], [1], (r) => ({
    Type: ['Oil Pastel', 'Water Colour', 'Acrylic', 'Poster Colour', 'Crayon'][r(5)],
    Shades: `${[6, 12, 18, 24, 36][r(5)]}`,
    'Age Grade': ['3+', '5+', '8+', 'All Ages'][r(4)],
    'Non-Toxic': 'Yes',
    Washable: r(2) ? 'Yes' : 'No',
  })),
  'art-supplies-brushes': T([60, 600], [1, 3, 6], (r) => ({
    'Bristle Type': ['Synthetic', 'Sable', 'Hog Bristle', 'Foam'][r(4)],
    Sizes: ['Round Set', 'Flat Set', 'Assorted 1-12', 'Detail Set'][r(4)],
    'Handle Length': ['Short', 'Long'][r(2)],
    Pieces: `${[3, 5, 6, 12][r(4)]}`,
  })),
  'art-supplies-sketchbooks': T([90, 900], [1], (r) => ({
    Pages: `${[24, 36, 48, 60, 80][r(5)]}`,
    'Paper GSM': `${[120, 150, 180, 200][r(4)]} GSM`,
    Size: ['A3', 'A4', 'A5', '12x18 inch'][r(4)],
    Texture: ['Smooth', 'Medium Grain', 'Cold Press'][r(3)],
    Binding: ['Spiral', 'Hard Bound', 'Stitched'][r(3)],
  }), { type: 'size', options: ['A3', 'A4', 'A5'] }),
  'art-supplies-pastels': T([110, 750], [1], (r) => ({
    Type: ['Soft Pastel', 'Oil Pastel', 'Hard Pastel'][r(3)],
    Shades: `${[12, 18, 24, 36, 48][r(5)]}`,
    Lightfastness: ['Student Grade', 'Artist Grade'][r(2)],
    Packaging: ['Box', 'Tin'][r(2)],
  })),

  /* Office Supplies */
  'office-supplies-staplers': T([90, 950], [1], (r) => ({
    'Staple Size': ['24/6', '26/6', 'No. 10', 'Heavy Duty'][r(4)],
    Capacity: `${[20, 25, 30, 50, 100][r(5)]} sheets`,
    Material: ['Metal', 'ABS Plastic', 'Metal + Plastic'][r(3)],
    'Pin Included': r(2) ? 'Yes' : 'No',
  })),
  'office-supplies-clips': T([15, 160], [1, 5, 10], (r) => ({
    Type: ['Binder Clip', 'Paper Clip', 'Bulldog Clip', 'Spring Clip'][r(4)],
    Size: ['Small', 'Medium', 'Large', 'Assorted'][r(4)],
    Pieces: `${[12, 24, 48, 100][r(4)]}`,
    Material: ['Nickel Plated Steel', 'Steel', 'Plastic Coated'][r(3)],
  })),
  'office-supplies-punches': T([120, 850], [1], (r) => ({
    Holes: ['Single Hole', '2 Hole', '3 Hole', '4 Hole'][r(4)],
    Capacity: `${[10, 15, 20, 30, 50][r(5)]} sheets`,
    Material: ['Metal', 'Heavy Duty Steel'][r(2)],
    'Guide Bar': r(2) ? 'Adjustable' : 'Fixed',
  })),
  'office-supplies-sticky-notes': T([25, 260], [1, 3, 6, 12], (r) => ({
    Sheets: `${[50, 100, 200, 400][r(4)]}`,
    'Size (inch)': ['3x3', '3x5', '1.5x2', '2x3'][r(4)],
    Colour: ['Yellow', 'Assorted Neon', 'Pastel', 'Pink'][r(4)],
    Adhesive: ['Repositionable', 'Strong Hold'][r(2)],
  })),

  /* Adhesives & Tapes */
  'adhesives-tapes-glue': T([20, 320], [1, 3, 6], (r) => ({
    Type: ['White PVA', 'Glue Stick', 'Instant Adhesive', 'Craft Glue'][r(4)],
    'Net Weight': `${[25, 50, 100, 200, 500][r(5)]} g/ml`,
    'Drying Time': ['Fast (1-2 min)', 'Standard (5 min)', 'Slow'][r(3)],
    'Non-Toxic': r(2) ? 'Yes' : 'No',
  })),
  'adhesives-tapes-tape': T([20, 280], [1, 4, 6, 12], (r) => ({
    Type: ['Transparent', 'Packaging', 'Double Sided', 'Masking', 'Cloth'][r(5)],
    'Width (inch)': ['0.5', '1', '1.5', '2', '3'][r(5)],
    'Length (m)': `${[10, 25, 50, 65, 100][r(5)]}`,
    Dispenser: r(2) ? 'Included' : 'Not Included',
  })),
  'adhesives-tapes-correction-products': T([25, 220], [1, 3, 5], (r) => ({
    Type: ['Correction Pen', 'Correction Fluid', 'Correction Tape'][r(3)],
    'Volume/Length': ['7 ml', '17 ml', '5 m x 5 mm', '10 m x 5 mm'][r(4)],
    'Quick Dry': r(2) ? 'Yes' : 'No',
    Refillable: r(2) ? 'Yes' : 'No',
  })),

  /* Geometry Instruments */
  'geometry-instruments-compasses': T([60, 850], [1], (r) => ({
    Type: ['Student Compass', 'Precision Compass', 'Compass Box Set'][r(3)],
    Material: ['Metal', 'Nickel Plated Brass', 'Plastic'][r(3)],
    'Max Circle Diameter': `${[200, 250, 300, 350][r(4)]} mm`,
    Case: r(2) ? 'Hard Case' : 'Blister Pack',
  })),
  'geometry-instruments-protractors': T([10, 110], [1, 5, 10], (r) => ({
    Size: ['10 cm', '12 cm', '15 cm'][r(3)],
    Material: ['Acrylic', 'Shatterproof Plastic'][r(2)],
    Markings: ['Single Sided', 'Double Sided', 'High Contrast'][r(3)],
  })),
  'geometry-instruments-rulers': T([10, 130], [1, 5, 10], (r) => ({
    Length: ['15 cm', '30 cm', '50 cm', '1 m'][r(4)],
    Material: ['Acrylic', 'Wooden', 'Steel', 'Flexible'][r(4)],
    Scale: ['cm/mm', 'cm/inch', 'Both'][r(3)],
  }), { type: 'size', options: ['15 cm', '30 cm', '1 m'] }),
  'geometry-instruments-scales': T([40, 350], [1], (r) => ({
    Type: ['Set Square Pair', 'Geometry Box', 'T-Scale', 'French Curve'][r(4)],
    Material: ['Acrylic', 'Wood', 'Metal'][r(3)],
    Pieces: `${[2, 3, 5, 8, 10][r(5)]}`,
  })),

  /* Files & Folders */
  'files-folders-box-files': T([110, 650], [1, 3, 6], (r) => ({
    'Spine Width': `${[50, 65, 75, 90][r(4)]} mm`,
    Size: ['A4', 'Foolscap', 'Legal'][r(3)],
    Material: ['Laminated Board', 'PP Plastic', 'Metal Edge'][r(3)],
    Capacity: `${[250, 350, 450, 600][r(4)]} sheets`,
  })),
  'files-folders-lever-arch-files': T([150, 750], [1, 3, 6], (r) => ({
    'Spine Width': `${[50, 70, 80][r(3)]} mm`,
    Mechanism: ['Lever Arch', 'Ring Binder'][r(2)],
    Size: ['A4', 'Foolscap'][r(2)],
    'Label Holder': r(2) ? 'Yes' : 'No',
  })),
  'files-folders-display-files': T([80, 550], [1, 3], (r) => ({
    Pockets: `${[10, 20, 30, 40, 60][r(5)]}`,
    Size: ['A4', 'A5'][r(2)],
    Material: ['PP', 'PVC', 'Recycled PP'][r(3)],
    'Pocket Type': ['Clear', 'Textured', 'Anti-Glare'][r(3)],
  }), { type: 'pack', options: ['10 Pockets', '20 Pockets', '40 Pockets'] }),

  /* Erasers & Sharpeners */
  'erasers-sharpeners-erasers': T([3, 60], [1, 5, 10, 30], (r) => ({
    Type: ['Non-Dust', 'Dust Free', 'Kneaded', 'Ink Eraser'][r(4)],
    Shape: ['Rectangular', 'Oval', 'Pencil Top'][r(3)],
    Colour: ['White', 'Black', 'Assorted'][r(3)],
    'Paper Safe': 'Yes',
  })),
  'erasers-sharpeners-sharpeners': T([8, 120], [1, 5, 10, 25], (r) => ({
    Holes: ['Single Hole', 'Double Hole', 'With Container'][r(3)],
    Blade: ['Stainless Steel', 'Carbon Steel'][r(2)],
    Body: ['Plastic', 'Metal', 'Aluminium'][r(3)],
  })),
  'erasers-sharpeners-correction-pens': T([30, 170], [1, 3, 5], (r) => ({
    'Tip Size': `${['2.5', '4.0', '5.0'][r(3)]} mm`,
    Volume: ['7 ml', '8 ml', '12 ml'][r(3)],
    'Quick Dry': r(2) ? 'Yes' : 'No',
    Refillable: r(2) ? 'Yes' : 'No',
  })),

  /* Desk Organizers */
  'desk-organizers-pen-stands': T([80, 700], [1], (r) => ({
    Compartments: `${[1, 2, 3, 4, 5][r(5)]}`,
    Material: ['Acrylic', 'Mesh Metal', 'Wood', 'Plastic'][r(4)],
    Style: ['Rotating', 'Tiered', 'Minimal', 'Drawer Style'][r(4)],
    Finish: ['Matte', 'Glossy', 'Brushed'][r(3)],
  })),
  'desk-organizers-trays': T([120, 850], [1], (r) => ({
    Layers: `${[1, 2, 3, 4][r(4)]}`,
    Material: ['Mesh Metal', 'Acrylic', 'Plastic', 'Bamboo'][r(4)],
    Orientation: ['Stackable', 'Slanted', 'Flat'][r(3)],
    'Paper Size': ['A4', 'Letter', 'Foolscap'][r(3)],
  })),
  'desk-organizers-calendars': T([70, 550], [1], (r) => ({
    Year: '2026',
    Type: ['Desk Calendar', 'Wall Calendar', 'Perpetual', 'Planner Calendar'][r(4)],
    Pages: `${[12, 24, 365][r(3)]}`,
    Binding: ['Spiral', 'Wire-O', 'Stand'][r(3)],
    Language: ['English', 'Hindi + English'][r(2)],
  })),

  /* Bags & Pouches */
  'bags-pouches-pencil-cases': T([90, 750], [1], (r) => ({
    Material: ['Canvas', 'Polyester', 'PU Leather', 'Silicone'][r(4)],
    Compartments: `${[1, 2, 3][r(3)]}`,
    Closure: ['Zipper', 'Velcro', 'Roll-up'][r(3)],
    Capacity: `${[20, 30, 40, 60][r(4)]} pens`,
  }), { type: 'colour', options: ['Black', 'Navy', 'Maroon', 'Olive'] }),
  'bags-pouches-school-bags': T([400, 2800], [1], (r) => ({
    Capacity: `${[20, 25, 30, 35][r(4)]} L`,
    Material: ['Polyester', 'Nylon', 'Water Resistant'][r(3)],
    Compartments: `${[2, 3, 4, 5][r(4)]}`,
    'Laptop Sleeve': r(2) ? 'Yes' : 'No',
    'Age Group': ['Primary (5-8)', 'Middle (9-12)', 'Senior (13+)'][r(3)],
    'Ergonomic Back': r(2) ? 'Padded' : 'Standard',
  }), { type: 'colour', options: ['Black', 'Blue', 'Grey', 'Red'] }),
  'bags-pouches-pouches': T([60, 520], [1, 2], (r) => ({
    Use: ['Document Pouch', 'Stationery Pouch', 'Coin Pouch', 'Cable Pouch'][r(4)],
    Material: ['PVC', 'Mesh', 'Canvas', 'Nylon'][r(4)],
    Size: ['A4', 'A5', 'Small'][r(3)],
    Closure: ['Zipper', 'Snap Button'][r(2)],
  })),

  /* Diaries & Planners */
  'diaries-planners-corporate-diaries': T([250, 1800], [1], (r) => ({
    Year: '2026',
    Pages: `${[200, 336, 384, 424][r(4)]}`,
    Cover: ['PU Leather', 'Genuine Leather', 'Hard Board'][r(3)],
    Layout: ['Dated Daily', 'Dated Weekly', 'Undated'][r(3)],
    'Paper GSM': `${[70, 80, 100][r(3)]} GSM`,
    Extras: 'Pen loop, ribbon marker, expandable pocket',
  })),
  'diaries-planners-planners': T([200, 1400], [1], (r) => ({
    Type: ['Weekly Planner', 'Monthly Planner', 'Academic Planner', 'Fitness Planner'][r(4)],
    Pages: `${[96, 120, 160, 200][r(4)]}`,
    Format: ['A5', 'A4', 'Pocket'][r(3)],
    Binding: ['Spiral', 'Hard Bound', 'Ring'][r(3)],
    Dated: r(2) ? 'Dated' : 'Undated',
  })),
  'diaries-planners-journals': T([180, 1200], [1], (r) => ({
    Pages: `${[80, 120, 160, 240][r(4)]}`,
    Paper: ['Ivory', 'Recycled Kraft', 'Cotton Rag', 'Dot Grid'][r(4)],
    'Paper GSM': `${[90, 100, 120, 160][r(4)]} GSM`,
    Cover: ['Hard Bound', 'Flexi', 'Cloth Bound'][r(3)],
    Size: ['A5', 'A6', 'B5'][r(3)],
  })),

  /* School Essentials Kits */
  'school-essentials-kits-combo-packs': T([250, 1600], [1], (r) => ({
    Items: `${[5, 8, 10, 12, 15][r(5)]}`,
    Includes: 'Notebooks, pens, pencils, eraser, sharpener, ruler, geometry box',
    'Class Level': ['Class 1-3', 'Class 4-6', 'Class 7-10', 'General'][r(4)],
    Packaging: 'Reusable pouch',
  })),
  'school-essentials-kits-exam-kits': T([90, 450], [1, 2], (r) => ({
    Items: `${[4, 6, 8][r(3)]}`,
    Includes: 'HB pencils, admit card pouch, eraser, sharpener, transparent scale',
    Standard: 'Board exam compliant',
    Packaging: 'Transparent pouch',
  })),

  /* Paper Products */
  'paper-products-a4-paper': T([250, 700], [1], (r) => ({
    'Sheet Count': `${[100, 300, 500][r(3)]}`,
    'Paper GSM': `${[70, 75, 80, 100, 120][r(5)]} GSM`,
    Brightness: `${[92, 95, 96, 98][r(4)]}%`,
    Use: ['Printer', 'Photocopy', 'Inkjet + Laser'][r(3)],
    Whiteness: 'High',
  }), { type: 'pack', options: ['100 Sheets', '300 Sheets', '500 Sheets'] }),
  'paper-products-chart-paper': T([30, 220], [1, 10, 25, 50], (r) => ({
    Size: ['A2', 'A1', 'A3', '22x30 inch'][r(4)],
    Colour: ['White', 'Assorted', 'Ivory', 'Pastel'][r(4)],
    'Paper GSM': `${[100, 120, 150, 180][r(4)]} GSM`,
    Finish: ['Plain', 'Ruled', 'Grid'][r(3)],
  })),
  'paper-products-origami-paper': T([60, 420], [1, 2], (r) => ({
    Sheets: `${[50, 100, 200, 300][r(4)]}`,
    'Sheet Size': ['6x6 cm', '10x10 cm', '15x15 cm'][r(3)],
    Patterns: ['Solid', 'Double Sided', 'Printed', 'Assorted'][r(4)],
    'Paper GSM': `${[70, 80, 90][r(3)]} GSM`,
  })),
  'paper-products-tracing-paper': T([50, 340], [1, 5], (r) => ({
    Sheets: `${[25, 50, 100][r(3)]}`,
    Size: ['A4', 'A3', '12x18 inch'][r(3)],
    Transparency: ['High', 'Medium'][r(2)],
    'Paper GSM': `${[45, 53, 63, 83][r(4)]} GSM`,
  })),

  /* Premium & Luxury */
  'premium-luxury-high-end-notebooks': T([450, 2800], [1], (r) => ({
    Pages: `${[96, 160, 192, 240][r(4)]}`,
    Paper: ['Tomoe River', 'Munken Pure', 'Cotton Rag', 'Acid-Free Ivory'][r(4)],
    'Paper GSM': `${[68, 80, 100, 120][r(4)]} GSM`,
    Cover: ['Genuine Leather', 'Vegan Leather', 'Cloth over Board'][r(3)],
    Extras: 'Numbered pages, ribbon marker, expandable pocket, elastic closure',
    Binding: ['Section Sewn', 'Lay-flat Smyth Sewn'][r(2)],
  })),
  'premium-luxury-fountain-pens': T([700, 9000], [1], (r) => ({
    'Nib Size': ['EF', 'F', 'M', 'B'][r(4)],
    'Nib Material': ['Stainless Steel', 'Iridium Point', '14K Gold'][r(3)],
    'Fill Mechanism': ['Cartridge', 'Converter', 'Piston'][r(3)],
    'Body Material': ['Brass', 'Resin', 'Lacquer', 'Sterling Silver'][r(4)],
    'Ink Included': r(2) ? 'Yes' : 'No',
    Packaging: 'Gift box',
  }), { type: 'size', options: ['EF Nib', 'F Nib', 'M Nib'] }),
  'premium-luxury-gift-sets': T([900, 7000], [1], (r) => ({
    Includes: ['Pen + Diary', 'Pen + Notebook + Case', 'Desk Set', 'Calligraphy Set'][r(4)],
    Packaging: 'Rigid gift box with ribbon',
    Personalisation: r(2) ? 'Name engraving available' : 'Not available',
    Occasion: ['Corporate', 'Wedding', 'Graduation', 'Festive'][r(4)],
  })),
};

/* ------------------------------ generation ------------------------------ */

const PARENT_OF = Object.fromEntries(CHILD_CATEGORIES.map((c) => [c.slug, c.parentSlug]));

/** Brands that plausibly stock a given parent category (all slugs must exist). */
export const CATEGORY_BRAND_AFFINITY = {
  'writing-instruments': ['cello', 'reynolds', 'flair', 'luxor', 'linc', 'add-gel', 'pentel', 'artline', 'dollar', 'faber-chisel'],
  'notebooks-registers': ['classmate', 'navneet-education', 'bilt', 'youva', 'navneet-youva', 'sundaram', 'shalimar', 'nightingale'],
  'pencils-lead': ['apsara', 'nataraj', 'camlin-kokuyo', 'faber-castell', 'doms-industries', 'pentel', 'hindustan-pencils'],
  'art-supplies': ['camlin-kokuyo', 'doms-industries', 'faber-castell', 'artline', 'apsara', 'faber-chisel'],
  'office-supplies': ['kangaro', 'dollar', 'sundaram', 'techno-aids', 'deli', 'kaco'],
  'adhesives-tapes': ['fevicol', 'oddy-uniwrite', 'artline', 'sundaram-clayton'],
  'geometry-instruments': ['camlin-kokuyo', 'doms-industries', 'nataraj', 'faber-castell', 'sinar'],
  'files-folders': ['paperkraft', 'kangaro', 'sundaram', 'oddy-uniwrite', 'ajanta', 'lexi', 'toppoint'],
  'erasers-sharpeners': ['nataraj', 'apsara', 'doms-industries', 'camlin-kokuyo', 'rorito', 'hindustan-pencils'],
  'desk-organizers': ['kangaro', 'kaco', 'deli', 'sundaram', 'menorah', 'techno-aids'],
  'bags-pouches': ['scooboo', 'doms-industries', 'sundaram', 'endless-stationery', 'makoba'],
  'diaries-planners': ['the-papier-project', 'bombay-paperie', 'the-journal-shop', 'menorah', 'willsmeet', 'matrikas', 'superscribe', 'paperkraft', 'nightingale'],
  'school-essentials-kits': ['classmate', 'nataraj', 'camlin-kokuyo', 'doms-industries', 'cello', 'apsara'],
  'paper-products': ['bilt', 'paperkraft', 'sundaram', 'navneet-education', 'oddy-uniwrite', 'sinar', 'anupam'],
  'premium-luxury': ['the-papier-project', 'bombay-paperie', 'the-journal-shop', 'scribble-script', 'origin', 'pulp-fiction', 'odd-giraffe', 'luxor'],
};

const brandRow = (slug) => BRANDS.find((x) => x.slug === slug);

/**
 * Share of the catalogue each parent category holds. Sums to 100 and mirrors
 * PRODUCT-ALLOCATION-PLAN.xlsx sheet 1 — writing instruments and notebooks
 * dominate because that is where the SKU velocity actually is, while premium
 * lines stay deliberately narrow.
 */
export const CATEGORY_WEIGHTS = {
  'writing-instruments': 18,
  'notebooks-registers': 16,
  'paper-products': 10,
  'office-supplies': 10,
  'art-supplies': 9,
  'pencils-lead': 7,
  'files-folders': 6,
  'geometry-instruments': 5,
  'adhesives-tapes': 4,
  'diaries-planners': 4,
  'erasers-sharpeners': 3,
  'desk-organizers': 3,
  'bags-pouches': 2,
  'premium-luxury': 2,
  'school-essentials-kits': 1,
};

/** Relative catalogue depth per brand tier. */
const TIER_WEIGHT = { tier1: 3, tier2: 1.5, tier3: 0.8 };

/**
 * Largest-remainder allocation. Splits `budget` across `items` in proportion to
 * their weights, gives every item at least 1 where the budget allows, and
 * always sums to exactly `budget`.
 */
function allocate(budget, items) {
  const keys = Object.keys(items);
  if (!keys.length) return {};
  const totalW = keys.reduce((s, k) => s + items[k], 0);
  const raw = {};
  const out = {};
  for (const k of keys) {
    raw[k] = (budget * items[k]) / totalW;
    out[k] = Math.max(1, Math.floor(raw[k]));
  }
  let diff = budget - keys.reduce((s, k) => s + out[k], 0);
  while (diff > 0) {
    const k = keys.slice().sort((a, b) => raw[b] - out[b] - (raw[a] - out[a]))[0];
    out[k] += 1;
    diff -= 1;
  }
  while (diff < 0) {
    const k = keys.slice().sort((a, b) => out[b] - raw[b] - (out[a] - raw[a]))[0];
    if (out[k] <= 1) break;
    out[k] -= 1;
    diff += 1;
  }
  return out;
}

/** Draw one item from `pool` using per-item weights. */
function weightedPick(pool, weightOf, rand) {
  const weights = pool.map(weightOf);
  let pick = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    pick -= weights[i];
    if (pick <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * @param {object} opts
 * @param {number} opts.multiplier  products per subcategory = 10 * multiplier
 * @param {number} opts.seed
 */
export function generateProducts({ multiplier = 1, seed = 20260902 } = {}) {
  const rand = mulberry32(seed);
  const products = [];
  let n = 0;

  /* ── how many products each subcategory gets ──────────────────────
   *
   * Total = 500 * multiplier, split across parent categories by
   * CATEGORY_WEIGHTS, then split evenly across each parent's subcategories.
   * A parent never gets fewer products than it has brands, so every brand can
   * still be represented.
   */
  const TOTAL = 500 * multiplier;
  const parentWeights = Object.fromEntries(
    PARENT_CATEGORIES.map((p) => [p.slug, CATEGORY_WEIGHTS[p.slug] ?? 1]),
  );
  const parentBudget = allocate(TOTAL, parentWeights);

  // A parent never gets fewer products than it has brands (or subcategories),
  // so every brand can be represented. Applying those floors can push the
  // total above TOTAL, so trim the surplus back off the largest categories.
  const floors = {};
  for (const parent of PARENT_CATEGORIES) {
    const kids = CHILD_CATEGORIES.filter((c) => c.parentSlug === parent.slug);
    const poolSize = (CATEGORY_BRAND_AFFINITY[parent.slug] || []).length;
    floors[parent.slug] = Math.max(poolSize, kids.length, 0);
    parentBudget[parent.slug] = Math.max(parentBudget[parent.slug] ?? 0, floors[parent.slug]);
  }
  let surplus = Object.values(parentBudget).reduce((a, b) => a + b, 0) - TOTAL;
  while (surplus > 0) {
    const slug = Object.keys(parentBudget).sort(
      (a, b) => parentBudget[b] - parentBudget[a],
    )[0];
    if (parentBudget[slug] <= floors[slug]) break;
    parentBudget[slug] -= 1;
    surplus -= 1;
  }

  const childCount = {};
  const usedBrands = new Set();
  for (const parent of PARENT_CATEGORIES) {
    const kids = CHILD_CATEGORIES.filter((c) => c.parentSlug === parent.slug);
    const even = Object.fromEntries(kids.map((c) => [c.slug, 1]));
    Object.assign(childCount, allocate(parentBudget[parent.slug], even));
  }

  for (const child of CHILD_CATEGORIES) {
    const tpl = SUBCAT_TEMPLATES[child.slug];
    if (!tpl) throw new Error(`No catalogue template for subcategory "${child.slug}"`);

    const parentSlug = PARENT_OF[child.slug];
    const parent = PARENT_CATEGORIES.find((p) => p.slug === parentSlug);
    const pool = (CATEGORY_BRAND_AFFINITY[parentSlug] || []).map(brandRow);
    const missing = (CATEGORY_BRAND_AFFINITY[parentSlug] || []).filter((s) => !brandRow(s));
    if (missing.length) {
      throw new Error(`CATEGORY_BRAND_AFFINITY["${parentSlug}"] references unknown brand slug(s): ${missing.join(', ')}`);
    }
    if (!pool.length) throw new Error(`No brands mapped for parent category "${parentSlug}"`);

    const count = childCount[child.slug] ?? 0;

    // Tier-weighted draws are probabilistic, so a small boutique brand in a
    // large pool can legitimately never be picked. Force one product each for
    // brands that have not appeared anywhere yet, then fill the rest by weight.
    const forced = pool.filter((b) => !usedBrands.has(b.slug)).slice(0, count);

    for (let i = 0; i < count; i++) {
      n++;
      // Tier-weighted: major manufacturers get a wider range than boutiques.
      const brand = forced[i] ?? weightedPick(pool, (b) => TIER_WEIGHT[b.tier] ?? 1, rand);
      usedBrands.add(brand.slug);
      const lines = BRAND_LINES[brand.slug] || GENERIC_LINES;
      const line = lines[Math.floor(rand() * lines.length)];
      const pack = tpl.pack[Math.floor(rand() * tpl.pack.length)];

      const [lo, hi] = tpl.price;
      const unit = r2(lo + rand() * (hi - lo));
      const mrp = r2(Math.max(5, Math.round((unit * pack * 1.12) / 5) * 5));

      // Round to a retail-looking price, then CLAMP so the realised discount
      // always lands in 5..40%. Rounding alone can otherwise collapse a tiny
      // MRP to a 0% discount or inflate it past 50%.
      const discPct = 5 + Math.floor(rand() * 31); // target 5..35
      const step = mrp >= 50 ? 5 : 1;
      const roundStep = (v) => Math.max(step, Math.round(v / step) * step);
      const minSelling = Math.max(step, Math.ceil(mrp * 0.6)); // <= 40% off
      const maxSelling = Math.max(step, Math.floor(mrp * 0.95)); // >= 5% off
      const selling = Math.min(Math.max(roundStep(mrp * (1 - discPct / 100)), minSelling), maxSelling);

      // The spec templates call r(n) expecting an integer index in [0, n).
      // Passing the raw PRNG made every lookup a float, so array access
      // returned undefined and specs read "Tip Size: undefined mm".
      const pick = (n) => Math.floor(rand() * n);
      const specs = tpl.specs(pick);
      const packLabel = pack > 1 ? ` (Pack of ${pack})` : '';
      const variantLabel = tpl.variants
        ? ` ${tpl.variants.options[Math.floor(rand() * tpl.variants.options.length)]}`
        : '';

      const name = `${brand.name} ${line} ${child.name.replace(/s$/, '')}${variantLabel}${packLabel}`;
      const sku = `SBD-${parent.slug.slice(0, 3).toUpperCase()}-${String(n).padStart(5, '0')}`;
      const slug = `${sku.toLowerCase()}-${name
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`;

      const short = `${brand.name} ${line} ${child.name.toLowerCase()}${packLabel} - genuine product, GST invoice, pan-India delivery.`;

      products.push({
        sku,
        name,
        slug,
        _brandSlug: brand.slug,
        _brandName: brand.name,
        _categorySlug: child.slug,
        _parentCategoryName: parent.name,
        short_description: short,
        description: `${name}. ${short} Built for daily school and office use with consistent quality from ${brand.name}${
          brand.tier === 'tier3' ? ', a premium boutique label' : ''
        }. Every order ships with a GST invoice and is covered by Sanjay Book Depot's replacement policy. Specifications: ${Object.entries(specs)
          .map(([k, v]) => `${k}: ${v}`).join('; ')}.`,
        mrp,
        selling_price: selling,
        stock_quantity: Math.floor(rand() * 480),
        low_stock_threshold: 10,
        specifications: specs,
        tags: [brand.name.toLowerCase(), parent.name.toLowerCase(), child.name.toLowerCase(), 'stationery', 'india'],
        seo: {
          title: `${name} | Buy Online at Sanjay Book Depot`,
          description: `Buy ${name} online at best price in India. MRP Rs.${mrp}, now Rs.${selling}. Free shipping over Rs.499, GST invoice, easy returns.`,
          keywords: `${name}, ${brand.name}, ${child.name}, buy ${child.name.toLowerCase()} online india, stationery`,
        },
        model_3d_url: null, // procedural R3F geometry until a GLB is uploaded
        rating_average: r2(3.4 + rand() * 1.6),
        rating_count: Math.floor(rand() * 420),
        units_sold: Math.floor(rand() * 2600),
        is_featured: rand() < 0.12 ? 1 : 0,
        is_bestseller: rand() < 0.15 ? 1 : 0,
        is_active: 1,
        _pack: pack,
        _variant: tpl.variants,
      });
    }
  }

  return products;
}

/** Colour/size/pack variants for one generated product. */
export function variantsFor(product, rand) {
  const v = product._variant;
  if (!v) return [];
  return v.options.map((opt, i) => ({
    sku: `${product.sku}-V${i + 1}`,
    variant_type: v.type,
    option_value: opt,
    price_delta: i === 0 ? 0 : r2(rand() * 60 - 20) * (product.selling_price > 300 ? 3 : 1),
    stock_quantity: Math.floor(rand() * 120),
    hex_code: HEX[opt] || null,
    is_active: 1,
  }));
}
