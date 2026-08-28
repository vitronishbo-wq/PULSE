import React, { useState } from 'react';
import {
  X,
  Building2,
  User as UserIcon,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Key,
  Sparkles,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import {
  BusinessSegment,
  ModuleId,
  ProvisioningRequest,
  ProvisioningResult,
  FiscalCountry,
} from '../types/pulse';
import { Orchestrator } from '../engines/Orchestrator';

interface TenantProvisioningWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialSegment?: BusinessSegment;
  onTenantProvisioned?: (tenantId: string) => void;
}

export const TenantProvisioningWizard: React.FC<TenantProvisioningWizardProps> = ({
  isOpen,
  onClose,
  initialSegment = 'RESTAURANT_BAR',
  onTenantProvisioned,
}) => {
  const orchestrator = Orchestrator.getInstance();
  const profileEngine = orchestrator.profileEngine;
  const pricingEngine = orchestrator.pricingEngine;
  const provisioningEngine = orchestrator.provisioningEngine;

  const safeSegment: BusinessSegment = (initialSegment || 'RESTAURANT_BAR') as BusinessSegment;

  // Wizard Step: 1 = Account/Company, 2 = Segment, 3 = Modules, 4 = Pricing & Payment, 5 = Provisioned Result
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [customerName, setCustomerName] = useState('Dr. Carlos Manuel Lourenço');
  const [customerEmail, setCustomerEmail] = useState('carlos.lourenco@empresa.co.ao');
  const [customerPhone, setCustomerPhone] = useState('+244 923 456 789');

  const [companyName, setCompanyName] = useState('Nova Aliança Comercial e Serviços, Lda');
  const [companyTradeName, setCompanyTradeName] = useState('Supermercado Nova Aliança');
  const [companyTaxId, setCompanyTaxId] = useState('5418902341');
  const [companyAddress, setCompanyAddress] = useState('Avenida Deolinda Rodrigues, Nº 450');
  const [companyCity, setCompanyCity] = useState('Luanda');
  const [country, setCountry] = useState<FiscalCountry>('AO');
  const [currency, setCurrency] = useState('Kz');

  // Business Profile & Modules State
  const [selectedSegment, setSelectedSegment] = useState<BusinessSegment>(safeSegment);
  const [selectedModules, setSelectedModules] = useState<ModuleId[]>(() => {
    const prof = profileEngine.getProfile(safeSegment);
    return [...prof.defaultModules];
  });

  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'MULTICAIXA_REF' | 'MCX_EXPRESS' | 'BANK_TRANSFER' | 'CASH'>('MULTICAIXA_REF');

  // Provisioning Result
  const [provisioningResult, setProvisioningResult] = useState<ProvisioningResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const profiles = profileEngine.getAllProfiles();
  const currentProfile = profileEngine.getProfile(selectedSegment);
  const allModules = profileEngine.getAllModules();

  const handleSegmentChange = (seg: BusinessSegment) => {
    setSelectedSegment(seg);
    const prof = profileEngine.getProfile(seg);
    setSelectedModules([...prof.defaultModules]);
  };

  const handleToggleModule = (modId: ModuleId) => {
    if (currentProfile.defaultModules.includes(modId)) {
      // Default modules are mandatory for this profile
      return;
    }
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter((m) => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const pricingBreakdown = pricingEngine.calculateSubscription({
    segment: selectedSegment,
    selectedModules,
    billingCycle,
    currency,
  });

  const handleExecuteProvisioning = () => {
    setIsProcessing(true);

    const req: ProvisioningRequest = {
      customer: {
        fullName: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      company: {
        name: companyName,
        tradeName: companyTradeName || companyName,
        taxId: companyTaxId,
        address: companyAddress,
        city: companyCity,
        country,
        currency,
        phone: customerPhone,
        email: customerEmail,
      },
      segment: selectedSegment,
      selectedModules,
      billingCycle,
      paymentMethod,
    };

    setTimeout(() => {
      const res = provisioningEngine.provisionNewTenant(req);
      setProvisioningResult(res);
      setIsProcessing(false);
      setStep(5);
    }, 600);
  };

  return (
    <div
      id="modal-tenant-provisioning"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 font-mono text-slate-200"
    >
      <div className="bg-[#181818] border border-[#333333] rounded-lg w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Title Bar */}
        <div className="bg-[#1e1e1e] border-b border-[#2d2d2d] px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              PULSE.OS — Pipeline de Aquisição & Provisioning de Tenant
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#2d2d2d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="bg-[#252526] border-b border-[#2d2d2d] px-4 py-2 flex items-center justify-between text-xs text-slate-400 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-emerald-400 font-bold' : step > 1 ? 'text-slate-300' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-emerald-500 text-slate-950 font-bold' : step > 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#333]'}`}>1</span>
              <span>Conta & Empresa</span>
            </div>
            <span>&rarr;</span>
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-emerald-400 font-bold' : step > 2 ? 'text-slate-300' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-emerald-500 text-slate-950 font-bold' : step > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#333]'}`}>2</span>
              <span>Segmento</span>
            </div>
            <span>&rarr;</span>
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-emerald-400 font-bold' : step > 3 ? 'text-slate-300' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : step > 3 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#333]'}`}>3</span>
              <span>Serviços / Módulos</span>
            </div>
            <span>&rarr;</span>
            <div className={`flex items-center gap-1.5 ${step === 4 ? 'text-emerald-400 font-bold' : step > 4 ? 'text-slate-300' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-emerald-500 text-slate-950 font-bold' : step > 4 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#333]'}`}>4</span>
              <span>Motor de Preços & Pagamento</span>
            </div>
            <span>&rarr;</span>
            <div className={`flex items-center gap-1.5 ${step === 5 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 5 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-[#333]'}`}>5</span>
              <span>Ativação & Licença</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          
          {/* STEP 1: Account & Company Identification */}
          {step === 1 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="border-b border-[#2d2d2d] pb-2">
                <h3 className="text-sm font-bold text-white uppercase">1. Identificação do Cliente & Empresa</h3>
                <p className="text-[11px] text-slate-400">Registo de titularidade e dados fiscais para faturação e certificação AGT</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Razão Social / Nome da Empresa *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                    placeholder="Ex: Supermercado Aliança, Lda"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nome Comercial / Marca *</label>
                  <input
                    type="text"
                    value={companyTradeName}
                    onChange={(e) => setCompanyTradeName(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                    placeholder="Ex: Supermercado Aliança"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">NIF / Número de Contribuinte *</label>
                  <input
                    type="text"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                    placeholder="Ex: 5418902341"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Nome do Responsável / Administrador</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">E-mail Corporativo</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Cidade / Província</label>
                  <input
                    type="text"
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded px-3 py-2 text-white focus:outline-none focus:border-[#007acc]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Business Profile (Segment) */}
          {step === 2 && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="border-b border-[#2d2d2d] pb-2">
                <h3 className="text-sm font-bold text-white uppercase">2. Selecione o Segmento de Negócio</h3>
                <p className="text-[11px] text-slate-400">
                  O perfil é definido no momento da adesão e congela a matriz operacional do workspace
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profiles.map((p) => {
                  const isSelected = selectedSegment === p.code;
                  return (
                    <div
                      key={p.code}
                      onClick={() => handleSegmentChange(p.code)}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#04395e]/40 border-[#007acc] ring-1 ring-[#007acc]'
                          : 'bg-[#252526] border-[#3c3c3c] hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{p.name}</span>
                        <span className="font-mono text-emerald-400 text-xs font-bold">
                          {p.basePrice.toLocaleString()} Kz/mês
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{p.description}</p>
                      
                      <div className="mt-2.5 pt-2 border-t border-[#333] flex items-center justify-between text-[10px] text-slate-400">
                        <span>Defaults: {p.defaultModules.join(', ')}</span>
                        {isSelected && <span className="text-[#007acc] font-bold">✓ Selecionado</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Configure Services & Modules */}
          {step === 3 && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="border-b border-[#2d2d2d] pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">3. Configuração de Módulos & Serviços</h3>
                  <p className="text-[11px] text-slate-400">
                    Segmento Selecionado: <strong className="text-emerald-400">{currentProfile.name}</strong>
                  </p>
                </div>
                <span className="text-xs bg-[#252526] px-2 py-1 rounded border border-[#3c3c3c] text-slate-300">
                  Base: {currentProfile.basePrice.toLocaleString()} Kz
                </span>
              </div>

              {/* Defaults section */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  Módulos Nativos / Defaults (Incluídos no Base)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentProfile.defaultModules.map((modId) => {
                    const def = profileEngine.getModule(modId);
                    return (
                      <div
                        key={modId}
                        className="bg-[#252526] border border-emerald-500/30 rounded p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{def?.name || modId}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{def?.description}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ON (BASE)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optionals section */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                  Módulos Opcionais / Add-ons Disponíveis
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentProfile.optionalModules.map((modId) => {
                    const def = profileEngine.getModule(modId);
                    const isSelected = selectedModules.includes(modId);
                    return (
                      <div
                        key={modId}
                        onClick={() => handleToggleModule(modId)}
                        className={`border rounded p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#04395e]/30 border-[#007acc]'
                            : 'bg-[#252526] border-[#3c3c3c] hover:border-slate-500'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white text-xs">{def?.name || modId}</div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{def?.description}</span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                            +{def?.price.toLocaleString()} Kz
                          </span>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[9px] font-bold ${
                              isSelected
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-[#333] text-slate-400'
                            }`}
                          >
                            {isSelected ? 'ATIVADO' : 'DESATIVADO'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Interface Features & Navigation preview derived from ProfileEngine */}
              {(() => {
                const feat = profileEngine.getInterfaceFeatures(selectedSegment, selectedModules);
                return (
                  <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-3 space-y-2 mt-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Capacidades de Interface do Perfil Selecionado</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Modo Base: <strong>{feat.pos.defaultInteractionMode}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {feat.pos.hasTableManagement && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          ✓ Gestão de Mesas & Cozinha KDS
                        </span>
                      )}
                      {feat.pos.hasBatchSelector && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          ✓ Rastreabilidade FEFO & Lotes Rx
                        </span>
                      )}
                      {feat.pos.hasScaleIntegration && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          ✓ Integração com Balança de Checkout
                        </span>
                      )}
                      {feat.pos.hasBarcodeQuickScanner && (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                          ✓ Leitor Laser EAN-13
                        </span>
                      )}
                      {feat.pos.hasWithholding6_5 && (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          ✓ Retenção na Fonte 6.5% AGT
                        </span>
                      )}
                      {feat.pos.hasSizeColorGrid && (
                        <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/30">
                          ✓ Grade de Cores e Tamanhos
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#2d2d2d] flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">Separadores Ativos:</span>
                      {feat.navTabs.map((t) => (
                        <span key={t.id} className="bg-[#252526] px-1.5 py-0.5 rounded text-slate-300 border border-[#333]">
                          {t.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* STEP 4: Pricing Engine & Payment */}
          {step === 4 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="border-b border-[#2d2d2d] pb-2">
                <h3 className="text-sm font-bold text-white uppercase">4. Motor de Preços & Liquidação</h3>
                <p className="text-[11px] text-slate-400">
                  Cálculo em tempo real da subscrição com descontos de ciclo e emissão de referência EMIS
                </p>
              </div>

              {/* Billing Cycle Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Ciclo de Faturação</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'MONTHLY', label: 'Mensal', discount: 'Sem Desconto' },
                    { id: 'QUARTERLY', label: 'Trimestral', discount: '5% Desconto' },
                    { id: 'ANNUAL', label: 'Anual', discount: '15% Desconto' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setBillingCycle(c.id as any)}
                      className={`p-2.5 rounded border text-left transition-all ${
                        billingCycle === c.id
                          ? 'bg-[#04395e] border-[#007acc] text-white font-bold'
                          : 'bg-[#252526] border-[#3c3c3c] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="text-xs">{c.label}</div>
                      <div className="text-[10px] text-emerald-400 mt-0.5">{c.discount}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-300 pb-1.5 border-b border-[#333]">
                  <span>Plano Base ({currentProfile.name})</span>
                  <span>{pricingBreakdown.basePrice.toLocaleString()} Kz/mês</span>
                </div>

                {pricingBreakdown.addonModules.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-slate-400 text-[11px]">
                    <span>+ {addon.name}</span>
                    <span>{addon.price.toLocaleString()} Kz/mês</span>
                  </div>
                ))}

                <div className="flex justify-between text-slate-300 pt-1.5 border-t border-[#333]">
                  <span>Subtotal ({billingCycle})</span>
                  <span>{pricingBreakdown.subtotal.toLocaleString()} Kz</span>
                </div>

                {pricingBreakdown.cycleDiscountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-[11px]">
                    <span>Desconto de Ciclo ({pricingBreakdown.cycleDiscountPercent}%)</span>
                    <span>- {pricingBreakdown.cycleDiscountAmount.toLocaleString()} Kz</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>IVA ({pricingBreakdown.taxRatePercent}%)</span>
                  <span>+ {pricingBreakdown.taxAmount.toLocaleString()} Kz</span>
                </div>

                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-[#3c3c3c]">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-emerald-400">{pricingBreakdown.totalPayable.toLocaleString()} Kz</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5">Método de Liquidação</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'MULTICAIXA_REF', label: 'Referência Multicaixa' },
                    { id: 'MCX_EXPRESS', label: 'MCX Express' },
                    { id: 'BANK_TRANSFER', label: 'Transferência' },
                    { id: 'CASH', label: 'Caixa Direto' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded border text-center text-xs transition-all ${
                        paymentMethod === m.id
                          ? 'bg-[#007acc] border-[#007acc] text-white font-bold'
                          : 'bg-[#252526] border-[#3c3c3c] text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* EMIS Multicaixa Simulation Box */}
              {paymentMethod === 'MULTICAIXA_REF' && (
                <div className="bg-[#1e1e1e] border border-amber-500/30 rounded p-3 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <QrCode className="w-4 h-4" />
                    <span>Dados de Pagamento Multicaixa (EMIS)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                    <div className="bg-[#252526] p-2 rounded border border-[#333]">
                      <span className="text-[9px] text-slate-500 uppercase block">Entidade</span>
                      <span className="text-white font-bold">00145</span>
                    </div>
                    <div className="bg-[#252526] p-2 rounded border border-[#333]">
                      <span className="text-[9px] text-slate-500 uppercase block">Referência</span>
                      <span className="text-emerald-400 font-bold">928 341 012</span>
                    </div>
                    <div className="bg-[#252526] p-2 rounded border border-[#333]">
                      <span className="text-[9px] text-slate-500 uppercase block">Montante</span>
                      <span className="text-white font-bold">{pricingBreakdown.totalPayable.toLocaleString()} Kz</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Provisioned Result & Active Tenant */}
          {step === 5 && provisioningResult && (
            <div className="space-y-4 max-w-xl mx-auto text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-white uppercase">Tenant Provisionado com Sucesso!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  A instância <strong>{provisioningResult.tenant.tradeName}</strong> está ativa e pronta para operar
                </p>
              </div>

              <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between border-b border-[#333] pb-1.5">
                  <span className="text-slate-400">Tenant ID:</span>
                  <span className="text-white font-bold">{provisioningResult.tenant.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-1.5">
                  <span className="text-slate-400">Segmento de Negócio:</span>
                  <span className="text-emerald-400 font-bold">{provisioningResult.tenant.segment}</span>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-1.5">
                  <span className="text-slate-400">Chave de Licença AGT:</span>
                  <span className="text-sky-300 font-bold truncate max-w-[220px]">{provisioningResult.licenseKey}</span>
                </div>
                <div className="flex justify-between border-b border-[#333] pb-1.5">
                  <span className="text-slate-400">Validade da Subscrição:</span>
                  <span className="text-white">{provisioningResult.subscription.expiresAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado no Workspace:</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    PERFIL CONGELADO (ATIVO)
                  </span>
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-center">
                <button
                  onClick={() => {
                    if (onTenantProvisioned) {
                      onTenantProvisioned(provisioningResult.tenant.id);
                    }
                    onClose();
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>Abrir Workspace do Novo Tenant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step < 5 && (
          <div className="bg-[#1e1e1e] border-t border-[#2d2d2d] px-4 py-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              disabled={step === 1}
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-3 py-1.5 rounded text-xs text-slate-400 hover:text-white disabled:opacity-30 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="bg-[#007acc] hover:bg-[#0062a3] text-white px-4 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <span>Seguinte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecuteProvisioning}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'A Provisionar...' : 'Pagar & Ativar Tenant Automaticamente'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
