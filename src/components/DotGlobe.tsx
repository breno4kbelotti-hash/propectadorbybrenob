import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function Dots({ radius = 1.6, count = 2200, speed = 0.0018 }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // fibonacci sphere
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      arr[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
      arr[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [radius, count]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += speed;
      ref.current.rotation.x += speed * 0.25;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#60a5fa"
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

export function DotGlobe() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70">
      <div className="h-[600px] w-[600px] max-w-[90vw] max-h-[90vw]">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <Dots />
        </Canvas>
      </div>
    </div>
  );
}
