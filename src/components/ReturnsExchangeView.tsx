import React, { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Printer,
  FileText,
  DollarSign,
  ArrowLeft,
  Calendar,
  User as UserIcon,
  Receipt,
  BadgePercent,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Document, Product, Customer, TenantProfile, User } from '../types/pulse';

interface ReturnsExchangeViewProps {
  documents: Document[];
  products: Product[];
  customers: Customer[];
  currentUser: User;
  tenant: TenantProfile;
  currency: string;
  onCompleteReturnOrExchange: (result: {
    type: 'RETURN' | 'EXCHANGE';
    originalDoc: Document;
    returnedItems: { product: Product; qty: number; unitPrice: number; reason: string }[];
    exchangeItems: { product: Product; qty: number; unitPrice: number }[];
    totalReturned: number;
    totalExchange: number;
    difference: number; // positive: customer pays; negative: refund to customer
    reason: string;
    generatedDocNumber: string;
  }) => void;
  onNavigateToTerminal?: () => void;
}

export const ReturnsExchangeView: React.FC<ReturnsExchangeViewProps> = ({
  documents = [],
  products = [],
  customers = [],
  currentUser,
  tenant,
  currency,
  onCompleteReturnOrExchange,
  onNavigateToTerminal,
}) => {
  const [step, setStep] = useState<'SEARCH_DOC' | 'SELECT_ITEMS' | 'CONFIRMATION'>('SEARCH_DOC');
  const [mode, setMode] = useState<'RETURN' | 'EXCHANGE'>('RETURN');

  // 1. Localizar documento original
  const [searchDocQuery, setSearchDocQuery] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  // 2. Selecionar artigos para devolução
  const [selectedItemIds, setSelectedItemIds] = useState<{ [itemId: string]: boolean }>({});
  const [returnQuantities, setReturnQuantities] = useState<{ [itemId: string]: number }>({});
  const [returnReason, setReturnReason] = useState<string>('Defeito no Artigo / Avaria');

  // 3. Troca por outro artigo
  const [exchangeItems, setExchangeItems] = useState<{ product: Product; qty: number; unitPrice: number }[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');

  // 4. Conclusão
  const [completedResult, setCompletedResult] = useState<any>(null);

  const returnReasons = [
    'Defeito no Artigo / Avaria',
    'Engano no Tamanho / Cor / Modelo',
    'Desistência / Insatisfação do Cliente',
    'Erro no Registo de Faturação',
    'Data de Validade Excedida / Próxima',
    'Outro Motivo Comercial',
  ];

  // Invoices & Receipts eligible for return (exclude credit notes)
  const eligibleDocs = useMemo(() => {
    return documents.filter((d) => {
      const isEligibleType =
        d.docType === 'INVOICE' ||
        d.docType === 'RECEIPT' ||
        d.docType === 'INVOICE_RECEIPT' ||
        d.docType === 'SIMPLIFIED_INVOICE';
      const isNotCancelled = d.status !== 'CANCELLED';
      const matchesSearch =
        !searchDocQuery ||
        d.docNumber.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
        d.customerName.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
        (d.customerTaxId && d.customerTaxId.includes(searchDocQuery));
      return isEligibleType && isNotCancelled && matchesSearch;
    });
  }, [documents, searchDocQuery]);

  const handleSelectDoc = (doc: Document) => {
    setSelectedDoc(doc);
    const initialSelection: { [itemId: string]: boolean } = {};
    const initialQty: { [itemId: string]: number } = {};
    const docLines = doc.lines || [];
    docLines.forEach((item) => {
      initialSelection[item.id] = false;
      initialQty[item.id] = 1;
    });
    setSelectedItemIds(initialSelection);
    setReturnQuantities(initialQty);
    setExchangeItems([]);
    setStep('SELECT_ITEMS');
  };

  // Add exchange replacement product
  const handleAddExchangeProduct = (prod: Product) => {
    const existing = exchangeItems.findIndex((e) => e.product.id === prod.id);
    if (existing > -1) {
      const updated = [...exchangeItems];
      updated[existing].qty += 1;
      setExchangeItems(updated);
    } else {
      setExchangeItems([...exchangeItems, { product: prod, qty: 1, unitPrice: prod.price }]);
    }
  };

  const handleUpdateExchangeQty = (index: number, delta: number) => {
    setExchangeItems((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const next = item.qty + delta;
            return next > 0 ? { ...item, qty: next } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: Product; qty: number; unitPrice: number }[]
    );
  };

  // Calculations
  const returnedItemsList = useMemo(() => {
    if (!selectedDoc) return [];
    const docLines = selectedDoc.lines || [];
    return docLines
      .filter((item) => selectedItemIds[item.id])
      .map((item) => ({
        product: ({
          id: item.productId || item.id,
          name: item.description,
          price: item.unitPrice,
          sku: item.sku || 'SKU-RET',
          category: 'Geral',
          stock: 10,
          unit: 'UN',
          taxRate: 0.14,
        } as unknown) as Product,
        qty: returnQuantities[item.id] || 1,
        unitPrice: item.unitPrice,
        reason: returnReason,
      }));
  }, [selectedDoc, selectedItemIds, returnQuantities, returnReason]);

  const totalReturnedValue = returnedItemsList.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const totalExchangeValue = exchangeItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const netDifference = mode === 'EXCHANGE' ? totalExchangeValue - totalReturnedValue : -totalReturnedValue;

  const handleConfirmAction = () => {
    if (!selectedDoc || returnedItemsList.length === 0) return;

    const generatedDocNumber =
      mode === 'RETURN'
        ? `NC ${new Date().getFullYear()}/${(documents.length + 1).toString().padStart(4, '0')}`
        : `FT-TROCA ${new Date().getFullYear()}/${(documents.length + 1).toString().padStart(4, '0')}`;

    const result = {
      type: mode,
      originalDoc: selectedDoc,
      returnedItems: returnedItemsList,
      exchangeItems,
      totalReturned: totalReturnedValue,
      totalExchange: totalExchangeValue,
      difference: netDifference,
      reason: returnReason,
      generatedDocNumber,
    };

    onCompleteReturnOrExchange(result);
    setCompletedResult(result);
    setStep('CONFIRMATION');
  };

  const handleReset = () => {
    setStep('SEARCH_DOC');
    setSelectedDoc(null);
    setSelectedItemIds({});
    setReturnQuantities({});
    setExchangeItems([]);
    setCompletedResult(null);
  };

  return (
    <div id="pulse-returns-exchange-view" className="space-y-4 font-mono">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Devoluções & Trocas
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AGT Fiscal NC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Localização de fatura original, seleção de artigos, motivo e emissão de Nota de Crédito ou Troca
            </p>
          </div>
        </div>

        {onNavigateToTerminal && (
          <button
            onClick={onNavigateToTerminal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-sans transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao POS Terminal</span>
          </button>
        )}
      </div>

      {/* Step Navigation / Breadcrumb */}
      <div className="grid grid-cols-3 gap-2 bg-[#121216] p-1.5 rounded-xl border border-slate-800 text-xs">
        <button
          onClick={() => step !== 'CONFIRMATION' && setStep('SEARCH_DOC')}
          disabled={step === 'CONFIRMATION'}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${
            step === 'SEARCH_DOC'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>1. Localizar Documento</span>
        </button>

        <button
          onClick={() => selectedDoc && step !== 'CONFIRMATION' && setStep('SELECT_ITEMS')}
          disabled={!selectedDoc || step === 'CONFIRMATION'}
          className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${
            step === 'SELECT_ITEMS'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : selectedDoc
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <span>2. Artigos & Acerto</span>
        </button>

        <div
          className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all ${
            step === 'CONFIRMATION'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600'
          }`}
        >
          <span>3. Conclusão & Emissão</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="bg-[#121216] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl min-h-[450px]">
        {/* STEP 1: Search Document */}
        {step === 'SEARCH_DOC' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white uppercase tracking-wider text-xs">
                  Passo 1: Selecionar Fatura Original
                </h3>
                <p className="text-[11px] text-slate-400 font-sans">
                  Insira o número do documento, nome do cliente ou NIF constante no talão original.
                </p>
              </div>
              <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg self-start">
                {eligibleDocs.length} documento(s) elegível(eis)
              </span>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por Nº de Fatura (ex: FT 2026/0001), Nome do Cliente ou NIF..."
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                autoFocus
                className="w-full bg-[#18181f] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Document List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
              {eligibleDocs.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-[#18181f] border border-slate-800 rounded-xl text-slate-400 space-y-2">
                  <Receipt className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="font-bold text-white text-sm">Nenhum documento encontrado</p>
                  <p className="text-xs text-slate-500">
                    Certifique-se de que a fatura foi emitida previamente e não se encontra anulada.
                  </p>
                </div>
              ) : (
                eligibleDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDoc(doc)}
                    className="bg-[#18181f] hover:bg-[#20202a] border border-slate-800 hover:border-amber-500/60 rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-sm group-hover:text-amber-400 transition-colors">
                            {doc.docNumber}
                          </span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                            {doc.docType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {doc.date}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 font-sans flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-semibold text-white truncate">{doc.customerName}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({doc.customerTaxId || 'Consumidor Final'})
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2 mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-sans">
                        {(doc.lines?.length ?? 0)} artigo(s) faturado(s)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 text-sm font-mono">
                          {(doc.grossAmount ?? (doc as any).total ?? 0).toLocaleString()} {currency}
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Select Items and Mode */}
        {step === 'SELECT_ITEMS' && selectedDoc && (
          <div className="space-y-4">
            {/* Header Document Summary */}
            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                  Documento Selecionado para Retificação
                </div>
                <div className="font-bold text-white text-sm font-mono flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400">{selectedDoc.docNumber}</span>
                  <span className="text-slate-400 font-normal">| {selectedDoc.customerName}</span>
                  <span className="text-emerald-400">
                    ({(selectedDoc.grossAmount ?? (selectedDoc as any).total ?? 0).toLocaleString()} {currency})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setStep('SEARCH_DOC')}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Escolher Outro Documento</span>
              </button>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setMode('RETURN')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  mode === 'RETURN'
                    ? 'bg-amber-500/15 border-amber-500/80 text-white shadow-lg'
                    : 'bg-[#18181f] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    mode === 'RETURN' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs uppercase">1. Devolução Simples (Nota de Crédito)</div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Emite Nota de Crédito fiscal e estorna o valor ao cliente / caixa.
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('EXCHANGE')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                  mode === 'EXCHANGE'
                    ? 'bg-sky-500/15 border-sky-500/80 text-white shadow-lg'
                    : 'bg-[#18181f] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    mode === 'EXCHANGE' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-sky-400'
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-xs uppercase">2. Troca por Outro Artigo</div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Substitui por novo artigo da loja com acerto de saldo a pagar/devolver.
                  </div>
                </div>
              </button>
            </div>

            {/* Articles to Return from Original Document */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px] uppercase">
                <span className="font-bold text-slate-300">Artigos da Fatura Original a Devolver:</span>
                <span className="text-amber-400 font-bold">{returnedItemsList.length} artigo(s) selecionado(s)</span>
              </div>

              <div className="bg-[#18181f] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {(selectedDoc.lines || []).map((item) => {
                  const isSelected = !!selectedItemIds[item.id];
                  const currentQty = returnQuantities[item.id] || 1;
                  const maxQty = item.qty;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            setSelectedItemIds({ ...selectedItemIds, [item.id]: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white text-xs truncate">
                            {item.description}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Preço Un: {item.unitPrice.toLocaleString()} {currency} • Qtd faturada: {maxQty}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span className="text-[10px] text-slate-400">Qtd Devolver:</span>
                          <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                            <button
                              onClick={() =>
                                setReturnQuantities({
                                  ...returnQuantities,
                                  [item.id]: Math.max(1, currentQty - 1),
                                })
                              }
                              className="px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono font-bold text-white text-xs">
                              {currentQty}
                            </span>
                            <button
                              onClick={() =>
                                setReturnQuantities({
                                  ...returnQuantities,
                                  [item.id]: Math.min(maxQty, currentQty + 1),
                                })
                              }
                              className="px-2.5 py-1 text-slate-300 hover:text-white cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-amber-300 font-mono text-xs w-24 text-right">
                            {(currentQty * item.unitPrice).toLocaleString()} {currency}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Motivo da Devolução */}
            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3 space-y-1.5">
              <label className="block text-slate-300 font-bold text-[11px] uppercase font-mono">
                Motivo da Devolução / Retificação (Obrigatório para Auditoria Fiscal AGT):
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                {returnReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Exchange: Replacement Products Selection */}
            {mode === 'EXCHANGE' && (
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-slate-300 text-[11px] font-mono uppercase">
                  <span className="font-bold">Novos Artigos de Substituição:</span>
                  <span className="text-sky-400 font-bold">{exchangeItems.length} artigo(s) adicionado(s)</span>
                </div>

                {/* Search Bar for Exchange Items */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar novo artigo da loja para substituir..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full bg-[#18181f] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
                  />
                </div>

                {productSearchQuery && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                      .slice(0, 6)
                      .map((prod) => (
                        <div
                          key={prod.id}
                          className="p-2.5 flex items-center justify-between hover:bg-slate-800 cursor-pointer"
                          onClick={() => {
                            handleAddExchangeProduct(prod);
                            setProductSearchQuery('');
                          }}
                        >
                          <div>
                            <span className="text-white font-medium block">{prod.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Stock: {prod.stock} {prod.unit}
                            </span>
                          </div>
                          <span className="text-emerald-400 font-mono font-bold">
                            +{prod.price.toLocaleString()} {currency}
                          </span>
                        </div>
                      ))}
                  </div>
                )}

                {exchangeItems.length > 0 && (
                  <div className="bg-[#18181f] border border-slate-800 rounded-xl divide-y divide-slate-800">
                    {exchangeItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <span className="text-white font-medium">{item.product.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-slate-700 rounded bg-slate-900">
                            <button
                              onClick={() => handleUpdateExchangeQty(idx, -1)}
                              className="px-2 py-0.5 text-slate-300 hover:text-white cursor-pointer"
                            >
                              -
                            </button>
                            <span className="px-2 font-mono text-white">{item.qty}</span>
                            <button
                              onClick={() => handleUpdateExchangeQty(idx, 1)}
                              className="px-2 py-0.5 text-slate-300 hover:text-white cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono text-sky-400 font-bold w-24 text-right">
                            {(item.qty * item.unitPrice).toLocaleString()} {currency}
                          </span>
                          <button
                            onClick={() => setExchangeItems(exchangeItems.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Financial Reconciliation Summary Box */}
            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Valor dos Artigos Devolvidos:</span>
                <span className="font-bold text-amber-400 font-mono">
                  -{totalReturnedValue.toLocaleString()} {currency}
                </span>
              </div>

              {mode === 'EXCHANGE' && (
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>Valor dos Novos Artigos:</span>
                  <span className="font-bold text-sky-400 font-mono">
                    +{totalExchangeValue.toLocaleString()} {currency}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-2.5 flex items-center justify-between">
                <span className="font-bold text-white text-xs uppercase">
                  {netDifference > 0 ? 'Diferença a Cobrar ao Cliente:' : 'Diferença a Devolver / Reembolsar:'}
                </span>
                <span
                  className={`font-mono text-base font-black ${
                    netDifference > 0
                      ? 'text-rose-400'
                      : netDifference < 0
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }`}
                >
                  {Math.abs(netDifference).toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => setStep('SEARCH_DOC')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Voltar à Pesquisa
              </button>

              <button
                onClick={handleConfirmAction}
                disabled={returnedItemsList.length === 0}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                  returnedItemsList.length > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {mode === 'RETURN'
                    ? 'Emitir Nota de Crédito (NC)'
                    : 'Confirmar Troca & Emitir Documento'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 'CONFIRMATION' && completedResult && (
          <div className="py-8 text-center space-y-5 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-bold text-white font-mono">
                {completedResult.type === 'RETURN'
                  ? 'Devolução Processada com Sucesso!'
                  : 'Troca de Artigos Efetuada com Sucesso!'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Documento retificativo emitido e certificado com hash AGT:
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold font-mono text-sm rounded-lg">
                {completedResult.generatedDocNumber}
              </div>
            </div>

            <div className="bg-[#18181f] border border-slate-800 rounded-xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Documento Origem:</span>
                <span className="text-white font-mono font-bold">{completedResult.originalDoc.docNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cliente:</span>
                <span className="text-white font-bold">{completedResult.originalDoc.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Motivo Registado:</span>
                <span className="text-slate-200">{completedResult.reason}</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 font-bold">
                <span>Acerto Financeiro de Caixa:</span>
                <span className={completedResult.difference > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  {completedResult.difference > 0
                    ? `Recebido do Cliente: +${completedResult.difference.toLocaleString()} ${currency}`
                    : `Devolvido ao Cliente: ${Math.abs(completedResult.difference).toLocaleString()} ${currency}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Talão / Nota de Crédito</span>
              </button>

              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer shadow-md active:scale-95"
              >
                Nova Devolução / Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
