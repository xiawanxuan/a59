import React, { useMemo } from 'react';
import { Star, ChevronUp, ChevronDown } from 'lucide-react';
import { useOrbitalControl } from '@/hooks/useOrbitalControl';

export const OrbitalLevelPanel: React.FC = () => {
  const {
    orbitals,
    selectedOrbitalIndex,
    selectOrbital,
    goToHOMO,
    goToLUMO,
    homoIndex,
    lumoIndex,
  } = useOrbitalControl();

  const displayOrbitals = useMemo(() => {
    if (orbitals.length === 0) return [];
    const minIdx = Math.max(0, homoIndex - 10);
    const maxIdx = Math.min(orbitals.length - 1, lumoIndex + 10);
    return orbitals.slice(minIdx, maxIdx + 1).map((o, i) => ({
      ...o,
      displayIndex: minIdx + i,
    }));
  }, [orbitals, homoIndex, lumoIndex]);

  if (orbitals.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-6">
        上传文件以查看轨道能级
      </div>
    );
  }

  const minE = Math.min(...displayOrbitals.map((o) => o.energy));
  const maxE = Math.max(...displayOrbitals.map((o) => o.energy));
  const range = maxE - minE || 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <span className="text-sm font-semibold text-slate-200 tracking-wide">轨道能级</span>
        <div className="flex gap-1">
          <button
            onClick={goToHOMO}
            disabled={homoIndex < 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40"
          >
            <ChevronUp size={12} />
            HOMO
          </button>
          <button
            onClick={goToLUMO}
            disabled={lumoIndex < 0}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 disabled:opacity-40"
          >
            LUMO
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {displayOrbitals.map((orb) => {
          const isSelected = orb.displayIndex === selectedOrbitalIndex;
          const isHOMO = orb.displayIndex === homoIndex;
          const isLUMO = orb.displayIndex === lumoIndex;
          const pct = ((orb.energy - minE) / range) * 100;
          return (
            <button
              key={orb.displayIndex}
              onClick={() => selectOrbital(orb.displayIndex)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-all ${
                isSelected
                  ? 'bg-sky-500/20 border border-sky-400/60 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                  : 'hover:bg-slate-700/40 border border-transparent'
              }`}
            >
              <div className="w-6 flex justify-center">
                {(isHOMO || isLUMO) && (
                  <Star
                    size={12}
                    className={isHOMO ? 'text-amber-400 fill-amber-400' : 'text-sky-400 fill-sky-400'}
                  />
                )}
              </div>
              <div
                className={`w-14 h-1 rounded ${
                  orb.occupied ? 'bg-emerald-400' : 'bg-slate-500'
                }`}
                style={{ marginLeft: `${pct * 0.4}%` }}
              />
              <div className="flex-1 font-mono text-slate-300">
                {orb.energy.toFixed(4)}
              </div>
              <div
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  orb.occupied
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-slate-600/30 text-slate-400'
                }`}
              >
                {orb.displayIndex + 1}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OrbitalLevelPanel;
