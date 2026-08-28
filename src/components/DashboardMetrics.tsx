import React from 'react';
import {
  TrendingUp,
  Wallet,
  Building,
  AlertTriangle,
  ReceiptText,
} from 'lucide-react';
import { Document, Product } from '../types/pulse';

interface DashboardMetricsProps {
  documents: Document[];
  cashBalance: number;
  bankBalance: number;
  receivables: number;
  payables: number;
  products: Product[];
  eventsCount: number;
  currency: string;
  onFilterLowStock: () => void;
  onFilterReceivables: () => void;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  documents = [],
  cashBalance = 0,
  bankBalance = 0,
  receivables = 0,
  products = [],
  currency = 'Kz',
  onFilterLowStock,
  onFilterReceivables,
}) => {
  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const today = new Date().toISOString().split('T')[0];
  const todayDocs = safeDocs.filter((d) => d && d.date === today && d.status === 'POSTED');
  const todaySalesTotal = todayDocs.reduce((acc, d) => acc + (d.grossAmount || 0), 0);

  const lowStockProducts = safeProducts.filter(
    (p) => p && p.type !== 'service' && (p.currentStock ?? 0) <= (p.stockMin ?? 0)
  );

  return (
    <div
      id="pulse-dashboard-metrics"
      className="bg-slate-900/80 border border-slate-800/80 rounded-lg px-4 py-2 flex flex-wrap items-center justify-between gap-4 text-xs font-mono"
    >
      {/* Vendas Hoje */}
      <div className="flex items-center gap-2.5">
        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Vendas Hoje</span>
          <span className="text-white font-bold">
            {todaySalesTotal.toLocaleString()} <span className="text-emerald-400 text-[10px] font-normal">{currency}</span>
          </span>
          <span className="text-[10px] text-slate-500 ml-1.5">({todayDocs.length} docs)</span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-800 hidden sm:block" />

      {/* Caixa */}
      <div className="flex items-center gap-2.5">
        <Wallet className="w-4 h-4 text-blue-400 shrink-0" />
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Caixa Balcão</span>
          <span className="text-white font-bold">
            {cashBalance.toLocaleString()} <span className="text-blue-400 text-[10px] font-normal">{currency}</span>
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-800 hidden sm:block" />

      {/* Bancos / TPA */}
      <div className="flex items-center gap-2.5">
        <Building className="w-4 h-4 text-indigo-400 shrink-0" />
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bancos & TPA</span>
          <span className="text-white font-bold">
            {bankBalance.toLocaleString()} <span className="text-indigo-400 text-[10px] font-normal">{currency}</span>
          </span>
        </div>
      </div>

      <div className="h-6 w-px bg-slate-800 hidden md:block" />

      {/* A Receber (Clientes) */}
      <button
        onClick={onFilterReceivables}
        className="flex items-center gap-2.5 text-left hover:bg-slate-800/60 px-2 py-1 rounded transition-colors"
      >
        <ReceiptText className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">A Receber</span>
          <span className="text-amber-400 font-bold">
            {receivables.toLocaleString()} <span className="text-slate-400 text-[10px] font-normal">{currency}</span>
          </span>
        </div>
      </button>

      <div className="h-6 w-px bg-slate-800 hidden md:block" />

      {/* Stock em Alerta */}
      <button
        onClick={onFilterLowStock}
        className="flex items-center gap-2.5 text-left hover:bg-slate-800/60 px-2 py-1 rounded transition-colors"
      >
        <AlertTriangle className={`w-4 h-4 shrink-0 ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stock Mínimo</span>
          <span className={`font-bold ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {lowStockProducts.length} artigos
          </span>
        </div>
      </button>
    </div>
  );
};
