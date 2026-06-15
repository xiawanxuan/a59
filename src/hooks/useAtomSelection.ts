import { useMemo, useCallback } from 'react';
import { useMoleculeStore } from '@/stores/useMoleculeStore';
import eventBus from '@/bus/EventBus';

export function useAtomSelection() {
  const {
    molecule,
    hiddenAtomIndices,
    hiddenElements,
    highlightedAtomIndices,
    hideAtom,
    showAtom,
    toggleElement,
    setHighlightedAtoms,
  } = useMoleculeStore();

  const elementGroups = useMemo(() => {
    if (!molecule) return [];
    const groups: Record<string, number[]> = {};
    for (const atom of molecule.atoms) {
      if (!groups[atom.element]) groups[atom.element] = [];
      groups[atom.element].push(atom.index);
    }
    return Object.entries(groups).map(([element, indices]) => ({
      element,
      indices,
      count: indices.length,
    }));
  }, [molecule]);

  const isAtomVisible = useCallback(
    (index: number): boolean => {
      if (hiddenAtomIndices.includes(index)) return false;
      const atom = molecule?.atoms[index];
      if (atom && hiddenElements.includes(atom.element)) return false;
      return true;
    },
    [molecule, hiddenAtomIndices, hiddenElements]
  );

  const isElementHidden = useCallback(
    (element: string): boolean => hiddenElements.includes(element),
    [hiddenElements]
  );

  const toggleAtomVisibility = useCallback(
    (index: number) => {
      if (hiddenAtomIndices.includes(index)) {
        showAtom(index);
        eventBus.emit('atom:shown', index);
      } else {
        hideAtom(index);
        eventBus.emit('atom:hidden', index);
      }
    },
    [hiddenAtomIndices, showAtom, hideAtom]
  );

  const toggleHighlightAtom = useCallback(
    (index: number, additive: boolean = false) => {
      let next: number[];
      if (additive) {
        next = highlightedAtomIndices.includes(index)
          ? highlightedAtomIndices.filter((i) => i !== index)
          : [...highlightedAtomIndices, index];
      } else {
        next = highlightedAtomIndices.includes(index) ? [] : [index];
      }
      setHighlightedAtoms(next);
      eventBus.emit('atom:highlighted', next);
    },
    [highlightedAtomIndices, setHighlightedAtoms]
  );

  const clearHighlights = useCallback(() => {
    setHighlightedAtoms([]);
    eventBus.emit('atom:highlighted', []);
  }, [setHighlightedAtoms]);

  return {
    elementGroups,
    hiddenAtomIndices,
    hiddenElements,
    highlightedAtomIndices,
    isAtomVisible,
    isElementHidden,
    toggleAtomVisibility,
    toggleElementVisibility: toggleElement,
    toggleHighlightAtom,
    clearHighlights,
  };
}
