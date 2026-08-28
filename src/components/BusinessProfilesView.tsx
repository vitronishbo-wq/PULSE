import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Plus,
  ArrowRight,
  Shield,
  Building2,
  Sparkles,
  Search,
} from 'lucide-react';
import { BusinessSegment, BusinessProfileDefinition, ModuleId } from '../types/pulse';
import { Orchestrator } from '../engines/Orchestrator';

interface BusinessProfilesViewProps {
  onStartProvisioning: (segment: BusinessSegment) => void;
  onFilterTenantsBySegment?: (segment: BusinessSegment) => void;
}

export const BusinessProfilesView: React.FC<BusinessProfilesViewProps> = ({
  onStartProvisioning,
  onFilterTenantsBySegment,
}) => {
  const orchestrator = Orchestrator.getInstance();
  const profileEngine = orchestrator.profileEngine;

  const profiles = profileEngine.getAllProfiles();
  const [selectedProfileCode, setSelectedProfileCode] = useState<BusinessSegment>('SUPERMARKET');
  const [search, setSearch] = useState('');

  const selectedProfile = profileEngine.getProfile(selectedProfileCode);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex overflow-hidden font-mono text-xs text-slate-200">
      
      {/* CENTRAL DENSE TABLE WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#2d2d2d] bg-[#1e1e1e] overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-3 border-b border-[#2d2d2d] flex items-center justify-between gap-3 bg-[#252526]">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white uppercase text-xs tracking-wider">
                BUSINESS PROFILES (MATRIZ DE ADESÃO)
              </h3>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Definição arquitetural no momento da aquisição / provisioning do Tenant
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
              <input
                type="text"
                placeholder="Filtrar perfis..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#1e1e1e] border border-[#3c3c3c] rounded pl-7 pr-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-[#007acc] w-36 sm:w-48"
              />
            </div>
            <button
              onClick={() => onStartProvisioning(selectedProfileCode)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Tenant</span>
            </button>
          </div>
        </div>

        {/* Compact Dense Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2d2d2d] bg-[#1a1a1a] text-slate-400 text-[10px] uppercase font-bold sticky top-0 z-10">
                <th className="py-2.5 px-3">CODE</th>
                <th className="py-2.5 px-3">NAME</th>
                <th className="py-2.5 px-3 text-right">TENANTS</th>
                <th className="py-2.5 px-3 text-right">BASE (KZ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d2d]">
              {filteredProfiles.map((p) => {
                const isSelected = selectedProfileCode === p.code;
                return (
                  <tr
                    key={p.code}
                    onClick={() => setSelectedProfileCode(p.code)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#04395e] text-white font-bold'
                        : 'hover:bg-[#252526] text-slate-300'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono">
                      <span className={`${isSelected ? 'text-sky-300' : 'text-slate-400'}`}>
                        {p.code}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold">{p.name}</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${isSelected ? 'bg-sky-900/60 text-sky-200' : 'bg-[#252526] text-slate-400'}`}>
                        {p.tenantsCount}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <span className={`${isSelected ? 'text-emerald-300 font-bold' : 'text-emerald-400'}`}>
                        {p.basePrice.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dense Table Footer Info */}
        <div className="p-2 border-t border-[#2d2d2d] bg-[#1a1a1a] flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>PULSE PROFILE ENGINE: {profiles.length} PERFIS REGISTADOS</span>
          <span>TOTAL TENANTS EM PRODUÇÃO: {profiles.reduce((a, b) => a + b.tenantsCount, 0)}</span>
        </div>
      </div>

      {/* LATERAL DENSE INSPECTOR (SEM TROCAR DE PÁGINA) */}
      <div className="w-80 sm:w-96 bg-[#181818] flex flex-col shrink-0 overflow-y-auto border-l border-[#2d2d2d]">
        
        {/* Inspector Header */}
        <div className="p-3 border-b border-[#2d2d2d] bg-[#222222]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PROFILE INSPECTOR
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
          <h2 className="text-sm font-bold text-white mt-1 uppercase tracking-wide">
            {selectedProfile.name}
          </h2>
          <span className="text-[10px] text-sky-400 font-mono block mt-0.5">
            {selectedProfile.code}
          </span>
        </div>

        <div className="p-4 space-y-5 flex-1 text-xs">
          
          {/* DEFAULTS SECTION */}
          <div>
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                DEFAULTS (INCLUÍDOS NO BASE)
              </span>
              <span className="text-[9px] font-mono text-slate-500">MANDATÓRIOS</span>
            </div>

            <div className="space-y-1.5 font-mono">
              {selectedProfile.defaultModules.map((modId) => {
                const def = profileEngine.getModule(modId);
                return (
                  <div
                    key={modId}
                    className="flex items-center justify-between py-1 px-2 rounded bg-[#202020] border border-[#2d2d2d]"
                  >
                    <span className="text-slate-300 font-medium truncate pr-2">
                      {modId}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                      ON
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OPTIONALS SECTION */}
          <div>
            <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-1 mb-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                OPTIONAL (ADD-ONS DISPONÍVEIS)
              </span>
              <span className="text-[9px] font-mono text-slate-500">SELECIONÁVEIS</span>
            </div>

            <div className="space-y-1.5 font-mono">
              {selectedProfile.optionalModules.map((modId) => {
                const def = profileEngine.getModule(modId);
                return (
                  <div
                    key={modId}
                    className="flex items-center justify-between py-1 px-2 rounded bg-[#202020] border border-[#2d2d2d]"
                  >
                    <div className="truncate pr-2">
                      <span className="text-slate-400 block truncate">{modId}</span>
                      {def?.price ? (
                        <span className="text-[9px] text-slate-500 font-mono">
                          +{def.price.toLocaleString()} Kz
                        </span>
                      ) : null}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-[#282828] px-1.5 py-0.2 rounded border border-[#333] shrink-0">
                      OFF
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BASE PRICE BOX */}
          <div className="bg-[#202020] border border-[#333333] rounded p-3 font-mono space-y-1">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              BASE PRICE (MENSAL)
            </span>
            <div className="text-base font-bold text-emerald-400">
              {selectedProfile.basePrice.toLocaleString()} Kz
            </div>
            <span className="text-[9px] text-slate-500 block">
              Inclui todos os módulos Defaults + Certificação Fiscal AGT 2026
            </span>
          </div>

          {/* ACTIONS */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => onStartProvisioning(selectedProfile.code)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contratar & Provisionar Tenant</span>
            </button>

            {onFilterTenantsBySegment && (
              <button
                onClick={() => onFilterTenantsBySegment(selectedProfile.code)}
                className="w-full bg-[#252526] hover:bg-[#2d2d2d] text-slate-300 font-bold py-1.5 px-3 rounded text-[11px] transition-colors border border-[#3c3c3c] flex items-center justify-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Ver {selectedProfile.tenantsCount} Tenants Activos</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
