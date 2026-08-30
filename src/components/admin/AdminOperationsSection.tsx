import React, { useState } from 'react';
import {
  Users,
  Shield,
  Monitor,
  Lock,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Plus,
} from 'lucide-react';
import {
  PlatformAdminUser,
  AdminSession,
  PlatformSecurityPolicy,
} from '../../types/platform';
import {
  initialPlatformAdmins,
  initialAdminSessions,
  initialSecurityPolicies,
} from '../../data/platformSeedData';

interface AdminOperationsSectionProps {
  leafId: string;
}

export const AdminOperationsSection: React.FC<AdminOperationsSectionProps> = ({ leafId }) => {
  const [admins, setAdmins] = useState<PlatformAdminUser[]>(initialPlatformAdmins);
  const [sessions, setSessions] = useState<AdminSession[]>(initialAdminSessions);
  const [policies, setPolicies] = useState<PlatformSecurityPolicy[]>(initialSecurityPolicies);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
  };

  const handleTogglePolicy = (policyId: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId
          ? { ...p, value: typeof p.value === 'boolean' ? !p.value : p.value }
          : p
      )
    );
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: ADMINISTRATORS */}
      {leafId === 'administrators' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Diretório de Administradores da Plataforma (SaaS Ops)
              </h3>
              <p className="text-[11px] text-slate-400">Operadores com acesso ao nível de infraestrutura e governança</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Administrador</th>
                  <th className="py-2.5 px-3">E-mail Corporativo</th>
                  <th className="py-2.5 px-3">Papel RBAC</th>
                  <th className="py-2.5 px-3">MFA</th>
                  <th className="py-2.5 px-3">Último Acesso</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-bold text-white">{adm.name}</td>
                    <td className="py-2.5 px-3 text-sky-300">{adm.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#1e1e1e] border border-[#333333] text-amber-300 font-mono">
                        {adm.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {adm.mfaEnabled ? (
                        <span className="text-emerald-400 font-bold text-[10px]">ATIVADO</span>
                      ) : (
                        <span className="text-rose-400 text-[10px]">PENDENTE</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">{adm.lastLogin}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        {adm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LEAF: SESSIONS */}
      {leafId === 'sessions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Monitor className="w-4 h-4 text-sky-400" />
                Sessões Administrativas Ativas
              </h3>
              <p className="text-[11px] text-slate-400">Controlo de tokens de sessão ativos e revogação remota</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">ID Sessão</th>
                  <th className="py-2.5 px-3">Administrador</th>
                  <th className="py-2.5 px-3">Endereço IP & Localização</th>
                  <th className="py-2.5 px-3">Dispositivo / Agente</th>
                  <th className="py-2.5 px-3">Início / Expiração</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{sess.id}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{sess.adminName}</div>
                      <div className="text-[10px] text-slate-400">{sess.adminEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <div>{sess.ipAddress}</div>
                      <div className="text-[10px] text-slate-500">{sess.location}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">{sess.userAgent}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-[10px]">
                      <div>{sess.loggedInAt}</div>
                      <div className="text-[9px] text-slate-500">Expira: {sess.expiresAt}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {sess.isCurrent ? (
                        <span className="text-emerald-400 font-bold text-[10px]">SESSÃO ATUAL</span>
                      ) : (
                        <button
                          onClick={() => handleRevokeSession(sess.id)}
                          className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LEAF: SECURITY POLICIES */}
      {leafId === 'security_policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Políticas Globais de Segurança da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Diretivas de conformidade, cifragem e isolamento multi-tenant</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {policies.map((pol) => (
              <div
                key={pol.id}
                className="bg-[#252526] border border-[#3c3c3c] p-3 rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    {pol.ruleName}
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e1e1e] text-slate-400">
                      {pol.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{pol.description}</div>
                </div>

                <div className="flex items-center gap-2">
                  {typeof pol.value === 'boolean' ? (
                    <button
                      onClick={() => handleTogglePolicy(pol.id)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        pol.value
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1e1e1e] text-slate-400 border border-[#333333]'
                      }`}
                    >
                      {pol.value ? 'HABILITADO' : 'DESABILITADO'}
                    </button>
                  ) : (
                    <span className="px-2 py-1 bg-[#1e1e1e] border border-[#333333] rounded text-white font-bold font-mono">
                      {pol.value} min
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LEAF: SYSTEM SETTINGS */}
      {leafId === 'system_settings' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                Configurações do Ambiente de Execução da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Parâmetros de kernel, modo de manutenção e logs</p>
            </div>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-4 max-w-xl">
            <div className="flex items-center justify-between border-b border-[#333333] pb-3">
              <div>
                <div className="font-bold text-white text-xs">Modo de Manutenção Global</div>
                <div className="text-[10px] text-slate-400">
                  Suspende novas transações no POS com aviso amigável ao utilizador
                </div>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  maintenanceMode
                    ? 'bg-rose-600 text-white'
                    : 'bg-[#1e1e1e] text-slate-400 border border-[#333333]'
                }`}
              >
                {maintenanceMode ? 'ATIVO' : 'DESLIGADO'}
              </button>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Versão do Kernel ULCE:</span>
                <span className="font-mono text-emerald-400 font-bold">v2.0.26-RELEASE</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Frequência de Backup Contínuo:</span>
                <span className="font-mono text-white">A cada 15 minutos (AES-256)</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Nível de Log Operacional:</span>
                <span className="font-mono text-amber-400">INFO / AUDIT_STRICT</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
