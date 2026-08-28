import React, { useState } from 'react';
import {
  Keyboard,
  Hash,
  Sparkles,
  Delete,
  CornerDownLeft,
  ArrowUp,
  X,
  Zap,
  Globe,
  Sliders,
  DollarSign,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { InputNormalizer } from '../engines/InputNormalizer';

interface UniversalVirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyPress?: (key: string) => void;
  currentInputText?: string;
  contextMode?: 'ALPHANUMERIC' | 'NUMPAD' | 'COMMANDS';
}

export const UniversalVirtualKeyboard: React.FC<UniversalVirtualKeyboardProps> = ({
  isOpen,
  onClose,
  onKeyPress,
  currentInputText = '',
  contextMode = 'ALPHANUMERIC',
}) => {
  const normalizer = InputNormalizer.getInstance();
  const [activeLayout, setActiveLayout] = useState<'ALPHANUMERIC' | 'NUMPAD' | 'SYMBOLS' | 'FKEYS'>(
    contextMode === 'NUMPAD' ? 'NUMPAD' : contextMode === 'COMMANDS' ? 'FKEYS' : 'ALPHANUMERIC'
  );
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCapsActive, setIsCapsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const handleKeyClick = (key: string, isSpecialAction = false) => {
    if (onKeyPress) {
      onKeyPress(key);
    }

    // Ingest into Universal Input Normalizer
    normalizer.ingestRawInput(key, 'TOUCH_VIRTUAL_KEYBOARD', 'COMMAND', {
      keyCombo: key,
    });

    if (isShiftActive && !isCapsActive) {
      setIsShiftActive(false);
    }
  };

  const alphaRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '@', '.', '-'],
  ];

  const symbolRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['*', '#', '+', '-', '/', '=', '%', '$', '&', '@'],
    ['.', ',', ':', ';', '_', '(', ')', '?', '!', '/'],
  ];

  const fKeys = [
    { key: 'F1', label: 'F1 (Ajuda)' },
    { key: 'F2', label: 'F2 (Venda)' },
    { key: 'F3', label: 'F3 (Compra)' },
    { key: 'F4', label: 'F4 (Recibo)' },
    { key: 'F5', label: 'F5 (Pagar)' },
    { key: 'F6', label: 'F6 (Cotação)' },
    { key: 'F7', label: 'F7 (Mesas)' },
    { key: 'F8', label: 'F8 (Lotes)' },
    { key: 'F9', label: 'F9 (Stock)' },
    { key: 'F10', label: 'F10 (Fiscal)' },
    { key: 'F11', label: 'F11 (RH)' },
    { key: 'F12', label: 'F12 (Devolução)' },
  ];

  return (
    <div
      id="universal-virtual-keyboard"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 border-t border-slate-700 shadow-2xl backdrop-blur-md p-2 text-white font-mono select-none animate-in slide-in-from-bottom-5"
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Top bar with input mode selectors */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" />
              Input Universal Layer
            </span>
            <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800 text-[10px]">
              <button
                onClick={() => setActiveLayout('ALPHANUMERIC')}
                className={`px-2 py-0.5 rounded ${
                  activeLayout === 'ALPHANUMERIC' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                A-Z Letras
              </button>
              <button
                onClick={() => setActiveLayout('NUMPAD')}
                className={`px-2 py-0.5 rounded ${
                  activeLayout === 'NUMPAD' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                123 Numpad
              </button>
              <button
                onClick={() => setActiveLayout('SYMBOLS')}
                className={`px-2 py-0.5 rounded ${
                  activeLayout === 'SYMBOLS' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                *# Símbolos
              </button>
              <button
                onClick={() => setActiveLayout('FKEYS')}
                className={`px-2 py-0.5 rounded ${
                  activeLayout === 'FKEYS' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                F1-F12 Comandos
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleKeyClick('*#7668#')}
              className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded text-[10px] flex items-center gap-1"
              title="Código Especial de Plataforma"
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span>*#7668#</span>
            </button>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 rounded"
              title="Fechar Teclado Virtual"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="space-y-1.5 pt-1">
            {/* ALPHANUMERIC LAYOUT */}
            {activeLayout === 'ALPHANUMERIC' && (
              <div className="space-y-1.5">
                {alphaRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {rIdx === 2 && (
                      <button
                        onClick={() => {
                          if (isShiftActive) {
                            setIsCapsActive(!isCapsActive);
                          } else {
                            setIsShiftActive(true);
                          }
                        }}
                        className={`w-12 h-10 rounded text-xs flex items-center justify-center border font-bold ${
                          isCapsActive
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : isShiftActive
                            ? 'bg-slate-700 text-emerald-400 border-slate-600'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                    )}
                    {row.map((k) => {
                      const displayChar = isShiftActive || isCapsActive ? k.toUpperCase() : k.toLowerCase();
                      return (
                        <button
                          key={k}
                          onClick={() => handleKeyClick(displayChar)}
                          className="flex-1 max-w-[54px] h-10 bg-slate-900 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-white rounded border border-slate-800 text-sm font-semibold flex items-center justify-center transition-colors shadow-sm"
                        >
                          {displayChar}
                        </button>
                      );
                    })}
                    {rIdx === 2 && (
                      <button
                        onClick={() => handleKeyClick('Backspace', true)}
                        className="w-12 h-10 bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-600 text-rose-300 rounded border border-rose-900/50 text-xs flex items-center justify-center shadow-sm"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                {/* Bottom Row */}
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => setActiveLayout('NUMPAD')}
                    className="w-16 h-10 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-xs font-bold"
                  >
                    123
                  </button>
                  <button
                    onClick={() => handleKeyClick('/')}
                    className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800 text-sm font-bold"
                  >
                    /
                  </button>
                  <button
                    onClick={() => handleKeyClick(' ')}
                    className="flex-1 max-w-[280px] h-10 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-800 text-xs font-medium"
                  >
                    ESPAÇO
                  </button>
                  <button
                    onClick={() => handleKeyClick('.')}
                    className="w-10 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded border border-slate-800 text-sm font-bold"
                  >
                    .
                  </button>
                  <button
                    onClick={() => handleKeyClick('Enter', true)}
                    className="w-24 h-10 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-slate-950 font-bold rounded text-xs flex items-center justify-center gap-1 shadow"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5" />
                    <span>ENTER</span>
                  </button>
                </div>
              </div>
            )}

            {/* NUMPAD / CASHIER LAYOUT */}
            {activeLayout === 'NUMPAD' && (
              <div className="grid grid-cols-4 gap-1.5 max-w-sm mx-auto">
                {['7', '8', '9', 'C'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyClick(k === 'C' ? 'Backspace' : k, k === 'C')}
                    className={`h-11 rounded border text-base font-bold flex items-center justify-center ${
                      k === 'C'
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800 hover:bg-rose-900'
                        : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950'
                    }`}
                  >
                    {k}
                  </button>
                ))}
                {['4', '5', '6', '/'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyClick(k)}
                    className="h-11 rounded border bg-slate-900 text-white border-slate-800 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-base font-bold flex items-center justify-center"
                  >
                    {k}
                  </button>
                ))}
                {['1', '2', '3', '*'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyClick(k)}
                    className="h-11 rounded border bg-slate-900 text-white border-slate-800 hover:bg-slate-800 active:bg-emerald-500 active:text-slate-950 text-base font-bold flex items-center justify-center"
                  >
                    {k}
                  </button>
                ))}
                {['0', '00', '.', 'Enter'].map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKeyClick(k, k === 'Enter')}
                    className={`h-11 rounded border text-base font-bold flex items-center justify-center ${
                      k === 'Enter'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold'
                        : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {k === 'Enter' ? 'ENT' : k}
                  </button>
                ))}
              </div>
            )}

            {/* SYMBOLS LAYOUT */}
            {activeLayout === 'SYMBOLS' && (
              <div className="space-y-1.5">
                {symbolRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {row.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleKeyClick(s)}
                        className="flex-1 max-w-[54px] h-10 bg-slate-900 hover:bg-slate-800 text-white rounded border border-slate-800 text-sm font-bold flex items-center justify-center"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => handleKeyClick('*#7668#')}
                    className="flex-1 max-w-[140px] h-10 bg-purple-900/40 text-purple-300 border border-purple-700/50 rounded text-xs font-bold"
                  >
                    *#7668# (Plat)
                  </button>
                  <button
                    onClick={() => handleKeyClick(' ')}
                    className="flex-1 max-w-[200px] h-10 bg-slate-900 text-slate-300 border border-slate-800 rounded text-xs"
                  >
                    ESPAÇO
                  </button>
                  <button
                    onClick={() => handleKeyClick('Enter', true)}
                    className="w-24 h-10 bg-emerald-600 text-slate-950 font-bold rounded text-xs"
                  >
                    ENTER
                  </button>
                </div>
              </div>
            )}

            {/* F1-F12 FUNCTION KEYS & SHORTCUTS */}
            {activeLayout === 'FKEYS' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-w-2xl mx-auto">
                {fKeys.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => handleKeyClick(f.key)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 text-left rounded border border-slate-800 hover:border-emerald-500/50 text-xs flex flex-col group transition-colors"
                  >
                    <span className="font-bold text-emerald-400 group-hover:text-white">{f.key}</span>
                    <span className="text-[10px] text-slate-400 truncate">{f.label.replace(/^[A-Z0-9]+\s*\(/, '').replace(/\)$/, '')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
