import 'server-only';

import { one, run } from '@/lib/db';
import { DEFAULT_THEME_ID, getTheme, isThemeId, type Theme } from '@/lib/themes';

const SETTINGS_KEY = 'active_theme';

/**
 * The theme the admin last selected. Falls back to the default when the
 * setting is missing (fresh database) or holds a theme that no longer exists
 * (a theme was renamed or removed), so a bad row can never blank the site.
 * Also falls back if the database is unreachable, so a Turso outage degrades
 * to "default theme" instead of a blank storefront.
 */
export async function getActiveTheme(): Promise<Theme> {
  try {
    const row = await one<{ value: string }>(
      `SELECT value FROM site_settings WHERE key = ?`,
      [SETTINGS_KEY],
    );
    return getTheme(isThemeId(row?.value) ? row.value : DEFAULT_THEME_ID);
  } catch {
    return getTheme(DEFAULT_THEME_ID);
  }
}

/** Persist the active theme. */
export async function setActiveTheme(
  themeId: string,
  updatedBy?: string,
): Promise<void> {
  await run(
    `INSERT INTO site_settings (key, value, updated_by, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_by = excluded.updated_by,
       updated_at = excluded.updated_at`,
    [SETTINGS_KEY, themeId, updatedBy ?? null],
  );
}

/** Who last changed the theme, and when — shown on the admin page. */
export async function getThemeMeta(): Promise<{
  updatedBy: string | null;
  updatedAt: string | null;
}> {
  try {
    const row = await one<{ updated_by: string | null; updated_at: string | null }>(
      `SELECT updated_by, updated_at FROM site_settings WHERE key = ?`,
      [SETTINGS_KEY],
    );
    return { updatedBy: row?.updated_by ?? null, updatedAt: row?.updated_at ?? null };
  } catch {
    return { updatedBy: null, updatedAt: null };
  }
}
