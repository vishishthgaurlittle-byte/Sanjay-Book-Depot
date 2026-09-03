'use client';

import type { Shape3D } from '@/lib/shapes';

interface Props {
  shape: Shape3D;
  /** Theme accent — drives spines, grips, caps and highlights. */
  accent: string;
  /** Secondary accent for two-tone items. */
  accent2?: string;
  /** Desaturated neutral for bodies/paper. */
  neutral?: string;
  /** Scale multiplier so the same mesh works in hero and on the PDP. */
  scale?: number;
  /** Light themes need darker materials to stay visible on white. */
  light?: boolean;
}

/**
 * Builds stationery geometry procedurally — no external models.
 * Every mesh is primitive-based, so a real GLB can be dropped into
 * products.model_3d_url later without touching this code.
 */
export default function ProductMesh({
  shape,
  accent,
  accent2,
  neutral = '#EFEAE1',
  scale = 1,
  light = false,
}: Props) {
  const accent2c = accent2 ?? accent;
  const body = light ? '#FFFFFF' : neutral;
  const shade = light ? '#E8E3DB' : '#2A2723';
  const metal = light ? '#B9B4AC' : '#8C8579';

  return (
    <group scale={scale}>
      {/* ── Notebook ─────────────────────────────────────── */}
      {shape === 'notebook' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.15, 1.55, 0.13]} />
            <meshStandardMaterial color={body} roughness={0.82} metalness={0.02} />
          </mesh>
          <mesh position={[-0.59, 0, 0]} castShadow>
            <boxGeometry args={[0.045, 1.58, 0.16]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.45} />
          </mesh>
          {[0.45, 0.1, -0.25].map((y) => (
            <mesh key={y} position={[0.08, y, 0.068]}>
              <boxGeometry args={[0.72, 0.02, 0.002]} />
              <meshStandardMaterial color={shade} roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0.35, -0.72, 0.07]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.05, 0.3, 0.004]} />
            <meshStandardMaterial color={accent2c} roughness={0.4} metalness={0.3} />
          </mesh>
        </group>
      )}

      {/* ── Hardcover register ───────────────────────────── */}
      {shape === 'register' && (
        <group>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.3, 1.75, 0.24]} />
            <meshStandardMaterial color={shade} roughness={0.5} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.125]} castShadow>
            <boxGeometry args={[1.22, 1.67, 0.02]} />
            <meshStandardMaterial color={accent} roughness={0.28} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.14]}>
            <torusGeometry args={[0.28, 0.012, 8, 40]} />
            <meshStandardMaterial color={body} roughness={0.3} metalness={0.5} />
          </mesh>
          {[-0.62, 0.62].map((y) => (
            <mesh key={y} position={[0, y, 0.126]}>
              <boxGeometry args={[1.22, 0.02, 0.004]} />
              <meshStandardMaterial color={body} roughness={0.4} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Pen (ball / gel / fountain) ──────────────────── */}
      {(shape === 'pen' || shape === 'default') && (
        <group rotation={[0, 0, 0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.075, 1.2, 20]} />
            <meshStandardMaterial color={shade} roughness={0.22} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.062, 0.062, 0.42, 20]} />
            <meshStandardMaterial color={accent} roughness={0.12} metalness={0.92} />
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <coneGeometry args={[0.072, 0.24, 20]} />
            <meshStandardMaterial color={accent} roughness={0.15} metalness={0.9} />
          </mesh>
          <mesh position={[0.075, 0.42, 0]} rotation={[0, 0, 0.06]}>
            <boxGeometry args={[0.018, 0.32, 0.045]} />
            <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.065, 0.012, 8, 24]} />
            <meshStandardMaterial color={accent2c} roughness={0.25} metalness={0.7} />
          </mesh>
        </group>
      )}

      {/* ── Pencil ───────────────────────────────────────── */}
      {shape === 'pencil' && (
        <group rotation={[0, 0, 0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.065, 0.065, 1.25, 6]} />
            <meshStandardMaterial color={accent2c} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.74, 0]}>
            <coneGeometry args={[0.065, 0.22, 6]} />
            <meshStandardMaterial color="#DCC7A0" roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.88, 0]}>
            <coneGeometry args={[0.02, 0.07, 6]} />
            <meshStandardMaterial color="#3A342C" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.66, 0]}>
            <cylinderGeometry args={[0.066, 0.066, 0.1, 6]} />
            <meshStandardMaterial color={metal} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.76, 0]}>
            <cylinderGeometry args={[0.06, 0.055, 0.11, 12]} />
            <meshStandardMaterial color="#C9736F" roughness={0.85} />
          </mesh>
        </group>
      )}

      {/* ── Eraser ───────────────────────────────────────── */}
      {shape === 'eraser' && (
        <group rotation={[0, 0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.4, 0.25]} />
            <meshStandardMaterial color={body} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.126]}>
            <boxGeometry args={[0.92, 0.42, 0.01]} />
            <meshStandardMaterial color={accent} roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* ── Marker ───────────────────────────────────────── */}
      {shape === 'marker' && (
        <group rotation={[0, 0, 0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.85, 20]} />
            <meshStandardMaterial color={shade} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <cylinderGeometry args={[0.1, 0.095, 0.32, 20]} />
            <meshStandardMaterial color={accent} roughness={0.25} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.075, 16, 12]} />
            <meshStandardMaterial color={accent} roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* ── Highlighter ──────────────────────────────────── */}
      {shape === 'highlighter' && (
        <group rotation={[0, 0, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.95, 0.18]} />
            <meshStandardMaterial color={accent} roughness={0.2} transparent opacity={0.92} />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <boxGeometry args={[0.2, 0.24, 0.2]} />
            <meshStandardMaterial color={shade} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.6, 0]}>
            <coneGeometry args={[0.09, 0.28, 4]} />
            <meshStandardMaterial color={accent2c} roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* ── Ruler / scale ────────────────────────────────── */}
      {shape === 'ruler' && (
        <group rotation={[0, 0, 0.5]}>
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.28, 0.02]} />
            <meshStandardMaterial color={accent} roughness={0.15} metalness={0.2} transparent opacity={0.88} />
          </mesh>
          {Array.from({ length: 13 }).map((_, i) => (
            <mesh key={i} position={[-0.72 + i * 0.12, 0.08, 0.012]}>
              <boxGeometry args={[0.008, i % 5 === 0 ? 0.1 : 0.055, 0.002]} />
              <meshStandardMaterial color={shade} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Geometry box / compass ───────────────────────── */}
      {shape === 'geometry' && (
        <group>
          <mesh castShadow>
            <boxGeometry args={[1.5, 0.9, 0.14]} />
            <meshStandardMaterial color={shade} roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.075]}>
            <boxGeometry args={[1.42, 0.82, 0.01]} />
            <meshStandardMaterial color={accent} roughness={0.2} metalness={0.65} />
          </mesh>
          <group position={[-0.3, 0, 0.1]} rotation={[0, 0, 0.3]}>
            <mesh>
              <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
              <meshStandardMaterial color={body} roughness={0.2} metalness={0.9} />
            </mesh>
            <mesh position={[0.14, -0.05, 0]} rotation={[0, 0, -0.55]}>
              <cylinderGeometry args={[0.02, 0.02, 0.5, 12]} />
              <meshStandardMaterial color={body} roughness={0.2} metalness={0.9} />
            </mesh>
          </group>
          <mesh position={[0.42, 0, 0.1]} rotation={[0, 0, 0.9]}>
            <boxGeometry args={[0.6, 0.12, 0.02]} />
            <meshStandardMaterial color={body} roughness={0.15} transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* ── Stapler ──────────────────────────────────────── */}
      {shape === 'stapler' && (
        <group>
          <mesh castShadow position={[0, -0.12, 0]}>
            <boxGeometry args={[1.3, 0.12, 0.32]} />
            <meshStandardMaterial color={metal} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.06, 0]} rotation={[0, 0, -0.09]}>
            <boxGeometry args={[1.25, 0.16, 0.3]} />
            <meshStandardMaterial color={accent} roughness={0.25} metalness={0.35} />
          </mesh>
          <mesh position={[0.68, -0.1, 0]}>
            <boxGeometry args={[0.14, 0.2, 0.34]} />
            <meshStandardMaterial color={shade} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* ── Punch ────────────────────────────────────────── */}
      {shape === 'punch' && (
        <group>
          <mesh castShadow position={[0, -0.15, 0]}>
            <boxGeometry args={[1.1, 0.14, 0.5]} />
            <meshStandardMaterial color={metal} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh castShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[1.0, 0.2, 0.28]} />
            <meshStandardMaterial color={accent} roughness={0.25} metalness={0.4} />
          </mesh>
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, -0.02, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.22, 12]} />
              <meshStandardMaterial color={body} roughness={0.2} metalness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Glue bottle ──────────────────────────────────── */}
      {shape === 'glue' && (
        <group>
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.28, 0.85, 24]} />
            <meshStandardMaterial color={body} roughness={0.35} transparent opacity={0.95} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.12, 0.19, 0.2, 20]} />
            <meshStandardMaterial color={accent} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <coneGeometry args={[0.1, 0.24, 20]} />
            <meshStandardMaterial color={accent} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.05, 0.285]}>
            <boxGeometry args={[0.34, 0.4, 0.01]} />
            <meshStandardMaterial color={accent2c} roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* ── Ink bottle ───────────────────────────────────── */}
      {shape === 'ink-bottle' && (
        <group>
          <mesh castShadow>
            <cylinderGeometry args={[0.32, 0.34, 0.62, 28]} />
            <meshPhysicalMaterial
              color={accent}
              roughness={0.05}
              metalness={0}
              transmission={0.85}
              thickness={0.5}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.22, 20]} />
            <meshStandardMaterial color={shade} roughness={0.25} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.17, 0.17, 0.16, 20]} />
            <meshStandardMaterial color={metal} roughness={0.15} metalness={0.95} />
          </mesh>
        </group>
      )}

      {/* ── Scissors ─────────────────────────────────────── */}
      {shape === 'scissors' && (
        <group rotation={[0, 0, 0.4]}>
          {[-1, 1].map((s) => (
            <group key={s} rotation={[0, 0, s * 0.14]}>
              <mesh castShadow position={[0, 0.45, s * 0.02]}>
                <boxGeometry args={[0.09, 0.8, 0.02]} />
                <meshStandardMaterial color={metal} roughness={0.1} metalness={0.95} />
              </mesh>
              <mesh position={[0, -0.28, s * 0.03]}>
                <torusGeometry args={[0.16, 0.045, 8, 24]} />
                <meshStandardMaterial color={accent} roughness={0.4} />
              </mesh>
            </group>
          ))}
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.09, 12]} />
            <meshStandardMaterial color={accent2c} roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      )}

      {/* ── File / folder ────────────────────────────────── */}
      {shape === 'file' && (
        <group rotation={[0, -0.15, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.15, 1.55, 0.06]} />
            <meshStandardMaterial color={accent} roughness={0.55} />
          </mesh>
          <mesh position={[0.04, 0.04, 0.035]}>
            <boxGeometry args={[1.05, 1.45, 0.02]} />
            <meshStandardMaterial color={body} roughness={0.8} />
          </mesh>
          <mesh position={[-0.35, 0.8, -0.01]}>
            <boxGeometry args={[0.45, 0.16, 0.05]} />
            <meshStandardMaterial color={accent} roughness={0.55} />
          </mesh>
        </group>
      )}

      {/* ── Chalk ────────────────────────────────────────── */}
      {shape === 'chalk' && (
        <group rotation={[0.2, 0, 0.6]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} castShadow position={[(i - 1) * 0.16, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.85, 12]} />
              <meshStandardMaterial color={i === 1 ? accent : body} roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Sharpener ────────────────────────────────────── */}
      {shape === 'sharpener' && (
        <group>
          <mesh castShadow>
            <boxGeometry args={[0.45, 0.32, 0.35]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.3} />
          </mesh>
          <mesh position={[0.23, 0.05, 0]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.13, 0.3, 16]} />
            <meshStandardMaterial color={metal} roughness={0.15} metalness={0.95} />
          </mesh>
        </group>
      )}

      {/* ── Calculator ───────────────────────────────────── */}
      {shape === 'calculator' && (
        <group rotation={[-0.25, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 1.35, 0.09]} />
            <meshStandardMaterial color={shade} roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.48, 0.05]}>
            <boxGeometry args={[0.68, 0.26, 0.01]} />
            <meshStandardMaterial color="#B7C4B0" roughness={0.2} metalness={0.1} />
          </mesh>
          {Array.from({ length: 16 }).map((_, i) => (
            <mesh
              key={i}
              position={[-0.26 + (i % 4) * 0.175, 0.2 - Math.floor(i / 4) * 0.175, 0.05]}
            >
              <boxGeometry args={[0.14, 0.14, 0.02]} />
              <meshStandardMaterial color={i > 11 ? accent : body} roughness={0.6} />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Diary / planner ──────────────────────────────── */}
      {shape === 'diary' && (
        <group>
          <mesh castShadow>
            <boxGeometry args={[1.05, 1.5, 0.16]} />
            <meshStandardMaterial color={accent} roughness={0.45} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.082]}>
            <boxGeometry args={[0.7, 0.02, 0.005]} />
            <meshStandardMaterial color={accent2c} roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, -0.18, 0.082]}>
            <boxGeometry args={[0.45, 0.02, 0.005]} />
            <meshStandardMaterial color={accent2c} roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0.56, 0, 0]} castShadow>
            <boxGeometry args={[0.03, 1.52, 0.19]} />
            <meshStandardMaterial color={accent2c} roughness={0.3} metalness={0.5} />
          </mesh>
        </group>
      )}

      {/* ── Craft / paper pack ───────────────────────────── */}
      {shape === 'craft' && (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} castShadow position={[i * 0.02, (i - 1) * 0.035, i * 0.01]} rotation={[0, i * 0.06, 0]}>
              <boxGeometry args={[1.25, 1.6, 0.02]} />
              <meshStandardMaterial
                color={i === 2 ? accent : i === 1 ? accent2c : body}
                roughness={0.85}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* ── Gift box ─────────────────────────────────────── */}
      {shape === 'giftbox' && (
        <group>
          <mesh castShadow>
            <boxGeometry args={[1.3, 1.0, 0.45]} />
            <meshStandardMaterial color={shade} roughness={0.4} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <boxGeometry args={[1.38, 0.16, 0.5]} />
            <meshStandardMaterial color={accent} roughness={0.25} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.16, 1.02, 0.47]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.16, 0.035, 8, 24]} />
            <meshStandardMaterial color={accent2c} roughness={0.2} metalness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  );
}
