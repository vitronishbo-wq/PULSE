import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Search,
  Code,
  Terminal,
  Zap,
  Filter,
} from 'lucide-react';
import { SystemEvent, AuditRecord } from '../types/pulse';

interface EventBusLiveViewProps {
  events: SystemEvent[];
  auditRecords: AuditRecord[];
}

export const EventBusLiveView: React.FC<EventBusLiveViewProps> = ({
  events,
  auditRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'AUDIT'>('EVENTS');
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(events[0] || null);
  const [search, setSearch] = useState('');

  const filteredEvents = events.filter((e) => {
    return (
      !search ||
      e.eventType.toLowerCase().includes(search.toLowerCase()) ||
      e.userName.toLowerCase().includes(search.toLowerCase()) ||
      e.eventId.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div id="pulse-eventbus-view" className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
            EVENT BUS KERNEL & AUDIT LEDGER
          </h2>
          <p className="text-xs text-slate-400">
            "One Input → One Event → Infinite Automatic Consequences" (Pipeline Reativo e Imutável)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Audit Imutável Ativo</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'EVENTS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Fluxo de Eventos ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AUDIT_LEDGER Imutável ({auditRecords.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por evento, utilizador..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Live Event Stream & Inspector */}
      {activeTab === 'EVENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Events Stream List */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-lg space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.eventId === evt.eventId;
              return (
                <div
                  key={evt.eventId}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md'
                      : 'bg-slate-950/70 border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-mono font-bold text-white">{evt.eventType}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Actor: <strong className="text-slate-300">{evt.userName}</strong>
                    </span>
                    <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {evt.source} • v{evt.version}
                    </span>
                  </div>

                  {evt.sideEffects && evt.sideEffects.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400/90 font-medium">
                      ⚡ {evt.sideEffects.length} Consequências Automáticas Disparadas
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right: Event Deep Inspector */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
            {selectedEvent ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-white font-mono">{selectedEvent.eventType}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">ID: {selectedEvent.eventId}</p>
                  </div>
                  <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Versão: {selectedEvent.version}
                  </span>
                </div>

                {/* Automatic Consequences List */}
                {selectedEvent.sideEffects && selectedEvent.sideEffects.length > 0 && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 space-y-1.5">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      CONSEQUÊNCIAS AUTOMÁTICAS EXECUTADAS:
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {selectedEvent.sideEffects.map((effect, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{effect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* JSON Payload Viewer */}
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Payload do Evento (JSON):</span>
                  </div>
                  <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[300px] scrollbar-thin">
                    {JSON.stringify(selectedEvent.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                Selecione um evento à esquerda para inspecionar.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Immutable Audit Ledger */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs text-slate-400">
            Registo imutável de todas as mutações de dados da plataforma (Actor, Antes, Depois, Checksum).
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Operador / Actor</th>
                  <th className="p-3">Ação</th>
                  <th className="p-3">Entidade</th>
                  <th className="p-3">Estado Anterior</th>
                  <th className="p-3">Novo Estado (Mutado)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {auditRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3 font-mono text-emerald-400 text-[11px]">{rec.id}</td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {new Date(rec.timestamp).toLocaleTimeString()} {rec.timestamp.split('T')[0]}
                    </td>
                    <td className="p-3 font-medium text-white">{rec.actor}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 px-2 py-0.5 rounded font-mono text-[10px] text-slate-300">
                        {rec.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {rec.entityType} ({rec.entityId.slice(0, 10)}...)
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[10px]">
                      {rec.before ? JSON.stringify(rec.before).slice(0, 35) + '...' : 'null (Criação)'}
                    </td>
                    <td className="p-3 text-emerald-300 font-mono text-[10px]">
                      {JSON.stringify(rec.after).slice(0, 45)}...
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
