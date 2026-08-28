import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  FileText,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { Document, Product, Customer, TenantProfile, User } from '../types/pulse';

interface ReturnsExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export const ReturnsExchangeModal: React.FC<ReturnsExchangeModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  products = [],
  customers = [],
  currentUser,
  tenant,
  currency,
  onCompleteReturnOrExchange,
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
      const isEligibleType = d.docType === 'INVOICE' || d.docType === 'RECEIPT' || d.docType === 'INVOICE_RECEIPT';
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
    // Initialize returned items map
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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121216] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-xs font-sans overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#17171d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Gestão de Devoluções & Trocas
              </h3>
              <p className="text-[11px] text-slate-400">
                Retificação fiscal, estorno e substituição de artigos (AGT)
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {step === 'SEARCH_DOC' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase tracking-wider font-mono text-xs">
                  1. Localizar Documento Original
                </span>
                <span className="text-[11px] text-slate-400">
                  {eligibleDocs.length} documentos disponíveis
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por Nº de Fatura (ex: FT 2026/...), Nome do Cliente ou NIF..."
                  value={searchDocQuery}
                  onChange={(e) => setSearchDocQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#18181f] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Docs List */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {eligibleDocs.length === 0 ? (
                  <div className="p-8 text-center bg-[#18181f] border border-slate-800 rounded-xl text-slate-500">
                    Nenhum documento faturado encontrado com os termos de pesquisa.
                  </div>
                ) : (
                  eligibleDocs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className="bg-[#18181f] hover:bg-[#20202a] border border-slate-800 hover:border-amber-500/50 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{doc.docNumber}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                            {doc.date}
                          </span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                            {doc.docType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Cliente: <span className="text-slate-200 font-semibold">{doc.customerName}</span> • NIF: {doc.customerTaxId || 'Consumidor Final'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-bold text-emerald-400 text-xs block">
                            {(doc.grossAmount ?? (doc as any).total ?? 0).toLocaleString()} {currency}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {(doc.lines?.length ?? 0)} artigo(s)
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-300 transition-colors">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'SELECT_ITEMS' && selectedDoc && (
            <div className="space-y-4">
              
              {/* Document Header Bar */}
              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Documento Selecionado</div>
                  <div className="font-bold text-white text-sm font-mono flex items-center gap-2">
                    <span>{selectedDoc.docNumber}</span>
                    <span className="text-xs text-slate-400 font-normal">({selectedDoc.customerName})</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('SEARCH_DOC')}
                  className="text-xs text-amber-400 hover:underline cursor-pointer"
                >
                  Trocar Documento
                </button>
              </div>

              {/* Mode Toggle: Devolução vs Troca */}
              <div className="grid grid-cols-2 gap-2 bg-[#18181f] p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setMode('RETURN')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    mode === 'RETURN'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Devolução Simples (Nota de Crédito)</span>
                </button>

                <button
                  onClick={() => setMode('EXCHANGE')}
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    mode === 'EXCHANGE'
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Troca por Outro Artigo</span>
                </button>
              </div>

              {/* 2. Selecionar artigos para devolver */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
                  <span>Artigos da Fatura Original a Devolver</span>
                  <span>{returnedItemsList.length} selecionado(s)</span>
                </div>

                <div className="bg-[#18181f] border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                  {(selectedDoc.lines || []).map((item) => {
                    const isSelected = !!selectedItemIds[item.id];
                    const currentQty = returnQuantities[item.id] || 1;
                    const maxQty = item.qty;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                          isSelected ? 'bg-amber-500/10' : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              setSelectedItemIds({ ...selectedItemIds, [item.id]: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-xs truncate">
                              {item.description}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Unitário: {item.unitPrice.toLocaleString()} {currency} • Qtd na fatura: {maxQty}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">Qtd a Devolver:</span>
                            <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                              <button
                                onClick={() =>
                                  setReturnQuantities({
                                    ...returnQuantities,
                                    [item.id]: Math.max(1, currentQty - 1),
                                  })
                                }
                                className="px-2 py-1 text-slate-300 hover:text-white"
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
                                className="px-2 py-1 text-slate-300 hover:text-white"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-bold text-amber-300 font-mono text-xs w-20 text-right">
                              {(currentQty * item.unitPrice).toLocaleString()} {currency}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Motivo da Devolução */}
              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3 space-y-1.5">
                <label className="block text-slate-400 font-bold text-[11px] uppercase font-mono">
                  Motivo da Devolução / Retificação
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  {returnReasons.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Em caso de Troca: Selecionar Novos Artigos */}
              {mode === 'EXCHANGE' && (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono uppercase">
                    <span>Novos Artigos de Substituição</span>
                    <span>{exchangeItems.length} artigo(s) adicionado(s)</span>
                  </div>

                  {/* Search and add replacement product */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar novo artigo para troca..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full bg-[#18181f] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  {productSearchQuery && (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl max-h-40 overflow-y-auto divide-y divide-slate-800">
                      {products
                        .filter((p) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                        .slice(0, 5)
                        .map((prod) => (
                          <div
                            key={prod.id}
                            className="p-2 flex items-center justify-between hover:bg-slate-800 cursor-pointer"
                            onClick={() => {
                              handleAddExchangeProduct(prod);
                              setProductSearchQuery('');
                            }}
                          >
                            <span className="text-white font-medium">{prod.name}</span>
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
                                className="px-2 py-0.5 text-slate-300"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono text-white">{item.qty}</span>
                              <button
                                onClick={() => handleUpdateExchangeQty(idx, 1)}
                                className="px-2 py-0.5 text-slate-300"
                              >
                                +
                              </button>
                            </div>
                            <span className="font-mono text-sky-400 font-bold w-20 text-right">
                              {(item.qty * item.unitPrice).toLocaleString()} {currency}
                            </span>
                            <button
                              onClick={() =>
                                setExchangeItems(exchangeItems.filter((_, i) => i !== idx))
                              }
                              className="text-slate-500 hover:text-rose-400 p-1"
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

              {/* 5. Diferença a Pagar / Devolver (Cálculo Financeiro) */}
              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Valor Total Devolvido:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    -{totalReturnedValue.toLocaleString()} {currency}
                  </span>
                </div>

                {mode === 'EXCHANGE' && (
                  <div className="flex justify-between text-slate-300">
                    <span>Valor Novos Artigos:</span>
                    <span className="font-bold text-sky-400 font-mono">
                      +{totalExchangeValue.toLocaleString()} {currency}
                    </span>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                  <span className="font-bold text-white text-xs uppercase">
                    {netDifference > 0 ? 'Diferença a Pagar pelo Cliente:' : 'Diferença a Devolver / Reembolsar:'}
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setStep('SEARCH_DOC')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={returnedItemsList.length === 0}
                  className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    returnedItemsList.length > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {mode === 'RETURN'
                      ? 'Emitir Nota de Crédito'
                      : 'Confirmar Troca & Emitir Documento'}
                  </span>
                </button>
              </div>

            </div>
          )}

          {step === 'CONFIRMATION' && completedResult && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white font-mono">
                  {completedResult.type === 'RETURN'
                    ? 'Devolução Processada com Sucesso!'
                    : 'Troca de Artigos Efetuada com Sucesso!'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Documento emitido: <span className="text-amber-400 font-bold font-mono">{completedResult.generatedDocNumber}</span>
                </p>
              </div>

              <div className="bg-[#18181f] border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Documento Origem:</span>
                  <span className="text-white font-mono font-bold">{completedResult.originalDoc.docNumber}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cliente:</span>
                  <span className="text-white font-bold">{completedResult.originalDoc.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Motivo:</span>
                  <span className="text-slate-300">{completedResult.reason}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-2 font-bold">
                  <span>Acerto Financeiro:</span>
                  <span className={completedResult.difference > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {completedResult.difference > 0
                      ? `Recebido do Cliente: +${completedResult.difference.toLocaleString()} ${currency}`
                      : `Devolvido ao Cliente: ${Math.abs(completedResult.difference).toLocaleString()} ${currency}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Imprimir Comprovativo</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
