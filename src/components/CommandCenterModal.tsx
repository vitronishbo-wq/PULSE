import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Command as CommandIcon,
  Sparkles,
  ArrowRight,
  Receipt,
  ShoppingCart,
  DollarSign,
  Package,
  Layers,
  Users,
  ShieldCheck,
  Building,
  RefreshCw,
  X,
  FileText,
  Keyboard,
  Mic,
  ScanLine,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Product, Customer, Document, User, ParsedAICommand, NormalizedCommand, InputSourceType } from '../types/pulse';
import { Orchestrator } from '../engines/Orchestrator';
import { InputNormalizer } from '../engines/InputNormalizer';
import { UniversalVirtualKeyboard } from './UniversalVirtualKeyboard';
import { VoiceCommandButton } from './VoiceCommandButton';

interface CommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  onOpenQuickOp: (type: 'SALE' | 'PURCHASE' | 'RECEIPT' | 'PAYMENT' | 'QUOTATION' | 'RETURN') => void;
  onOpenAdmin: () => void;
  onOpenProvisioningWizard?: () => void;
  onOpenSubscription?: () => void;
  currentUser: User;
}

export const CommandCenterModal: React.FC<CommandCenterModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenQuickOp,
  onOpenAdmin,
  onOpenProvisioningWizard,
  onOpenSubscription,
  currentUser,
}) => {

  const orchestrator = Orchestrator.getInstance();
  const normalizer = InputNormalizer.getInstance();

  const [query, setQuery] = useState('');
  const [aiResult, setAiResult] = useState<ParsedAICommand | null>(null);
  const [lastNormalized, setLastNormalized] = useState<NormalizedCommand | null>(null);
  const [activeInputSource, setActiveInputSource] = useState<InputSourceType>('PHYSICAL_KEYBOARD');
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [showPipelineDiagram, setShowPipelineDiagram] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setAiResult(null);
      setLastNormalized(null);
    }
  }, [isOpen]);

  // Subscribe to normalized input events
  useEffect(() => {
    const unsub = normalizer.onCommand((cmd) => {
      setLastNormalized(cmd);
      setActiveInputSource(cmd.sourceType);

      // Handle direct commands
      if (cmd.intent === 'INVOKE_PLATFORM_CONTROL') {
        onClose();
        onOpenAdmin();
      } else if (cmd.intent === 'NAVIGATE_VIEW' && cmd.parameters.tab) {
        onClose();
        onNavigate(cmd.parameters.tab.toLowerCase());
      } else if (cmd.intent === 'CREATE_SALE') {
        onClose();
        onOpenQuickOp('SALE');
      } else if (cmd.intent === 'CREATE_PURCHASE') {
        onClose();
        onOpenQuickOp('PURCHASE');
      } else if (cmd.intent === 'CREATE_RECEIPT') {
        onClose();
        onOpenQuickOp('RECEIPT');
      } else if (cmd.intent === 'CREATE_PAYMENT') {
        onClose();
        onOpenQuickOp('PAYMENT');
      } else if (cmd.intent === 'CREATE_QUOTATION') {
        onClose();
        onOpenQuickOp('QUOTATION');
      }
    });

    return unsub;
  }, [onClose, onNavigate, onOpenAdmin, onOpenQuickOp]);

  if (!isOpen) return null;

  const products = orchestrator.stockEngine.getProducts();
  const customers = orchestrator.moneyEngine.getCustomers();
  const documents = orchestrator.commerceEngine.getDocuments();

  // Search filtering
  const qLower = query.toLowerCase().trim();

  const filteredProducts = qLower
    ? products
        .filter((p) => p.name.toLowerCase().includes(qLower) || p.sku.toLowerCase().includes(qLower) || p.barcode?.includes(qLower))
        .slice(0, 4)
    : [];

  const filteredCustomers = qLower
    ? customers
        .filter((c) => c.name.toLowerCase().includes(qLower) || c.taxId.includes(qLower))
        .slice(0, 3)
    : [];

  const filteredDocuments = qLower
    ? documents
        .filter((d) => d.docNumber.toLowerCase().includes(qLower) || d.customerName?.toLowerCase().includes(qLower))
        .slice(0, 3)
    : [];

  const handleRunInputPipeline = (text: string, source: InputSourceType = 'PHYSICAL_KEYBOARD') => {
    if (!text) return;
    setActiveInputSource(source);

    // Ingest into Universal Input Normalizer Pipeline
    const normalized = normalizer.ingestRawInput(text, source, 'COMMAND');
    setLastNormalized(normalized);

    // Also run Natural AI Command Parser
    const parsed = orchestrator.aiEngine.parseNaturalCommand(text, products);
    setAiResult(parsed);
  };

  const handleExecuteAI = () => {
    if (!aiResult) return;
    const res = orchestrator.executeAICommand(aiResult, currentUser);
    if (res.success) {
      onClose();
    }
  };

  const handleSimulateScanner = () => {
    if (!barcodeInput.trim()) return;
    normalizer.ingestRawInput(barcodeInput.trim(), 'BARCODE_SCANNER', 'SEARCH');
    setQuery(barcodeInput.trim());
    setBarcodeInput('');
  };

  const quickCommands = [
    {
      id: 'cmd-sale',
      label: 'Fazer Factura / Venda',
      shortcut: 'F2',
      icon: Receipt,
      action: () => {
        normalizer.ingestRawInput('F2', 'SHORTCUT_TRIGGER');
        onClose();
        onOpenQuickOp('SALE');
      },
    },
    {
      id: 'cmd-purchase',
      label: 'Registar Entrada de Compra',
      shortcut: 'F3',
      icon: ShoppingCart,
      action: () => {
        normalizer.ingestRawInput('F3', 'SHORTCUT_TRIGGER');
        onClose();
        onOpenQuickOp('PURCHASE');
      },
    },
    {
      id: 'cmd-receipt',
      label: 'Emitir Recibo de Cobrança',
      shortcut: 'F4',
      icon: DollarSign,
      action: () => {
        normalizer.ingestRawInput('F4', 'SHORTCUT_TRIGGER');
        onClose();
        onOpenQuickOp('RECEIPT');
      },
    },
    {
      id: 'cmd-pos',
      label: 'Abrir Terminal POS Touch',
      shortcut: 'POS',
      icon: Package,
      action: () => {
        normalizer.ingestRawInput('/pos', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('pos');
      },
    },
    {
      id: 'cmd-kds',
      label: 'Mesas & Cozinha (KDS)',
      shortcut: 'KDS',
      icon: Layers,
      action: () => {
        normalizer.ingestRawInput('/kds', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('kds_tables');
      },
    },
    {
      id: 'cmd-batches',
      label: 'Lotes & Validades (Farmácia)',
      shortcut: 'FARM',
      icon: Package,
      action: () => {
        normalizer.ingestRawInput('/lotes', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('batches');
      },
    },
    {
      id: 'cmd-stock',
      label: 'Stock & Receitas (BOM)',
      shortcut: 'STK',
      icon: Layers,
      action: () => {
        normalizer.ingestRawInput('/stock', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('stock');
      },
    },
    {
      id: 'cmd-customers',
      label: 'Clientes, Histórico de Compras & Conta-Corrente',
      shortcut: 'CLI',
      icon: Users,
      action: () => {
        normalizer.ingestRawInput('/clientes', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('customers');
      },
    },
    {
      id: 'cmd-treasury',
      label: 'Tesouraria & Diário de Caixa',
      shortcut: 'TES',
      icon: DollarSign,
      action: () => {
        normalizer.ingestRawInput('/tesouraria', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('treasury');
      },
    },
    {
      id: 'cmd-hr',
      label: 'RH & Folha de Salários',
      shortcut: 'RH',
      icon: Users,
      action: () => {
        normalizer.ingestRawInput('/rh', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('hr');
      },
    },
    {
      id: 'cmd-fiscal',
      label: 'Fiscalidade, SAF-T & AGT',
      shortcut: 'AGT',
      icon: FileText,
      action: () => {
        normalizer.ingestRawInput('/fiscal', 'SHORTCUT_TRIGGER');
        onClose();
        onNavigate('fiscal');
      },
    },
    {
      id: 'cmd-admin',
      label: 'Platform Control (*#7668#)',
      shortcut: '*#7668#',
      icon: ShieldCheck,
      action: () => {
        normalizer.ingestRawInput('*#7668#', 'SERVICE_DIALER');
        onClose();
        onOpenAdmin();
      },
    },
    {
      id: 'cmd-subscription-wizard',
      label: 'Subscrição Assistida (Perguntas Rápidas & OTP)',
      shortcut: 'SUBS',
      icon: Sparkles,
      action: () => {
        onClose();
        if (onOpenSubscription) {
          onOpenSubscription();
        } else if (onOpenProvisioningWizard) {
          onOpenProvisioningWizard();
        }
      },
    },
    {
      id: 'cmd-new-tenant',
      label: 'Novo Tenant / Provisionar Segmento (Wizard)',
      shortcut: 'NEW',
      icon: Building,
      action: () => {
        onClose();
        if (onOpenProvisioningWizard) {
          onOpenProvisioningWizard();
        } else {
          onOpenAdmin();
        }
      },
    },
  ];


  const matchedCommands = qLower
    ? quickCommands.filter((c) => c.label.toLowerCase().includes(qLower) || c.shortcut.toLowerCase().includes(qLower))
    : quickCommands;

  return (
    <div
      id="modal-command-center"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-start justify-center pt-10 sm:pt-16 p-3"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-200 flex flex-col font-mono text-xs animate-in fade-in zoom-in-95">
        {/* Top Universal Input Layer Architecture Status */}
        <div className="bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white tracking-wide">COMMAND CENTER</span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 border border-emerald-500/30 rounded">
              INPUT UNIVERSAL LAYER
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Input Source Badge */}
            <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700 uppercase font-bold flex items-center gap-1">
              Fonte Ativa: <span className="text-emerald-400">{activeInputSource.replace('_', ' ')}</span>
            </span>

            {/* Toggle Pipeline Diagram */}
            <button
              onClick={() => setShowPipelineDiagram(!showPipelineDiagram)}
              className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${
                showPipelineDiagram
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Pipeline</span>
            </button>

            {/* Virtual Keyboard Toggle */}
            <button
              onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
              className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 border transition-colors ${
                showVirtualKeyboard
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Keyboard className="w-3 h-3" />
              <span>Teclado Universal</span>
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pipeline Architecture Diagram (Visualizer) */}
        {showPipelineDiagram && (
          <div className="p-3 bg-slate-950 border-b border-slate-800 text-[10px] space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-slate-400 font-bold uppercase">
              <span>Fluxo Transversal: Qualquer Input → Core</span>
              <span className="text-emerald-400">PULSE.OS Architecture Rule</span>
            </div>
            <div className="grid grid-cols-6 gap-1 text-center font-bold">
              <div className="bg-slate-800/80 p-1.5 rounded border border-slate-700 text-slate-300">
                <span className="block text-[8px] text-slate-500 uppercase">1. Origem</span>
                INPUT SOURCE
              </div>
              <div className="bg-emerald-950/60 p-1.5 rounded border border-emerald-500/40 text-emerald-300">
                <span className="block text-[8px] text-emerald-500 uppercase">2. Camada</span>
                NORMALIZER
              </div>
              <div className="bg-sky-950/60 p-1.5 rounded border border-sky-500/40 text-sky-300">
                <span className="block text-[8px] text-sky-500 uppercase">3. Parsing</span>
                PARSER
              </div>
              <div className="bg-purple-950/60 p-1.5 rounded border border-purple-500/40 text-purple-300">
                <span className="block text-[8px] text-purple-500 uppercase">4. Decisão</span>
                INTENT
              </div>
              <div className="bg-amber-950/60 p-1.5 rounded border border-amber-500/40 text-amber-300">
                <span className="block text-[8px] text-amber-500 uppercase">5. Regras</span>
                VALIDATION
              </div>
              <div className="bg-emerald-600 p-1.5 rounded text-slate-950 font-black">
                <span className="block text-[8px] text-slate-900 uppercase">6. Execução</span>
                CORE ENGINE
              </div>
            </div>
            <div className="text-[10px] text-slate-400 italic">
              "O PULSE não sabe nem precisa saber de onde veio o comando. Teclado físico, toque, numpad, voz, leitor laser ou atalhos convergem no mesmo Command Center."
            </div>
          </div>
        )}

        {/* Universal Input Header Input */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800 bg-slate-900">
          <Search className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAiResult(null);
              normalizer.ingestRawInput(e.target.value, 'PHYSICAL_KEYBOARD', 'COMMAND');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.length > 2 && !aiResult) {
                handleRunInputPipeline(query, 'PHYSICAL_KEYBOARD');
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Comando, artigo, cliente, código (*#7668#) ou frase natural (ex: 'Venda de 5 Coca-Cola')..."
            className="bg-transparent text-white focus:outline-none w-full text-xs font-mono placeholder:text-slate-500"
          />

          {/* Voice Command Button */}
          <VoiceCommandButton
            onTranscriptReady={(transcript) => {
              setQuery(transcript);
              handleRunInputPipeline(transcript, 'VOICE_RECOGNITION');
            }}
          />

          {/* Interpret / Execute Action */}
          {query && (
            <button
              onClick={() => handleRunInputPipeline(query, activeInputSource)}
              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 shrink-0 shadow"
              title="Processar no Pipeline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interpretar</span>
            </button>
          )}
        </div>

        {/* Live Normalized Command & AI Intent Preview Box */}
        {(lastNormalized || aiResult) && (
          <div className="p-3 bg-emerald-950/30 border-b border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                  INTENT: {lastNormalized?.intent || aiResult?.intent}
                </span>
                <span className="text-slate-400 text-[10px]">
                  Confiança: <strong>{Math.round((lastNormalized?.confidence || 0.9) * 100)}%</strong>
                </span>
              </div>

              {aiResult && (
                <div className="text-slate-200">
                  Alvo: <strong>{aiResult.targetName || 'Consumidor Final'}</strong> | Pagamento:{' '}
                  <strong>{aiResult.paymentMethod}</strong> | Artigos:{' '}
                  <strong>{aiResult.items.map((i) => `${i.qty}x ${i.skuOrName}`).join(', ')}</strong>
                </div>
              )}
            </div>

            {aiResult && (
              <button
                onClick={handleExecuteAI}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded font-bold text-[11px] shrink-0 flex items-center justify-center gap-1 shadow"
              >
                <span>Executar no Core</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Hardware Barcode Scanner Quick Test Strip */}
        <div className="px-3 py-1.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2 text-[10px]">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ScanLine className="w-3.5 h-3.5 text-emerald-400" />
            <span>Entrada Automática Scanner:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Laser Barcode (ex: 560123456789)"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulateScanner()}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white text-[10px] w-full focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSimulateScanner}
              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-bold shrink-0"
            >
              Scan
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[50vh] overflow-y-auto divide-y divide-slate-800 p-1">
          {/* Quick Actions & Navigation */}
          {matchedCommands.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                Comandos & Atalhos Reconhecidos ({matchedCommands.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {matchedCommands.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      onClick={cmd.action}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between text-[11px] group transition-colors"
                    >
                      <div className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
                        <span>{cmd.label}</span>
                      </div>
                      <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800 font-mono">
                        {cmd.shortcut}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Result: Products */}
          {filteredProducts.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                Artigos do Catálogo ({filteredProducts.length})
              </div>
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    normalizer.ingestRawInput(`venda ${p.name}`, 'PHYSICAL_KEYBOARD');
                    onClose();
                    onOpenQuickOp('SALE');
                  }}
                  className="px-2.5 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between text-[11px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <span className="text-white font-bold">{p.name}</span>
                      <span className="text-slate-500 ml-2">SKU: {p.sku}</span>
                      {p.barcode && <span className="text-emerald-500/80 ml-2">BAR: {p.barcode}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">{p.price.toLocaleString()} {orchestrator.tenant.currency}</span>
                    <span className="text-slate-500 ml-2">Stock: {p.currentStock} {p.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Result: Customers */}
          {filteredCustomers.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                Clientes & Contas Correntes ({filteredCustomers.length})
              </div>
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    normalizer.ingestRawInput(`recibo ${c.name}`, 'PHYSICAL_KEYBOARD');
                    onClose();
                    onNavigate('treasury');
                  }}
                  className="px-2.5 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between text-[11px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <div>
                      <span className="text-white font-bold">{c.name}</span>
                      <span className="text-slate-500 ml-2">NIF: {c.taxId}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-300">Saldo: {c.currentBalance.toLocaleString()} {orchestrator.tenant.currency}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Result: Documents */}
          {filteredDocuments.length > 0 && (
            <div className="p-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-0.5">
                Documentos Fiscais ({filteredDocuments.length})
              </div>
              {filteredDocuments.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    onClose();
                    onNavigate('docs');
                  }}
                  className="px-2.5 py-1.5 rounded hover:bg-slate-800 flex items-center justify-between text-[11px] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <span className="text-white font-bold">{d.docNumber}</span>
                      <span className="text-slate-400 ml-2">{d.customerName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">{d.grossAmount.toLocaleString()} {orchestrator.tenant.currency}</span>
                    <span className="text-slate-500 ml-2">{d.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-3 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Atalhos:</span>
            <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">/</kbd>
            <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">Ctrl+K</kbd>
            <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">F1 (Ajuda)</kbd>
            <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">Ctrl+S</kbd>
            <kbd className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-slate-400">Ctrl+P</kbd>
          </div>
          <div>
            PULSE.OS Kernel • Tenant: <span className="text-emerald-400">{orchestrator.tenant.tradeName}</span>
          </div>
        </div>
      </div>

      {/* Universal Virtual Keyboard Drawer for Touch/Tablets */}
      <UniversalVirtualKeyboard
        isOpen={showVirtualKeyboard}
        onClose={() => setShowVirtualKeyboard(false)}
        onKeyPress={(key) => {
          if (key === 'Backspace') {
            setQuery((prev) => prev.slice(0, -1));
          } else if (key === 'Enter') {
            handleRunInputPipeline(query, 'TOUCH_VIRTUAL_KEYBOARD');
          } else if (key === '*#7668#') {
            onClose();
            onOpenAdmin();
          } else if (key.startsWith('F')) {
            // Function keys
            if (key === 'F1') {
              alert('PULSE.OS Ajuda de Contexto: Utilize atalhos como F2 para venda, F3 compra, F4 recibo, ou / para buscar.');
            } else if (key === 'F2') {
              onClose();
              onOpenQuickOp('SALE');
            } else if (key === 'F3') {
              onClose();
              onOpenQuickOp('PURCHASE');
            } else if (key === 'F4') {
              onClose();
              onOpenQuickOp('RECEIPT');
            }
          } else {
            setQuery((prev) => prev + key);
          }
        }}
      />
    </div>
  );
};

