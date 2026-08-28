import React, { useState, useEffect } from 'react';
import {
  X,
  Touchpad,
  MousePointer,
  Sparkles,
  Check,
  Zap,
  Sliders,
  Scan,
  UtensilsCrossed,
  Pill,
  Shirt,
  Briefcase,
  Monitor,
  Tablet,
  Smartphone,
  Keyboard,
  Info,
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
  segment = 'RESTAURANT_BAR',
}) => {
  const [autoDetect, setAutoDetect] = useState<boolean>(() => {
    return localStorage.getItem('pulse_pos_auto_mode') === 'true';
  });

  const [soundFeedback, setSoundFeedback] = useState<boolean>(() => {
    return localStorage.getItem('pulse_pos_sound_feedback') !== 'false';
  });

  const [virtualKeyboardAuto, setVirtualKeyboardAuto] = useState<boolean>(() => {
    return localStorage.getItem('pulse_pos_virtual_kbd_auto') !== 'false';
  });

  // Device Hardware Capability Check
  const hasTouchHardware =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0));

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

  const handleModeChoice = (mode: 'TOUCH' | 'CLICK') => {
    setAutoDetect(false);
    localStorage.setItem('pulse_pos_auto_mode', 'false');
    onSelectMode(mode);
  };

  const handleAutoDetectToggle = () => {
    const nextAuto = !autoDetect;
    setAutoDetect(nextAuto);
    localStorage.setItem('pulse_pos_auto_mode', nextAuto ? 'true' : 'false');
    if (nextAuto) {
      const detected = hasTouchHardware ? 'TOUCH' : 'CLICK';
      onSelectMode(detected);
    }
  };

  const toggleSound = () => {
    const next = !soundFeedback;
    setSoundFeedback(next);
    localStorage.setItem('pulse_pos_sound_feedback', next ? 'true' : 'false');
  };

  const toggleVirtualKbd = () => {
    const next = !virtualKeyboardAuto;
    setVirtualKeyboardAuto(next);
    localStorage.setItem('pulse_pos_virtual_kbd_auto', next ? 'true' : 'false');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden font-mono text-slate-200 text-xs flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Seletor de Modo de Interação
              </h2>
              <p className="text-[11px] text-slate-400">
                Ajuste ergonómico do terminal • Sem recarregar nem quebrar o estado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* HARDWARE TELEMETRY BANNER */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-slate-400">Hardware Detetado: </span>
                <strong className="text-slate-200">
                  {hasTouchHardware ? 'Ecrã Tátil (Touchscreen Ativo)' : 'Desktop / Teclado & Rato'}
                </strong>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                hasTouchHardware
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {hasTouchHardware ? 'Touch Ready' : 'Laser Ready'}
            </span>
          </div>

          {/* DYNAMIC MODE CHOICES (THE 2 MAIN CARDS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. MODO TÁTIL */}
            <div
              onClick={() => handleModeChoice('TOUCH')}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative flex flex-col justify-between ${
                currentMode === 'TOUCH' && !autoDetect
                  ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/50'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              {currentMode === 'TOUCH' && !autoDetect && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}

              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
                  <Touchpad className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  Modo Tátil (Touch)
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Grandes botões (48px+), categorias visuais, modificadores de cozinha com 1 toque e numpad tátil.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-amber-400/90 font-semibold">
                <span>Ideal: Restaurantes, Cafés, Bares & Tablets</span>
              </div>
            </div>

            {/* 2. MODO CLICK & SCANNER */}
            <div
              onClick={() => handleModeChoice('CLICK')}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative flex flex-col justify-between ${
                currentMode === 'CLICK' && !autoDetect
                  ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/50'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              {currentMode === 'CLICK' && !autoDetect && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-bold">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
              )}

              <div>
                <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 mb-3">
                  <MousePointer className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  Modo Click & Scanner
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tabela densa de produtos, foco automático no leitor laser de códigos de barras e comandos de teclado.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-sky-400/90 font-semibold">
                <span>Ideal: Supermercados, Farmácias & Desktops</span>
              </div>
            </div>

          </div>

          {/* AUTO-DETECT TOGGLE CARD */}
          <div
            onClick={handleAutoDetectToggle}
            className={`cursor-pointer rounded-xl p-3.5 border transition-all flex items-center justify-between ${
              autoDetect
                ? 'bg-emerald-950/40 border-emerald-500/70 shadow-md'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Deteção Automática Inteligente (Auto-Sense)</span>
                  {autoDetect && (
                    <span className="bg-emerald-500/30 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded font-bold">
                      ATIVO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Seleciona o modo ideal avaliando os sensores do dispositivo e periféricos conectados.
                </p>
              </div>
            </div>

            <div
              className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 flex items-center ${
                autoDetect ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>

          {/* SEGMENT RECOMMENDATIONS GUIDE */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Recomendações por Segmento de Negócio
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-white font-bold block">Restaurante / Bar</span>
                  <span className="text-slate-400 text-[10px]">Recomendado: Modo Tátil</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <Pill className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <div>
                  <span className="text-white font-bold block">Farmácia & Saúde</span>
                  <span className="text-slate-400 text-[10px]">Recomendado: Click / Scanner</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <Shirt className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <span className="text-white font-bold block">Retalho / Moda</span>
                  <span className="text-slate-400 text-[10px]">Híbrido: Tátil ou Scanner</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div>
                  <span className="text-white font-bold block">Serviços & Geral</span>
                  <span className="text-slate-400 text-[10px]">Recomendado: Modo Click</span>
                </div>
              </div>
            </div>
          </div>

          {/* ERGONOMIC AUTOMATION PREFERENCES */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Ergonomia & Automação do Operador
            </span>
            <div className="space-y-2 text-[11px]">
              
              <div
                onClick={toggleVirtualKbd}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer hover:bg-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Teclado virtual automático em campos de texto</span>
                </div>
                <div
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                    virtualKeyboardAuto ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
              </div>

              <div
                onClick={toggleSound}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer hover:bg-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bip sonoro e feedback de toque em leituras e botões</span>
                </div>
                <div
                  className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                    soundFeedback ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Atalho rápido no POS: <strong className="text-slate-300">[F8]</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg transition-all active:scale-95 shadow-md text-xs"
          >
            Aplicar & Continuar
          </button>
        </div>

      </div>
    </div>
  );
};
