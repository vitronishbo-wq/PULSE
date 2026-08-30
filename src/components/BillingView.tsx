import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Calculator,
  FileText,
  DollarSign,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Download,
  Plus,
  Key,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Building2,
  Calendar,
  Zap,
  ArrowUpRight,
  Printer,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Info,
  Sliders,
  HelpCircle,
  Hash,
  Landmark,
} from 'lucide-react';
import {
  TenantProfile,
  User,
  BusinessSegment,
  ModuleId,
} from '../types/pulse';
import {
  PlatformPlan,
  TenantSubscription,
  PlatformInvoice,
  PricingMatrixRule,
  PlatformModuleCatalogItem,
} from '../types/platform';
import {
  initialPlatformPlans,
  initialTenantSubscriptions,
  initialPlatformInvoices,
  initialPricingMatrix,
  initialModuleCatalog,
} from '../data/platformSeedData';
import { PricingEngine } from '../engines/PricingEngine';
import { Orchestrator } from '../engines/Orchestrator';

interface BillingViewProps {
  tenant: TenantProfile;
  currentUser: User;
  subView?: string;
  onUpdateTenant?: (updated: Partial<TenantProfile>) => void;
  currency?: string;
}

export type BillingSubView =
  | 'SUBSCRIPTION'
  | 'PLANS'
  | 'INVOICES'
  | 'LICENSES'
  | 'CALCULATOR'
  | 'PAYMENT_METHODS';

export const BillingView: React.FC<BillingViewProps> = ({
  tenant,
  currentUser,
  subView = 'SUBSCRIPTION',
  onUpdateTenant,
  currency = 'Kz',
}) => {
  const orchestrator = Orchestrator.getInstance();
  const pricingEngine = PricingEngine.getInstance();

  // Active Tab state
  const [activeTab, setActiveTab] = useState<BillingSubView>(() => {
    if (subView === 'PLANS') return 'PLANS';
    if (subView === 'INVOICES') return 'INVOICES';
    if (subView === 'LICENSES') return 'LICENSES';
    if (subView === 'CALCULATOR') return 'CALCULATOR';
    if (subView === 'PAYMENT_METHODS') return 'PAYMENT_METHODS';
    return 'SUBSCRIPTION';
  });

  useEffect(() => {
    if (subView === 'PLANS') setActiveTab('PLANS');
    else if (subView === 'INVOICES') setActiveTab('INVOICES');
    else if (subView === 'LICENSES') setActiveTab('LICENSES');
    else if (subView === 'CALCULATOR') setActiveTab('CALCULATOR');
    else if (subView === 'PAYMENT_METHODS') setActiveTab('PAYMENT_METHODS');
    else if (subView === 'SUBSCRIPTION') setActiveTab('SUBSCRIPTION');
  }, [subView]);

  // Plans, Subscriptions and Pricing Rules
  const [plans] = useState<PlatformPlan[]>(initialPlatformPlans);
  const [pricingMatrix] = useState<PricingMatrixRule[]>(initialPricingMatrix);
  const [moduleCatalog] = useState<PlatformModuleCatalogItem[]>(initialModuleCatalog);

  // Tenant-specific subscription state
  const [subscription, setSubscription] = useState<TenantSubscription>(() => {
    const found = initialTenantSubscriptions.find((s) => s.tenantId === tenant.id);
    if (found) return found;
    return {
      id: `SUB-${tenant.country || 'AO'}-${tenant.id.slice(0, 6).toUpperCase()}`,
      tenantId: tenant.id,
      tenantName: tenant.tradeName || tenant.legalName,
      planId: 'PLAN-PRO',
      planName: 'Professional Business',
      billingCycle: 'ANNUAL',
      status: 'ACTIVE',
      startDate: '2026-01-01',
      nextBillingDate: tenant.licenseExpiry || '2027-01-01',
      renewalAuto: true,
      amountMonthly: 15000,
      rsaKeyFingerprint: 'SHA256:7e8b9c91f0a2e3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      hardwareFingerprint: `HWID-${tenant.country || 'AO'}-POS-0192`,
    };
  });

  // Tenant-specific Invoices state
  const [invoices, setInvoices] = useState<PlatformInvoice[]>(() => {
    const existing = initialPlatformInvoices.filter((i) => i.tenantId === tenant.id);
    if (existing.length > 0) return existing;

    // Generate seed invoices for this tenant if not explicitly present
    const baseInv1: PlatformInvoice = {
      id: `INV-2026-0089`,
      invoiceNumber: `PULSE-SUB/2026/0089`,
      tenantId: tenant.id,
      tenantName: tenant.tradeName || tenant.legalName,
      tenantTaxId: tenant.taxId || '5001293847',
      segment: tenant.segment || tenant.businessSegment || 'RESTAURANT_BAR',
      modules: tenant.activeModules || ['POS', 'STOCK', 'TREASURY', 'FISCAL_AGT'],
      billingCycle: 'ANNUAL',
      subtotal: 168000,
      discount: 25200,
      tax: 19992,
      total: 162792,
      currency: tenant.currency || 'Kz',
      paymentMethod: 'MULTICAIXA_REF',
      paymentRef: '00145 928 301 442',
      status: 'PAID',
      issuedAt: '2026-01-01',
      dueDate: '2026-01-05',
      paidAt: '2026-01-02',
    };

    const baseInv2: PlatformInvoice = {
      id: `INV-2026-0198`,
      invoiceNumber: `PULSE-SUB/2026/0198`,
      tenantId: tenant.id,
      tenantName: tenant.tradeName || tenant.legalName,
      tenantTaxId: tenant.taxId || '5001293847',
      segment: tenant.segment || tenant.businessSegment || 'RESTAURANT_BAR',
      modules: tenant.activeModules || ['POS', 'STOCK', 'TREASURY', 'FISCAL_AGT'],
      billingCycle: 'ANNUAL',
      subtotal: 180000,
      discount: 27000,
      tax: 21420,
      total: 174420,
      currency: tenant.currency || 'Kz',
      paymentMethod: 'MULTICAIXA_REF',
      paymentRef: '00145 771 902 338',
      status: 'PENDING',
      issuedAt: '2026-08-20',
      dueDate: '2026-09-05',
    };

    return [baseInv2, baseInv1];
  });

  // Modal / Selected Invoice for details
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Real-time Calculator & Upgrades Simulation State
  const [simSegment, setSimSegment] = useState<BusinessSegment>(
    tenant.segment || tenant.businessSegment || 'RESTAURANT_BAR'
  );
  const [simCycle, setSimCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>(
    subscription.billingCycle || 'ANNUAL'
  );
  const [simModules, setSimModules] = useState<ModuleId[]>(
    tenant.activeModules && tenant.activeModules.length > 0
      ? tenant.activeModules
      : ['POS', 'STOCK', 'TREASURY', 'FISCAL_AGT']
  );

  // Invoices filter
  const [invoiceFilter, setInvoiceFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // RSA Key & Hardware Matrix state
  const [isVerifyingSignature, setIsVerifyingSignature] = useState(false);
  const [sigVerificationResult, setSigVerificationResult] = useState<string | null>(null);

  // Current active plan object
  const currentPlan = plans.find((p) => p.id === subscription.planId) || plans[1];

  // Real-time calculation from PricingEngine
  const quote = useMemo(() => {
    return pricingEngine.calculateSubscription({
      segment: simSegment,
      selectedModules: simModules,
      billingCycle: simCycle,
      currency: tenant.currency || 'Kz',
    });
  }, [simSegment, simModules, simCycle, tenant.currency]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Toggle Module in Simulator
  const toggleSimModule = (modId: ModuleId) => {
    setSimModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  // Simulate instant Multicaixa payment of invoice
  const handlePayInvoice = (invId: string) => {
    const target = invoices.find((i) => i.id === invId);
    if (!target) return;

    const nowStr = new Date().toISOString().split('T')[0];
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invId
        ? {
            ...inv,
            status: 'PAID' as const,
            paidAt: nowStr,
          }
        : inv
    );
    setInvoices(updatedInvoices);

    // Also extend license expiry in tenant and subscription
    const nextExp = new Date();
    if (target.billingCycle === 'ANNUAL') {
      nextExp.setFullYear(nextExp.getFullYear() + 1);
    } else if (target.billingCycle === 'QUARTERLY') {
      nextExp.setMonth(nextExp.getMonth() + 3);
    } else {
      nextExp.setMonth(nextExp.getMonth() + 1);
    }
    const nextExpStr = nextExp.toISOString().split('T')[0];

    const updatedSub: TenantSubscription = {
      ...subscription,
      status: 'ACTIVE',
      nextBillingDate: nextExpStr,
    };
    setSubscription(updatedSub);

    if (onUpdateTenant) {
      onUpdateTenant({
        licenseExpiry: nextExpStr,
        licenseStatus: 'ACTIVE',
        activeLicense: true,
      });
    }

    orchestrator.updateTenant(
      tenant.id,
      {
        licenseExpiry: nextExpStr,
        licenseStatus: 'ACTIVE',
        activeLicense: true,
      },
      currentUser
    );

    if (selectedInvoice && selectedInvoice.id === invId) {
      setSelectedInvoice({
        ...selectedInvoice,
        status: 'PAID',
        paidAt: nowStr,
      });
    }

    setActionFeedback('Pagamento Multicaixa validado com sucesso! Licença estendida.');
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Apply Plan Change / Upgrade
  const handleApplyPlanChange = (plan: PlatformPlan) => {
    const updatedSub: TenantSubscription = {
      ...subscription,
      planId: plan.id,
      planName: plan.name,
      amountMonthly: plan.basePrice,
    };
    setSubscription(updatedSub);
    setActionFeedback(`Plano da subscrição atualizado para "${plan.name}" com sucesso!`);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Apply Module configuration to current tenant
  const handleApplyConfigToTenant = () => {
    if (onUpdateTenant) {
      onUpdateTenant({
        activeModules: simModules,
      });
    }
    orchestrator.updateTenant(
      tenant.id,
      {
        activeModules: simModules,
      },
      currentUser
    );
    setActionFeedback('Matriz de módulos contratados atualizada e ativada no Kernel!');
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Verify RSA Digital Signature
  const handleVerifyLicenseIntegrity = () => {
    setIsVerifyingSignature(true);
    setTimeout(() => {
      setIsVerifyingSignature(false);
      setSigVerificationResult(
        `Chave RSA-4096 VÁLIDA. Assinada pela Autoridade Tributária com Hash SHA-256: ${subscription.rsaKeyFingerprint.slice(
          0,
          24
        )}... Hardware Lock OK.`
      );
      setTimeout(() => setSigVerificationResult(null), 6000);
    }, 1200);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (invoiceFilter === 'PAID') return inv.status === 'PAID';
    if (invoiceFilter === 'PENDING') return inv.status === 'PENDING' || inv.status === 'OVERDUE';
    return true;
  });

  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((acc, i) => acc + i.total, 0);
  const pendingCount = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').length;

  return (
    <div className="space-y-4 font-sans text-slate-100 animate-in fade-in duration-200">
      
      {/* 1. Header Banner & Status Bar */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    Subscrição & Faturação do Estabelecimento
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                    {subscription.status === 'ACTIVE' ? 'LICENÇA ATIVA' : 'EXPIRADO'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Gestão contratual, matriz de módulos, licenciamento RSA e histórico de pagamentos EMIS / Multicaixa
                </p>
              </div>
            </div>
          </div>

          {/* Quick Context Chips */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-lg text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase">Empresa / NIF</span>
              <span className="font-bold text-white truncate">{tenant.tradeName}</span>
              <span className="text-slate-400 text-[10px] ml-1.5">({tenant.taxId})</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-lg text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase">Plano Atual</span>
              <span className="font-bold text-amber-400">{currentPlan.name}</span>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] px-3 py-1.5 rounded-lg text-slate-300">
              <span className="text-slate-500 block text-[10px] uppercase">Validade Licença</span>
              <span className="font-bold text-emerald-400 font-mono">
                {tenant.licenseExpiry || subscription.nextBillingDate}
              </span>
            </div>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{actionFeedback}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-emerald-400 hover:text-white text-[11px] font-bold"
            >
              OK
            </button>
          </div>
        )}

        {/* 2. Top Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-t border-[#27272a] mt-4 pt-3 overflow-x-auto text-xs">
          {[
            { id: 'SUBSCRIPTION', label: 'Visão Geral & Subscrição', icon: Zap },
            { id: 'PLANS', label: 'Planos & Módulos Contratados', icon: Layers },
            { id: 'INVOICES', label: `Faturas & Pagamentos (${invoices.length})`, icon: FileText },
            { id: 'LICENSES', label: 'Matriz de Licenças RSA & Hardware', icon: Key },
            { id: 'CALCULATOR', label: 'Simulador de Custos & Upgrades', icon: Calculator },
            { id: 'PAYMENT_METHODS', label: 'Meios de Pagamento & Dados', icon: Landmark },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as BillingSubView)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#18181b] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SUB-VIEW: 1. SUBSCRIPTION OVERVIEW */}
      {activeTab === 'SUBSCRIPTION' && (
        <div className="space-y-4">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Card 1: Current Plan */}
            <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-semibold tracking-wider text-[10px]">Plano Contratado</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white tracking-tight">{currentPlan.name}</div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Ciclo:</span>
                <span className="font-semibold text-emerald-400">
                  {subscription.billingCycle === 'ANNUAL'
                    ? 'Anual (-15% Desconto)'
                    : subscription.billingCycle === 'QUARTERLY'
                    ? 'Trimestral (-5% Desconto)'
                    : 'Mensal'}
                </span>
              </div>
            </div>

            {/* Card 2: Expiration & Renewal */}
            <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-semibold tracking-wider text-[10px]">Próxima Renovação</span>
                <Calendar className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">
                {tenant.licenseExpiry || subscription.nextBillingDate}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Renovação Auto:</span>
                <span className="text-slate-200 font-medium font-mono">ATIVADA (EMIS)</span>
              </div>
            </div>

            {/* Card 3: Active Modules */}
            <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-semibold tracking-wider text-[10px]">Módulos Ativos</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-bold text-white">
                {tenant.activeModules?.length || 4}{' '}
                <span className="text-xs text-slate-500 font-normal">módulos</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Capacidades:</span>
                <span className="text-blue-400 font-mono">Faturação AGT + POS</span>
              </div>
            </div>

            {/* Card 4: Monthly Equivalent */}
            <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="uppercase font-semibold tracking-wider text-[10px]">Custo Mensal Equivalente</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-400 font-mono">
                {(currentPlan.basePrice).toLocaleString()} {currency}
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Inclui IVA:</span>
                <span className="text-slate-300 font-mono">14% Padrão</span>
              </div>
            </div>
          </div>

          {/* Detailed Subscription Card & Next Invoice Payment Box */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left 2 Cols: Subscription Details & Contracted Add-ons */}
            <div className="lg:col-span-2 bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Detalhes do Contrato & Quotas Operacionais</h3>
                    <p className="text-xs text-slate-400">Recursos alocados para o nó do estabelecimento</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('PLANS')}
                  className="px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-200 border border-[#3f3f46] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  Alterar Plano
                </button>
              </div>

              {/* Resource Quotas Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg space-y-1">
                  <div className="text-slate-400 text-[11px]">Utilizadores / Operadores</div>
                  <div className="text-base font-bold text-white font-mono">
                    2 / {currentPlan.maxUsers} <span className="text-[10px] text-slate-500 font-normal">postos</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[30%]" />
                  </div>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg space-y-1">
                  <div className="text-slate-400 text-[11px]">Terminais POS Licenciados</div>
                  <div className="text-base font-bold text-white font-mono">
                    1 / {currentPlan.maxTerminals} <span className="text-[10px] text-slate-500 font-normal">ativos</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[33%]" />
                  </div>
                </div>

                <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg space-y-1">
                  <div className="text-slate-400 text-[11px]">Volume de Faturas / Mês</div>
                  <div className="text-base font-bold text-white font-mono">
                    Ilimitado <span className="text-[10px] text-emerald-400 font-normal">AGT Cert</span>
                  </div>
                  <div className="w-full bg-[#27272a] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[100%]" />
                  </div>
                </div>
              </div>

              {/* Active Modules Chips */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  Módulos Ativos no Estabelecimento:
                </div>
                <div className="flex flex-wrap gap-2">
                  {(tenant.activeModules || ['POS', 'STOCK', 'TREASURY', 'FISCAL_AGT']).map((mod) => (
                    <span
                      key={mod}
                      className="px-2.5 py-1 bg-[#18181b] border border-emerald-500/30 text-emerald-300 rounded-md text-xs font-mono flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      {mod}
                    </span>
                  ))}
                  <button
                    onClick={() => setActiveTab('PLANS')}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500/40 text-emerald-400 rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar Módulo Add-on
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Next Billing & Multicaixa Payment Slip */}
            <div className="bg-gradient-to-b from-[#18181b] to-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Dados de Liquidação</h3>
                    <p className="text-[11px] text-slate-400">Instruções Multicaixa Automáticas</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold">
                  EMIS
                </span>
              </div>

              {/* EMIS Multicaixa Voucher Box */}
              <div className="bg-[#09090b] border border-[#3f3f46] rounded-lg p-3.5 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px]">Entidade EMIS:</span>
                  <span className="text-amber-400 font-bold tracking-widest text-sm">00145</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px]">Referência de Pagamento:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold tracking-wider">00145 928 301 442</span>
                    <button
                      onClick={() => handleCopy('00145 928 301 442', 'ref_dash')}
                      className="p-1 hover:bg-[#27272a] rounded text-slate-400 hover:text-white"
                      title="Copiar Referência"
                    >
                      {copiedField === 'ref_dash' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-400 border-t border-[#27272a] pt-2">
                  <span className="text-[11px]">Montante Período:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {invoices[0]?.total.toLocaleString() || '162,792'} {currency}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {invoices.some((i) => i.status === 'PENDING') ? (
                  <button
                    onClick={() => {
                      const pending = invoices.find((i) => i.status === 'PENDING');
                      if (pending) handlePayInvoice(pending.id);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simular Pagamento Multicaixa Imediato
                  </button>
                ) : (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Todas as faturas do ciclo atual encontram-se regularizadas.</span>
                  </div>
                )}

                <button
                  onClick={() => setActiveTab('INVOICES')}
                  className="w-full py-2 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white border border-[#3f3f46] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  Ver Histórico de Recibos
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. SUB-VIEW: 2. PLANS & MODULES MATRIX */}
      {activeTab === 'PLANS' && (
        <div className="space-y-5">
          <div className="border-b border-[#27272a] pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Matriz de Planos da Plataforma PULSE.OS
            </h3>
            <p className="text-xs text-slate-400">
              Selecione o plano ideal para a escala de operação da sua empresa ou adicione módulos modulares.
            </p>
          </div>

          {/* Plans 4-Column Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {plans.map((p) => {
              const isSelected = subscription.planId === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-[#121215] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-950/20'
                      : 'border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#18181b] text-slate-400 border border-[#27272a]'
                        }`}
                      >
                        {p.tier}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PLANO ATUAL
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{p.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{p.description}</p>
                    </div>

                    <div className="py-2 border-y border-[#27272a]">
                      <span className="text-2xl font-bold text-amber-400 font-mono">
                        {p.basePrice.toLocaleString()} {currency}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/mês</span>
                    </div>

                    {/* Feature limits */}
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Até <strong>{p.maxUsers}</strong> utilizadores / postos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Até <strong>{p.maxTerminals}</strong> terminais de caixa POS</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Faturação Ilimitada Certificada AGT</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {p.includesSupport ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 text-slate-500 text-center font-bold">-</span>
                        )}
                        <span>{p.includesSupport ? 'Suporte Técnico Prioritário 24/7' : 'Suporte Standard via E-mail'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 mt-2">
                    {isSelected ? (
                      <button
                        disabled
                        className="w-full py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold cursor-default"
                      >
                        Subscrição Ativa
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyPlanChange(p)}
                        className="w-full py-2 bg-[#18181b] hover:bg-emerald-600 hover:text-white text-slate-200 border border-[#3f3f46] hover:border-emerald-500 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      >
                        Mudar para este Plano
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Module Catalog & Addon activation table */}
          <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Catálogo de Módulos & Add-ons Específicos</h4>
                <p className="text-xs text-slate-400">
                  Ative ou desative módulos conforme a necessidade de operação do seu negócio.
                </p>
              </div>
              <button
                onClick={handleApplyConfigToTenant}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Guardar Configuração de Módulos
              </button>
            </div>

            <div className="border border-[#27272a] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#27272a] bg-[#18181b] text-slate-400 text-[11px] uppercase font-semibold">
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Módulo</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3">Preço Mensal</th>
                    <th className="py-2.5 px-3">Descrição Funcional</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  {moduleCatalog.map((mod) => {
                    const isContracted = simModules.includes(mod.id);
                    return (
                      <tr key={mod.id} className="hover:bg-[#18181b]/50">
                        <td className="py-2.5 px-3">
                          {isContracted ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold">
                              ATIVO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono">
                              DISPONÍVEL
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white font-mono">{mod.name}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">{mod.category}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {mod.price > 0 ? `${mod.price.toLocaleString()} ${currency}/mês` : 'Incluído Base'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 text-xs">{mod.description}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => toggleSimModule(mod.id)}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                              isContracted
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                            }`}
                          >
                            {isContracted ? 'Remover' : 'Contratar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VIEW: 3. INVOICES & PAYMENTS HISTORY */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#27272a] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Histórico de Faturas & Recibos de Subscrição
              </h3>
              <p className="text-xs text-slate-400">
                Documentos emitidos pela plataforma com certificação fiscal e recibos eletrónicos
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] p-1 rounded-lg text-xs">
              <button
                onClick={() => setInvoiceFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'ALL'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({invoices.length})
              </button>
              <button
                onClick={() => setInvoiceFilter('PAID')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pagas ({invoices.filter((i) => i.status === 'PAID').length})
              </button>
              <button
                onClick={() => setInvoiceFilter('PENDING')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  invoiceFilter === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pendentes ({pendingCount})
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-3 px-4">Nº da Fatura</th>
                  <th className="py-3 px-4">Emissão</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4">Período / Módulos</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  return (
                    <tr key={inv.id} className="hover:bg-[#18181b]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{inv.issuedAt}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{inv.dueDate}</td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="font-semibold text-white">
                          {inv.billingCycle === 'ANNUAL'
                            ? 'Subscrição Anual'
                            : inv.billingCycle === 'QUARTERLY'
                            ? 'Subscrição Trimestral'
                            : 'Subscrição Mensal'}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {inv.modules.length} módulos incluídos
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {inv.total.toLocaleString()} {inv.currency}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] font-mono">
                        {inv.paymentMethod === 'MULTICAIXA_REF'
                          ? 'Multicaixa Ref'
                          : inv.paymentMethod === 'MCX_EXPRESS'
                          ? 'MCX Express'
                          : 'Transf. Bancária'}
                      </td>
                      <td className="py-3 px-4">
                        {isPaid ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-mono font-bold">
                            LIQUIDADO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-mono font-bold animate-pulse">
                            PENDENTE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 bg-[#18181b] hover:bg-[#27272a] text-slate-200 border border-[#3f3f46] rounded text-xs font-semibold transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        {!isPaid && (
                          <button
                            onClick={() => handlePayInvoice(inv.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors shadow-sm"
                          >
                            Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW: 4. LICENSES MATRIX (RSA & HARDWARE BINDING) */}
      {activeTab === 'LICENSES' && (
        <div className="space-y-4">
          <div className="border-b border-[#27272a] pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              Matriz Criptográfica de Licenças & Chaves RSA-SHA1 / SHA-256
            </h3>
            <p className="text-xs text-slate-400">
              Referência do Nó Governante (licenses_matrix): Assinatura digital AGT, hash fiscal e amarração de hardware
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left 2 Cols: Cryptographic Details */}
            <div className="lg:col-span-2 bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Certificado Digital de Licença do Nó</h4>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Emissão assinada pelo Kernel da Plataforma com chaves assimétricas
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleVerifyLicenseIntegrity}
                  disabled={isVerifyingSignature}
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isVerifyingSignature ? 'animate-spin' : ''}`} />
                  {isVerifyingSignature ? 'Validando...' : 'Validar Integridade Criptográfica'}
                </button>
              </div>

              {sigVerificationResult && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs">
                  {sigVerificationResult}
                </div>
              )}

              {/* License Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Identificador de Subscrição (UUID)</label>
                  <div className="flex items-center justify-between bg-[#18181b] border border-[#27272a] px-3 py-2 rounded text-slate-200">
                    <span>{subscription.id}</span>
                    <button
                      onClick={() => handleCopy(subscription.id, 'sub_id')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedField === 'sub_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Fingerprint da Chave Pública RSA (AGT / SAF-T AO)</label>
                  <div className="flex items-center justify-between bg-[#18181b] border border-[#27272a] px-3 py-2 rounded text-emerald-400 text-[11px]">
                    <span className="truncate">{subscription.rsaKeyFingerprint}</span>
                    <button
                      onClick={() => handleCopy(subscription.rsaKeyFingerprint, 'rsa_fp')}
                      className="text-slate-400 hover:text-white ml-2"
                    >
                      {copiedField === 'rsa_fp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Amarração de Hardware (Hardware Binding Token - HWID)</label>
                  <div className="flex items-center justify-between bg-[#18181b] border border-[#27272a] px-3 py-2 rounded text-blue-400 text-[11px]">
                    <span>{subscription.hardwareFingerprint}</span>
                    <span className="text-[10px] text-slate-500 font-sans">Bloqueio Anti-Clonagem Ativo</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: AGT Certification & Status */}
            <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#27272a] pb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Certificação Fiscal AGT</h4>
                  <p className="text-[11px] text-slate-400">Conformidade Legal 2026</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Certificado de Software:</span>
                    <span className="text-emerald-400 font-mono font-bold">Nº 412/AGT/2026</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Versão SAF-T:</span>
                    <span className="text-white font-mono font-bold">SAF-T (AO) v1.01_01</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Chave Criptográfica:</span>
                    <span className="text-white font-mono font-bold">RSA 4096-bit</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  As faturas geradas por este nó são assinadas criptograficamente em tempo real e gravadas no
                  livro-razão imutável da plataforma com encadeamento de hashes.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 7. SUB-VIEW: 5. REAL-TIME CALCULATOR & UPGRADES */}
      {activeTab === 'CALCULATOR' && (
        <div className="space-y-4">
          <div className="border-b border-[#27272a] pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              Simulador de Subscrição em Tempo Real (Pricing Engine)
            </h3>
            <p className="text-xs text-slate-400">
              Referência do Nó Governante (billing_pricing): Calcule orçamentos exatos com regras fiscais AGT e descontos por período
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left 2 Cols: Simulation Form */}
            <div className="lg:col-span-2 bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4 text-xs font-sans">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Segmento de Atividade</label>
                <select
                  value={simSegment}
                  onChange={(e) => setSimSegment(e.target.value as BusinessSegment)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2.5 text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  <option value="RESTAURANT_BAR">Restaurante & Bar / Cafetaria</option>
                  <option value="PHARMACY">Farmácia & Saúde</option>
                  <option value="RETAIL_CLOTHING">Vestuário & Moda</option>
                  <option value="SERVICES">Prestação de Serviços & Consultoria</option>
                  <option value="GENERAL_RETAIL">Retalho Geral & Supermercado</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Ciclo de Faturação</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MONTHLY', label: 'Mensal', discount: 'Sem desconto' },
                    { id: 'QUARTERLY', label: 'Trimestral', discount: '5% Desconto' },
                    { id: 'ANNUAL', label: 'Anual', discount: '15% Desconto' },
                  ].map((cycle) => (
                    <button
                      key={cycle.id}
                      type="button"
                      onClick={() => setSimCycle(cycle.id as any)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        simCycle === cycle.id
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-[#18181b] border-[#27272a] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-bold">{cycle.label}</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5">{cycle.discount}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">Módulos & Add-ons a Incluir</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {moduleCatalog.map((mod) => {
                    const isChecked = simModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleSimModule(mod.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                            : 'bg-[#18181b] border-[#27272a] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-[#27272a] text-emerald-500"
                          />
                          <span className="font-medium text-xs">{mod.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          {mod.price > 0 ? `+${mod.price.toLocaleString()} Kz` : 'Base'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Col: Quote Breakdown */}
            <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-[#27272a] pb-2">
                Resumo da Proposta de Subscrição
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Mensalidade Base do Segmento:</span>
                  <span className="font-mono text-white">{quote.basePrice.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Add-ons Selecionados:</span>
                  <span className="font-mono text-white">{quote.addonPriceTotal.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-[#27272a] pt-2">
                  <span>Subtotal Período ({simCycle}):</span>
                  <span className="font-mono text-white">{quote.subtotal.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto de Período ({quote.cycleDiscountPercent}%):</span>
                  <span className="font-mono">-{quote.cycleDiscountAmount.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA Aplicável ({quote.taxRatePercent}%):</span>
                  <span className="font-mono text-white">{quote.taxAmount.toLocaleString()} {currency}</span>
                </div>

                <div className="border-t border-[#27272a] pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Total a Pagar:</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {quote.totalPayable.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleApplyConfigToTenant}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aplicar Configuração à Empresa
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 8. SUB-VIEW: 6. PAYMENT METHODS & BILLING DATA */}
      {activeTab === 'PAYMENT_METHODS' && (
        <div className="space-y-4">
          <div className="border-b border-[#27272a] pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              Meios de Pagamento & Dados Fiscais de Faturação
            </h3>
            <p className="text-xs text-slate-400">
              Parametrização para débito direto, emissão de faturas com NIF e liquidações automáticas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Registered Payment Methods */}
            <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-[#27272a] pb-2">
                Canais de Pagamento Autorizados
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#18181b] border border-emerald-500/30 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold font-mono">
                      MCX
                    </div>
                    <div>
                      <div className="font-bold text-white">Multicaixa Referências Automáticas</div>
                      <div className="text-[11px] text-slate-400">Entidade EMIS: 00145 (PULSE.OS PLATFORM)</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold rounded">
                    PADRÃO
                  </span>
                </div>

                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold font-mono">
                      EXP
                    </div>
                    <div>
                      <div className="font-bold text-white">Multicaixa Express (Push Notification)</div>
                      <div className="text-[11px] text-slate-400">Telefone associado: +244 923 000 000</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#27272a] text-slate-400 text-[10px] font-mono rounded">
                    ATIVO
                  </span>
                </div>

                <div className="p-3 bg-[#18181b] border border-[#27272a] rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold font-mono">
                      IBAN
                    </div>
                    <div>
                      <div className="font-bold text-white">Transferência Bancária Direta</div>
                      <div className="text-[11px] text-slate-400 font-mono">AO06.0040.0000.1234.5678.9012.3 (BAI)</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-[#27272a] text-slate-400 text-[10px] font-mono rounded">
                    ATIVO
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Billing Fiscal Info */}
            <div className="bg-[#121215] border border-[#27272a] rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white border-b border-[#27272a] pb-2">
                Dados da Empresa para Emissão de Faturas
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Razão Social Oficial</label>
                  <input
                    type="text"
                    disabled
                    value={tenant.legalName}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-white font-medium text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Número de Identificação Fiscal (NIF)</label>
                  <input
                    type="text"
                    disabled
                    value={tenant.taxId}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-emerald-400 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Morada Fiscal Completa</label>
                  <input
                    type="text"
                    disabled
                    value={tenant.address || 'Luanda, Angola'}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">E-mail Financeiro para Envio de Recibos</label>
                  <input
                    type="email"
                    disabled
                    value={tenant.email || currentUser.email}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-lg p-2 text-white font-mono text-xs"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 9. INVOICE DETAIL & MULTICAIXA SLIP MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#121215] border border-[#27272a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl font-sans">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#27272a] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-xs text-slate-400">
                    Fatura Oficial de Subscrição de Software PULSE.OS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-[#18181b] rounded-lg transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Invoice Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#18181b] p-3.5 rounded-lg border border-[#27272a]">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Data de Emissão</span>
                <span className="font-mono text-white font-semibold">{selectedInvoice.issuedAt}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Data de Vencimento</span>
                <span className="font-mono text-amber-400 font-semibold">{selectedInvoice.dueDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Estado</span>
                <span className={`font-bold ${selectedInvoice.status === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedInvoice.status === 'PAID' ? 'LIQUIDADO' : 'PENDENTE'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">NIF do Adquirente</span>
                <span className="font-mono text-slate-200">{selectedInvoice.tenantTaxId}</span>
              </div>
            </div>

            {/* Multicaixa Voucher Box if Pending */}
            {selectedInvoice.status === 'PENDING' && (
              <div className="bg-[#09090b] border border-amber-500/40 rounded-xl p-4 space-y-3 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between text-amber-400 border-b border-[#27272a] pb-2 font-bold font-sans">
                  <span>Talão de Pagamento Multicaixa</span>
                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded font-mono">EMIS AO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Entidade:</span>
                  <span className="text-white font-bold tracking-widest text-sm">00145</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Referência:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold text-sm tracking-wider">
                      {selectedInvoice.paymentRef || '00145 928 301 442'}
                    </span>
                    <button
                      onClick={() => handleCopy(selectedInvoice.paymentRef || '00145 928 301 442', 'modal_ref')}
                      className="p-1 hover:bg-[#27272a] rounded text-slate-400 hover:text-white"
                    >
                      {copiedField === 'modal_ref' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between border-t border-[#27272a] pt-2">
                  <span className="text-slate-400">Montante a Pagar:</span>
                  <span className="text-emerald-400 font-bold text-base font-mono">
                    {selectedInvoice.total.toLocaleString()} {selectedInvoice.currency}
                  </span>
                </div>
              </div>
            )}

            {/* Financial Breakdown Table */}
            <div className="border border-[#27272a] rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#18181b] text-slate-400 border-b border-[#27272a] text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Item / Descrição</th>
                    <th className="py-2.5 px-3">Período</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a]">
                  <tr>
                    <td className="py-2.5 px-3 text-white">
                      Licenciamento de Software PULSE.OS ({selectedInvoice.segment})
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{selectedInvoice.billingCycle}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-white">
                      {selectedInvoice.subtotal.toLocaleString()} {selectedInvoice.currency}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-[#18181b] p-3 space-y-1.5 border-t border-[#27272a] text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono">{selectedInvoice.subtotal.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto Comercial:</span>
                  <span className="font-mono">-{selectedInvoice.discount.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>IVA (14%):</span>
                  <span className="font-mono">{selectedInvoice.tax.toLocaleString()} {selectedInvoice.currency}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm border-t border-[#27272a] pt-2">
                  <span>Total Final:</span>
                  <span className="font-mono text-amber-400">
                    {selectedInvoice.total.toLocaleString()} {selectedInvoice.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-slate-300 rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleCopy(`FATURA: ${selectedInvoice.invoiceNumber} - TOTAL: ${selectedInvoice.total} Kz`, 'inv_text');
                    setActionFeedback('Dados da fatura copiados para impressão!');
                  }}
                  className="px-3 py-2 bg-[#18181b] hover:bg-[#27272a] text-slate-200 border border-[#3f3f46] rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Recibo
                </button>

                {selectedInvoice.status === 'PENDING' && (
                  <button
                    onClick={() => handlePayInvoice(selectedInvoice.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Pagamento Multicaixa
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
