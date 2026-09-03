'use client';

/**
 * 360° product viewer.
 *
 * Uses a real GLB when the product has model_3d_url set; otherwise it falls
 * back to procedural geometry chosen from the category, so every one of the
 * 500 seeded products has a working viewer today. Geometry and materials come
 * from the shared ProductMesh library, which is theme-aware — the viewer
 * re-tints itself when an admin switches palettes.
 */

import { OrbitControls, Bounds, ContactShadows, Environment, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState } from 'react';
import * as THREE from 'three';

import type { Shape3D } from '@/lib/shapes';

import ProductMesh from './ProductMesh';
import { useThemeColors } from './useThemeColors';

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/** Shown while the GLTF loads. */
function Spinner() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.45;
  });
  return <group ref={ref} />;
}

export default function ProductViewer({
  shape,
  modelUrl,
  autoRotate = true,
  height = 460,
}: {
  shape: Shape3D;
  modelUrl?: string | null;
  autoRotate?: boolean;
  height?: number;
}) {
  const [failed, setFailed] = useState(false);
  const useGlb = Boolean(modelUrl) && !failed;
  const { accent, accent2, light, bg } = useThemeColors();

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height,
        borderRadius: 'var(--radius-lux)',
        border: '1px solid color-mix(in oklab, var(--color-ink-50) 10%, transparent)',
        background: `radial-gradient(85% 70% at 50% 30%, color-mix(in oklab, var(--color-ink-50) 7%, transparent), transparent 70%), var(--color-ink-900)`,
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 1, 7], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        onError={() => setFailed(true)}
      >
        <ambientLight intensity={light ? 0.9 : 0.5} />
        <directionalLight position={[5, 8, 5]} intensity={light ? 1.6 : 2.2} castShadow />
        <pointLight position={[-5, -2, -4]} intensity={light ? 14 : 26} color={accent} />
        <pointLight position={[4, 3, -3]} intensity={light ? 10 : 18} color={accent2} />

        <Suspense fallback={<Spinner />}>
          <Bounds fit clip observe margin={1.35}>
            {useGlb ? (
              <GlbModel url={modelUrl as string} />
            ) : (
              <ProductMesh
                shape={shape}
                accent={accent}
                accent2={accent2}
                light={light}
                scale={2.1}
              />
            )}
          </Bounds>
          <ContactShadows position={[0, -3.1, 0]} opacity={light ? 0.28 : 0.5} scale={12} blur={2.6} far={4} />
          <Environment preset="studio" background={false} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          autoRotate={autoRotate}
          autoRotateSpeed={1.4}
          minDistance={4}
          maxDistance={14}
        />
      </Canvas>

      <div
        className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]"
        style={{
          color: 'var(--color-ink-400)',
          backgroundColor: `color-mix(in oklab, ${bg} 75%, transparent)`,
          borderRadius: 'var(--radius-lux)',
        }}
      >
        Drag to rotate · scroll to zoom
      </div>
    </div>
  );
}
