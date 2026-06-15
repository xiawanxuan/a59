import * as THREE from 'three';

export const CPK_COLORS: Record<string, number> = {
  H: 0xffffff,
  He: 0xd9ffff,
  Li: 0xcc80ff,
  Be: 0xc2ff00,
  B: 0xffb5b5,
  C: 0x404040,
  N: 0x3050f8,
  O: 0xff0d0d,
  F: 0x90e050,
  Ne: 0xb3e3f5,
  Na: 0xab5cf2,
  Mg: 0x8aff00,
  Al: 0xbfa6a6,
  Si: 0xf0c8a0,
  P: 0xff8000,
  S: 0xffff30,
  Cl: 0x1ff01f,
  Ar: 0x80d1e3,
  K: 0x8f40d4,
  Ca: 0x3dff00,
  Fe: 0xe06633,
  Cu: 0xc88033,
  Zn: 0x7d80b0,
  Br: 0xa62929,
  I: 0x940094,
};

export const ELEMENT_RADIUS: Record<string, number> = {
  H: 0.31,
  He: 0.28,
  Li: 1.28,
  Be: 0.96,
  B: 0.84,
  C: 0.76,
  N: 0.71,
  O: 0.66,
  F: 0.57,
  Ne: 0.58,
  Na: 1.66,
  Mg: 1.41,
  Al: 1.21,
  Si: 1.11,
  P: 1.07,
  S: 1.05,
  Cl: 1.02,
  Ar: 1.06,
  K: 2.03,
  Ca: 1.76,
  Fe: 1.32,
  Cu: 1.32,
  Zn: 1.22,
  Br: 1.20,
  I: 1.39,
};

export const DEFAULT_ATOM_RADIUS = 0.8;
export const BOND_RADIUS = 0.15;
export const BOND_MAX_LENGTH = 1.7;

export const PHASE_COLORS = {
  positive: new THREE.Color(0x38bdf8),
  negative: new THREE.Color(0xf97316),
};

export const HIGHLIGHT_COLOR = new THREE.Color(0xfacc15);

export const orbitalMaterialPositive = new THREE.MeshPhysicalMaterial({
  color: PHASE_COLORS.positive,
  transparent: true,
  opacity: 0.55,
  side: THREE.DoubleSide,
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.3,
  thickness: 0.5,
  depthWrite: false,
});

export const orbitalMaterialNegative = new THREE.MeshPhysicalMaterial({
  color: PHASE_COLORS.negative,
  transparent: true,
  opacity: 0.55,
  side: THREE.DoubleSide,
  roughness: 0.1,
  metalness: 0.1,
  transmission: 0.3,
  thickness: 0.5,
  depthWrite: false,
});

export const atomMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.35,
  metalness: 0.15,
});

export const bondMaterial = new THREE.MeshStandardMaterial({
  color: 0x555555,
  roughness: 0.6,
  metalness: 0.1,
});

export const highlightMaterial = new THREE.MeshStandardMaterial({
  color: HIGHLIGHT_COLOR,
  roughness: 0.2,
  metalness: 0.8,
  emissive: HIGHLIGHT_COLOR,
  emissiveIntensity: 0.4,
});

export function getElementColor(element: string): THREE.Color {
  const hex = CPK_COLORS[element] ?? 0x808080;
  return new THREE.Color(hex);
}

export function getElementRadius(element: string): number {
  return ELEMENT_RADIUS[element] ?? DEFAULT_ATOM_RADIUS;
}

export const ISOSURFACE_GRID_RESOLUTION = 0.25;
export const ISOSURFACE_GRID_PADDING = 2.5;
export const DEFAULT_ISOVALUE = 0.02;
