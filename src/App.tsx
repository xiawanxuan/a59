import React from 'react';
import Toolbar from '@/components/Toolbar';
import FileUploadPanel from '@/components/FileUploadPanel';
import OrbitalLevelPanel from '@/components/OrbitalLevelPanel';
import DensityDiffPanel from '@/components/DensityDiffPanel';
import MoleculeCanvas from '@/components/MoleculeCanvas';
import AtomFilterPanel from '@/components/AtomFilterPanel';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-80 flex flex-col bg-slate-900/70 border-r border-slate-700/50 shrink-0">
          <FileUploadPanel />
          <DensityDiffPanel />
        </aside>

        <main className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0">
            <MoleculeCanvas />
          </div>
          <div className="h-56 shrink-0 border-t border-slate-700/50 bg-slate-900/50 overflow-hidden">
            <OrbitalLevelPanel />
          </div>
        </main>

        <aside className="w-64 flex flex-col bg-slate-900/70 border-l border-slate-700/50 shrink-0">
          <AtomFilterPanel />
        </aside>
      </div>
    </div>
  );
};

export default App;
