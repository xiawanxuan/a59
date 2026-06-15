import * as THREE from 'three';
import type { Atom, Bond, Molecule } from '@/types';
import {
  BOND_RADIUS,
  atomMaterial,
  bondMaterial,
  highlightMaterial,
  getElementColor,
  getElementRadius,
} from '@/config/materials';

export class MoleculeRenderer {
  private molecule: Molecule;
  private atomMeshes: Map<number, THREE.Mesh> = new Map();
  private bondMeshes: THREE.Object3D[] = [];
  private atomSphereGeo = new THREE.SphereGeometry(1, 32, 24);
  private bondCylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16);

  constructor(molecule: Molecule) {
    this.molecule = molecule;
  }

  buildAtomMesh(atom: Atom): THREE.Mesh {
    const material = atomMaterial.clone();
    material.color = getElementColor(atom.element);
    const mesh = new THREE.Mesh(this.atomSphereGeo, material);
    const radius = getElementRadius(atom.element);
    mesh.scale.setScalar(radius);
    mesh.position.set(atom.position.x, atom.position.y, atom.position.z);
    mesh.userData.atomIndex = atom.index;
    mesh.userData.element = atom.element;
    return mesh;
  }

  buildBondMesh(bond: Bond): THREE.Object3D {
    const group = new THREE.Group();
    const a1 = this.molecule.atoms[bond.atomIndex1];
    const a2 = this.molecule.atoms[bond.atomIndex2];
    if (!a1 || !a2) return group;

    const start = new THREE.Vector3(a1.position.x, a1.position.y, a1.position.z);
    const end = new THREE.Vector3(a2.position.x, a2.position.y, a2.position.z);
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    const mat1 = bondMaterial.clone();
    mat1.color = getElementColor(a1.element).clone().lerp(getElementColor(a2.element), 0.3);
    const cyl1 = new THREE.Mesh(this.bondCylinderGeo, mat1);
    cyl1.scale.set(BOND_RADIUS, length / 2, BOND_RADIUS);
    cyl1.position.copy(new THREE.Vector3().addVectors(start, mid).multiplyScalar(0.5).add(mid.clone().multiplyScalar(0.5)).sub(start).multiplyScalar(0.5).add(start));
    cyl1.lookAt(end);
    cyl1.rotateX(Math.PI / 2);

    const mat2 = bondMaterial.clone();
    mat2.color = getElementColor(a2.element).clone().lerp(getElementColor(a1.element), 0.3);
    const cyl2 = new THREE.Mesh(this.bondCylinderGeo, mat2);
    cyl2.scale.set(BOND_RADIUS, length / 2, BOND_RADIUS);
    const pos2 = new THREE.Vector3().addVectors(mid, end).multiplyScalar(0.5);
    cyl2.position.copy(pos2);
    cyl2.lookAt(end);
    cyl2.rotateX(Math.PI / 2);

    group.add(cyl1, cyl2);
    group.userData.bond = bond;
    return group;
  }

  buildMolecule(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'molecule';
    this.atomMeshes.clear();
    this.bondMeshes = [];

    const atomsGroup = new THREE.Group();
    atomsGroup.name = 'atoms';
    for (const atom of this.molecule.atoms) {
      const mesh = this.buildAtomMesh(atom);
      this.atomMeshes.set(atom.index, mesh);
      atomsGroup.add(mesh);
    }
    group.add(atomsGroup);

    const bondsGroup = new THREE.Group();
    bondsGroup.name = 'bonds';
    for (const bond of this.molecule.bonds) {
      const bondMesh = this.buildBondMesh(bond);
      this.bondMeshes.push(bondMesh);
      bondsGroup.add(bondMesh);
    }
    group.add(bondsGroup);

    return group;
  }

  setAtomVisibility(atomIndex: number, visible: boolean): void {
    const mesh = this.atomMeshes.get(atomIndex);
    if (mesh) mesh.visible = visible;
    for (const bm of this.bondMeshes) {
      const bond: Bond = bm.userData.bond;
      if (bond.atomIndex1 === atomIndex || bond.atomIndex2 === atomIndex) {
        const a1vis = this.atomMeshes.get(bond.atomIndex1)?.visible ?? true;
        const a2vis = this.atomMeshes.get(bond.atomIndex2)?.visible ?? true;
        bm.visible = a1vis && a2vis;
      }
    }
  }

  setElementVisibility(element: string, visible: boolean): void {
    for (const [idx, mesh] of this.atomMeshes) {
      if (mesh.userData.element === element) {
        mesh.visible = visible;
      }
    }
    for (const bm of this.bondMeshes) {
      const bond: Bond = bm.userData.bond;
      const a1 = this.molecule.atoms[bond.atomIndex1];
      const a2 = this.molecule.atoms[bond.atomIndex2];
      const a1vis = this.atomMeshes.get(bond.atomIndex1)?.visible ?? true;
      const a2vis = this.atomMeshes.get(bond.atomIndex2)?.visible ?? true;
      bm.visible = a1vis && a2vis;
    }
  }

  highlightAtoms(atomIndices: number[]): void {
    for (const [idx, mesh] of this.atomMeshes) {
      if (atomIndices.includes(idx)) {
        mesh.material = highlightMaterial.clone();
      } else {
        const mat = atomMaterial.clone();
        mat.color = getElementColor(mesh.userData.element);
        mesh.material = mat;
      }
    }
  }

  getAtomMesh(index: number): THREE.Mesh | undefined {
    return this.atomMeshes.get(index);
  }

  getAtomMeshes(): Map<number, THREE.Mesh> {
    return this.atomMeshes;
  }

  dispose(): void {
    this.atomMeshes.forEach((m) => (m.material as THREE.Material).dispose());
    this.atomMeshes.clear();
    this.bondMeshes.forEach((bm) => {
      bm.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.Material).dispose();
        }
      });
    });
    this.bondMeshes = [];
  }
}
