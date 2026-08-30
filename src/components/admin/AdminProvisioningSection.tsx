import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Check,
  X,
  Play,
  FileCode,
  UtensilsCrossed,
  Pill,
  Shirt,
  Briefcase,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import { BusinessSegment, TenantProfile, User } from '../../types/pulse';
import { ProfileChangeRequest, ProvisioningPipelineStep } from '../../types/platform';
import { initialProfileChangeRequests } from '../../data/platformSeedData';
import { ProfileEngine } from '../../engines/ProfileEngine';
import { Orchestrator } from '../../engines/Orchestrator';

interface AdminProvisioningSectionProps {
  leafId: string;
  tenants: TenantProfile[];
  currentUser: User;
  onOpenProvisioningWizard: (segment: BusinessSegment) => void;
  onRefresh: () => void;
}

export const AdminProvisioningSection: React.FC<AdminProvisioningSectionProps> = ({
  leafId,
  tenants,
  currentUser,
  onOpenProvisioningWizard,
  onRefresh,
}) => {
  const profileEngine = ProfileEngine.getInstance();
  const orchestrator = Orchestrator.getInstance();

  const [changeRequests, setChangeRequests] = useState<ProfileChangeRequest[]>(initialProfileChangeRequests);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  const [pipelineSteps, setPipelineSteps] = useState<ProvisioningPipelineStep[]>([
    { id: 'STEP-01', name: 'Alocação de Schema & Tenant ID', status: 'DONE', details: 'UUID v4 gerado e isolado em RLS.' },
    { id: 'STEP-02', name: 'Geração de Par de Chaves RSA-SHA1 AGT', status: 'DONE', details: 'Chave privada 2048-bit cifrada com AES-GCM.' },
    { id: 'STEP-03', name: 'Inicialização de Séries Fiscais (FT 2026/A, FR 2026/A)', status: 'DONE', details: 'Séries comunicadas e ativas.' },
    { id: 'STEP-04', name: 'Injeção de Módulos Padrão do Segmento', status: 'DONE', details: 'Módulos base carregados no feature flag matrix.' },
    { id: 'STEP-05', name: 'Geração de Credenciais do Super-Admin Local', status: 'DONE', details: 'PIN de acesso gerado e hash bcrypt persistido.' },
  ]);

  const profiles = profileEngine.getAllProfiles();

  const handleApproveChangeRequest = (req: ProfileChangeRequest) => {
    orchestrator.setTenantBusinessSegment(req.tenantId, req.requestedSegment, currentUser);
    setChangeRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'APPROVED',
              reviewedBy: currentUser.email,
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              notes: 'Aprovado administrativamente pelo Control Plane.',
            }
          : r
      )
    );
    onRefresh();
  };

  const handleRejectChangeRequest = (req: ProfileChangeRequest) => {
    setChangeRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'REJECTED',
              reviewedBy: currentUser.email,
              reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              notes: 'Rejeitado por incompatibilidade ou pendência financeira.',
            }
          : r
      )
    );
  };

  const getSegmentIcon = (seg: BusinessSegment) => {
    switch (seg) {
      case 'RESTAURANT_BAR':
        return <UtensilsCrossed className="w-4 h-4 text-amber-400" />;
      case 'PHARMACY':
        return <Pill className="w-4 h-4 text-rose-400" />;
      case 'RETAIL_CLOTHING':
        return <Shirt className="w-4 h-4 text-sky-400" />;
      case 'SERVICES':
        return <Briefcase className="w-4 h-4 text-purple-400" />;
      case 'GENERAL_RETAIL':
      default:
        return <ShoppingCart className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: BUSINESS PROFILES TABLE */}
      {leafId === 'business_profiles' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Matriz de Perfis & Segmentos de Negócio
              </h3>
              <p className="text-[11px] text-slate-400">Definições verticais, módulos base e precificação</p>
            </div>
            <button
              onClick={() => onOpenProvisioningWizard('RESTAURANT_BAR')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold transition-colors flex items-center gap-1 text-[11px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              + Novo Tenant
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((prof) => (
              <div
                key={prof.code}
                className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3.5 space-y-2.5 hover:border-[#007acc] transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSegmentIcon(prof.code)}
                      <span className="font-bold text-white text-xs">{prof.name}</span>
                    </div>
                    <span className="text-amber-400 font-bold text-xs">{prof.basePrice.toLocaleString()} Kz/mês</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{prof.description}</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#333333]">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Módulos Padrão (Incluídos):</div>
                  <div className="flex flex-wrap gap-1">
                    {prof.defaultModules.map((m) => (
                      <span
                        key={m}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-[#1e1e1e] border border-[#333333] text-emerald-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-400 font-semibold uppercase pt-1">Opcionais (Add-ons):</div>
                  <div className="flex flex-wrap gap-1">
                    {prof.optionalModules.map((m) => (
                      <span
                        key={m}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-[#1e1e1e] border border-[#333333] text-slate-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onOpenProvisioningWizard(prof.code)}
                  className="w-full mt-2 py-1.5 bg-[#1e1e1e] hover:bg-[#007acc] text-slate-300 hover:text-white rounded border border-[#3c3c3c] text-[10px] font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Provisionar neste Perfil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LEAF: NEW TENANT ACQUISITION FLOW */}
      {leafId === 'acquisition_flow' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Pipeline de Aquisição & Provisionamento Instantâneo
              </h3>
              <p className="text-[11px] text-slate-400">Fluxo automatizado em menos de 10 segundos</p>
            </div>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-[#1e1e1e] border border-[#333333] p-3 rounded">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">1. Seleção Perfil</div>
                <div className="text-xs font-bold text-white mt-1">Vertical & Módulos</div>
              </div>
              <div className="bg-[#1e1e1e] border border-[#333333] p-3 rounded">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">2. Identificação</div>
                <div className="text-xs font-bold text-white mt-1">Nome, NIF & País</div>
              </div>
              <div className="bg-[#1e1e1e] border border-[#333333] p-3 rounded">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">3. Faturação EMIS</div>
                <div className="text-xs font-bold text-amber-400 mt-1">Entidade 00145</div>
              </div>
              <div className="bg-[#1e1e1e] border border-[#333333] p-3 rounded">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">4. Ativação Kernel</div>
                <div className="text-xs font-bold text-emerald-400 mt-1">RSA Keygen & Series</div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => onOpenProvisioningWizard('RESTAURANT_BAR')}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs flex items-center gap-2 shadow-lg transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Lançar Assistente de Provisionamento (Wizard)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAF: PROVISIONING STATUS */}
      {leafId === 'provisioning_status' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                Etapas de Execução do Pipeline de Provisionamento
              </h3>
              <p className="text-[11px] text-slate-400">Verificação atómica de integridade na inicialização</p>
            </div>
          </div>

          <div className="space-y-2">
            {pipelineSteps.map((step, idx) => (
              <div
                key={step.id}
                className="bg-[#252526] border border-[#3c3c3c] p-3 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs">{step.name}</div>
                    <div className="text-[10px] text-slate-400">{step.details}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LEAF: PROFILE CHANGE REQUESTS */}
      {leafId === 'profile_change_requests' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-amber-400" />
                Solicitações de Mudança de Perfil / Segmento
              </h3>
              <p className="text-[11px] text-slate-400">
                Governança centralizada: a transição de segmento exige validação no Control Plane
              </p>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
              {changeRequests.filter((r) => r.status === 'PENDING').length} Pendentes
            </span>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Protocolo</th>
                  <th className="py-2.5 px-3">Organização</th>
                  <th className="py-2.5 px-3">Segmento Atual &rarr; Solicitado</th>
                  <th className="py-2.5 px-3">Motivo / Justificação</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ação do Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {changeRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{req.id}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{req.tenantName}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-slate-400">{req.currentSegment}</span>
                        <ArrowRight className="w-3 h-3 text-amber-400" />
                        <span className="text-emerald-400 font-bold">{req.requestedSegment}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      <div>{req.reason}</div>
                      {req.notes && <div className="text-[10px] text-slate-400 italic mt-0.5">{req.notes}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveChangeRequest(req)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleRejectChangeRequest(req)}
                            className="px-2 py-1 bg-[#2d2d2d] hover:bg-rose-600 text-slate-300 hover:text-white rounded text-[10px] transition-colors"
                          >
                            Rejeitar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Concluído</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
