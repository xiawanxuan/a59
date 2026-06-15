import React from 'react';
import { Eye, EyeOff, Highlighter, Eraser, Atom } from 'lucide-react';
import { useAtomSelection } from '@/hooks/useAtomSelection';
import { CPK_COLORS } from '@/config/materials';

const hexToRgb = (hex: number): string => {
  const r = ((hex >> 16) & 255).toString(16).padStart(2, '0');
  const g = ((hex >> 8) & 255).toString(16).padStart(2, '0');
  const b = (hex & 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

export const AtomFilterPanel: React.FC = () => {
  const {
    elementGroups,
    isElementHidden,
    toggleElementVisibility,
    highlightedAtomIndices,
    clearHighlights,
  } = useAtomSelection();

  if (elementGroups.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-slate-500 p-6">
        暂无原子数据
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-2 text-slate-200">
          <Atom size={16} />
          <span className="text-sm font-semibold tracking-wide">原子筛选</span>
        </div>
        <button
          onClick={clearHighlights}
          disabled={highlightedAtomIndices.length === 0}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-700/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          <Eraser size={12} />
          清除高亮 ({highlightedAtomIndices.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {elementGroups.map(({ element, count, indices }) => {
          const hidden = isElementHidden(element);
          const color = hexToRgb(CPK_COLORS[element] ?? 0x808080);
          return (
            <div
              key={element}
              className={`flex items-center gap-2 px-2 py-2 rounded border transition-all ${
                hidden
                  ? 'bg-slate-800/30 border-slate-700/40 opacity-60'
                  : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-inner"
                style={{ backgroundColor: color, color: '#000', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                {element}
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-200 font-medium">{element}</div>
                <div className="text-[10px] text-slate-500 font-mono">{count} 个原子</div>
              </div>
              <button
                onClick={() => toggleElementVisibility(element)}
                className="p-1.5 rounded hover:bg-slate-700/60 transition-colors"
                title={hidden ? '显示' : '隐藏'}
              >
                {hidden ? (
                  <EyeOff size={14} className="text-slate-500" />
                ) : (
                  <Eye size={14} className="text-sky-400" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-slate-700/50 text-[10px] text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5">
          <Highlighter size={10} />
          <span>点击画布上的原子进行高亮</span>
        </div>
        <div className="flex items-center gap-1.5">
          <EyeOff size={10} />
          <span>点击眼睛图标隐藏整个元素组</span>
        </div>
      </div>
    </div>
  );
};

export default AtomFilterPanel;
