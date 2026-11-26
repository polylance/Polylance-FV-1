import React, { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Edges, Environment, Lightformer } from '@react-three/drei';

interface PreFooter3DSceneProps {
  active: boolean;
}

class CanvasErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function createRoundedHexShape(radius: number, cornerRadius = 0.14): THREE.Shape {
  const shape = new THREE.Shape();
  const points: THREE.Vector2[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    points.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }

  for (let i = 0; i < 6; i++) {
    const curr = points[i];
    const prev = points[(i + 5) % 6];
    const next = points[(i + 1) % 6];

    const vPrev = new THREE.Vector2().subVectors(prev, curr).normalize();
    const vNext = new THREE.Vector2().subVectors(next, curr).normalize();

    const start = new THREE.Vector2().copy(curr).addScaledVector(vPrev, cornerRadius);
    const end = new THREE.Vector2().copy(curr).addScaledVector(vNext, cornerRadius);

    if (i === 0) {
      shape.moveTo(start.x, start.y);
    } else {
      shape.lineTo(start.x, start.y);
    }
    shape.quadraticCurveTo(curr.x, curr.y, end.x, end.y);
  }
  shape.closePath();
  return shape;
}

function createEllipseCurve(rx: number, rz: number, segments = 48): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(theta) * rx, 0, Math.sin(theta) * rz));
  }
  return new THREE.CatmullRomCurve3(pts, true);
}

const KineticHexSculpture: React.FC = () => {
  const rootRef = useRef<THREE.Group>(null);
  const slabRefs = useRef<(THREE.Group | null)[]>([]);
  const coreRef = useRef<THREE.Mesh>(null);
  const node1Ref = useRef<THREE.Mesh>(null);
  const node2Ref = useRef<THREE.Mesh>(null);
  const node3Ref = useRef<THREE.Mesh>(null);

  const [hovered, setHovered] = useState(false);
  const orbitClockRef = useRef(0);
  const speedMultRef = useRef(1);
  const clickSpinRemainingRef = useRef(0);

  const { size } = useThree();
  const isCompact = size.width < 520;

  const { hexGeo, curveA, curveB, tubeGeoA, tubeGeoB } = useMemo(() => {
    const shape = createRoundedHexShape(1.44, 0.14);
    const hex = new THREE.ExtrudeGeometry(shape, {
      depth: 0.17,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 4,
      curveSegments: 8,
    });
    hex.center();
    hex.rotateX(-Math.PI / 2);

    const cA = createEllipseCurve(2.32, 1.32, 48);
    const cB = createEllipseCurve(2.14, 1.46, 48);
    const tA = new THREE.TubeGeometry(cA, 128, 0.018, 12, true);
    const tB = new THREE.TubeGeometry(cB, 128, 0.02, 12, true);

    return { hexGeo: hex, curveA: cA, curveB: cB, tubeGeoA: tA, tubeGeoB: tB };
  }, []);

  useEffect(() => {
    return () => {
      hexGeo.dispose();
      tubeGeoA.dispose();
      tubeGeoB.dispose();
    };
  }, [hexGeo, tubeGeoA, tubeGeoB]);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  const handleClick = () => {
    clickSpinRemainingRef.current += Math.PI * 2;
  };

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.getElapsedTime();

    // Smoothly adjust orbital speed on hover
    const targetMult = hovered ? 1.55 : 1.0;
    speedMultRef.current = THREE.MathUtils.lerp(speedMultRef.current, targetMult, 1 - Math.exp(-5 * delta));
    orbitClockRef.current += delta * speedMultRef.current;

    // Smooth mouse-follow parallax tilt around isometric base [0.45, -0.5, 0.1]
    if (rootRef.current) {
      const targetRotX = 0.45 - state.pointer.y * 0.16;
      const targetRotY = -0.5 + state.pointer.x * 0.24;
      rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetRotX, 0.08);
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, targetRotY, 0.08);
      rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, 0.1 - state.pointer.x * 0.05, 0.08);
    }

    // 3 Stacked Frosted-Glass Hexagonal Layers breathing + gentle counter-rotation
    const baseY = [-0.82, 0, 0.82];
    slabRefs.current.forEach((slab, idx) => {
      if (!slab) return;
      const dir = idx % 2 === 0 ? 1 : -1;
      slab.position.y = baseY[idx] + Math.sin(t * 1.35 + idx * 1.1) * 0.11;
      slab.rotation.y = Math.sin(t * 0.55 + idx * 0.9) * 0.16 * dir;
    });

    // Central Precision Cobalt Core dual-axis spin + subtle scale pulse + damped click impulse
    if (coreRef.current) {
      let impulseStep = 0;
      if (clickSpinRemainingRef.current > 0.001) {
        impulseStep = clickSpinRemainingRef.current * (1 - Math.exp(-7.5 * delta));
        clickSpinRemainingRef.current -= impulseStep;
      }
      coreRef.current.rotation.y += delta * 0.72 * speedMultRef.current + impulseStep;
      coreRef.current.rotation.x = Math.sin(t * 0.9) * 0.32;
      const pulse = 1 + Math.sin(t * 2.2) * 0.055;
      coreRef.current.scale.setScalar(pulse);
    }

    // Traveling glossy nodes along the 3D orbital spline paths
    const oTime = orbitClockRef.current;
    if (node1Ref.current) {
      const p1 = curveA.getPointAt((oTime * 0.16) % 1);
      node1Ref.current.position.copy(p1);
    }
    if (node2Ref.current) {
      const p2 = curveA.getPointAt((oTime * 0.16 + 0.5) % 1);
      node2Ref.current.position.copy(p2);
    }
    if (node3Ref.current) {
      const p3 = curveB.getPointAt((oTime * 0.21 + 0.25) % 1);
      node3Ref.current.position.copy(p3);
    }
  });

  const sculptureScale = isCompact ? 0.82 : 1;

  return (
    <group
      ref={rootRef}
      scale={sculptureScale}
      rotation={[0.45, -0.5, 0.1]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* 1. Three Stacked Frosted-Glass Hexagonal Slabs */}
      {[-0.82, 0, 0.82].map((yPos, idx) => (
        <group
          key={idx}
          ref={(el) => {
            slabRefs.current[idx] = el;
          }}
          position={[0, yPos, 0]}
        >
          <mesh geometry={hexGeo}>
            <meshPhysicalMaterial
              color="#F8FAFC"
              metalness={0.05}
              roughness={0.12}
              transmission={0.82}
              thickness={1.2}
              ior={1.45}
              clearcoat={1}
              clearcoatRoughness={0.08}
              attenuationColor="#EFF6FF"
              attenuationDistance={3.2}
              emissive="#EFF6FF"
              emissiveIntensity={0.08}
            />
            <Edges color="#2563EB" threshold={15} />
          </mesh>
        </group>
      ))}

      {/* 2. Central Precision Cobalt Core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.44, 0]} />
        <meshPhysicalMaterial
          color="#0A52B8"
          metalness={0.35}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.08}
          reflectivity={0.95}
        />
        <Edges color="#60A5FA" threshold={15} />
      </mesh>

      {/* 3A. Orbit Track A (Cool Silver-Slate #CBD5E1) + 2 Traveling Glossy Nodes */}
      <group rotation={[0.38, 0.24, -0.32]}>
        <mesh geometry={tubeGeoA}>
          <meshStandardMaterial color="#CBD5E1" metalness={0.28} roughness={0.3} />
        </mesh>
        <mesh ref={node1Ref}>
          <sphereGeometry args={[0.088, 24, 24]} />
          <meshPhysicalMaterial color="#0A52B8" metalness={0.3} roughness={0.12} clearcoat={1} />
        </mesh>
        <mesh ref={node2Ref}>
          <sphereGeometry args={[0.078, 24, 24]} />
          <meshPhysicalMaterial color="#2563EB" metalness={0.25} roughness={0.12} clearcoat={1} />
        </mesh>
      </group>

      {/* 3B. Orbit Track B (Translucent Electric Blue #38BDF8) + 1 Traveling Glossy Node */}
      <group rotation={[-0.44, -0.34, 0.42]}>
        <mesh geometry={tubeGeoB}>
          <meshPhysicalMaterial
            color="#38BDF8"
            transparent
            opacity={0.62}
            roughness={0.15}
            clearcoat={1}
          />
        </mesh>
        <mesh ref={node3Ref}>
          <sphereGeometry args={[0.084, 24, 24]} />
          <meshPhysicalMaterial color="#2563EB" metalness={0.28} roughness={0.1} clearcoat={1} />
        </mesh>
      </group>
    </group>
  );
};

const StaticHexFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center" aria-hidden="true">
    <svg viewBox="0 0 360 320" className="w-72 h-64" fill="none">
      {[210, 160, 110].map((yCenter, i) => (
        <polygon
          key={yCenter}
          points={`180,${yCenter - 36} 265,${yCenter - 12} 265,${yCenter + 22} 180,${yCenter + 46} 95,${yCenter + 22} 95,${yCenter - 12}`}
          fill="#F8FAFC"
          fillOpacity="0.9"
          stroke="#2563EB"
          strokeOpacity={0.75 - i * 0.12}
          strokeWidth="1.5"
        />
      ))}
      <circle cx="180" cy="160" r="26" fill="#0A52B8" />
    </svg>
  </div>
);

function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

export const PreFooter3DScene: React.FC<PreFooter3DSceneProps> = ({ active }) => {
  const [webglSupported] = useState<boolean>(() => detectWebGLSupport());

  if (!webglSupported) {
    return <StaticHexFallback />;
  }

  return (
    <CanvasErrorBoundary fallback={<StaticHexFallback />}>
      <div className="w-full h-full" aria-hidden="true">
        <Suspense fallback={<StaticHexFallback />}>
          <Canvas
            dpr={[1, 2]}
            frameloop={active ? 'always' : 'demand'}
            camera={{ position: [0, 0.25, 6.2], fov: 36 }}
            gl={{
              alpha: true,
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.08,
            }}
          >
            {/* Bright Light-Mode Studio Lighting */}
            <ambientLight intensity={1.1} />
            <directionalLight position={[6, 10, 8]} intensity={1.8} color="#FFFFFF" />
            <directionalLight position={[-6, 2, -6]} intensity={1.2} color="#60A5FA" />

            <Environment resolution={256}>
              {/* Pure White Overhead Softbox */}
              <Lightformer
                form="rect"
                intensity={2.8}
                color="#FFFFFF"
                position={[0, 6, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                scale={[14, 14, 1]}
              />
              {/* Soft #DBEAFE Left & Right Reflectors */}
              <Lightformer
                form="rect"
                intensity={1.9}
                color="#DBEAFE"
                position={[-6, 1, 2]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[10, 6, 1]}
              />
              <Lightformer
                form="rect"
                intensity={1.9}
                color="#DBEAFE"
                position={[6, 1, 2]}
                rotation={[0, -Math.PI / 2, 0]}
                scale={[10, 6, 1]}
              />
              {/* Crisp #2563EB Electric Blue Accent Strip */}
              <Lightformer
                form="rect"
                intensity={2.2}
                color="#2563EB"
                position={[0, 3, -6]}
                scale={[12, 1.6, 1]}
              />
              {/* Clean White Floor Bounce */}
              <Lightformer
                form="rect"
                intensity={1.5}
                color="#F8FAFC"
                position={[0, -5, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[14, 14, 1]}
              />
            </Environment>

            <KineticHexSculpture />

            <ContactShadows
              position={[0, -2.1, 0]}
              opacity={0.22}
              scale={10}
              blur={2.6}
              far={4.5}
              color="#0A52B8"
              frames={1}
              resolution={256}
            />
          </Canvas>
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  );
};

export default PreFooter3DScene;
