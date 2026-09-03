'use client';

import { useEffect, useState } from 'react';

export interface ThemeColors {
  bg: string;
  accent: string;
  accent2: string;
  light: boolean;
}

const FALLBACK: ThemeColors = {
  bg: '#0A0A0A',
  accent: '#D4AF37',
  accent2: '#D4AF37',
  light: false,
};

/**
 * Reads the active theme's colours out of the injected CSS custom properties
 * so Three.js scenes match the UI palette — including when an admin switches
 * themes. Runs on the client only; SSR returns the defaults.
 */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(FALLBACK);

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const get = (name: string, fallback: string) =>
        cs.getPropertyValue(name).trim() || fallback;
      setColors({
        bg: get('--theme-3d-bg', FALLBACK.bg),
        accent: get('--theme-3d-accent', FALLBACK.accent),
        accent2: get('--theme-3d-accent2', FALLBACK.accent2),
        light: get('--theme-mode', 'dark') === 'light',
      });
    };
    read();

    // Re-read when the admin panel live-previews a different theme.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-theme-mode'],
    });
    return () => observer.disconnect();
  }, []);

  return colors;
}
