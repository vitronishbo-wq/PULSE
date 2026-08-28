import React, { useState } from 'react';
import { Search, Menu, Shield } from 'lucide-react';
import { User, TenantProfile, Document, Product } from '../types/pulse';
import { VoiceCommandButton } from './VoiceCommandButton';
import { QuickSummaryPopover } from './QuickSummaryPopover';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  tenant: TenantProfile;
  isOnline: boolean;
  onToggleOnline: () => void;
  pendingSyncCount: number;
  onOpenNewOperation: () => void;
  onOpenAdmin: () => void;
  onOpenCommandCenter?: () => void;
  onOpenMenuDrawer: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  // Financial & inventory data for quick metrics
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

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  tenant,
  isOnline,
  onToggleOnline,
  pendingSyncCount,
  onOpenAdmin,
  onOpenCommandCenter,
  onOpenMenuDrawer,
  searchQuery,
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
  return (
    <header
      id="pulse-ultraminimal-header"
      className="bg-[#121215] border-b border-[#27272a] text-white sticky top-0 z-40 px-2.5 sm:px-4 py-1.5 shadow-sm font-sans"
    >
      <div className="w-full flex items-center justify-between gap-2">
        {/* 1. [EMPRESA] - NOME DA EMPRESA ULTRAMINIMALISTA */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="font-bold text-xs sm:text-sm text-slate-100 tracking-tight truncate max-w-[110px] sm:max-w-[200px] font-sans">
            {tenant.tradeName || tenant.name || 'PULSE'}
          </span>
        </div>

        {/* 2. [ 🔍 ──────── ] - BARRA DE BUSCA COMPACTA (Ctrl+K / /) */}
        <div className="flex-1 max-w-xs sm:max-w-md mx-1 sm:mx-2 min-w-0">
          <div
            id="header-search-bar"
            onClick={onOpenCommandCenter}
            className="relative cursor-pointer group flex items-center"
          >
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <input
              type="text"
              readOnly
              value={searchQuery}
              onClick={onOpenCommandCenter}
              placeholder="Procurar ou comando..."
              className="w-full bg-[#18181b] group-hover:bg-[#202024] border border-[#27272a] group-hover:border-emerald-500/50 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all cursor-pointer font-sans h-7"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] bg-[#121215] border border-[#3f3f46] text-slate-400 px-1 py-0.2 rounded font-mono hidden sm:inline-block">
              /
            </span>
          </div>
        </div>

        {/* 3. [ 🎙 ] [ Kz ] [ · ] [ ☰ ] - AÇÕES ULTRACOMPACTAS */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* [ 🎙 ] Botão de Voz */}
          <VoiceCommandButton
            onTranscriptReady={(transcript) => {
              if (onOpenCommandCenter) {
                onOpenCommandCenter();
              }
            }}
          />

          {/* [ Kz ] Resumo Financeiro Retrátil / Moeda */}
          <QuickSummaryPopover
            tenant={tenant}
            documents={documents}
            cashBalance={cashBalance}
            bankBalance={bankBalance}
            receivables={receivables}
            payables={payables}
            products={products}
            currency={currency}
            onFilterLowStock={onFilterLowStock}
            onFilterReceivables={onFilterReceivables}
          />

          {/* [ · ] Indicador de Rede Minimalista (● verde / ● vermelho) */}
          <button
            id="btn-network-status-dot"
            onClick={onToggleOnline}
            title={
              isOnline
                ? 'Rede: Online (Sincronizado)'
                : `Rede: Offline (${pendingSyncCount} operações pendentes)`
            }
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#18181b] transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full transition-all ${
                isOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
          </button>

          {/* [ 🛡 ] Entrada ao Painel Administrativo Ultraminimalista */}
          <button
            id="btn-header-admin-control"
            onClick={onOpenAdmin}
            title="Administração"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#18181b] text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>

          {/* [ ☰ ] Menu Único para Funções Secundárias */}
          <button
            id="btn-open-unified-menu"
            onClick={onOpenMenuDrawer}
            title="Menu Geral"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#18181b] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
