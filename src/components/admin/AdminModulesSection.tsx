import React, { useState } from 'react';
import {
  Server,
  Layers,
  Check,
  X,
  AlertTriangle,
  FileCode,
  Tag,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { TenantProfile, TenantFeatureFlags, User, ModuleId } from '../../types/pulse';
import { PlatformModuleCatalogItem } from '../../types/platform';
import { initialModuleCatalog } from '../../data/platformSeedData';
import { Orchestrator } from '../../engines/Orchestrator';

interface AdminModulesSectionProps {
  leafId: string;
  tenants: TenantProfile[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminModulesSection: React.FC<AdminModulesSectionProps> = ({
  leafId,
  tenants,
  currentUser,
  onRefresh,
}) => {
  const orchestrator = Orchestrator.getInstance();
  const [moduleCatalog, setModuleCatalog] = useState<PlatformModuleCatalogItem[]>(initialModuleCatalog);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');
  const [selectedModuleForDep, setSelectedModuleForDep] = useState<ModuleId>('KDS_TABLES');

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  const handleToggleFlag = (tenantId: string, flagKey: keyof TenantFeatureFlags, currentValue: boolean) => {
    orchestrator.updateTenantFeatureFlags(tenantId, { [flagKey]: !currentValue }, currentUser);
    onRefresh();
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'CORE':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'OPERATIONS':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'FINANCE':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'HARDWARE':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/30';
      case 'COMPLIANCE':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const targetModule = moduleCatalog.find((m) => m.id === selectedModuleForDep) || moduleCatalog[0];

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: FEATURE FLAGS MATRIX */}
      {leafId === 'feature_flags' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Matriz Global de Feature Flags por Tenant
              </h3>
              <p className="text-[11px] text-slate-400">Ativação granular de capacidades no nível do runtime</p>
            </div>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-[#252526] border border-[#3c3c3c] rounded px-2.5 py-1 text-white text-[11px] focus:outline-none"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tradeName}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-3">
            <div className="text-[11px] text-slate-300 font-bold">
              Organização: <span className="text-white">{selectedTenant.tradeName}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {[
                { key: 'enableOfflineSync', label: 'Modo Offline & Sync Local', desc: 'Resiliência a quebras de internet' },
                { key: 'enableAIAssistant', label: 'Assistente Inteligente (Gemini)', desc: 'Comandos de voz e NLP' },
                { key: 'enableAutoPrint', label: 'Impressão Automática de Talão', desc: 'Disparo direto para impressora térmica' },
                { key: 'enableTableManagement', label: 'Gestão de Mesas & Comandas', desc: 'Salas, transferências e KDS' },
                { key: 'enablePharmacyFeatures', label: 'Módulo Farmácia & FEFO', desc: 'Lotes, validades e prescrições' },
                { key: 'enableSizeColorMatrix', label: 'Grade de Tamanho & Cor', desc: 'Matriz bidimensional de moda' },
                { key: 'enableServicesRetention', label: 'Retenção na Fonte 6.5%', desc: 'Serviços e honorários' },
                { key: 'enableMultiCurrency', label: 'Multimoeda (USD / EUR)', desc: 'Conversão automática pelo BNA' },
                { key: 'enableBiometrics', label: 'Autenticação Biométrica', desc: 'Leitor de impressão digital' },
              ].map((flag) => {
                const isEnabled = !!(selectedTenant.featureFlags as any)?.[flag.key];
                return (
                  <div
                    key={flag.key}
                    onClick={() => handleToggleFlag(selectedTenant.id, flag.key as any, isEnabled)}
                    className={`p-3 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                      isEnabled
                        ? 'bg-[#007acc]/10 border-[#007acc] text-white'
                        : 'bg-[#1e1e1e] border-[#333333] text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{flag.label}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{flag.desc}</div>
                    </div>
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                        isEnabled ? 'bg-[#007acc] text-white' : 'bg-[#2d2d2d] text-slate-500'
                      }`}
                    >
                      {isEnabled ? '✓' : '✗'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. LEAF: MODULE CATALOG */}
      {leafId === 'module_catalog' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Catálogo Global de Módulos da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Definição canónica de módulos, categorias e dependências</p>
            </div>
            <span className="text-xs text-slate-300 font-mono bg-[#252526] px-2 py-0.5 rounded border border-[#3c3c3c]">
              Total: {moduleCatalog.length} módulos
            </span>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Código ID</th>
                  <th className="py-2.5 px-3">Nome do Módulo</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Preço Mensal</th>
                  <th className="py-2.5 px-3">Dependências Obrigatórias</th>
                  <th className="py-2.5 px-3">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {moduleCatalog.map((m) => (
                  <tr key={m.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{m.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.description}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getCategoryColor(m.category)}`}>
                        {m.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {m.price === 0 ? (
                        <span className="text-emerald-400 font-bold">Base (0 Kz)</span>
                      ) : (
                        <span className="text-amber-400 font-bold">{m.price.toLocaleString()} Kz/mês</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {m.requiredDependencies.length === 0 ? (
                        <span className="text-slate-500">Nenhuma</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {m.requiredDependencies.map((dep) => (
                            <span
                              key={dep}
                              className="px-1.5 py-0.2 rounded text-[9px] bg-[#1e1e1e] border border-[#333333] text-rose-300"
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] text-slate-400">
                        {m.isCore ? 'CORE OBRIGATÓRIO' : 'ADD-ON OPCIONAL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LEAF: MODULE DEPENDENCIES */}
      {leafId === 'module_dependencies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-rose-400" />
                Validador & Grafo de Dependências de Módulos
              </h3>
              <p className="text-[11px] text-slate-400">
                Garante que um módulo só é ativado se os seus pré-requisitos estiverem presentes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-bold text-slate-300 mb-1">Selecionar Módulo para Inspecionar:</div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {moduleCatalog.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModuleForDep(m.id)}
                    className={`w-full text-left p-2 rounded flex items-center justify-between text-xs transition-colors ${
                      selectedModuleForDep === m.id
                        ? 'bg-[#007acc] text-white font-bold'
                        : 'bg-[#1e1e1e] text-slate-300 hover:bg-[#2d2d2d]'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="font-mono text-[10px] opacity-80">{m.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-3">
              <div className="border-b border-[#333333] pb-2">
                <div className="text-[10px] text-slate-400 uppercase">Módulo Analisado</div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  {targetModule.name}
                  <span className="text-xs text-sky-400 font-mono">({targetModule.id})</span>
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-400 font-semibold mb-1">Pré-Requisitos Obrigatórios:</div>
                {targetModule.requiredDependencies.length === 0 ? (
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded text-[11px] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Módulo autónomo. Pode ser ativado independentemente.</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {targetModule.requiredDependencies.map((depId) => {
                      const depDef = moduleCatalog.find((x) => x.id === depId);
                      return (
                        <div
                          key={depId}
                          className="p-2 bg-[#1e1e1e] border border-[#333333] rounded flex items-center justify-between text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            <span className="font-bold text-white">{depDef?.name || depId}</span>
                            <span className="text-slate-400 font-mono">({depId})</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold">OBRIGATÓRIO</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEAF: MODULE PRICING */}
      {leafId === 'module_pricing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                Precificação & Modelagem de Margem de Módulos
              </h3>
              <p className="text-[11px] text-slate-400">Tabela de preços de add-ons opcionais</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {moduleCatalog
              .filter((m) => m.price > 0)
              .map((m) => (
                <div key={m.id} className="bg-[#252526] border border-[#3c3c3c] rounded p-3 space-y-2">
                  <div className="font-bold text-white text-xs">{m.name}</div>
                  <div className="text-amber-400 font-bold text-sm">+{m.price.toLocaleString()} Kz/mês</div>
                  <div className="text-[10px] text-slate-400">{m.description}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
