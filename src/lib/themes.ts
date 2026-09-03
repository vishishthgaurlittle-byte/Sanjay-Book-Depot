/**
 * The ten luxury themes. Design tokens only — the database stores just the
 * active theme id, so an admin switch is a single row update and every page
 * picks it up on the next server render.
 *
 * Colours are exactly as specified. Intermediate shades (borders, hover
 * states, accent ramps) are derived from the five core colours so each theme
 * stays internally consistent without hand-tuning ~40 values each.
 */

export interface Theme {
  id: string;
  name: string;
  vibe: string;
  bestFor: string;
  mode: 'dark' | 'light';
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  /** Optional second accent (blueprint orange, neon purple, ink green…). */
  accent2?: string;
}

export const THEMES: Theme[] = [
  {
    id: 'obsidian-gold',
    name: 'Obsidian & Gold',
    vibe: 'Modern Noir — ultra-premium, exclusive',
    bestFor: 'Luxury fountain pens, executive diaries, premium gift sets',
    mode: 'dark',
    bg: '#0A0A0A',
    surface: '#141414',
    text: '#F5F5F5',
    muted: '#888888',
    accent: '#D4AF37',
  },
  {
    id: 'midnight-sapphire',
    name: 'Midnight Sapphire',
    vibe: 'Executive Royal — trustworthy, corporate, wealthy',
    bestFor: 'Corporate planners, office supplies, leather goods',
    mode: 'dark',
    bg: '#0B132B',
    surface: '#1C2541',
    text: '#F8F9FA',
    muted: '#A0AAB5',
    accent: '#C88A85',
  },
  {
    id: 'emerald-prestige',
    name: 'Emerald Prestige',
    vibe: 'Classic Heritage — old-money, timeless',
    bestFor: 'Vintage stationery, wax seals, premium art supplies',
    mode: 'dark',
    bg: '#0A2218',
    surface: '#123524',
    text: '#FDFBF7',
    muted: '#A3B1A6',
    accent: '#C5A059',
  },
  {
    id: 'the-architect',
    name: 'The Architect',
    vibe: 'Drafting & Geometry — industrial, precise, technical',
    bestFor: 'Geometry boxes, mechanical pencils, drafting tools',
    mode: 'dark',
    bg: '#1E1E1E',
    surface: '#2A2A2A',
    text: '#E0E0E0',
    muted: '#8C8C8C',
    accent: '#4A90E2',
    accent2: '#F5A623',
  },
  {
    id: 'vanta-neon',
    name: 'Vanta & Neon',
    vibe: 'Cyber-Luxe — futuristic, high-contrast',
    bestFor: 'Gel pens, modern markers, tech accessories',
    mode: 'dark',
    bg: '#000000',
    surface: '#0D0D0D',
    text: '#FFFFFF',
    muted: '#666666',
    accent: '#00FFCC',
    accent2: '#9D00FF',
  },
  {
    id: 'heritage-paper',
    name: 'Heritage Paper',
    vibe: 'The Artisan — organic, handmade, tactile',
    bestFor: 'Watercolour paper, sketchbooks, craft supplies',
    mode: 'light',
    bg: '#F4F1EA',
    surface: '#FFFFFF',
    text: '#2C241B',
    muted: '#78716C',
    accent: '#8B5A2B',
    accent2: '#1B3B2A',
  },
  {
    id: 'royal-rajputana',
    name: 'Royal Rajputana',
    vibe: 'Modern Indian Heritage — celebratory, crafted',
    bestFor: 'Festive gift sets, Diwali hampers, traditional art materials',
    mode: 'light',
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    muted: '#555555',
    accent: '#780000',
    accent2: '#E85D04',
  },
  {
    id: 'muji-minimalist',
    name: 'Muji Minimalist',
    vibe: 'Zen Stationery — clean, distraction-free, functional',
    bestFor: 'Everyday essentials, notebooks, minimalist pens',
    mode: 'light',
    bg: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#111111',
    muted: '#757575',
    accent: '#D94838',
    accent2: '#E0E0E0',
  },
  {
    id: 'the-calligrapher',
    name: 'The Calligrapher',
    vibe: 'Fountain Pen Focus — romantic, literary, classic',
    bestFor: 'Fountain pens, ink bottles, premium journals',
    mode: 'light',
    bg: '#F9F7F1',
    surface: '#FFFFFF',
    text: '#1B263B',
    muted: '#778DA9',
    accent: '#C0C0C0',
    accent2: '#415A77',
  },
  {
    id: 'marble-rose',
    name: 'Marble & Rose',
    vibe: 'Boutique Journaling — soft, aesthetic, editorial',
    bestFor: 'Aesthetic planners, sticky notes, brush pens',
    mode: 'light',
    bg: '#FCFBF9',
    surface: '#FFFFFF',
    text: '#333333',
    muted: '#888888',
    accent: '#D4A5A5',
    accent2: '#E2D1C3',
  },
];

export const DEFAULT_THEME_ID = 'obsidian-gold';

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function isThemeId(id: unknown): id is string {
  return typeof id === 'string' && THEMES.some((t) => t.id === id);
}

/* ─────────────────────────── colour maths ─────────────────────────── */

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(rgb: [number, number, number]): string {
  return (
    '#' +
    rgb
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** Mix two hex colours; t = 0 returns a, t = 1 returns b. */
export function mix(a: string, b: string, t: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  return toHex([
    ca[0] + (cb[0] - ca[0]) * t,
    ca[1] + (cb[1] - ca[1]) * t,
    ca[2] + (cb[2] - ca[2]) * t,
  ]);
}

/**
 * Pick black or white text for maximum contrast on `bg`.
 * Uses WCAG relative luminance rather than a naive brightness average, so
 * vivid accents like #00FFCC correctly get dark text.
 */
export function readableOn(bg: string): string {
  const [r, g, b] = toRgb(bg).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.42 ? '#0A0A0A' : '#FFFFFF';
}

/**
 * Expand a theme's five core colours into the full token set the UI uses.
 *
 * The `ink` ramp always runs from the page background to the primary text
 * colour, so it inverts correctly for light themes: ink-950 is the page,
 * ink-50 is the strongest text, whatever the mode.
 */
export function themeTokens(theme: Theme): Record<string, string> {
  const dark = theme.mode === 'dark';
  const toward = dark ? theme.text : '#000000';
  const away = dark ? '#FFFFFF' : '#FFFFFF';

  return {
    // Page → surface → raised
    '--color-ink-950': theme.bg,
    '--color-ink-900': theme.surface,
    '--color-ink-850': mix(theme.surface, toward, 0.06),
    '--color-ink-800': mix(theme.surface, toward, 0.13),
    '--color-ink-750': mix(theme.surface, toward, 0.22),
    '--color-ink-700': mix(theme.surface, toward, 0.34),

    // Muted → body → strong → primary text
    '--color-ink-600': mix(theme.muted, theme.bg, dark ? 0.2 : 0.25),
    '--color-ink-500': mix(theme.muted, theme.bg, dark ? 0.08 : 0.1),
    '--color-ink-400': theme.muted,
    '--color-ink-300': mix(theme.text, theme.muted, 0.45),
    '--color-ink-200': mix(theme.text, theme.muted, 0.2),
    '--color-ink-100': mix(theme.text, theme.bg, 0.08),
    '--color-ink-50': theme.text,

    // Accent ramp
    '--color-saffron-100': mix(theme.accent, away, 0.85),
    '--color-saffron-200': mix(theme.accent, away, 0.6),
    '--color-saffron-300': mix(theme.accent, away, dark ? 0.3 : 0.18),
    '--color-saffron-400': mix(theme.accent, away, dark ? 0.14 : 0.06),
    '--color-saffron-500': theme.accent,
    '--color-saffron-600': mix(theme.accent, '#000000', dark ? 0.12 : 0.22),
    '--color-saffron-700': mix(theme.accent, '#000000', dark ? 0.32 : 0.42),
    '--color-saffron-on': readableOn(theme.accent),

    // Second accent (falls back to the primary so both always resolve)
    '--color-brand2-500': theme.accent2 ?? theme.accent,
    '--color-brand2-400': mix(theme.accent2 ?? theme.accent, away, dark ? 0.2 : 0.1),

    // Semantic helpers used by the 3D scenes
    '--theme-3d-bg': theme.bg,
    '--theme-3d-accent': theme.accent,
    '--theme-3d-accent2': theme.accent2 ?? theme.accent,
    '--theme-mode': dark ? 'dark' : 'light',
  };
}

/** Serialise a theme into a CSS declaration block. */
export function themeCss(theme: Theme): string {
  const tokens = themeTokens(theme);
  const vars = Object.entries(tokens)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `:root {\n${vars}\n}`;
}
