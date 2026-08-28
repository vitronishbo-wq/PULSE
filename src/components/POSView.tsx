import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building,
  User,
  Zap,
  CheckCircle2,
  Sparkles,
  UtensilsCrossed,
  Pill,
  Shirt,
  Briefcase,
  Flame,
  Clock,
  Tag,
  AlertCircle,
  Scan,
  Keyboard,
  Coins,
  Printer,
  Share2,
  PauseCircle,
  PlayCircle,
  X,
  Percent,
  FileText,
  DollarSign,
  ArrowRightLeft,
  Lock,
} from 'lucide-react';
import {
  Product,
  Customer,
  PaymentMethod,
  User as SystemUser,
  Document,
  TenantProfile,
  BusinessSegment,
  ReceiptFormat,
} from '../types/pulse';
import { InteractionModeModal } from './InteractionModeModal';
import { POSModeSelector } from './POSModeSelector';
import { PrintService } from '../output/PrintService';
import { ProfileEngine } from '../engines/ProfileEngine';
import { POSDiscountModal } from './POSDiscountModal';
import { POSReprintModal } from './POSReprintModal';
import { POSCustomerModal } from './POSCustomerModal';
import { POSShiftCloseModal } from './POSShiftCloseModal';
import { POSHeldCartsModal } from './POSHeldCartsModal';

export interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
  discount: number;
  selectedSize?: string;
  selectedColor?: string;
  notes?: string;
  modifiers?: string[];
}

export interface HeldCart {
  id: string;
  timestamp: string;
  customerId: string;
  customerName: string;
  items: CartItem[];
  total: number;
  notes?: string;
  operatorName: string;
}

interface POSViewProps {
  products: Product[];
  customers: Customer[];
  currentUser: SystemUser;
  tenant?: TenantProfile;
  currency: string;
  subView?: string;
  documents?: Document[];
  resumedCart?: HeldCart | null;
  onClearResumedCart?: () => void;
  heldCarts?: HeldCart[];
  onHoldCurrentCart?: (note: string, items: CartItem[], customer: Customer, total: number) => void;
  onResumeHeldCart?: (heldCart: HeldCart) => void;
  onDeleteHeldCart?: (heldId: string) => void;
  onCompleteSale: (params: {
    customerId: string;
    customerName: string;
    customerTaxId: string;
    items: { productId: string; qty: number; unitPrice: number; discount: number }[];
    paymentMethod: PaymentMethod;
    paidAmount: number;
    docType: 'INVOICE' | 'RECEIPT';
  }) => Document | undefined;
  onViewDocument: (doc: Document) => void;
  onCompleteReturnOrExchange?: (result: any) => void;
}

export type POSInteractionMode = 'TOUCH' | 'CLICK';

export const POSView: React.FC<POSViewProps> = ({
  products = [],
  customers = [],
  currentUser,
  tenant,
  currency,
  subView,
  documents = [],
  resumedCart,
  onClearResumedCart,
  heldCarts: externalHeldCarts,
  onHoldCurrentCart: externalOnHoldCurrentCart,
  onResumeHeldCart: externalOnResumeHeldCart,
  onDeleteHeldCart: externalOnDeleteHeldCart,
  onCompleteSale,
  onViewDocument,
  onCompleteReturnOrExchange,
}) => {
  const safeCustomers = Array.isArray(customers) ? customers : [];
  const segment: BusinessSegment = tenant?.segment || tenant?.businessSegment || 'GENERAL_RETAIL';
  const profileEngine = ProfileEngine.getInstance();
  const profileFeatures = profileEngine.getInterfaceFeatures(segment, tenant?.activeModules);

  // Held Carts (Suspender / Retomar Venda) Local Persistence
  const heldCartsKey = `pulse_held_carts_${tenant?.id || 'default'}`;
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(heldCartsKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Modal Triggers
  const [showHeldModal, setShowHeldModal] = useState<boolean>(() => subView === 'HELD_CARTS');
  const [showShiftCloseModal, setShowShiftCloseModal] = useState<boolean>(() => subView === 'SHIFT_CLOSE');
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [showReprintModal, setShowReprintModal] = useState<boolean>(false);
  const [showCustomerModal, setShowCustomerModal] = useState<boolean>(false);
  const [showInteractionModeModal, setShowInteractionModeModal] = useState<boolean>(false);

  // Sync external held carts if provided
  useEffect(() => {
    if (externalHeldCarts) {
      setHeldCarts(externalHeldCarts);
    }
  }, [externalHeldCarts]);

  // Resume cart if passed from dedicated view
  useEffect(() => {
    if (resumedCart) {
      setCart(resumedCart.items || []);
      if (resumedCart.customerId) {
        setSelectedCustomerId(resumedCart.customerId);
      }
      if (onClearResumedCart) {
        onClearResumedCart();
      }
      setPrintFeedback(`Venda #${resumedCart.id} retomada no terminal!`);
      setTimeout(() => setPrintFeedback(null), 3500);
    }
  }, [resumedCart]);

  useEffect(() => {
    if (subView === 'HELD_CARTS') setShowHeldModal(true);
    if (subView === 'SHIFT_CLOSE') setShowShiftCloseModal(true);
  }, [subView]);

  // Filter products strictly matching tenant business segment
  const safeProducts = useMemo(() => {
    const rawList = Array.isArray(products) ? products : [];
    return rawList.filter((p) => {
      if (!p) return false;
      if (p.segment) {
        if (segment === 'PHARMACY') return p.segment === 'PHARMACY';
        if (segment === 'RESTAURANT_BAR') return p.segment === 'RESTAURANT_BAR';
        if (segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING') return p.segment === 'CLOTHING' || p.segment === 'RETAIL_CLOTHING';
        if (segment === 'SERVICES') return p.segment === 'SERVICES';
        if (segment === 'SUPERMARKET' || segment === 'CONVENIENCE_STORE' || segment === 'GENERAL_RETAIL') {
          return p.segment === 'SUPERMARKET' || p.segment === 'GENERAL_RETAIL' || p.segment === 'CONVENIENCE_STORE';
        }
      }
      if (segment === 'PHARMACY') {
        return ['Medicamentos', 'Antibióticos', 'Dermocosmética', 'Primeiros Socorros'].includes(p.category);
      }
      if (segment === 'RESTAURANT_BAR') {
        return ['Bebidas', 'Cafetaria', 'Restauração', 'Matéria-Prima'].includes(p.category);
      }
      if (segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING') {
        return ['Vestuário Masculino', 'Vestuário Feminino', 'Calçado', 'Acessórios'].includes(p.category);
      }
      if (segment === 'SERVICES') {
        return ['Serviços', 'Consultoria', 'Auditoria'].includes(p.category);
      }
      return !['Medicamentos', 'Antibióticos', 'Vestuário Masculino', 'Vestuário Feminino'].includes(p.category);
    });
  }, [products, segment]);

  // Interaction Mode: Touch vs Click
  const [interactionMode, setInteractionMode] = useState<POSInteractionMode>(() => {
    const saved = localStorage.getItem('pulse_pos_interaction_mode');
    if (saved === 'TOUCH' || saved === 'CLICK') return saved;
    if (typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
      return 'TOUCH';
    }
    return profileFeatures.pos.defaultInteractionMode;
  });

  // POS State
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(safeCustomers[0]?.id || 'cust_01');
  const [customCustomer, setCustomCustomer] = useState<{ id: string; name: string; taxId: string; address?: string } | null>(null);
  
  // Authorized Discount
  const [globalDiscountPercent, setGlobalDiscountPercent] = useState<number>(0);
  const [discountAuthorizedBy, setDiscountAuthorizedBy] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [tenderAmount, setTenderAmount] = useState<number>(0);
  const [lastIssuedDoc, setLastIssuedDoc] = useState<Document | null>(null);
  const [defaultPrintFormat, setDefaultPrintFormat] = useState<ReceiptFormat>('THERMAL_80');
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState<boolean>(() => {
    return localStorage.getItem('pulse_pos_autoprint') === 'true';
  });

  // Scanner & Keyboard autofocus
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard Shortcuts: F1: Nova Venda, F2: Pesquisa/Scanner, F8: Touch/Click toggle
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F1' || (e.ctrlKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        handleNewSale();
      } else if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F8') {
        e.preventDefault();
        setInteractionMode((prev) => {
          const next = prev === 'TOUCH' ? 'CLICK' : 'TOUCH';
          localStorage.setItem('pulse_pos_interaction_mode', next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cart]);

  // In Click mode, focus search bar automatically for instant scanner laser input
  useEffect(() => {
    if (interactionMode === 'CLICK' && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [interactionMode]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>(['Todos']);
    safeProducts.forEach((p) => {
      if (p && p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [safeProducts]);

  // Product Search Filter
  const filteredProducts = useMemo(() => {
    return safeProducts.filter((p) => {
      if (!p) return false;
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.activeSubstance && p.activeSubstance.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [safeProducts, selectedCategory, searchQuery]);

  // Active customer resolution
  const selectedCustomer = useMemo(() => {
    if (customCustomer) return customCustomer;
    return safeCustomers.find((c) => c.id === selectedCustomerId) || safeCustomers[0] || {
      id: 'cust_final',
      name: 'Consumidor Final',
      taxId: '999999999',
    };
  }, [customCustomer, safeCustomers, selectedCustomerId]);

  // 1. ➔ NOVA VENDA
  const handleNewSale = () => {
    setCart([]);
    setSearchQuery('');
    setTenderAmount(0);
    setGlobalDiscountPercent(0);
    setDiscountAuthorizedBy(null);
    setCustomCustomer(null);
    setSelectedCustomerId(safeCustomers[0]?.id || 'cust_01');
    setPrintFeedback('Nova Venda iniciada.');
    setTimeout(() => setPrintFeedback(null), 2000);
    searchInputRef.current?.focus();
  };

  // 2. ➔ PESQUISA / SCANNER: Add product to cart
  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const nextCart = [...cart];
      nextCart[existingIndex].qty += 1;
      setCart(nextCart);
    } else {
      const newItem: CartItem = {
        product,
        qty: 1,
        unitPrice: product.price,
        discount: 0,
      };
      setCart([...cart, newItem]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const match = safeProducts.find(
      (p) =>
        p.barcode === searchQuery.trim() ||
        p.sku.toLowerCase() === searchQuery.trim().toLowerCase() ||
        p.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );
    if (match) {
      addToCart(match);
      setSearchQuery('');
    }
  };

  // 3. ➔ CARRINHO ATIVO: Update Quantities & Modifiers
  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setDirectQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) =>
        prev.map((item, i) => (i === index ? { ...item, qty: newQty } : item))
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // 4. Calculations
  const grossSubtotal = cart.reduce(
    (acc, item) => acc + item.qty * item.unitPrice * (1 - item.discount / 100),
    0
  );

  const discountAmount = (grossSubtotal * globalDiscountPercent) / 100;
  const netPayableTotal = Math.max(0, grossSubtotal - discountAmount);

  // Change calculation
  const changeAmount = tenderAmount > netPayableTotal ? tenderAmount - netPayableTotal : 0;

  // Print Service
  const printService = PrintService.getInstance();

  const handleFastPrint = async (doc: Document, format: ReceiptFormat = defaultPrintFormat) => {
    if (!tenant) return;
    setPrintFeedback(`A enviar para impressão (${format === 'THERMAL_80' ? '80mm' : format === 'THERMAL_58' ? '58mm' : 'A4'})...`);
    await printService.print(doc, tenant, { format, operator: currentUser.name });
    setPrintFeedback('Enviado para a impressora!');
    setTimeout(() => setPrintFeedback(null), 3000);
  };

  // 6. ➔ PAGAMENTO / CHECKOUT
  const handleCheckout = (docType: 'INVOICE' | 'RECEIPT') => {
    if (cart.length === 0) return;

    const doc = onCompleteSale({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerTaxId: selectedCustomer.taxId,
      items: cart.map((i) => ({
        productId: i.product.id,
        qty: i.qty,
        unitPrice: i.unitPrice,
        discount: i.discount || globalDiscountPercent,
      })),
      paymentMethod,
      paidAmount: paymentMethod === 'CREDIT' ? 0 : tenderAmount || netPayableTotal,
      docType,
    });

    if (doc) {
      setLastIssuedDoc(doc);
      setCart([]);
      setTenderAmount(0);
      setGlobalDiscountPercent(0);
      setDiscountAuthorizedBy(null);

      // Auto-Print if configured
      if (autoPrintEnabled && tenant) {
        handleFastPrint(doc, defaultPrintFormat);
      }
    }
  };

  // 3. ➔ SUSPENDER / RETOMAR VENDA HANDLERS
  const handleHoldCurrentCart = (notes: string) => {
    if (cart.length === 0) return;
    const newHeldCart: HeldCart = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      items: [...cart],
      total: netPayableTotal,
      notes,
      operatorName: currentUser.name,
    };
    const updated = [newHeldCart, ...heldCarts];
    setHeldCarts(updated);
    localStorage.setItem(heldCartsKey, JSON.stringify(updated));
    setCart([]);
    setShowHeldModal(false);
    setPrintFeedback(`Venda #${newHeldCart.id} suspensa com sucesso!`);
    setTimeout(() => setPrintFeedback(null), 3000);
  };

  const handleResumeHeldCart = (heldCart: HeldCart) => {
    setCart(heldCart.items);
    setSelectedCustomerId(heldCart.customerId);
    const remaining = heldCarts.filter((h) => h.id !== heldCart.id);
    setHeldCarts(remaining);
    localStorage.setItem(heldCartsKey, JSON.stringify(remaining));
    setShowHeldModal(false);
    setPrintFeedback(`Venda #${heldCart.id} retomada no carrinho.`);
    setTimeout(() => setPrintFeedback(null), 3000);
  };

  const handleDeleteHeldCart = (heldId: string) => {
    const remaining = heldCarts.filter((h) => h.id !== heldId);
    setHeldCarts(remaining);
    localStorage.setItem(heldCartsKey, JSON.stringify(remaining));
  };

  // Quick Banknote increments
  const quickCashOptions = [1000, 2000, 5000, 10000, 20000, 50000];

  return (
    <div id="pulse-pos-view" className="space-y-3 font-mono">
      
      {/* ➔ POS HEADER & TOP TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        
        {/* Left: Branding & Nova Venda */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white uppercase tracking-wider block">
              {tenant?.tradeName || 'POS TERMINAL'}
            </span>
            <span className="text-[10px] text-slate-400">
              Operador: <span className="text-white font-semibold">{currentUser.name}</span>
            </span>
          </div>

          {/* ➔ Nova Venda Action Button */}
          <button
            onClick={handleNewSale}
            className="ml-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            title="Iniciar uma nova venda limpa (F1 ou Ctrl+N)"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Venda</span>
            <span className="text-[9px] bg-emerald-950/40 text-emerald-950 px-1 rounded font-mono">F1</span>
          </button>
        </div>

        {/* Center: Mode Selector */}
        <POSModeSelector
          mode={interactionMode}
          onChangeMode={(m) => {
            setInteractionMode(m);
            localStorage.setItem('pulse_pos_interaction_mode', m);
          }}
          onOpenSettingsModal={() => setShowInteractionModeModal(true)}
        />

        {/* Right Action Shortcuts: Suspender/Retomar, Fecho Turno, Reimpressão */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* ➔ Suspender / Retomar Venda */}
          <button
            onClick={() => setShowHeldModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
              heldCarts.length > 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Suspender ou Retomar Vendas"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Vendas Suspensas</span>
            {heldCarts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                {heldCarts.length}
              </span>
            )}
          </button>

          {/* ➔ Reimpressão */}
          <button
            onClick={() => setShowReprintModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 transition-colors cursor-pointer"
            title="Reimprimir Talões Anteriores (2ª Via)"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Reimpressão</span>
          </button>

          {/* ➔ Fecho de Turno */}
          <button
            onClick={() => setShowShiftCloseModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Fecho de Turno & Caixa Z"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Fecho Turno</span>
          </button>

        </div>
      </div>

      {/* Instant Print Feedback Banner */}
      {printFeedback && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-2.5 rounded-xl text-xs flex items-center justify-between animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{printFeedback}</span>
          </div>
          <button onClick={() => setPrintFeedback(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Last Issued Document Banner with Quick Reprint */}
      {lastIssuedDoc && (
        <div className="bg-[#14141a] border-2 border-emerald-500/60 rounded-xl p-3 shadow-xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm font-mono">
                  {lastIssuedDoc.docNumber}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  {lastIssuedDoc.docType} EMITIDO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total: <span className="text-emerald-400 font-bold font-mono">{(lastIssuedDoc.grossAmount ?? (lastIssuedDoc as any).total ?? 0).toLocaleString()} {currency}</span> • Cliente: {lastIssuedDoc.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => handleFastPrint(lastIssuedDoc, 'THERMAL_80')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Talão (80mm)</span>
            </button>
            <button
              onClick={() => onViewDocument(lastIssuedDoc)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
            >
              Ver Documento
            </button>
            <button
              onClick={() => setLastIssuedDoc(null)}
              className="p-1.5 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN POS WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* LEFT COLUMN: ➔ PESQUISA / SCANNER & PRODUTOS (Cols 7) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* ➔ Pesquisa / Scanner Input Bar */}
          <div className="bg-[#14141a] border border-slate-800 rounded-xl p-3 space-y-2">
            <form onSubmit={handleBarcodeSubmit} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Pesquisar produto por Nome, SKU ou ler Código de Barras (F2)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Submeter leitura do scanner de código de barras"
              >
                <Scan className="w-4 h-4" />
                <span>Scanner</span>
              </button>
            </form>

            {/* Categories Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid / List */}
          <div className="bg-[#14141a] border border-slate-800 rounded-xl p-3 min-h-[420px]">
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600" />
                <p>Nenhum artigo encontrado com os termos de pesquisa.</p>
              </div>
            ) : interactionMode === 'TOUCH' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-[#1b1b22] hover:bg-[#23232c] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between text-left transition-all group cursor-pointer h-28"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white text-xs line-clamp-2 group-hover:text-emerald-300">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {p.sku} {p.barcode ? `• ${p.barcode}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="font-bold text-emerald-400 font-mono text-xs">
                        {p.price.toLocaleString()} {currency}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {p.stock} {p.unit || 'UN'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              // CLICK / SCANNER DENSER TABLE
              <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-800">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="py-2.5 px-3 flex items-center justify-between hover:bg-[#1f1f28] cursor-pointer transition-colors"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0 pr-3">
                      <div className="font-bold text-white text-xs truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {p.sku} | Barcode: {p.barcode || 'N/D'} | Categoria: {p.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">{p.stock} {p.unit || 'UN'}</span>
                      <span className="font-bold text-emerald-400 font-mono text-xs w-24 text-right">
                        {p.price.toLocaleString()} {currency}
                      </span>
                      <button className="p-1 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500 hover:text-slate-950">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: ➔ CARRINHO ATIVO, CLIENTE/NIF, DESCONTOS & CHECKOUT (Cols 5) */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="bg-[#14141a] border border-slate-800 rounded-xl p-3.5 space-y-3">
            
            {/* ➔ Cliente / NIF Header */}
            <div className="flex items-center justify-between bg-[#1b1b22] border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-slate-400 uppercase">Cliente / NIF:</div>
                  <div className="font-bold text-white text-xs truncate">
                    {selectedCustomer.name} ({selectedCustomer.taxId || '999999999'})
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowCustomerModal(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap"
              >
                Alterar Cliente
              </button>
            </div>

            {/* ➔ Carrinho Ativo List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-bold uppercase flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Carrinho Ativo ({cart.reduce((a, b) => a + b.qty, 0)} artigos)
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-rose-400 hover:underline text-[10px] cursor-pointer"
                  >
                    Esvaziar Carrinho
                  </button>
                )}
              </div>

              <div className="min-h-[220px] max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
                {cart.length === 0 ? (
                  <div className="p-8 text-center bg-[#1b1b22] border border-slate-800 rounded-xl text-slate-500 text-xs">
                    O carrinho está vazio. Adicione artigos através da pesquisa ou leitor de código de barras.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item.product.id}
                      className="bg-[#1b1b22] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-xs truncate">
                          {item.product.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.unitPrice.toLocaleString()} {currency} un
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                          <button
                            onClick={() => updateQty(item.product.id, -1)}
                            className="px-2 py-0.5 text-slate-300 hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 font-bold text-white text-xs font-mono">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.product.id, 1)}
                            className="px-2 py-0.5 text-slate-300 hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-emerald-400 font-mono text-xs w-18 text-right">
                          {(item.qty * item.unitPrice * (1 - item.discount / 100)).toLocaleString()}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ➔ Descontos Autorizados & Subtotais */}
            <div className="bg-[#1b1b22] border border-slate-800 rounded-xl p-3 space-y-2">
              
              <div className="flex justify-between items-center text-slate-300">
                <span>Subtotal Bruto:</span>
                <span className="font-bold font-mono">{grossSubtotal.toLocaleString()} {currency}</span>
              </div>

              {/* Discount Trigger */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>
                    {globalDiscountPercent > 0
                      ? `Desconto Autorizado (${globalDiscountPercent.toFixed(0)}%):`
                      : '+ Aplicar Desconto Autorizado'}
                  </span>
                </button>
                {globalDiscountPercent > 0 && (
                  <span className="font-bold text-rose-400 font-mono">
                    -{discountAmount.toLocaleString()} {currency}
                  </span>
                )}
              </div>

              {/* Total Final */}
              <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                <span className="font-bold text-white text-sm uppercase">Total a Pagar:</span>
                <span className="font-mono text-lg font-black text-emerald-400">
                  {netPayableTotal.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* ➔ Meios de Pagamento */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                Meio de Pagamento:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'CASH', label: 'Numerário', icon: Banknote },
                  { id: 'MULTICAIXA', label: 'Multicaixa', icon: CreditCard },
                  { id: 'TRANSFER', label: 'Transf.', icon: Building },
                  { id: 'CREDIT', label: 'Crédito', icon: Clock },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setPaymentMethod(m.id as PaymentMethod);
                        if (m.id !== 'CASH') setTenderAmount(netPayableTotal);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all text-xs cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-[#1b1b22] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Input & Change Calculator (if CASH) */}
            {paymentMethod === 'CASH' && (
              <div className="bg-[#1b1b22] border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Valor Entregue pelo Cliente:
                  </span>
                  <button
                    onClick={() => setTenderAmount(netPayableTotal)}
                    className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                  >
                    Valor Exato
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tenderAmount || ''}
                    placeholder="Valor entregue..."
                    onChange={(e) => setTenderAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                  />
                  <span className="font-bold text-slate-400 text-xs">{currency}</span>
                </div>

                {/* Quick Banknote Increments */}
                <div className="grid grid-cols-6 gap-1">
                  {quickCashOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTenderAmount(opt)}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[9px] font-mono font-bold cursor-pointer"
                    >
                      {opt >= 1000 ? `${opt / 1000}k` : opt}
                    </button>
                  ))}
                </div>

                {/* Change */}
                <div className="flex justify-between items-center pt-1 text-xs border-t border-slate-800">
                  <span className="text-slate-400 font-bold uppercase">Troco a Devolver:</span>
                  <span className="font-mono text-sm font-black text-amber-300">
                    {changeAmount.toLocaleString()} {currency}
                  </span>
                </div>
              </div>
            )}

            {/* ➔ Checkout Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => handleCheckout('RECEIPT')}
                disabled={cart.length === 0}
                className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                  cart.length > 0
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-98'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Fatura / Recibo (FR)</span>
              </button>

              <button
                onClick={() => handleCheckout('INVOICE')}
                disabled={cart.length === 0}
                className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                  cart.length > 0
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Fatura (FT)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* MODALS */}

      {/* 1. Cliente / NIF Modal */}
      <POSCustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customers={safeCustomers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={(c) => {
          setSelectedCustomerId(c.id);
          setCustomCustomer(null);
        }}
        onCreateTempCustomer={(tc) => {
          setCustomCustomer(tc);
        }}
      />

      {/* 2. Desconto Autorizado Modal */}
      <POSDiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        subtotal={grossSubtotal}
        currency={currency}
        currentUser={currentUser}
        onApplyDiscount={(pct, authBy) => {
          setGlobalDiscountPercent(pct);
          setDiscountAuthorizedBy(authBy);
        }}
      />

      {/* 3. Reimpressão Modal */}
      <POSReprintModal
        isOpen={showReprintModal}
        onClose={() => setShowReprintModal(false)}
        documents={documents}
        tenant={tenant!}
        currentUser={currentUser}
        currency={currency}
      />

      {/* 4. Fecho de Turno Modal */}
      <POSShiftCloseModal
        isOpen={showShiftCloseModal}
        onClose={() => setShowShiftCloseModal(false)}
        documents={documents}
        tenant={tenant!}
        currentUser={currentUser}
        currency={currency}
      />

      {/* 5. Suspender / Retomar Venda Modal */}
      <POSHeldCartsModal
        isOpen={showHeldModal}
        onClose={() => setShowHeldModal(false)}
        heldCarts={heldCarts}
        currentCart={cart}
        currentCartTotal={netPayableTotal}
        currentCustomerName={selectedCustomer.name}
        currency={currency}
        currentUser={currentUser}
        onHoldCurrentCart={handleHoldCurrentCart}
        onResumeHeldCart={handleResumeHeldCart}
        onDeleteHeldCart={handleDeleteHeldCart}
      />

      {/* 6. Interaction Mode Modal */}
      <InteractionModeModal
        isOpen={showInteractionModeModal}
        onClose={() => setShowInteractionModeModal(false)}
        currentMode={interactionMode}
        onSelectMode={(mode) => {
          setInteractionMode(mode);
          localStorage.setItem('pulse_pos_interaction_mode', mode);
        }}
        segment={segment}
      />

    </div>
  );
};
