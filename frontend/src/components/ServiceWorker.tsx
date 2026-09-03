'use client';

import { useEffect } from 'react';

/** Register the service worker so the site is installable as an app. */
export function ServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }
  }, []);
  return null;
}
