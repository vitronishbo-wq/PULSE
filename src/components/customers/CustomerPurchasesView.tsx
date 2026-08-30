import React, { useState } from 'react';
import {
  FileText,
  Search,
  Calendar,
  Filter,
  DollarSign,
  CreditCard,
  Printer,
  Share2,
  ChevronDown,
  ChevronUp,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Ban,
  ArrowRight,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Customer, Document, TenantProfile, User as UserType } from '../../types/pulse';
import { DocumentModal } from '../DocumentModal';

interface CustomerPurchasesViewProps {
  documents: Document[];
  customers: Customer[];
  tenant: TenantProfile;
  currency: string;
  currentUser: UserType;
  selectedCustomer?: Customer | null;
  onViewDocument?: (doc: Document) => void;
  onQuickReceiveForInvoice?: (doc: Document) => void;
}

export const CustomerPurchasesView: React.FC<CustomerPurchasesViewProps> = ({
  documents = [],
  customers = [],
  tenant,
  currency,
  currentUser,
  selectedCustomer,
  onViewDocument,
  onQuickReceiveForInvoice,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(selectedCustomer?.id || 'ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | '7_DAYS' | 'MONTH' | 'YEAR'>('ALL');
  const [search, setSearch] = useState('');
  const [expandedDocIds, setExpandedDocIds] = useState<Record<string, boolean>>({});
  const [inspectingDoc, setInspectingDoc] = useState<Document | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedCustomer) {
      setSelectedCustomerId(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const toggleExpand = (docId: string) => {
    setExpandedDocIds((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  // Safe documents array
  const safeDocs = Array.isArray(documents) ? documents : [];

  // Filter documents
  const filteredDocs = safeDocs.filter((d) => {
    if (!d) return false;

    // Customer match
    const matchesCustomer =
      selectedCustomerId === 'ALL' || d.customerId === selectedCustomerId;

    // Doc type match
    const matchesType = docTypeFilter === 'ALL' || d.docType === docTypeFilter;

    // Payment method match
    const matchesPayment =
      paymentMethodFilter === 'ALL' || d.paymentMethod === paymentMethodFilter;

    // Status match
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;

    // Search query match
    const matchesSearch =
      !search ||
      (d.docNumber && d.docNumber.toLowerCase().includes(search.toLowerCase())) ||
      (d.customerName && d.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (d.customerTaxId && d.customerTaxId.includes(search)) ||
      (d.hash && d.hash.toLowerCase().includes(search.toLowerCase())) ||
      (d.lines && d.lines.some((l) => l.description.toLowerCase().includes(search.toLowerCase()) || l.sku.toLowerCase().includes(search.toLowerCase())));

    // Date / Period match
    let matchesPeriod = true;
    if (periodFilter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      matchesPeriod = d.date === today;
    } else if (periodFilter === '7_DAYS') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      matchesPeriod = d.date >= sevenDaysAgo;
    } else if (periodFilter === 'MONTH') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      matchesPeriod = d.date.startsWith(currentMonth);
    } else if (periodFilter === 'YEAR') {
      const currentYear = new Date().getFullYear().toString();
      matchesPeriod = d.date.startsWith(currentYear);
    }

    return (
      matchesCustomer &&
      matchesType &&
      matchesPayment &&
      matchesStatus &&
      matchesSearch &&
      matchesPeriod
    );
  });

  // Calculate KPIs for filtered set
  const totalGross = filteredDocs
    .filter((d) => d.status !== 'CANCELLED' && d.docType !== 'CREDIT_NOTE')
    .reduce((acc, d) => acc + (d.grossAmount || 0), 0);

  const totalCreditNotes = filteredDocs
    .filter((d) => d.docType === 'CREDIT_NOTE' && d.status !== 'CANCELLED')
    .reduce((acc, d) => acc + (d.grossAmount || 0), 0);

  const totalTax = filteredDocs
    .filter((d) => d.status !== 'CANCELLED' && d.docType !== 'CREDIT_NOTE')
    .reduce((acc, d) => acc + (d.taxAmount || 0), 0);

  const netPurchases = totalGross - totalCreditNotes;

  const handleCopySummary = (doc: Document) => {
    const text = `DOCUMENTO FISCAL ${doc.docNumber} (${doc.docType})\nCliente: ${doc.customerName || 'Consumidor Final'} (NIF: ${doc.customerTaxId || '999999999'})\nData: ${doc.date}\nValor Total: ${doc.grossAmount.toLocaleString()} ${currency}\nMeio de Pagamento: ${doc.paymentMethod}\nHash AGT: ${doc.hash || 'N/A'}\nEmitido por: ${tenant.name}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedDocId(doc.id);
      setTimeout(() => setCopiedDocId(null), 2000);
    }
  };

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case 'INVOICE':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">FT - Fatura</span>;
      case 'RECEIPT':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">FR - Fatura-Recibo</span>;
      case 'CREDIT_NOTE':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold">NC - Nota de Crédito</span>;
      case 'ORDER':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">OR - Encomenda</span>;
      case 'QUOTATION':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded text-[10px] font-bold">QT - Orçamento</span>;
      case 'PROFORMA':
        return <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">PP - Pró-Forma</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">{type}</span>;
    }
  };

  const getPaymentMethodBadge = (method?: string) => {
    switch (method) {
      case 'CASH':
        return <span className="text-emerald-400 font-medium">Dinheiro / Caixa</span>;
      case 'CARD':
        return <span className="text-sky-400 font-medium">TPA / Multicaixa</span>;
      case 'BANK_TRANSFER':
        return <span className="text-purple-400 font-medium">Transf. Bancária</span>;
      case 'CREDIT':
        return <span className="text-amber-400 font-bold">Conta-Corrente (A Crédito)</span>;
      default:
        return <span className="text-slate-400">{method || 'N/A'}</span>;
    }
  };

  const activeCustomerObj = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-4">
      {/* Top Financial Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Total Comprado Bruto</span>
          <p className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
            {totalGross.toLocaleString()}{' '}
            <span className="text-xs text-emerald-400">{currency}</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Faturação Líquida</span>
          <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {netPurchases.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">IVA Liquidado Suportado</span>
          <p className="text-base sm:text-lg font-bold text-sky-400 font-mono mt-0.5">
            {totalTax.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <span className="text-[11px] font-medium text-slate-400 block">Devoluções / NCs</span>
          <p className="text-base sm:text-lg font-bold text-rose-400 font-mono mt-0.5">
            {totalCreditNotes.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 space-y-3">
        {/* Top Row: Customer Selector & Period Tabs */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Customer Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <User className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500 w-full md:w-72 cursor-pointer font-medium"
            >
              <option value="ALL">-- Todos os Clientes --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (NIF: {c.taxId})
                </option>
              ))}
            </select>
            {activeCustomerObj && (
              <span className="text-[11px] text-slate-400 hidden lg:inline font-mono">
                Saldo: <strong className="text-rose-400">{(activeCustomerObj.currentBalance || 0).toLocaleString()} {currency}</strong>
              </span>
            )}
          </div>

          {/* Period Tabs */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5 text-xs overflow-x-auto w-full md:w-auto">
            {[
              { id: 'ALL', label: 'Todo o Histórico' },
              { id: 'TODAY', label: 'Hoje' },
              { id: '7_DAYS', label: 'Últimos 7 Dias' },
              { id: 'MONTH', label: 'Este Mês' },
              { id: 'YEAR', label: 'Este Ano' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  periodFilter === p.id
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Document Types, Payment Methods & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2 border-t border-[#27272a]/60">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Doc Types Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'Todos Docs' },
                { id: 'INVOICE', label: 'Faturas (FT)' },
                { id: 'RECEIPT', label: 'Fatura-Recibo (FR)' },
                { id: 'CREDIT_NOTE', label: 'Notas Crédito (NC)' },
                { id: 'ORDER', label: 'Encomendas (OR)' },
                { id: 'QUOTATION', label: 'Orçamentos (QT)' },
                { id: 'PROFORMA', label: 'Pró-Formas (PP)' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDocTypeFilter(t.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    docTypeFilter === t.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-[#18181b] text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1 text-[11px] text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todos os Meios de Pagamento</option>
              <option value="CASH">Dinheiro / Caixa</option>
              <option value="CARD">TPA / Multicaixa</option>
              <option value="BANK_TRANSFER">Transferência Bancária</option>
              <option value="CREDIT">Conta-Corrente (A Crédito)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar nº, artigo, hash, NIF..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Documents List & Line Items Details */}
      <div className="space-y-3">
        {filteredDocs.length === 0 ? (
          <div className="bg-[#121215] border border-[#27272a] rounded-xl p-8 text-center text-slate-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
            <p className="font-medium text-slate-400">Nenhum documento emitido para os filtros selecionados</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Altere o período, selecione outro cliente ou emita novas faturas no POS.
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isExpanded = !!expandedDocIds[doc.id];
            const isCredit = doc.paymentMethod === 'CREDIT';
            const isCancelled = doc.status === 'CANCELLED';

            return (
              <div
                key={doc.id}
                className={`bg-[#121215] border rounded-xl overflow-hidden transition-all ${
                  isExpanded ? 'border-emerald-500/40 shadow-md' : 'border-[#27272a] hover:border-slate-700'
                }`}
              >
                {/* Main Card Header */}
                <div
                  onClick={() => toggleExpand(doc.id)}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="mt-0.5 sm:mt-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white font-mono text-sm">
                          {doc.docNumber}
                        </span>
                        {getDocTypeBadge(doc.docType)}
                        {isCancelled && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded text-[9px] font-bold flex items-center gap-1">
                            <Ban className="w-2.5 h-2.5" /> ANULADO
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{doc.date}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-300">
                        <span className="font-medium text-white">{doc.customerName || 'Consumidor Final'}</span>
                        <span className="text-slate-500 font-mono text-[11px]">NIF: {doc.customerTaxId || '999999999'}</span>
                        <span className="text-slate-400 text-[11px]">• Meio: {getPaymentMethodBadge(doc.paymentMethod)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Total & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#27272a]/60">
                    <div className="text-left sm:text-right">
                      <p
                        className={`text-sm sm:text-base font-bold font-mono ${
                          doc.docType === 'CREDIT_NOTE'
                            ? 'text-rose-400'
                            : isCancelled
                            ? 'text-slate-500 line-through'
                            : 'text-white'
                        }`}
                      >
                        {doc.grossAmount.toLocaleString()}{' '}
                        <span className="text-xs text-emerald-400">{currency}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        IVA: {(doc.taxAmount || 0).toLocaleString()} {currency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {/* Copy Summary */}
                      <button
                        onClick={() => handleCopySummary(doc)}
                        className="p-1.5 text-slate-400 hover:text-white bg-[#18181b] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Copiar Resumo Fiscal"
                      >
                        {copiedDocId === doc.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Print / Inspect Document Modal */}
                      <button
                        onClick={() => setInspectingDoc(doc)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Reimpressão / Consulta Completa"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reimprimir / Ver</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Section: Purchased Items & Products */}
                {isExpanded && (
                  <div className="bg-[#16161a] border-t border-[#27272a] p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Produtos & Serviços Adquiridos ({doc.lines?.length || 0} itens)</span>
                      </span>
                      {doc.hash && (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Hash AGT: {doc.hash.slice(0, 16)}...
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-[#27272a] text-[11px]">
                            <th className="py-1.5 px-2 font-medium">SKU</th>
                            <th className="py-1.5 px-2 font-medium">Designação do Artigo / Serviço</th>
                            <th className="py-1.5 px-2 font-medium text-right">Qtd</th>
                            <th className="py-1.5 px-2 font-medium text-right">P. Unitário</th>
                            <th className="py-1.5 px-2 font-medium text-right">Desc %</th>
                            <th className="py-1.5 px-2 font-medium text-right">IVA %</th>
                            <th className="py-1.5 px-2 font-medium text-right">Total Líquido</th>
                            <th className="py-1.5 px-2 font-medium text-right">Total Bruto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#27272a]/50 text-[11px] font-mono">
                          {doc.lines && doc.lines.length > 0 ? (
                            doc.lines.map((line, idx) => (
                              <tr key={line.id || idx} className="hover:bg-[#18181b]/50">
                                <td className="py-2 px-2 text-slate-400">{line.sku || 'N/A'}</td>
                                <td className="py-2 px-2 text-white font-sans font-medium">{line.description}</td>
                                <td className="py-2 px-2 text-right text-emerald-400 font-bold">{line.qty}</td>
                                <td className="py-2 px-2 text-right text-slate-300">{line.unitPrice.toLocaleString()}</td>
                                <td className="py-2 px-2 text-right text-slate-400">{line.discount ? `${line.discount}%` : '0%'}</td>
                                <td className="py-2 px-2 text-right text-sky-400">{line.taxRate}%</td>
                                <td className="py-2 px-2 text-right text-slate-300">{line.netTotal?.toLocaleString() || '-'}</td>
                                <td className="py-2 px-2 text-right text-white font-bold">{line.grossTotal.toLocaleString()} {currency}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-2 text-center text-slate-500 font-sans">
                                Detalhe de linhas não disponível para este documento.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Fiscal & Operator Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-[#27272a]/60 text-[10px] text-slate-400 gap-2 font-mono">
                      <div>
                        Operador: <strong className="text-slate-200">{doc.createdBy || 'Operador Balcão'}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Terminal: <strong>POS 01</strong></span>
                        <span>• Cert: {tenant.fiscalCertNumber || '001/AGT/2026'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Document Consultation & Reprint Modal */}
      {inspectingDoc && (
        <DocumentModal
          document={inspectingDoc}
          tenant={tenant}
          currency={currency}
          onClose={() => setInspectingDoc(null)}
        />
      )}
    </div>
  );
};
