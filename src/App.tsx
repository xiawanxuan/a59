import React from 'react';
import Toolbar from '@/components/Toolbar';
import FileUploadPanel from '@/components/FileUploadPanel';
import OrbitalLevelPanel from '@/components/OrbitalLevelPanel';
import MoleculeCanvas from '@/components/MoleculeCanvas';
import AtomFilterPanel from '@/components/AtomFilterPanel';

const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 flex flex-col bg-slate-900/70 border-r border-slate-700/50 shrink-0">
          <FileUploadPanel />
          <OrbitalLevelPanel />
        </aside>

        <main className="flex-1 relative overflow-hidden">
          <MoleculeCanvas />
        </main>

        <aside className="w-64 flex flex-col bg-slate-900/70 border-l border-slate-700/50 shrink-0">
          <AtomFilterPanel />
        </aside>
      </div>
    </div>
  );
};

export default App;
