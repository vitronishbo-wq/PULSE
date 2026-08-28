import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShoppingCart,
  FileText,
  Package,
  Wallet,
  Zap,
  Globe,
  Bell,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Truck,
} from 'lucide-react';
import { Orchestrator, QuickOperationInput } from './engines/Orchestrator';
import {
  User,
  Document,
  Product,
  Customer,
  Supplier,
  PurchaseEntry,
  SupplierLedgerMovement,
  StockMovement,
  AccountingEntry,
  SystemEvent,
  AuditRecord,
  AutomationRule,
  FiscalCountry,
  PaymentMethod,
  ParsedAICommand,
  CommercialQuotation,
  QuotationStatus,
  CommercialSeries,
  SeriesStatus,
  BankAccount,
  ReceiptEntry,
  PaymentDisbursement,
  CashMovementEntry,
  CashShiftRecord,
} from './types/pulse';
import {
  initialUsers,
  initialPurchases,
  initialSupplierMovements,
  initialBankAccounts,
  initialReceipts,
  initialDisbursements,
  initialCashMovements,
  initialCashShifts,
} from './data/seedData';

import { Header } from './components/Header';
import { CompactTreeSidebar } from './components/CompactTreeSidebar';
import { MobileNav } from './components/MobileNav';
import { UnifiedMenuDrawer } from './components/UnifiedMenuDrawer';
import { POSView } from './components/POSView';
import { DocumentsView } from './components/DocumentsView';
import { StockView } from './components/StockView';
import { SuppliersView } from './components/SuppliersView';
import { TreasuryView } from './components/TreasuryView';
import { HRPayrollView } from './components/HRPayrollView';
import { EventBusLiveView } from './components/EventBusLiveView';
import { FiscalAutomationView } from './components/FiscalAutomationView';
import { RestaurantKDSView } from './components/RestaurantKDSView';
import { PharmacyBatchView } from './components/PharmacyBatchView';
import { ServicesBillingView } from './components/ServicesBillingView';
import { ReturnsExchangeView } from './components/ReturnsExchangeView';
import { HeldCartsView } from './components/HeldCartsView';
import { ShiftCloseView } from './components/ShiftCloseView';
import { NewOperationModal } from './components/NewOperationModal';
import { DocumentModal } from './components/DocumentModal';
import { AdminModal } from './components/AdminModal';
import { CommandCenterModal } from './components/CommandCenterModal';
import { TenantProvisioningWizard } from './components/TenantProvisioningWizard';
import { TenantSettingsView } from './components/TenantSettingsView';
import { InputNormalizer } from './engines/InputNormalizer';
import { ProfileEngine, BusinessProfileEngine } from './engines/ProfileEngine';

import {
  UtensilsCrossed,
  Pill,
  Briefcase,
} from 'lucide-react';

type NavTab =
  | 'POS'
  | 'KDS_TABLES'
  | 'BATCHES'
  | 'SERVICES_BILLING'
  | 'DOCS'
  | 'STOCK'
  | 'SUPPLIERS'
  | 'TREASURY'
  | 'HR'
  | 'EVENTBUS'
  | 'FISCAL'
  | 'SETTINGS';

export default function App() {
  const orchestrator = Orchestrator.getInstance();

  // Core App State
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]);
  const [activeTab, setActiveTab] = useState<NavTab>('POS');
  const [tenant, setTenant] = useState(orchestrator.tenant);
  const [isOnline, setIsOnline] = useState(orchestrator.offlineSyncEngine.getOnlineStatus());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Entities & Engine States
  const [products, setProducts] = useState<Product[]>(orchestrator.stockEngine.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(orchestrator.moneyEngine.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(orchestrator.moneyEngine.getSuppliers());
  const [documents, setDocuments] = useState<Document[]>(orchestrator.commerceEngine.getDocuments());
  const [movements, setMovements] = useState<StockMovement[]>(orchestrator.stockEngine.getMovements());
  const [journalEntries, setJournalEntries] = useState<AccountingEntry[]>(
    orchestrator.accountingEngine.getEntries()
  );
  const [events, setEvents] = useState<SystemEvent[]>(orchestrator.eventBus.getHistory());
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(orchestrator.auditLedger.getRecords());
  const [rules, setRules] = useState<AutomationRule[]>(orchestrator.automationEngine.getRules());
  const [currentCountry, setCurrentCountry] = useState<FiscalCountry>(
    orchestrator.fiscalEngine.getCountry()
  );

  // Modals & UI States
  const [showNewOpModal, setShowNewOpModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showCommandCenterModal, setShowCommandCenterModal] = useState(false);
  const [showProvisioningWizard, setShowProvisioningWizard] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('pulse_sidebar_collapsed') === 'true';
    }
    return false;
  });
  const [selectedDocForModal, setSelectedDocForModal] = useState<Document | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc?: string; type: 'success' | 'info' | 'alert' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Held Carts (Suspender / Retomar Venda) Global Sync
  const heldCartsKey = `pulse_held_carts_${tenant?.id || 'default'}`;
  const [heldCarts, setHeldCarts] = useState<any[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(heldCartsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [resumedCart, setResumedCart] = useState<any | null>(null);

  // Commercial Quotations (PP / Propostas & Orçamentos) State
  const quotationsKey = `pulse_quotations_${tenant?.id || 'default'}`;
  const [quotations, setQuotations] = useState<CommercialQuotation[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(quotationsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'quote_001',
        docNumber: 'PP 2026/001',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        validityDays: 30,
        customerId: 'cust_01',
        customerName: 'Sonangol E.P.',
        customerTaxId: '5401142299',
        customerEmail: 'compras@sonangol.co.ao',
        customerPhone: '+244 923 111 222',
        customerAddress: 'Rua Rainha Ginga, Luanda',
        lines: [
          {
            id: 'line_q_1',
            productId: 'prod_01',
            sku: 'SERV-CONS-01',
            description: 'Consultoria Técnica de Sistemas e Suporte',
            qty: 2,
            unitPrice: 150000,
            discount: 0,
            taxRate: 14,
            netTotal: 263157.89,
            taxTotal: 36842.11,
            grossTotal: 300000,
          },
          {
            id: 'line_q_2',
            productId: 'prod_02',
            sku: 'LIC-PULSE-01',
            description: 'Licenciamento Anual de Software Empresarial',
            qty: 1,
            unitPrice: 150000,
            discount: 0,
            taxRate: 14,
            netTotal: 131578.95,
            taxTotal: 18421.05,
            grossTotal: 150000,
          },
        ],
        subtotalNet: 394736.84,
        taxAmount: 55263.16,
        withholdingTaxRate: 6.5,
        withholdingTaxAmount: 25657.9,
        discountPercent: 0,
        discountAmount: 0,
        grossTotal: 450000,
        status: 'SENT',
        notes: 'Condições de pagamento: 30 dias após emissão da fatura definitiva.',
        paymentTerms: '30 Dias Líquido',
        createdBy: 'Administrador do Sistema',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'quote_002',
        docNumber: 'PP 2026/002',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        validityDays: 15,
        customerId: 'cust_02',
        customerName: 'Unitel S.A.',
        customerTaxId: '5410098877',
        customerEmail: 'procurement@unitel.co.ao',
        customerPhone: '+244 923 888 999',
        customerAddress: 'Rua Major Kanhangulo, Luanda',
        lines: [
          {
            id: 'line_q_3',
            productId: 'prod_03',
            sku: 'HW-ROUTER-01',
            description: 'Equipamento de Rede e Roteador Empresarial',
            qty: 2,
            unitPrice: 92500,
            discount: 0,
            taxRate: 14,
            netTotal: 162280.7,
            taxTotal: 22719.3,
            grossTotal: 185000,
          },
        ],
        subtotalNet: 162280.7,
        taxAmount: 22719.3,
        discountPercent: 0,
        discountAmount: 0,
        grossTotal: 185000,
        status: 'DRAFT',
        notes: 'Proposta inicial de fornecimento de equipamentos.',
        paymentTerms: 'Pronto Pagamento',
        createdBy: 'Administrador do Sistema',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Commercial Series (Séries & Numeração AGT) State
  const seriesKey = `pulse_series_${tenant?.id || 'default'}`;
  const [seriesList, setSeriesList] = useState<CommercialSeries[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(seriesKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'ser_ft_2026_a',
        code: 'FT 2026/A',
        docType: 'INVOICE',
        docTypeName: 'Fatura Comercial (FT)',
        fiscalYear: 2026,
        terminal: 'Backoffice Central',
        initialNumber: 1,
        currentNumber: 42,
        lastIssuedDocNumber: 'FT 2026/A/42',
        startDate: '2026-01-01',
        status: 'ACTIVE',
        isAgtCommunicated: true,
        agtCommunicationCode: 'AGT-SER-202601-001',
        notes: 'Série principal para faturas emitidas no Backoffice',
        createdBy: 'Administrador do Sistema',
        history: [
          {
            id: 'hist_1',
            timestamp: '2026-01-01 08:00',
            action: 'CREATED',
            details: 'Série criada e comunicada à AGT com início em 1',
            user: 'Administrador do Sistema',
          },
          {
            id: 'hist_2',
            timestamp: '2026-08-28 10:15',
            action: 'ISSUED',
            details: 'Emissão do documento FT 2026/A/42',
            user: 'Administrador do Sistema',
          },
        ],
      },
      {
        id: 'ser_fr_2026_a',
        code: 'FR 2026/A',
        docType: 'RECEIPT',
        docTypeName: 'Fatura-Recibo (FR)',
        fiscalYear: 2026,
        terminal: 'POS 01 - Caixa Principal',
        initialNumber: 1,
        currentNumber: 108,
        lastIssuedDocNumber: 'FR 2026/A/108',
        startDate: '2026-01-01',
        status: 'ACTIVE',
        isAgtCommunicated: true,
        agtCommunicationCode: 'AGT-SER-202601-002',
        notes: 'Série de faturas-recibo para o terminal POS de balcão',
        createdBy: 'Administrador do Sistema',
        history: [
          {
            id: 'hist_3',
            timestamp: '2026-01-01 08:00',
            action: 'CREATED',
            details: 'Série criada para terminal POS 01',
            user: 'Administrador do Sistema',
          },
        ],
      },
      {
        id: 'ser_nc_2026_a',
        code: 'NC 2026/A',
        docType: 'CREDIT_NOTE',
        docTypeName: 'Nota de Crédito (NC)',
        fiscalYear: 2026,
        terminal: 'Geral - Sede',
        initialNumber: 1,
        currentNumber: 3,
        lastIssuedDocNumber: 'NC 2026/A/3',
        startDate: '2026-01-01',
        status: 'ACTIVE',
        isAgtCommunicated: true,
        agtCommunicationCode: 'AGT-SER-202601-003',
        notes: 'Série para retificações e devoluções fiscais',
        createdBy: 'Administrador do Sistema',
        history: [
          {
            id: 'hist_4',
            timestamp: '2026-01-01 08:00',
            action: 'CREATED',
            details: 'Série de Notas de Crédito ativada',
            user: 'Administrador do Sistema',
          },
        ],
      },
      {
        id: 'ser_pp_2026_a',
        code: 'PP 2026/A',
        docType: 'PROFORMA',
        docTypeName: 'Fatura Pró-Forma / Proposta (PP)',
        fiscalYear: 2026,
        terminal: 'Comercial / Vendas',
        initialNumber: 1,
        currentNumber: 15,
        lastIssuedDocNumber: 'PP 2026/A/15',
        startDate: '2026-01-01',
        status: 'ACTIVE',
        isAgtCommunicated: true,
        agtCommunicationCode: 'AGT-SER-202601-004',
        notes: 'Série de propostas comerciais e orçamentos',
        createdBy: 'Administrador do Sistema',
        history: [
          {
            id: 'hist_5',
            timestamp: '2026-01-01 08:00',
            action: 'CREATED',
            details: 'Série de Propostas ativada',
            user: 'Administrador do Sistema',
          },
        ],
      },
      {
        id: 'ser_fr_2025_a',
        code: 'FR 2025/A',
        docType: 'RECEIPT',
        docTypeName: 'Fatura-Recibo (FR)',
        fiscalYear: 2025,
        terminal: 'POS 01 - Caixa Principal',
        initialNumber: 1,
        currentNumber: 1420,
        lastIssuedDocNumber: 'FR 2025/A/1420',
        startDate: '2025-01-01',
        status: 'CLOSED',
        isAgtCommunicated: true,
        agtCommunicationCode: 'AGT-SER-202501-001',
        notes: 'Série do ano fiscal anterior encerrada',
        createdBy: 'Administrador do Sistema',
        history: [
          {
            id: 'hist_6',
            timestamp: '2025-12-31 23:59',
            action: 'CLOSED',
            details: 'Encerramento de exercício económico 2025',
            user: 'Administrador do Sistema',
          },
        ],
      },
    ];
  });

  // Supplier Purchases (Compras / Entradas) State
  const purchasesKey = `pulse_purchases_${tenant?.id || 'default'}`;
  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(purchasesKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialPurchases;
  });

  // Supplier Ledger Movements (Histórico / Conta-Corrente Fornecedor) State
  const supplierMovementsKey = `pulse_supplier_movs_${tenant?.id || 'default'}`;
  const [supplierMovements, setSupplierMovements] = useState<SupplierLedgerMovement[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(supplierMovementsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialSupplierMovements;
  });

  // Financial Module State: Contas Bancárias & TPA
  const bankAccountsKey = `pulse_bank_accounts_${tenant?.id || 'default'}`;
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(bankAccountsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialBankAccounts;
  });

  // Financial Module State: 1. Recebimentos (Receipts)
  const receiptsKey = `pulse_receipts_${tenant?.id || 'default'}`;
  const [receipts, setReceipts] = useState<ReceiptEntry[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(receiptsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialReceipts;
  });

  // Financial Module State: 2. Pagamentos (Disbursements)
  const disbursementsKey = `pulse_disbursements_${tenant?.id || 'default'}`;
  const [disbursements, setDisbursements] = useState<PaymentDisbursement[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(disbursementsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialDisbursements;
  });

  // Financial Module State: 3. Movimentos de Caixa (Cash Movements)
  const cashMovementsKey = `pulse_cash_movements_${tenant?.id || 'default'}`;
  const [cashMovements, setCashMovements] = useState<CashMovementEntry[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(cashMovementsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialCashMovements;
  });

  // Financial Module State: Turnos de Caixa (Cash Shifts)
  const cashShiftsKey = `pulse_cash_shifts_${tenant?.id || 'default'}`;
  const [cashShifts, setCashShifts] = useState<CashShiftRecord[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(cashShiftsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return initialCashShifts;
  });

  const handleHoldCart = (note: string, cartItems: any[], customer: any, total: number) => {
    const newHeldCart = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
      customerId: customer?.id || 'cust_01',
      customerName: customer?.name || 'Consumidor Final',
      items: [...cartItems],
      total,
      notes: note,
      operatorName: currentUser.name,
    };
    const updated = [newHeldCart, ...heldCarts];
    setHeldCarts(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(heldCartsKey, JSON.stringify(updated));
    }
    setToastMessage({
      title: `Venda #${newHeldCart.id} Suspensa`,
      desc: `Carrinho guardado em espera com sucesso.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResumeCart = (hc: any) => {
    const remaining = heldCarts.filter((h) => h.id !== hc.id);
    setHeldCarts(remaining);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(heldCartsKey, JSON.stringify(remaining));
    }
    setResumedCart(hc);
    setActiveSubView(undefined);
    setToastMessage({
      title: `Venda Retomada`,
      desc: `Carrinho carregado no terminal de venda.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteHeldCart = (id: string) => {
    const remaining = heldCarts.filter((h) => h.id !== id);
    setHeldCarts(remaining);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(heldCartsKey, JSON.stringify(remaining));
    }
  };

  // Refresh all state from single-source-of-truth engines
  const syncStateFromEngines = () => {
    setProducts(orchestrator.stockEngine.getProducts());
    setCustomers(orchestrator.moneyEngine.getCustomers());
    setSuppliers(orchestrator.moneyEngine.getSuppliers());
    setDocuments(orchestrator.commerceEngine.getDocuments());
    setMovements(orchestrator.stockEngine.getMovements());
    setJournalEntries(orchestrator.accountingEngine.getEntries());
    setEvents(orchestrator.eventBus.getHistory());
    setAuditRecords(orchestrator.auditLedger.getRecords());
    setRules(orchestrator.automationEngine.getRules());
    setPendingSyncCount(
      orchestrator.offlineSyncEngine.getQueue().filter((q) => q.status === 'PENDING').length
    );
  };

  useEffect(() => {
    // Listen to all events
    const unsub = orchestrator.eventBus.onAnyEvent((event) => {
      syncStateFromEngines();

      // Show toast of consequence
      if (event.eventType === 'SALE_CREATED' || event.eventType === 'PURCHASE_CREATED') {
        setToastMessage({
          title: `Evento ${event.eventType} Processado`,
          desc: event.sideEffects?.[0] || 'Consequências automáticas executadas.',
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    });

    // Offline listener
    orchestrator.offlineSyncEngine.setListener((queue, online) => {
      setIsOnline(online);
      setPendingSyncCount(queue.filter((q) => q.status === 'PENDING').length);
    });

    // Automation notification hook
    orchestrator.automationEngine.setOnTrigger((log) => {
      setToastMessage({
        title: `Automação: ${log.ruleName}`,
        desc: log.details,
        type: 'info',
      });
      setTimeout(() => setToastMessage(null), 5000);
    });

    const normalizer = InputNormalizer.getInstance();

    // Universal Input Layer Global Event Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hardware Scanner capture (single character alphanumeric)
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        normalizer.handleHardwareScannerKeypress(e.key);
      }

      // Check if typing inside a standard form input
      const target = e.target as HTMLElement;
      const isInputFocused = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // Global Shortcut: '/' (when not already focused on input) or 'Ctrl+K' / 'Cmd+K'
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !isInputFocused)) {
        e.preventDefault();
        normalizer.ingestRawInput(e.key === '/' ? '/' : 'Ctrl+K', 'SHORTCUT_TRIGGER');
        setShowCommandCenterModal((prev) => !prev);
        return;
      }

      // Global Shortcut: Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        normalizer.ingestRawInput('Ctrl+S', 'SHORTCUT_TRIGGER');
        setToastMessage({
          title: 'Registo Guardado com Sucesso',
          desc: 'Os dados foram persistidos e validados no kernel PULSE.OS.',
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      // Global Shortcut: Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        normalizer.ingestRawInput('Ctrl+P', 'SHORTCUT_TRIGGER');
        setToastMessage({
          title: 'Impressão Fiscal Disparada',
          desc: 'Comando de impressão enviado para a impressora térmica / spooler.',
          type: 'info',
        });
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }

      // Global Shortcut: F1 (Help)
      if (e.key === 'F1') {
        e.preventDefault();
        normalizer.ingestRawInput('F1', 'SHORTCUT_TRIGGER');
        setToastMessage({
          title: 'PULSE.OS Ajuda & Atalhos Globais',
          desc: 'Use "/" ou Ctrl+K para comandos, F2 para Vendas, F3 para Compras, F4 para Recibos, e *#7668# para Platform Control.',
          type: 'info',
        });
        setTimeout(() => setToastMessage(null), 6000);
        return;
      }

      // Global Shortcuts F2-F4 for Operations (when outside inputs)
      if (!isInputFocused) {
        if (e.key === 'F2' || e.key === 'F3' || e.key === 'F4') {
          e.preventDefault();
          normalizer.ingestRawInput(e.key, 'SHORTCUT_TRIGGER');
          setShowNewOpModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Listen to normalized commands from Voice, Scanner, or Touch Virtual Keyboard
    const unsubNormalizer = normalizer.onCommand((cmd) => {
      if (cmd.intent === 'OPEN_COMMAND_CENTER') {
        setShowCommandCenterModal(true);
      } else if (cmd.intent === 'CLOSE_MODAL') {
        setShowCommandCenterModal(false);
        setShowNewOpModal(false);
        setShowAdminModal(false);
        setSelectedDocForModal(null);
      } else if (cmd.intent === 'INVOKE_PLATFORM_CONTROL') {
        setShowAdminModal(true);
      } else if (cmd.intent === 'LOOKUP_PRODUCT_BARCODE' && cmd.parameters.barcode) {
        const barcode = cmd.parameters.barcode;
        const matched = orchestrator.stockEngine.getProducts().find((p) => p.barcode === barcode || p.sku === barcode);
        if (matched) {
          setToastMessage({
            title: `Scanner Laser: ${matched.name}`,
            desc: `Artigo identificado com sucesso. SKU: ${matched.sku} • Preço: ${matched.price.toLocaleString()} ${orchestrator.tenant.currency}`,
            type: 'success',
          });
          setTimeout(() => setToastMessage(null), 4000);
        } else {
          setToastMessage({
            title: `Código de Barras Desconhecido`,
            desc: `Nenhum produto cadastrado com o código ${barcode}.`,
            type: 'warning',
          });
          setTimeout(() => setToastMessage(null), 3000);
        }
      }
    });

    return () => {
      unsub();
      unsubNormalizer();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handlers
  const handleToggleOnline = () => {
    orchestrator.offlineSyncEngine.setOnlineStatus(!isOnline);
  };

  const handleExecuteOperation = (input: QuickOperationInput) => {
    const result = orchestrator.executeOperation(input);
    syncStateFromEngines();
    if (result.success && result.document) {
      setSelectedDocForModal(result.document);
    }
  };

  const handleExecuteAICommand = (command: ParsedAICommand) => {
    const result = orchestrator.executeAICommand(command, currentUser);
    syncStateFromEngines();
    if (result.success && result.document) {
      setSelectedDocForModal(result.document);
    }
  };

  const handleCompletePOSSale = (params: {
    customerId: string;
    customerName: string;
    customerTaxId: string;
    items: { productId: string; qty: number; unitPrice: number; discount: number }[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    docType: 'INVOICE' | 'RECEIPT';
  }): Document | undefined => {
    const res = orchestrator.executeOperation({
      type: params.docType === 'RECEIPT' ? 'RECEIPT' : 'SALE',
      customerId: params.customerId,
      customerName: params.customerName,
      customerTaxId: params.customerTaxId,
      items: params.items,
      paymentMethod: params.paymentMethod,
      paidAmount: params.paidAmount,
      actor: currentUser,
    });
    syncStateFromEngines();
    return res.document;
  };

  const handleReturnOrExchange = (result: any) => {
    if (result.type === 'RETURN') {
      const lines = result.returnedItems.map((item: any) => ({
        id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        productId: item.product.id,
        description: `[DEVOLUÇÃO] ${item.product.name}`,
        qty: item.qty,
        unitPrice: item.unitPrice,
        taxRate: 0.14,
        netTotal: item.qty * item.unitPrice,
        taxTotal: item.qty * item.unitPrice * 0.14,
        grossTotal: item.qty * item.unitPrice * 1.14,
      }));
      const doc = orchestrator.commerceEngine.createDocument({
        docType: 'CREDIT_NOTE',
        customerId: result.originalDoc.customerId,
        customerName: result.originalDoc.customerName,
        customerTaxId: result.originalDoc.customerTaxId,
        lines,
        paymentMethod: 'CASH',
        paidAmount: result.totalReturned,
        notes: `Nota de Crédito por Devolução da ${result.originalDoc.docNumber} - Motivo: ${result.reason}`,
        derivedFrom: result.originalDoc.id,
        actor: { uid: currentUser.uid, name: currentUser.name },
      });
      syncStateFromEngines();
      if (doc) {
        setSelectedDocForModal(doc);
        setToastMessage({
          title: 'Nota de Crédito Emitida',
          desc: `Documento ${doc.docNumber} emitido e certificado com sucesso.`,
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    } else {
      const lines = result.exchangeItems.map((item: any) => ({
        id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        productId: item.product.id,
        description: `[TROCA] ${item.product.name}`,
        qty: item.qty,
        unitPrice: item.unitPrice,
        taxRate: 0.14,
        netTotal: item.qty * item.unitPrice,
        taxTotal: item.qty * item.unitPrice * 0.14,
        grossTotal: item.qty * item.unitPrice * 1.14,
      }));
      const doc = orchestrator.commerceEngine.createDocument({
        docType: 'INVOICE',
        customerId: result.originalDoc.customerId,
        customerName: result.originalDoc.customerName,
        customerTaxId: result.originalDoc.customerTaxId,
        lines,
        paymentMethod: 'CASH',
        paidAmount: Math.max(0, result.difference),
        notes: `Troca de Artigos por Retificação da ${result.originalDoc.docNumber} - Motivo: ${result.reason}`,
        derivedFrom: result.originalDoc.id,
        actor: { uid: currentUser.uid, name: currentUser.name },
      });
      syncStateFromEngines();
      if (doc) {
        setSelectedDocForModal(doc);
        setToastMessage({
          title: 'Documento de Troca Emitido',
          desc: `Fatura ${doc.docNumber} emitida e reconciliada.`,
          type: 'success',
        });
        setTimeout(() => setToastMessage(null), 4000);
      }
    }
  };

  const handleDeriveToInvoice = (parentDoc: Document) => {
    const derived = orchestrator.commerceEngine.deriveDocument(
      parentDoc.id,
      'INVOICE',
      parentDoc.paymentMethod,
      { uid: currentUser.uid, name: currentUser.name }
    );
    syncStateFromEngines();
    if (derived) {
      setSelectedDocForModal(derived);
      setToastMessage({
        title: 'Documento Derivado com Sucesso',
        desc: `Factura ${derived.docNumber} gerada a partir da Encomenda ${parentDoc.docNumber}`,
        type: 'success',
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Commercial Modules Handlers: Quotations & Series & Cancellations
  const handleCreateQuotation = (
    quoteData: Omit<CommercialQuotation, 'id' | 'docNumber' | 'createdAt'>
  ) => {
    const nextNum = quotations.length + 1;
    const padNum = String(nextNum).padStart(3, '0');
    const docNumber = `PP 2026/${padNum}`;
    const newQuote: CommercialQuotation = {
      ...quoteData,
      id: `quote_${Date.now()}`,
      docNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newQuote, ...quotations];
    setQuotations(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(quotationsKey, JSON.stringify(updated));
    }

    setToastMessage({
      title: 'Proposta Emitida com Sucesso',
      desc: `Proposta ${newQuote.docNumber} registada para ${newQuote.customerName}.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateQuotationStatus = (quoteId: string, newStatus: QuotationStatus) => {
    const updated = quotations.map((q) => (q.id === quoteId ? { ...q, status: newStatus } : q));
    setQuotations(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(quotationsKey, JSON.stringify(updated));
    }
    setToastMessage({
      title: 'Estado da Proposta Atualizado',
      desc: `A proposta foi marcada como ${newStatus}.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConvertQuotationToSale = (
    quote: CommercialQuotation,
    targetDocType: 'INVOICE' | 'RECEIPT'
  ) => {
    // 1. Create document via CommerceEngine
    const createdDoc = orchestrator.commerceEngine.createDocument({
      docType: targetDocType,
      customerId: quote.customerId,
      customerName: quote.customerName,
      customerTaxId: quote.customerTaxId,
      lines: quote.lines,
      paymentMethod: targetDocType === 'RECEIPT' ? 'CASH' : 'CREDIT',
      notes: `Convertido a partir da Proposta Comercial ${quote.docNumber}`,
      actor: currentUser,
      derivedFrom: quote.docNumber,
      status: 'POSTED',
    });

    // 2. Mark proposal as ACCEPTED and bind docNumber
    const updated = quotations.map((q) =>
      q.id === quote.id
        ? {
            ...q,
            status: 'ACCEPTED' as QuotationStatus,
            convertedToDocNumber: createdDoc.docNumber,
          }
        : q
    );
    setQuotations(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(quotationsKey, JSON.stringify(updated));
    }

    syncStateFromEngines();
    setSelectedDocForModal(createdDoc);

    setToastMessage({
      title: 'Proposta Convertida em Venda',
      desc: `Documento fiscal ${createdDoc.docNumber} emitido com assinatura AGT.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCancelDocument = (docId: string, reason: string) => {
    const cancelled = orchestrator.commerceEngine.updateStatus(docId, 'CANCELLED', {
      uid: currentUser.uid,
      name: currentUser.name,
    });
    syncStateFromEngines();
    if (cancelled) {
      setToastMessage({
        title: 'Documento Anulado (AGT)',
        desc: `Documento ${cancelled.docNumber} anulado com justificação fiscal.`,
        type: 'alert',
      });
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCreateSeries = (
    seriesData: Omit<CommercialSeries, 'id' | 'currentNumber' | 'lastIssuedDocNumber' | 'history'>
  ) => {
    const newSeries: CommercialSeries = {
      ...seriesData,
      id: `ser_${Date.now()}`,
      currentNumber: 0,
      lastIssuedDocNumber: 'Nenhum',
      history: [
        {
          id: `hist_${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          action: 'CREATED',
          details: `Série criada e comunicada à AGT para terminal ${seriesData.terminal}`,
          user: currentUser.name,
        },
      ],
    };

    const updated = [newSeries, ...seriesList];
    setSeriesList(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(seriesKey, JSON.stringify(updated));
    }

    setToastMessage({
      title: 'Nova Série Fiscal Ativada',
      desc: `Série ${newSeries.code} configurada com sucesso.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCloseSeries = (seriesId: string, reason: string) => {
    const updated = seriesList.map((s) => {
      if (s.id === seriesId) {
        return {
          ...s,
          status: 'CLOSED' as SeriesStatus,
          history: [
            ...(s.history || []),
            {
              id: `hist_${Date.now()}`,
              timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
              action: 'CLOSED' as const,
              details: `Série encerrada: ${reason}`,
              user: currentUser.name,
            },
          ],
        };
      }
      return s;
    });

    setSeriesList(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(seriesKey, JSON.stringify(updated));
    }

    setToastMessage({
      title: 'Série Fiscal Encerrada',
      desc: `A série foi bloqueada e não poderá emitir novos documentos.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAdjustStock = (params: {
    productId: string;
    qtyChange: number;
    reason: string;
    actor: string;
  }) => {
    orchestrator.stockEngine.adjustStock(
      params.productId,
      params.qtyChange,
      params.reason,
      params.actor
    );
    syncStateFromEngines();
    setToastMessage({
      title: 'Inventário Atualizado',
      desc: `Ajuste de stock registado e gravado no Audit Ledger.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTriggerPurchaseSuggestion = (product: Product) => {
    orchestrator.executeOperation({
      type: 'PURCHASE',
      supplierId: 'sup_01',
      supplierName: 'AngoAlimentos Distribuição, S.A.',
      items: [{ productId: product.id, qty: 50, unitPrice: product.cost }],
      paymentMethod: 'CREDIT',
      notes: `Reposição automática de emergência para ${product.name}`,
      actor: currentUser,
    });
    syncStateFromEngines();
    setToastMessage({
      title: 'Ordem de Compra Criada',
      desc: `Encomenda de 50 un para ${product.name} emitida ao Fornecedor.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReceiveCustomerPayment = (params: {
    customerId: string;
    amount: number;
    method: PaymentMethod;
    notes?: string;
  }) => {
    orchestrator.moneyEngine.receiveCustomerPayment(params, {
      uid: currentUser.uid,
      name: currentUser.name,
    });
    syncStateFromEngines();
    setToastMessage({
      title: 'Cobrança Liquidada',
      desc: `Recibo no valor de ${params.amount.toLocaleString()} Kz registado em Caixa/Banco.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveSupplier = (supplierData: Supplier) => {
    orchestrator.moneyEngine.upsertSupplier(supplierData);
    syncStateFromEngines();
    setToastMessage({
      title: 'Fornecedor Atualizado',
      desc: `Ficha fiscal e comercial de ${supplierData.name} guardada.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleSupplierStatus = (supplierId: string) => {
    const target = suppliers.find((s) => s.id === supplierId);
    if (!target) return;
    const newStatus = target.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const updated: Supplier = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    orchestrator.moneyEngine.upsertSupplier(updated);
    syncStateFromEngines();
    setToastMessage({
      title: 'Estado do Fornecedor Alterado',
      desc: `${target.name} marcado como ${newStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCreatePurchase = (purchase: PurchaseEntry) => {
    const updated = [purchase, ...purchases];
    setPurchases(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(purchasesKey, JSON.stringify(updated));
    }

    if (purchase.status === 'CONFIRMED') {
      // Trigger automatic stock addition & supplier ledger credit
      orchestrator.eventBus.publish({
        eventType: 'PURCHASE_CREATED',
        tenantId: tenant.id,
        userId: currentUser.uid,
        userName: currentUser.name,
        source: 'ORCHESTRATOR',
        entityType: 'documents',
        entityId: purchase.id,
        payload: purchase,
        sideEffects: [
          `Entrada de stock atualizada para ${purchase.lines.length} artigo(s)`,
          `Conta-corrente do fornecedor ${purchase.supplierName} creditada`,
        ],
      });

      const newMov: SupplierLedgerMovement = {
        id: `mov_${Date.now()}`,
        supplierId: purchase.supplierId,
        supplierName: purchase.supplierName,
        date: purchase.issueDate || new Date().toISOString().split('T')[0],
        dueDate: purchase.dueDate,
        type: 'PURCHASE_INVOICE',
        docNumber: purchase.originDocNumber || purchase.internalRef,
        description: `Fatura de Compra (${purchase.internalRef})`,
        debit: 0,
        credit: purchase.grossTotal,
        runningBalance: purchase.grossTotal,
        status: purchase.isPaid ? 'SETTLED' : 'PENDING',
        matchedPurchaseId: purchase.id,
        registeredBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      const updatedMovs = [newMov, ...supplierMovements];
      setSupplierMovements(updatedMovs);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(supplierMovementsKey, JSON.stringify(updatedMovs));
      }
    }

    syncStateFromEngines();
    setToastMessage({
      title: purchase.status === 'CONFIRMED' ? 'Entrada de Mercadoria Registada' : 'Rascunho de Compra Gravado',
      desc: `Documento ${purchase.internalRef} (${purchase.grossTotal.toLocaleString()} ${tenant.currency}) processado com sucesso.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmPurchase = (purchaseId: string) => {
    const target = purchases.find((p) => p.id === purchaseId);
    if (!target) return;

    const confirmedPurchase: PurchaseEntry = {
      ...target,
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString(),
    };

    const updated = purchases.map((p) => (p.id === purchaseId ? confirmedPurchase : p));
    setPurchases(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(purchasesKey, JSON.stringify(updated));
    }

    orchestrator.eventBus.publish({
      eventType: 'PURCHASE_CREATED',
      tenantId: tenant.id,
      userId: currentUser.uid,
      userName: currentUser.name,
      source: 'ORCHESTRATOR',
      entityType: 'documents',
      entityId: confirmedPurchase.id,
      payload: confirmedPurchase,
      sideEffects: [
        `Stock atualizado automaticamente`,
        `Conta-corrente do fornecedor atualizada`,
      ],
    });

    const newMov: SupplierLedgerMovement = {
      id: `mov_${Date.now()}`,
      supplierId: target.supplierId,
      supplierName: target.supplierName,
      date: target.issueDate || new Date().toISOString().split('T')[0],
      dueDate: target.dueDate,
      type: 'PURCHASE_INVOICE',
      docNumber: target.originDocNumber || target.internalRef,
      description: `Fatura de Compra (${target.internalRef})`,
      debit: 0,
      credit: target.grossTotal,
      runningBalance: target.grossTotal,
      status: target.isPaid ? 'SETTLED' : 'PENDING',
      matchedPurchaseId: target.id,
      registeredBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };
    const updatedMovs = [newMov, ...supplierMovements];
    setSupplierMovements(updatedMovs);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(supplierMovementsKey, JSON.stringify(updatedMovs));
    }

    syncStateFromEngines();
    setToastMessage({
      title: 'Compra Confirmada & Stock Atualizado',
      desc: `Entrada da fatura ${target.originDocNumber || target.internalRef} liquidada e integrada.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelPurchase = (purchaseId: string) => {
    const updated = purchases.map((p) =>
      p.id === purchaseId ? { ...p, status: 'CANCELLED' as const } : p
    );
    setPurchases(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(purchasesKey, JSON.stringify(updated));
    }
    setToastMessage({
      title: 'Compra Cancelada',
      desc: 'A entrada de mercadorias foi anulada.',
      type: 'alert',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePaySupplier = (params: {
    supplierId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) => {
    orchestrator.moneyEngine.paySupplier({
      supplierId: params.supplierId,
      amount: params.amount,
      method: params.method,
      notes: params.notes,
    }, {
      uid: currentUser.uid,
      name: currentUser.name,
    });

    const sup = suppliers.find((s) => s.id === params.supplierId);
    const newMov: SupplierLedgerMovement = {
      id: `mov_${Date.now()}`,
      supplierId: params.supplierId,
      supplierName: sup?.name || 'Fornecedor',
      date: new Date().toISOString().split('T')[0],
      type: 'PAYMENT',
      docNumber: params.reference || `TRF-${Date.now().toString().slice(-6)}`,
      description: params.notes || `Pagamento via ${params.method}`,
      debit: params.amount,
      credit: 0,
      runningBalance: Math.max(0, (sup?.currentBalance || 0) - params.amount),
      paymentMethod: params.method,
      bankAccountRef: params.reference,
      receiptNumber: params.reference,
      status: 'SETTLED',
      registeredBy: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    const updatedMovs = [newMov, ...supplierMovements];
    setSupplierMovements(updatedMovs);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(supplierMovementsKey, JSON.stringify(updatedMovs));
    }

    syncStateFromEngines();
    setToastMessage({
      title: 'Pagamento a Fornecedor Liquidado',
      desc: `Saída de ${params.amount.toLocaleString()} ${tenant.currency} registada no Diário e Conta-Corrente.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ==========================================
  // FINANCIAL MODULE HANDLERS
  // ==========================================

  // 1. Recebimentos (Receipts) Handlers
  const handleRegisterReceipt = (
    receiptData: Omit<ReceiptEntry, 'id' | 'receiptNumber' | 'createdAt'>
  ) => {
    const nextNum = receipts.length + 1;
    const receiptNumber = `RC 2026/${String(nextNum).padStart(3, '0')}`;
    const newReceipt: ReceiptEntry = {
      ...receiptData,
      id: `rec_${Date.now()}`,
      receiptNumber,
      createdAt: new Date().toISOString(),
    };

    const updatedReceipts = [newReceipt, ...receipts];
    setReceipts(updatedReceipts);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(receiptsKey, JSON.stringify(updatedReceipts));
    }

    if (newReceipt.status === 'RECEIVED') {
      if (newReceipt.customerId) {
        const cust = customers.find((c) => c.id === newReceipt.customerId);
        if (cust) {
          cust.currentBalance = Math.max(0, cust.currentBalance - newReceipt.amountReceived);
          orchestrator.moneyEngine.upsertCustomer(cust);
        }
      }

      if (newReceipt.paymentMethod === 'CASH') {
        orchestrator.moneyEngine.adjustCashBalance(newReceipt.amountReceived);
      } else {
        orchestrator.moneyEngine.adjustBankBalance(newReceipt.amountReceived);
        if (newReceipt.bankAccountId) {
          const updatedBanks = bankAccounts.map((b) =>
            b.id === newReceipt.bankAccountId
              ? { ...b, balance: b.balance + newReceipt.amountReceived }
              : b
          );
          setBankAccounts(updatedBanks);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(bankAccountsKey, JSON.stringify(updatedBanks));
          }
        }
      }

      orchestrator.accountingEngine.recordEntry({
        id: `ENT_${Date.now()}`,
        date: newReceipt.date,
        description: `Recebimento ${newReceipt.receiptNumber} - ${newReceipt.customerName || 'Cliente'}`,
        debitAccount: newReceipt.paymentMethod === 'CASH' ? '43.1' : '45.1',
        debitAccountName: newReceipt.paymentMethod === 'CASH' ? 'Caixa Geral' : 'Depósitos à Ordem',
        creditAccount: '21.1',
        creditAccountName: 'Clientes Conta Corrente',
        amount: newReceipt.amountReceived,
        docNumber: newReceipt.receiptNumber,
      });
    }

    syncStateFromEngines();
    setToastMessage({
      title: `Recibo ${newReceipt.receiptNumber} Emitido`,
      desc: `Recebimento de ${newReceipt.amountReceived.toLocaleString()} ${tenant.currency} registado com sucesso.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelReceipt = (receiptId: string, reason: string) => {
    const target = receipts.find((r) => r.id === receiptId);
    if (!target) return;

    const updatedReceipts = receipts.map((r) =>
      r.id === receiptId
        ? {
            ...r,
            status: 'CANCELLED' as const,
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
            cancelledBy: currentUser.name,
          }
        : r
    );
    setReceipts(updatedReceipts);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(receiptsKey, JSON.stringify(updatedReceipts));
    }

    if (target.status === 'RECEIVED') {
      if (target.customerId) {
        const cust = customers.find((c) => c.id === target.customerId);
        if (cust) {
          cust.currentBalance += target.amountReceived;
          orchestrator.moneyEngine.upsertCustomer(cust);
        }
      }
      if (target.paymentMethod === 'CASH') {
        orchestrator.moneyEngine.adjustCashBalance(-target.amountReceived);
      } else {
        orchestrator.moneyEngine.adjustBankBalance(-target.amountReceived);
        if (target.bankAccountId) {
          const updatedBanks = bankAccounts.map((b) =>
            b.id === target.bankAccountId
              ? { ...b, balance: Math.max(0, b.balance - target.amountReceived) }
              : b
          );
          setBankAccounts(updatedBanks);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(bankAccountsKey, JSON.stringify(updatedBanks));
          }
        }
      }
    }

    syncStateFromEngines();
    setToastMessage({
      title: 'Recibo Anulado',
      desc: `O documento ${target.receiptNumber} foi anulado com justificação fiscal.`,
      type: 'alert',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 2. Pagamentos (Disbursements) Handlers
  const handleRegisterDisbursement = (
    disbursementData: Omit<PaymentDisbursement, 'id' | 'disbursementNumber' | 'createdAt'>
  ) => {
    const nextNum = disbursements.length + 1;
    const disbursementNumber = `OP 2026/${String(nextNum).padStart(3, '0')}`;
    const newDisbursement: PaymentDisbursement = {
      ...disbursementData,
      id: `disb_${Date.now()}`,
      disbursementNumber,
      createdAt: new Date().toISOString(),
    };

    const updatedDisbursements = [newDisbursement, ...disbursements];
    setDisbursements(updatedDisbursements);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(disbursementsKey, JSON.stringify(updatedDisbursements));
    }

    if (newDisbursement.status === 'PAID') {
      if (newDisbursement.supplierId) {
        const sup = suppliers.find((s) => s.id === newDisbursement.supplierId);
        if (sup) {
          sup.currentBalance = Math.max(0, sup.currentBalance - newDisbursement.amountPaid);
          orchestrator.moneyEngine.upsertSupplier(sup);
        }
      }

      if (newDisbursement.paymentMethod === 'CASH') {
        orchestrator.moneyEngine.adjustCashBalance(-newDisbursement.amountPaid);
      } else {
        orchestrator.moneyEngine.adjustBankBalance(-newDisbursement.amountPaid);
        if (newDisbursement.bankAccountId) {
          const updatedBanks = bankAccounts.map((b) =>
            b.id === newDisbursement.bankAccountId
              ? { ...b, balance: Math.max(0, b.balance - newDisbursement.amountPaid) }
              : b
          );
          setBankAccounts(updatedBanks);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(bankAccountsKey, JSON.stringify(updatedBanks));
          }
        }
      }

      orchestrator.accountingEngine.recordEntry({
        id: `ENT_${Date.now()}`,
        date: newDisbursement.date,
        description: `Pagamento ${newDisbursement.disbursementNumber} - ${newDisbursement.beneficiaryName}`,
        debitAccount: '22.1',
        debitAccountName: 'Fornecedores Conta Corrente',
        creditAccount: newDisbursement.paymentMethod === 'CASH' ? '43.1' : '45.1',
        creditAccountName: newDisbursement.paymentMethod === 'CASH' ? 'Caixa Geral' : 'Depósitos à Ordem',
        amount: newDisbursement.amountPaid,
        docNumber: newDisbursement.disbursementNumber,
      });
    }

    syncStateFromEngines();
    setToastMessage({
      title: `Ordem de Pagamento ${newDisbursement.disbursementNumber} Registada`,
      desc: newDisbursement.status === 'PAID'
        ? `Saída de ${newDisbursement.amountPaid.toLocaleString()} ${tenant.currency} liquidada.`
        : `Pagamento registado como pendente de aprovação.`,
      type: newDisbursement.status === 'PAID' ? 'success' : 'info',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApproveDisbursement = (disbursementId: string, notes?: string) => {
    const target = disbursements.find((d) => d.id === disbursementId);
    if (!target) return;

    const updated = disbursements.map((d) =>
      d.id === disbursementId
        ? {
            ...d,
            status: 'PAID' as const,
            approvedBy: currentUser.name,
            approvedAt: new Date().toISOString(),
            notes: notes ? `${d.notes || ''} | Aprovado: ${notes}` : d.notes,
          }
        : d
    );
    setDisbursements(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(disbursementsKey, JSON.stringify(updated));
    }

    if (target.supplierId) {
      const sup = suppliers.find((s) => s.id === target.supplierId);
      if (sup) {
        sup.currentBalance = Math.max(0, sup.currentBalance - target.amountPaid);
        orchestrator.moneyEngine.upsertSupplier(sup);
      }
    }

    if (target.paymentMethod === 'CASH') {
      orchestrator.moneyEngine.adjustCashBalance(-target.amountPaid);
    } else {
      orchestrator.moneyEngine.adjustBankBalance(-target.amountPaid);
      if (target.bankAccountId) {
        const updatedBanks = bankAccounts.map((b) =>
          b.id === target.bankAccountId
            ? { ...b, balance: Math.max(0, b.balance - target.amountPaid) }
            : b
        );
        setBankAccounts(updatedBanks);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(bankAccountsKey, JSON.stringify(updatedBanks));
        }
      }
    }

    syncStateFromEngines();
    setToastMessage({
      title: `Pagamento ${target.disbursementNumber} Aprovado & Liquidado`,
      desc: `Valor de ${target.amountPaid.toLocaleString()} ${tenant.currency} debitado da conta.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRejectDisbursement = (disbursementId: string, reason: string) => {
    const target = disbursements.find((d) => d.id === disbursementId);
    if (!target) return;

    const updated = disbursements.map((d) =>
      d.id === disbursementId
        ? {
            ...d,
            status: 'REJECTED' as const,
            rejectionReason: reason,
          }
        : d
    );
    setDisbursements(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(disbursementsKey, JSON.stringify(updated));
    }

    syncStateFromEngines();
    setToastMessage({
      title: `Pagamento ${target.disbursementNumber} Rejeitado`,
      desc: `Motivo: ${reason}`,
      type: 'alert',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelDisbursement = (disbursementId: string, reason: string) => {
    const target = disbursements.find((d) => d.id === disbursementId);
    if (!target) return;

    const updated = disbursements.map((d) =>
      d.id === disbursementId
        ? {
            ...d,
            status: 'CANCELLED' as const,
            cancellationReason: reason,
            cancelledAt: new Date().toISOString(),
            cancelledBy: currentUser.name,
          }
        : d
    );
    setDisbursements(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(disbursementsKey, JSON.stringify(updated));
    }

    if (target.status === 'PAID') {
      if (target.supplierId) {
        const sup = suppliers.find((s) => s.id === target.supplierId);
        if (sup) {
          sup.currentBalance += target.amountPaid;
          orchestrator.moneyEngine.upsertSupplier(sup);
        }
      }
      if (target.paymentMethod === 'CASH') {
        orchestrator.moneyEngine.adjustCashBalance(target.amountPaid);
      } else {
        orchestrator.moneyEngine.adjustBankBalance(target.amountPaid);
        if (target.bankAccountId) {
          const updatedBanks = bankAccounts.map((b) =>
            b.id === target.bankAccountId
              ? { ...b, balance: b.balance + target.amountPaid }
              : b
          );
          setBankAccounts(updatedBanks);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(bankAccountsKey, JSON.stringify(updatedBanks));
          }
        }
      }
    }

    syncStateFromEngines();
    setToastMessage({
      title: `Ordem de Pagamento ${target.disbursementNumber} Anulada`,
      desc: `Estorno efetuado nas contas e saldo reposto.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 3. Movimentos de Caixa (Cash Movements) Handlers
  const handleCreateCashMovement = (
    movementData: Omit<CashMovementEntry, 'id' | 'timestamp' | 'date' | 'time' | 'balanceAfter'>
  ) => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].slice(0, 5);
    const isCredit = movementData.type === 'INFLOW' || movementData.type === 'OPENING_FLOAT';
    const currentCash = orchestrator.moneyEngine.getCashBalance();
    const balanceAfter = isCredit ? currentCash + movementData.amount : currentCash - movementData.amount;

    const newMov: CashMovementEntry = {
      ...movementData,
      id: `mov_c_${Date.now()}`,
      timestamp: now.toISOString(),
      date,
      time,
      balanceAfter,
    };

    const updatedMovs = [newMov, ...cashMovements];
    setCashMovements(updatedMovs);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cashMovementsKey, JSON.stringify(updatedMovs));
    }

    // Update cash in money engine
    if (isCredit) {
      orchestrator.moneyEngine.adjustCashBalance(movementData.amount);
    } else {
      orchestrator.moneyEngine.adjustCashBalance(-movementData.amount);
    }

    syncStateFromEngines();
    setToastMessage({
      title: `Movimento de Caixa Registado`,
      desc: `${movementData.type === 'INFLOW' ? 'Entrada' : movementData.type === 'OUTFLOW' ? 'Saída' : 'Transferência'} de ${movementData.amount.toLocaleString()} ${tenant.currency}.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCloseShift = (params: {
    shiftId: string;
    physicalCountedCash: number;
    difference: number;
    justification?: string;
    authorizedBy?: string;
    notes?: string;
  }) => {
    const now = new Date();
    const updatedShifts = cashShifts.map((s) => {
      if (s.id === params.shiftId) {
        return {
          ...s,
          status: 'CLOSED' as const,
          closedAt: now.toISOString(),
          physicalCountedCash: params.physicalCountedCash,
          difference: params.difference,
          differenceReason: params.justification,
          authorizedBy: params.authorizedBy || currentUser.name,
          notes: params.notes,
        };
      }
      return s;
    });

    setCashShifts(updatedShifts);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cashShiftsKey, JSON.stringify(updatedShifts));
    }

    // If there is an authorized adjustment difference, register a cash movement
    if (params.difference !== 0) {
      const isPositive = params.difference > 0;
      const adjustMov: CashMovementEntry = {
        id: `mov_adj_${Date.now()}`,
        timestamp: now.toISOString(),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0].slice(0, 5),
        type: isPositive ? 'INFLOW' : 'OUTFLOW',
        category: 'AJUSTE',
        description: `Ajuste autorizado fecho de turno: ${params.justification || 'Conferência física'}`,
        amount: Math.abs(params.difference),
        paymentMethod: 'CASH',
        operatorName: currentUser.name,
        authorizedBy: params.authorizedBy || currentUser.name,
        shiftId: params.shiftId,
        balanceAfter: orchestrator.moneyEngine.getCashBalance() + params.difference,
      };

      const updatedMovs = [adjustMov, ...cashMovements];
      setCashMovements(updatedMovs);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(cashMovementsKey, JSON.stringify(updatedMovs));
      }
      orchestrator.moneyEngine.adjustCashBalance(params.difference);
    }

    syncStateFromEngines();
    setToastMessage({
      title: 'Turno de Caixa Encerrado',
      desc: `Fecho concluído com ${params.difference === 0 ? 'caixa 100% exato' : `diferença de ${params.difference.toLocaleString()} ${tenant.currency}`}.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenShift = (params: {
    openingFloat: number;
    operatorName: string;
    notes?: string;
  }) => {
    const now = new Date();
    const newShift: CashShiftRecord = {
      id: `shift_${Date.now()}`,
      operatorName: params.operatorName || currentUser.name,
      terminal: 'POS 01 - Caixa Principal',
      openedAt: now.toISOString(),
      openingFloat: params.openingFloat,
      expectedCash: params.openingFloat,
      physicalCountedCash: 0,
      difference: 0,
      totalSales: 0,
      totalCashIn: params.openingFloat,
      totalCashOut: 0,
      status: 'OPEN',
      notes: params.notes,
    };

    const updatedShifts = [newShift, ...cashShifts];
    setCashShifts(updatedShifts);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cashShiftsKey, JSON.stringify(updatedShifts));
    }

    // Register opening float movement
    const openMov: CashMovementEntry = {
      id: `mov_open_${Date.now()}`,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].slice(0, 5),
      type: 'OPENING_FLOAT',
      category: 'FUNDO_CAIXA',
      description: `Fundo de Caixa / Abertura de Turno - ${params.operatorName || currentUser.name}`,
      amount: params.openingFloat,
      paymentMethod: 'CASH',
      operatorName: params.operatorName || currentUser.name,
      shiftId: newShift.id,
      balanceAfter: orchestrator.moneyEngine.getCashBalance() + params.openingFloat,
    };

    const updatedMovs = [openMov, ...cashMovements];
    setCashMovements(updatedMovs);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cashMovementsKey, JSON.stringify(updatedMovs));
    }

    orchestrator.moneyEngine.adjustCashBalance(params.openingFloat);
    syncStateFromEngines();

    setToastMessage({
      title: 'Turno Aberto com Sucesso',
      desc: `Fundo de caixa inicial de ${params.openingFloat.toLocaleString()} ${tenant.currency} registado.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTransferFunds = (params: {
    sourceType: 'CASH' | 'BANK';
    targetType: 'CASH' | 'BANK';
    sourceBankId?: string;
    targetBankId?: string;
    amount: number;
    justification: string;
  }) => {
    orchestrator.moneyEngine.transferFunds(params.sourceType, params.targetType, params.amount);

    if (params.sourceBankId || params.targetBankId) {
      const updatedBanks = bankAccounts.map((b) => {
        if (b.id === params.sourceBankId) {
          return { ...b, balance: Math.max(0, b.balance - params.amount) };
        }
        if (b.id === params.targetBankId) {
          return { ...b, balance: b.balance + params.amount };
        }
        return b;
      });
      setBankAccounts(updatedBanks);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(bankAccountsKey, JSON.stringify(updatedBanks));
      }
    }

    const now = new Date();
    const transferMov: CashMovementEntry = {
      id: `mov_trf_${Date.now()}`,
      timestamp: now.toISOString(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0].slice(0, 5),
      type: 'TRANSFER',
      category: 'TRANSFERENCIA',
      description: `Transferência (${params.sourceType === 'CASH' ? 'Caixa' : 'Banco'} ➔ ${params.targetType === 'CASH' ? 'Caixa' : 'Banco'}): ${params.justification}`,
      amount: params.amount,
      paymentMethod: params.sourceType === 'CASH' ? 'CASH' : 'BANK_TRANSFER',
      operatorName: currentUser.name,
      balanceAfter: orchestrator.moneyEngine.getCashBalance(),
    };

    const updatedMovs = [transferMov, ...cashMovements];
    setCashMovements(updatedMovs);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(cashMovementsKey, JSON.stringify(updatedMovs));
    }

    syncStateFromEngines();
    setToastMessage({
      title: 'Transferência Financeira Executada',
      desc: `Transferência de ${params.amount.toLocaleString()} ${tenant.currency} concluída.`,
      type: 'success',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCountryChange = (country: FiscalCountry) => {
    orchestrator.fiscalEngine.setCountry(country);
    setCurrentCountry(country);
    syncStateFromEngines();
    setToastMessage({
      title: 'Adaptador Fiscal Alterado',
      desc: `Taxas e regras SAFT atualizadas para a jurisdição ${country}.`,
      type: 'info',
    });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleRule = (id: string, enabled: boolean) => {
    orchestrator.automationEngine.toggleRule(id, enabled);
    syncStateFromEngines();
  };

  const cashBalance = orchestrator.moneyEngine.getCashBalance();
  const bankBalance = orchestrator.moneyEngine.getBankBalance();
  const totalReceivables = customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalPayables = suppliers.reduce((acc, s) => acc + s.currentBalance, 0);

  const getProfileNavTabs = (): { id: NavTab; label: string; icon: any }[] => {
    const segment = tenant.segment || tenant.businessSegment || 'RESTAURANT_BAR';
    const profileEngine = ProfileEngine.getInstance();
    const features = profileEngine.getInterfaceFeatures(segment, tenant.activeModules);

    const iconMap: Record<string, any> = {
      ShoppingCart,
      UtensilsCrossed,
      Pill,
      Briefcase,
      FileText,
      Package,
      Truck,
      Wallet,
      Users,
      Zap,
      Globe,
    };

    return features.navTabs.map((t) => ({
      id: t.id as NavTab,
      label: t.label,
      icon: iconMap[t.iconName] || FileText,
    }));
  };

  const navTabs = getProfileNavTabs();

  // Ensure active tab is valid for current profile
  useEffect(() => {
    const validTabIds = navTabs.map((t) => t.id);
    if (!validTabIds.includes(activeTab)) {
      setActiveTab(validTabIds[0]);
    }
  }, [tenant.businessSegment]);

  return (
    <div id="pulse-app-root" className="min-h-screen bg-[#09090b] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-sans">
      {/* 1. Ultra-Minimalist Top Header: EMPRESA 🔍──────── 🎙 Kz · ☰ */}
      <Header
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        tenant={tenant}
        isOnline={isOnline}
        onToggleOnline={handleToggleOnline}
        pendingSyncCount={pendingSyncCount}
        onOpenNewOperation={() => setShowNewOpModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenCommandCenter={() => setShowCommandCenterModal(true)}
        onOpenMenuDrawer={() => setIsMenuDrawerOpen(true)}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        documents={documents}
        cashBalance={cashBalance}
        bankBalance={bankBalance}
        receivables={totalReceivables}
        payables={totalPayables}
        products={products}
        currency={tenant.currency}
        onFilterLowStock={() => setActiveTab('STOCK')}
        onFilterReceivables={() => setActiveTab('TREASURY')}
      />

      {/* 2. Main Workspace Layout with Ultra-Compact Hierarchical Sidebar */}
      <div className="flex-1 flex flex-row min-w-0 bg-[#09090b]">
        {/* VS Code Style Hierarchical Tree Sidebar (Collapsible & Persistent) */}
        <CompactTreeSidebar
          tenant={tenant}
          currentUser={currentUser}
          activeTab={activeTab}
          activeSubView={activeSubView}
          onSelectTab={(tabId, subView) => {
            setActiveTab(tabId);
            setActiveSubView(subView);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => {
            setIsSidebarCollapsed((prev) => {
              const next = !prev;
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem('pulse_sidebar_collapsed', String(next));
              }
              return next;
            });
          }}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dynamic View Area without clutter */}
        <main className="flex-1 min-w-0 p-2 sm:p-4 pb-20 md:pb-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto min-h-[500px]">
            {activeTab === 'POS' && activeSubView === 'RETURNS' ? (
              <ReturnsExchangeView
                documents={documents}
                products={products}
                customers={customers}
                currentUser={currentUser}
                tenant={tenant}
                currency={tenant.currency}
                onCompleteReturnOrExchange={handleReturnOrExchange}
                onNavigateToTerminal={() => setActiveSubView(undefined)}
              />
            ) : activeTab === 'POS' && activeSubView === 'HELD_CARTS' ? (
              <HeldCartsView
                heldCarts={heldCarts}
                currency={tenant.currency}
                currentUser={currentUser}
                onHoldCurrentCart={(note) => handleHoldCart(note, [], null, 0)}
                onResumeHeldCart={handleResumeCart}
                onDeleteHeldCart={handleDeleteHeldCart}
                onNavigateToPOS={() => setActiveSubView(undefined)}
              />
            ) : activeTab === 'POS' && activeSubView === 'SHIFT_CLOSE' ? (
              <ShiftCloseView
                documents={documents}
                tenant={tenant}
                currentUser={currentUser}
                currency={tenant.currency}
                onConfirmCloseShift={(summary) => {
                  setToastMessage({
                    title: 'Turno Encerrado',
                    desc: `Relatório oficial de caixa gerado com sucesso.`,
                    type: 'success',
                  });
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                onNavigateToPOS={() => setActiveSubView(undefined)}
              />
            ) : activeTab === 'POS' ? (
              <POSView
                products={products}
                customers={customers}
                currentUser={currentUser}
                tenant={tenant}
                currency={tenant.currency}
                onCompleteSale={handleCompletePOSSale}
                onViewDocument={setSelectedDocForModal}
                subView={activeSubView}
                documents={documents}
                onCompleteReturnOrExchange={handleReturnOrExchange}
                resumedCart={resumedCart}
                onClearResumedCart={() => setResumedCart(null)}
                heldCarts={heldCarts}
                onHoldCurrentCart={(note, items, cust, total) => handleHoldCart(note, items, cust, total)}
                onResumeHeldCart={handleResumeCart}
                onDeleteHeldCart={handleDeleteHeldCart}
              />
            ) : null}

            {activeTab === 'KDS_TABLES' && (
              <RestaurantKDSView
                tenant={tenant}
                products={products}
                currentUser={currentUser}
                currency={tenant.currency}
              />
            )}

            {activeTab === 'BATCHES' && (
              <PharmacyBatchView
                tenant={tenant}
                products={products}
                currentUser={currentUser}
                currency={tenant.currency}
              />
            )}

            {activeTab === 'SERVICES_BILLING' && (
              <ServicesBillingView
                tenant={tenant}
                documents={documents}
                customers={customers}
                currentUser={currentUser}
                currency={tenant.currency}
                onViewDocument={setSelectedDocForModal}
              />
            )}

            {activeTab === 'DOCS' && (
              <DocumentsView
                documents={documents}
                customers={customers}
                products={products}
                tenant={tenant}
                currentUser={currentUser}
                currency={tenant.currency}
                onViewDocument={setSelectedDocForModal}
                onDeriveToInvoice={handleDeriveToInvoice}
                onExportSAFT={() => setActiveTab('FISCAL')}
                onCancelDocument={handleCancelDocument}
                quotations={quotations}
                onCreateQuotation={handleCreateQuotation}
                onUpdateQuotationStatus={handleUpdateQuotationStatus}
                onConvertQuotation={handleConvertQuotationToSale}
                seriesList={seriesList}
                onCreateSeries={handleCreateSeries}
                onCloseSeries={handleCloseSeries}
                subView={activeSubView}
              />
            )}

            {activeTab === 'STOCK' && (
              <StockView
                products={products}
                movements={movements}
                currency={tenant.currency}
                currentUser={currentUser}
                tenant={tenant}
                onAdjustStock={handleAdjustStock}
                onTriggerPurchaseSuggestion={handleTriggerPurchaseSuggestion}
                subView={activeSubView}
              />
            )}

            {activeTab === 'SUPPLIERS' && (
              <SuppliersView
                suppliers={suppliers}
                products={products}
                purchases={purchases}
                movements={supplierMovements}
                currency={tenant.currency}
                currentUser={currentUser}
                onSaveSupplier={handleSaveSupplier}
                onToggleSupplierStatus={handleToggleSupplierStatus}
                onRegisterPurchase={handleCreatePurchase}
                onCancelPurchase={handleCancelPurchase}
                onConfirmDraftPurchase={handleConfirmPurchase}
                onPaySupplier={handlePaySupplier}
                subView={activeSubView}
              />
            )}

            {activeTab === 'TREASURY' && (
              <TreasuryView
                cashBalance={cashBalance}
                bankBalance={bankBalance}
                customers={customers}
                suppliers={suppliers}
                documents={documents}
                purchases={purchases}
                journalEntries={journalEntries}
                bankAccounts={bankAccounts}
                receipts={receipts}
                disbursements={disbursements}
                cashMovements={cashMovements}
                cashShifts={cashShifts}
                currency={tenant.currency}
                currentUser={currentUser}
                onReceiveCustomerPayment={handleReceiveCustomerPayment}
                onPaySupplier={handlePaySupplier}
                onRegisterReceipt={handleRegisterReceipt}
                onCancelReceipt={handleCancelReceipt}
                onRegisterDisbursement={handleRegisterDisbursement}
                onApproveDisbursement={handleApproveDisbursement}
                onRejectDisbursement={handleRejectDisbursement}
                onCancelDisbursement={handleCancelDisbursement}
                onCreateCashMovement={handleCreateCashMovement}
                onCloseShift={handleCloseShift}
                onOpenShift={handleOpenShift}
                onTransferFunds={handleTransferFunds}
                subView={activeSubView}
              />
            )}

            {activeTab === 'HR' && (
              <HRPayrollView tenant={tenant} />
            )}

            {activeTab === 'EVENTBUS' && (
              <EventBusLiveView events={events} auditRecords={auditRecords} />
            )}

            {activeTab === 'FISCAL' && (
              <FiscalAutomationView
                currentCountry={currentCountry}
                onCountryChange={handleCountryChange}
                fiscalEngine={orchestrator.fiscalEngine}
                rules={rules}
                onToggleRule={handleToggleRule}
                documents={documents}
                currency={tenant.currency}
                tenant={tenant}
                products={products}
                customers={customers}
              />
            )}

            {activeTab === 'SETTINGS' && (
              <TenantSettingsView
                tenant={tenant}
                currentUser={currentUser}
                subView={activeSubView}
                onUpdateTenant={(updated) => {
                  setTenant(updated);
                  orchestrator.updateTenant(updated.id, updated, currentUser);
                  setToastMessage({
                    title: 'Definições Guardadas',
                    desc: 'Configurações do estabelecimento atualizadas com sucesso.',
                    type: 'success',
                  });
                  setTimeout(() => setToastMessage(null), 3000);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* 3. Bottom Mobile Navigation Bar (⌂ ◫ ＋ ▣ ☰) */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={(tabId) => setActiveTab(tabId as NavTab)}
        onOpenSidebar={() => setIsMobileSidebarOpen(true)}
        onOpenNewOperation={() => setShowNewOpModal(true)}
        onOpenMenuDrawer={() => setIsMenuDrawerOpen(true)}
      />

      {/* 4. Single Unified Menu Drawer - Operator Contextual Drawer */}
      <UnifiedMenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 shadow-2xl rounded-xl p-3.5 max-w-sm animate-in slide-in-from-bottom-5 text-xs text-slate-200">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white">{toastMessage.title}</div>
              {toastMessage.desc && (
                <div className="text-[11px] text-slate-400 mt-0.5">{toastMessage.desc}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Operation Modal (Fast Types + Smart Text AI) */}
      <NewOperationModal
        isOpen={showNewOpModal}
        onClose={() => setShowNewOpModal(false)}
        products={products}
        customers={customers}
        suppliers={suppliers}
        currentUser={currentUser}
        onExecute={handleExecuteOperation}
        onExecuteAI={handleExecuteAICommand}
      />

      {/* Command Center Modal (Ctrl+K) */}
      <CommandCenterModal
        isOpen={showCommandCenterModal}
        onClose={() => setShowCommandCenterModal(false)}
        onNavigate={(viewId) => {
          if (viewId === 'pos') setActiveTab('POS');
          else if (viewId === 'stock') setActiveTab('STOCK');
          else if (viewId === 'suppliers') setActiveTab('SUPPLIERS');
          else if (viewId === 'treasury') setActiveTab('TREASURY');
          else if (viewId === 'hr') setActiveTab('HR');
          else if (viewId === 'fiscal') setActiveTab('FISCAL');
          else if (viewId === 'documents') setActiveTab('DOCS');
        }}
        onOpenQuickOp={(type) => {
          setShowNewOpModal(true);
        }}
        onOpenAdmin={() => {
          setShowAdminModal(true);
        }}
        onOpenProvisioningWizard={() => {
          setShowProvisioningWizard(true);
        }}
        currentUser={currentUser}
      />

      {/* Certified Fiscal Document Viewer / Printer */}
      <DocumentModal
        document={selectedDocForModal}
        tenant={tenant}
        currency={tenant.currency}
        onClose={() => setSelectedDocForModal(null)}
      />

      {/* Tenant Provisioning Wizard Modal */}
      <TenantProvisioningWizard
        isOpen={showProvisioningWizard}
        onClose={() => setShowProvisioningWizard(false)}
        onTenantProvisioned={(newTenantId) => {
          orchestrator.switchTenant(newTenantId, currentUser);
          syncStateFromEngines();
          setTenant(orchestrator.tenant);
          setCurrentCountry(orchestrator.fiscalEngine.getCountry());
          setToastMessage({
            title: 'Novo Tenant Ativado',
            desc: `Ambiente e módulos configurados para ${orchestrator.tenant.tradeName} (${orchestrator.tenant.segment || orchestrator.tenant.businessSegment}).`,
            type: 'success',
          });
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Platform Control & Secret Dialpad (*#7668#) */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setTenant(orchestrator.tenant);
        }}
        currentUser={currentUser}
        onTenantSwitch={(newTenantId) => {
          orchestrator.switchTenant(newTenantId, currentUser);
          syncStateFromEngines();
          setTenant(orchestrator.tenant);
          setCurrentCountry(orchestrator.fiscalEngine.getCountry());
          setToastMessage({
            title: 'Contexto de Tenant Atualizado',
            desc: `Acedendo agora a ${orchestrator.tenant.tradeName} (${orchestrator.tenant.country}).`,
            type: 'info',
          });
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

    </div>
  );
}

