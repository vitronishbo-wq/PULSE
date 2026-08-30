import React, { useState } from 'react';
import {
  Receipt,
  FileText,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  User,
  Plus,
  Search,
  Filter,
  CreditCard,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Customer, CustomerLedgerMovement, Document, User as UserType, BankAccount, PaymentMethod } from '../../types/pulse';
import { CustomerPaymentModal } from './CustomerPaymentModal';

interface CustomerLedgerViewProps {
  customers: Customer[];
  movements: CustomerLedgerMovement[];
  documents: Document[];
  bankAccounts?: BankAccount[];
  currency: string;
  currentUser: UserType;
  selectedCustomer?: Customer | null;
  onReceiveCustomerPayment: (params: {
    customerId: string;
    customerName: string;
    customerTaxId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    bankAccountName?: string;
    docId?: string;
    docNumber?: string;
    reference: string;
    notes?: string;
  }) => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  customers = [],
  movements = [],
  documents = [],
  bankAccounts = [],
  currency,
  currentUser,
  selectedCustomer,
  onReceiveCustomerPayment,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(selectedCustomer?.id || 'ALL');
  const [activeLedgerTab, setActiveLedgerTab] = useState<'STATEMENT' | 'OPEN_INVOICES' | 'RECEIPTS' | 'CREDITS'>('STATEMENT');
  const [search, setSearch] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentPreselectedDoc, setPaymentPreselectedDoc] = useState<Document | null>(null);

  React.useEffect(() => {
    if (selectedCustomer) {
      setSelectedCustomerId(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Safe arrays
  const safeMovements = Array.isArray(movements) ? movements : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // Filter movements
  const filteredMovements = safeMovements.filter((m) => {
    if (!m) return false;
    const matchesCustomer = selectedCustomerId === 'ALL' || m.customerId === selectedCustomerId;
    const matchesSearch =
      !search ||
      m.customerName.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      (m.docNumber && m.docNumber.toLowerCase().includes(search.toLowerCase())) ||
      (m.receiptNumber && m.receiptNumber.toLowerCase().includes(search.toLowerCase()));
    return matchesCustomer && matchesSearch;
  });

  // Calculate Running Balance for Extrato
  let runningBalance = 0;
  const chronologicalMovements = [...filteredMovements].reverse().map((m: any) => {
    const debit = m.debit !== undefined ? m.debit : (m.type === 'SALES_INVOICE' || m.type === 'DEBIT_NOTE' || m.type === 'DEBIT' ? m.amount || 0 : 0);
    const credit = m.credit !== undefined ? m.credit : (m.type === 'RECEIPT' || m.type === 'CREDIT_NOTE' || m.type === 'CREDIT' ? m.amount || 0 : 0);
    runningBalance += (debit - credit);
    return { ...m, debit, credit, runningBalance };
  }).reverse();

  // Open Invoices Calculation
  const openInvoices = safeDocuments.filter((doc) => {
    if (doc.status === 'CANCELLED' || doc.docType === 'CREDIT_NOTE') return false;
    if (doc.paymentMethod !== 'CREDIT') return false; // Only credit invoices constitute open accounts
    if (selectedCustomerId !== 'ALL' && doc.customerId !== selectedCustomerId) return false;
    if (search && !doc.docNumber.toLowerCase().includes(search.toLowerCase()) && !doc.customerName?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // KPI Calculations
  const totalReceivables = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  
  // Overdue calculations (assuming 30 days default if not specified)
  const today = new Date();
  const overdueInvoices = openInvoices.filter((inv) => {
    const docDate = new Date(inv.date);
    const diffDays = Math.floor((today.getTime() - docDate.getTime()) / (1000 * 3600 * 24));
    return diffDays > 30;
  });
  const totalOverdueAmount = overdueInvoices.reduce((acc, inv) => acc + inv.grossAmount, 0);

  // Receipts
  const receiptsList = filteredMovements.filter((m: any) => (m.credit && m.credit > 0) || m.type === 'RECEIPT' || m.type === 'CREDIT');
  const totalReceived = receiptsList.reduce((acc, m: any) => acc + (m.credit || m.amount || 0), 0);

  const handleOpenPaymentForDoc = (doc: Document) => {
    setPaymentPreselectedDoc(doc);
    if (doc.customerId) {
      setSelectedCustomerId(doc.customerId);
    }
    setIsPaymentModalOpen(true);
  };

  const handleOpenGeneralPayment = () => {
    setPaymentPreselectedDoc(null);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total a Receber (AR)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-white font-mono mt-1">
            {(selectedCustomerId === 'ALL'
              ? totalReceivables
              : activeCustomer?.currentBalance || 0
            ).toLocaleString()}{' '}
            <span className="text-xs text-emerald-400">{currency}</span>
          </p>
          {activeCustomer && (
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Limite: {(activeCustomer.creditLimit || 0).toLocaleString()} {currency}
            </span>
          )}
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Vencido em Mora</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-rose-400 font-mono mt-1">
            {totalOverdueAmount.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
          <span className="text-[10px] text-rose-400/80 block mt-0.5 font-medium">
            {overdueInvoices.length} faturas em atraso (&gt; 30 dias)
          </span>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Faturas em Aberto</span>
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-sky-400 font-mono mt-1">
            {openInvoices.length} docs
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
            Valor: {openInvoices.reduce((acc, d) => acc + d.grossAmount, 0).toLocaleString()} {currency}
          </span>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Recebido / Amortizado</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-1">
            {totalReceived.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {receiptsList.length} liquidações efetuadas
          </span>
        </div>
      </div>

      {/* Selector & Actions Bar */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Customer Select */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <User className="w-4 h-4 text-emerald-400 shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 w-full md:w-80 cursor-pointer font-medium"
          >
            <option value="ALL">-- Visão Consolidada de Todos os Clientes --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — NIF: {c.taxId} ({currency} {(c.currentBalance || 0).toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        {/* Action: Novo Recebimento */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleOpenGeneralPayment}
            className="w-full md:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Recebimento / Regularização</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'STATEMENT', label: 'Extrato Cronológico', icon: Layers, count: chronologicalMovements.length },
            { id: 'OPEN_INVOICES', label: 'Faturas em Aberto', icon: FileText, count: openInvoices.length },
            { id: 'RECEIPTS', label: 'Histórico de Recibos (RC)', icon: Receipt, count: receiptsList.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeLedgerTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveLedgerTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white bg-[#121215] border border-[#27272a]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full font-mono">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar movimentos..."
            className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Tab 1: Extrato Cronológico com Saldo Progressivo */}
      {activeLedgerTab === 'STATEMENT' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#18181b] text-slate-400 border-b border-[#27272a]">
                  <th className="py-3 px-4 font-semibold">Data / Hora</th>
                  <th className="py-3 px-3 font-semibold">Cliente</th>
                  <th className="py-3 px-3 font-semibold">Documento / Descrição</th>
                  <th className="py-3 px-3 font-semibold">Meio / Referência</th>
                  <th className="py-3 px-3 font-semibold text-right">Débito (+)</th>
                  <th className="py-3 px-3 font-semibold text-right">Crédito (-)</th>
                  <th className="py-3 px-4 font-semibold text-right">Saldo Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60">
                {chronologicalMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                      <p className="font-medium text-slate-400">Nenhum movimento em conta-corrente</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Emita faturas a crédito ou registe pagamentos para visualizar o extrato.
                      </p>
                    </td>
                  </tr>
                ) : (
                  chronologicalMovements.map((mov) => {
                    const isDebit = mov.type === 'DEBIT';

                    return (
                      <tr key={mov.id} className="hover:bg-[#18181b]/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {mov.date}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block">{mov.customerName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">NIF: {mov.customerTaxId}</span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <span className="text-slate-200 font-medium">{mov.description}</span>
                            {mov.docNumber && (
                              <span className="text-[10px] text-emerald-400 font-mono block">
                                Doc: {mov.docNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5 text-[11px]">
                            <span className="text-slate-300 font-medium">{mov.paymentMethod || 'A Crédito'}</span>
                            {mov.reference && (
                              <span className="text-[10px] text-slate-500 font-mono block">
                                Ref: {mov.reference}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400">
                          {mov.debit > 0 ? `${mov.debit.toLocaleString()} ${currency}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          {mov.credit > 0 ? `${mov.credit.toLocaleString()} ${currency}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-white">
                          {mov.runningBalance?.toLocaleString()} {currency}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Faturas em Aberto & Vencimentos */}
      {activeLedgerTab === 'OPEN_INVOICES' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#18181b] text-slate-400 border-b border-[#27272a]">
                  <th className="py-3 px-4 font-semibold">Nº Fatura</th>
                  <th className="py-3 px-3 font-semibold">Cliente</th>
                  <th className="py-3 px-3 font-semibold">Data Emissão</th>
                  <th className="py-3 px-3 font-semibold">Vencimento / Estado</th>
                  <th className="py-3 px-3 font-semibold text-right">Valor Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Ação de Regularização</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60">
                {openInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                      <p className="font-medium text-slate-300">Sem faturas em aberto pendentes</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Todas as faturas a crédito encontram-se liquidadas.
                      </p>
                    </td>
                  </tr>
                ) : (
                  openInvoices.map((doc) => {
                    const docDate = new Date(doc.date);
                    const diffDays = Math.floor((today.getTime() - docDate.getTime()) / (1000 * 3600 * 24));
                    const isOverdue = diffDays > 30;

                    return (
                      <tr key={doc.id} className="hover:bg-[#18181b]/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-white text-xs">{doc.docNumber}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">FT - Fatura</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-white block">{doc.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">NIF: {doc.customerTaxId}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 font-mono">
                          {doc.date}
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Clock className="w-3 h-3" />
                                <span>Vencida há {diffDays - 30} dias</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                <Clock className="w-3 h-3" />
                                <span>A vencer em {30 - diffDays} dias</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-400 text-sm">
                          {doc.grossAmount.toLocaleString()} {currency}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenPaymentForDoc(doc)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Regularizar / Liquidar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Histórico de Recibos (RC) */}
      {activeLedgerTab === 'RECEIPTS' && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#18181b] text-slate-400 border-b border-[#27272a]">
                  <th className="py-3 px-4 font-semibold">Nº Recibo (RC)</th>
                  <th className="py-3 px-3 font-semibold">Cliente & NIF</th>
                  <th className="py-3 px-3 font-semibold">Data / Hora</th>
                  <th className="py-3 px-3 font-semibold">Meio de Pagamento</th>
                  <th className="py-3 px-3 font-semibold">Referência / Comprovativo</th>
                  <th className="py-3 px-4 font-semibold text-right">Valor Recebido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60">
                {receiptsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                      <p className="font-medium text-slate-400">Nenhum recibo emitido</p>
                    </td>
                  </tr>
                ) : (
                  receiptsList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-[#18181b]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-400">{rec.receiptNumber || `RC-${rec.id.slice(-6)}`}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-white block">{rec.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">NIF: {rec.customerTaxId}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {rec.date}
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {rec.paymentMethod || 'Transferência Bancária'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {rec.reference || 'REF-N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        {rec.amount.toLocaleString()} {currency}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Payment Modal */}
      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentPreselectedDoc(null);
        }}
        customers={customers}
        selectedCustomer={activeCustomer}
        documents={documents}
        bankAccounts={bankAccounts}
        currency={currency}
        onConfirmPayment={onReceiveCustomerPayment}
      />
    </div>
  );
};
