'use client';

import dynamic from 'next/dynamic';

import type { Shape3D } from '@/lib/shapes';

const ProductViewer = dynamic(() => import('./three/ProductViewer'), {
  ssr: false,
  loading: () => (
    <div
      className="grid w-full place-items-center"
      style={{
        height: 460,
        borderRadius: 'var(--radius-lux)',
        border: '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)',
        background: 'var(--color-ink-900)',
      }}
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-ink-50) 14%, transparent)',
          borderTopColor: 'var(--color-saffron-500)',
        }}
      />
    </div>
  ),
});

export default function Product3D(props: {
  shape: Shape3D;
  modelUrl?: string | null;
  height?: number;
}) {
  return <ProductViewer {...props} />;
}
