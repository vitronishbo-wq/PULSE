import React, { useState } from 'react';
import {
  Terminal,
  Mic,
  Keyboard,
  Barcode,
  Layers,
  Sparkles,
  Command,
  Search,
} from 'lucide-react';
import { UniversalCommandDef } from '../../types/platform';
import { initialUniversalCommands } from '../../data/platformSeedData';

interface AdminInputUniversalSectionProps {
  leafId: string;
}

export const AdminInputUniversalSection: React.FC<AdminInputUniversalSectionProps> = ({ leafId }) => {
  const [commands] = useState<UniversalCommandDef[]>(initialUniversalCommands);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommands = commands.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortcut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: INPUT PIPELINE SPEC */}
      {leafId === 'input_pipeline' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                Especificação do Pipeline Universal de Input Multimodal
              </h3>
              <p className="text-[11px] text-slate-400">Normalização unificada de Texto, Voz, Código de Barras e Atalhos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-center">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <Keyboard className="w-5 h-5 text-sky-400 mx-auto mb-1" />
              <div className="font-bold text-white text-xs">Atalhos (F2-F4)</div>
              <div className="text-[10px] text-slate-400 mt-1">Disparo síncrono ultra-rápido &lt;1ms</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <Barcode className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="font-bold text-white text-xs">Leitor Scanner</div>
              <div className="text-[10px] text-slate-400 mt-1">Detecção automática de prefixo/sufixo CR</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <Mic className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <div className="font-bold text-white text-xs">Voz & NLP</div>
              <div className="text-[10px] text-slate-400 mt-1">Reconhecimento em PT-AO via WebSpeech / AI</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <Command className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="font-bold text-white text-xs">Ctrl + K Gateway</div>
              <div className="text-[10px] text-slate-400 mt-1">Comandos inteligentes e roteamento global</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEAF: COMMAND REGISTRY & KEYBOARD SHORTCUTS */}
      {(leafId === 'command_registry' || leafId === 'keyboard_shortcuts' || leafId === 'voice_input') && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Command className="w-4 h-4 text-emerald-400" />
                Registo Canónico de Comandos Universais da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Atalhos físicos, gatilhos de voz e escopos operacionais</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Filtrar comandos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#252526] border border-[#3c3c3c] rounded pl-8 pr-2 py-1 text-[11px] text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Código Comando</th>
                  <th className="py-2.5 px-3">Atalho de Teclado</th>
                  <th className="py-2.5 px-3">Frases de Ativação por Voz (PT-AO)</th>
                  <th className="py-2.5 px-3">Escopo</th>
                  <th className="py-2.5 px-3">Descrição Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {filteredCommands.map((cmd) => (
                  <tr key={cmd.code} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{cmd.code}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1e1e1e] border border-[#3c3c3c] text-amber-300 font-mono shadow-sm">
                        {cmd.shortcut}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {cmd.voicePhrases.map((phrase, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/30"
                          >
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300">
                        {cmd.scope}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{cmd.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
