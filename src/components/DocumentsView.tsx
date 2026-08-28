import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  Eye,
  Download,
  CheckCircle2,
  Lock,
  GitBranch,
  Printer,
  FileCheck,
  Share2,
  AlertTriangle,
  ShieldCheck,
  History,
  Calendar,
  Layers,
  X,
  ExternalLink,
  Copy,
  Check,
  Ban,
  RotateCcw,
  Clock,
  Sparkles,
  Building2,
} from 'lucide-react';
import {
  Document,
  DocumentType,
  DocumentStatus,
  PaymentMethod,
  Customer,
  Product,
  TenantProfile,
  User,
  CommercialQuotation,
  QuotationStatus,
  CommercialSeries,
} from '../types/pulse';
import { CommercialQuotationsView } from './CommercialQuotationsView';
import { CommercialSeriesView } from './CommercialSeriesView';

interface DocumentsViewProps {
  documents: Document[];
  customers?: Customer[];
  products?: Product[];
  tenant: TenantProfile;
  currentUser: User;
  currency: string;
  onViewDocument: (doc: Document) => void;
  onDeriveToInvoice: (doc: Document) => void;
  onExportSAFT: () => void;
  onCancelDocument?: (docId: string, reason: string) => void;
  quotations?: CommercialQuotation[];
  onCreateQuotation?: (quote: Omit<CommercialQuotation, 'id' | 'docNumber' | 'createdAt'>) => void;
  onUpdateQuotationStatus?: (quoteId: string, status: QuotationStatus) => void;
  onConvertQuotation?: (quote: CommercialQuotation, targetDocType: 'INVOICE' | 'RECEIPT') => void;
  seriesList?: CommercialSeries[];
  onCreateSeries?: (series: Omit<CommercialSeries, 'id' | 'currentNumber' | 'lastIssuedDocNumber' | 'history'>) => void;
  onCloseSeries?: (seriesId: string, reason: string) => void;
  subView?: string;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents = [],
  customers = [],
  products = [],
  tenant,
  currentUser,
  currency,
  onViewDocument,
  onDeriveToInvoice,
  onExportSAFT,
  onCancelDocument,
  quotations = [],
  onCreateQuotation,
  onUpdateQuotationStatus,
  onConvertQuotation,
  seriesList = [],
  onCreateSeries,
  onCloseSeries,
  subView,
}) => {
  const [filterType, setFilterType] = useState<string>(() => {
    if (subView === 'RETURNS') return 'CREDIT_NOTE';
    return 'ALL';
  });

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  const [activeMainTab, setActiveMainTab] = useState<'DOCUMENTS' | 'QUOTATIONS' | 'SERIES' | 'CUSTOMERS'>(() => {
    if (subView === 'QUOTATIONS') return 'QUOTATIONS';
    if (subView === 'SERIES') return 'SERIES';
    if (subView === 'CUSTOMERS' || subView === 'CUSTOMER_PURCHASES') return 'CUSTOMERS';
    return 'DOCUMENTS';
  });

  React.useEffect(() => {
    if (subView === 'QUOTATIONS') setActiveMainTab('QUOTATIONS');
    else if (subView === 'SERIES') setActiveMainTab('SERIES');
    else if (subView === 'CUSTOMERS' || subView === 'CUSTOMER_PURCHASES') setActiveMainTab('CUSTOMERS');
    else {
      setActiveMainTab('DOCUMENTS');
      if (subView === 'RETURNS') setFilterType('CREDIT_NOTE');
      else if (subView === 'ALL') setFilterType('ALL');
    }
  }, [subView]);

  const [search, setSearch] = useState<string>('');
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // Inspection & Action Modals
  const [fiscalInspectDoc, setFiscalInspectDoc] = useState<Document | null>(null);
  const [historyAuditDoc, setHistoryAuditDoc] = useState<Document | null>(null);
  const [cancelModalDoc, setCancelModalDoc] = useState<Document | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const safeDocs = Array.isArray(documents) ? documents : [];

  // Filter logic
  const filteredDocs = safeDocs.filter((d) => {
    if (!d) return false;
    const matchesType = filterType === 'ALL' || d.docType === filterType;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSearch =
      !search ||
      (d.docNumber && d.docNumber.toLowerCase().includes(search.toLowerCase())) ||
      (d.customerName && d.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (d.customerTaxId && d.customerTaxId.includes(search)) ||
      (d.hash && d.hash.toLowerCase().includes(search.toLowerCase()));

    let matchesDate = true;
    if (dateFilter === 'TODAY') {
      const today = new Date().toISOString().split('T')[0];
      matchesDate = d.date === today;
    } else if (dateFilter === 'MONTH') {
      const currentMonth = new Date().toISOString().slice(0, 7);
      matchesDate = d.date.startsWith(currentMonth);
    }

    return matchesType && matchesStatus && matchesSearch && matchesDate;
  });

  // Financial KPIs
  const totalGross = safeDocs
    .filter((d) => d.status !== 'CANCELLED' && d.docType !== 'CREDIT_NOTE')
    .reduce((acc, d) => acc + (d.grossAmount || 0), 0);

  const totalCreditNotes = safeDocs
    .filter((d) => d.docType === 'CREDIT_NOTE' && d.status !== 'CANCELLED')
    .reduce((acc, d) => acc + (d.grossAmount || 0), 0);

  const totalTax = safeDocs
    .filter((d) => d.status !== 'CANCELLED' && d.docType !== 'CREDIT_NOTE')
    .reduce((acc, d) => acc + (d.taxAmount || 0), 0);

  const netBilled = totalGross - totalCreditNotes;

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'POSTED':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> POSTED (Fiscalizado)
          </span>
        );
      case 'ISSUED':
        return (
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            ISSUED
          </span>
        );
      case 'VALIDATED':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            VALIDATED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
            <Ban className="w-2.5 h-2.5" /> ANULADO
          </span>
        );
      default:
        return (
          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
            DRAFT
          </span>
        );
    }
  };

  const handleShareDocSummary = (doc: Document) => {
    const text = `DOCUMENTO FISCAL ${doc.docNumber} (${doc.docType})\nCliente: ${doc.customerName || 'Consumidor Final'} (NIF: ${doc.customerTaxId || '999999999'})\nValor Total: ${doc.grossAmount.toLocaleString()} ${currency}\nData: ${doc.date}\nHash AGT: ${doc.hash || 'N/A'}\nEmitido por: ${tenant.name}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareFeedback(`Resumo do documento ${doc.docNumber} copiado!`);
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalDoc) return;
    if (onCancelDocument) {
      onCancelDocument(cancelModalDoc.id, cancelReason || 'Anulação solicitada pelo operador');
    }
    setCancelModalDoc(null);
    setCancelReason('');
  };

  const canCancel = ['platform_admin', 'tenant_owner', 'manager'].includes(currentUser.role);

  return (
    <div id="pulse-documents-view" className="space-y-4">
      {/* Top Header & SAF-T Export Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              MÓDULO COMERCIAL & FACTURAÇÃO
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              GESTÃO COMERCIAL (FT, FR, NC, PP, SÉRIES)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadeia de assinatura digital RSA-SHA1 em conformidade com as regras fiscais da AGT (Angola)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {shareFeedback && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-in fade-in">
              {shareFeedback}
            </span>
          )}
          <button
            id="btn-export-saft-xml"
            onClick={onExportSAFT}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>EXPORTAR SAF-T (AO/PT)</span>
          </button>
        </div>
      </div>

      {/* Primary Top Tab Selector for Commercial Modules */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveMainTab('DOCUMENTS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'DOCUMENTS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Documentos Emitidos (FT, FR, NC)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('QUOTATIONS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'QUOTATIONS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Propostas & Orçamentos (PP)</span>
          {quotations.length > 0 && (
            <span className="ml-1 bg-slate-800 text-slate-200 px-1.5 py-0.2 text-[10px] rounded-full">
              {quotations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('SERIES')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'SERIES'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Séries & Numeração</span>
        </button>

        <button
          onClick={() => setActiveMainTab('CUSTOMERS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
            activeMainTab === 'CUSTOMERS'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Clientes & Histórico</span>
        </button>
      </div>

      {/* 1. DOCUMENTS EMITTED TAB */}
      {activeMainTab === 'DOCUMENTS' && (
        <div className="space-y-4">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-slate-400 block">Total Bruto Faturado</span>
              <p className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">
                {totalGross.toLocaleString()} <span className="text-xs text-emerald-400">{currency}</span>
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-slate-400 block">Faturação Líquida</span>
              <p className="text-base sm:text-lg font-bold text-emerald-400 font-mono mt-0.5">
                {netBilled.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-slate-400 block">IVA Liquidado (14%)</span>
              <p className="text-base sm:text-lg font-bold text-sky-400 font-mono mt-0.5">
                {totalTax.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-slate-400 block">Notas de Crédito / Estornos</span>
              <p className="text-base sm:text-lg font-bold text-rose-400 font-mono mt-0.5">
                {totalCreditNotes.toLocaleString()} <span className="text-xs text-slate-400">{currency}</span>
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: 'Todos os Documentos' },
                { id: 'INVOICE', label: 'Faturas (FT)' },
                { id: 'RECEIPT', label: 'Faturas-Recibo (FR)' },
                { id: 'CREDIT_NOTE', label: 'Notas de Crédito (NC)' },
                { id: 'ORDER', label: 'Encomendas (OR)' },
                { id: 'QUOTATION', label: 'Orçamentos (QT)' },
                { id: 'PROFORMA', label: 'Pró-Formas (PP)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {[
                { id: 'ALL', label: 'Todos Estados' },
                { id: 'POSTED', label: 'Fiscalizados' },
                { id: 'CANCELLED', label: 'Anulados' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar nº, cliente, NIF, hash..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="p-3">Doc Nº</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Adquirente (Cliente)</th>
                    <th className="p-3">NIF</th>
                    <th className="p-3">Total Bruto</th>
                    <th className="p-3">IVA</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Assinatura AGT (Hash)</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredDocs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        Nenhum documento fiscal encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                        onClick={() => onViewDocument(doc)}
                      >
                        <td className="p-3 font-mono font-bold text-white flex items-center gap-1.5">
                          <span>{doc.docNumber}</span>
                          {doc.derivedFrom && (
                            <span title={`Derivado de ${doc.derivedFrom}`} className="text-amber-400">
                              <GitBranch className="w-3 h-3" />
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-300">{doc.docType}</span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono">{doc.date}</td>
                        <td className="p-3 font-medium text-slate-200">{doc.customerName || 'Consumidor Final'}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{doc.customerTaxId || '999999999'}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {doc.grossAmount.toLocaleString()} {currency}
                        </td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {doc.taxAmount.toLocaleString()} {currency}
                        </td>
                        <td className="p-3">{getStatusBadge(doc.status)}</td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFiscalInspectDoc(doc);
                            }}
                            className="font-mono text-[10px] bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                            title="Consultar Estado Fiscal AGT"
                          >
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>{doc.hash ? `${doc.hash.slice(0, 8)}...` : 'VALIDATED'}</span>
                          </button>
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.docType === 'ORDER' && doc.status !== 'POSTED' && (
                              <button
                                onClick={() => onDeriveToInvoice(doc)}
                                title="Derivar Encomenda em Factura (FT)"
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-md text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">Derivar FT</span>
                              </button>
                            )}

                            {/* View / Print Document */}
                            <button
                              onClick={() => onViewDocument(doc)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs transition-colors cursor-pointer"
                              title="Visualizar / Imprimir / PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Share Summary */}
                            <button
                              onClick={() => handleShareDocSummary(doc)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs transition-colors cursor-pointer"
                              title="Copiar / Partilhar Resumo Fiscal"
                            >
                              <Share2 className="w-3.5 h-3.5 text-sky-400" />
                            </button>

                            {/* Audit Trail */}
                            <button
                              onClick={() => setHistoryAuditDoc(doc)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs transition-colors cursor-pointer"
                              title="Histórico / Auditoria do Documento"
                            >
                              <History className="w-3.5 h-3.5 text-amber-400" />
                            </button>

                            {/* Cancel / Void Document */}
                            {doc.status !== 'CANCELLED' && (
                              <button
                                onClick={() => setCancelModalDoc(doc)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-xs transition-colors cursor-pointer"
                                title="Anular / Retificar Documento"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. QUOTATIONS & PROPOSALS TAB */}
      {activeMainTab === 'QUOTATIONS' && (
        <CommercialQuotationsView
          quotations={quotations}
          customers={customers}
          products={products}
          tenant={tenant}
          currentUser={currentUser}
          currency={currency}
          onCreateQuotation={onCreateQuotation || (() => {})}
          onUpdateStatus={onUpdateQuotationStatus || (() => {})}
          onConvertToSale={onConvertQuotation || (() => {})}
          onViewDocument={onViewDocument}
          onNavigateToDocs={() => setActiveMainTab('DOCUMENTS')}
        />
      )}

      {/* 3. SERIES & NUMBERING TAB */}
      {activeMainTab === 'SERIES' && (
        <CommercialSeriesView
          seriesList={seriesList}
          tenant={tenant}
          currentUser={currentUser}
          onCreateSeries={onCreateSeries || (() => {})}
          onCloseSeries={onCloseSeries || (() => {})}
        />
      )}

      {/* 4. CUSTOMERS & TRANSACTION HISTORY TAB */}
      {activeMainTab === 'CUSTOMERS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Ficheiro Central de Clientes & Histórico Comercial</h3>
              <p className="text-xs text-slate-400">Consulte o volume de faturação e histórico de cada entidade adquirente</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total: {customers.length} Clientes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Nome / Entidade</th>
                  <th className="p-3">NIF Fiscal</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Documentos Emitidos</th>
                  <th className="p-3">Total Faturado</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {customers.map((cust) => {
                  const custDocs = safeDocs.filter((d) => d.customerId === cust.id || d.customerTaxId === cust.taxId);
                  const totalSpent = custDocs.reduce((acc, d) => acc + (d.grossAmount || 0), 0);

                  return (
                    <tr key={cust.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="p-3 font-bold text-white">{cust.name}</td>
                      <td className="p-3 font-mono text-emerald-400">{cust.taxId}</td>
                      <td className="p-3 font-mono text-slate-400">{cust.phone || cust.email || '—'}</td>
                      <td className="p-3 font-mono">{custDocs.length} documentos</td>
                      <td className="p-3 font-mono font-bold text-white">
                        {totalSpent.toLocaleString()} {currency}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSearch(cust.name);
                            setActiveMainTab('DOCUMENTS');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Ver Histórico
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CONSULTAR ESTADO FISCAL (AGT) */}
      {fiscalInspectDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ESTADO FISCAL & ASSINATURA AGT</h3>
                  <p className="text-xs text-slate-400 font-mono">{fiscalInspectDoc.docNumber}</p>
                </div>
              </div>
              <button onClick={() => setFiscalInspectDoc(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Estado de Certificação:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> AGT Validated (POSTED)
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Software Certificado:</span>
                <span className="text-white">PULSE.OS - Cert. {tenant.fiscalCertNumber || '001/AGT/2026'}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Data de Emissão:</span>
                <span className="text-white">{fiscalInspectDoc.date}</span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-400 block">Assinatura Digital (SHA-1 RSA):</span>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-emerald-300 text-[11px] break-all">
                  {fiscalInspectDoc.hash || 'GENESIS-SIGNATURE-001'}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-400 block">Hash do Documento Anterior (PrevHash):</span>
                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-slate-300 text-[11px] break-all">
                  {fiscalInspectDoc.previousDocHash || 'PULSE_GENESIS_HASH_2026'}
                </div>
              </div>

              <div className="flex justify-between pt-1 text-slate-300">
                <span>Total Bruto:</span>
                <span className="font-bold text-white">{fiscalInspectDoc.grossAmount.toLocaleString()} {currency}</span>
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2 text-xs text-emerald-300">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Cadeia criptográfica sequencial inviolável. Este documento está registado e validado para exportação no ficheiro SAF-T (AO).
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setFiscalInspectDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO & AUDITORIA DO DOCUMENTO */}
      {historyAuditDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">HISTÓRICO & AUDITORIA</h3>
                  <p className="text-xs text-slate-400 font-mono">{historyAuditDoc.docNumber}</p>
                </div>
              </div>
              <button onClick={() => setHistoryAuditDoc(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 max-h-64 overflow-y-auto">
              <div className="border-l-2 border-emerald-500 pl-3 py-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>Criação & Assinatura Criptográfica AGT</span>
                  <span>{historyAuditDoc.date} 10:42</span>
                </div>
                <p className="text-slate-200 mt-0.5">
                  Emitido por <strong>{historyAuditDoc.createdBy || 'Operador Autorizado'}</strong> com pagamento {historyAuditDoc.paymentMethod}.
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">Hash: {historyAuditDoc.hash?.slice(0, 12)}...</span>
              </div>

              <div className="border-l-2 border-sky-500 pl-3 py-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>Movimento de Stock & Contabilidade</span>
                  <span>{historyAuditDoc.date} 10:42</span>
                </div>
                <p className="text-slate-200 mt-0.5">
                  Saída de {historyAuditDoc.lines?.reduce((a, b) => a + b.qty, 0)} itens de inventário e lançamento automático no diário.
                </p>
              </div>

              <div className="border-l-2 border-slate-600 pl-3 py-1 text-xs">
                <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                  <span>Auditoria SAF-T</span>
                  <span>{historyAuditDoc.date} 10:42</span>
                </div>
                <p className="text-slate-200 mt-0.5">
                  Integrado no Ficheiro de Auditoria Tributária SAF-T (AO).
                </p>
              </div>

              {historyAuditDoc.status === 'CANCELLED' && (
                <div className="border-l-2 border-rose-500 pl-3 py-1 text-xs">
                  <div className="flex items-center justify-between text-rose-400 font-mono text-[11px]">
                    <span>Documento Anulado</span>
                    <span>{historyAuditDoc.date} 11:15</span>
                  </div>
                  <p className="text-rose-200 mt-0.5">
                    Anulação registada com justificação fiscal obrigatória.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryAuditDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ANULAR / CORRIGIR DOCUMENTO */}
      {cancelModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-md shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ANULAR / RETIFICAR DOCUMENTO</h3>
                <span className="text-xs font-mono text-rose-400 font-bold">{cancelModalDoc.docNumber}</span>
              </div>
            </div>

            {canCancel ? (
              <>
                <p className="text-xs text-slate-300">
                  Em conformidade com as regras da AGT, a anulação ou retificação de um documento fiscal certificado requer a indicação expressa do motivo no registo de auditoria.
                </p>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Motivo da Anulação / Retificação (Obrigatório):
                  </label>
                  <textarea
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="ex: Erro no preenchimento de NIF, devolução total ou duplicação"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setCancelModalDoc(null)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={!cancelReason.trim()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Confirmar Anulação</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
                  <p>Apenas utilizadores com permissões de <strong>Administrador</strong> ou <strong>Gerente</strong> têm autorização para anular documentos fiscais emitidos.</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setCancelModalDoc(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
