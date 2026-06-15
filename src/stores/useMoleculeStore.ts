import { create } from 'zustand';
import type {
  CameraState,
  DensityDiffConfig,
  DensityDiffMode,
  DensityDiffResult,
  Molecule,
  ViewConfig,
  Vec3,
} from '@/types';
import { DEFAULT_ISOVALUE } from '@/config/materials';

interface MoleculeState {
  molecule: Molecule | null;
  rawLog: string;
  selectedOrbitalIndex: number;
  isovalue: number;
  showPositivePhase: boolean;
  showNegativePhase: boolean;
  hiddenAtomIndices: number[];
  hiddenElements: string[];
  highlightedAtomIndices: number[];
  camera: CameraState;
  isLoading: boolean;
  parseProgress: number;

  reactantMolecule: Molecule | null;
  productMolecule: Molecule | null;
  densityDiffConfig: DensityDiffConfig;
  densityDiffResult: DensityDiffResult | null;

  setMolecule: (mol: Molecule, raw: string) => void;
  setOrbital: (index: number) => void;
  setIsovalue: (v: number) => void;
  setPhaseVisibility: (positive: boolean, negative: boolean) => void;
  hideAtom: (index: number) => void;
  showAtom: (index: number) => void;
  toggleElement: (element: string) => void;
  setHighlightedAtoms: (indices: number[]) => void;
  setCamera: (pos: Vec3, target: Vec3) => void;
  setLoading: (loading: boolean) => void;
  setProgress: (p: number) => void;
  importConfig: (config: ViewConfig) => void;
  getConfig: () => ViewConfig;
  reset: () => void;

  setReactantMolecule: (mol: Molecule | null) => void;
  setProductMolecule: (mol: Molecule | null) => void;
  setDensityDiffMode: (mode: DensityDiffMode) => void;
  setDensityDiffConfig: (partial: Partial<DensityDiffConfig>) => void;
  setDensityDiffResult: (result: DensityDiffResult | null) => void;
}

const defaultCamera: CameraState = {
  position: { x: 0, y: 0, z: 10 },
  target: { x: 0, y: 0, z: 0 },
};

export const useMoleculeStore = create<MoleculeState>((set, get) => ({
  molecule: null,
  rawLog: '',
  selectedOrbitalIndex: -1,
  isovalue: DEFAULT_ISOVALUE,
  showPositivePhase: true,
  showNegativePhase: true,
  hiddenAtomIndices: [],
  hiddenElements: [],
  highlightedAtomIndices: [],
  camera: defaultCamera,
  isLoading: false,
  parseProgress: 0,

  reactantMolecule: null,
  productMolecule: null,
  densityDiffConfig: {
    mode: 'off',
    arrowScale: 1.2,
    minMagnitude: 0.01,
    maxArrows: 80,
    showGain: true,
    showLoss: true,
    headLengthRatio: 0.22,
    shaftRadius: 0.06,
  },
  densityDiffResult: null,

  setMolecule: (mol, raw) =>
    set({
      molecule: mol,
      rawLog: raw,
      selectedOrbitalIndex: mol.homoIndex >= 0 ? mol.homoIndex : 0,
      hiddenAtomIndices: [],
      hiddenElements: [],
      highlightedAtomIndices: [],
    }),

  setOrbital: (index) => set({ selectedOrbitalIndex: index }),

  setIsovalue: (v) => set({ isovalue: v }),

  setPhaseVisibility: (positive, negative) =>
    set({ showPositivePhase: positive, showNegativePhase: negative }),

  hideAtom: (index) =>
    set((s) => ({
      hiddenAtomIndices: s.hiddenAtomIndices.includes(index)
        ? s.hiddenAtomIndices
        : [...s.hiddenAtomIndices, index],
    })),

  showAtom: (index) =>
    set((s) => ({
      hiddenAtomIndices: s.hiddenAtomIndices.filter((i) => i !== index),
    })),

  toggleElement: (element) =>
    set((s) => ({
      hiddenElements: s.hiddenElements.includes(element)
        ? s.hiddenElements.filter((e) => e !== element)
        : [...s.hiddenElements, element],
    })),

  setHighlightedAtoms: (indices) => set({ highlightedAtomIndices: indices }),

  setCamera: (position, target) => set({ camera: { position, target } }),

  setLoading: (loading) => set({ isLoading: loading }),

  setProgress: (p) => set({ parseProgress: p }),

  importConfig: (config) =>
    set({
      selectedOrbitalIndex: config.selectedOrbitalIndex,
      isovalue: config.isovalue,
      showPositivePhase: config.showPositivePhase,
      showNegativePhase: config.showNegativePhase,
      hiddenAtomIndices: config.hiddenAtomIndices,
      hiddenElements: config.hiddenElements,
      highlightedAtomIndices: config.highlightedAtomIndices,
      camera: config.camera,
    }),

  getConfig: () => {
    const s = get();
    return {
      camera: s.camera,
      selectedOrbitalIndex: s.selectedOrbitalIndex,
      isovalue: s.isovalue,
      showPositivePhase: s.showPositivePhase,
      showNegativePhase: s.showNegativePhase,
      hiddenAtomIndices: s.hiddenAtomIndices,
      hiddenElements: s.hiddenElements,
      highlightedAtomIndices: s.highlightedAtomIndices,
    };
  },

  reset: () =>
    set({
      molecule: null,
      rawLog: '',
      selectedOrbitalIndex: -1,
      isovalue: DEFAULT_ISOVALUE,
      showPositivePhase: true,
      showNegativePhase: true,
      hiddenAtomIndices: [],
      hiddenElements: [],
      highlightedAtomIndices: [],
      camera: defaultCamera,
      isLoading: false,
      parseProgress: 0,
      reactantMolecule: null,
      productMolecule: null,
      densityDiffResult: null,
      densityDiffConfig: {
        mode: 'off',
        arrowScale: 1.2,
        minMagnitude: 0.01,
        maxArrows: 80,
        showGain: true,
        showLoss: true,
        headLengthRatio: 0.22,
        shaftRadius: 0.06,
      },
    }),

  setReactantMolecule: (mol) => set({ reactantMolecule: mol, densityDiffResult: null }),
  setProductMolecule: (mol) =>
    set({
      productMolecule: mol,
      densityDiffResult: null,
      ...(mol ? { molecule: mol } : {}),
    }),
  setDensityDiffMode: (mode) =>
    set((s) => ({
      densityDiffConfig: { ...s.densityDiffConfig, mode },
      densityDiffResult: mode === 'off' ? null : s.densityDiffResult,
    })),
  setDensityDiffConfig: (partial) =>
    set((s) => ({
      densityDiffConfig: { ...s.densityDiffConfig, ...partial },
    })),
  setDensityDiffResult: (result) => set({ densityDiffResult: result }),
}));
