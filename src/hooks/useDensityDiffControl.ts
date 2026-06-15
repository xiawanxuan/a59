import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMoleculeStore } from '@/stores/useMoleculeStore';
import type { DensityDiffMode } from '@/types';
import eventBus from '@/bus/EventBus';
import { GaussianParser } from '@/parser/GaussianParser';
import { DensityDiffEngine } from '@/core/DensityDiffEngine';

export function useDensityDiffControl() {
  const {
    reactantMolecule,
    productMolecule,
    densityDiffConfig,
    densityDiffResult,
    selectedOrbitalIndex,
    setReactantMolecule,
    setProductMolecule,
    setDensityDiffMode,
    setDensityDiffConfig,
    setDensityDiffResult,
    setLoading,
    setProgress,
  } = useMoleculeStore();

  const computeRef = useRef(0);

  const mode = densityDiffConfig.mode;
  const isActive = mode !== 'off' && !!reactantMolecule && !!productMolecule;

  const recompute = useCallback(() => {
    if (!reactantMolecule || !productMolecule) {
      setDensityDiffResult(null);
      return;
    }
    if (mode === 'off') {
      setDensityDiffResult(null);
      return;
    }
    const token = ++computeRef.current;
    const capturedMode = mode;
    queueMicrotask(() => {
      if (token !== computeRef.current) return;
      const effectiveMode: 'orbital' | 'total' = capturedMode;
      const result = DensityDiffEngine.compute(
        reactantMolecule,
        productMolecule,
        selectedOrbitalIndex,
        { ...densityDiffConfig, mode: effectiveMode }
      );
      if (token === computeRef.current) {
        setDensityDiffResult(result);
      }
    });
  }, [
    reactantMolecule,
    productMolecule,
    selectedOrbitalIndex,
    densityDiffConfig,
    mode,
    setDensityDiffResult,
  ]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  const toggleMode = useCallback(
    (next: DensityDiffMode) => {
      setDensityDiffMode(next);
      eventBus.emit('densitydiff:modeChanged' as any, next as any);
    },
    [setDensityDiffMode]
  );

  const cycleMode = useCallback(() => {
    const order: DensityDiffMode[] = ['off', 'orbital', 'total'];
    const i = order.indexOf(mode);
    toggleMode(order[(i + 1) % order.length]);
  }, [mode, toggleMode]);

  const loadReactantFromLog = useCallback(
    async (file: File) => {
      setLoading(true);
      setProgress(0);
      try {
        const text = await file.text();
        const parser = new GaussianParser();
        const data = parser.parse(text);
        setReactantMolecule(data.molecule);
        eventBus.emit('densitydiff:reactantLoaded', data.molecule);
        setProgress(1);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setProgress, setReactantMolecule]
  );

  const loadProductFromLog = useCallback(
    async (file: File) => {
      setLoading(true);
      setProgress(0);
      try {
        const text = await file.text();
        const parser = new GaussianParser();
        const data = parser.parse(text);
        setProductMolecule(data.molecule);
        eventBus.emit('densitydiff:productLoaded', data.molecule);
        setProgress(1);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setProgress, setProductMolecule]
  );

  const updateArrowScale = useCallback(
    (v: number) => setDensityDiffConfig({ arrowScale: v }),
    [setDensityDiffConfig]
  );
  const updateMinMagnitude = useCallback(
    (v: number) => {
      setDensityDiffConfig({ minMagnitude: v });
      eventBus.emit('densitydiff:thresholdChanged' as any, v as any);
    },
    [setDensityDiffConfig]
  );
  const toggleShowGain = useCallback(
    () => setDensityDiffConfig({ showGain: !densityDiffConfig.showGain }),
    [densityDiffConfig.showGain, setDensityDiffConfig]
  );
  const toggleShowLoss = useCallback(
    () => setDensityDiffConfig({ showLoss: !densityDiffConfig.showLoss }),
    [densityDiffConfig.showLoss, setDensityDiffConfig]
  );
  const clearDiff = useCallback(() => {
    setReactantMolecule(null);
    setProductMolecule(null);
    setDensityDiffResult(null);
    toggleMode('off');
  }, [setReactantMolecule, setProductMolecule, setDensityDiffResult, toggleMode]);

  const stats = useMemo(() => {
    if (!densityDiffResult) return null;
    return {
      arrowCount: densityDiffResult.arrows.length,
      netTransfer: densityDiffResult.netTransfer,
      maxMagnitude: densityDiffResult.maxMagnitude,
      topGains: densityDiffResult.atomDeltas
        .filter((d) => d.delta > 0)
        .slice(0, 3),
      topLosses: densityDiffResult.atomDeltas
        .filter((d) => d.delta < 0)
        .slice(0, 3),
    };
  }, [densityDiffResult]);

  return {
    mode,
    isActive,
    config: densityDiffConfig,
    result: densityDiffResult,
    reactantMolecule,
    productMolecule,
    stats,
    toggleMode,
    cycleMode,
    loadReactantFromLog,
    loadProductFromLog,
    updateArrowScale,
    updateMinMagnitude,
    toggleShowGain,
    toggleShowLoss,
    clearDiff,
    recompute,
  };
}
