import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Building2,
  X,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Search,
  Layers,
  Play,
  Key,
  BarChart3,
  Server,
  Terminal,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileCode,
  Sparkles,
  UtensilsCrossed,
  Pill,
  Shirt,
  Briefcase,
  ShoppingCart,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  ShieldCheck,
  Check,
  Zap,
  Keyboard,
  Mic,
  Scan,
} from 'lucide-react';
import {
  TenantProfile,
  TenantFeatureFlags,
  User,
  SystemEvent,
  AuditRecord,
  TestSuiteReport,
  BusinessSegment,
} from '../types/pulse';
import { Orchestrator } from '../engines/Orchestrator';
import { InputNormalizer } from '../engines/InputNormalizer';
import { BusinessProfilesView } from './BusinessProfilesView';
import { TenantProvisioningWizard } from './TenantProvisioningWizard';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onTenantSwitch: (tenantId: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onTenantSwitch,
}) => {
  const orchestrator = Orchestrator.getInstance();

  // Dialpad & Gateway State
  const [dialpadInput, setDialpadInput] = useState('');
  const [stage, setStage] = useState<'DIALPAD' | 'AUTH_CHALLENGE' | 'CONTROL_PLANE'>('DIALPAD');

  // Auth Challenge State
  const [adminEmail, setAdminEmail] = useState('platform.admin@pulse-os.global');
  const [adminPassword, setAdminPassword] = useState('135790');
  const [mfaCode, setMfaCode] = useState('948201');
  const [authError, setAuthError] = useState('');

  // VS Code Hierarchical Tree State
  const [rootExpanded, setRootExpanded] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '01_tenants': true,
    '02_segments': true,
    '03_licenses': true,
    '04_modules': false,
    '05_usage': false,
    '06_events_audit': false,
    '07_tests': false,
  });

  const [activeLeafId, setActiveLeafId] = useState<string>('tenants_directory');
  const [treeSearch, setTreeSearch] = useState('');

  // Tenants Data
  const [tenants, setTenants] = useState<TenantProfile[]>(orchestrator.getAllTenants());
  const [selectedTenantForSegment, setSelectedTenantForSegment] = useState<string>(
    orchestrator.activeTenantId
  );

  // Impersonation modal state
  const [impersonateTarget, setImpersonateTarget] = useState<TenantProfile | null>(null);
  const [impersonationReason, setImpersonationReason] = useState('');
  const [impersonationError, setImpersonationError] = useState('');

  // Selected event/audit drawer
  const [selectedEvent, setSelectedEvent] = useState<SystemEvent | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  // Provisioning Wizard modal state
  const [showProvisioningWizard, setShowProvisioningWizard] = useState(false);
  const [provisioningSegment, setProvisioningSegment] = useState<BusinessSegment>('RESTAURANT_BAR');

  // Test Suite execution state
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  if (!isOpen) return null;

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const expandAll = () => {
    setRootExpanded(true);
    setExpandedNodes({
      '01_tenants': true,
      '02_segments': true,
      '03_licenses': true,
      '04_modules': true,
      '05_usage': true,
      '06_events_audit': true,
      '07_tests': true,
    });
  };

  const collapseAll = () => {
    setExpandedNodes({
      '01_tenants': false,
      '02_segments': false,
      '03_licenses': false,
      '04_modules': false,
      '05_usage': false,
      '06_events_audit': false,
      '07_tests': false,
    });
  };

  const handleDialpadPress = (val: string) => {
    const next = dialpadInput + val;
    setDialpadInput(next);
    if (next.endsWith('*#7668#') || next === '7668') {
      setStage('AUTH_CHALLENGE');
      setDialpadInput('');
    }
  };

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const res = orchestrator.authenticatePlatformAdmin(
      { email: adminEmail, passOrPin: adminPassword, mfaToken: mfaCode },
      currentUser
    );

    if (res.authenticated) {
      setStage('CONTROL_PLANE');
      setTenants(orchestrator.getAllTenants());
    } else {
      setAuthError(res.error || 'Autenticação recusada.');
    }
  };

  const handleToggleFeatureFlag = (
    tenantId: string,
    flagKey: keyof TenantFeatureFlags,
    currentValue: boolean
  ) => {
    orchestrator.updateTenantFeatureFlags(tenantId, { [flagKey]: !currentValue }, currentUser);
    setTenants(orchestrator.getAllTenants());
  };

  const handleRenewLicense = (tenantId: string, months: number = 12) => {
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

    setTenants(orchestrator.getAllTenants());
  };

  const handleSwitchSegment = (tenantId: string, newSegment: BusinessSegment) => {
    orchestrator.setTenantBusinessSegment(tenantId, newSegment, currentUser);
    setTenants(orchestrator.getAllTenants());
    if (tenantId === orchestrator.activeTenantId) {
      onTenantSwitch(tenantId);
    }
  };

  const handleToggleTenantStatus = (tenantId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    orchestrator.updateTenant(
      tenantId,
      {
        licenseStatus: nextStatus,
        activeLicense: nextStatus === 'ACTIVE',
      },
      currentUser
    );
    setTenants(orchestrator.getAllTenants());
  };

  const handleExecuteImpersonation = () => {
    if (!impersonateTarget) return;
    setImpersonationError('');

    const res = orchestrator.startImpersonation(currentUser, impersonateTarget.id, impersonationReason);
    if (res.success) {
      onTenantSwitch(impersonateTarget.id);
      setImpersonateTarget(null);
      setImpersonationReason('');
      onClose();
    } else {
      setImpersonationError(res.message);
    }
  };

  const handleEndCurrentImpersonation = () => {
    orchestrator.stopImpersonation(currentUser);
    onTenantSwitch(orchestrator.activeTenantId);
    setTenants(orchestrator.getAllTenants());
  };

  const handleRunTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const report = orchestrator.runVerificationTestSuite(currentUser);
      setTestReport(report);
      setIsRunningTests(false);
    }, 250);
  };

  const allEvents = orchestrator.eventBus.getHistory();
  const allAuditRecords = orchestrator.auditLedger.getRecords();
  const metrics = orchestrator.getPlatformMetrics();
  const errorsLog = orchestrator.getErrorsLog();

  const segmentDefinitions: {
    segment: BusinessSegment;
    title: string;
    icon: any;
    color: string;
    description: string;
    features: string[];
  }[] = [
    {
      segment: 'RESTAURANT_BAR',
      title: 'Restaurante & Bar / Cafetaria',
      icon: UtensilsCrossed,
      color: 'text-amber-400',
      description: 'Gestão de Mesas, Pedidos Cozinha KDS, Divisão de Conta e Fichas Técnicas (BOM).',
      features: ['Mesas 1..12 & Balcão', 'Envio Automático KDS Cozinha/Bar', 'Explosão de Matéria-Prima (BOM)', 'Impressão de Comanda de Bar'],
    },
    {
      segment: 'PHARMACY',
      title: 'Farmácia & Saúde',
      icon: Pill,
      color: 'text-rose-400',
      description: 'Rastreabilidade de Lotes, Data de Validade, Princípio Ativo e Prescrições.',
      features: ['Campos Obrigatórios Lote & Validade', 'Alerta de Medicamentos Expirados', 'Isenção Art. 12º (Saúde)', 'Filtro por Princípio Ativo'],
    },
    {
      segment: 'RETAIL_CLOTHING',
      title: 'Vestuário, Calçado & Moda',
      icon: Shirt,
      color: 'text-sky-400',
      description: 'Matriz bidimensional de Tamanho, Cor, Coleção e Código de Barras EAN.',
      features: ['Grade de Tamanhos (S/M/L/XL / 36-44)', 'Variações de Cor & Coleção', 'Etiquetagem de Saldos', 'Trocas e Devoluções'],
    },
    {
      segment: 'SERVICES',
      title: 'Prestação de Serviços & Consultoria',
      icon: Briefcase,
      color: 'text-purple-400',
      description: 'Oculta armazém físico, ativa cálculo automático de Retenção na Fonte (6.5%).',
      features: ['Retenção na Fonte 6.5% (AGT)', 'Honorários & Horas Faturáveis', 'Propostas & Contratos de Serviço', 'Sem Bloqueio de Stock Físico'],
    },
    {
      segment: 'GENERAL_RETAIL',
      title: 'Retalho Geral & Supermercado',
      icon: ShoppingCart,
      color: 'text-emerald-400',
      description: 'Focado em velocidade de scanner, códigos EAN-13, balança e caixa rápido.',
      features: ['Leitura Contínua de Barcode', 'Artigos Pesáveis (Balança / kg)', 'Atalhos de Teclado F1..F12', 'Venda Rápida a Dinheiro/TPA'],
    },
  ];

  return (
    <div
      id="modal-platform-control"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-1 sm:p-3 font-mono text-slate-200"
    >
      <div className="bg-[#181818] border border-[#333333] rounded-lg w-full max-w-[1280px] shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        
        {/* VS Code Window Titlebar */}
        <div className="bg-[#1e1e1e] border-b border-[#2d2d2d] px-3 py-2 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block cursor-pointer" onClick={onClose} />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block" />
            </div>
            <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
            <span className="text-xs text-slate-300 font-semibold tracking-wide">
              PULSE.OS — Platform Control Plane [ULCE v2.0]
            </span>
          </div>

          <div className="flex items-center gap-3">
            {orchestrator.impersonationSession?.active && (
              <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 px-2 py-0.5 rounded text-[11px] flex items-center gap-2">
                <span>Personificando: <strong>{orchestrator.impersonationSession.targetTenantName}</strong></span>
                <button
                  onClick={handleEndCurrentImpersonation}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 px-1.5 py-0.2 rounded font-bold text-[10px]"
                >
                  Encerrar
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#2d2d2d] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. STAGE: DIALPAD GATEWAY */}
        {stage === 'DIALPAD' && (
          <div className="p-8 max-w-sm mx-auto text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase">Gateway de Acesso Administrativo</h4>
              <p className="text-[11px] text-slate-400 mt-1">
                Introduza a sequência de serviço <strong>*#7668#</strong> para invocar o painel
              </p>
            </div>

            <div className="bg-[#252526] border border-[#3c3c3c] rounded p-2.5 text-center text-base tracking-widest text-emerald-400 min-h-[42px] flex items-center justify-center">
              {dialpadInput || '• • • • • • •'}
            </div>

            <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => (
                <button
                  key={k}
                  onClick={() => handleDialpadPress(k)}
                  className="py-2.5 bg-[#252526] hover:bg-[#2d2d2d] active:bg-[#007acc] active:text-white font-bold text-sm rounded border border-[#3c3c3c] transition-colors text-white"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2">
              <button onClick={() => setDialpadInput('')} className="hover:text-slate-300">
                Limpar
              </button>
              <button
                onClick={() => setStage('AUTH_CHALLENGE')}
                className="text-[#007acc] hover:underline"
              >
                Prosseguir para Autenticação &rarr;
              </button>
            </div>
          </div>
        )}

        {/* 2. STAGE: AUTH CHALLENGE */}
        {stage === 'AUTH_CHALLENGE' && (
          <div className="p-8 max-w-md mx-auto my-auto w-full">
            <form onSubmit={handleAuthenticate} className="bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg p-6 space-y-4 text-xs">
              <div className="flex items-center gap-2 border-b border-[#2d2d2d] pb-3">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-bold text-white">Desafio de Segurança da Plataforma</div>
                  <div className="text-[10px] text-slate-400">Autenticação MFA + RBAC platform_admin</div>
                </div>
              </div>

              {authError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded flex items-center gap-2 text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">E-mail Administrativo</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#007acc]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Senha Mestra do Fundador / Deus</label>
                <input
                  type="password"
                  placeholder="135790"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-1.5 text-white focus:outline-none focus:border-[#007acc] font-mono tracking-widest text-sm"
                />
                <span className="text-[10px] text-emerald-400 mt-0.5 block">
                  Senha Mestra Fundador: <strong className="font-mono">135790</strong> (Acesso irrestrito a todos os tenants)
                </span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Código MFA Token (6 dígitos)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-1.5 text-white text-center font-bold tracking-widest focus:outline-none focus:border-[#007acc]"
                  required
                />
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStage('DIALPAD')}
                  className="text-slate-400 hover:text-white"
                >
                  &larr; Voltar
                </button>
                <button
                  type="submit"
                  className="bg-[#007acc] hover:bg-[#0062a3] text-white px-4 py-1.5 rounded font-bold transition-colors"
                >
                  Validar Credenciais & Entrar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. STAGE: CONTROL PLANE (VS CODE HIERARCHICAL TREE LAYOUT) */}
        {stage === 'CONTROL_PLANE' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT SIDEBAR: VS Code Hierarchical Tree Explorer */}
            <div className="w-80 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col shrink-0">
              
              {/* Explorer Title & Actions */}
              <div className="p-2 border-b border-[#2d2d2d] flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  EXPLORER: HIERARCHY
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={expandAll}
                    title="Expandir Tudo"
                    className="p-1 hover:bg-[#2d2d2d] rounded text-slate-400 hover:text-white"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={collapseAll}
                    title="Recolher Tudo"
                    className="p-1 hover:bg-[#2d2d2d] rounded text-slate-400 hover:text-white"
                  >
                    <Minimize2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Tree Search */}
              <div className="p-2 border-b border-[#2d2d2d]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Filtrar camadas ou módulos..."
                    value={treeSearch}
                    onChange={(e) => setTreeSearch(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-[#007acc]"
                  />
                </div>
              </div>

              {/* Hierarchical Tree View */}
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-xs select-none">
                
                {/* ROOT NODE: PULSE-OS-PLATFORM */}
                <div>
                  <div
                    onClick={() => setRootExpanded(!rootExpanded)}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-200 font-bold"
                  >
                    {rootExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    {rootExpanded ? (
                      <FolderOpen className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-[#007acc] shrink-0" />
                    )}
                    <span className="truncate text-[11px]">ROOT: PULSE-OS-PLATFORM</span>
                  </div>

                  {rootExpanded && (
                    <div className="pl-3 border-l border-[#333333] ml-2 mt-0.5 space-y-0.5">
                      
                      {/* LAYER 01: TENANTS */}
                      <div>
                        <div
                          onClick={() => toggleNode('01_tenants')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['01_tenants'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-semibold">01_TENANTS ({tenants.length})</span>
                        </div>

                        {expandedNodes['01_tenants'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('tenants_directory')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'tenants_directory'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate">tenants_directory.json</span>
                            </button>
                            <button
                              onClick={() => setActiveLeafId('active_context')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'active_context'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">active_tenant.context</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 02: BUSINESS SEGMENTS ENGINE */}
                      <div>
                        <div
                          onClick={() => toggleNode('02_segments')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['02_segments'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] font-semibold">02_PROFILES_PROVISIONING</span>
                        </div>

                        {expandedNodes['02_segments'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('business_profiles')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'business_profiles' || activeLeafId === 'segment_matrix'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <Layers className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">business_profiles.table</span>
                            </button>
                            <button
                              onClick={() => {
                                setProvisioningSegment('RESTAURANT_BAR');
                                setShowProvisioningWizard(true);
                              }}
                              className="w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] text-emerald-400 hover:bg-[#2a2d2e] hover:text-emerald-300 font-semibold"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">+ new_tenant_acquisition.flow</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 03: LICENSES & BILLING */}
                      <div>
                        <div
                          onClick={() => toggleNode('03_licenses')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['03_licenses'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Key className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-[11px] font-semibold">03_LICENSES_MATRIX</span>
                        </div>

                        {expandedNodes['03_licenses'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('licenses_registry')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'licenses_registry'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate">rsa_licenses.key</span>
                            </button>
                            <button
                              onClick={() => setActiveLeafId('credentials_hierarchy')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'credentials_hierarchy'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">auth_credentials.rbac</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 04: CAPABILITIES & MODULES */}
                      <div>
                        <div
                          onClick={() => toggleNode('04_modules')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['04_modules'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-semibold">04_CAPABILITIES_FLAGS</span>
                        </div>

                        {expandedNodes['04_modules'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('modules_flags')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'modules_flags'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate">feature_flags.matrix</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 05: TELEMETRY & USAGE */}
                      <div>
                        <div
                          onClick={() => toggleNode('05_usage')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['05_usage'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <BarChart3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-[11px] font-semibold">05_TELEMETRY_USAGE</span>
                        </div>

                        {expandedNodes['05_usage'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('usage_metrics')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'usage_metrics'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate">platform_usage.telemetry</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 06: EVENT BUS & IMMUTABLE AUDIT */}
                      <div>
                        <div
                          onClick={() => toggleNode('06_events_audit')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['06_events_audit'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="text-[11px] font-semibold">06_EVENTBUS_AUDIT</span>
                        </div>

                        {expandedNodes['06_events_audit'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('event_bus_journal')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'event_bus_journal'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate">eventbus_stream.log ({allEvents.length})</span>
                            </button>
                            <button
                              onClick={() => setActiveLeafId('audit_ledger')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'audit_ledger'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 shrink-0" />
                              <span className="truncate">immutable_audit.ledger ({allAuditRecords.length})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 07: DIAGNOSTICS & SYSTEM TESTS */}
                      <div>
                        <div
                          onClick={() => toggleNode('07_tests')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['07_tests'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Play className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-[11px] font-semibold">07_DIAGNOSTICS_TESTS</span>
                        </div>

                        {expandedNodes['07_tests'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('system_tests')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'system_tests'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <Play className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">kernel_test_runner.spec</span>
                            </button>
                            <button
                              onClick={() => setActiveLeafId('error_logs')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'error_logs'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">error_diagnostics.log ({errorsLog.length})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* LAYER 08: UNIVERSAL INPUT LAYER SPEC & TELEMETRY */}
                      <div>
                        <div
                          onClick={() => toggleNode('08_input_layer')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['08_input_layer'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Keyboard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-[11px] font-semibold">08_INPUT_UNIVERSAL</span>
                        </div>

                        {expandedNodes['08_input_layer'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            <button
                              onClick={() => setActiveLeafId('universal_input_spec')}
                              className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                activeLeafId === 'universal_input_spec'
                                  ? 'bg-[#04395e] text-white font-semibold'
                                  : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                              }`}
                            >
                              <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">input_pipeline.spec</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>

              {/* Status Bar in Sidebar */}
              <div className="p-2 border-t border-[#2d2d2d] text-[10px] text-slate-500 flex justify-between items-center">
                <span>PULSE KERNEL: ONLINE</span>
                <span className="text-emerald-400 font-bold">100% HEALTH</span>
              </div>
            </div>

            {/* RIGHT PANE: VS Code Editor / Inspector */}
            <div className="flex-1 bg-[#1e1e1e] flex flex-col overflow-hidden">
              
              {/* Editor Tab Bar & Breadcrumbs */}
              <div className="bg-[#252526] border-b border-[#2d2d2d] px-3 py-1.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <span>PULSE.OS</span>
                  <span>&rsaquo;</span>
                  <span className="text-slate-300 font-semibold">{activeLeafId}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  READ/WRITE • UTF-8 • MONOSPACE
                </div>
              </div>

              {/* Main Content View per Active Leaf */}
              <div className="flex-1 overflow-y-auto p-4">

                {/* 1. LEAF: TENANTS DIRECTORY */}
                {activeLeafId === 'tenants_directory' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase">Diretório Global de Tenants</h3>
                        <p className="text-[11px] text-slate-400">Instâncias empresariais isoladas sob o ULCE Kernel</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono bg-[#252526] px-2.5 py-1 rounded border border-[#3c3c3c]">
                        Total: {tenants.length} organizações
                      </span>
                    </div>

                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#2d2d2d] text-slate-400 text-[10px] uppercase">
                          <th className="py-2 px-2">ID / NIF</th>
                          <th className="py-2 px-2">Nome Comercial</th>
                          <th className="py-2 px-2">Segmento</th>
                          <th className="py-2 px-2">País / Moeda</th>
                          <th className="py-2 px-2">Status</th>
                          <th className="py-2 px-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2d2d2d]">
                        {tenants.map((t) => (
                          <tr key={t.id} className="hover:bg-[#252526] transition-colors">
                            <td className="py-2.5 px-2">
                              <span className="font-bold text-white block">{t.id}</span>
                              <span className="text-[10px] text-slate-500 font-mono">NIF: {t.taxId}</span>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="font-semibold text-slate-200">{t.tradeName}</span>
                              <span className="text-[10px] text-slate-500 block truncate max-w-xs">{t.name}</span>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#04395e] text-sky-300 border border-sky-500/30">
                                {t.segment || 'GENERAL_RETAIL'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-mono">
                              {t.country} ({t.currency})
                            </td>
                            <td className="py-2.5 px-2">
                              <button
                                onClick={() => handleToggleTenantStatus(t.id, t.licenseStatus)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.licenseStatus === 'ACTIVE'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {t.licenseStatus || 'ACTIVE'}
                              </button>
                            </td>
                            <td className="py-2.5 px-2 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  onTenantSwitch(t.id);
                                  onClose();
                                }}
                                className="bg-[#007acc] hover:bg-[#0062a3] text-white px-2 py-1 rounded text-[10px] font-bold"
                              >
                                Alternar
                              </button>
                              <button
                                onClick={() => setImpersonateTarget(t)}
                                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded text-[10px] font-bold border border-amber-500/40"
                              >
                                Personificar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. LEAF: BUSINESS PROFILES & LATERAL INSPECTOR (SEM TROCAR DE PÁGINA) */}
                {(activeLeafId === 'business_profiles' || activeLeafId === 'segment_matrix' || activeLeafId.startsWith('segment_')) && (
                  <div className="h-full flex flex-col -m-4">
                    <BusinessProfilesView
                      onStartProvisioning={(seg) => {
                        setProvisioningSegment(seg);
                        setShowProvisioningWizard(true);
                      }}
                      onFilterTenantsBySegment={(seg) => {
                        setActiveLeafId('tenants_directory');
                      }}
                    />
                  </div>
                )}

                {/* 3. LEAF: LICENSES REGISTRY */}
                {activeLeafId === 'licenses_registry' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase">Matriz de Licenças Criptográficas</h3>
                        <p className="text-[11px] text-slate-400">Validação e renovação de subscrições SaaS</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {tenants.map((t) => (
                        <div
                          key={t.id}
                          className="bg-[#252526] border border-[#3c3c3c] rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{t.tradeName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">Chave: {t.licenseKey || 'NÃO ATRIBUÍDA'}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right font-mono">
                              <span className="text-[10px] text-slate-500 block uppercase">Expira em</span>
                              <span className="text-slate-300">{t.licenseExpiry || 'Indeterminado'}</span>
                            </div>

                            <button
                              onClick={() => handleRenewLicense(t.id, 12)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-bold"
                            >
                              +12 Meses
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3.1 LEAF: CREDENTIALS & RBAC HIERARCHY */}
                {activeLeafId === 'credentials_hierarchy' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase">
                          Hierarquia de Credenciais & Gestão de Senhas (RBAC 3 Níveis)
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Estrutura de privilégios de acesso e segurança do ecossistema PULSE.OS
                        </p>
                      </div>
                    </div>

                    {/* Hierarchy Level 1: Deus / Fundador */}
                    <div className="bg-[#252526] border border-emerald-500/40 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            NÍVEL 1 • DEUS / FUNDADOR
                          </span>
                          <span className="text-xs font-bold text-white">Super Administrador da Plataforma</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">ACESSO GLOBAL IRRESTRITO</span>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        O Fundador detém controlo total da plataforma, define segmentos, renova licenças e tem permissão para gerir e resetar credenciais de qualquer organização.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#3c3c3c]">
                          <span className="text-[10px] text-slate-500 block uppercase">Código de Invocação</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">*#7668#</span>
                        </div>
                        <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#3c3c3c]">
                          <span className="text-[10px] text-slate-500 block uppercase">E-mail Administrativo</span>
                          <span className="text-xs font-mono text-slate-200">platform.admin@pulse-os.global</span>
                        </div>
                        <div className="bg-[#1e1e1e] p-2.5 rounded border border-[#3c3c3c]">
                          <span className="text-[10px] text-slate-500 block uppercase">Senha Mestra Direta</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">135790</span>
                        </div>
                      </div>
                    </div>

                    {/* Hierarchy Level 2: Administrador do Tenant */}
                    <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                            NÍVEL 2 • ADMINISTRADOR DO TENANT
                          </span>
                          <span className="text-xs font-bold text-white">Empresa Contratante (Subscrição)</span>
                        </div>
                        <span className="text-[10px] text-sky-400 font-mono">ISOLAMENTO TOTAL POR NIF</span>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        As credenciais do Administrador do Tenant são definidas na <strong>subscrição do serviço</strong> no cadastro da empresa. Ele gere os produtos, clientes, faturação e <strong>define as senhas e PINs dos seus funcionários</strong>.
                      </p>

                      <div className="bg-[#1e1e1e] p-3 rounded border border-[#333333] space-y-2">
                        <div className="text-[11px] font-bold text-slate-300 uppercase">Organizações Cadastradas:</div>
                        <div className="space-y-1.5">
                          {tenants.map((t) => (
                            <div key={t.id} className="flex items-center justify-between text-[11px] bg-[#252526] px-3 py-1.5 rounded">
                              <div>
                                <span className="font-bold text-white">{t.tradeName}</span>
                                <span className="text-slate-400 ml-2 font-mono">({t.email})</span>
                              </div>
                              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                                Admin Ativo: {t.taxId}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Hierarchy Level 3: Operadores / Funcionários */}
                    <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                            NÍVEL 3 • EQUIPA & OPERADORES
                          </span>
                          <span className="text-xs font-bold text-white">Caixas, Vendedores, Garçons e Farmacêuticos</span>
                        </div>
                        <span className="text-[10px] text-purple-400 font-mono">GERIDO PELO TENANT ADMIN</span>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        Cada operador acede ao POS ou módulo com o seu PIN de 4 dígitos (ex: <code>1234</code>, <code>5678</code>) atribuído pelo administrador da sua empresa no separador <strong>RH & Equipa</strong>.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. LEAF: CAPABILITIES & FEATURE FLAGS */}
                {activeLeafId === 'modules_flags' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase">Matriz de Feature Flags & Módulos</h3>
                        <p className="text-[11px] text-slate-400">Ativação granular por tenant</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse font-mono">
                        <thead>
                          <tr className="border-b border-[#2d2d2d] text-slate-400 text-[10px] uppercase">
                            <th className="py-2 px-2">Tenant</th>
                            <th className="py-2 px-2 text-center">POS Touch</th>
                            <th className="py-2 px-2 text-center">Fiscal AGT</th>
                            <th className="py-2 px-2 text-center">BOM / Receitas</th>
                            <th className="py-2 px-2 text-center">Contab. PGC</th>
                            <th className="py-2 px-2 text-center">Tesouraria</th>
                            <th className="py-2 px-2 text-center">IA Engine</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d2d2d]">
                          {tenants.map((t) => (
                            <tr key={t.id} className="hover:bg-[#252526]">
                              <td className="py-2 px-2 font-bold text-white">{t.tradeName}</td>
                              {(
                                [
                                  'posEnabled',
                                  'fiscalAgtEnabled',
                                  'recipesBomEnabled',
                                  'accountingPgcEnabled',
                                  'treasuryEnabled',
                                  'aiParserEnabled',
                                ] as (keyof TenantFeatureFlags)[]
                              ).map((flag) => {
                                const val = t.featureFlags?.[flag];
                                return (
                                  <td key={flag} className="py-2 px-2 text-center">
                                    <button
                                      onClick={() => handleToggleFeatureFlag(t.id, flag, !!val)}
                                      className={`w-6 h-6 rounded inline-flex items-center justify-center font-bold text-[10px] ${
                                        val
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                                      }`}
                                    >
                                      {val ? 'ON' : 'OFF'}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 5. LEAF: SYSTEM TESTS & VERIFICATION */}
                {activeLeafId === 'system_tests' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase">Suite de Verificação do Kernel (6 Pilares)</h3>
                        <p className="text-[11px] text-slate-400">Executa testes automatizados de isolamento e integridade</p>
                      </div>
                      <button
                        onClick={handleRunTests}
                        disabled={isRunningTests}
                        className="bg-[#007acc] hover:bg-[#0062a3] text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                        <span>Executar Todos os Testes</span>
                      </button>
                    </div>

                    {testReport ? (
                      <div className="space-y-3 font-mono">
                        <div className="p-3 bg-[#252526] border border-[#3c3c3c] rounded flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400">Resultados da Execução:</span>
                            <span className="text-emerald-400 font-bold ml-2">{testReport.passed} Aprovados</span>
                            <span className="text-slate-500 mx-1.5">/</span>
                            <span className={`${testReport.failed > 0 ? 'text-rose-400' : 'text-slate-500'} font-bold`}>
                              {testReport.failed} Falhas
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{testReport.executedAt}</span>
                        </div>

                        <div className="space-y-2">
                          {testReport.results.map((r) => (
                            <div
                              key={r.id}
                              className={`p-3 rounded border text-xs ${
                                r.passed
                                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-bold">
                                  {r.passed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                                  )}
                                  <span>{r.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">{r.durationMs} ms</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">{r.description}</p>
                              <div className="mt-2 text-[10px] bg-[#181818] p-2 rounded border border-[#2d2d2d] text-slate-300">
                                {r.details}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 bg-[#252526] rounded border border-[#3c3c3c]">
                        Clique no botão acima para iniciar a verificação de conformidade do Kernel.
                      </div>
                    )}
                  </div>
                )}

                {/* 6. LEAF: AUDIT LEDGER */}
                {activeLeafId === 'audit_ledger' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase">Livro-Razão de Auditoria Imutável</h3>
                        <p className="text-[11px] text-slate-400">Append-only audit trail com estado anterior e novo</p>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono">
                      {allAuditRecords.map((aud) => (
                        <div
                          key={aud.id}
                          className="bg-[#252526] border border-[#3c3c3c] rounded p-2.5 text-xs hover:border-slate-500 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sky-400">{aud.action}</span>
                            <span className="text-[10px] text-slate-500">{aud.timestamp}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Ator: <span className="text-white">{aud.actor}</span> | Entidade: {aud.entityType} ({aud.entityId})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. LEAF: UNIVERSAL INPUT LAYER SPECIFICATION & TELEMETRY */}
                {activeLeafId === 'universal_input_spec' && (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Keyboard className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            PULSE Universal Input Layer & Command Center
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Arquitetura Agnostic de Entrada • Pipeline Normalizado • Hardware Scanner • Voz • Touch
                        </p>
                      </div>
                      <span className="text-xs text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded">
                        Device: {InputNormalizer.getInstance().detectDeviceCategory()}
                      </span>
                    </div>

                    {/* Architecture Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left: Input Hierarchy */}
                      <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3.5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-[#333] pb-2">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Hierarquia Universal por Dispositivo</span>
                        </div>
                        <pre className="text-[11px] font-mono text-cyan-300/90 leading-relaxed bg-[#181818] p-3 rounded border border-[#2d2d2d] overflow-x-auto">
{`INPUT UNIVERSAL
│
├── MOBILE
│   ├── teclado virtual
│   ├── toque
│   ├── gesto
│   ├── voz
│   └── scanner
│
├── TABLET
│   ├── toque
│   ├── teclado virtual
│   ├── teclado físico
│   └── scanner
│
├── LAPTOP
│   ├── teclado
│   ├── touchpad
│   ├── touch
│   └── scanner
│
└── DESKTOP
    ├── teclado
    ├── rato
    ├── numpad
    └── scanner`}
                        </pre>
                      </div>

                      {/* Right: Pipeline */}
                      <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3.5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-[#333] pb-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pipeline de Normalização & Execução</span>
                        </div>
                        <pre className="text-[11px] font-mono text-amber-300/90 leading-relaxed bg-[#181818] p-3 rounded border border-[#2d2d2d] overflow-x-auto">
{`QUALQUER INPUT
      ↓
INPUT NORMALIZER
      ↓
COMMAND PARSER
      ↓
INTENT
      ↓
VALIDATION
      ↓
COMMAND
      ↓
CORE`}
                        </pre>
                        <div className="p-2 rounded bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300 font-sans">
                          <strong>Regra Arquitetural:</strong> O PULSE não sabe de onde veio o comando. Todo input é normalizado para a mesma estrutura canônica.
                        </div>
                      </div>
                    </div>

                    {/* Supported Keyboards & Keys Matrix */}
                    <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3.5 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-[#333] pb-2">
                        <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mapeamento de Caracteres & Teclas Aceitas</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-[#181818] p-2.5 rounded border border-[#2d2d2d]">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Letras</span>
                          <span className="font-mono text-emerald-400 font-bold">A-Z / a-z</span>
                          <p className="text-[10px] text-slate-500 mt-1">Busca textual, comandos literais e nomes</p>
                        </div>
                        <div className="bg-[#181818] p-2.5 rounded border border-[#2d2d2d]">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Números</span>
                          <span className="font-mono text-emerald-400 font-bold">0-9</span>
                          <p className="text-[10px] text-slate-500 mt-1">Valores, quantidades, códigos e PINs</p>
                        </div>
                        <div className="bg-[#181818] p-2.5 rounded border border-[#2d2d2d]">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Símbolos</span>
                          <span className="font-mono text-emerald-400 font-bold">* # + - / = . , : ; @</span>
                          <p className="text-[10px] text-slate-500 mt-1">Sintaxes de comando e atalhos especiais</p>
                        </div>
                        <div className="bg-[#181818] p-2.5 rounded border border-[#2d2d2d]">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Atalhos & Teclas</span>
                          <span className="font-mono text-emerald-400 font-bold">Ctrl, Alt, Shift, Esc, F1-F12</span>
                          <p className="text-[10px] text-slate-500 mt-1">Navegação e ações instantâneas</p>
                        </div>
                      </div>
                    </div>

                    {/* Live Stream Telemetry of Inputs */}
                    <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#333] pb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <Scan className="w-3.5 h-3.5 text-sky-400" />
                          <span>Stream de Telemetria de Inputs Normalizados em Tempo Real</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {InputNormalizer.getInstance().getHistory().length} capturas registadas
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs">
                        {InputNormalizer.getInstance().getHistory().slice(-8).reverse().map((cmd, idx) => (
                          <div
                            key={idx}
                            className="bg-[#181818] border border-[#2d2d2d] p-2 rounded flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sky-400 font-bold">[{cmd.sourceType}]</span>
                              <span className="text-slate-300 font-semibold">"{cmd.rawInput}"</span>
                              <span className="text-slate-500">&rarr;</span>
                              <span className="text-emerald-400 font-bold">{cmd.intent}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(cmd.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* Fallback for other leaves */}
                {!['tenants_directory', 'segment_matrix', 'licenses_registry', 'modules_flags', 'system_tests', 'audit_ledger', 'universal_input_spec'].includes(
                  activeLeafId
                ) && !activeLeafId.startsWith('segment_') && (
                  <div className="p-8 text-center text-slate-500 bg-[#252526] rounded border border-[#3c3c3c]">
                    Nó selecionado: <strong className="text-white">{activeLeafId}</strong>. Operacional no Kernel.
                  </div>
                )}

              </div>
            </div>

          </div>
        )}

        {/* Personificação Modal Dialog */}
        {impersonateTarget && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] border border-amber-500/40 rounded-lg p-6 max-w-md w-full text-xs space-y-4 font-mono">
              <div className="flex items-center gap-2 text-amber-400 border-b border-[#2d2d2d] pb-2">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm text-white">Iniciar Personificação de Tenant</h4>
              </div>

              <p className="text-[11px] text-slate-400">
                Você está prestes a personificar a organização:
                <strong className="text-white block mt-1">{impersonateTarget.tradeName} ({impersonateTarget.id})</strong>
              </p>

              {impersonationError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded text-[11px]">
                  {impersonationError}
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Motivo / Justificação de Suporte</label>
                <textarea
                  value={impersonationReason}
                  onChange={(e) => setImpersonationReason(e.target.value)}
                  placeholder="Ex: Auditoria de faturas a pedido do cliente (Ticket #8491)"
                  className="w-full bg-[#252526] border border-[#3c3c3c] rounded p-2 text-white text-xs h-20 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setImpersonateTarget(null)}
                  className="px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3c3c3c] text-white rounded text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExecuteImpersonation}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs"
                >
                  Confirmar & Ingressar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tenant Provisioning & Acquisition Wizard */}
        <TenantProvisioningWizard
          isOpen={showProvisioningWizard}
          onClose={() => setShowProvisioningWizard(false)}
          initialSegment={provisioningSegment}
          onTenantProvisioned={(newTenantId) => {
            setTenants(orchestrator.getAllTenants());
            setSelectedTenantForSegment(newTenantId);
            onTenantSwitch(newTenantId);
          }}
        />

      </div>
    </div>
  );
};
