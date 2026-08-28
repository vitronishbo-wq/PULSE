import React, { useState, useMemo } from 'react';
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  User,
  Tag,
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  Receipt,
  FileText,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { CartItem, HeldCart } from './POSView';
import { TenantProfile } from '../types/pulse';

interface HeldCartsViewProps {
  heldCarts: HeldCart[];
  currentCart?: CartItem[];
  currentCartTotal?: number;
  currentCustomerName?: string;
  currency: string;
  currentUser: { name: string };
  onHoldCurrentCart: (note: string) => void;
  onResumeHeldCart: (heldCart: HeldCart) => void;
  onDeleteHeldCart: (heldId: string) => void;
  onNavigateToPOS: () => void;
}

export const HeldCartsView: React.FC<HeldCartsViewProps> = ({
  heldCarts = [],
  currentCart = [],
  currentCartTotal = 0,
  currentCustomerName = 'Consumidor Final',
  currency,
  currentUser,
  onHoldCurrentCart,
  onResumeHeldCart,
  onDeleteHeldCart,
  onNavigateToPOS,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [holdNote, setHoldNote] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filtered Held Carts
  const filteredHeldCarts = useMemo(() => {
    if (!searchQuery.trim()) return heldCarts;
    const q = searchQuery.toLowerCase();
    return heldCarts.filter(
      (hc) =>
        hc.id.toLowerCase().includes(q) ||
        hc.customerName.toLowerCase().includes(q) ||
        hc.operatorName.toLowerCase().includes(q) ||
        (hc.notes && hc.notes.toLowerCase().includes(q))
    );
  }, [heldCarts, searchQuery]);

  const handleHoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCart.length === 0) return;
    const note = holdNote.trim() || `Venda suspensa por ${currentUser.name}`;
    onHoldCurrentCart(note);
    setHoldNote('');
    setFeedbackMsg(`Carrinho ativo colocado em espera com sucesso!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleResume = (hc: HeldCart) => {
    onResumeHeldCart(hc);
    onNavigateToPOS();
  };

  const handleDelete = (id: string) => {
    onDeleteHeldCart(id);
    setConfirmDeleteId(null);
    setFeedbackMsg(`Venda suspensa eliminada com sucesso.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div id="pulse-held-carts-view" className="space-y-4 font-mono">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <PauseCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Suspender / Retomar Venda
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {heldCarts.length} em espera
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Gestão de carrinhos pausados, comandas em espera e retoma instantânea no terminal
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToPOS}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-sans transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao POS Terminal</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT / TOP: Suspender Carrinho Ativo (se houver itens) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <PauseCircle className="w-4 h-4" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                Suspender Venda Atual
              </h3>
            </div>

            {currentCart.length > 0 ? (
              <form onSubmit={handleHoldSubmit} className="space-y-3">
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">Carrinho no Terminal:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {currentCartTotal.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between">
                    <span>Artigos: {currentCart.length} linha(s)</span>
                    <span className="text-slate-400 truncate max-w-[140px]">{currentCustomerName}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-400 text-[10px] uppercase">
                    Referência / Motivo da Pausa (ex: Mesa 4, Foi ao ATM):
                  </label>
                  <input
                    type="text"
                    placeholder="Identificador da comanda ou motivo..."
                    value={holdNote}
                    onChange={(e) => setHoldNote(e.target.value)}
                    className="w-full bg-[#18181f] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>Suspender Venda Agora</span>
                </button>
              </form>
            ) : (
              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-6 text-center space-y-2 text-xs">
                <ShoppingCart className="w-8 h-8 mx-auto text-slate-600 mb-1" />
                <p className="text-white font-bold">Nenhum carrinho ativo</p>
                <p className="text-[11px] text-slate-400 font-sans">
                  Adicione artigos no POS Terminal para poder suspender uma venda.
                </p>
                <button
                  onClick={onNavigateToPOS}
                  className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Ir ao Terminal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / MAIN: Lista de Vendas Suspensas & Pesquisa */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Search and Counts Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por referência, cliente, operador ou notas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#18181f] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl shrink-0">
                {filteredHeldCarts.length} registo(s)
              </span>
            </div>

            {/* Held Carts List */}
            {filteredHeldCarts.length === 0 ? (
              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-white text-sm">Não existem vendas suspensas</p>
                <p className="text-xs text-slate-500 font-sans">
                  Quando suspender um atendimento no POS, ele ficará disponível nesta lista para retoma imediata.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredHeldCarts.map((hc) => (
                  <div
                    key={hc.id}
                    className="bg-[#18181f] border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-all group shadow-sm space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 font-mono text-xs flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          {hc.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {hc.timestamp}
                        </span>
                      </div>

                      <div className="text-xs text-slate-200 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-white">{hc.customerName}</span>
                        <span className="text-[10px] text-slate-500">({hc.operatorName})</span>
                      </div>

                      {hc.notes && (
                        <div className="bg-amber-950/20 border border-amber-500/20 text-amber-300 text-[11px] p-2 rounded-lg font-sans">
                          {hc.notes}
                        </div>
                      )}

                      {/* Items Preview */}
                      <div className="text-[11px] text-slate-400 space-y-0.5 max-h-20 overflow-y-auto">
                        {hc.items.slice(0, 3).map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="truncate max-w-[180px]">
                              {it.qty}x {it.product.name}
                            </span>
                            <span className="font-mono">
                              {(it.qty * it.unitPrice).toLocaleString()} {currency}
                            </span>
                          </div>
                        ))}
                        {hc.items.length > 3 && (
                          <div className="text-[10px] text-slate-500 italic">
                            + {hc.items.length - 3} outro(s) artigo(s)...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 uppercase">Total:</div>
                        <div className="font-bold text-emerald-400 font-mono text-sm">
                          {hc.total.toLocaleString()} {currency}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {confirmDeleteId === hc.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(hc.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(hc.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Venda Suspensa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleResume(hc)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Retomar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
