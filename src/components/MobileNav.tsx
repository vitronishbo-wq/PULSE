import React from 'react';
import { Home, Layers, Plus, FileSpreadsheet, Menu } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenSidebar: () => void;
  onOpenNewOperation: () => void;
  onOpenMenuDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenSidebar,
  onOpenNewOperation,
  onOpenMenuDrawer,
}) => {
  return (
    <nav
      id="pulse-mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-md border-t border-[#27272a] px-3 py-1.5 flex items-center justify-around text-slate-400 select-none shadow-2xl"
    >
      {/* 1. ⌂ Início / POS */}
      <button
        id="btn-mobile-nav-home"
        onClick={() => onSelectTab('POS')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
          activeTab === 'POS' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
        }`}
        title="POS / Início"
      >
        <Home className="w-5 h-5" />
        <span className="text-[9px] mt-0.5 font-mono">⌂</span>
      </button>

      {/* 2. ◫ Módulos / Árvore */}
      <button
        id="btn-mobile-nav-modules"
        onClick={onOpenSidebar}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:text-slate-200 transition-colors"
        title="Módulos & Árvore"
      >
        <Layers className="w-5 h-5" />
        <span className="text-[9px] mt-0.5 font-mono">◫</span>
      </button>

      {/* 3. ＋ Nova Operação (Destaque Central) */}
      <button
        id="btn-mobile-nav-new-op"
        onClick={onOpenNewOperation}
        className="flex items-center justify-center -mt-4 w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
        title="Nova Operação"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* 4. ▣ Documentos / Histórico */}
      <button
        id="btn-mobile-nav-docs"
        onClick={() => onSelectTab('DOCS')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
          activeTab === 'DOCS' ? 'text-emerald-400 font-bold' : 'hover:text-slate-200'
        }`}
        title="Documentos"
      >
        <FileSpreadsheet className="w-5 h-5" />
        <span className="text-[9px] mt-0.5 font-mono">▣</span>
      </button>

      {/* 5. ☰ Menu Secundário */}
      <button
        id="btn-mobile-nav-menu"
        onClick={onOpenMenuDrawer}
        className="flex flex-col items-center justify-center p-1.5 rounded-lg hover:text-slate-200 transition-colors"
        title="Menu Geral"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[9px] mt-0.5 font-mono">☰</span>
      </button>
    </nav>
  );
};
