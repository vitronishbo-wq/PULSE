import React, { useState } from 'react';
import {
  X,
  PauseCircle,
  PlayCircle,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  User,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { CartItem, HeldCart } from './POSView';

interface POSHeldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldCarts: HeldCart[];
  currentCart: CartItem[];
  currentCartTotal: number;
  currentCustomerName: string;
  currency: string;
  currentUser: { name: string };
  onHoldCurrentCart: (note: string) => void;
  onResumeHeldCart: (heldCart: HeldCart) => void;
  onDeleteHeldCart: (heldId: string) => void;
}

export const POSHeldCartsModal: React.FC<POSHeldCartsModalProps> = ({
  isOpen,
  onClose,
  heldCarts = [],
  currentCart = [],
  currentCartTotal,
  currentCustomerName,
  currency,
  currentUser,
  onHoldCurrentCart,
  onResumeHeldCart,
  onDeleteHeldCart,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [holdNote, setHoldNote] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time search filter by reference ID, customer name or operator
  const filteredHeldCarts = heldCarts.filter((hc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      hc.id.toLowerCase().includes(q) ||
      hc.customerName.toLowerCase().includes(q) ||
      hc.operatorName.toLowerCase().includes(q) ||
      (hc.notes && hc.notes.toLowerCase().includes(q))
    );
  });

  const handleHoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCart.length === 0) return;
    onHoldCurrentCart(holdNote || `Venda suspensa por ${currentUser.name}`);
    setHoldNote('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-[#14141a] border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PauseCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Suspender / Retomar Venda
              </h3>
              <p className="text-[10px] text-slate-400">
                Gestão de atendimentos em espera e retomada de carrinhos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Suspender Venda Atual (se houver artigos no carrinho) */}
        {currentCart.length > 0 && (
          <form
            onSubmit={handleHoldSubmit}
            className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                <PauseCircle className="w-4 h-4" />
                Suspender Carrinho Ativo ({currentCart.length} artigos • {currentCartTotal.toLocaleString()} {currency})
              </span>
              <span className="text-[10px] text-slate-400">
                Cliente: {currentCustomerName}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Referência / Motivo (ex: Mesa 4, Foi levantar dinheiro, Troca de artigo)..."
                value={holdNote}
                onChange={(e) => setHoldNote(e.target.value)}
                className="flex-1 bg-slate-950 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer whitespace-nowrap shadow-md"
              >
                Suspender Venda
              </button>
            </div>
          </form>
        )}

        {/* 2. Pesquisa por Referência / Cliente / Operador */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar venda suspensa por ID, Cliente, Referência ou Operador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* 3. Lista de Vendas Suspensas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="font-bold uppercase">
              Lista de Vendas Suspensas ({filteredHeldCarts.length})
            </span>
            <span>Operador atual: {currentUser.name}</span>
          </div>

          {filteredHeldCarts.length === 0 ? (
            <div className="p-8 text-center bg-[#18181f] border border-slate-800 rounded-xl text-slate-500 text-xs">
              {searchQuery
                ? 'Nenhuma venda suspensa corresponde aos termos de pesquisa.'
                : 'Não há vendas suspensas em espera no momento.'}
            </div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {filteredHeldCarts.map((hc) => (
                <div
                  key={hc.id}
                  className="bg-[#18181f] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{hc.id}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                        {hc.timestamp}
                      </span>
                      <span className="text-[10px] text-slate-300 font-semibold truncate">
                        {hc.customerName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      <span className="text-amber-400/80">{hc.notes || 'Sem observações'}</span> • {hc.items.length} itens ({hc.items.map((i) => i.product.name).slice(0, 2).join(', ')}{hc.items.length > 2 ? '...' : ''})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 text-xs block font-mono">
                        {hc.total.toLocaleString()} {currency}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        Op: {hc.operatorName}
                      </span>
                    </div>

                    {confirmDeleteId === hc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            onDeleteHeldCart(hc.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {/* 4. Retomar */}
                        <button
                          onClick={() => onResumeHeldCart(hc)}
                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Retomar venda no carrinho do POS"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Retomar</span>
                        </button>

                        {/* 5. Cancelar venda suspensa */}
                        <button
                          onClick={() => setConfirmDeleteId(hc.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Cancelar e eliminar venda suspensa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
