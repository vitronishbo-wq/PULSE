import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Search,
  Eye,
  ShieldAlert,
  ArrowRightLeft,
  KeyRound,
  FileCode,
  Zap,
  Activity,
  History,
  Ban,
  Play,
  RotateCcw,
} from 'lucide-react';
import { TenantProfile, User, BusinessSegment } from '../../types/pulse';
import { TenantLifecycleStatus, TenantImpersonationLog } from '../../types/platform';
import { Orchestrator } from '../../engines/Orchestrator';

interface AdminTenantsSectionProps {
  leafId: string;
  tenants: TenantProfile[];
  activeTenantId: string;
  currentUser: User;
  onTenantSwitch: (tenantId: string) => void;
  onImpersonate: (tenant: TenantProfile) => void;
  onRefresh: () => void;
}

export const AdminTenantsSection: React.FC<AdminTenantsSectionProps> = ({
  leafId,
  tenants,
  activeTenantId,
  currentUser,
  onTenantSwitch,
  onImpersonate,
  onRefresh,
}) => {
  const orchestrator = Orchestrator.getInstance();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenantId);
  const [statusChangeReason, setStatusChangeReason] = useState('');

  const [impersonationLogs, setImpersonationLogs] = useState<TenantImpersonationLog[]>([
    {
      id: 'IMP-2026-0091',
      adminUser: 'platform.admin@pulse-os.global',
      targetTenantId: 'tenant-restaurante-01',
      targetTenantName: 'Restaurante O Pescador, Lda',
      reason: 'Auditoria de integridade da série de faturas FT 2026/A',
      startedAt: '2026-08-29 14:10:02',
      endedAt: '2026-08-29 14:35:18',
      active: false,
    },
    {
      id: 'IMP-2026-0090',
      adminUser: 'support.kernel@pulse-os.global',
      targetTenantId: 'tenant-farmacia-01',
      targetTenantName: 'Farmácia Central de Luanda',
      reason: 'Diagnóstico de sincronização de lote FEFO expirado',
      startedAt: '2026-08-28 11:00:15',
      endedAt: '2026-08-28 11:22:40',
      active: false,
    },
  ]);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  const filteredTenants = tenants.filter(
    (t) =>
      t.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateLifecycleStatus = (newStatus: TenantLifecycleStatus) => {
    if (!selectedTenant) return;
    orchestrator.updateTenant(
      selectedTenant.id,
      {
        licenseStatus: newStatus === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED',
        activeLicense: newStatus === 'ACTIVE',
      },
      currentUser
    );
    setStatusChangeReason('');
    onRefresh();
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: TENANTS DIRECTORY */}
      {leafId === 'tenants_directory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Diretório Global de Tenants (Organizações)
              </h3>
              <p className="text-[11px] text-slate-400">Instâncias empresariais isoladas sob o ULCE Kernel</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Pesquisar por Nome, NIF ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#252526] border border-[#3c3c3c] rounded pl-8 pr-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#007acc]"
                />
              </div>
              <span className="text-[11px] text-slate-400 font-mono bg-[#252526] px-2.5 py-1 rounded border border-[#3c3c3c] shrink-0">
                {filteredTenants.length} / {tenants.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#2d2d2d] rounded">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Organização & NIF</th>
                  <th className="py-2.5 px-3">Segmento Operacional</th>
                  <th className="py-2.5 px-3">País / Moeda</th>
                  <th className="py-2.5 px-3">Certificação Fiscal</th>
                  <th className="py-2.5 px-3">Estado Ciclo</th>
                  <th className="py-2.5 px-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {filteredTenants.map((t) => {
                  const isActive = t.id === activeTenantId;
                  const isSuspended = t.licenseStatus === 'SUSPENDED';

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-[#252526] transition-colors ${
                        isActive ? 'bg-[#007acc]/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Tenant Atual" />
                          )}
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {t.tradeName}
                              {isActive && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                                  ATIVO
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              NIF: <span className="text-slate-300 font-mono">{t.taxId}</span> • ID: {t.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1e1e1e] border border-[#3c3c3c] text-sky-300">
                          {t.businessSegment || 'GENERAL_RETAIL'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {t.country || 'AO'} • <span className="text-amber-400 font-bold">{t.currency || 'Kz'}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                        {t.fiscalCertNumber ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {t.fiscalCertNumber.slice(0, 14)}...
                          </span>
                        ) : (
                          <span className="text-amber-400">Pendente AGT</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {t.licenseStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              onClick={() => onTenantSwitch(t.id)}
                              className="px-2 py-1 bg-[#252526] hover:bg-[#007acc] text-slate-300 hover:text-white rounded border border-[#3c3c3c] transition-colors text-[10px]"
                              title="Alternar para este Tenant"
                            >
                              Alternar
                            </button>
                          )}
                          <button
                            onClick={() => onImpersonate(t)}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] flex items-center gap-1"
                            title="Personificar como Administrador com Justificação"
                          >
                            <KeyRound className="w-3 h-3" />
                            Personificar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LEAF: ACTIVE TENANT CONTEXT */}
      {leafId === 'active_context' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Contexto em Tempo Real do Tenant Ativo
              </h3>
              <p className="text-[11px] text-slate-400">Estado carregado no ULCE Kernel Runtime</p>
            </div>
            <span className="text-emerald-400 text-[11px] font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              STATE: MOUNTED & SYNCHRONIZED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Organização Ativa</div>
              <div className="text-sm font-bold text-white">{selectedTenant.tradeName}</div>
              <div className="text-[11px] text-slate-300">NIF: {selectedTenant.taxId}</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Segmento & Perfil</div>
              <div className="text-sm font-bold text-sky-400">{selectedTenant.businessSegment}</div>
              <div className="text-[11px] text-slate-300">Moeda: {selectedTenant.currency || 'Kz'}</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Licença & Validade</div>
              <div className="text-sm font-bold text-emerald-400">{selectedTenant.licenseStatus || 'ACTIVE'}</div>
              <div className="text-[11px] text-slate-300">Expira: {selectedTenant.licenseExpiry || '2027-01-01'}</div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#2d2d2d] rounded p-3">
            <div className="text-[11px] text-slate-400 font-bold mb-2 flex items-center justify-between">
              <span>RAW RUNTIME OBJECT (tenant.context.json):</span>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedTenant, null, 2))}
                className="text-[#007acc] hover:underline text-[10px]"
              >
                Copiar JSON
              </button>
            </div>
            <pre className="text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-[360px] p-2 bg-[#0c0c0c] rounded border border-[#222222]">
              {JSON.stringify(selectedTenant, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* 3. LEAF: TENANT PROFILE */}
      {leafId === 'tenant_profile' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                Perfil Cadastral & Configurações da Empresa
              </h3>
              <p className="text-[11px] text-slate-400">Edição de parâmetros comerciais e identificação fiscal</p>
            </div>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-[#252526] border border-[#3c3c3c] rounded px-2.5 py-1 text-white text-[11px] focus:outline-none"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tradeName} ({t.taxId})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Denominação Social</label>
                <input
                  type="text"
                  value={selectedTenant.name}
                  readOnly
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nome Comercial / Marca</label>
                <input
                  type="text"
                  value={selectedTenant.tradeName}
                  readOnly
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Número de Identificação Fiscal (NIF)</label>
                <input
                  type="text"
                  value={selectedTenant.taxId}
                  readOnly
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-amber-400 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Endereço Principal / Província</label>
                <input
                  type="text"
                  value={`${selectedTenant.address || 'Luanda'}, ${selectedTenant.city || 'Angola'}`}
                  readOnly
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={selectedTenant.email || 'contato@empresa.ao'}
                  readOnly
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nº Certificado AGT</label>
                <input
                  type="text"
                  value={selectedTenant.fiscalCertNumber || '00000000000000000001/AGT/2026'}
                  readOnly
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-2.5 py-1.5 text-emerald-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LEAF: TENANT STATUS (LIFECYCLE) */}
      {leafId === 'tenant_status' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Máquina de Estados de Ciclo de Vida do Tenant
              </h3>
              <p className="text-[11px] text-slate-400">
                Transições: PENDING &rarr; PROVISIONING &rarr; ACTIVE &rarr; SUSPENDED &rarr; EXPIRED &rarr; ARCHIVED
              </p>
            </div>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-[#252526] border border-[#3c3c3c] rounded px-2.5 py-1 text-white text-[11px] focus:outline-none"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.tradeName} ({t.licenseStatus || 'ACTIVE'})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#333333] pb-3">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Organização Selecionada</div>
                <div className="text-sm font-bold text-white">{selectedTenant.tradeName}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase">Estado Atual</div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  {selectedTenant.licenseStatus || 'ACTIVE'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300">Alterar Estado Operacional:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'ARCHIVED'] as TenantLifecycleStatus[]).map((st) => {
                  const isCurrent = (selectedTenant.licenseStatus || 'ACTIVE') === st;
                  return (
                    <button
                      key={st}
                      onClick={() => handleUpdateLifecycleStatus(st)}
                      disabled={isCurrent}
                      className={`p-2.5 rounded border text-left transition-all ${
                        isCurrent
                          ? 'bg-[#04395e] border-[#007acc] text-white font-bold cursor-default'
                          : 'bg-[#1e1e1e] border-[#333333] text-slate-400 hover:text-white hover:border-slate-500'
                      }`}
                    >
                      <div className="font-bold text-xs">{st}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {st === 'ACTIVE' && 'Acesso normal e emissão permitida'}
                        {st === 'SUSPENDED' && 'Bloqueio de emissão de faturas'}
                        {st === 'EXPIRED' && 'Assinatura caducada / modo leitura'}
                        {st === 'ARCHIVED' && 'Instância desativada / arquivo frio'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEAF: TENANT IMPERSONATION */}
      {leafId === 'tenant_impersonation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Histórico & Auditoria de Personificação (Impersonation)
              </h3>
              <p className="text-[11px] text-slate-400">
                Acessos administrativos delegados com gravação imutável de justificação
              </p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">ID Sessão</th>
                  <th className="py-2.5 px-3">Administrador</th>
                  <th className="py-2.5 px-3">Organização Alvo</th>
                  <th className="py-2.5 px-3">Motivo / Justificação</th>
                  <th className="py-2.5 px-3">Início</th>
                  <th className="py-2.5 px-3">Fim / Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {impersonationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{log.id}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{log.adminUser}</td>
                    <td className="py-2.5 px-3 text-amber-300">{log.targetTenantName}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{log.reason}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">{log.startedAt}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {log.endedAt || 'ENCERRADO'}
                      </span>
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
