import React, { useRef, useEffect, useMemo, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, FXAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useMoleculeStore } from '@/stores/useMoleculeStore';
import { MoleculeRenderer } from '@/core/MoleculeRenderer';
import { OrbitalRenderer } from '@/core/OrbitalRenderer';
import eventBus from '@/bus/EventBus';

interface SceneProps {
  molRenderRef: React.MutableRefObject<MoleculeRenderer | null>;
  orbRenderRef: React.MutableRefObject<OrbitalRenderer | null>;
  orbitalsGroupRef: React.MutableRefObject<THREE.Group | null>;
}

const SceneInner: React.FC<SceneProps> = ({ molRenderRef, orbRenderRef, orbitalsGroupRef }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const {
    molecule,
    selectedOrbitalIndex,
    isovalue,
    showPositivePhase,
    showNegativePhase,
    hiddenAtomIndices,
    hiddenElements,
    highlightedAtomIndices,
    setCamera,
  } = useMoleculeStore();

  const moleculeGroupRef = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    if (!molecule) return;
    const molRender = new MoleculeRenderer(molecule);
    molRenderRef.current = molRender;
    const group = molRender.buildMolecule();
    moleculeGroupRef.current.clear();
    moleculeGroupRef.current.add(group);

    const orbRender = new OrbitalRenderer(molecule);
    orbRenderRef.current = orbRender;

    let maxDist = 2;
    for (const a of molecule.atoms) {
      const d = Math.sqrt(a.position.x ** 2 + a.position.y ** 2 + a.position.z ** 2);
      maxDist = Math.max(maxDist, d);
    }
    camera.position.set(0, 0, maxDist * 3);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    return () => {
      molRender.dispose();
      orbRender.clearCache();
    };
  }, [molecule, camera]);

  const orbitalRenderKey = useMemo(
    () => `${molecule?.atoms.length ?? 0}_${selectedOrbitalIndex}_${isovalue.toFixed(4)}_${showPositivePhase ? 1 : 0}_${showNegativePhase ? 1 : 0}`,
    [molecule, selectedOrbitalIndex, isovalue, showPositivePhase, showNegativePhase]
  );

  useEffect(() => {
    if (!orbitalsGroupRef.current) return;
    const prevGroup = orbitalsGroupRef.current;
    while (prevGroup.children.length > 0) {
      const child = prevGroup.children[0];
      prevGroup.remove(child);
    }
    prevGroup.clear();
    orbitalsGroupRef.current = new THREE.Group();
    orbitalsGroupRef.current.name = 'orbitals-root';
  }, [orbitalRenderKey]);

  useEffect(() => {
    if (!molecule || selectedOrbitalIndex < 0 || !orbRenderRef.current) return;
    const group = orbRenderRef.current.renderOrbital(
      selectedOrbitalIndex,
      isovalue,
      showPositivePhase,
      showNegativePhase
    );
    orbitalsGroupRef.current?.add(group);
  }, [molecule, selectedOrbitalIndex, isovalue, showPositivePhase, showNegativePhase]);

  useEffect(() => {
    if (!molRenderRef.current) return;
    hiddenAtomIndices.forEach((i) => molRenderRef.current!.setAtomVisibility(i, false));
  }, [hiddenAtomIndices]);

  useEffect(() => {
    if (!molRenderRef.current || !molecule) return;
    for (const atom of molecule.atoms) {
      const visible = !hiddenElements.includes(atom.element);
      molRenderRef.current.setElementVisibility(atom.element, visible);
    }
  }, [hiddenElements, molecule]);

  useEffect(() => {
    molRenderRef.current?.highlightAtoms(highlightedAtomIndices);
  }, [highlightedAtomIndices]);

  useFrame(() => {
    if (controlsRef.current) {
      const pos = controlsRef.current.object.position;
      const tgt = controlsRef.current.target;
      setCamera(
        { x: pos.x, y: pos.y, z: pos.z },
        { x: tgt.x, y: tgt.y, z: tgt.z }
      );
    }
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <directionalLight position={[-5, -3, -5]} intensity={0.35} color="#8899ff" />

      <primitive object={moleculeGroupRef.current} />
      <primitive key={orbitalRenderKey} object={orbitalsGroupRef.current ?? new THREE.Group()} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={200}
      />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <FXAA />
        <Bloom intensity={0.45} luminanceThreshold={0.18} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  );
};

export const MoleculeCanvas: React.FC = () => {
  const molRenderRef = useRef<MoleculeRenderer | null>(null);
  const orbRenderRef = useRef<OrbitalRenderer | null>(null);
  const orbitalsGroupRef = useRef<THREE.Group | null>(new THREE.Group());
  const molecule = useMoleculeStore((s) => s.molecule);

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 10], fov: 45, near: 0.01, far: 1000 }}
        dpr={[1, 2]}
        style={{ background: 'radial-gradient(ellipse at center, #1a2440 0%, #0b1220 70%, #070b14 100%)' }}
      >
        <SceneInner
          molRenderRef={molRenderRef}
          orbRenderRef={orbRenderRef}
          orbitalsGroupRef={orbitalsGroupRef}
        />
      </Canvas>

      {!molecule && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-500 space-y-2">
            <div className="text-5xl mb-3">⚛️</div>
            <div className="text-sm font-medium text-slate-400">上传 Gaussian 输出文件以开始可视化</div>
            <div className="text-xs text-slate-600">支持 .log / .out 格式</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(MoleculeCanvas);
