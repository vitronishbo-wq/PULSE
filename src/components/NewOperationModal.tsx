import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  ShoppingCart,
  Truck,
  Receipt,
  CreditCard,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  Product,
  Customer,
  Supplier,
  User,
  PaymentMethod,
  ParsedAICommand,
} from '../types/pulse';
import { QuickOperationInput } from '../engines/Orchestrator';

interface NewOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  currentUser: User;
  onExecute: (input: QuickOperationInput) => void;
  onExecuteAI: (command: ParsedAICommand) => void;
}

type OpType = 'SALE' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'QUOTATION' | 'RETURN';

export const NewOperationModal: React.FC<NewOperationModalProps> = ({
  isOpen,
  onClose,
  products,
  customers,
  suppliers,
  currentUser,
  onExecute,
  onExecuteAI,
}) => {
  const [activeType, setActiveType] = useState<OpType>('SALE');
  const [smartPrompt, setSmartPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedCommand, setParsedCommand] = useState<ParsedAICommand | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Manual structured fallback form state
  const [manualMode, setManualMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [manualLines, setManualLines] = useState<
    { productId: string; qty: number; unitPrice: number }[]
  >([{ productId: products[0]?.id || '', qty: 1, unitPrice: products[0]?.price || 0 }]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const quickTypes: { type: OpType; label: string; icon: any; color: string }[] = [
    { type: 'SALE', label: 'Venda (FT/FR)', icon: ShoppingCart, color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' },
    { type: 'PURCHASE', label: 'Compra (CP)', icon: Truck, color: 'text-blue-400 border-blue-500/40 bg-blue-500/10' },
    { type: 'RECEIPT', label: 'Recibo Caixa', icon: Receipt, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { type: 'PAYMENT', label: 'Pagamento', icon: CreditCard, color: 'text-purple-400 border-purple-500/40 bg-purple-500/10' },
    { type: 'QUOTATION', label: 'Orçamento', icon: FileText, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
    { type: 'RETURN', label: 'Devolução / NC', icon: RotateCcw, color: 'text-rose-400 border-rose-500/40 bg-rose-500/10' },
  ];

  const examplePrompts = [
    '3 cxs de água para o João Silva a 250k',
    'Venda 2 Café Galão Especial Pulse e 1 Combo Hambúrguer ao Consumidor Final a pronto',
    'Compra 10 sacos de Arroz Basmati 5kg a 3200 Kz do Fornecedor AngoAlimentos a prazo 30 dias',
    'Orçamento de 5 Cerveja Cuca para Dra. Maria Fernandes',
  ];

  const handleParseSmartText = async (customText?: string) => {
    const textToParse = customText || smartPrompt;
    if (!textToParse.trim()) return;

    setIsParsing(true);
    setParseError(null);
    setParsedCommand(null);

    try {
      const res = await fetch('/api/v1/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToParse,
          context: {
            products: products.map((p) => ({ id: p.id, sku: p.sku, name: p.name, price: p.price })),
            customers: customers.map((c) => ({ id: c.id, name: c.name })),
            suppliers: suppliers.map((s) => ({ id: s.id, name: s.name })),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.command) {
        setParsedCommand(data.command);
      } else {
        setParseError(data.error || 'Falha ao interpretar comando.');
      }
    } catch (err: any) {
      // Fallback local heuristic parsing
      setParsedCommand({
        intent: 'CREATE_SALE',
        targetName: 'Consumidor Final',
        paymentMethod: 'CASH',
        items: [{ skuOrName: textToParse.split(' ')[0] || 'Artigo', qty: 1 }],
        notes: textToParse,
        confidence: 0.8,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmAIExecution = () => {
    if (!parsedCommand) return;
    onExecuteAI(parsedCommand);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    const sup = suppliers.find((s) => s.id === selectedSupplierId);

    onExecute({
      type: activeType,
      customerId: selectedCustomerId,
      customerName: cust?.name,
      customerTaxId: cust?.taxId,
      supplierId: selectedSupplierId,
      supplierName: sup?.name,
      items: manualLines,
      paymentMethod,
      notes,
      actor: currentUser,
    });
    onClose();
  };

  const addManualLine = () => {
    if (products.length > 0) {
      setManualLines([
        ...manualLines,
        { productId: products[0].id, qty: 1, unitPrice: products[0].price },
      ]);
    }
  };

  const removeManualLine = (idx: number) => {
    setManualLines(manualLines.filter((_, i) => i !== idx));
  };

  const updateManualLine = (idx: number, field: string, value: any) => {
    const next = [...manualLines];
    if (field === 'productId') {
      const p = products.find((prod) => prod.id === value);
      next[idx] = { ...next[idx], productId: value, unitPrice: p?.price || 0 };
    } else {
      next[idx] = { ...next[idx], [field]: value };
    }
    setManualLines(next);
  };

  return (
    <div
      id="modal-new-operation"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                NOVA OPERAÇÃO COMERCIAL
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  FAZER → CONFIRMAR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Uma Entrada → Um Evento → Infinitas Consequências Automáticas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Quick Operation Types Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="text-[11px] font-medium text-slate-400 mb-2 uppercase tracking-wider">
            1. Selecione o Tipo de Operação Rápida
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {quickTypes.map((qt) => {
              const Icon = qt.icon;
              const isSelected = activeType === qt.type;
              return (
                <button
                  key={qt.type}
                  onClick={() => {
                    setActiveType(qt.type);
                    setParsedCommand(null);
                  }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? `${qt.color} ring-1 ring-emerald-500/50 shadow-md`
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[11px] leading-tight text-center">{qt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Text Natural Language Input (AI Layer) */}
        <div className="p-4 space-y-4">
          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-3.5 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                COMANDO INTELIGENTE "SMART TEXT" (AI ENGINE)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Linguagem Natural • Resolução Automática
              </span>
            </div>

            <div className="flex gap-2">
              <input
                id="input-smart-text"
                type="text"
                value={smartPrompt}
                onChange={(e) => setSmartPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleParseSmartText();
                }}
                placeholder='Ex: "3 cxs de água para o João Silva a 250k" ou "2 cafés a pronto"'
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
              <button
                id="btn-interpret-smart-text"
                onClick={() => handleParseSmartText()}
                disabled={isParsing || !smartPrompt.trim()}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isParsing ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Interpretar</span>
              </button>
            </div>

            {/* Quick Prompt Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Exemplos:</span>
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSmartPrompt(prompt);
                    handleParseSmartText(prompt);
                  }}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md transition-colors text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>

            {parseError && (
              <div className="mt-2.5 p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Live Parsed Command Preview */}
            {parsedCommand && (
              <div className="mt-3 p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xl space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs border-b border-emerald-500/20 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Intenção Classificada: {parsedCommand.intent}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                    Confiança: {Math.round((parsedCommand.confidence || 0.9) * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">Entidade (Cliente/Fornecedor):</span>
                    <p className="font-semibold text-white">{parsedCommand.targetName || 'Consumidor Final'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Método Pagamento:</span>
                    <p className="font-semibold text-emerald-400">{parsedCommand.paymentMethod || 'CASH'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px]">Artigos Mapeados:</span>
                  <div className="mt-1 space-y-1">
                    {parsedCommand.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/80 px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between border border-slate-800"
                      >
                        <span className="font-medium text-slate-200">
                          {item.qty}x {item.skuOrName}
                        </span>
                        <span className="font-mono text-emerald-400">
                          {item.price ? `${item.price.toLocaleString()} Kz` : 'Preço de Catálogo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Ao confirmar, o Orchestrator acionará stock, contabilidade e fiscalidade.
                  </span>
                  <button
                    id="btn-confirm-ai-execution"
                    onClick={handleConfirmAIExecution}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>CONFIRMAR & EXECUTAR</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Manual Form */}
          <div className="pt-1">
            <button
              onClick={() => setManualMode(!manualMode)}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <span>{manualMode ? '▲ Ocultar Formulário Estruturado' : '▼ Preencher Linha a Linha Manualmente'}</span>
            </button>

            {manualMode && (
              <form onSubmit={handleManualSubmit} className="mt-3 space-y-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {activeType === 'PURCHASE' ? (
                    <div>
                      <label className="block text-slate-400 mb-1">Fornecedor:</label>
                      <select
                        value={selectedSupplierId}
                        onChange={(e) => setSelectedSupplierId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (NIF: {s.taxId})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-400 mb-1">Cliente:</label>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (NIF: {c.taxId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-400 mb-1">Método de Pagamento:</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                    >
                      <option value="CASH">Dinheiro (Pronto Pagamento)</option>
                      <option value="CARD">Cartão / TPA Multicaixa</option>
                      <option value="BANK_TRANSFER">Transferência Bancária</option>
                      <option value="CREDIT">Crédito em Conta Corrente (A Prazo)</option>
                    </select>
                  </div>
                </div>

                {/* Line items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Linhas de Artigos:</span>
                    <button
                      type="button"
                      onClick={addManualLine}
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Artigo
                    </button>
                  </div>

                  {manualLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                      <select
                        value={line.productId}
                        onChange={(e) => updateManualLine(idx, 'productId', e.target.value)}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.sku}] - {p.price.toLocaleString()} Kz
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) => updateManualLine(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                        className="w-16 bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-center"
                        placeholder="Qtd"
                      />
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => updateManualLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-slate-800 border border-slate-700 rounded p-1.5 text-white text-right"
                        placeholder="Preço"
                      />
                      {manualLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeManualLine(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
                  >
                    Gravar Operação Manual
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
