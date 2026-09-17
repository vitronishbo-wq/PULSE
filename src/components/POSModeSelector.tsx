import React from 'react';
import {
  Touchpad,
  MousePointer,
  Sliders,
} from 'lucide-react';
import { POSInteractionMode } from './POSView';

interface POSModeSelectorProps {
  mode: POSInteractionMode;
  onChangeMode: (mode: POSInteractionMode) => void;
  onOpenSettingsModal: () => void;
}

export const POSModeSelector: React.FC<POSModeSelectorProps> = ({
  mode,
  onChangeMode,
  onOpenSettingsModal,
}) => {
  return (
    <div className="flex items-center gap-1 bg-[#101015] p-1 rounded-xl border border-slate-800 shadow-sm">
      {/* 1. Botão Estético: Tátil */}
      <button
        id="btn-pos-mode-touch"
        type="button"
        onClick={() => onChangeMode('TOUCH')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
          mode === 'TOUCH'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
        }`}
        title="Modo Tátil (Touch POS) — [F8]"
      >
        <Touchpad className="w-3.5 h-3.5" />
        <span>Tátil</span>
      </button>

      {/* 2. Botão Estético: Click */}
      <button
        id="btn-pos-mode-click"
        type="button"
        onClick={() => onChangeMode('CLICK')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none ${
          mode === 'CLICK'
            ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium'
        }`}
        title="Modo Click & Scanner — [F8]"
      >
        <MousePointer className="w-3.5 h-3.5" />
        <span>Click</span>
      </button>

      {/* Ajustes / Modal */}
      <button
        id="btn-pos-mode-settings"
        type="button"
        onClick={onOpenSettingsModal}
        title="Ajustes de Interação"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors cursor-pointer ml-0.5"
      >
        <Sliders className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
