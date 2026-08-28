import React, { useState } from 'react';
import {
  Pill,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Filter,
  FileCheck2,
  CheckCircle2,
  Package,
  Layers,
} from 'lucide-react';
import { Product, TenantProfile, User } from '../types/pulse';

interface PharmacyBatchViewProps {
  tenant: TenantProfile;
  products: Product[];
  currentUser: User;
  currency: string;
}

export const PharmacyBatchView: React.FC<PharmacyBatchViewProps> = ({
  tenant,
  products = [],
  currentUser,
  currency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRx, setFilterRx] = useState<'ALL' | 'RX_ONLY' | 'OTC_ONLY'>('ALL');

  const safeProducts = Array.isArray(products) ? products : [];

  // Filter products for pharmacy items
  const pharmaProducts = safeProducts.filter((p) => {
    if (!p) return false;
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.batchNumber && p.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.activeSubstance && p.activeSubstance.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterRx === 'RX_ONLY') return matchesSearch && (p.prescriptionRequired || false);
    if (filterRx === 'OTC_ONLY') return matchesSearch && !p.prescriptionRequired;
    return matchesSearch;
  });

  const getDaysUntilExpiry = (expiryStr?: string) => {
    if (!expiryStr) return 999;
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div id="pharmacy-batch-module" className="space-y-4 font-mono">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm">
              Módulo Farmacêutico: Lotes, Validades & Dispensação (Rx)
            </div>
            <div className="text-[11px] text-slate-400">
              {tenant.tradeName} • Rastreabilidade Infarmed/ARMED • Controlo Sanitário
            </div>
          </div>
        </div>

        {/* Prescription Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setFilterRx('ALL')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              filterRx === 'ALL' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setFilterRx('RX_ONLY')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              filterRx === 'RX_ONLY' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚠️ Receita Obrigatória (Rx)
          </button>
          <button
            onClick={() => setFilterRx('OTC_ONLY')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              filterRx === 'OTC_ONLY' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dispensação Livre (OTC)
          </button>
        </div>
      </div>

      {/* SEARCH AND KPI BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por Nome, Princípio Ativo ou Nº de Lote..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-teal-500"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Lotes Monitorizados</div>
            <div className="text-sm font-black text-teal-400">
              {products.filter((p) => p.batchNumber).length} Lotes Ativos
            </div>
          </div>
          <ShieldCheck className="w-6 h-6 text-teal-500/40" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">Alertas de Validade</div>
            <div className="text-sm font-black text-amber-400">0 em Quarentena</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-500/40" />
        </div>
      </div>

      {/* PHARMACEUTICAL PRODUCTS & BATCH TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 border-b border-slate-800 flex justify-between items-center text-xs">
          <span className="font-bold text-white uppercase tracking-wider">
            Inventário Clínico & Rastreabilidade de Lotes
          </span>
          <span className="text-[10px] text-slate-400">
            {pharmaProducts.length} referências listadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-3">Medicamento / Artigo</th>
                <th className="p-3">Princípio Ativo</th>
                <th className="p-3">Nº de Lote</th>
                <th className="p-3">Data Validade</th>
                <th className="p-3 text-center">Tipo Dispensação</th>
                <th className="p-3 text-right">Stock Físico</th>
                <th className="p-3 text-right">PVP Unitário</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {pharmaProducts.map((p) => {
                const daysLeft = getDaysUntilExpiry(p.expiryDate);
                const isExpiringSoon = daysLeft < 90;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">REF: {p.code}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-teal-300 font-medium">
                        {p.activePrinciple || '—'}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.batchNumber ? (
                        <span className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 font-bold">
                          {p.batchNumber}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono">Sem Lote</span>
                      )}
                    </td>
                    <td className="p-3">
                      {p.expiryDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span
                            className={
                              isExpiringSoon
                                ? 'text-rose-400 font-bold'
                                : 'text-slate-300 font-mono'
                            }
                          >
                            {p.expiryDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {p.requiresPrescription ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-950/60 border border-rose-500/40 text-rose-300 uppercase">
                          ⚠️ Receita (Rx)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-950/60 border border-teal-500/40 text-teal-300 uppercase">
                          Livre (OTC)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={p.stock <= p.minStock ? 'text-rose-400' : 'text-slate-200'}>
                        {p.stock} un
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                      {p.price.toLocaleString()} {currency}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => alert(`Ficha Técnica & Rastreabilidade de Lote: ${p.name} [Lote: ${p.batchNumber || 'N/A'}]`)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] font-medium border border-slate-700 transition-colors"
                      >
                        Auditoria
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
