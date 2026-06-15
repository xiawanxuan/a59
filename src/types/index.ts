export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Atom {
  index: number;
  element: string;
  atomicNumber: number;
  position: Vec3;
}

export interface Bond {
  atomIndex1: number;
  atomIndex2: number;
  order: number;
}

export interface BasisFunction {
  type: string;
  center: number;
  exponents: number[];
  coefficients: number[];
}

export interface BasisSet {
  name: string;
  functions: BasisFunction[];
}

export type OrbitalType = 'HOMO' | 'LUMO' | 'NORMAL';

export interface Orbital {
  index: number;
  energy: number;
  symmetry: string;
  occupied: boolean;
  coefficients: number[];
  type: OrbitalType;
}

export interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
  orbitals: Orbital[];
  basisSet: BasisSet | null;
  charge: number;
  multiplicity: number;
  homoIndex: number;
  lumoIndex: number;
}

export interface CameraState {
  position: Vec3;
  target: Vec3;
}

export interface ViewConfig {
  camera: CameraState;
  selectedOrbitalIndex: number;
  isovalue: number;
  showPositivePhase: boolean;
  showNegativePhase: boolean;
  hiddenAtomIndices: number[];
  hiddenElements: string[];
  highlightedAtomIndices: number[];
}

export interface ParsedGaussianData {
  molecule: Molecule;
  rawLog: string;
}

export interface GridPoint {
  value: number;
}

export interface IsosurfaceMesh {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

export type DensityDiffMode = 'off' | 'orbital' | 'total';

export interface ElectronTransferArrow {
  id: string;
  fromAtomIndex: number;
  toAtomIndex: number;
  from: Vec3;
  to: Vec3;
  chargeDelta: number;
  magnitude: number;
  direction: 'gain' | 'loss';
}

export interface AtomChargeDelta {
  atomIndex: number;
  delta: number;
  magnitude: number;
}

export interface DensityDiffConfig {
  mode: DensityDiffMode;
  arrowScale: number;
  minMagnitude: number;
  maxArrows: number;
  showGain: boolean;
  showLoss: boolean;
  headLengthRatio: number;
  shaftRadius: number;
}

export interface DensityDiffResult {
  arrows: ElectronTransferArrow[];
  atomDeltas: AtomChargeDelta[];
  netTransfer: number;
  maxMagnitude: number;
}

export const DEFAULT_DIFF_CONFIG: DensityDiffConfig = {
  mode: 'off',
  arrowScale: 1.2,
  minMagnitude: 0.01,
  maxArrows: 80,
  showGain: true,
  showLoss: true,
  headLengthRatio: 0.22,
  shaftRadius: 0.06,
};

export type EventName =
  | 'molecule:loaded'
  | 'orbital:changed'
  | 'orbital:isovalueChanged'
  | 'phase:visibilityChanged'
  | 'atom:hidden'
  | 'atom:shown'
  | 'atom:highlighted'
  | 'camera:changed'
  | 'config:export'
  | 'config:import'
  | 'densitydiff:modeChanged'
  | 'densitydiff:reactantLoaded'
  | 'densitydiff:productLoaded'
  | 'densitydiff:thresholdChanged';

export interface EventPayloadMap {
  'molecule:loaded': Molecule;
  'orbital:changed': number;
  'orbital:isovalueChanged': number;
  'phase:visibilityChanged': { positive: boolean; negative: boolean };
  'atom:hidden': number;
  'atom:shown': number;
  'atom:highlighted': number[];
  'camera:changed': CameraState;
  'config:export': void;
  'config:import': ViewConfig;
  'densitydiff:modeChanged': DensityDiffMode;
  'densitydiff:reactantLoaded': Molecule | null;
  'densitydiff:productLoaded': Molecule | null;
  'densitydiff:thresholdChanged': number;
}
