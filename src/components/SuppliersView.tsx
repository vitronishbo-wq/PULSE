import React, { useState } from 'react';
import {
  Building,
  Truck,
  Receipt,
  FileText,
  DollarSign,
  TrendingDown,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Supplier,
  Product,
  PurchaseEntry,
  SupplierLedgerMovement,
  PaymentMethod,
  User,
} from '../types/pulse';
import { SupplierDirectoryView } from './SupplierDirectoryView';
import { SupplierPurchasesView } from './SupplierPurchasesView';
import { SupplierLedgerView } from './SupplierLedgerView';

interface SuppliersViewProps {
  suppliers: Supplier[];
  products: Product[];
  purchases: PurchaseEntry[];
  movements: SupplierLedgerMovement[];
  currency: string;
  currentUser: User;
  onSaveSupplier: (supplier: Supplier) => void;
  onToggleSupplierStatus: (supplierId: string) => void;
  onRegisterPurchase: (purchase: PurchaseEntry) => void;
  onCancelPurchase: (purchaseId: string, reason?: string) => void;
  onConfirmDraftPurchase: (purchaseId: string) => void;
  onPaySupplier: (params: {
    supplierId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) => void;
  subView?: string;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers = [],
  products = [],
  purchases = [],
  movements = [],
  currency,
  currentUser,
  onSaveSupplier,
  onToggleSupplierStatus,
  onRegisterPurchase,
  onCancelPurchase,
  onConfirmDraftPurchase,
  onPaySupplier,
  subView,
}) => {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PURCHASES' | 'LEDGER'>(() => {
    if (subView === 'PURCHASES' || subView === 'PAYABLES') return 'PURCHASES';
    if (subView === 'LEDGER' || subView === 'SUPPLIER_LEDGER') return 'LEDGER';
    return 'DIRECTORY';
  });

  React.useEffect(() => {
    if (subView === 'PURCHASES' || subView === 'PAYABLES') {
      setActiveTab('PURCHASES');
    } else if (subView === 'LEDGER' || subView === 'SUPPLIER_LEDGER') {
      setActiveTab('LEDGER');
    } else if (subView === 'DIRECTORY' || subView === 'SUPPLIERS') {
      setActiveTab('DIRECTORY');
    }
  }, [subView]);
  const [selectedSupplierForPurchase, setSelectedSupplierForPurchase] = useState<Supplier | null>(null);
  const [filterSupplierForLedger, setFilterSupplierForLedger] = useState<string>('ALL');

  // Total KPIs
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.status !== 'INACTIVE').length;
  const totalPayables = suppliers.reduce((acc, s) => acc + (s.currentBalance || 0), 0);
  const totalPurchasesMonth = purchases
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((acc, p) => acc + p.grossTotal, 0);

  const handleSelectForPurchase = (sup: Supplier) => {
    setSelectedSupplierForPurchase(sup);
    setActiveTab('PURCHASES');
  };

  const handleViewLedger = (supId: string) => {
    setFilterSupplierForLedger(supId);
    setActiveTab('LEDGER');
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272a] pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Building className="w-6 h-6 text-amber-400" />
            <span>Módulo de Fornecedores & Gestão de Compras</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ficheiro de fornecedores, registo de compras de mercadorias com rateio e extrato de conta-corrente.
          </p>
        </div>

        {/* 3 Main Tabs */}
        <div className="flex items-center bg-[#121215] border border-[#27272a] rounded-xl p-1 text-xs">
          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'DIRECTORY'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>1. Ficheiro de Fornecedores</span>
          </button>

          <button
            onClick={() => setActiveTab('PURCHASES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'PURCHASES'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>2. Compras / Entradas</span>
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>3. Histórico / Conta-Corrente</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm">
          <div className="text-xs text-slate-400">Total Fornecedores Ativos</div>
          <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
            {activeSuppliers} <span className="text-xs text-slate-500 font-normal">/ {totalSuppliers} cadastrados</span>
          </div>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm">
          <div className="text-xs text-slate-400">Saldo Total a Pagar (AP)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {totalPayables.toLocaleString('pt-AO')} <span className="text-xs text-slate-400 font-normal">{currency}</span>
          </div>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm">
          <div className="text-xs text-slate-400">Volume de Compras Confirmadas</div>
          <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
            {totalPurchasesMonth.toLocaleString('pt-AO')} <span className="text-xs text-slate-400 font-normal">{currency}</span>
          </div>
        </div>

        <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Entradas Registadas</div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {purchases.filter((p) => p.status === 'CONFIRMED').length} <span className="text-xs text-slate-500 font-normal">guias</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'DIRECTORY' && (
        <SupplierDirectoryView
          suppliers={suppliers}
          products={products}
          purchases={purchases}
          movements={movements}
          currency={currency}
          currentUser={currentUser}
          onSaveSupplier={onSaveSupplier}
          onToggleSupplierStatus={onToggleSupplierStatus}
          onSelectForPurchase={handleSelectForPurchase}
          onViewLedger={handleViewLedger}
        />
      )}

      {activeTab === 'PURCHASES' && (
        <SupplierPurchasesView
          purchases={purchases}
          suppliers={suppliers}
          products={products}
          currency={currency}
          currentUser={currentUser}
          onRegisterPurchase={onRegisterPurchase}
          onCancelPurchase={onCancelPurchase}
          onConfirmDraftPurchase={onConfirmDraftPurchase}
          preSelectedSupplier={selectedSupplierForPurchase}
        />
      )}

      {activeTab === 'LEDGER' && (
        <SupplierLedgerView
          movements={movements}
          suppliers={suppliers}
          currency={currency}
          currentUser={currentUser}
          onPaySupplier={onPaySupplier}
          filterSupplierId={filterSupplierForLedger}
        />
      )}
    </div>
  );
};
