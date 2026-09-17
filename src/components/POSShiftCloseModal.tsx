import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Printer,
  Lock,
  DollarSign,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { Document, TenantProfile, User } from '../types/pulse';

interface POSShiftCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  tenant: TenantProfile;
  currentUser: User;
  currency: string;
  openingFloat?: number;
  onConfirmCloseShift?: (summary: any) => void;
}

export const POSShiftCloseModal: React.FC<POSShiftCloseModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  tenant,
  currentUser,
  currency,
  openingFloat = 25000,
  onConfirmCloseShift,
}) => {
  const [countedCash, setCountedCash] = useState<number>(openingFloat);
  const [shiftCloseNotes, setShiftCloseNotes] = useState<string>('');
  const [shiftClosedSuccess, setShiftClosedSuccess] = useState<boolean>(false);
  const [denominations, setDenominations] = useState<{ [denom: number]: number }>({
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });
  const [showDenomBreakdown, setShowDenomBreakdown] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate shift documents & totals
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDocs = documents.filter((d) => d.date === todayStr && d.status !== 'CANCELLED');

  const totalSalesGross = todayDocs.reduce((acc, d) => acc + (d.grossAmount || d.total || 0), 0);
  const totalInvoicesCount = todayDocs.length;

  const cashSales = todayDocs
    .filter((d) => d.paymentMethod === 'CASH' || !d.paymentMethod)
    .reduce((acc, d) => acc + (d.paidAmount || d.grossAmount || d.total || 0), 0);

  const tpaSales = todayDocs
    .filter((d) => d.paymentMethod === 'MULTICAIXA' || d.paymentMethod === 'CARD')
    .reduce((acc, d) => acc + (d.paidAmount || d.grossAmount || d.total || 0), 0);

  const transferSales = todayDocs
    .filter((d) => d.paymentMethod === 'TRANSFER')
    .reduce((acc, d) => acc + (d.paidAmount || d.grossAmount || d.total || 0), 0);

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
      closedAt: new Date().toISOString(),
      operator: currentUser.name,
      openingFloat,
      totalSalesGross,
      totalInvoicesCount,
      cashSales,
      tpaSales,
      transferSales,
      expectedCashInDrawer,
      countedCash,
      cashDifference,
      notes: shiftCloseNotes,
      status: 'CLOSED',
    };

    if (onConfirmCloseShift) {
      onConfirmCloseShift(summary);
    }
    setShiftClosedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-[#14141a] border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Fecho de Turno (Relatório Z)
              </h3>
              <p className="text-[10px] text-slate-400">
                Abertura, conferência de caixa, meios de pagamento e reconciliação
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShiftClosedSuccess(false);
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {shiftClosedSuccess ? (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">Turno Encerrado com Sucesso!</h4>
            <p className="text-xs text-slate-300">
              O relatório de fecho diário foi gerado e registrado no diário contábil e auditoria fiscal.
            </p>

            {/* Thermal Slip Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-w-sm mx-auto text-left space-y-1.5 text-[11px]">
              <div className="text-center font-bold text-white pb-1 border-b border-slate-800">
                RELATÓRIO DE FECHO Z • {tenant?.tradeName || 'PULSE'}
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Operador:</span>
                <span className="text-white">{currentUser.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Documentos Emitidos:</span>
                <span className="text-white font-bold">{totalInvoicesCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Fundo Abertura:</span>
                <span className="text-white">{openingFloat.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Total Faturado:</span>
                <span className="text-emerald-400 font-bold">{totalSalesGross.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Numerário Contado:</span>
                <span className="text-white font-bold">{countedCash.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Diferença de Caixa:</span>
                <span className={cashDifference === 0 ? 'text-emerald-400 font-bold' : cashDifference > 0 ? 'text-sky-400 font-bold' : 'text-rose-400 font-bold'}>
                  {cashDifference > 0 ? `+${cashDifference.toLocaleString()}` : cashDifference.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-2 pt-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Talão de Fecho</span>
              </button>
              <button
                onClick={() => {
                  setShiftClosedSuccess(false);
                  onClose();
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            
            {/* 1. Abertura & Operador */}
            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Operador em Caixa:</span>
                <span className="text-white font-bold">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Data & Hora de Fecho:</span>
                <span className="text-white font-bold">
                  {new Date().toLocaleDateString('pt-AO')} {new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* 2. Resumo de Vendas e Meios de Pagamento */}
            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold block border-b border-slate-800 pb-1">
                2. Resumo de Vendas & Meios de Pagamento
              </span>

              <div className="flex justify-between text-slate-300">
                <span>Fundo de Maneio Inicial (Abertura):</span>
                <span className="font-bold font-mono">{openingFloat.toLocaleString()} {currency}</span>
              </div>

              <div className="flex justify-between text-emerald-400">
                <span>Vendas em Numerário (Caixa):</span>
                <span className="font-bold font-mono">+{cashSales.toLocaleString()} {currency}</span>
              </div>

              <div className="flex justify-between text-sky-400">
                <span>Vendas em Multicaixa / TPA:</span>
                <span className="font-bold font-mono">+{tpaSales.toLocaleString()} {currency}</span>
              </div>

              <div className="flex justify-between text-purple-400">
                <span>Vendas em Transferência Bancária:</span>
                <span className="font-bold font-mono">+{transferSales.toLocaleString()} {currency}</span>
              </div>

              <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800">
                <span>Total Faturado no Turno ({totalInvoicesCount} faturas):</span>
                <span className="text-amber-300 font-mono text-sm">
                  {totalSalesGross.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* 3. Contagem Física de Caixa */}
            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold text-xs uppercase">
                  3. Contagem Física de Numerário na Gaveta:
                </label>
                <button
                  type="button"
                  onClick={() => setShowDenomBreakdown(!showDenomBreakdown)}
                  className="text-amber-400 text-[10px] hover:underline cursor-pointer"
                >
                  {showDenomBreakdown ? 'Ocultar Cédulas' : 'Discriminador por Cédulas'}
                </button>
              </div>

              {showDenomBreakdown && (
                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  {Object.entries(denominations).map(([val, qty]) => (
                    <div key={val} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 w-12 text-right">{val} Kz:</span>
                      <input
                        type="number"
                        min="0"
                        value={qty}
                        onChange={(e) => handleUpdateDenom(Number(val), parseInt(e.target.value) || 0)}
                        className="w-14 bg-[#14141a] border border-slate-700 rounded px-1.5 py-0.5 text-center text-white text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={countedCash}
                  onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
                />
                <span className="font-bold text-slate-400">{currency}</span>
              </div>

              {/* 4. Diferenças & Justificações */}
              <div className="pt-1">
                {(() => {
                  if (Math.abs(cashDifference) < 0.01) {
                    return (
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>Caixa Certificado (Diferença: 0 {currency})</span>
                      </div>
                    );
                  }
                  if (cashDifference < 0) {
                    return (
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>Quebra de Caixa: {cashDifference.toLocaleString()} {currency} (Valor em falta)</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs bg-sky-500/10 border border-sky-500/30 p-2 rounded-lg">
                      <Coins className="w-4 h-4 flex-shrink-0" />
                      <span>Sobra de Caixa: +{cashDifference.toLocaleString()} {currency} (Valor a mais)</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Justification Field */}
            <div>
              <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                Justificação / Observações de Fecho:
              </label>
              <input
                type="text"
                placeholder={
                  cashDifference !== 0
                    ? 'Obrigatório justificar a divergência no caixa (ex: devolução sem registo, troco retido)...'
                    : 'Ex: Turno encerrado sem anomalias, fundo de maneio conferido...'
                }
                value={shiftCloseNotes}
                onChange={(e) => setShiftCloseNotes(e.target.value)}
                className="w-full bg-[#18181f] border border-slate-800 rounded-xl p-2.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleConfirmClose}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Fechar Turno</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
