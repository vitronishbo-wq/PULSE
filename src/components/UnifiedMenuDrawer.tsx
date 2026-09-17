import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Users,
  Sliders,
  LogOut,
  HelpCircle,
  Check,
  ChevronRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Keyboard,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { User } from '../types/pulse';
import { initialUsers } from '../data/seedData';

interface UnifiedMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onOpenSubscription?: () => void;
}

export const UnifiedMenuDrawer: React.FC<UnifiedMenuDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onOpenSubscription,
}) => {
  const [currentView, setCurrentView] = useState<'MAIN' | 'SWITCH_USER' | 'PREFERENCES' | 'HELP'>('MAIN');
  
  // Operator preferences local state
  const [scannerSound, setScannerSound] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [touchOptimized, setTouchOptimized] = useState(true);
  const [sessionLoggedOut, setSessionLoggedOut] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setCurrentView('MAIN');
    setSessionLoggedOut(false);
    onClose();
  };

  const handleSelectUser = (user: User) => {
    onUserChange(user);
    setCurrentView('MAIN');
    onClose();
  };

  const handleLogout = () => {
    setSessionLoggedOut(true);
    setTimeout(() => {
      // Pick first default operator or guest
      if (initialUsers.length > 0) {
        onUserChange(initialUsers[0]);
      }
      handleClose();
    }, 1200);
  };

  return (
    <div
      id="pulse-unified-menu-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm h-full bg-[#111114] border-l border-[#27272a] text-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Drawer do Operador */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#27272a] bg-[#16161a]">
          <div className="flex items-center gap-2">
            {currentView !== 'MAIN' ? (
              <button
                onClick={() => setCurrentView('MAIN')}
                className="p-1 -ml-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                  Menu do Operador
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[#27272a] text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {sessionLoggedOut ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="font-bold text-white text-base">Sessão Encerrada</div>
              <p className="text-xs text-slate-400">
                A bloquear terminal e a desautenticar operador...
              </p>
            </div>
          ) : currentView === 'MAIN' ? (
            <>
              {/* ➔ Operador Ativo Card */}
              <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 space-y-2.5">
                <div className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operador Ativo
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base font-mono shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-white truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono capitalize">
                      {currentUser.role ? currentUser.role.replace('_', ' ').toLowerCase() : 'Operador'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>ID: {currentUser.uid || 'OP-01'}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Autenticado
                  </span>
                </div>
              </div>

              {/* Ações do Operador */}
              <div className="space-y-1.5 pt-1">
                {/* ➔ Trocar operador */}
                <button
                  onClick={() => setCurrentView('SWITCH_USER')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#18181c] hover:bg-[#222227] border border-[#27272a] hover:border-slate-600 text-slate-200 transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-white">Trocar operador</div>
                      <div className="text-[10px] text-slate-400">Alternar utilizador ou turno de trabalho</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                {/* ➔ Perfil / Preferências */}
                <button
                  onClick={() => setCurrentView('PREFERENCES')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#18181c] hover:bg-[#222227] border border-[#27272a] hover:border-slate-600 text-slate-200 transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-white">Perfil / Preferências</div>
                      <div className="text-[10px] text-slate-400">Sons, interface táctil e atalhos</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                {/* ➔ Nova Subscrição / Ativação */}
                {onOpenSubscription && (
                  <button
                    onClick={() => {
                      handleClose();
                      onOpenSubscription();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-emerald-300">Nova Subscrição</div>
                        <div className="text-[10px] text-emerald-400/80">Ativação rápida assistida por perguntas</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  </button>
                )}

                {/* ➔ Ajuda */}
                <button
                  onClick={() => setCurrentView('HELP')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#18181c] hover:bg-[#222227] border border-[#27272a] hover:border-slate-600 text-slate-200 transition-colors cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-xs text-white">Ajuda</div>
                      <div className="text-[10px] text-slate-400">Guia de atalhos e assistência operacional</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>

                {/* ➔ Sessão / Sair */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-colors cursor-pointer group text-left mt-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-rose-300">Sessão / Sair</div>
                      <div className="text-[10px] text-rose-400/80">Bloquear terminal e terminar turno</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </>
          ) : currentView === 'SWITCH_USER' ? (
            /* Subview: Trocar Operador */
            <div className="space-y-3">
              <div className="text-[11px] text-slate-400 font-medium">
                Selecione o operador pretendido para assumir o terminal:
              </div>
              <div className="space-y-2">
                {initialUsers.map((u) => {
                  const isActive = u.uid === currentUser.uid;
                  return (
                    <button
                      key={u.uid}
                      onClick={() => handleSelectUser(u)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-emerald-500/15 border border-emerald-500/50 text-emerald-300 font-semibold'
                          : 'bg-[#18181c] hover:bg-[#222227] border border-[#27272a] text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono capitalize">
                            {u.role.replace('_', ' ').toLowerCase()}
                          </div>
                        </div>
                      </div>
                      {isActive ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          <Check className="w-3.5 h-3.5" />
                          <span>Atual</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Selecionar</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : currentView === 'PREFERENCES' ? (
            /* Subview: Perfil / Preferências */
            <div className="space-y-4">
              <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 space-y-3">
                <div className="text-[10px] text-purple-400 uppercase font-mono tracking-wider font-bold">
                  Preferências do Terminal
                </div>

                {/* Scanner Bips */}
                <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
                  <div className="flex items-center gap-2">
                    {scannerSound ? (
                      <Volume2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-500" />
                    )}
                    <div>
                      <div className="text-xs text-white">Sons de Leitura (Scanner)</div>
                      <div className="text-[10px] text-slate-400">Feedback sonoro ao ler códigos de barras</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setScannerSound(!scannerSound)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      scannerSound ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        scannerSound ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Touch Optimized */}
                <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs text-white">Modo Táctil Aumentado</div>
                      <div className="text-[10px] text-slate-400">Teclados numéricos e botões maiores</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setTouchOptimized(!touchOptimized)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      touchOptimized ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        touchOptimized ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Compact Mode */}
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs text-white">Vista Compacta de Itens</div>
                      <div className="text-[10px] text-slate-400">Maximiza artigos visíveis no ecrã</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setCompactMode(!compactMode)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      compactMode ? 'bg-purple-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                        compactMode ? 'left-5' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-[11px] text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>As preferências do operador são guardadas automaticamente no dispositivo.</span>
              </div>
            </div>
          ) : (
            /* Subview: Ajuda */
            <div className="space-y-3.5">
              <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3.5 space-y-3">
                <div className="text-[10px] text-amber-400 uppercase font-mono tracking-wider font-bold flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5" />
                  Atalhos de Teclado Rápidos
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
                    <span className="text-slate-300">Pesquisa Geral / Operações</span>
                    <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-amber-300">
                      Ctrl + K
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
                    <span className="text-slate-300">Focar Código de Barras / Scanner</span>
                    <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-amber-300">
                      F2
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
                    <span className="text-slate-300">Finalizar Venda (Pagamento)</span>
                    <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-amber-300">
                      F4 / Space
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#27272a]">
                    <span className="text-slate-300">Suspender / Retomar Venda</span>
                    <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-amber-300">
                      F7
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-300">Cancelar / Fechar Diálogos</span>
                    <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[10px] font-mono text-amber-300">
                      Esc
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                <div className="font-bold text-white">Suporte ao Operador</div>
                <div>Em caso de dúvidas operacionais ou anomalias fiscais, contacte a equipa de supervisão de caixa.</div>
              </div>
            </div>
          )}

        </div>

        {/* Footer do Drawer */}
        <div className="p-3 border-t border-[#27272a] bg-[#16161a] flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Terminal Operador</span>
          <span>v2.6</span>
        </div>
      </div>
    </div>
  );
};
