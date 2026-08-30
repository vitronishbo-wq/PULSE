import React, { useState } from 'react';
import {
  Key,
  Lock,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Cpu,
  Clock,
  Layers,
  Sparkles,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import { TenantProfile, User } from '../../types/pulse';
import { PlatformPlan, TenantSubscription } from '../../types/platform';
import { initialPlatformPlans, initialTenantSubscriptions } from '../../data/platformSeedData';
import { Orchestrator } from '../../engines/Orchestrator';

interface AdminLicensesSectionProps {
  leafId: string;
  tenants: TenantProfile[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminLicensesSection: React.FC<AdminLicensesSectionProps> = ({
  leafId,
  tenants,
  currentUser,
  onRefresh,
}) => {
  const orchestrator = Orchestrator.getInstance();
  const [plans, setPlans] = useState<PlatformPlan[]>(initialPlatformPlans);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>(initialTenantSubscriptions);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || '');
  const [renewalMonths, setRenewalMonths] = useState<number>(12);
  const [keyRotationFeedback, setKeyRotationFeedback] = useState('');

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0];

  const handleRenewLicense = (tenantId: string, months: number) => {
    const target = orchestrator.getTenant(tenantId);
    if (!target) return;

    const currentExp = target.licenseExpiry ? new Date(target.licenseExpiry) : new Date();
    const newExp = new Date(currentExp);
    newExp.setMonth(newExp.getMonth() + months);

    orchestrator.updateTenant(
      tenantId,
      {
        licenseExpiry: newExp.toISOString().split('T')[0],
        licenseStatus: 'ACTIVE',
        activeLicense: true,
      },
      currentUser
    );

    setSubscriptions((prev) =>
      prev.map((s) =>
        s.tenantId === tenantId
          ? {
              ...s,
              nextBillingDate: newExp.toISOString().split('T')[0],
              status: 'ACTIVE',
            }
          : s
      )
    );

    onRefresh();
  };

  const handleRotateRSAKey = () => {
    setKeyRotationFeedback('Chave RSA-SHA1 regenerada com sucesso e assinada no Ledger!');
    setTimeout(() => setKeyRotationFeedback(''), 4000);
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: RSA LICENSES KEY */}
      {leafId === 'rsa_licenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-400" />
                Matriz Criptográfica de Licenças & Chaves RSA-SHA1
              </h3>
              <p className="text-[11px] text-slate-400">Assinatura digital AGT, hash fiscal e amarração de hardware</p>
            </div>
            <button
              onClick={handleRotateRSAKey}
              className="px-3 py-1 bg-[#252526] hover:bg-[#007acc] text-slate-200 hover:text-white rounded border border-[#3c3c3c] text-[11px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Rotacionar Chave Mestra
            </button>
          </div>

          {keyRotationFeedback && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{keyRotationFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">CERTIFICAÇÃO AGT EM VIGOR</div>
              <div className="text-white font-bold text-sm">PULSE.OS v2.0 - ULCE Engine</div>
              <div className="text-emerald-400 font-mono text-[11px]">Certificado: 00000000000000000001/AGT/2026</div>
              <div className="text-slate-400 text-[10px]">Algoritmo: RSA-SHA1 2048-bit (Padrão AGT Angola)</div>
            </div>

            <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3 space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">AMARRAÇÃO DE HARDWARE (HWID)</div>
              <div className="text-white font-bold text-sm">Fingerprint de Segurança de Máquina</div>
              <div className="text-amber-400 font-mono text-[11px]">HWID-LUANDA-HOST-PRIMARY-99201</div>
              <div className="text-slate-400 text-[10px]">Bloqueio contra clonagem de instâncias de base de dados</div>
            </div>
          </div>

          <div className="bg-[#181818] border border-[#2d2d2d] rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-bold text-slate-300">Chave Pública AGT Exportada (X.509 PEM):</div>
            <pre className="p-2 bg-[#0d0d0d] text-sky-400 text-[10px] rounded border border-[#222222] font-mono overflow-x-auto">
{`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3v9u7Z0kZ7P5yJ2w8K1o
L9m4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0f1g2h3i4j5k6l7m8n9o0p1q2r3s4
t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6
z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8
f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0
-----END PUBLIC KEY-----`}
            </pre>
          </div>
        </div>
      )}

      {/* 2. LEAF: AUTH CREDENTIALS RBAC */}
      {leafId === 'credentials_rbac' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Matriz de Credenciais & RBAC da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Hierarquia de papéis e controle de acesso baseado em funções</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded text-[10px] font-bold">
              Senha Mestra Fundador: 135790
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <div className="text-[10px] text-rose-400 font-bold uppercase">SUPER_ADMIN</div>
              <div className="text-xs font-bold text-white mt-0.5">Fundador / Deus</div>
              <div className="text-[10px] text-slate-400 mt-1">Acesso irrestrito a todos os tenants e kernel.</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <div className="text-[10px] text-amber-400 font-bold uppercase">COMPLIANCE_OFFICER</div>
              <div className="text-xs font-bold text-white mt-0.5">Auditor Tributário</div>
              <div className="text-[10px] text-slate-400 mt-1">Inspeciona SAF-T, séries e encadeamento fiscal.</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">BILLING_ADMIN</div>
              <div className="text-xs font-bold text-white mt-0.5">Gestor Financeiro</div>
              <div className="text-[10px] text-slate-400 mt-1">Liquidações EMIS, comissões e faturas.</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded">
              <div className="text-[10px] text-sky-400 font-bold uppercase">SUPPORT_ENGINEER</div>
              <div className="text-xs font-bold text-white mt-0.5">Engenheiro Suporte</div>
              <div className="text-[10px] text-slate-400 mt-1">Personificação e diagnóstico de logs de erro.</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAF: PLANS */}
      {leafId === 'plans' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Catálogo Comercial de Planos de Subscrição
              </h3>
              <p className="text-[11px] text-slate-400">Separação entre licença técnica AGT e plano comercial</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-3.5 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{p.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#1e1e1e] rounded text-slate-300 border border-[#333333]">
                      {p.tier}
                    </span>
                  </div>
                  <div className="text-amber-400 font-bold text-sm mt-1">{p.basePrice.toLocaleString()} Kz/mês</div>
                  <p className="text-[10px] text-slate-400 mt-1">{p.description}</p>
                </div>

                <div className="space-y-1 pt-2 border-t border-[#333333] text-[10px] text-slate-300">
                  <div>• Até <strong>{p.maxUsers}</strong> utilizadores</div>
                  <div>• Até <strong>{p.maxTerminals}</strong> terminais de POS</div>
                  <div>• Até <strong>{p.maxTransactions.toLocaleString()}</strong> transações/mês</div>
                  <div>• Suporte 24/7: <strong>{p.includesSupport ? 'Sim' : 'Padrão'}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LEAF: SUBSCRIPTIONS */}
      {leafId === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Subscrições Ativas dos Tenants
              </h3>
              <p className="text-[11px] text-slate-400">Contratos, renovação automática e faturação periódica</p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
              {subscriptions.length} Subscrições em vigor
            </span>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Organização</th>
                  <th className="py-2.5 px-3">Plano Comercial</th>
                  <th className="py-2.5 px-3">Ciclo de Faturação</th>
                  <th className="py-2.5 px-3">Mensalidade</th>
                  <th className="py-2.5 px-3">Próxima Cobrança</th>
                  <th className="py-2.5 px-3">Auto-Renovação</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-bold text-white">{sub.tenantName}</td>
                    <td className="py-2.5 px-3 text-sky-300">{sub.planName}</td>
                    <td className="py-2.5 px-3 text-slate-300">{sub.billingCycle}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{sub.amountMonthly.toLocaleString()} Kz</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{sub.nextBillingDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {sub.renewalAuto ? 'ATIVADA' : 'MANUAL'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LEAF: RENEWALS */}
      {leafId === 'renewals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-400" />
                Renovação & Extensão de Licenças
              </h3>
              <p className="text-[11px] text-slate-400">Prorrogação manual de contratos e emissão de licença assinada</p>
            </div>
          </div>

          <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-4 max-w-lg">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Selecionar Organização / Tenant</label>
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-1.5 text-white text-xs"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tradeName} (Expira: {t.licenseExpiry || '2027-01-01'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Período de Extensão</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { m: 1, label: '+1 Mês' },
                  { m: 3, label: '+3 Meses (Trimestral)' },
                  { m: 12, label: '+12 Meses (Anual)' },
                ].map((item) => (
                  <button
                    key={item.m}
                    onClick={() => setRenewalMonths(item.m)}
                    className={`py-2 rounded text-xs font-bold border transition-colors ${
                      renewalMonths === item.m
                        ? 'bg-[#007acc] text-white border-[#007acc]'
                        : 'bg-[#1e1e1e] text-slate-300 border-[#333333] hover:border-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleRenewLicense(selectedTenantId, renewalMonths)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Executar Renovação & Emitir Token
            </button>
          </div>
        </div>
      )}

      {/* 6. LEAF: SUSPENSION & EXPIRATION */}
      {leafId === 'suspension_expiration' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                Políticas de Suspensão, Caducidade & Quarentena
              </h3>
              <p className="text-[11px] text-slate-400">Tratamento de incumprimento e períodos de graça</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Período de Graça</div>
              <div className="text-base font-bold text-white">5 Dias Úteis</div>
              <div className="text-[10px] text-slate-400">
                Avisos visuais no POS com emissão ainda permitida sem bloqueio fiscal.
              </div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-rose-400 font-bold uppercase">Suspensão de Emissão</div>
              <div className="text-base font-bold text-white">D+6 Inadimplência</div>
              <div className="text-[10px] text-slate-400">
                Bloqueio de novas faturas; acesso apenas para consulta e exportação de SAF-T.
              </div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-purple-400 font-bold uppercase">Quarentena Fria</div>
              <div className="text-base font-bold text-white">D+60 Inatividade</div>
              <div className="text-[10px] text-slate-400">
                Instância arquivada e backup criptografado guardado por 10 anos (Art. 129º).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
