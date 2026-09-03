'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { useInView } from '@/hooks/useInView';

// Three.js is ~600 kB and the hero canvas is purely decorative, so it is
// excluded from the SSR bundle and mounted only once the section is on screen.
const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

/** Renders a lightweight placeholder until the canvas is ready. */
function HeroFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="h-40 w-40 animate-pulse rounded-full blur-3xl"
        style={{ background: 'color-mix(in oklab, var(--color-saffron-500) 25%, transparent)' }}
      />
    </div>
  );
}

export default function Hero3D() {
  const { ref, inView } = useInView<HTMLDivElement>({ once: true, rootMargin: '200px' });

  return (
    <div ref={ref} className="absolute inset-0">
      {inView ? (
        <Suspense fallback={<HeroFallback />}>
          <HeroScene />
        </Suspense>
      ) : (
        <HeroFallback />
      )}
    </div>
  );
}
