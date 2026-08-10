/// <reference types="@react-three/fiber" />
import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Decal } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint, RapierRigidBody } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

extend({ MeshLineGeometry, MeshLineMaterial });

interface BandProps {
  textureUrl: string | null;
}

function Band({ textureUrl }: BandProps) {
  const band = useRef<any>(null);
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RapierRigidBody>(null);
  const j2 = useRef<RapierRigidBody>(null);
  const j3 = useRef<RapierRigidBody>(null);
  const card = useRef<RapierRigidBody>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();
  
  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);

  // Canvas texture with the "HH GOA 26" text printed along the band
  const [bandTexture] = useState(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0b6839';
    ctx.font = 'bold 140px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HH GOA 26', canvas.width / 2, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });

  // Apply band texture uniforms imperatively (R3F props are unreliable on custom ShaderMaterial)
  useEffect(() => {
    band.current?.material?.setValues({
      map: bandTexture,
      useMap: 1,
      repeat: new THREE.Vector2(2, 1),
    });
  }, [bandTexture]);

  // Load Texture
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (textureUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(textureUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      });
    }
  }, [textureUrl]);

  // Rope joints logic (increased length to accommodate larger card)
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 2]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 2]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 2]);
  
  // Connect bottom joint to the top of the card (offset updated for larger card size)
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 2.8, 0]]);

  useFrame((state, delta) => {
    if (dragged && card.current) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      
      card.current.setNextKinematicTranslation({ 
        x: vec.x - dragged.x, 
        y: vec.y - dragged.y, 
        z: vec.z - dragged.z 
      });
    }
    
    if (fixed.current && j1.current && j2.current && j3.current && card.current && band.current) {
      // Calculate catmull curve
      const rCard = card.current.rotation();
      const pCard = card.current.translation();
      
      // Calculate top of the card in world space to attach the lanyard exactly
      const cardTopLocal = new THREE.Vector3(0, 2.75, 0);
      const cardTopWorld = cardTopLocal.applyQuaternion(new THREE.Quaternion(rCard.x, rCard.y, rCard.z, rCard.w)).add(new THREE.Vector3(pCard.x, pCard.y, pCard.z));

      curve.points[0].copy(cardTopWorld);
      curve.points[1].copy(j3.current.translation() as THREE.Vector3);
      curve.points[2].copy(j2.current.translation() as THREE.Vector3);
      curve.points[3].copy(j1.current.translation() as THREE.Vector3);
      curve.points[4].copy(fixed.current.translation() as THREE.Vector3);
      
      band.current.geometry.setPoints(curve.getPoints(32));
      
      // Tilt it back towards the screen naturally
      ang.copy(card.current.angvel() as THREE.Vector3);
      card.current.setAngvel({ x: ang.x, y: ang.y - rCard.y * 0.25, z: ang.z }, true);
    }
  });

  // Scale of the card: 4 width, 5.5 height (larger than before)
  const cardWidth = 4;
  const cardHeight = 5.5;

  return (
    <>
      <group position={[0, 8, 0]}>
        <RigidBody ref={fixed} angularDamping={2} linearDamping={2} type="fixed" position={[0, 0, 0]} />
        <RigidBody position={[0, 0, 0]} ref={j1} angularDamping={2} linearDamping={2} mass={0.1}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, 0, 0]} ref={j2} angularDamping={2} linearDamping={2} mass={0.1}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, 0, 0]} ref={j3} angularDamping={2} linearDamping={2} mass={0.1}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        
        <RigidBody 
          position={[0, 0, 0]} 
          ref={card} 
          angularDamping={2} 
          linearDamping={2} 
          type={dragged ? 'kinematicPosition' : 'dynamic'}
          mass={1}
          colliders="cuboid"
        >
          {/* Main Card Mesh */}
          <mesh
            castShadow 
            receiveShadow
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              drag(false);
            }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              if (card.current) {
                drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation() as THREE.Vector3)));
              }
            }}
          >
            <boxGeometry args={[cardWidth, cardHeight, 0.05]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
            {texture && (
              <Decal position={[0, 0, 0.025]} rotation={[0, 0, 0]} scale={[cardWidth, cardHeight, 1]} map={texture} depthTest={true} />
            )}
          </mesh>
          
          {/* Top lanyard hole connector */}
          <mesh position={[0, 2.75, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.06]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
          </mesh>
        </RigidBody>
      </group>

      <mesh ref={band}>
        {/* @ts-ignore */}
        <meshLineGeometry />
        {/* @ts-ignore */}
        <meshLineMaterial color="#ffffff" map={bandTexture} useMap={1} repeat={new THREE.Vector2(2, 1)} transparent depthTest={false} sizeAttenuation={1} resolution={[width, height]} lineWidth={0.5} />
      </mesh>
    </>
  );
}

export function PhysicsCardPreview({ textureUrl }: { textureUrl: string | null }) {
  if (!textureUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-[#94a3b8]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#f3c048] border-t-transparent mb-2" />
          <p className="text-sm">Preparing Physics Simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full touch-none">
      <Canvas style={{ touchAction: 'none' }} camera={{ position: [0, -2, 12], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        
        <Physics debug={false} interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Band textureUrl={textureUrl} />
        </Physics>
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
