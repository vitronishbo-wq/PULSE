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
  RefreshCw,
  Zap,
  Keyboard,
  Mic,
  DollarSign,
  Landmark,
  Globe,
  Coins,
  Percent,
  Sliders,
  Users,
  Activity,
  CreditCard,
  FileText,
  History,
  Tag,
  ArrowRight,
  Shield,
  Monitor,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  TenantProfile,
  User,
  BusinessSegment,
} from '../types/pulse';
import { Orchestrator } from '../engines/Orchestrator';
import { TenantProvisioningWizard } from './TenantProvisioningWizard';

// Modular Sections for all 12 Roots
import { AdminTenantsSection } from './admin/AdminTenantsSection';
import { AdminProvisioningSection } from './admin/AdminProvisioningSection';
import { AdminLicensesSection } from './admin/AdminLicensesSection';
import { AdminModulesSection } from './admin/AdminModulesSection';
import { AdminBillingSection } from './admin/AdminBillingSection';
import { AdminSettlementsSection } from './admin/AdminSettlementsSection';
import { AdminTelemetrySection } from './admin/AdminTelemetrySection';
import { AdminAuditSection } from './admin/AdminAuditSection';
import { AdminDiagnosticsSection } from './admin/AdminDiagnosticsSection';
import { AdminInputUniversalSection } from './admin/AdminInputUniversalSection';
import { AdminPlatformConfigSection } from './admin/AdminPlatformConfigSection';
import { AdminOperationsSection } from './admin/AdminOperationsSection';

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

  // VS Code Hierarchical Tree State: 12 Roots
  const [rootExpanded, setRootExpanded] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '01_tenants': true,
    '02_profiles_provisioning': true,
    '03_licenses_matrix': false,
    '04_capabilities_flags': false,
    '05_billing_pricing': false,
    '06_payments_settlements': false,
    '07_telemetry_usage': false,
    '08_eventbus_audit': false,
    '09_diagnostics_tests': false,
    '10_input_universal': false,
    '11_platform_configuration': false,
    '12_platform_operations': false,
  });

  const [activeLeafId, setActiveLeafId] = useState<string>('tenants_directory');
  const [treeSearch, setTreeSearch] = useState('');

  // Tenants Data
  const [tenants, setTenants] = useState<TenantProfile[]>(orchestrator.getAllTenants());

  // Impersonation modal state
  const [impersonateTarget, setImpersonateTarget] = useState<TenantProfile | null>(null);
  const [impersonationReason, setImpersonationReason] = useState('');
  const [impersonationError, setImpersonationError] = useState('');

  // Provisioning Wizard modal state
  const [showProvisioningWizard, setShowProvisioningWizard] = useState(false);
  const [provisioningSegment, setProvisioningSegment] = useState<BusinessSegment>('RESTAURANT_BAR');

  if (!isOpen) return null;

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const expandAll = () => {
    setRootExpanded(true);
    setExpandedNodes({
      '01_tenants': true,
      '02_profiles_provisioning': true,
      '03_licenses_matrix': true,
      '04_capabilities_flags': true,
      '05_billing_pricing': true,
      '06_payments_settlements': true,
      '07_telemetry_usage': true,
      '08_eventbus_audit': true,
      '09_diagnostics_tests': true,
      '10_input_universal': true,
      '11_platform_configuration': true,
      '12_platform_operations': true,
    });
  };

  const collapseAll = () => {
    setExpandedNodes({
      '01_tenants': false,
      '02_profiles_provisioning': false,
      '03_licenses_matrix': false,
      '04_capabilities_flags': false,
      '05_billing_pricing': false,
      '06_payments_settlements': false,
      '07_telemetry_usage': false,
      '08_eventbus_audit': false,
      '09_diagnostics_tests': false,
      '10_input_universal': false,
      '11_platform_configuration': false,
      '12_platform_operations': false,
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

  const handleRefreshData = () => {
    setTenants(orchestrator.getAllTenants());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-[#2d2d2d] rounded-lg shadow-2xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden font-mono">
        
        {/* TOP BAR / TITLE BAR */}
        <div className="bg-[#1f1f1f] border-b border-[#2d2d2d] px-4 py-2.5 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200 tracking-wider">
              PULSE.OS // PLATFORM SAAS CONTROL PLANE [ROOT GOVERNANCE]
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
              ULCE v2.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            {orchestrator.isImpersonating() && (
              <div className="flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded text-[11px] font-sans animate-pulse">
                <span>PERSONIFICANDO: <strong>{orchestrator.getActiveTenant().tradeName}</strong></span>
                <button
                  onClick={handleEndCurrentImpersonation}
                  className="bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded text-[10px] hover:bg-amber-400"
                >
                  Encerrar
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-[#2d2d2d] rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* STAGE 1: DIALPAD GATEWAY */}
        {stage === 'DIALPAD' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
            <div className="text-center space-y-2 max-w-md">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Acesso Restrito ao Kernel da Plataforma
              </h2>
              <p className="text-xs text-slate-400">
                Introduza o código universal de administração (*#7668#) ou PIN de fundação.
              </p>
            </div>

            {/* Display Screen */}
            <div className="w-64 bg-[#111] border border-[#333] rounded p-3 text-center">
              <span className="font-mono text-lg text-emerald-400 tracking-widest min-h-7 inline-block">
                {dialpadInput ? dialpadInput.replace(/./g, '•') : '----'}
              </span>
            </div>

            {/* Dialpad Matrix */}
            <div className="grid grid-cols-3 gap-2 w-64">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDialpadPress(digit)}
                  className="h-12 bg-[#252526] hover:bg-[#333] text-slate-200 font-mono text-base font-bold rounded border border-[#3c3c3c] active:scale-95 transition-all shadow-sm flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDialpadInput('')}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Limpar
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => {
                  setDialpadInput('*#7668#');
                  setStage('AUTH_CHALLENGE');
                }}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Atalho Fundador (*#7668#)
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: 3-FACTOR AUTH CHALLENGE */}
        {stage === 'AUTH_CHALLENGE' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="bg-[#202020] border border-[#333] rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#2d2d2d] pb-3">
                <Fingerprint className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">Autenticação Mestra de Plataforma</h3>
                  <p className="text-[11px] text-slate-400">Super-Admin MFA Verification Challenge</p>
                </div>
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthenticate} className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">E-mail de Administrador</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-[#181818] border border-[#3c3c3c] rounded p-2 text-white font-mono focus:outline-none focus:border-[#007acc]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Senha Mestra / PIN de Fundação</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-[#181818] border border-[#3c3c3c] rounded p-2 text-white font-mono focus:outline-none focus:border-[#007acc]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Dica de ambiente demo: 135790</span>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Código MFA TOTP (6 Dígitos)</label>
                  <input
                    type="text"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder="948201"
                    maxLength={6}
                    className="w-full bg-[#181818] border border-[#3c3c3c] rounded p-2 text-emerald-400 font-mono tracking-widest text-center text-sm focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStage('DIALPAD')}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Voltar ao Dialpad
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded transition-colors text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validar & Ingressar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STAGE 3: FULL SAAS CONTROL PLANE (VS CODE TREE ARCHITECTURE) */}
        {stage === 'CONTROL_PLANE' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT SIDEBAR: Deeply Collapsible VS Code Explorer */}
            <div className="w-80 bg-[#181818] border-r border-[#2d2d2d] flex flex-col select-none shrink-0">
              
              {/* Explorer Header & Controls */}
              <div className="p-2 border-b border-[#2d2d2d] flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>EXPLORADOR DO KERNEL</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={expandAll}
                    title="Expandir Todas as Camadas"
                    className="p-1 hover:bg-[#252526] rounded text-slate-400 hover:text-white text-[10px]"
                  >
                    [+]
                  </button>
                  <button
                    onClick={collapseAll}
                    title="Recolher Todas as Camadas"
                    className="p-1 hover:bg-[#252526] rounded text-slate-400 hover:text-white text-[10px]"
                  >
                    [-]
                  </button>
                </div>
              </div>

              {/* Tree Quick Filter */}
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

              {/* Hierarchical Tree View: All 12 Roots */}
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
                      
                      {/* ROOT 01: TENANTS */}
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
                            {[
                              { id: 'tenants_directory', name: 'tenants_directory.json', icon: FileCode },
                              { id: 'active_context', name: 'active_tenant.context', icon: Zap },
                              { id: 'tenant_profile', name: 'tenant_profile', icon: Building2 },
                              { id: 'tenant_status', name: 'tenant_status', icon: Activity },
                              { id: 'tenant_impersonation', name: 'tenant_impersonation', icon: Key },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 02: PROFILES & PROVISIONING */}
                      <div>
                        <div
                          onClick={() => toggleNode('02_profiles_provisioning')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['02_profiles_provisioning'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] font-semibold">02_PROFILES_PROVISIONING</span>
                        </div>

                        {expandedNodes['02_profiles_provisioning'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'business_profiles', name: 'business_profiles.table', icon: Layers },
                              { id: 'acquisition_flow', name: 'new_tenant_acquisition.flow', icon: Sparkles },
                              { id: 'provisioning_status', name: 'provisioning_status', icon: CheckCircle2 },
                              { id: 'profile_change_requests', name: 'profile_change_requests', icon: ArrowRight },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 03: LICENSES MATRIX */}
                      <div>
                        <div
                          onClick={() => toggleNode('03_licenses_matrix')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['03_licenses_matrix'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Key className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-[11px] font-semibold">03_LICENSES_MATRIX</span>
                        </div>

                        {expandedNodes['03_licenses_matrix'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'rsa_licenses', name: 'rsa_licenses.key', icon: Key },
                              { id: 'credentials_rbac', name: 'auth_credentials.rbac', icon: Lock },
                              { id: 'plans', name: 'plans', icon: Layers },
                              { id: 'subscriptions', name: 'subscriptions', icon: Clock },
                              { id: 'renewals', name: 'renewals', icon: RefreshCw },
                              { id: 'suspension_expiration', name: 'suspension_expiration', icon: ShieldAlert },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 04: CAPABILITIES FLAGS */}
                      <div>
                        <div
                          onClick={() => toggleNode('04_capabilities_flags')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['04_capabilities_flags'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="text-[11px] font-semibold">04_CAPABILITIES_FLAGS</span>
                        </div>

                        {expandedNodes['04_capabilities_flags'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'feature_flags', name: 'feature_flags.matrix', icon: FileCode },
                              { id: 'module_catalog', name: 'module_catalog', icon: Layers },
                              { id: 'module_dependencies', name: 'module_dependencies', icon: ArrowRight },
                              { id: 'module_pricing', name: 'module_pricing', icon: Tag },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 05: BILLING PRICING */}
                      <div>
                        <div
                          onClick={() => toggleNode('05_billing_pricing')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['05_billing_pricing'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] font-semibold">05_BILLING_PRICING</span>
                        </div>

                        {expandedNodes['05_billing_pricing'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'pricing_matrix', name: 'pricing_matrix', icon: DollarSign },
                              { id: 'subscription_billing', name: 'subscription_billing', icon: RefreshCw },
                              { id: 'invoices', name: 'invoices', icon: FileText },
                              { id: 'payment_status', name: 'payment_status', icon: Clock },
                              { id: 'billing_history', name: 'billing_history', icon: History },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 06: PAYMENTS & SETTLEMENTS */}
                      <div>
                        <div
                          onClick={() => toggleNode('06_payments_settlements')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['06_payments_settlements'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Landmark className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-semibold">06_PAYMENTS_SETTLEMENTS</span>
                        </div>

                        {expandedNodes['06_payments_settlements'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'payment_methods', name: 'payment_methods', icon: CreditCard },
                              { id: 'payment_transactions', name: 'payment_transactions', icon: DollarSign },
                              { id: 'settlements', name: 'settlements', icon: Landmark },
                              { id: 'platform_fees', name: 'platform_fees', icon: Percent },
                              { id: 'tenant_payouts', name: 'tenant_payouts', icon: Landmark },
                              { id: 'reconciliation', name: 'reconciliation', icon: CheckCircle2 },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 07: TELEMETRY USAGE */}
                      <div>
                        <div
                          onClick={() => toggleNode('07_telemetry_usage')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['07_telemetry_usage'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <BarChart3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span className="text-[11px] font-semibold">07_TELEMETRY_USAGE</span>
                        </div>

                        {expandedNodes['07_telemetry_usage'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'platform_usage', name: 'platform_usage.telemetry', icon: FileCode },
                              { id: 'tenant_usage', name: 'tenant_usage', icon: Building2 },
                              { id: 'module_usage', name: 'module_usage', icon: Server },
                              { id: 'transaction_volume', name: 'transaction_volume', icon: BarChart3 },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 08: EVENTBUS AUDIT */}
                      <div>
                        <div
                          onClick={() => toggleNode('08_eventbus_audit')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['08_eventbus_audit'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          <span className="text-[11px] font-semibold">08_EVENTBUS_AUDIT</span>
                        </div>

                        {expandedNodes['08_eventbus_audit'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'eventbus_stream', name: 'eventbus_stream.log', icon: FileCode },
                              { id: 'immutable_ledger', name: 'immutable_audit.ledger', icon: Lock },
                              { id: 'security_events', name: 'security_events', icon: Shield },
                              { id: 'config_changes', name: 'configuration_changes', icon: History },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 09: DIAGNOSTICS TESTS */}
                      <div>
                        <div
                          onClick={() => toggleNode('09_diagnostics_tests')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['09_diagnostics_tests'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Play className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="text-[11px] font-semibold">09_DIAGNOSTICS_TESTS</span>
                        </div>

                        {expandedNodes['09_diagnostics_tests'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'test_runner', name: 'kernel_test_runner.spec', icon: Play },
                              { id: 'system_health', name: 'system_health', icon: Activity },
                              { id: 'failed_jobs', name: 'failed_jobs', icon: AlertTriangle },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 10: INPUT UNIVERSAL */}
                      <div>
                        <div
                          onClick={() => toggleNode('10_input_universal')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['10_input_universal'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Keyboard className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-[11px] font-semibold">10_INPUT_UNIVERSAL</span>
                        </div>

                        {expandedNodes['10_input_universal'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'input_pipeline', name: 'input_pipeline.spec', icon: FileCode },
                              { id: 'command_registry', name: 'command_registry', icon: Terminal },
                              { id: 'voice_input', name: 'voice_input', icon: Mic },
                              { id: 'keyboard_shortcuts', name: 'keyboard_shortcuts', icon: Keyboard },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 11: PLATFORM CONFIGURATION */}
                      <div>
                        <div
                          onClick={() => toggleNode('11_platform_configuration')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['11_platform_configuration'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-[11px] font-semibold">11_PLATFORM_CONFIGURATION</span>
                        </div>

                        {expandedNodes['11_platform_configuration'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'countries', name: 'countries', icon: Globe },
                              { id: 'currencies', name: 'currencies', icon: Coins },
                              { id: 'fiscal_profiles', name: 'fiscal_profiles', icon: ShieldCheck },
                              { id: 'tax_rules', name: 'tax_rules', icon: Percent },
                              { id: 'payment_providers', name: 'payment_providers', icon: CreditCard },
                              { id: 'document_types', name: 'document_types', icon: FileText },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ROOT 12: PLATFORM OPERATIONS */}
                      <div>
                        <div
                          onClick={() => toggleNode('12_platform_operations')}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#2d2d2d] cursor-pointer text-slate-300"
                        >
                          {expandedNodes['12_platform_operations'] ? (
                            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span className="text-[11px] font-semibold">12_PLATFORM_OPERATIONS</span>
                        </div>

                        {expandedNodes['12_platform_operations'] && (
                          <div className="pl-3 border-l border-[#333333] ml-2 space-y-0.5">
                            {[
                              { id: 'administrators', name: 'administrators', icon: Users },
                              { id: 'roles_permissions', name: 'roles_permissions', icon: Lock },
                              { id: 'sessions', name: 'sessions', icon: Monitor },
                              { id: 'security_policies', name: 'security_policies', icon: Shield },
                              { id: 'system_settings', name: 'system_settings', icon: Sliders },
                            ].map((leaf) => (
                              <button
                                key={leaf.id}
                                onClick={() => setActiveLeafId(leaf.id)}
                                className={`w-full text-left flex items-center gap-2 px-2 py-1 rounded text-[11px] ${
                                  activeLeafId === leaf.id
                                    ? 'bg-[#04395e] text-white font-semibold'
                                    : 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
                                }`}
                              >
                                <leaf.icon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{leaf.name}</span>
                              </button>
                            ))}
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

                {/* 1. ROOT 01: TENANTS */}
                {['tenants_directory', 'active_context', 'tenant_profile', 'tenant_status', 'tenant_impersonation'].includes(
                  activeLeafId
                ) && (
                  <AdminTenantsSection
                    leafId={activeLeafId}
                    tenants={tenants}
                    activeTenantId={orchestrator.activeTenantId}
                    currentUser={currentUser}
                    onTenantSwitch={(id) => {
                      onTenantSwitch(id);
                      setTenants(orchestrator.getAllTenants());
                    }}
                    onImpersonate={(t) => setImpersonateTarget(t)}
                    onRefresh={handleRefreshData}
                  />
                )}

                {/* 2. ROOT 02: PROFILES & PROVISIONING */}
                {['business_profiles', 'acquisition_flow', 'provisioning_status', 'profile_change_requests', 'segment_matrix'].includes(
                  activeLeafId
                ) && (
                  <AdminProvisioningSection
                    leafId={activeLeafId === 'segment_matrix' ? 'business_profiles' : activeLeafId}
                    tenants={tenants}
                    currentUser={currentUser}
                    onOpenProvisioningWizard={(seg) => {
                      setProvisioningSegment(seg);
                      setShowProvisioningWizard(true);
                    }}
                    onRefresh={handleRefreshData}
                  />
                )}

                {/* 3. ROOT 03: LICENSES MATRIX */}
                {['rsa_licenses', 'credentials_rbac', 'plans', 'subscriptions', 'renewals', 'suspension_expiration', 'licenses_registry', 'credentials_hierarchy'].includes(
                  activeLeafId
                ) && (
                  <AdminLicensesSection
                    leafId={
                      activeLeafId === 'licenses_registry'
                        ? 'rsa_licenses'
                        : activeLeafId === 'credentials_hierarchy'
                        ? 'credentials_rbac'
                        : activeLeafId
                    }
                    tenants={tenants}
                    currentUser={currentUser}
                    onRefresh={handleRefreshData}
                  />
                )}

                {/* 4. ROOT 04: CAPABILITIES FLAGS */}
                {['feature_flags', 'module_catalog', 'module_dependencies', 'module_pricing', 'modules_flags'].includes(
                  activeLeafId
                ) && (
                  <AdminModulesSection
                    leafId={activeLeafId === 'modules_flags' ? 'feature_flags' : activeLeafId}
                    tenants={tenants}
                    currentUser={currentUser}
                    onRefresh={handleRefreshData}
                  />
                )}

                {/* 5. ROOT 05: BILLING PRICING */}
                {['pricing_matrix', 'subscription_billing', 'invoices', 'payment_status', 'billing_history'].includes(
                  activeLeafId
                ) && (
                  <AdminBillingSection
                    leafId={activeLeafId}
                    tenants={tenants}
                    currentUser={currentUser}
                    onRefresh={handleRefreshData}
                  />
                )}

                {/* 6. ROOT 06: PAYMENTS & SETTLEMENTS */}
                {['payment_methods', 'payment_transactions', 'settlements', 'platform_fees', 'tenant_payouts', 'reconciliation'].includes(
                  activeLeafId
                ) && (
                  <AdminSettlementsSection
                    leafId={activeLeafId}
                    tenants={tenants}
                    currentUser={currentUser}
                    onRefresh={handleRefreshData}
                  />
                )}

                {/* 7. ROOT 07: TELEMETRY USAGE */}
                {['platform_usage', 'tenant_usage', 'module_usage', 'transaction_volume', 'usage_metrics'].includes(
                  activeLeafId
                ) && (
                  <AdminTelemetrySection
                    leafId={activeLeafId === 'usage_metrics' ? 'platform_usage' : activeLeafId}
                    tenants={tenants}
                  />
                )}

                {/* 8. ROOT 08: EVENTBUS AUDIT */}
                {['eventbus_stream', 'immutable_ledger', 'security_events', 'config_changes', 'event_bus_journal', 'audit_ledger'].includes(
                  activeLeafId
                ) && (
                  <AdminAuditSection
                    leafId={
                      activeLeafId === 'event_bus_journal'
                        ? 'eventbus_stream'
                        : activeLeafId === 'audit_ledger'
                        ? 'immutable_ledger'
                        : activeLeafId
                    }
                    tenants={tenants}
                  />
                )}

                {/* 9. ROOT 09: DIAGNOSTICS TESTS */}
                {['test_runner', 'system_health', 'failed_jobs', 'system_tests', 'error_logs'].includes(
                  activeLeafId
                ) && (
                  <AdminDiagnosticsSection
                    leafId={activeLeafId === 'system_tests' ? 'test_runner' : activeLeafId}
                  />
                )}

                {/* 10. ROOT 10: INPUT UNIVERSAL */}
                {['input_pipeline', 'command_registry', 'voice_input', 'keyboard_shortcuts', 'universal_input_spec'].includes(
                  activeLeafId
                ) && (
                  <AdminInputUniversalSection
                    leafId={activeLeafId === 'universal_input_spec' ? 'input_pipeline' : activeLeafId}
                  />
                )}

                {/* 11. ROOT 11: PLATFORM CONFIGURATION */}
                {['countries', 'currencies', 'fiscal_profiles', 'tax_rules', 'payment_providers', 'document_types'].includes(
                  activeLeafId
                ) && (
                  <AdminPlatformConfigSection
                    leafId={activeLeafId}
                  />
                )}

                {/* 12. ROOT 12: PLATFORM OPERATIONS */}
                {['administrators', 'roles_permissions', 'sessions', 'security_policies', 'system_settings'].includes(
                  activeLeafId
                ) && (
                  <AdminOperationsSection
                    leafId={activeLeafId}
                  />
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
            onTenantSwitch(newTenantId);
          }}
        />

      </div>
    </div>
  );
};
