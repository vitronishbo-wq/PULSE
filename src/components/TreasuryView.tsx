import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Scale,
  Receipt,
  Clock,
  Printer,
  Coins,
  Lock,
  FileSpreadsheet,
  AlertTriangle,
  X,
  CreditCard,
  History,
  ShieldCheck,
  Plus,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Customer,
  Supplier,
  AccountingEntry,
  PaymentMethod,
  User,
  Document,
  PurchaseEntry,
  BankAccount,
  ReceiptEntry,
  PaymentDisbursement,
  CashMovementEntry,
  CashShiftRecord,
} from '../types/pulse';
import { ReceiptsView } from './treasury/ReceiptsView';
import { DisbursementsView } from './treasury/DisbursementsView';
import { CashMovementsView } from './treasury/CashMovementsView';

export type TreasuryTab =
  | 'RECEIPTS'
  | 'DISBURSEMENTS'
  | 'CASH_MOVEMENTS'
  | 'BANKS'
  | 'JOURNAL';

interface TreasuryViewProps {
  cashBalance: number;
  bankBalance: number;
  customers: Customer[];
  suppliers: Supplier[];
  documents?: Document[];
  purchases?: PurchaseEntry[];
  journalEntries: AccountingEntry[];
  bankAccounts?: BankAccount[];
  receipts?: ReceiptEntry[];
  disbursements?: PaymentDisbursement[];
  cashMovements?: CashMovementEntry[];
  cashShifts?: CashShiftRecord[];
  currency: string;
  currentUser: User;
  subView?: string;
  onReceiveCustomerPayment?: (params: {
    customerId: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
  }) => void;
  onPaySupplier?: (params: {
    supplierId: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
  }) => void;
  onRegisterReceipt: (
    receipt: Omit<ReceiptEntry, 'id' | 'receiptNumber' | 'createdAt'>
  ) => void;
  onCancelReceipt: (id: string, reason: string) => void;
  onRegisterDisbursement: (
    disbursement: Omit<PaymentDisbursement, 'id' | 'disbursementNumber' | 'createdAt'>
  ) => void;
  onApproveDisbursement: (id: string, notes?: string) => void;
  onRejectDisbursement: (id: string, reason: string) => void;
  onCancelDisbursement: (id: string, reason: string) => void;
  onCreateCashMovement: (
    mov: Omit<CashMovementEntry, 'id' | 'timestamp' | 'date' | 'time' | 'balanceAfter'>
  ) => void;
  onCloseShift: (params: {
    shiftId: string;
    physicalCountedCash: number;
    difference: number;
    justification?: string;
    authorizedBy?: string;
    notes?: string;
  }) => void;
  onOpenShift: (params: {
    openingFloat: number;
    operatorName: string;
    notes?: string;
  }) => void;
  onTransferFunds: (params: {
    sourceType: 'CASH' | 'BANK';
    targetType: 'CASH' | 'BANK';
    sourceBankId?: string;
    targetBankId?: string;
    amount: number;
    justification: string;
  }) => void;
}

export const TreasuryView: React.FC<TreasuryViewProps> = ({
  cashBalance = 0,
  bankBalance = 0,
  customers = [],
  suppliers = [],
  documents = [],
  purchases = [],
  journalEntries = [],
  bankAccounts = [],
  receipts = [],
  disbursements = [],
  cashMovements = [],
  cashShifts = [],
  currency = 'Kz',
  currentUser,
  subView,
  onRegisterReceipt,
  onCancelReceipt,
  onRegisterDisbursement,
  onApproveDisbursement,
  onRejectDisbursement,
  onCancelDisbursement,
  onCreateCashMovement,
  onCloseShift,
  onOpenShift,
  onTransferFunds,
}) => {
  const [activeTab, setActiveTab] = useState<TreasuryTab>(() => {
    if (subView === 'PAYABLES' || subView === 'DISBURSEMENTS' || subView === 'SUPPLIERS') return 'DISBURSEMENTS';
    if (subView === 'CASH' || subView === 'CASH_MOVEMENTS' || subView === 'SHIFT_CLOSE') return 'CASH_MOVEMENTS';
    if (subView === 'BANKS') return 'BANKS';
    if (subView === 'JOURNAL') return 'JOURNAL';
    return 'RECEIPTS';
  });

  // Sync subView with tabs
  useEffect(() => {
    if (subView === 'PAYABLES' || subView === 'DISBURSEMENTS' || subView === 'SUPPLIERS') {
      setActiveTab('DISBURSEMENTS');
    } else if (subView === 'CASH' || subView === 'CASH_MOVEMENTS' || subView === 'SHIFT_CLOSE') {
      setActiveTab('CASH_MOVEMENTS');
    } else if (subView === 'BANKS') {
      setActiveTab('BANKS');
    } else if (subView === 'JOURNAL') {
      setActiveTab('JOURNAL');
    } else if (subView === 'RECEIVABLES' || subView === 'RECEIPTS' || subView === 'CUSTOMER_DEBTS') {
      setActiveTab('RECEIPTS');
    }
  }, [subView]);

  // Safe Arrays
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];
  const safeEntries = Array.isArray(journalEntries) ? journalEntries : [];

  const totalReceivables = safeCustomers.reduce((acc, c) => acc + (c?.currentBalance || 0), 0);
  const totalPayables = safeSuppliers.reduce((acc, s) => acc + (s?.currentBalance || 0), 0);

  // Journal total debits and credits
  const totalDebits = safeEntries.reduce((acc, e) => acc + (e?.amount || 0), 0);
  const totalCredits = safeEntries.reduce((acc, e) => acc + (e?.amount || 0), 0);

  return (
    <div id="pulse-treasury-view" className="space-y-4 font-sans">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            MÓDULO DE FINANÇAS & TESOURARIA
          </h2>
          <p className="text-xs text-slate-400">
            Recebimentos, Pagamentos, Movimentos de Caixa, Contas Bancárias e Diário Contabilístico
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Equilíbrio Contabilístico:</span>
            <span className="font-mono font-bold text-emerald-400">
              {Math.abs(totalDebits - totalCredits) < 0.01 ? 'DEB = CRED (OK)' : 'DESEQUILÍBRIO'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5 flex items-center gap-1.5 overflow-x-auto shadow-sm">
        {/* 1. Recebimentos */}
        <button
          id="tab-treasury-receipts"
          onClick={() => setActiveTab('RECEIPTS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'RECEIPTS'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          <span>1. Recebimentos</span>
          {receipts.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'RECEIPTS' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {receipts.length}
            </span>
          )}
        </button>

        {/* 2. Pagamentos */}
        <button
          id="tab-treasury-disbursements"
          onClick={() => setActiveTab('DISBURSEMENTS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'DISBURSEMENTS'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-950/40'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
          <span>2. Pagamentos</span>
          {disbursements.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'DISBURSEMENTS' ? 'bg-slate-950 text-blue-300' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {disbursements.length}
            </span>
          )}
        </button>

        {/* 3. Movimentos de Caixa */}
        <button
          id="tab-treasury-cash-movements"
          onClick={() => setActiveTab('CASH_MOVEMENTS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'CASH_MOVEMENTS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/40'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
          }`}
        >
          <Coins className="w-4 h-4 stroke-[2.5]" />
          <span>3. Movimentos de Caixa</span>
          {cashMovements.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'CASH_MOVEMENTS' ? 'bg-slate-950 text-amber-950 font-bold' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {cashMovements.length}
            </span>
          )}
        </button>

        {/* 4. Contas Bancárias & TPA */}
        <button
          id="tab-treasury-banks"
          onClick={() => setActiveTab('BANKS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'BANKS'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-950/40'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Contas Bancárias & TPA</span>
          {bankAccounts.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'BANKS' ? 'bg-slate-950 text-purple-300' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {bankAccounts.length}
            </span>
          )}
        </button>

        {/* 5. Diário Contabilístico */}
        <button
          id="tab-treasury-journal"
          onClick={() => setActiveTab('JOURNAL')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'JOURNAL'
              ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-950/40'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Diário Geral</span>
          {journalEntries.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'JOURNAL' ? 'bg-slate-950 text-teal-300' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {journalEntries.length}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. RECEBIMENTOS */}
      {/* ======================================================== */}
      {activeTab === 'RECEIPTS' && (
        <ReceiptsView
          receipts={receipts}
          customers={customers}
          documents={documents}
          bankAccounts={bankAccounts}
          currency={currency}
          currentUser={currentUser}
          onRegisterReceipt={onRegisterReceipt}
          onCancelReceipt={onCancelReceipt}
        />
      )}

      {/* ======================================================== */}
      {/* 2. PAGAMENTOS */}
      {/* ======================================================== */}
      {activeTab === 'DISBURSEMENTS' && (
        <DisbursementsView
          disbursements={disbursements}
          suppliers={suppliers}
          bankAccounts={bankAccounts}
          purchases={purchases}
          currency={currency}
          currentUser={currentUser}
          onRegisterDisbursement={onRegisterDisbursement}
          onApproveDisbursement={onApproveDisbursement}
          onRejectDisbursement={onRejectDisbursement}
          onCancelDisbursement={onCancelDisbursement}
        />
      )}

      {/* ======================================================== */}
      {/* 3. MOVIMENTOS DE CAIXA */}
      {/* ======================================================== */}
      {activeTab === 'CASH_MOVEMENTS' && (
        <CashMovementsView
          movements={cashMovements}
          shifts={cashShifts}
          bankAccounts={bankAccounts}
          cashBalance={cashBalance}
          bankBalance={bankBalance}
          currency={currency}
          currentUser={currentUser}
          onCreateMovement={onCreateCashMovement}
          onCloseShift={onCloseShift}
          onOpenShift={onOpenShift}
          onTransferFunds={onTransferFunds}
        />
      )}

      {/* ======================================================== */}
      {/* 4. CONTAS BANCÁRIAS & TPA */}
      {/* ======================================================== */}
      {activeTab === 'BANKS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bankAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                      <Building className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">{acc.bankName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {acc.accountType === 'CHECKING' ? 'Conta Corrente' : 'Conta Poupança / TPA'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {acc.status === 'ACTIVE' ? 'ATIVA' : 'INATIVA'}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                  <div className="flex justify-between text-slate-400">
                    <span>Nº Conta:</span>
                    <span className="text-white font-bold">{acc.accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IBAN AO06:</span>
                    <span className="text-slate-300 text-[10px]">{acc.iban}</span>
                  </div>
                  {acc.swift && (
                    <div className="flex justify-between text-slate-400">
                      <span>SWIFT/BIC:</span>
                      <span className="text-slate-300">{acc.swift}</span>
                    </div>
                  )}
                  {acc.terminalId && (
                    <div className="flex justify-between text-slate-400">
                      <span>Terminal TPA:</span>
                      <span className="text-sky-300">{acc.terminalId}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Saldo Disponível:</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {acc.balance.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/30">
                <CreditCard className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">Terminais de Pagamento Automático (TPA)</h4>
                <p className="text-[11px] text-slate-400">
                  Conciliação automática com faturas e recibos emitidos no balcão POS
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total em Bancos & TPA:</span>
              <span className="text-base font-bold font-mono text-blue-400">
                {bankBalance.toLocaleString()} {currency}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DIÁRIO EM PARTIDAS DOBRADAS */}
      {/* ======================================================== */}
      {activeTab === 'JOURNAL' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden space-y-3 p-3">
          <div className="text-xs text-slate-400">
            Registo cronológico e imutável de todas as partidas dobradas geradas pelo Orchestrator.
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{entry.id}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{entry.description}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Data: {entry.date} | Ref: {entry.docNumber || 'SISTEMA'}
                  </div>
                </div>

                <table className="w-full text-xs text-left">
                  <thead className="text-[10px] text-slate-400 uppercase font-mono">
                    <tr>
                      <th className="py-1">Conta Débito</th>
                      <th className="py-1">Conta Crédito</th>
                      <th className="py-1 text-right">Valor ({currency})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    <tr>
                      <td className="py-1.5 font-mono">
                        <span className="text-emerald-400 font-bold">{entry.debitAccount}</span> - {entry.debitAccountName}
                      </td>
                      <td className="py-1.5 font-mono">
                        <span className="text-sky-400 font-bold">{entry.creditAccount}</span> - {entry.creditAccountName}
                      </td>
                      <td className="py-1.5 text-right font-mono font-bold text-white">
                        {entry.amount.toLocaleString()} {currency}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
