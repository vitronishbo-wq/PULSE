import React, { useState } from 'react';
import {
  FileCode,
  Shield,
  Activity,
  History,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
} from 'lucide-react';
import { TenantProfile } from '../../types/pulse';
import { SecurityAuditEvent, ConfigurationChange } from '../../types/platform';
import { initialSecurityEvents, initialConfigChanges } from '../../data/platformSeedData';
import { Orchestrator } from '../../engines/Orchestrator';

interface AdminAuditSectionProps {
  leafId: string;
  tenants: TenantProfile[];
}

export const AdminAuditSection: React.FC<AdminAuditSectionProps> = ({ leafId, tenants }) => {
  const orchestrator = Orchestrator.getInstance();
  const [securityEvents] = useState<SecurityAuditEvent[]>(initialSecurityEvents);
  const [configChanges] = useState<ConfigurationChange[]>(initialConfigChanges);
  const [selectedEventPayload, setSelectedEventPayload] = useState<any | null>(null);

  const eventBusLogs = orchestrator.getEventBusLogs();

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: EVENTBUS STREAM LOG */}
      {leafId === 'eventbus_stream' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" />
                Stream de Eventos do EventBus do Kernel (ULCE)
              </h3>
              <p className="text-[11px] text-slate-400">Barramento assíncrono de eventos com publicação e subscrição</p>
            </div>
            <span className="text-xs text-sky-400 font-mono bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
              {eventBusLogs.length} eventos capturados
            </span>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold sticky top-0">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Tipo de Evento</th>
                  <th className="py-2.5 px-3">Tenant ID</th>
                  <th className="py-2.5 px-3">Emitido Por</th>
                  <th className="py-2.5 px-3 text-right">Inspecionar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {eventBusLogs.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-[#252526]">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-sky-300">{ev.eventType}</td>
                    <td className="py-2 px-3 text-slate-300 font-mono">{ev.tenantId || 'GLOBAL'}</td>
                    <td className="py-2 px-3 text-slate-400 text-[10px]">{ev.source || 'ULCE_KERNEL'}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedEventPayload(ev)}
                        className="px-2 py-0.5 bg-[#1e1e1e] hover:bg-[#007acc] text-slate-300 hover:text-white rounded border border-[#333333] text-[10px] transition-colors"
                      >
                        Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedEventPayload && (
            <div className="bg-[#141414] border border-[#2d2d2d] rounded p-3 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-bold">
                <span>PAYLOAD DO EVENTO: {selectedEventPayload.type}</span>
                <button
                  onClick={() => setSelectedEventPayload(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕ Fechar
                </button>
              </div>
              <pre className="p-2 bg-[#0a0a0a] text-emerald-400 text-[10px] rounded border border-[#222222] font-mono overflow-x-auto max-h-[160px]">
                {JSON.stringify(selectedEventPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 2. LEAF: IMMUTABLE AUDIT LEDGER */}
      {leafId === 'immutable_ledger' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Ledger Imutável de Auditoria Fiscal & Transacional
              </h3>
              <p className="text-[11px] text-slate-400">
                Cadeia de blocos com hashing SHA-256 e prova de não-adulteração
              </p>
            </div>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CADEIA ÍNTEGRA
            </span>
          </div>

          <div className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-lg p-3.5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-[#252526] border border-[#3c3c3c] p-2.5 rounded">
                <div className="text-[10px] text-slate-400 uppercase">Blocos Minerados</div>
                <div className="text-sm font-bold text-white mt-0.5">8,491 Blocos</div>
              </div>
              <div className="bg-[#252526] border border-[#3c3c3c] p-2.5 rounded">
                <div className="text-[10px] text-slate-400 uppercase">Hash Último Bloco</div>
                <div className="text-[11px] font-mono text-emerald-400 mt-0.5 truncate">
                  0000a98f12c...449102b
                </div>
              </div>
              <div className="bg-[#252526] border border-[#3c3c3c] p-2.5 rounded">
                <div className="text-[10px] text-slate-400 uppercase">Tempo de Retenção Legal</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">10 Anos (AGT Art. 129º)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAF: SECURITY EVENTS */}
      {leafId === 'security_events' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Registo de Eventos de Segurança & Acessos Críticos
              </h3>
              <p className="text-[11px] text-slate-400">MFA, tentativas de login, personificações e rotação de chaves</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Severidade</th>
                  <th className="py-2.5 px-3">Fonte</th>
                  <th className="py-2.5 px-3">Descrição do Evento</th>
                  <th className="py-2.5 px-3">Ator / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {securityEvents.map((sec) => (
                  <tr key={sec.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{sec.timestamp}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          sec.severity === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {sec.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-sky-400 font-mono font-bold">{sec.source}</td>
                    <td className="py-2.5 px-3 text-slate-200">{sec.description}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                      <div>{sec.actor}</div>
                      <div className="text-[9px] text-slate-500">{sec.ipAddress}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LEAF: CONFIGURATION CHANGES */}
      {leafId === 'config_changes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Histórico de Alterações de Configuração da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Rastreamento de modificações em taxas, flags e regras</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Entidade</th>
                  <th className="py-2.5 px-3">Modificado Por</th>
                  <th className="py-2.5 px-3">Valor Anterior &rarr; Novo Valor</th>
                  <th className="py-2.5 px-3">Justificação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {configChanges.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{cfg.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{cfg.entity}</td>
                    <td className="py-2.5 px-3 text-sky-400">{cfg.changedBy}</td>
                    <td className="py-2.5 px-3 text-[11px]">
                      <div className="text-rose-400 font-mono line-through">{cfg.previousValue}</div>
                      <div className="text-emerald-400 font-mono">{cfg.newValue}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[10px]">{cfg.changeReason}</td>
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
