'use client';

import { useEffect } from 'react';

import { getTheme, themeCss } from '@/lib/themes';

/**
 * Pages are statically built, so a theme saved to the DB would not re-render.
 * This fetches the live active theme on every page load and re-applies the
 * tokens client-side, so an admin Appearance change shows up immediately.
 */
export function ThemeSync() {
  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/theme')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.active) return;
        const css = themeCss(getTheme(j.active));
        let el = document.getElementById('sbd-theme-sync') as HTMLStyleElement | null;
        if (!el) {
          el = document.createElement('style');
          el.id = 'sbd-theme-sync';
          document.body.appendChild(el);
        }
        el.textContent = css;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
