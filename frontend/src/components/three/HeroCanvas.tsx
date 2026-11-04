import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { seededRng } from '../../lib/math';

interface PointFieldProps {
  cutPosition: number; // 0 to 1
  isHovered: boolean;
  mousePos: [number, number];
}

function PointsMesh({ cutPosition, isHovered, mousePos }: PointFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1800;

  // Generate deterministic points: cloud positions, target glyph positions, colors
  const { positions, cloudPositions, glyphPositions, colors } = useMemo(() => {
    const rng = seededRng(42);
    const pos = new Float32Array(count * 3);
    const cloud = new Float32Array(count * 3);
    const glyph = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const cobalt = new THREE.Color('#1E3CFF');
    const lime = new THREE.Color('#C6F432');

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Class determination with slight noise
      const isClass0 = i < count * 0.72 ? (rng() > 0.08) : (rng() < 0.12);
      const color = isClass0 ? cobalt : lime;
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      // Cloud positions (chaotic scatter)
      cloud[i3] = (rng() - 0.5) * 16;
      cloud[i3 + 1] = (rng() - 0.5) * 8;
      cloud[i3 + 2] = (rng() - 0.5) * 4;

      // Glyph positions ("PADH LE" on left in cobalt, "BC" on right in lime)
      let gx = 0;
      let gy = (rng() - 0.5) * 2.8;
      if (isClass0) {
        // Left block (x: -6.5 to -0.5)
        gx = -6.5 + rng() * 6.0;
      } else {
        // Right block (x: 0.8 to 6.5)
        gx = 0.8 + rng() * 5.7;
      }
      glyph[i3] = gx;
      glyph[i3 + 1] = gy;
      glyph[i3 + 2] = (rng() - 0.5) * 0.5;

      // Start at cloud
      pos[i3] = cloud[i3];
      pos[i3 + 1] = cloud[i3 + 1];
      pos[i3 + 2] = cloud[i3 + 2];
    }

    return { positions: pos, cloudPositions: cloud, glyphPositions: glyph, colors: col };
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const array = posAttr.array as Float32Array;

    // Morph factor driven by cutPosition snapping or progress
    const t = THREE.MathUtils.clamp((cutPosition - 0.2) / 0.5, 0, 1);
    const easeT = t * t * (3 - 2 * t);

    // Interactive mouse repulsion
    const mx = mousePos[0] * 8;
    const my = mousePos[1] * 4;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const targetX = THREE.MathUtils.lerp(cloudPositions[i3], glyphPositions[i3], easeT);
      const targetY = THREE.MathUtils.lerp(cloudPositions[i3 + 1], glyphPositions[i3 + 1], easeT);
      const targetZ = THREE.MathUtils.lerp(cloudPositions[i3 + 2], glyphPositions[i3 + 2], easeT);

      // Current position smoothed towards target
      let cx = array[i3] + (targetX - array[i3]) * 0.08;
      let cy = array[i3 + 1] + (targetY - array[i3 + 1]) * 0.08;
      let cz = array[i3 + 2] + (targetZ - array[i3 + 2]) * 0.08;

      if (isHovered) {
        const dx = cx - mx;
        const dy = cy - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < 2.5 && distSq > 0.001) {
          const force = (2.5 - distSq) * 0.15;
          cx += dx * force;
          cy += dy * force;
        }
      }

      array[i3] = cx;
      array[i3 + 1] = cy;
      array[i3 + 2] = cz;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.88}
        sizeAttenuation
      />
    </points>
  );
}

export default function HeroCanvas({
  cutPosition,
  isHovered,
  mousePos,
}: HeroCanvasProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <PointsMesh cutPosition={cutPosition} isHovered={isHovered} mousePos={mousePos} />
      </Canvas>
    </div>
  );
}

export interface HeroCanvasProps {
  cutPosition: number;
  isHovered: boolean;
  mousePos: [number, number];
}
