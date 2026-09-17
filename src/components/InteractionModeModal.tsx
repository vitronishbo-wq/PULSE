import React, { useEffect } from 'react';
import {
  X,
  Touchpad,
  MousePointer,
  Check,
} from 'lucide-react';
import { BusinessSegment } from '../types/pulse';

export type InteractionMode = 'TOUCH' | 'CLICK' | 'AUTO';

interface InteractionModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: 'TOUCH' | 'CLICK';
  onSelectMode: (mode: 'TOUCH' | 'CLICK') => void;
  segment?: BusinessSegment;
}

export const InteractionModeModal: React.FC<InteractionModeModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (mode: 'TOUCH' | 'CLICK') => {
    onSelectMode(mode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#121216] border border-slate-800 rounded-2xl w-full max-w-xs shadow-2xl p-5 font-sans text-slate-200 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MINIMALISTA */}
        <div className="w-full flex items-center justify-end mb-2">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CARDS MINIMALISTAS (SÍMBOLO + PALAVRA "TÁTIL" OU "CLICK" DEBAIXO E MAIS NADA) */}
        <div className="grid grid-cols-2 gap-3 w-full my-2">
          {/* 1. TÁTIL */}
          <button
            type="button"
            onClick={() => handleSelect('TOUCH')}
            className={`group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border transition-all cursor-pointer select-none aspect-square ${
              currentMode === 'TOUCH'
                ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-950/50 ring-1 ring-amber-500/60 text-amber-400'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {currentMode === 'TOUCH' && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                currentMode === 'TOUCH'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 group-hover:text-amber-400'
              }`}
            >
              <Touchpad className="w-5 h-5" />
            </div>

            <span className="text-xs font-semibold tracking-wide">
              Tátil
            </span>
          </button>

          {/* 2. CLICK */}
          <button
            type="button"
            onClick={() => handleSelect('CLICK')}
            className={`group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl border transition-all cursor-pointer select-none aspect-square ${
              currentMode === 'CLICK'
                ? 'bg-sky-500/15 border-sky-500 shadow-lg shadow-sky-950/50 ring-1 ring-sky-500/60 text-sky-400'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {currentMode === 'CLICK' && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                currentMode === 'CLICK'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'bg-slate-800 text-slate-400 group-hover:text-sky-400'
              }`}
            >
              <MousePointer className="w-5 h-5" />
            </div>

            <span className="text-xs font-semibold tracking-wide">
              Click
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
