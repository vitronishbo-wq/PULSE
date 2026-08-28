import React, { useState } from 'react';
import {
  GitBranch,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Building2,
  Monitor,
  History,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  CommercialSeries,
  SeriesStatus,
  DocumentType,
  TenantProfile,
  User,
} from '../types/pulse';

interface CommercialSeriesViewProps {
  seriesList: CommercialSeries[];
  tenant: TenantProfile;
  currentUser: User;
  onCreateSeries: (series: Omit<CommercialSeries, 'id' | 'currentNumber' | 'lastIssuedDocNumber' | 'history'>) => void;
  onCloseSeries: (seriesId: string, reason: string) => void;
  onReopenSeries?: (seriesId: string) => void;
}

export const CommercialSeriesView: React.FC<CommercialSeriesViewProps> = ({
  seriesList = [],
  tenant,
  currentUser,
  onCreateSeries,
  onCloseSeries,
  onReopenSeries,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState<CommercialSeries | null>(null);
  const [selectedSeriesForHistory, setSelectedSeriesForHistory] = useState<CommercialSeries | null>(null);
  const [closeReason, setCloseReason] = useState('');

  // Form State for new series
  const [newDocType, setNewDocType] = useState<DocumentType>('INVOICE');
  const [newSeriesSuffix, setNewSeriesSuffix] = useState('B');
  const [newFiscalYear, setNewFiscalYear] = useState(2026);
  const [newTerminal, setNewTerminal] = useState('POS 02 - Loja Principal');
  const [newInitialNumber, setNewInitialNumber] = useState(1);
  const [newNotes, setNewNotes] = useState('Série criada para novo terminal de venda');

  // Permission Check: only Admin, Tenant Owner, Manager
  const canManageSeries = ['platform_admin', 'tenant_owner', 'manager'].includes(currentUser.role);

  const docTypeLabels: Record<DocumentType, string> = {
    INVOICE: 'Fatura Comercial (FT)',
    RECEIPT: 'Fatura-Recibo (FR)',
    CREDIT_NOTE: 'Nota de Crédito (NC)',
    DEBIT_NOTE: 'Nota de Débito (ND)',
    PROFORMA: 'Fatura Pró-Forma (PP)',
    QUOTATION: 'Orçamento (QT)',
    ORDER: 'Nota de Encomenda (OR)',
    TRANSPORT_NOTE: 'Guia de Transporte (GT)',
    DELIVERY_NOTE: 'Guia de Remessa (GR)',
  };

  const filteredSeries = seriesList.filter((s) => {
    const matchesType = typeFilter === 'ALL' || s.docType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.terminal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.docTypeName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSeries) return;

    const prefix = newDocType === 'INVOICE' ? 'FT' : newDocType === 'RECEIPT' ? 'FR' : newDocType === 'CREDIT_NOTE' ? 'NC' : newDocType === 'PROFORMA' ? 'PP' : 'DOC';
    const code = `${prefix} ${newFiscalYear}/${newSeriesSuffix.toUpperCase()}`;

    onCreateSeries({
      code,
      docType: newDocType,
      docTypeName: docTypeLabels[newDocType] || 'Documento Comercial',
      fiscalYear: newFiscalYear,
      terminal: newTerminal,
      initialNumber: newInitialNumber,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      isAgtCommunicated: true,
      agtCommunicationCode: `AGT-SER-${Date.now().toString().slice(-6)}`,
      notes: newNotes,
      createdBy: currentUser.name,
    });

    setShowCreateModal(false);
  };

  const handleConfirmClose = () => {
    if (!showCloseModal || !canManageSeries) return;
    onCloseSeries(showCloseModal.id, closeReason || 'Encerramento administrativo da série');
    setShowCloseModal(null);
    setCloseReason('');
  };

  // KPIs
  const activeSeriesCount = seriesList.filter((s) => s.status === 'ACTIVE').length;
  const closedSeriesCount = seriesList.filter((s) => s.status === 'CLOSED').length;
  const totalDocsIssued = seriesList.reduce((acc, s) => acc + (s.currentNumber || 0), 0);

  return (
    <div id="commercial-series-view" className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              CONFORMIDADE FISCAL AGT
            </span>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              SÉRIES & NUMERAÇÃO DE DOCUMENTOS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Controlo de sequenciação cronológica contínua sem saltos e associação de séries por terminal e tipo de documento
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canManageSeries ? (
            <button
              id="btn-create-series"
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Série</span>
            </button>
          ) : (
            <div className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Gestão restrita a Administradores</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Séries Ativas</span>
            <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {activeSeriesCount} <span className="text-xs text-slate-400 font-normal">séries em emissão</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Total Documentos Emitidos</span>
            <p className="text-lg font-bold text-white font-mono mt-0.5">
              {totalDocsIssued} <span className="text-xs text-slate-400 font-normal">documentos</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <FileText className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-400">Ano Fiscal Corrente</span>
            <p className="text-lg font-bold text-sky-400 font-mono mt-0.5">
              2026 <span className="text-xs text-slate-400 font-normal">AGT Cert. {tenant.fiscalCertNumber || '001/AGT/2026'}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas as Séries' },
            { id: 'INVOICE', label: 'Faturas (FT)' },
            { id: 'RECEIPT', label: 'Faturas-Recibo (FR)' },
            { id: 'CREDIT_NOTE', label: 'Notas Crédito (NC)' },
            { id: 'PROFORMA', label: 'Pró-Formas (PP)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === tab.id
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {[
            { id: 'ALL', label: 'Todos Estados' },
            { id: 'ACTIVE', label: 'Ativas' },
            { id: 'CLOSED', label: 'Encerradas' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar código, terminal..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Series Grid & Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Código da Série</th>
                <th className="p-3">Tipo de Documento</th>
                <th className="p-3">Ano Fiscal</th>
                <th className="p-3">Terminal Associado</th>
                <th className="p-3 text-center">Nº Inicial</th>
                <th className="p-3 text-center">Último Emitido</th>
                <th className="p-3 text-center">Próximo Nº</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Ações & Histórico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredSeries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    Nenhuma série encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSeries.map((series) => (
                  <tr key={series.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-400 flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{series.code}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-200">{series.docTypeName}</td>
                    <td className="p-3 font-mono text-slate-300">{series.fiscalYear}</td>
                    <td className="p-3 text-slate-300 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-sky-400" />
                      <span>{series.terminal}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-center">{series.initialNumber}</td>
                    <td className="p-3 font-mono font-bold text-white text-center">
                      {series.currentNumber > 0 ? (
                        <span className="bg-slate-800 px-2 py-0.5 rounded">
                          {series.lastIssuedDocNumber || `${series.code}/${series.currentNumber}`}
                        </span>
                      ) : (
                        <span className="text-slate-500">Nenhum</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400 text-center">
                      {series.status === 'ACTIVE' ? (
                        <span className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded">
                          #{series.currentNumber + 1}
                        </span>
                      ) : (
                        <span className="text-slate-500">Bloqueado</span>
                      )}
                    </td>
                    <td className="p-3">
                      {series.status === 'ACTIVE' ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ativa
                        </span>
                      ) : (
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3 text-rose-400" /> Encerrada
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSeriesForHistory(series)}
                          title="Ver Histórico & Auditoria da Série"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs transition-colors cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5 text-sky-400" />
                        </button>

                        {canManageSeries && series.status === 'ACTIVE' && (
                          <button
                            onClick={() => setShowCloseModal(series)}
                            title="Encerrar Série Definitivamente"
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 rounded text-xs transition-colors cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR NOVA SÉRIE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">CRIAR NOVA SÉRIE COMERCIAL (AGT)</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tipo de Documento</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as DocumentType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="INVOICE">Fatura Comercial (FT)</option>
                    <option value="RECEIPT">Fatura-Recibo (FR)</option>
                    <option value="CREDIT_NOTE">Nota de Crédito (NC)</option>
                    <option value="PROFORMA">Fatura Pró-Forma (PP)</option>
                    <option value="QUOTATION">Orçamento (QT)</option>
                    <option value="TRANSPORT_GUIDE">Guia de Transporte (GT)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Ano Fiscal</label>
                  <input
                    type="number"
                    value={newFiscalYear}
                    onChange={(e) => setNewFiscalYear(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Identificador / Letra</label>
                  <input
                    type="text"
                    value={newSeriesSuffix}
                    onChange={(e) => setNewSeriesSuffix(e.target.value.toUpperCase())}
                    placeholder="ex: B, POS02, LOJA1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500 uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Número Inicial</label>
                  <input
                    type="number"
                    value={newInitialNumber}
                    disabled
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-400 outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">Obrigatório iniciar em 1 (Regra AGT)</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Terminal / Ponto de Venda</label>
                <input
                  type="text"
                  value={newTerminal}
                  onChange={(e) => setNewTerminal(e.target.value)}
                  placeholder="ex: Terminal POS 02 - Loja Principal"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Notas / Justificação</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2 text-[11px] text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  A série será automaticamente comunicada e integrada no ficheiro SAF-T (AO) sem descontinuidades na cadeia de assinatura criptográfica.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Criar & Ativar Série</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ENCERRAR SÉRIE */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-md shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ENCERRAR SÉRIE DEFINITIVAMENTE</h3>
                <span className="text-xs font-mono text-rose-400 font-bold">{showCloseModal.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Ao encerrar esta série, não será possível emitir novos documentos com esta numeração. Todos os documentos já emitidos permanecerão válidos e imutáveis no SAF-T.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Motivo do Encerramento (Obrigatório AGT):</label>
              <textarea
                rows={2}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="ex: Fim de exercício económico ou substituição de terminal"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCloseModal(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmClose}
                disabled={!closeReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirmar Encerramento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO & AUDITORIA DA SÉRIE */}
      {selectedSeriesForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">AUDITORIA DE SÉRIE FISCAL</span>
                <h3 className="text-base font-bold text-white font-mono">{selectedSeriesForHistory.code}</h3>
              </div>
              <button onClick={() => setSelectedSeriesForHistory(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Terminal:</span>
                <p className="font-medium text-white">{selectedSeriesForHistory.terminal}</p>
              </div>
              <div>
                <span className="text-slate-400">Criado por:</span>
                <p className="font-medium text-white">{selectedSeriesForHistory.createdBy}</p>
              </div>
              <div>
                <span className="text-slate-400">Data de Início:</span>
                <p className="font-mono text-slate-300">{selectedSeriesForHistory.startDate}</p>
              </div>
              <div>
                <span className="text-slate-400">Documentos Emitidos:</span>
                <p className="font-mono font-bold text-emerald-400">{selectedSeriesForHistory.currentNumber} documentos</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-sky-400" />
                Linha Temporal de Eventos
              </h4>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                {selectedSeriesForHistory.history?.length > 0 ? (
                  selectedSeriesForHistory.history.map((h, i) => (
                    <div key={i} className="text-xs border-l-2 border-emerald-500 pl-2.5 py-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>{h.action}</span>
                        <span>{h.timestamp}</span>
                      </div>
                      <p className="text-slate-200 mt-0.5">{h.details}</p>
                      <span className="text-[10px] text-slate-500">Operador: {h.user}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-3">
                    Série ativa em conformidade. Eventos auditados no registo geral.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSeriesForHistory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
