'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Preload } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import ProductMesh from './ProductMesh';
import { useThemeColors } from './useThemeColors';

interface Item {
  shape: Parameters<typeof ProductMesh>[0]['shape'];
  position: [number, number, number];
  scale: number;
  /** Drift amplitude and speed multiplier — varied so nothing moves in lockstep. */
  speed: number;
  amplitude: number;
  rotationIntensity: number;
  floatRotation: [number, number, number];
}

/**
 * Twelve items arranged on three depth planes. The near plane is larger and
 * blurred by depth of field, the far plane recedes into fog — that layering is
 * what makes the composition read as a space rather than a flat collage.
 */
const ENSEMBLE: Item[] = [
  // ── Near plane ────────────────────────────────────────────
  { shape: 'notebook', position: [-3.1, -1.5, 1.9], scale: 0.95, speed: 1.15, amplitude: 0.32, rotationIntensity: 0.35, floatRotation: [0.22, 0.3, 0.1] },
  { shape: 'pen', position: [3.3, 1.6, 1.8], scale: 1.0, speed: 1.35, amplitude: 0.4, rotationIntensity: 0.45, floatRotation: [0.3, 0.4, 0.35] },
  { shape: 'scissors', position: [-3.5, 1.9, 1.5], scale: 0.85, speed: 0.95, amplitude: 0.28, rotationIntensity: 0.4, floatRotation: [0.25, 0.35, 0.2] },

  // ── Mid plane ─────────────────────────────────────────────
  { shape: 'giftbox', position: [2.6, -1.7, 0.4], scale: 1.05, speed: 0.8, amplitude: 0.22, rotationIntensity: 0.25, floatRotation: [0.15, 0.2, 0.08] },
  { shape: 'ink-bottle', position: [-1.9, 2.0, 0.2], scale: 0.9, speed: 1.05, amplitude: 0.3, rotationIntensity: 0.3, floatRotation: [0.18, 0.25, 0.12] },
  { shape: 'geometry', position: [4.1, -0.2, 0.1], scale: 0.9, speed: 0.9, amplitude: 0.26, rotationIntensity: 0.3, floatRotation: [0.2, 0.22, 0.15] },
  { shape: 'highlighter', position: [-4.2, -0.3, 0.3], scale: 0.85, speed: 1.25, amplitude: 0.36, rotationIntensity: 0.5, floatRotation: [0.28, 0.38, 0.3] },
  { shape: 'diary', position: [0.6, -2.4, 0.5], scale: 0.8, speed: 1.0, amplitude: 0.3, rotationIntensity: 0.32, floatRotation: [0.2, 0.28, 0.14] },

  // ── Far plane ─────────────────────────────────────────────
  { shape: 'stapler', position: [-2.6, -2.6, -1.4], scale: 0.75, speed: 0.7, amplitude: 0.2, rotationIntensity: 0.22, floatRotation: [0.12, 0.16, 0.06] },
  { shape: 'pencil', position: [1.9, 2.6, -1.2], scale: 0.8, speed: 1.1, amplitude: 0.3, rotationIntensity: 0.4, floatRotation: [0.24, 0.32, 0.26] },
  { shape: 'glue', position: [-0.9, -2.9, -1.6], scale: 0.7, speed: 0.85, amplitude: 0.24, rotationIntensity: 0.28, floatRotation: [0.16, 0.2, 0.1] },
  { shape: 'calculator', position: [4.4, 2.2, -1.5], scale: 0.65, speed: 0.75, amplitude: 0.2, rotationIntensity: 0.2, floatRotation: [0.1, 0.14, 0.05] },
];

/**
 * Continuous pointer parallax. Eased with lerp rather than applied directly so
 * the scene glides to the new angle instead of snapping with the cursor.
 */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      pointer.x * 0.09,
      0.04,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -pointer.y * 0.06,
      0.04,
    );
  });

  return <group ref={group}>{children}</group>;
}

/** Slow ambient rotation of the entire ensemble. */
function EnsembleDrift({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.12;
  });
  return <group ref={group}>{children}</group>;
}

function Lighting({ accent, light }: { accent: string; light: boolean }) {
  return (
    <>
      <ambientLight intensity={light ? 0.85 : 0.45} />
      <directionalLight position={[5, 7, 5]} intensity={light ? 1.5 : 2.4} castShadow />
      <pointLight position={[-6, 3, 2]} intensity={light ? 25 : 45} color={accent} />
      <pointLight position={[6, -4, -2]} intensity={light ? 12 : 22} color="#FFFFFF" />
      <spotLight position={[0, 8, 4]} intensity={light ? 20 : 40} angle={0.5} penumbra={1} />
    </>
  );
}

function Scene() {
  const { accent, accent2, light, bg } = useThemeColors();
  const neutral = light ? '#FFFFFF' : '#EFEAE1';

  return (
    <>
      {/* Fog fades the far plane into the page background, so the canvas has
          no visible edge against the hero. */}
      <fog attach="fog" args={[bg, 6, 15]} />
      <Lighting accent={accent} light={light} />

      <ParallaxRig>
        <EnsembleDrift>
          {ENSEMBLE.map((item, i) => (
            <Float
              key={i}
              speed={item.speed}
              rotationIntensity={item.rotationIntensity}
              floatIntensity={item.amplitude}
              floatingRange={[-item.amplitude, item.amplitude]}
            >
              <group position={item.position} rotation={item.floatRotation}>
                <ProductMesh
                  shape={item.shape}
                  accent={accent}
                  accent2={accent2}
                  neutral={neutral}
                  scale={item.scale}
                  light={light}
                />
              </group>
            </Float>
          ))}
        </EnsembleDrift>
      </ParallaxRig>

      {/* Accent halo behind the copy — pure atmosphere, no geometry. */}
      <mesh position={[0, 0, -4]}>
        <sphereGeometry args={[3.4, 32, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={light ? 0.05 : 0.06} />
      </mesh>

      <Preload all />
    </>
  );
}

export default function HeroScene() {
  const [ready, setReady] = useState(false);

  const dpr = useMemo<[number, number]>(() => [1, 2], []);

  return (
    <div
      className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
      style={{ opacity: ready ? 1 : 0 }}
      aria-hidden="true"
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={() => setReady(true)}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
