import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  Building,
  AlertTriangle,
  ReceiptText,
  Building2,
  ChevronDown,
  BarChart2,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { TenantProfile, Document, Product } from '../types/pulse';

interface QuickSummaryPopoverProps {
  tenant: TenantProfile;
  documents?: Document[];
  cashBalance?: number;
  bankBalance?: number;
  receivables?: number;
  payables?: number;
  products?: Product[];
  currency?: string;
  onFilterLowStock?: () => void;
  onFilterReceivables?: () => void;
}

export const QuickSummaryPopover: React.FC<QuickSummaryPopoverProps> = ({
  tenant,
  documents = [],
  cashBalance = 0,
  bankBalance = 0,
  receivables = 0,
  payables = 0,
  products = [],
  currency = 'Kz',
  onFilterLowStock,
  onFilterReceivables,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const today = new Date().toISOString().split('T')[0];
  const todayDocs = safeDocs.filter((d) => d && d.date === today && d.status === 'POSTED');
  const todaySalesTotal = todayDocs.reduce((acc, d) => acc + (d.grossAmount || 0), 0);

  const lowStockProducts = safeProducts.filter(
    (p) => p && p.type !== 'service' && (p.currentStock ?? 0) <= (p.stockMin ?? 0)
  );

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const segmentLabels: Record<string, string> = {
    RESTAURANT_BAR: 'Restauração & Bar',
    PHARMACY: 'Farmácia & Saúde',
    RETAIL_CLOTHING: 'Retalho & Vestuário',
    SERVICES: 'Prestação de Serviços',
    GENERAL_RETAIL: 'Comércio Geral',
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* MINIMALIST CURRENCY PILL TRIGGER [Kz] */}
      <button
        id="btn-quick-summary-dropdown"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Resumo Financeiro & Moeda (${currency})`}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border h-7 ${
          isOpen
            ? 'bg-[#27272a] border-emerald-500/60 text-emerald-300 shadow-sm'
            : 'bg-[#18181b] hover:bg-[#202024] border-[#27272a] text-slate-300 hover:text-white'
        }`}
      >
        <span className="text-[11px] text-emerald-400">{currency}</span>
        {todaySalesTotal > 0 && (
          <span className="hidden xl:inline text-[10px] text-slate-400 font-normal border-l border-[#27272a] pl-1">
            {todaySalesTotal.toLocaleString()}
          </span>
        )}
      </button>

      {/* DROPDOWN MENU (CALENDAR/POPOVER STYLE) */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-88 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl shadow-black/80 py-2.5 z-50 animate-fadeIn text-xs font-sans text-slate-200">
          
          {/* HEADER: ESTABLISHMENT INFO */}
          <div className="px-3.5 pb-2.5 border-b border-slate-800">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs leading-tight">
                    {tenant.tradeName}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {segmentLabels[tenant.businessSegment || 'RESTAURANT_BAR'] || tenant.businessSegment}
                  </p>
                </div>
              </div>

              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                NIF: {tenant.taxId}
              </span>
            </div>

            {tenant.address && (
              <p className="text-[10px] text-slate-500 mt-1 truncate">
                {tenant.address}
              </p>
            )}
          </div>

          {/* METRICS EXPANDED LIST */}
          <div className="p-2 space-y-1 font-mono">
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Métricas Diárias do Terminal
            </div>

            {/* 1. Vendas Hoje */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:bg-slate-950 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 font-medium block leading-none">Vendas Hoje</span>
                  <span className="text-[9px] text-slate-500 font-sans">{todayDocs.length} documentos emitidos</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 block leading-none">
                  {todaySalesTotal.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* 2. Caixa Balcão */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:bg-slate-950 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 font-medium block leading-none">Caixa Balcão</span>
                  <span className="text-[9px] text-slate-500 font-sans">Numerário disponível</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-sky-400 block leading-none">
                  {cashBalance.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* 3. Bancos & TPA */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:bg-slate-950 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Building className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 font-medium block leading-none">Bancos & TPA</span>
                  <span className="text-[9px] text-slate-500 font-sans">Contas & Terminais POS</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-300 block leading-none">
                  {bankBalance.toLocaleString()} {currency}
                </span>
              </div>
            </div>

            {/* 4. A Receber */}
            <div
              onClick={() => {
                if (onFilterReceivables) {
                  onFilterReceivables();
                  setIsOpen(false);
                }
              }}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-950 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <ReceiptText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 font-medium block leading-none group-hover:text-amber-300">
                    A Receber (Clientes)
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Saldos de conta corrente</span>
                </div>
              </div>
              <div className="text-right flex items-center gap-1">
                <span className="text-xs font-bold text-amber-400 block leading-none">
                  {receivables.toLocaleString()} {currency}
                </span>
                <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* 5. Stock em Alerta */}
            <div
              onClick={() => {
                if (onFilterLowStock) {
                  onFilterLowStock();
                  setIsOpen(false);
                }
              }}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-950 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${lowStockProducts.length > 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[11px] text-slate-300 font-medium block leading-none group-hover:text-rose-300">
                    Stock Crítico
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans">Artigos em rutura / mínimo</span>
                </div>
              </div>
              <div className="text-right flex items-center gap-1">
                <span className={`text-xs font-bold block leading-none ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {lowStockProducts.length} artigos
                </span>
                <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

          </div>

          {/* FOOTER */}
          <div className="px-3.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              AGT Certificado
            </span>
            <span>Kernel v2.0</span>
          </div>

        </div>
      )}
    </div>
  );
};
