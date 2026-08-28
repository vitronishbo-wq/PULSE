import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  DollarSign,
  Receipt,
  Building,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  X,
  Sparkles,
  Wallet,
  Landmark,
  FileText,
  Check,
  Percent,
} from 'lucide-react';
import {
  Supplier,
  SupplierLedgerMovement,
  SupplierMovementType,
  PaymentMethod,
  User,
} from '../types/pulse';

interface SupplierLedgerViewProps {
  movements: SupplierLedgerMovement[];
  suppliers: Supplier[];
  currency: string;
  currentUser: User;
  onPaySupplier: (params: {
    supplierId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) => void;
  filterSupplierId?: string;
}

export const SupplierLedgerView: React.FC<SupplierLedgerViewProps> = ({
  movements = [],
  suppliers = [],
  currency,
  currentUser,
  onPaySupplier,
  filterSupplierId,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(filterSupplierId || 'ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'ALL' | 'INVOICES' | 'PAYMENTS' | 'CREDIT_NOTES'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [selectedMovementForDetail, setSelectedMovementForDetail] = useState<SupplierLedgerMovement | null>(null);

  // Settlement Form State
  const [settleSupplierId, setSettleSupplierId] = useState<string>(
    filterSupplierId && filterSupplierId !== 'ALL' ? filterSupplierId : suppliers[0]?.id || ''
  );
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [settleReference, setSettleReference] = useState<string>('');
  const [settleAccount, setSettleAccount] = useState<string>('Conta BFA Operacional');
  const [settleNotes, setSettleNotes] = useState<string>('');

  const targetSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === (selectedSupplierId !== 'ALL' ? selectedSupplierId : settleSupplierId));
  }, [suppliers, selectedSupplierId, settleSupplierId]);

  const openSettleModal = (supId?: string) => {
    const sId = supId || (selectedSupplierId !== 'ALL' ? selectedSupplierId : suppliers[0]?.id || '');
    setSettleSupplierId(sId);
    const sup = suppliers.find((s) => s.id === sId);
    if (sup) {
      setSettleAmount(sup.currentBalance > 0 ? sup.currentBalance : 100000);
      setSettleMethod(sup.paymentMethodDefault || 'BANK_TRANSFER');
    }
    setSettleReference(`TRF-${Date.now().toString().slice(-6)}`);
    setSettleNotes('Regularização de Faturas de Fornecedor');
    setShowSettleModal(true);
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleSupplierId || settleAmount <= 0) return;

    onPaySupplier({
      supplierId: settleSupplierId,
      amount: Number(settleAmount),
      method: settleMethod,
      reference: settleReference.trim() || undefined,
      notes: `${settleNotes} [${settleAccount}]`,
    });

    setShowSettleModal(false);
  };

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      const matchesSupplier =
        selectedSupplierId === 'ALL' || mov.supplierId === selectedSupplierId;

      const matchesSearch =
        mov.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.receiptNumber && mov.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        movementTypeFilter === 'ALL' ||
        (movementTypeFilter === 'INVOICES' && mov.type === 'PURCHASE_INVOICE') ||
        (movementTypeFilter === 'PAYMENTS' && mov.type === 'PAYMENT') ||
        (movementTypeFilter === 'CREDIT_NOTES' && mov.type === 'CREDIT_NOTE');

      const matchesStartDate = !startDate || mov.date >= startDate;
      const matchesEndDate = !endDate || mov.date <= endDate;

      return matchesSupplier && matchesSearch && matchesType && matchesStartDate && matchesEndDate;
    });
  }, [movements, selectedSupplierId, searchTerm, movementTypeFilter, startDate, endDate]);

  // Aggregate stats
  const totalDebits = filteredMovements.reduce((acc, m) => acc + (m.debit || 0), 0);
  const totalCredits = filteredMovements.reduce((acc, m) => acc + (m.credit || 0), 0);

  const selectedSupplierBalance = targetSupplier ? targetSupplier.currentBalance : suppliers.reduce((acc, s) => acc + (s.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Financial Health KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Saldo Total a Pagar (AP)</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {selectedSupplierBalance.toLocaleString('pt-AO')} {currency}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {selectedSupplierId === 'ALL'
              ? 'Todos os Fornecedores Cadastrados'
              : `Fornecedor: ${targetSupplier?.name}`}
          </div>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Compras / Faturas (Crédito)</span>
            <ArrowDownLeft className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-200 mt-1">
            {totalCredits.toLocaleString('pt-AO')} {currency}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total faturado no período filtrado
          </div>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Regularizado / Pago (Débito)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {totalDebits.toLocaleString('pt-AO')} {currency}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Pagamentos e notas de crédito emitidas
          </div>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm flex flex-col justify-between">
          <div className="text-xs text-slate-400">Ação Rápida de Regularização</div>
          <button
            onClick={() => openSettleModal()}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 mt-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Efetuar Pagamento a Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Filters & Action Bar */}
      <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Supplier Selector */}
          <div className="min-w-[220px]">
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="ALL">✦ Todos os Fornecedores</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.currentBalance.toLocaleString('pt-AO')} {currency})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por Doc, Descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] text-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Movement Type Filter */}
          <div className="flex items-center bg-[#121215] border border-[#27272a] rounded-lg p-1 text-xs">
            <button
              onClick={() => setMovementTypeFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-colors ${
                movementTypeFilter === 'ALL'
                  ? 'bg-amber-500/20 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setMovementTypeFilter('INVOICES')}
              className={`px-2.5 py-1 rounded transition-colors ${
                movementTypeFilter === 'INVOICES'
                  ? 'bg-rose-500/20 text-rose-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Faturas (FT)
            </button>
            <button
              onClick={() => setMovementTypeFilter('PAYMENTS')}
              className={`px-2.5 py-1 rounded transition-colors ${
                movementTypeFilter === 'PAYMENTS'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pagamentos
            </button>
            <button
              onClick={() => setMovementTypeFilter('CREDIT_NOTES')}
              className={`px-2.5 py-1 rounded transition-colors ${
                movementTypeFilter === 'CREDIT_NOTES'
                  ? 'bg-sky-500/20 text-sky-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Notas Crédito
            </button>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#121215] border border-[#27272a] text-slate-200 px-2 py-1.5 rounded-lg text-xs"
            />
            <span>até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#121215] border border-[#27272a] text-slate-200 px-2 py-1.5 rounded-lg text-xs"
            />
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs rounded-lg font-medium transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Imprimir Extrato</span>
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-[#18181b] rounded-xl border border-[#27272a] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-base">Extrato de Movimentos de Conta-Corrente</h3>
            <span className="text-xs text-slate-400 ml-2">({filteredMovements.length} movimentos)</span>
          </div>
          <div className="text-xs text-slate-400">
            Saldo em Aberto Atual: <strong className="text-amber-400 font-mono">{selectedSupplierBalance.toLocaleString('pt-AO')} {currency}</strong>
          </div>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">Nenhum movimento encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Os lançamentos de faturas de compras e pagamentos aparecerão aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121215] text-slate-400 font-mono text-xs uppercase border-b border-[#27272a]">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Fornecedor</th>
                  <th className="px-4 py-3">Documento / Ref.</th>
                  <th className="px-4 py-3">Descrição da Operação</th>
                  <th className="px-4 py-3 text-right">Débito (Pago)</th>
                  <th className="px-4 py-3 text-right">Crédito (Faturado)</th>
                  <th className="px-4 py-3 text-right">Saldo Progressivo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-slate-200">
                {filteredMovements.map((mov) => {
                  const isDebit = mov.debit > 0;
                  const isCredit = mov.credit > 0;

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-[#202024] transition-colors cursor-pointer"
                      onClick={() => setSelectedMovementForDetail(mov)}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                        {mov.date}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-100 text-xs">{mov.supplierName}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-zinc-800 text-slate-300 rounded border border-zinc-700">
                          {mov.docNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-300">
                        <div>{mov.description}</div>
                        {mov.bankAccountRef && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {mov.bankAccountRef} • {mov.receiptNumber || ''}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs">
                        {isDebit ? (
                          <span className="text-emerald-400 font-semibold">
                            -{mov.debit.toLocaleString('pt-AO')} {currency}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs">
                        {isCredit ? (
                          <span className="text-rose-400 font-semibold">
                            +{mov.credit.toLocaleString('pt-AO')} {currency}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-amber-400">
                        {mov.runningBalance.toLocaleString('pt-AO')} {currency}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            mov.status === 'SETTLED'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                          }`}
                        >
                          {mov.status === 'SETTLED' ? 'Liquidado' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Reconciliação / Efetuar Pagamento a Fornecedor */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-base">Liquidar Saldo de Fornecedor</h3>
              </div>
              <button
                onClick={() => setShowSettleModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Selecionar Fornecedor <span className="text-amber-400">*</span>
                </label>
                <select
                  value={settleSupplierId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSettleSupplierId(id);
                    const s = suppliers.find((sup) => sup.id === id);
                    if (s) {
                      setSettleAmount(s.currentBalance > 0 ? s.currentBalance : 50000);
                      setSettleMethod(s.paymentMethodDefault || 'BANK_TRANSFER');
                    }
                  }}
                  className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — Dívida: {s.currentBalance.toLocaleString('pt-AO')} {currency}
                    </option>
                  ))}
                </select>
              </div>

              {targetSupplier && (
                <div className="p-3 bg-[#121215] rounded-xl border border-[#27272a] flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400">Saldo Atual em Dívida:</span>
                    <div className="font-bold text-base text-amber-400 font-mono">
                      {targetSupplier.currentBalance.toLocaleString('pt-AO')} {currency}
                    </div>
                  </div>
                  {targetSupplier.bankAccount?.bankName && (
                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      <span>{targetSupplier.bankAccount.bankName}</span>
                      <div className="text-slate-500 truncate max-w-[180px]">{targetSupplier.bankAccount.iban}</div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valor a Pagar ({currency}) <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 font-mono text-lg font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                    {currency}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={settleMethod}
                    onChange={(e) => setSettleMethod(e.target.value as any)}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BANK_TRANSFER">Transferência Bancária</option>
                    <option value="CASH">Dinheiro / Caixa</option>
                    <option value="CARD">TPA / Multicaixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Conta de Origem
                  </label>
                  <select
                    value={settleAccount}
                    onChange={(e) => setSettleAccount(e.target.value)}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Conta BFA Operacional">Conta BFA Operacional</option>
                    <option value="Conta BAI Principal">Conta BAI Principal</option>
                    <option value="Caixa Principal Loja">Caixa Principal Loja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nº do Comprovativo / Referência Bancária
                </label>
                <input
                  type="text"
                  placeholder="Ex: TRF-BAI-90123 ou Talão Multicaixa"
                  value={settleReference}
                  onChange={(e) => setSettleReference(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] text-slate-100 font-mono px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações / Descrição
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar & Baixar Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
