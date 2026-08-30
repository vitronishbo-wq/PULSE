import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Activity,
  History,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { AuditRecord, SystemEvent, User } from '../../types/pulse';
import { ReportFilterState, ReportAuditSubCategory } from '../../types/reports';
import { exportTableToCSV, printReportTable, copyTableToClipboard } from '../../utils/reportExportUtils';

interface ReportsAuditSectionProps {
  subCategory: ReportAuditSubCategory;
  auditRecords: AuditRecord[];
  systemEvents: SystemEvent[];
  users: User[];
  filters: ReportFilterState;
}

export const ReportsAuditSection: React.FC<ReportsAuditSectionProps> = ({
  subCategory,
  auditRecords,
  systemEvents,
  users,
  filters,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Audit Records
  const filteredAudits = useMemo(() => {
    return auditRecords.filter((a) => {
      if (filters.startDate && a.timestamp.slice(0, 10) < filters.startDate) return false;
      if (filters.endDate && a.timestamp.slice(0, 10) > filters.endDate) return false;
      if (filters.operatorId !== 'ALL' && a.actor !== filters.operatorId) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !a.action.toLowerCase().includes(query) &&
          !a.entityType.toLowerCase().includes(query) &&
          !a.actor.toLowerCase().includes(query) &&
          !a.entityId.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [auditRecords, filters]);

  // Filtered System Events
  const filteredEvents = useMemo(() => {
    return systemEvents.filter((e) => {
      if (filters.startDate && e.timestamp.slice(0, 10) < filters.startDate) return false;
      if (filters.endDate && e.timestamp.slice(0, 10) > filters.endDate) return false;
      if (filters.operatorId !== 'ALL' && e.userId !== filters.operatorId) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !e.eventType.toLowerCase().includes(query) &&
          !e.entityType.toLowerCase().includes(query) &&
          !e.userName.toLowerCase().includes(query) &&
          !e.source.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [systemEvents, filters]);

  // Cancellations & modifications only
  const changesAndCancels = useMemo(() => {
    return filteredAudits.filter(
      (a) =>
        a.action.toLowerCase().includes('cancel') ||
        a.action.toLowerCase().includes('delete') ||
        a.action.toLowerCase().includes('update') ||
        a.action.toLowerCase().includes('anula') ||
        a.action.toLowerCase().includes('void')
    );
  }, [filteredAudits]);

  // Operator Logs Grouping
  const operatorActivity = useMemo(() => {
    const map: Record<
      string,
      {
        operatorId: string;
        operatorName: string;
        eventCount: number;
        auditCount: number;
        cancels: number;
        lastActive: string;
        records: AuditRecord[];
      }
    > = {};

    filteredAudits.forEach((a) => {
      const actorId = a.actor || 'unknown';
      const u = users.find((usr) => usr.uid === actorId);
      const name = u?.name || actorId;

      if (!map[actorId]) {
        map[actorId] = {
          operatorId: actorId,
          operatorName: name,
          eventCount: 0,
          auditCount: 0,
          cancels: 0,
          lastActive: a.timestamp,
          records: [],
        };
      }

      map[actorId].auditCount += 1;
      if (a.action.toLowerCase().includes('cancel') || a.action.toLowerCase().includes('void')) {
        map[actorId].cancels += 1;
      }
      if (a.timestamp > map[actorId].lastActive) {
        map[actorId].lastActive = a.timestamp;
      }
      map[actorId].records.push(a);
    });

    return Object.values(map).sort((a, b) => b.auditCount - a.auditCount);
  }, [filteredAudits, users]);

  // Handle Export Actions
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Relatorio_Auditoria_${subCategory}`;

    if (subCategory === 'AUDIT_SYSTEM_EVENTS') {
      headers = ['ID Evento', 'Data/Hora', 'Tipo de Evento', 'Origem', 'Utilizador', 'Entidade Afetada', 'ID Entidade'];
      rows = filteredEvents.map((e) => [e.eventId, e.timestamp, e.eventType, e.source, e.userName, e.entityType, e.entityId]);
    } else if (subCategory === 'AUDIT_OPERATOR_LOGS') {
      headers = ['Operador', 'ID', 'Total Ações Auditadas', 'Anulações Executadas', 'Última Atividade'];
      rows = operatorActivity.map((o) => [o.operatorName, o.operatorId, o.auditCount, o.cancels, o.lastActive]);
    } else {
      headers = ['Data/Hora', 'Operador / Ator', 'Ação', 'Entidade', 'ID Registo'];
      rows = filteredAudits.map((a) => [a.timestamp, a.actor, a.action, a.entityType, a.entityId]);
    }

    exportTableToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    let headers: string[] = ['Data/Hora', 'Ator', 'Ação', 'Entidade', 'ID'];
    let rows: (string | number)[][] = filteredAudits.map((a) => [a.timestamp, a.actor, a.action, a.entityType, a.entityId]);
    let title = `Relatório de Auditoria & Conformidade — ${subCategory}`;
    let subtitle = `Total de Registos de Auditoria: ${filteredAudits.length}`;

    printReportTable(title, subtitle, headers, rows);
  };

  const handleCopy = () => {
    let headers: string[] = ['Data/Hora', 'Ator', 'Ação', 'Entidade'];
    let rows: (string | number)[][] = filteredAudits.map((a) => [a.timestamp, a.actor, a.action, a.entityType]);
    const success = copyTableToClipboard(headers, rows);
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Audit Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121215] p-2 rounded-lg border border-[#27272a]">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500">Registos de Auditoria:</span>{' '}
            <span className="font-bold text-white">{filteredAudits.length}</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Eventos do Sistema:</span>{' '}
            <span className="font-bold text-sky-400 font-mono">{filteredEvents.length}</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Anulações & Alterações:</span>{' '}
            <span className="font-bold text-rose-400 font-mono">{changesAndCancels.length}</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Operadores Ativos:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">{operatorActivity.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {copiedNotification && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" /> Copiado!
            </span>
          )}
          <button
            onClick={handleCopy}
            title="Copiar dados"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copiar</span>
          </button>
          <button
            onClick={handleExportCSV}
            title="Exportar tabela para Excel (CSV)"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handlePrint}
            title="Imprimir relatório"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 1. TABELA: OPERAÇÕES DOS UTILIZADORES / REGISTO GERAL */}
      {(subCategory === 'AUDIT_USER_OPS' || subCategory === 'AUDIT_HISTORY') && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Operador / Ator</th>
                <th className="p-2">Ação Executada</th>
                <th className="p-2">Entidade</th>
                <th className="p-2 font-mono">ID Registo</th>
                <th className="p-2 text-center">Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhum registo de auditoria encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => {
                  const isExpanded = !!expandedRows[a.id];
                  return (
                    <React.Fragment key={a.id}>
                      <tr
                        onClick={() => toggleRow(a.id)}
                        className="hover:bg-[#222227] cursor-pointer transition-colors"
                      >
                        <td className="p-2 text-center text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-400 inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 inline" />
                          )}
                        </td>
                        <td className="p-2 font-mono text-slate-400 text-[10px]">{a.timestamp}</td>
                        <td className="p-2 font-bold text-white">{a.actor}</td>
                        <td className="p-2">
                          <span className="bg-[#121215] px-1.5 py-0.5 rounded border border-[#27272a] text-slate-200">
                            {a.action}
                          </span>
                        </td>
                        <td className="p-2 text-slate-300">{a.entityType}</td>
                        <td className="p-2 font-mono text-slate-400 text-[10px]">{a.entityId}</td>
                        <td className="p-2 text-center">
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            IMUTÁVEL
                          </span>
                        </td>
                      </tr>

                      {/* Diff details before/after */}
                      {isExpanded && (
                        <tr className="bg-[#121215]">
                          <td colSpan={7} className="p-3 pl-8">
                            <div className="border border-[#27272a] rounded bg-[#18181b] p-2 space-y-2 text-[10px]">
                              <div className="font-bold text-slate-400 uppercase">
                                Detalhes e Comparação de Estado (Diff):
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="p-2 bg-[#121215] border border-[#27272a] rounded">
                                  <span className="text-slate-500 font-bold block mb-1">Estado Anterior (Before):</span>
                                  <pre className="text-slate-400 overflow-x-auto whitespace-pre-wrap">
                                    {a.before ? JSON.stringify(a.before, null, 2) : 'N/A (Criação de novo registo)'}
                                  </pre>
                                </div>
                                <div className="p-2 bg-[#121215] border border-[#27272a] rounded">
                                  <span className="text-emerald-400 font-bold block mb-1">Novo Estado (After):</span>
                                  <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                    {a.after ? JSON.stringify(a.after, null, 2) : 'N/A (Registo eliminado)'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TABELA: ALTERAÇÕES & ANULAÇÕES CRÍTICAS */}
      {subCategory === 'AUDIT_CHANGES_CANCELS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Operador Responsável</th>
                <th className="p-2">Operação Crítica</th>
                <th className="p-2">Tipo Entidade</th>
                <th className="p-2 font-mono">ID Entidade</th>
                <th className="p-2 text-center">Severidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {changesAndCancels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhuma anulação ou alteração crítica registada no período.
                  </td>
                </tr>
              ) : (
                changesAndCancels.map((c) => (
                  <tr key={c.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{c.timestamp}</td>
                    <td className="p-2 font-bold text-white">{c.actor}</td>
                    <td className="p-2">
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                        {c.action}
                      </span>
                    </td>
                    <td className="p-2 text-slate-300">{c.entityType}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{c.entityId}</td>
                    <td className="p-2 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        AUDIT CRÍTICO
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. TABELA: EVENTOS DO SISTEMA (EVENTBUS STREAM) */}
      {subCategory === 'AUDIT_SYSTEM_EVENTS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">ID Evento</th>
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Tipo de Evento</th>
                <th className="p-2">Origem (Source)</th>
                <th className="p-2">Utilizador</th>
                <th className="p-2">Entidade</th>
                <th className="p-2 text-center">Versão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredEvents.map((e) => (
                <tr key={e.eventId} className="hover:bg-[#222227]">
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{e.eventId.slice(0, 8)}...</td>
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{e.timestamp}</td>
                  <td className="p-2 font-bold text-emerald-400">{e.eventType}</td>
                  <td className="p-2">
                    <span className="bg-[#121215] px-1.5 py-0.5 rounded border border-[#27272a] text-slate-300">
                      {e.source}
                    </span>
                  </td>
                  <td className="p-2 text-slate-200">{e.userName}</td>
                  <td className="p-2 text-slate-300 font-mono text-[10.5px]">{e.entityType}</td>
                  <td className="p-2 text-center font-mono text-slate-400">v{e.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. TABELA: REGISTO POR OPERADOR */}
      {subCategory === 'AUDIT_OPERATOR_LOGS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Operador / Utilizador</th>
                <th className="p-2 font-mono">ID Utilizador</th>
                <th className="p-2 text-right">Total Ações Auditadas</th>
                <th className="p-2 text-right">Anulações Executadas</th>
                <th className="p-2">Última Atividade Registada</th>
                <th className="p-2 text-center">Estado Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {operatorActivity.map((o) => (
                <tr key={o.operatorId} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{o.operatorName}</span>
                  </td>
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{o.operatorId}</td>
                  <td className="p-2 text-right font-mono text-slate-200">{o.auditCount}</td>
                  <td className="p-2 text-right font-mono text-rose-400 font-bold">{o.cancels}</td>
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{o.lastActive}</td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      REGISTADO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
