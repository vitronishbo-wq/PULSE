import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  MousePointer,
  ChevronDown,
  Sliders,
  Check,
  Zap,
  Scan,
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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle mode selection and close dropdown
  const handleSelect = (selectedMode: POSInteractionMode) => {
    onChangeMode(selectedMode);
    setIsOpen(false);
  };

  const isClickMode = mode === 'CLICK';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* TRIGGER COMPACTO: Uma única opção visível por vez, apenas com símbolos sem texto */}
      <div className="flex items-center gap-1 bg-[#121215] p-0.5 rounded-lg border border-[#27272a]">
        <button
          id="btn-pos-mode-selector-trigger"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          title={`Modo Atual: ${isClickMode ? 'Modo Click & Scanner (🖱️)' : 'Modo Tátil (💻)'} — Pressione [F8] para alternar`}
          className={`flex items-center justify-center gap-1 h-7 px-2 rounded-md transition-all cursor-pointer ${
            isClickMode
              ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/20 font-bold'
              : 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20 font-bold'
          }`}
        >
          {/* Símbolo do Modo Ativo (Apenas símbolo, sem texto) */}
          {isClickMode ? (
            <MousePointer className="w-3.5 h-3.5" />
          ) : (
            <Monitor className="w-3.5 h-3.5" />
          )}

          {/* Seta discreta do seletor */}
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 opacity-80 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* 🎛️ Ícone de Ajustes / Configurações Adicionais da Interface */}
        <button
          id="btn-pos-mode-settings"
          type="button"
          onClick={onOpenSettingsModal}
          title="Ajustes e configurações da interface (🎛️)"
          className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* LISTA DE OPÇÕES (Dropdown Popover) */}
      {isOpen && (
        <div
          id="pos-mode-dropdown-menu"
          className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-64 bg-[#18181b] border border-[#27272a] rounded-xl shadow-2xl z-50 p-2 space-y-1 font-sans text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Opção 1: 💻 Modo Tátil (Touch POS) */}
          <button
            type="button"
            onClick={() => handleSelect('TOUCH')}
            className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
              mode === 'TOUCH'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                : 'hover:bg-[#27272a] text-slate-300'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                mode === 'TOUCH'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-[#27272a] text-slate-400'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Modo Tátil</span>
                {mode === 'TOUCH' && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 font-normal">
                Uso com tela de toque, botões táteis ampliados e Numpad touch.
              </p>
            </div>
          </button>

          {/* Opção 2: 🖱️ Modo Click & Scanner (com Destaque em Azul 🔵) */}
          <button
            type="button"
            onClick={() => handleSelect('CLICK')}
            className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
              mode === 'CLICK'
                ? 'bg-sky-500/15 border border-sky-500/40 text-sky-300'
                : 'hover:bg-[#27272a] text-slate-300'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                mode === 'CLICK'
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm shadow-sky-500/30'
                  : 'bg-[#27272a] text-slate-400'
              }`}
            >
              <MousePointer className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">Modo Click & Scanner</span>
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" title="Destaque Azul" />
                </div>
                {mode === 'CLICK' && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 font-normal">
                Uso com mouse, teclado e leitor de código de barras laser.
              </p>
            </div>
          </button>

          {/* Footer do Seletor: Atalho [F8] e 🎛️ Ajustes */}
          <div className="pt-2 mt-1 border-t border-[#27272a] flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
            <div className="flex items-center gap-1">
              <span>Alternar:</span>
              <kbd className="px-1.5 py-0.5 bg-[#27272a] border border-[#3f3f46] rounded text-white font-bold">
                F8
              </kbd>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSettingsModal();
              }}
              className="flex items-center gap-1 text-slate-400 hover:text-white hover:underline cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>Ajustes</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
