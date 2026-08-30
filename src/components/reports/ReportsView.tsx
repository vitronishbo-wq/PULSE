import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Package,
  ShieldCheck,
  Activity,
  Filter,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Document,
  Product,
  Customer,
  Supplier,
  PurchaseEntry,
  ReceiptEntry,
  PaymentDisbursement,
  CashMovementEntry,
  CashShiftRecord,
  BankAccount,
  AuditRecord,
  SystemEvent,
  CommercialSeries,
  TenantProfile,
  User,
  CustomerLedgerMovement,
  SupplierLedgerMovement,
  StockMovement,
} from '../../types/pulse';
import {
  ReportMainCategory,
  ReportSubCategory,
  ReportFilterState,
  DateRangePreset,
} from '../../types/reports';
import { ReportsSalesSection } from './ReportsSalesSection';
import { ReportsFinancialSection } from './ReportsFinancialSection';
import { ReportsStockSection } from './ReportsStockSection';
import { ReportsFiscalSection } from './ReportsFiscalSection';
import { ReportsAuditSection } from './ReportsAuditSection';

interface ReportsViewProps {
  documents: Document[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: PurchaseEntry[];
  receipts: ReceiptEntry[];
  disbursements: PaymentDisbursement[];
  cashMovements: CashMovementEntry[];
  cashShifts: CashShiftRecord[];
  bankAccounts: BankAccount[];
  auditRecords: AuditRecord[];
  systemEvents: SystemEvent[];
  customerMovements: CustomerLedgerMovement[];
  supplierMovements: SupplierLedgerMovement[];
  stockMovements: StockMovement[];
  series: CommercialSeries[];
  tenant: TenantProfile;
  currentUser: User;
  users: User[];
  initialSubView?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  documents,
  products,
  customers,
  suppliers,
  purchases,
  receipts,
  disbursements,
  cashMovements,
  cashShifts,
  bankAccounts,
  auditRecords,
  systemEvents,
  customerMovements,
  supplierMovements,
  stockMovements,
  series,
  tenant,
  currentUser,
  users,
  initialSubView,
}) => {
  // Helper to compute preset dates
  const getPresetDates = (preset: DateRangePreset): { startDate: string; endDate: string } => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === 'TODAY') {
      return { startDate: formatDate(today), endDate: formatDate(today) };
    }
    if (preset === 'YESTERDAY') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { startDate: formatDate(y), endDate: formatDate(y) };
    }
    if (preset === 'LAST_7_DAYS') {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      return { startDate: formatDate(past), endDate: formatDate(today) };
    }
    if (preset === 'THIS_MONTH') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(first), endDate: formatDate(today) };
    }
    if (preset === 'LAST_MONTH') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: formatDate(first), endDate: formatDate(last) };
    }
    if (preset === 'THIS_YEAR') {
      const first = new Date(today.getFullYear(), 0, 1);
      return { startDate: formatDate(first), endDate: formatDate(today) };
    }
    return { startDate: '', endDate: '' };
  };

  // Determine initial category and subcategory
  const parseInitialSubView = (subView?: string): { main: ReportMainCategory; sub: ReportSubCategory } => {
    if (!subView) return { main: 'SALES', sub: 'SALES_PERIOD' };

    if (subView.startsWith('FINANCIAL')) {
      return { main: 'FINANCIAL', sub: (subView as any) || 'FINANCIAL_CASHFLOW' };
    }
    if (subView.startsWith('STOCK')) {
      return { main: 'STOCK', sub: (subView as any) || 'STOCK_CURRENT' };
    }
    if (subView.startsWith('FISCAL')) {
      return { main: 'FISCAL', sub: (subView as any) || 'FISCAL_DOC_TYPES' };
    }
    if (subView.startsWith('AUDIT')) {
      return { main: 'AUDIT', sub: (subView as any) || 'AUDIT_USER_OPS' };
    }
    if (subView.startsWith('SALES')) {
      return { main: 'SALES', sub: (subView as any) || 'SALES_PERIOD' };
    }

    return { main: 'SALES', sub: 'SALES_PERIOD' };
  };

  const initialParsed = parseInitialSubView(initialSubView);
  const defaultDates = getPresetDates('THIS_MONTH');

  const [activeMainCategory, setActiveMainCategory] = useState<ReportMainCategory>(initialParsed.main);
  const [activeSubCategory, setActiveSubCategory] = useState<ReportSubCategory>(initialParsed.sub);
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState<boolean>(true);

  // Filters State
  const [filters, setFilters] = useState<ReportFilterState>({
    mainCategory: initialParsed.main,
    subCategory: initialParsed.sub,
    datePreset: 'THIS_MONTH',
    startDate: defaultDates.startDate,
    endDate: defaultDates.endDate,
    operatorId: 'ALL',
    terminalId: 'ALL',
    customerId: 'ALL',
    supplierId: 'ALL',
    productCategory: 'ALL',
    documentType: 'ALL',
    paymentMethod: 'ALL',
    searchQuery: '',
  });

  // Sync when initialSubView changes externally (from sidebar tree)
  useEffect(() => {
    if (initialSubView) {
      const parsed = parseInitialSubView(initialSubView);
      setActiveMainCategory(parsed.main);
      setActiveSubCategory(parsed.sub);
      setFilters((prev) => ({ ...prev, mainCategory: parsed.main, subCategory: parsed.sub }));
    }
  }, [initialSubView]);

  // Handle Preset Change
  const handleDatePresetChange = (preset: DateRangePreset) => {
    const dates = getPresetDates(preset);
    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      startDate: dates.startDate,
      endDate: dates.endDate,
    }));
  };

  // Main Categories
  const mainCategories = [
    { id: 'SALES' as ReportMainCategory, label: '➔ Vendas', icon: TrendingUp, count: documents.length },
    { id: 'FINANCIAL' as ReportMainCategory, label: '➔ Financeiro', icon: Wallet, count: cashMovements.length },
    { id: 'STOCK' as ReportMainCategory, label: '➔ Stock', icon: Package, count: products.length },
    { id: 'FISCAL' as ReportMainCategory, label: '➔ Fiscal', icon: ShieldCheck, badge: 'AGT' },
    { id: 'AUDIT' as ReportMainCategory, label: '➔ Auditoria', icon: Activity, count: auditRecords.length },
  ];

  // Sub-reports list for each main category
  const subCategoryConfigs: Record<
    ReportMainCategory,
    { id: ReportSubCategory; label: string }[]
  > = {
    SALES: [
      { id: 'SALES_PERIOD', label: '➔ Vendas por período' },
      { id: 'SALES_PRODUCT', label: '➔ Vendas por produto / categoria' },
      { id: 'SALES_OPERATOR', label: '➔ Vendas por operador' },
      { id: 'SALES_TERMINAL', label: '➔ Vendas por terminal / turno' },
      { id: 'SALES_CUSTOMER', label: '➔ Vendas por cliente' },
      { id: 'SALES_DOCS', label: '➔ Documentos emitidos' },
      { id: 'SALES_RETURNS', label: '➔ Devoluções / cancelamentos' },
      { id: 'SALES_PAYMENTS', label: '➔ Meios de pagamento' },
    ],
    FINANCIAL: [
      { id: 'FINANCIAL_RECEIPTS', label: '➔ Recebimentos' },
      { id: 'FINANCIAL_PAYMENTS', label: '➔ Pagamentos' },
      { id: 'FINANCIAL_CASHFLOW', label: '➔ Fluxo de caixa' },
      { id: 'FINANCIAL_BALANCES', label: '➔ Saldos' },
      { id: 'FINANCIAL_RECEIVABLES', label: '➔ Contas a receber' },
      { id: 'FINANCIAL_PAYABLES', label: '➔ Contas a pagar' },
      { id: 'FINANCIAL_MARGINS', label: '➔ Margem / resultados' },
      { id: 'FINANCIAL_MOVEMENTS', label: '➔ Movimentos por período' },
      { id: 'FINANCIAL_EXPORT', label: '➔ Exportação / impressão' },
    ],
    STOCK: [
      { id: 'STOCK_CURRENT', label: '➔ Stock atual' },
      { id: 'STOCK_IN_OUT', label: '➔ Entradas / saídas' },
      { id: 'STOCK_INVENTORY', label: '➔ Inventário' },
      { id: 'STOCK_LOW', label: '➔ Produtos com stock baixo' },
      { id: 'STOCK_ADJUSTMENTS', label: '➔ Movimentos / ajustes' },
      { id: 'STOCK_VALUATION', label: '➔ Valorização de stock' },
    ],
    FISCAL: [
      { id: 'FISCAL_DOC_TYPES', label: '➔ FT / FR / NC' },
      { id: 'FISCAL_VAT', label: '➔ IVA' },
      { id: 'FISCAL_RETENTIONS', label: '➔ Retenções' },
      { id: 'FISCAL_SERIES', label: '➔ Séries / numeração' },
      { id: 'FISCAL_CANCELLATIONS', label: '➔ Anulações / correções' },
      { id: 'FISCAL_SAFT', label: '➔ SAF-T / exportação fiscal' },
    ],
    AUDIT: [
      { id: 'AUDIT_USER_OPS', label: '➔ Operações dos utilizadores' },
      { id: 'AUDIT_CHANGES_CANCELS', label: '➔ Alterações / anulações' },
      { id: 'AUDIT_SYSTEM_EVENTS', label: '➔ Eventos do sistema' },
      { id: 'AUDIT_OPERATOR_LOGS', label: '➔ Registo por operador' },
      { id: 'AUDIT_HISTORY', label: '➔ Histórico de alterações' },
    ],
  };

  // Distinct product categories for filter
  const productCategories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  return (
    <div className="flex flex-col h-full bg-[#18181b] text-slate-200 select-none overflow-y-auto">
      {/* Top Main Category Tabs */}
      <div className="border-b border-[#27272a] bg-[#121215] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {mainCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeMainCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveMainCategory(cat.id);
                  const firstSub = subCategoryConfigs[cat.id][0].id;
                  setActiveSubCategory(firstSub);
                  setFilters((prev) => ({ ...prev, mainCategory: cat.id, subCategory: firstSub }));
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[#18181b] text-slate-400 hover:text-slate-200 hover:bg-[#222227] border border-[#27272a]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {cat.badge && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsFilterBarExpanded((prev) => !prev)}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 bg-[#18181b] rounded border border-[#27272a] transition-colors cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>Filtros Globais</span>
          {isFilterBarExpanded ? (
            <ChevronUp className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          )}
        </button>
      </div>

      {/* Sub-Reports Horizontal Pill Bar */}
      <div className="bg-[#141417] border-b border-[#27272a] px-3 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {subCategoryConfigs[activeMainCategory].map((sub) => {
          const isSubActive = activeSubCategory === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubCategory(sub.id);
                setFilters((prev) => ({ ...prev, subCategory: sub.id }));
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap ${
                isSubActive
                  ? 'bg-[#27272a] text-emerald-400 font-bold border border-emerald-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#1f1f23]'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Collapsible Universal Filter Toolbar */}
      {isFilterBarExpanded && (
        <div className="bg-[#121215] border-b border-[#27272a] p-2.5 font-mono text-xs space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* 1. Date Preset */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1 font-bold">
                Período Rápido:
              </label>
              <select
                value={filters.datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value as DateRangePreset)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="TODAY">Hoje</option>
                <option value="YESTERDAY">Ontem</option>
                <option value="LAST_7_DAYS">Últimos 7 dias</option>
                <option value="THIS_MONTH">Este Mês</option>
                <option value="LAST_MONTH">Mês Anterior</option>
                <option value="THIS_YEAR">Este Ano</option>
                <option value="CUSTOM">Personalizado</option>
              </select>
            </div>

            {/* 2. Start Date */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1 font-bold">
                Data Inicial:
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, datePreset: 'CUSTOM', startDate: e.target.value }))
                }
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 3. End Date */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1 font-bold">
                Data Final:
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, datePreset: 'CUSTOM', endDate: e.target.value }))
                }
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* 4. Operator */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1 font-bold">
                Operador / Caixa:
              </label>
              <select
                value={filters.operatorId}
                onChange={(e) => setFilters((prev) => ({ ...prev, operatorId: e.target.value }))}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Operadores</option>
                {users.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Category (Conditional) */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1 font-bold">
                Categoria de Produto:
              </label>
              <select
                value={filters.productCategory}
                onChange={(e) => setFilters((prev) => ({ ...prev, productCategory: e.target.value }))}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todas as Categorias</option>
                {productCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Document Type */}
            <div>
              <label className="text-[10px] uppercase text-slate-500 block mb-1 font-bold">
                Tipo Documento:
              </label>
              <select
                value={filters.documentType}
                onChange={(e) => setFilters((prev) => ({ ...prev, documentType: e.target.value }))}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="FT">FT - Faturas</option>
                <option value="FR">FR - Faturas-Recibo</option>
                <option value="NC">NC - Notas de Crédito</option>
                <option value="VD">VD - Vendas a Dinheiro</option>
                <option value="PP">PP - Faturas Proforma</option>
              </select>
            </div>
          </div>

          {/* Quick Search line */}
          <div className="flex items-center gap-2 pt-1 border-t border-[#27272a]/60">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
              <input
                type="text"
                placeholder="Pesquisar por nº de documento, cliente, NIF, artigo, motivo ou operador..."
                value={filters.searchQuery}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full bg-[#18181b] border border-[#27272a] rounded pl-8 pr-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {filters.searchQuery && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="px-2 py-1 bg-[#27272a] hover:bg-[#333338] text-slate-300 rounded text-xs transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tabular Content View */}
      <div className="flex-1 p-2.5 overflow-y-auto">
        {activeMainCategory === 'SALES' && (
          <ReportsSalesSection
            subCategory={activeSubCategory as any}
            documents={documents}
            products={products}
            customers={customers}
            cashShifts={cashShifts}
            users={users}
            currency={tenant.currency || 'Kz'}
            filters={filters}
          />
        )}

        {activeMainCategory === 'FINANCIAL' && (
          <ReportsFinancialSection
            subCategory={activeSubCategory as any}
            receipts={receipts}
            disbursements={disbursements}
            cashMovements={cashMovements}
            bankAccounts={bankAccounts}
            customers={customers}
            suppliers={suppliers}
            purchases={purchases}
            documents={documents}
            currency={tenant.currency || 'Kz'}
            filters={filters}
          />
        )}

        {activeMainCategory === 'STOCK' && (
          <ReportsStockSection
            subCategory={activeSubCategory as any}
            products={products}
            stockMovements={stockMovements}
            currency={tenant.currency || 'Kz'}
            filters={filters}
          />
        )}

        {activeMainCategory === 'FISCAL' && (
          <ReportsFiscalSection
            subCategory={activeSubCategory as any}
            documents={documents}
            series={series}
            tenant={tenant}
            currency={tenant.currency || 'Kz'}
            filters={filters}
          />
        )}

        {activeMainCategory === 'AUDIT' && (
          <ReportsAuditSection
            subCategory={activeSubCategory as any}
            auditRecords={auditRecords}
            systemEvents={systemEvents}
            users={users}
            filters={filters}
          />
        )}
      </div>
    </div>
  );
};
