import * as THREE from 'three';
import type { Atom, Molecule, Orbital, Vec3 } from '@/types';
import { MarchingCubes, GridBounds } from './MarchingCubes';
import {
  ISOSURFACE_GRID_RESOLUTION,
  ISOSURFACE_GRID_PADDING,
  orbitalMaterialPositive,
  orbitalMaterialNegative,
} from '@/config/materials';

export class OrbitalRenderer {
  private molecule: Molecule;
  private mcCache = new Map<string, MarchingCubes>();
  private meshCache = new Map<string, { pos: THREE.Mesh; neg: THREE.Mesh }>();

  constructor(molecule: Molecule) {
    this.molecule = molecule;
  }

  private computeBounds(): GridBounds {
    const atoms = this.molecule.atoms;
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const a of atoms) {
      minX = Math.min(minX, a.position.x);
      minY = Math.min(minY, a.position.y);
      minZ = Math.min(minZ, a.position.z);
      maxX = Math.max(maxX, a.position.x);
      maxY = Math.max(maxY, a.position.y);
      maxZ = Math.max(maxZ, a.position.z);
    }
    const pad = ISOSURFACE_GRID_PADDING;
    return {
      min: { x: minX - pad, y: minY - pad, z: minZ - pad },
      max: { x: maxX + pad, y: maxY + pad, z: maxZ + pad },
    };
  }

  private sTypeAO(x: number, y: number, z: number, center: Vec3, exp: number): number {
    const dx = x - center.x;
    const dy = y - center.y;
    const dz = z - center.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    return Math.exp(-exp * r2);
  }

  private pxTypeAO(x: number, y: number, z: number, center: Vec3, exp: number): number {
    const dx = x - center.x;
    const dy = y - center.y;
    const dz = z - center.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    return dx * Math.exp(-exp * r2);
  }

  private pyTypeAO(x: number, y: number, z: number, center: Vec3, exp: number): number {
    const dx = x - center.x;
    const dy = y - center.y;
    const dz = z - center.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    return dy * Math.exp(-exp * r2);
  }

  private pzTypeAO(x: number, y: number, z: number, center: Vec3, exp: number): number {
    const dx = x - center.x;
    const dy = y - center.y;
    const dz = z - center.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    return dz * Math.exp(-exp * r2);
  }

  private buildOrbitalFn(orbital: Orbital): (x: number, y: number, z: number) => number {
    const atoms = this.molecule.atoms;
    const coeffs = orbital.coefficients;
    const nCoeffs = coeffs.length;
    const STO_EXP = 1.2;

    return (x: number, y: number, z: number) => {
      let val = 0;
      let coeffIdx = 0;
      for (let i = 0; i < atoms.length && coeffIdx < nCoeffs; i++) {
        const center = atoms[i].position;
        const z = atoms[i].atomicNumber;
        val += (coeffs[coeffIdx++] || 0) * this.sTypeAO(x, y, z, center, STO_EXP * (z > 2 ? 2.5 : 1.0));
        if (z > 1 && coeffIdx < nCoeffs) {
          val += (coeffs[coeffIdx++] || 0) * this.pxTypeAO(x, y, z, center, STO_EXP * 1.8);
        }
        if (z > 1 && coeffIdx < nCoeffs) {
          val += (coeffs[coeffIdx++] || 0) * this.pyTypeAO(x, y, z, center, STO_EXP * 1.8);
        }
        if (z > 1 && coeffIdx < nCoeffs) {
          val += (coeffs[coeffIdx++] || 0) * this.pzTypeAO(x, y, z, center, STO_EXP * 1.8);
        }
      }
      return val;
    };
  }

  renderOrbital(
    orbitalIndex: number,
    isovalue: number,
    showPositive: boolean,
    showNegative: boolean
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = 'orbitals';
    const orbital = this.molecule.orbitals[orbitalIndex];
    if (!orbital) return group;

    const cacheKey = `${orbitalIndex}_${isovalue.toFixed(4)}`;
    if (this.meshCache.has(cacheKey)) {
      const cached = this.meshCache.get(cacheKey)!;
      if (showPositive) group.add(cached.pos);
      if (showNegative) group.add(cached.neg);
      return group;
    }

    const bounds = this.computeBounds();
    const mc = new MarchingCubes(bounds, ISOSURFACE_GRID_RESOLUTION);
    const orbFn = this.buildOrbitalFn(orbital);
    mc.setValues(orbFn);

    const posSurface = mc.buildIsosurface(isovalue);
    const negSurface = mc.buildIsosurface(-isovalue);

    const posGeom = new THREE.BufferGeometry();
    posGeom.setAttribute('position', new THREE.BufferAttribute(posSurface.positions, 3));
    posGeom.setAttribute('normal', new THREE.BufferAttribute(posSurface.normals, 3));
    posGeom.setIndex(new THREE.BufferAttribute(posSurface.indices, 1));
    const posMesh = new THREE.Mesh(posGeom, orbitalMaterialPositive.clone());
    posMesh.name = 'orbital_positive';
    posMesh.visible = showPositive;

    const negGeom = new THREE.BufferGeometry();
    negGeom.setAttribute('position', new THREE.BufferAttribute(negSurface.positions, 3));
    negGeom.setAttribute('normal', new THREE.BufferAttribute(negSurface.normals, 3));
    negGeom.setIndex(new THREE.BufferAttribute(negSurface.indices, 1));
    const negMesh = new THREE.Mesh(negGeom, orbitalMaterialNegative.clone());
    negMesh.name = 'orbital_negative';
    negMesh.visible = showNegative;

    this.meshCache.set(cacheKey, { pos: posMesh, neg: negMesh });

    if (showPositive) group.add(posMesh);
    if (showNegative) group.add(negMesh);

    return group;
  }

  clearCache(): void {
    this.meshCache.forEach(({ pos, neg }) => {
      pos.geometry.dispose();
      neg.geometry.dispose();
      (pos.material as THREE.Material).dispose();
      (neg.material as THREE.Material).dispose();
    });
    this.meshCache.clear();
    this.mcCache.clear();
  }
}
