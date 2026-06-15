import { useEffect, useCallback } from 'react';
import { useMoleculeStore } from '@/stores/useMoleculeStore';
import eventBus from '@/bus/EventBus';

export function useOrbitalControl() {
  const {
    molecule,
    selectedOrbitalIndex,
    isovalue,
    showPositivePhase,
    showNegativePhase,
    setOrbital,
    setIsovalue,
    setPhaseVisibility,
  } = useMoleculeStore();

  const selectOrbital = useCallback(
    (index: number) => {
      if (index >= 0 && molecule && index < molecule.orbitals.length) {
        setOrbital(index);
        eventBus.emit('orbital:changed', index);
      }
    },
    [molecule, setOrbital]
  );

  const updateIsovalue = useCallback(
    (v: number) => {
      setIsovalue(v);
      eventBus.emit('orbital:isovalueChanged', v);
    },
    [setIsovalue]
  );

  const togglePhase = useCallback(
    (positive?: boolean, negative?: boolean) => {
      const pos = positive ?? showPositivePhase;
      const neg = negative ?? showNegativePhase;
      setPhaseVisibility(pos, neg);
      eventBus.emit('phase:visibilityChanged', { positive: pos, negative: neg });
    },
    [showPositivePhase, showNegativePhase, setPhaseVisibility]
  );

  const goToHOMO = useCallback(() => {
    if (molecule && molecule.homoIndex >= 0) {
      selectOrbital(molecule.homoIndex);
    }
  }, [molecule, selectOrbital]);

  const goToLUMO = useCallback(() => {
    if (molecule && molecule.lumoIndex >= 0) {
      selectOrbital(molecule.lumoIndex);
    }
  }, [molecule, selectOrbital]);

  return {
    selectedOrbitalIndex,
    isovalue,
    showPositivePhase,
    showNegativePhase,
    orbitals: molecule?.orbitals ?? [],
    selectOrbital,
    updateIsovalue,
    togglePhase,
    goToHOMO,
    goToLUMO,
    homoIndex: molecule?.homoIndex ?? -1,
    lumoIndex: molecule?.lumoIndex ?? -1,
  };
}
