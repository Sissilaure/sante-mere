'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface HealthData {
  tension?: 'normal' | 'high';
  fever?: boolean;
  alert?: boolean;
  heartRate?: number;
  riskLevel?: 'Vert' | 'Orange' | 'Rouge';
  symptomSeverity?: string;
}

function HumanModel({ data }: { data: HealthData }) {
  const heartRef = useRef<THREE.Mesh>(null);
  const bodyGroup = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (heartRef.current) {
      const rate = data.heartRate ?? (data.tension === 'high' ? 94 : 72);
      const pulse = 3 + Math.max(0, (rate - 60) / 12);
      const scale = 1 + Math.sin(t * pulse) * 0.16;
      heartRef.current.scale.set(scale, scale, scale);
    }
    if (bodyGroup.current) {
      bodyGroup.current.rotation.y = Math.sin(t * 0.35) * 0.18;
    }
  });

  return (
    <group ref={bodyGroup}>
      {/* Tête */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.26, 32, 32]} />
        <meshStandardMaterial color="#f1c27d" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* Torse */}
      <mesh position={[0, 0.6, 0]}>
        <capsuleGeometry args={[0.38, 0.95, 8, 20]} />
        <meshStandardMaterial color="#d6a77a" roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Colonne vertébrale interne */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.0, 12]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>

      {/* Bras */}
      {[-1, 1].map((x) => (
        <mesh key={`arm-${x}`} position={[x * 0.55, 0.9, 0]} rotation={[0, 0, x * 0.45]}>
          <cylinderGeometry args={[0.09, 0.09, 0.8, 16]} />
          <meshStandardMaterial color="#d6a77a" roughness={0.35} metalness={0.05} />
        </mesh>
      ))}

      {/* Jambes */}
      {[-1, 1].map((x) => (
        <mesh key={`leg-${x}`} position={[x * 0.25, -0.5, 0]} rotation={[0, 0, x * 0.1]}>
          <cylinderGeometry args={[0.1, 0.1, 0.9, 16]} />
          <meshStandardMaterial color="#d6a77a" roughness={0.35} metalness={0.05} />
        </mesh>
      ))}

      {/* Cœur vibrant */}
      <group position={[0.15, 0.75, 0.18]}>
        <Sphere ref={heartRef} args={[0.12, 32, 32]}>
          <MeshDistortMaterial
            color={data.tension === 'high' ? '#ff3b30' : '#ff7f7f'}
            speed={data.tension === 'high' ? 6 : 3}
            distort={0.35}
            emissive={data.tension === 'high' ? '#ff3b30' : '#ff7f7f'}
            emissiveIntensity={data.tension === 'high' ? 4 : 2}
          />
        </Sphere>
        <pointLight color={data.tension === 'high' ? '#ff3b30' : '#ff7f7f'} intensity={data.tension === 'high' ? 12 : 5} distance={2.5} />
      </group>

      {/* Champs biométriques */}
      <Float speed={3} rotationIntensity={1.5} floatIntensity={1.5}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.5, 0]}>
          <torusGeometry args={[0.9, 0.015, 16, 120]} />
          <meshStandardMaterial
            color={data.alert ? '#ff2d55' : '#10b981'}
            emissive={data.alert ? '#ff2d55' : '#10b981'}
            emissiveIntensity={data.alert ? 1.5 : 0.8}
            transparent
            opacity={0.28}
          />
        </mesh>
      </Float>

      {data.alert && (
        <mesh position={[0, 0.6, 0]}>
          <torusKnotGeometry args={[0.6, 0.08, 80, 20]} />
          <meshStandardMaterial color="#ff2d55" transparent opacity={0.18} emissive="#ff2d55" emissiveIntensity={0.7} />
        </mesh>
      )}
    </group>
  );
}

export function Keneya3D({ data = {} }: { data?: HealthData }) {
  return (
    <div className="h-[400px] w-full rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-gray-900 to-emerald-950/20 relative group">
      <div className="absolute top-6 left-6 z-10">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 mb-1">Système Biométrique</div>
        <h3 className="text-xl font-black text-white">Jumeau Numérique</h3>
      </div>
      
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} color="#10b981" intensity={1} />
        
        <HumanModel data={data} />
        
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
        <Environment preset="city" />
      </Canvas>

      <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3 text-white">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full animate-pulse ${data.alert ? 'bg-red-500' : 'bg-emerald-500'}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            {data.alert ? 'Anomalie détectée' : 'Signal Stable'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-[10px] uppercase tracking-[0.3em] text-white/70">
          <div className="rounded-3xl bg-black/20 p-3">
            <div className="text-[8px] text-white/60">Risque</div>
            <div className="mt-1 font-black text-sm text-white">{data.riskLevel ?? 'Vert'}</div>
          </div>
          <div className="rounded-3xl bg-black/20 p-3">
            <div className="text-[8px] text-white/60">Rythme cardiaque</div>
            <div className="mt-1 font-black text-sm text-white">{data.heartRate ?? 72} bpm</div>
          </div>
        </div>
      </div>
    </div>
  );
}
