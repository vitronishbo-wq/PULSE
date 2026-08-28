import React, { useState } from 'react';
import {
  FileCheck,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Printer,
  Share2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  Eye,
  Trash2,
  FileText,
  UserCheck,
  Building2,
  Percent,
  Layers,
  ChevronDown,
  ShieldCheck,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  CommercialQuotation,
  QuotationStatus,
  DocumentLine,
  Customer,
  Product,
  TenantProfile,
  User,
  Document,
} from '../types/pulse';

interface CommercialQuotationsViewProps {
  quotations: CommercialQuotation[];
  customers: Customer[];
  products: Product[];
  tenant: TenantProfile;
  currentUser: User;
  currency: string;
  onCreateQuotation: (quotation: Omit<CommercialQuotation, 'id' | 'docNumber' | 'createdAt'>) => void;
  onUpdateStatus: (quotationId: string, newStatus: QuotationStatus) => void;
  onConvertToSale: (quotation: CommercialQuotation, targetDocType: 'INVOICE' | 'RECEIPT') => void;
  onViewDocument?: (doc: Document) => void;
  onNavigateToDocs?: () => void;
}

export const CommercialQuotationsView: React.FC<CommercialQuotationsViewProps> = ({
  quotations = [],
  customers = [],
  products = [],
  tenant,
  currentUser,
  currency,
  onCreateQuotation,
  onUpdateStatus,
  onConvertToSale,
  onViewDocument,
  onNavigateToDocs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<CommercialQuotation | null>(null);
  const [showConvertModal, setShowConvertModal] = useState<CommercialQuotation | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  // New Quotation Form State
  const [formCustomerId, setFormCustomerId] = useState<string>(customers[0]?.id || 'cust_01');
  const [formCustomerName, setFormCustomerName] = useState<string>(customers[0]?.name || 'Consumidor Final');
  const [formCustomerTaxId, setFormCustomerTaxId] = useState<string>(customers[0]?.taxId || '999999999');
  const [formCustomerEmail, setFormCustomerEmail] = useState<string>(customers[0]?.email || '');
  const [formCustomerPhone, setFormCustomerPhone] = useState<string>(customers[0]?.phone || '');
  const [formCustomerAddress, setFormCustomerAddress] = useState<string>(customers[0]?.address || 'Luanda, Angola');
  const [validityDays, setValidityDays] = useState<number>(30);
  const [paymentTerms, setPaymentTerms] = useState<string>('Pronto Pagamento');
  const [notes, setNotes] = useState<string>('Proposta válida pelo período indicado. Preços com IVA incluído.');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [withholding6_5, setWithholding6_5] = useState<boolean>(false);

  // Lines for new quotation
  const [lines, setLines] = useState<DocumentLine[]>([
    {
      id: 'line_q_1',
      productId: products[0]?.id || 'p1',
      sku: products[0]?.sku || 'PROD-01',
      description: products[0]?.name || 'Serviço de Consultoria / Artigo Comercial',
      qty: 1,
      unitPrice: products[0]?.price || 25000,
      discount: 0,
      taxRate: products[0]?.taxRate ?? 14,
      netTotal: 21929.82,
      taxTotal: 3070.18,
      grossTotal: 25000,
    },
  ]);

  const handleCustomerChange = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    if (cust) {
      setFormCustomerId(cust.id);
      setFormCustomerName(cust.name);
      setFormCustomerTaxId(cust.taxId);
      setFormCustomerEmail(cust.email || '');
      setFormCustomerPhone(cust.phone || '');
      setFormCustomerAddress(cust.address || 'Luanda, Angola');
    }
  };

  const handleAddLine = () => {
    const defaultProd = products[0];
    const newLine: DocumentLine = {
      id: `line_q_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      productId: defaultProd?.id || 'prod_custom',
      sku: defaultProd?.sku || 'SKU-00',
      description: defaultProd?.name || 'Artigo / Serviço Comercial',
      qty: 1,
      unitPrice: defaultProd?.price || 10000,
      discount: 0,
      taxRate: defaultProd?.taxRate ?? 14,
      netTotal: (defaultProd?.price || 10000) / 1.14,
      taxTotal: (defaultProd?.price || 10000) - (defaultProd?.price || 10000) / 1.14,
      grossTotal: defaultProd?.price || 10000,
    };
    setLines([...lines, newLine]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    const updated = [...lines];
    const unitPrice = prod.price || 0;
    const qty = updated[index].qty || 1;
    const disc = updated[index].discount || 0;
    const taxRate = prod.taxRate ?? 14;
    const grossTotal = unitPrice * qty * (1 - disc / 100);
    const netTotal = taxRate > 0 ? grossTotal / (1 + taxRate / 100) : grossTotal;
    const taxTotal = grossTotal - netTotal;

    updated[index] = {
      ...updated[index],
      productId: prod.id,
      sku: prod.sku,
      description: prod.name,
      unitPrice,
      taxRate,
      grossTotal,
      netTotal,
      taxTotal,
    };
    setLines(updated);
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    const safeQty = Math.max(1, qty);
    const updated = [...lines];
    const line = updated[index];
    const grossTotal = line.unitPrice * safeQty * (1 - line.discount / 100);
    const netTotal = line.taxRate > 0 ? grossTotal / (1 + line.taxRate / 100) : grossTotal;
    const taxTotal = grossTotal - netTotal;

    updated[index] = {
      ...line,
      qty: safeQty,
      grossTotal,
      netTotal,
      taxTotal,
    };
    setLines(updated);
  };

  const handleLinePriceChange = (index: number, price: number) => {
    const safePrice = Math.max(0, price);
    const updated = [...lines];
    const line = updated[index];
    const grossTotal = safePrice * line.qty * (1 - line.discount / 100);
    const netTotal = line.taxRate > 0 ? grossTotal / (1 + line.taxRate / 100) : grossTotal;
    const taxTotal = grossTotal - netTotal;

    updated[index] = {
      ...line,
      unitPrice: safePrice,
      grossTotal,
      netTotal,
      taxTotal,
    };
    setLines(updated);
  };

  const handleLineDiscountChange = (index: number, disc: number) => {
    const safeDisc = Math.min(100, Math.max(0, disc));
    const updated = [...lines];
    const line = updated[index];
    const grossTotal = line.unitPrice * line.qty * (1 - safeDisc / 100);
    const netTotal = line.taxRate > 0 ? grossTotal / (1 + line.taxRate / 100) : grossTotal;
    const taxTotal = grossTotal - netTotal;

    updated[index] = {
      ...line,
      discount: safeDisc,
      grossTotal,
      netTotal,
      taxTotal,
    };
    setLines(updated);
  };

  // Calculations for form
  const rawSubtotalNet = lines.reduce((acc, l) => acc + l.netTotal, 0);
  const rawTaxTotal = lines.reduce((acc, l) => acc + l.taxTotal, 0);
  const rawGrossTotal = lines.reduce((acc, l) => acc + l.grossTotal, 0);

  const globalDiscountAmount = (rawGrossTotal * discountPercent) / 100;
  const finalGrossTotal = rawGrossTotal - globalDiscountAmount;
  const withholdingTaxAmount = withholding6_5 ? (rawSubtotalNet * 6.5) / 100 : 0;

  const handleSaveQuotation = (status: QuotationStatus = 'DRAFT') => {
    const today = new Date();
    const validUntilDate = new Date();
    validUntilDate.setDate(today.getDate() + validityDays);

    const formattedDate = today.toISOString().split('T')[0];
    const formattedValidUntil = validUntilDate.toISOString().split('T')[0];

    onCreateQuotation({
      date: formattedDate,
      validUntil: formattedValidUntil,
      validityDays,
      customerId: formCustomerId,
      customerName: formCustomerName,
      customerTaxId: formCustomerTaxId,
      customerEmail: formCustomerEmail,
      customerPhone: formCustomerPhone,
      customerAddress: formCustomerAddress,
      lines,
      subtotalNet: rawSubtotalNet,
      taxAmount: rawTaxTotal,
      withholdingTaxRate: withholding6_5 ? 6.5 : undefined,
      withholdingTaxAmount: withholding6_5 ? withholdingTaxAmount : undefined,
      discountPercent,
      discountAmount: globalDiscountAmount,
      grossTotal: finalGrossTotal,
      status,
      notes,
      paymentTerms,
      createdBy: currentUser.name,
    });

    setShowNewModal(false);
  };

  // Safe Quotations filtering
  const now = new Date().toISOString().split('T')[0];
  const processedQuotations = quotations.map((q) => {
    // If past validUntil and was SENT or DRAFT, tag as EXPIRED visually
    if ((q.status === 'DRAFT' || q.status === 'SENT') && q.validUntil < now) {
      return { ...q, status: 'EXPIRED' as QuotationStatus };
    }
    return q;
  });

  const filteredQuotations = processedQuotations.filter((q) => {
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      q.docNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerTaxId.includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-slate-400" /> Rascunho
          </span>
        );
      case 'SENT':
        return (
          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
            <Send className="w-3 h-3 text-sky-400" /> Enviado
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aceite
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-400" /> Recusado
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3 text-amber-400" /> Expirado
          </span>
        );
      default:
        return null;
    }
  };

  const handleShareQuote = (q: CommercialQuotation) => {
    const text = `PROPOSTA COMERCIAL ${q.docNumber}\nCliente: ${q.customerName} (NIF: ${q.customerTaxId})\nTotal: ${q.grossTotal.toLocaleString()} ${currency}\nValidade: ${q.validUntil}\nEmitido por: ${tenant.name}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setShareFeedback(`Resumo da proposta ${q.docNumber} copiado!`);
      setTimeout(() => setShareFeedback(null), 3000);
    }
  };

  // KPIs
  const totalValue = processedQuotations.reduce((acc, q) => acc + q.grossTotal, 0);
  const acceptedValue = processedQuotations
    .filter((q) => q.status === 'ACCEPTED')
    .reduce((acc, q) => acc + q.grossTotal, 0);
  const pendingCount = processedQuotations.filter((q) => q.status === 'SENT' || q.status === 'DRAFT').length;

  return (
    <div id="commercial-quotations-view" className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              COMERCIAL / PP
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              PROPOSTAS & ORÇAMENTOS (PP / QT)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestão do ciclo comercial: cotações, faturas pró-forma, aprovação e conversão imediata em faturas definitivas
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {shareFeedback && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-in fade-in">
              {shareFeedback}
            </span>
          )}
          <button
            id="btn-new-quotation"
            onClick={() => setShowNewModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Proposta / Orçamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Total em Propostas</span>
            <p className="text-lg font-bold text-white font-mono mt-0.5">
              {totalValue.toLocaleString()} <span className="text-xs text-emerald-400">{currency}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Propostas Aceites</span>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {acceptedValue.toLocaleString()} <span className="text-xs text-emerald-400">{currency}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Em Negociação / Pendentes</span>
            <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              {pendingCount} <span className="text-xs text-slate-400 font-normal">propostas ativas</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas as Propostas' },
            { id: 'DRAFT', label: 'Rascunhos' },
            { id: 'SENT', label: 'Enviadas' },
            { id: 'ACCEPTED', label: 'Aceites / Convertidas' },
            { id: 'REJECTED', label: 'Recusadas' },
            { id: 'EXPIRED', label: 'Expiradas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nº, cliente, NIF..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Nº Proposta</th>
                <th className="p-3">Data Emissão</th>
                <th className="p-3">Validade</th>
                <th className="p-3">Cliente / Entidade</th>
                <th className="p-3">NIF</th>
                <th className="p-3">Linhas</th>
                <th className="p-3">Valor Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Ações & Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhuma proposta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                    onClick={() => setSelectedQuotation(quote)}
                  >
                    <td className="p-3 font-mono font-bold text-white flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{quote.docNumber}</span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono">{quote.date}</td>
                    <td className="p-3 font-mono">
                      <span className={quote.status === 'EXPIRED' ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {quote.validUntil}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{quote.customerName}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{quote.customerTaxId}</td>
                    <td className="p-3 text-slate-400">{quote.lines.length} itens</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      {quote.grossTotal.toLocaleString()} {currency}
                    </td>
                    <td className="p-3">{getStatusBadge(quote.status)}</td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Conversion Button */}
                        {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
                          <button
                            onClick={() => setShowConvertModal(quote)}
                            title="Converter em Fatura (FT) ou Fatura-Recibo (FR)"
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Converter Venda</span>
                          </button>
                        )}

                        {quote.convertedToDocNumber && (
                          <span
                            title={`Convertido no documento ${quote.convertedToDocNumber}`}
                            className="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                          >
                            {quote.convertedToDocNumber}
                          </span>
                        )}

                        <button
                          onClick={() => handleShareQuote(quote)}
                          title="Copiar / Partilhar Proposta"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedQuotation(quote)}
                          title="Visualizar Proposta Detalhada"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVA PROPOSTA / ORÇAMENTO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-200 my-auto flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">EMITIR NOVA PROPOSTA / ORÇAMENTO (PP)</h3>
                  <p className="text-xs text-slate-400">Configuração de cotação comercial com validade e retenção fiscal AGT</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Customer & Terms Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cliente Adquirente</label>
                  <select
                    value={formCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.taxId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">NIF do Adquirente</label>
                  <input
                    type="text"
                    value={formCustomerTaxId}
                    onChange={(e) => setFormCustomerTaxId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Prazo de Validade</label>
                  <div className="flex items-center gap-1">
                    {[15, 30, 60].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setValidityDays(days)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          validityDays === days
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {days} Dias
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="ex: 50% Adiantamento + 50% na Entrega / 30 Dias"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Desconto Global (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    Itens, Quantidades e Preços
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[10px]">
                      <tr>
                        <th className="p-2.5">Artigo / Serviço</th>
                        <th className="p-2.5 w-20">Qtd</th>
                        <th className="p-2.5 w-28">P. Unitário ({currency})</th>
                        <th className="p-2.5 w-20">Desc %</th>
                        <th className="p-2.5 w-20">IVA %</th>
                        <th className="p-2.5 w-28 text-right">Total</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200">
                      {lines.map((line, idx) => (
                        <tr key={line.id}>
                          <td className="p-2">
                            <select
                              value={line.productId}
                              onChange={(e) => handleLineProductChange(idx, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={line.qty}
                              onChange={(e) => handleLineQtyChange(idx, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-center text-white outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) => handleLinePriceChange(idx, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-right text-white outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={line.discount}
                              onChange={(e) => handleLineDiscountChange(idx, Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-center text-white outline-none"
                            />
                          </td>
                          <td className="p-2 font-mono text-slate-400 text-center">{line.taxRate}%</td>
                          <td className="p-2 font-mono font-bold text-right text-emerald-400">
                            {line.grossTotal.toLocaleString()}
                          </td>
                          <td className="p-2 text-center">
                            {lines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                className="text-slate-500 hover:text-rose-400 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Notas da Proposta</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="retention-check"
                      checked={withholding6_5}
                      onChange={(e) => setWithholding6_5(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <label htmlFor="retention-check" className="text-xs text-slate-300 cursor-pointer">
                      Aplicar Retenção na Fonte de 6.5% (Serviços AGT)
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Incidência Líquida:</span>
                    <span>{rawSubtotalNet.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total IVA (14%):</span>
                    <span>{rawTaxTotal.toLocaleString()} {currency}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Desconto Comercial ({discountPercent}%):</span>
                      <span>-{globalDiscountAmount.toLocaleString()} {currency}</span>
                    </div>
                  )}
                  {withholding6_5 && (
                    <div className="flex justify-between text-amber-400">
                      <span>Retenção na Fonte (6.5%):</span>
                      <span>-{withholdingTaxAmount.toLocaleString()} {currency}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                    <span>TOTAL GERAL:</span>
                    <span className="text-emerald-400">{finalGrossTotal.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuotation('DRAFT')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Guardar Rascunho</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQuotation('SENT')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir & Marcar Enviada</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONVERTER PROPOSTA EM VENDA */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowRight className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">CONVERTER PROPOSTA EM VENDA</h3>
              </div>
              <button onClick={() => setShowConvertModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Proposta Original:</span>
                <span className="font-mono font-bold text-white">{showConvertModal.docNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="text-white font-medium">{showConvertModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Total:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {showConvertModal.grossTotal.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Selecione o tipo de documento fiscal que pretende emitir. A proposta será marcada como <strong className="text-emerald-400">Aceite</strong> com rastreabilidade cruzada (derivedFrom).
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onConvertToSale(showConvertModal, 'INVOICE');
                  setShowConvertModal(null);
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <span className="text-xs font-bold text-white block group-hover:text-emerald-400">Fatura Comercial (FT)</span>
                <span className="text-[11px] text-slate-400 block mt-1">Emissão a crédito com conta corrente de cliente</span>
              </button>

              <button
                onClick={() => {
                  onConvertToSale(showConvertModal, 'RECEIPT');
                  setShowConvertModal(null);
                }}
                className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-left transition-colors cursor-pointer shadow-md font-bold"
              >
                <span className="text-xs font-bold block">Fatura-Recibo (FR)</span>
                <span className="text-[11px] text-slate-900/80 block mt-1">Pagamento imediato com recibo de caixa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALHES DA PROPOSTA / VISUALIZAÇÃO */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">PROPOSTA COMERCIAL</span>
                <h3 className="text-base font-bold text-white">{selectedQuotation.docNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedQuotation.status)}
                <button onClick={() => setSelectedQuotation(null)} className="text-slate-400 hover:text-white p-1">✕</button>
              </div>
            </div>

            {/* Quick Status Changers */}
            <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Alterar Estado:</span>
              <div className="flex items-center gap-1">
                {(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'] as QuotationStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      onUpdateStatus(selectedQuotation.id, st);
                      setSelectedQuotation({ ...selectedQuotation, status: st });
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                      selectedQuotation.status === st
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {st === 'DRAFT' ? 'Rascunho' : st === 'SENT' ? 'Enviado' : st === 'ACCEPTED' ? 'Aceite' : 'Recusado'}
                  </button>
                ))}
              </div>
            </div>

            {/* Proposal Details Content */}
            <div className="bg-white text-slate-900 p-6 rounded-xl shadow-md space-y-4 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase">{tenant.name}</h4>
                  <p className="text-slate-600">{tenant.address}</p>
                  <p className="text-slate-600 font-mono">NIF: {tenant.taxId}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-emerald-700 uppercase font-mono">{selectedQuotation.docNumber}</h4>
                  <p className="text-slate-600">Data: {selectedQuotation.date}</p>
                  <p className="text-slate-600 font-bold">Validade: {selectedQuotation.validUntil}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Exmo.(s) Senhor(es):</span>
                <p className="font-bold text-slate-900 text-sm">{selectedQuotation.customerName}</p>
                <p className="font-mono text-slate-700">NIF: {selectedQuotation.customerTaxId}</p>
                {selectedQuotation.customerAddress && <p className="text-slate-600">{selectedQuotation.customerAddress}</p>}
              </div>

              {/* Items Table in Document */}
              <table className="w-full text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2 border border-slate-200">Descrição</th>
                    <th className="p-2 border border-slate-200 text-center w-12">Qtd</th>
                    <th className="p-2 border border-slate-200 text-right w-24">P. Unit</th>
                    <th className="p-2 border border-slate-200 text-center w-14">IVA</th>
                    <th className="p-2 border border-slate-200 text-right w-28">Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedQuotation.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="p-2 border border-slate-200 font-medium">{l.description}</td>
                      <td className="p-2 border border-slate-200 text-center">{l.qty}</td>
                      <td className="p-2 border border-slate-200 text-right font-mono">{l.unitPrice.toLocaleString()}</td>
                      <td className="p-2 border border-slate-200 text-center font-mono">{l.taxRate}%</td>
                      <td className="p-2 border border-slate-200 text-right font-mono font-bold">{l.grossTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1 text-right text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Incidência:</span>
                    <span className="font-mono">{selectedQuotation.subtotalNet.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total IVA:</span>
                    <span className="font-mono">{selectedQuotation.taxAmount.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-1">
                    <span>VALOR TOTAL:</span>
                    <span className="font-mono text-emerald-800">{selectedQuotation.grossTotal.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                  <strong>Condições:</strong> {selectedQuotation.notes}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleShareQuote(selectedQuotation)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Copiar Resumo</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedQuotation.status !== 'ACCEPTED' && (
                  <button
                    onClick={() => {
                      setShowConvertModal(selectedQuotation);
                      setSelectedQuotation(null);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Converter em Fatura</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
