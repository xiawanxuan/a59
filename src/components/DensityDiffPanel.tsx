import React, { useRef } from 'react';
import {
  ArrowRight,
  Eraser,
  Eye,
  EyeOff,
  FlaskConical,
  GitCompare,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useDensityDiffControl } from '@/hooks/useDensityDiffControl';
import type { DensityDiffMode } from '@/types';

export const DensityDiffPanel: React.FC = () => {
  const {
    mode,
    isActive,
    config,
    reactantMolecule,
    productMolecule,
    stats,
    toggleMode,
    loadReactantFromLog,
    loadProductFromLog,
    updateArrowScale,
    updateMinMagnitude,
    toggleShowGain,
    toggleShowLoss,
    clearDiff,
  } = useDensityDiffControl();

  const reactantInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const modes: { id: DensityDiffMode; label: string; hint: string }[] = [
    { id: 'off', label: '关闭', hint: '不显示差值' },
    { id: 'orbital', label: '轨道', hint: '当前轨道密度差' },
    { id: 'total', label: '总密度', hint: '全部占据态密度差' },
  ];

  return (
    <div className="flex-1 flex flex-col border-t border-slate-700/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <GitCompare size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            电子密度差值
          </span>
        </div>
        {isActive && (
          <button
            onClick={clearDiff}
            title="清除反应对与差值"
            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition"
          >
            <Eraser size={13} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 px-4 py-4">
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            反应对文件
          </div>

          <label className="block">
            <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FlaskConical size={11} className="text-sky-400" />
              反应物 (Reactant)
            </div>
            <input
              ref={reactantInputRef}
              type="file"
              accept=".log,.out,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadReactantFromLog(f);
                e.target.value = '';
              }}
            />
            <div
              onClick={() => reactantInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) loadReactantFromLog(f);
              }}
              className={`cursor-pointer rounded-lg border-2 border-dashed transition-all px-3 py-2.5 flex items-center justify-between gap-2 ${
                reactantMolecule
                  ? 'border-sky-500/40 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
              }`}
            >
              <div className="min-w-0 flex-1">
                {reactantMolecule ? (
                  <>
                    <div className="text-[11px] font-mono text-sky-300 truncate">
                      {reactantMolecule.atoms.length} atoms · Q={reactantMolecule.charge}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {reactantMolecule.orbitals.length} MOs
                    </div>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-500">拖拽或点击上传 .log</span>
                )}
              </div>
              <Upload size={13} className="text-slate-500 shrink-0" />
            </div>
          </label>

          <div className="flex justify-center py-0.5">
            <ArrowRight size={12} className="text-slate-600" />
          </div>

          <label className="block">
            <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={11} className="text-orange-400" />
              产物 (Product)
            </div>
            <input
              ref={productInputRef}
              type="file"
              accept=".log,.out,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) loadProductFromLog(f);
                e.target.value = '';
              }}
            />
            <div
              onClick={() => productInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) loadProductFromLog(f);
              }}
              className={`cursor-pointer rounded-lg border-2 border-dashed transition-all px-3 py-2.5 flex items-center justify-between gap-2 ${
                productMolecule
                  ? 'border-orange-500/40 bg-orange-500/10'
                  : 'border-slate-700 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70'
              }`}
            >
              <div className="min-w-0 flex-1">
                {productMolecule ? (
                  <>
                    <div className="text-[11px] font-mono text-orange-300 truncate">
                      {productMolecule.atoms.length} atoms · Q={productMolecule.charge}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {productMolecule.orbitals.length} MOs
                    </div>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-500">拖拽或点击上传 .log</span>
                )}
              </div>
              <Upload size={13} className="text-slate-500 shrink-0" />
            </div>
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            差值模式
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleMode(m.id)}
                disabled={!reactantMolecule || !productMolecule}
                title={m.hint}
                className={`py-1.5 px-1 text-[11px] rounded border transition-all ${
                  mode === m.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            显示与阈值
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={toggleShowGain}
              className={`flex-1 py-1 px-2 text-[11px] rounded border flex items-center justify-center gap-1 ${
                config.showGain
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {config.showGain ? <Eye size={11} /> : <EyeOff size={11} />}
              得电子
            </button>
            <button
              onClick={toggleShowLoss}
              className={`flex-1 py-1 px-2 text-[11px] rounded border flex items-center justify-center gap-1 ${
                config.showLoss
                  ? 'bg-red-500/15 text-red-300 border-red-500/30'
                  : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {config.showLoss ? <Eye size={11} /> : <EyeOff size={11} />}
              失电子
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-400">箭尺度</span>
              <span className="text-[11px] text-slate-300 font-mono w-12 text-right">
                {config.arrowScale.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.05}
              value={config.arrowScale}
              onChange={(e) => updateArrowScale(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-slate-400">最小强度</span>
              <span className="text-[11px] text-slate-300 font-mono w-14 text-right">
                {config.minMagnitude.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min={0.002}
              max={0.1}
              step={0.002}
              value={config.minMagnitude}
              onChange={(e) => updateMinMagnitude(parseFloat(e.target.value))}
              className="w-full accent-emerald-400"
            />
          </div>
        </div>

        {stats && (
          <div className="space-y-2 border-t border-slate-800 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              差值统计
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="rounded bg-slate-800/60 px-2 py-1.5">
                <div className="text-slate-500">箭头数</div>
                <div className="text-slate-200 font-mono">{stats.arrowCount}</div>
              </div>
              <div className="rounded bg-slate-800/60 px-2 py-1.5">
                <div className="text-slate-500">净转移</div>
                <div className="text-slate-200 font-mono">
                  {stats.netTransfer.toFixed(3)} e
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500">Top 得电子:</div>
              {stats.topGains.length === 0 ? (
                <div className="text-[10px] text-slate-600 italic">无显著变化</div>
              ) : (
                stats.topGains.map((g) => (
                  <div
                    key={g.atomIndex}
                    className="flex justify-between text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <span className="text-emerald-300">Atom #{g.atomIndex}</span>
                    <span className="text-emerald-400">+{g.delta.toFixed(3)}</span>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-slate-500">Top 失电子:</div>
              {stats.topLosses.length === 0 ? (
                <div className="text-[10px] text-slate-600 italic">无显著变化</div>
              ) : (
                stats.topLosses.map((g) => (
                  <div
                    key={g.atomIndex}
                    className="flex justify-between text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 border border-red-500/20"
                  >
                    <span className="text-red-300">Atom #{g.atomIndex}</span>
                    <span className="text-red-400">{g.delta.toFixed(3)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DensityDiffPanel;
