import React, { useState, useMemo } from 'react';
import {
  Clock,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Lock,
  DollarSign,
  Receipt,
  FileSpreadsheet,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Building,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Document, TenantProfile, User } from '../types/pulse';

interface ShiftCloseViewProps {
  documents: Document[];
  tenant: TenantProfile;
  currentUser: User;
  currency: string;
  openingFloat?: number;
  onConfirmCloseShift?: (summary: any) => void;
  onNavigateToPOS?: () => void;
}

export const ShiftCloseView: React.FC<ShiftCloseViewProps> = ({
  documents = [],
  tenant,
  currentUser,
  currency,
  openingFloat: defaultOpeningFloat = 25000,
  onConfirmCloseShift,
  onNavigateToPOS,
}) => {
  const [openingFloat, setOpeningFloat] = useState<number>(defaultOpeningFloat);
  const [countedCash, setCountedCash] = useState<number>(defaultOpeningFloat);
  const [shiftCloseNotes, setShiftCloseNotes] = useState<string>('');
  const [shiftClosedSuccess, setShiftClosedSuccess] = useState<boolean>(false);
  const [closedSummary, setClosedSummary] = useState<any>(null);

  // Kwanza Cash Denominations (AKZ)
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });
  const [useDenomCalculator, setUseDenomCalculator] = useState<boolean>(true);

  // Shift Documents calculation (Today or current session)
  const todayStr = new Date().toISOString().split('T')[0];
  const shiftDocs = useMemo(() => {
    return documents.filter((d) => d.date === todayStr && d.status !== 'CANCELLED');
  }, [documents, todayStr]);

  const cancelledDocs = useMemo(() => {
    return documents.filter((d) => d.date === todayStr && d.status === 'CANCELLED');
  }, [documents, todayStr]);

  // Totals
  const totalSalesGross = useMemo(() => {
    return shiftDocs.reduce((acc, d) => acc + (d.grossAmount || d.total || 0), 0);
  }, [shiftDocs]);

  const totalTax = useMemo(() => {
    return shiftDocs.reduce((acc, d) => acc + (d.taxAmount || 0), 0);
  }, [shiftDocs]);

  const totalNet = useMemo(() => {
    return shiftDocs.reduce((acc, d) => acc + (d.netAmount || (d.grossAmount || 0) - (d.taxAmount || 0)), 0);
  }, [shiftDocs]);

  // Payment Breakdown
  const cashSales = useMemo(() => {
    return shiftDocs
      .filter((d) => d.paymentMethod === 'CASH' || !d.paymentMethod)
      .reduce((acc, d) => acc + (d.paidAmount || d.grossAmount || d.total || 0), 0);
  }, [shiftDocs]);

  const tpaSales = useMemo(() => {
    return shiftDocs
      .filter((d) => d.paymentMethod === 'MULTICAIXA' || d.paymentMethod === 'CARD')
      .reduce((acc, d) => acc + (d.paidAmount || d.grossAmount || d.total || 0), 0);
  }, [shiftDocs]);

  const transferSales = useMemo(() => {
    return shiftDocs
      .filter((d) => d.paymentMethod === 'TRANSFER')
      .reduce((acc, d) => acc + (d.paidAmount || d.grossAmount || d.total || 0), 0);
  }, [shiftDocs]);

  const creditSales = useMemo(() => {
    return shiftDocs
      .filter((d) => d.paymentMethod === 'CREDIT')
      .reduce((acc, d) => acc + (d.grossAmount || d.total || 0), 0);
  }, [shiftDocs]);

  // Reconciliation
  const expectedCashInDrawer = openingFloat + cashSales;
  const cashDifference = countedCash - expectedCashInDrawer;

  const handleUpdateDenom = (denom: number, count: number) => {
    const next = { ...denominations, [denom]: Math.max(0, count) };
    setDenominations(next);
    const sum = Object.entries(next).reduce((acc, [val, qty]) => acc + Number(val) * Number(qty), 0);
    setCountedCash(sum);
  };

  const handleConfirmClose = () => {
    const summary = {
      closedAt: new Date().toLocaleString('pt-AO'),
      shiftId: `TURNO-${Date.now().toString().slice(-6)}`,
      operator: currentUser.name,
      openingFloat,
      totalSalesGross,
      totalNet,
      totalTax,
      totalInvoicesCount: shiftDocs.length,
      cancelledCount: cancelledDocs.length,
      cashSales,
      tpaSales,
      transferSales,
      creditSales,
      expectedCashInDrawer,
      countedCash,
      cashDifference,
      notes: shiftCloseNotes,
      status: 'CLOSED',
    };

    if (onConfirmCloseShift) {
      onConfirmCloseShift(summary);
    }
    setClosedSummary(summary);
    setShiftClosedSuccess(true);
  };

  return (
    <div id="pulse-shift-close-view" className="space-y-4 font-mono">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Fecho de Turno & Caixa Z
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Auditoria Diária AGT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Apuramento de vendas, contagem física de numerário, reconciliação de TPA e emissão do relatório de fecho
            </p>
          </div>
        </div>

        {onNavigateToPOS && (
          <button
            onClick={onNavigateToPOS}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-sans transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao POS Terminal</span>
          </button>
        )}
      </div>

      {shiftClosedSuccess && closedSummary ? (
        /* SUCCESS / PRINT REPORT VIEW */
        <div className="bg-[#121216] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">
              Turno Encerrado com Sucesso!
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              O caixa foi liquidado e o relatório de fecho oficial foi gerado para contabilidade.
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-sm rounded-lg">
              ID: {closedSummary.shiftId} • {closedSummary.closedAt}
            </div>
          </div>

          {/* Printable Ticket Receipt Card */}
          <div className="bg-[#18181f] border border-slate-800 rounded-xl p-4 text-left space-y-3 text-xs font-mono">
            <div className="border-b border-slate-800 pb-2 text-center">
              <div className="font-bold text-white text-sm">{tenant.tradeName}</div>
              <div className="text-[10px] text-slate-400">NIF: {tenant.taxId}</div>
              <div className="text-[10px] text-emerald-400 font-bold mt-1">RELATÓRIO DE FECHO DE TURNO (CAIXA Z)</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
              <div>Operador: <span className="text-white font-bold">{closedSummary.operator}</span></div>
              <div className="text-right">Faturas: <span className="text-white font-bold">{closedSummary.totalInvoicesCount}</span></div>
              <div>Fundo de Maneio: <span className="text-white font-bold">{closedSummary.openingFloat.toLocaleString()} {currency}</span></div>
              <div className="text-right">Total Vendas: <span className="text-emerald-400 font-bold">{closedSummary.totalSalesGross.toLocaleString()} {currency}</span></div>
            </div>

            <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>• Numerário / Dinheiro:</span>
                <span className="text-white font-bold">{closedSummary.cashSales.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>• Multicaixa / TPA:</span>
                <span className="text-white font-bold">{closedSummary.tpaSales.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>• Transferência Bancária:</span>
                <span className="text-white font-bold">{closedSummary.transferSales.toLocaleString()} {currency}</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-between text-xs font-bold">
              <span>Resultado da Conferência:</span>
              <span className={closedSummary.cashDifference === 0 ? 'text-emerald-400' : closedSummary.cashDifference > 0 ? 'text-sky-400' : 'text-rose-400'}>
                {closedSummary.cashDifference === 0
                  ? 'Caixa Correto (Diferença: 0 Kz)'
                  : closedSummary.cashDifference > 0
                  ? `Sobra de Caixa (+${closedSummary.cashDifference.toLocaleString()} ${currency})`
                  : `Quebra de Caixa (${closedSummary.cashDifference.toLocaleString()} ${currency})`}
              </span>
            </div>

            {closedSummary.notes && (
              <div className="bg-slate-900 border border-slate-800 p-2 rounded text-[11px] text-slate-300">
                <span className="text-slate-500 block text-[9px] uppercase">Justificação:</span>
                {closedSummary.notes}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md text-xs"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir Relatório Z</span>
            </button>

            {onNavigateToPOS && (
              <button
                onClick={onNavigateToPOS}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs cursor-pointer shadow-md"
              >
                Voltar ao Terminal
              </button>
            )}
          </div>
        </div>
      ) : (
        /* MAIN FECHO DE TURNO WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT COLUMN: 1. Abertura & 2. Resumo de Vendas & 3. Meios de Pagamento */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* 1. ➔ Abertura / Saldo Inicial (Fundo de Maneio) */}
            <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    1. Fundo de Maneio / Saldo Inicial
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400">Caixa de Abertura</span>
              </div>

              <div className="bg-[#18181f] border border-slate-700/80 rounded-xl p-3 flex items-center justify-between gap-3">
                <label className="text-xs text-slate-300 font-sans">Valor de Abertura (Kz):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={openingFloat}
                    onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                    className="w-32 bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-400"
                  />
                  <span className="text-xs text-slate-400">{currency}</span>
                </div>
              </div>
            </div>

            {/* 2. ➔ Resumo de Vendas do Turno */}
            <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    2. Resumo de Faturação
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">
                  {shiftDocs.length} documento(s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Vendas Bruto:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    {totalSalesGross.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Total IVA Liquidado:</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    {totalTax.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Subtotal Líquido:</span>
                  <span className="text-sm font-bold text-slate-200 font-mono">
                    {totalNet.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 block uppercase">Faturas Anuladas:</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {cancelledDocs.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. ➔ Meios de Pagamento */}
            <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                  3. Meios de Pagamento
                </h3>
              </div>

              <div className="bg-[#18181f] border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    Numerário / Dinheiro em Espécie:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {cashSales.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-sky-400" />
                    Multicaixa / TPA:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {tpaSales.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="p-2.5 flex items-center justify-between">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-purple-400" />
                    Transferência Bancária:
                  </span>
                  <span className="font-bold text-white font-mono">
                    {transferSales.toLocaleString()} {currency}
                  </span>
                </div>

                {creditSales > 0 && (
                  <div className="p-2.5 flex items-center justify-between">
                    <span className="text-slate-300 flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-amber-400" />
                      Vendas a Crédito (Conta Corrente):
                    </span>
                    <span className="font-bold text-amber-400 font-mono">
                      {creditSales.toLocaleString()} {currency}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 4. Contagem Física & 5. Diferenças / Justificações & 6. Fechar Turno */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* 4. ➔ Contagem Física de Caixa */}
            <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Coins className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    4. Contagem Física de Caixa
                  </h3>
                </div>

                <button
                  onClick={() => setUseDenomCalculator(!useDenomCalculator)}
                  className="text-[10px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {useDenomCalculator ? 'Inserção Direta' : 'Calculadora de Notas'}
                </button>
              </div>

              {useDenomCalculator ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.keys(denominations)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((denom) => (
                        <div
                          key={denom}
                          className="bg-[#18181f] border border-slate-800 rounded-xl p-2 flex items-center justify-between"
                        >
                          <span className="font-bold text-slate-300 text-[11px] font-mono">
                            {denom.toLocaleString()} Kz:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={denominations[denom] || ''}
                              placeholder="0"
                              onChange={(e) => handleUpdateDenom(denom, parseInt(e.target.value) || 0)}
                              className="w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[10px] text-slate-500 w-4">un</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-bold">Total Físico Apurado:</span>
                    <span className="font-bold text-white font-mono text-sm">
                      {countedCash.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#18181f] border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
                  <label className="text-xs text-slate-300">Total Contado em Gaveta:</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={countedCash}
                      onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
                      className="w-36 bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-white text-xs focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs text-slate-400">{currency}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. ➔ Diferenças / Reconciliação & Justificações */}
            <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                5. Apuramento de Diferenças de Caixa
              </h3>

              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Saldo Teórico Esperado (Abertura + Vendas Dinheiro):</span>
                  <span className="text-white font-mono font-bold">
                    {expectedCashInDrawer.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Valor Físico Real Contado:</span>
                  <span className="text-white font-mono font-bold">
                    {countedCash.toLocaleString()} {currency}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between font-bold text-sm">
                  <span className="uppercase text-xs">Diferença de Caixa:</span>
                  <span
                    className={
                      cashDifference === 0
                        ? 'text-emerald-400 font-mono'
                        : cashDifference > 0
                        ? 'text-sky-400 font-mono'
                        : 'text-rose-400 font-mono'
                    }
                  >
                    {cashDifference === 0
                      ? '0 Kz (Sem Discrepâncias)'
                      : cashDifference > 0
                      ? `+${cashDifference.toLocaleString()} ${currency} (Sobra de Caixa)`
                      : `${cashDifference.toLocaleString()} ${currency} (Quebra de Caixa)`}
                  </span>
                </div>
              </div>

              {/* Justificação de Diferença */}
              <div className="space-y-1">
                <label className="block text-slate-400 text-[10px] uppercase">
                  Justificação / Observações de Fecho:
                </label>
                <textarea
                  rows={2}
                  value={shiftCloseNotes}
                  onChange={(e) => setShiftCloseNotes(e.target.value)}
                  placeholder={
                    cashDifference !== 0
                      ? 'Obrigatório: Justifique o motivo da quebra ou sobra de caixa para auditoria...'
                      : 'Notas operacionais opcionais sobre o turno...'
                  }
                  className={`w-full bg-[#18181f] border rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                    cashDifference !== 0 && !shiftCloseNotes.trim()
                      ? 'border-amber-500/80 focus:border-amber-400'
                      : 'border-slate-700 focus:border-emerald-400'
                  }`}
                />
              </div>

              {/* 6. ➔ Fechar Turno & Emitir Relatório Button */}
              <button
                onClick={handleConfirmClose}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Confirmar Fecho de Turno & Gerar Relatório Z</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
