import React, { useState } from 'react';
import {
  Activity,
  BarChart2,
  HardDrive,
  Cpu,
  Server,
  Zap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { TenantProfile } from '../../types/pulse';
import { TenantUsageRecord, ModuleUsageTelemetry } from '../../types/platform';
import { initialTenantUsage, initialModuleUsage } from '../../data/platformSeedData';

interface AdminTelemetrySectionProps {
  leafId: string;
  tenants: TenantProfile[];
}

export const AdminTelemetrySection: React.FC<AdminTelemetrySectionProps> = ({ leafId, tenants }) => {
  const [tenantUsage] = useState<TenantUsageRecord[]>(initialTenantUsage);
  const [moduleUsage] = useState<ModuleUsageTelemetry[]>(initialModuleUsage);

  const totalVolume = tenantUsage.reduce((acc, t) => acc + t.totalVolumeKz, 0);
  const totalSales = tenantUsage.reduce((acc, t) => acc + t.totalSalesCount, 0);
  const totalStorage = tenantUsage.reduce((acc, t) => acc + t.storageUsedMb, 0);
  const totalApiCalls = tenantUsage.reduce((acc, t) => acc + t.apiCallsCount, 0);

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: PLATFORM USAGE & TELEMETRY */}
      {(leafId === 'platform_usage' || leafId === 'transaction_volume') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Telemetria Global de Uso da Plataforma (ULCE Metrics)
              </h3>
              <p className="text-[11px] text-slate-400">Consumo agregado de recursos, transações e tráfego</p>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
              STREAM: REAL-TIME (1.2s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Volume Bruto Transacionado</div>
              <div className="text-lg font-bold text-amber-400 font-mono">{totalVolume.toLocaleString()} Kz</div>
              <div className="text-[10px] text-slate-400">+18.4% vs mês anterior</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Total de Vendas / Faturas</div>
              <div className="text-lg font-bold text-white font-mono">{totalSales.toLocaleString()} docs</div>
              <div className="text-[10px] text-slate-400">Taxa de erro AGT: 0.00%</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Armazenamento Alocado</div>
              <div className="text-lg font-bold text-sky-400 font-mono">{totalStorage.toFixed(1)} MB</div>
              <div className="text-[10px] text-slate-400">IndexedDB + Cloud Sync</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Chamadas API Kernel</div>
              <div className="text-lg font-bold text-purple-400 font-mono">{totalApiCalls.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400">Latência média: 12.4 ms</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEAF: TENANT USAGE */}
      {leafId === 'tenant_usage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                Métricas de Consumo por Organização (Tenant)
              </h3>
              <p className="text-[11px] text-slate-400">Uso de armazenamento, utilizadores ativos e faturas emitidas</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Organização</th>
                  <th className="py-2.5 px-3">Segmento</th>
                  <th className="py-2.5 px-3">Vendas Emitidas</th>
                  <th className="py-2.5 px-3">Volume Bruto</th>
                  <th className="py-2.5 px-3">Utilizadores Ativos</th>
                  <th className="py-2.5 px-3">Storage (MB)</th>
                  <th className="py-2.5 px-3">Última Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {tenantUsage.map((u) => (
                  <tr key={u.tenantId} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-bold text-white">{u.tenantName}</td>
                    <td className="py-2.5 px-3 text-sky-300">{u.segment}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{u.totalSalesCount}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold font-mono">
                      {u.totalVolumeKz.toLocaleString()} Kz
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{u.activeUsers}</td>
                    <td className="py-2.5 px-3 text-sky-400 font-mono">{u.storageUsedMb} MB</td>
                    <td className="py-2.5 px-3 text-emerald-400 text-[11px]">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LEAF: MODULE USAGE */}
      {leafId === 'module_usage' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Telemetria & Performance de Execução dos Módulos
              </h3>
              <p className="text-[11px] text-slate-400">Invocações, latência média e taxa de falhas</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Módulo</th>
                  <th className="py-2.5 px-3">Tenants Ativos</th>
                  <th className="py-2.5 px-3">Total Invocações</th>
                  <th className="py-2.5 px-3">Latência Média</th>
                  <th className="py-2.5 px-3">Taxa de Falha</th>
                  <th className="py-2.5 px-3">Saúde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {moduleUsage.map((m) => (
                  <tr key={m.moduleId} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.moduleId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{m.activeTenantsCount}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{m.totalInvocations.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-sky-400 font-mono">{m.avgLatencyMs} ms</td>
                    <td className="py-2.5 px-3 font-mono">
                      {m.failureRate === 0 ? (
                        <span className="text-emerald-400">0.00%</span>
                      ) : (
                        <span className="text-amber-400">{(m.failureRate * 100).toFixed(2)}%</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                        OPERACIONAL
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
