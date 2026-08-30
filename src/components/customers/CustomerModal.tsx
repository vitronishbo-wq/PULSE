import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Building,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  FileText,
  CreditCard,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { Customer, FiscalCountry } from '../../types/pulse';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
  currency: string;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  currency,
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTACTS' | 'FISCAL' | 'FINANCIAL' | 'NOTES'>('GENERAL');

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    tradeName: '',
    taxId: '',
    fiscalCountry: 'AO',
    taxRegime: 'GERAL',
    taxExemptionReason: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    contactPerson: '',
    address: '',
    city: 'Luanda',
    province: 'Luanda',
    postalCode: '',
    creditLimit: 0,
    currentBalance: 0,
    paymentTerms: 'Pronto Pagamento',
    priceTable: 'GERAL',
    status: 'ACTIVE',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
        fiscalCountry: customer.fiscalCountry || 'AO',
        taxRegime: customer.taxRegime || 'GERAL',
        status: customer.status || 'ACTIVE',
        creditLimit: customer.creditLimit || 0,
        currentBalance: customer.currentBalance || 0,
        paymentTerms: customer.paymentTerms || 'Pronto Pagamento',
        priceTable: customer.priceTable || 'GERAL',
      });
    } else {
      setFormData({
        name: '',
        tradeName: '',
        taxId: '',
        fiscalCountry: 'AO',
        taxRegime: 'GERAL',
        taxExemptionReason: '',
        email: '',
        phone: '',
        mobile: '',
        website: '',
        contactPerson: '',
        address: '',
        city: 'Luanda',
        province: 'Luanda',
        postalCode: '',
        creditLimit: 0,
        currentBalance: 0,
        paymentTerms: 'Pronto Pagamento',
        priceTable: 'GERAL',
        status: 'ACTIVE',
        notes: '',
      });
    }
    setErrors({});
    setActiveTab('GENERAL');
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) {
      newErrors.name = 'O Nome / Razão Social é obrigatório';
    }
    if (!formData.taxId?.trim()) {
      newErrors.taxId = 'O NIF / Contribuinte é obrigatório';
    }
    if (formData.taxRegime === 'ISENTO' && !formData.taxExemptionReason?.trim()) {
      newErrors.taxExemptionReason = 'Obrigatório selecionar o motivo de isenção de IVA';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const customerToSave: Customer = {
      id: customer?.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formData.name!.trim(),
      tradeName: formData.tradeName?.trim() || undefined,
      taxId: formData.taxId!.trim(),
      fiscalCountry: formData.fiscalCountry || 'AO',
      taxRegime: formData.taxRegime || 'GERAL',
      taxExemptionReason: formData.taxRegime === 'ISENTO' ? formData.taxExemptionReason?.trim() : undefined,
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      mobile: formData.mobile?.trim() || undefined,
      website: formData.website?.trim() || undefined,
      contactPerson: formData.contactPerson?.trim() || undefined,
      address: formData.address?.trim() || undefined,
      city: formData.city?.trim() || undefined,
      province: formData.province?.trim() || undefined,
      postalCode: formData.postalCode?.trim() || undefined,
      creditLimit: Number(formData.creditLimit) || 0,
      currentBalance: Number(formData.currentBalance) || 0,
      paymentTerms: formData.paymentTerms || 'Pronto Pagamento',
      priceTable: formData.priceTable || 'GERAL',
      status: formData.status || 'ACTIVE',
      notes: formData.notes?.trim() || undefined,
      createdAt: customer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(customerToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {customer ? 'Editar Ficha de Cliente' : 'Novo Cliente / Entidade'}
              </h3>
              <p className="text-xs text-slate-400">
                Registo de identificação fiscal, morada, contactos e condições comerciais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-[#27272a] bg-[#141418] px-6 gap-2 pt-2 overflow-x-auto">
          {[
            { id: 'GENERAL', label: 'Identificação & NIF', icon: Building },
            { id: 'CONTACTS', label: 'Contactos & Morada', icon: MapPin },
            { id: 'FISCAL', label: 'Dados Fiscais & IVA', icon: ShieldCheck },
            { id: 'FINANCIAL', label: 'Crédito & Pagamento', icon: CreditCard },
            { id: 'NOTES', label: 'Observações', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: IDENTIFICAÇÃO GERAL */}
          {activeTab === 'GENERAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-slate-300 font-medium">
                    Nome / Razão Social <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Luanda Empreendimentos, S.A. ou Manuel Silva"
                    className={`w-full bg-[#18181b] border ${
                      errors.name ? 'border-rose-500' : 'border-[#27272a]'
                    } rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500`}
                  />
                  {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Nome Comercial / Designação</label>
                  <input
                    type="text"
                    value={formData.tradeName || ''}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="Ex: Grupo Luanda Capital"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">
                    NIF / Nº Contribuinte <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxId || ''}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value.toUpperCase() })}
                    placeholder="Ex: 5409182374 ou 004819234LA041"
                    className={`w-full bg-[#18181b] border ${
                      errors.taxId ? 'border-rose-500' : 'border-[#27272a]'
                    } rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-500 outline-none focus:border-emerald-500`}
                  />
                  {errors.taxId && <p className="text-[11px] text-rose-400">{errors.taxId}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">País Fiscal</label>
                  <select
                    value={formData.fiscalCountry || 'AO'}
                    onChange={(e) => setFormData({ ...formData, fiscalCountry: e.target.value as FiscalCountry })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="AO">Angola (AGT - NIF / Bilhete de Identidade)</option>
                    <option value="PT">Portugal (AT - NIF / NIPC)</option>
                    <option value="MZ">Moçambique (AT - NUIT)</option>
                    <option value="CV">Cabo Verde (NIF)</option>
                    <option value="OTHER">Outro / Internacional</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Estado do Cliente</label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="ACTIVE">Ativo (Permite emissão de documentos)</option>
                    <option value="INACTIVE">Inativo (Bloqueado para novas vendas)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACTOS & MORADA */}
          {activeTab === 'CONTACTS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Principal</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@empresa.ao"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Telefone Fixo</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+244 222 000 111"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Telemóvel / WhatsApp</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+244 923 456 789"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pessoa de Contacto / Cargo</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Ex: Dra. Teresa Sousa (Diretora Financeira)"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Website</span>
                  </label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.empresa.ao"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-slate-300 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Morada Completa</span>
                  </label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Edifício, Nº de Porta, Andar, Bairro"
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Cidade / Município</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Luanda, Benguela, Lubango..."
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Província / Região</label>
                  <input
                    type="text"
                    value={formData.province || ''}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Luanda, Benguela, Huíla..."
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DADOS FISCAIS & IVA */}
          {activeTab === 'FISCAL' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-3.5 rounded-xl flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-white text-xs">Enquadramento Fiscal AGT / SAF-T (AO)</p>
                  <p className="text-[11px] text-slate-300">
                    O regime de IVA e motivo de isenção são comunicados obrigatoriamente no ficheiro SAF-T de auditoria e nas faturas emitidas.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-slate-300 font-medium">Regime de IVA do Cliente</label>
                  <select
                    value={formData.taxRegime || 'GERAL'}
                    onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="GERAL">Regime Geral de IVA (Taxa Normal 14% / Reduzida)</option>
                    <option value="SIMPLIFICADO">Regime Simplificado (Taxa 7%)</option>
                    <option value="ISENTO">Regime de Isenção / Exclusão de IVA (0%)</option>
                  </select>
                </div>

                {formData.taxRegime === 'ISENTO' && (
                  <div className="space-y-1.5 md:col-span-2 animate-in fade-in">
                    <label className="block text-slate-300 font-medium">
                      Motivo Justificativo de Isenção de IVA <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formData.taxExemptionReason || ''}
                      onChange={(e) => setFormData({ ...formData, taxExemptionReason: e.target.value })}
                      className={`w-full bg-[#18181b] border ${
                        errors.taxExemptionReason ? 'border-rose-500' : 'border-[#27272a]'
                      } rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer`}
                    >
                      <option value="">Selecione o Código do Motivo de Isenção...</option>
                      <option value="M00 - Isento Artigo 12.º do CIVA">M00 - Isento Artigo 12.º do CIVA (Regime Geral de Isenção)</option>
                      <option value="M02 - Isenção por Operações Financeiras e Bancárias">M02 - Isenção por Operações Financeiras</option>
                      <option value="M04 - Isenção Serviços Médicos e Sanitários">M04 - Isenção Serviços Médicos e Sanitários</option>
                      <option value="M05 - Isenção Educação e Formação Profissional">M05 - Isenção Educação e Formação Profissional</option>
                      <option value="M06 - Isenção Diplomática ou Organizações Internacionais">M06 - Isenção Diplomática / Organismos Internacionais</option>
                      <option value="M07 - Isenção Outras Disposições Legais Específicas">M07 - Outras Disposições Legais Específicas</option>
                    </select>
                    {errors.taxExemptionReason && (
                      <p className="text-[11px] text-rose-400">{errors.taxExemptionReason}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CRÉDITO & CONDIÇÕES DE PAGAMENTO */}
          {activeTab === 'FINANCIAL' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">
                    Limite de Crédito Concedido ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.creditLimit ?? 0}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Defina 0 para compras exclusivas a pronto pagamento.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">
                    Saldo Atual em Conta-Corrente ({currency})
                  </label>
                  <input
                    type="number"
                    value={formData.currentBalance ?? 0}
                    onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-emerald-400 font-bold font-mono outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Valor positivo indica dívida do cliente a receber.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Condições de Pagamento</label>
                  <select
                    value={formData.paymentTerms || 'Pronto Pagamento'}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Pronto Pagamento">Pronto Pagamento (No ato da emissão)</option>
                    <option value="15 Dias">15 Dias após Faturação</option>
                    <option value="30 Dias Líquido">30 Dias Líquido</option>
                    <option value="60 Dias Líquido">60 Dias Líquido</option>
                    <option value="90 Dias Líquido">90 Dias Líquido</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-300 font-medium">Tabela de Preços Atribuída</label>
                  <select
                    value={formData.priceTable || 'GERAL'}
                    onChange={(e) => setFormData({ ...formData, priceTable: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="GERAL">Tabela Geral (Padrão de Venda)</option>
                    <option value="RETALHO">Tabela de Retalho / Balcão</option>
                    <option value="GROSSISTA">Tabela Grossista / Volume</option>
                    <option value="VIP_PARCEIRO">Tabela VIP / Parceiro Estratégico</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: OBSERVAÇÕES */}
          {activeTab === 'NOTES' && (
            <div className="space-y-3">
              <label className="block text-slate-300 font-medium">Notas / Observações Internas</label>
              <textarea
                rows={5}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Insira notas internas sobre preferências do cliente, acordos comerciais ou informações de entrega..."
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl p-3.5 text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none text-xs"
              />
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{customer ? 'Guardar Alterações' : 'Criar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
