import React from 'react';
import { Download, RotateCcw, Sun, Moon, CircleDot } from 'lucide-react';
import { useOrbitalControl } from '@/hooks/useOrbitalControl';
import { useMoleculeStore } from '@/stores/useMoleculeStore';
import { exportViewConfig } from '@/utils/exportConfig';
import eventBus from '@/bus/EventBus';

export const Toolbar: React.FC = () => {
  const { isovalue, updateIsovalue, showPositivePhase, showNegativePhase, togglePhase } =
    useOrbitalControl();
  const { molecule, getConfig, reset } = useMoleculeStore();

  const handleExport = () => {
    if (!molecule) return;
    const config = getConfig();
    exportViewConfig(config, `orbital-${Date.now()}.json`);
    eventBus.emit('config:export', undefined as any);
  };

  return (
    <div className="h-14 px-5 flex items-center gap-6 bg-slate-900/80 backdrop-blur border-b border-slate-700/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          ⚛
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-100 tracking-wide">MolOrbital Viewer</div>
          <div className="text-[10px] text-slate-500 font-mono">Gaussian Output Visualizer</div>
        </div>
      </div>

      <div className="h-8 w-px bg-slate-700/60" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CircleDot size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">等值阈值</span>
        </div>
        <input
          type="range"
          min={0.002}
          max={0.1}
          step={0.001}
          value={isovalue}
          onChange={(e) => updateIsovalue(parseFloat(e.target.value))}
          disabled={!molecule}
          className="w-40 accent-sky-400"
        />
        <span className="text-xs text-slate-300 font-mono w-14">{isovalue.toFixed(3)}</span>
      </div>

      <div className="h-8 w-px bg-slate-700/60" />

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400 mr-1">相位</span>
        <button
          onClick={() => togglePhase(!showPositivePhase, undefined)}
          disabled={!molecule}
          className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-all ${
            showPositivePhase
              ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          } disabled:opacity-40`}
        >
          <Sun size={12} />
          正
        </button>
        <button
          onClick={() => togglePhase(undefined, !showNegativePhase)}
          disabled={!molecule}
          className={`px-2.5 py-1 text-xs rounded flex items-center gap-1 transition-all ${
            showNegativePhase
              ? 'bg-orange-500/25 text-orange-300 border border-orange-400/40'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          } disabled:opacity-40`}
        >
          <Moon size={12} />
          负
        </button>
      </div>

      <div className="flex-1" />

      <button
        onClick={handleExport}
        disabled={!molecule}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Download size={13} />
        导出配置
      </button>

      <button
        onClick={reset}
        disabled={!molecule}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <RotateCcw size={13} />
        重置
      </button>
    </div>
  );
};

export default Toolbar;
