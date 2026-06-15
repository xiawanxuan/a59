import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { gaussianParser } from '@/parser/GaussianParser';
import { useMoleculeStore } from '@/stores/useMoleculeStore';
import eventBus from '@/bus/EventBus';

export const FileUploadPanel: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isLoading, parseProgress, setLoading, setProgress, setMolecule, molecule, rawLog } =
    useMoleculeStore();

  const parseFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoading(true);
      setProgress(0);
      try {
        const text = await file.text();
        setProgress(50);
        const result = gaussianParser.parse(text);
        setProgress(90);
        if (result.molecule.atoms.length === 0) {
          throw new Error('未能解析到分子结构，请检查文件格式');
        }
        setMolecule(result.molecule, result.rawLog);
        eventBus.emit('molecule:loaded', result.molecule);
        setProgress(100);
      } catch (err) {
        setError(err instanceof Error ? err.message : '解析失败');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setProgress, setMolecule]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-slate-700/50">
      <div className="flex items-center gap-2 text-slate-200">
        <FileText size={16} />
        <span className="text-sm font-semibold tracking-wide">Gaussian 文件</span>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer border-2 border-dashed rounded-lg p-4 text-center transition-all select-none ${
          isDragging
            ? 'border-sky-400 bg-sky-500/10'
            : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".log,.out,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={24} className="text-sky-400 animate-spin" />
            <span className="text-xs text-slate-400">解析中 {parseProgress}%</span>
            <div className="w-full h-1 bg-slate-700 rounded overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all"
                style={{ width: `${parseProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1">
            <Upload size={20} className="text-slate-400" />
            <span className="text-xs text-slate-300">点击或拖拽 .log / .out 文件</span>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-2 py-1.5 rounded">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {molecule && (
        <div className="text-xs text-slate-400 space-y-1 pt-1">
          <div className="flex justify-between">
            <span>原子数</span>
            <span className="text-slate-200 font-mono">{molecule.atoms.length}</span>
          </div>
          <div className="flex justify-between">
            <span>轨道数</span>
            <span className="text-slate-200 font-mono">{molecule.orbitals.length}</span>
          </div>
          <div className="flex justify-between">
            <span>电荷 / 多重度</span>
            <span className="text-slate-200 font-mono">
              {molecule.charge} / {molecule.multiplicity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadPanel;
