import React, { useState } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Coins,
  Palette,
  Image as ImageIcon,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TenantProfile, FiscalCountry } from '../../types/pulse';

interface CompanySettingsSectionProps {
  tenant: TenantProfile;
  canEdit: boolean;
  onSave: (updated: Partial<TenantProfile>) => void;
}

export const CompanySettingsSection: React.FC<CompanySettingsSectionProps> = ({
  tenant,
  canEdit,
  onSave,
}) => {
  const [name, setName] = useState(tenant.name || '');
  const [tradeName, setTradeName] = useState(tenant.tradeName || tenant.name || '');
  const [taxId, setTaxId] = useState(tenant.taxId || '');
  const [commercialRegistry, setCommercialRegistry] = useState('Conservatória do Registo Comercial de Luanda, Matrícula nº 1402/2019');
  const [shareCapital, setShareCapital] = useState('5.000.000,00 Kz');
  const [address, setAddress] = useState(tenant.address || '');
  const [neighborhood, setNeighborhood] = useState('Marginal / Ingombota');
  const [city, setCity] = useState(tenant.city || 'Luanda');
  const [province, setProvince] = useState('Luanda');
  const [country, setCountry] = useState<FiscalCountry>(tenant.country || 'AO');
  const [phone, setPhone] = useState(tenant.phone || '+244 923 456 789');
  const [mobile, setMobile] = useState('+244 931 000 111');
  const [email, setEmail] = useState(tenant.email || 'geral@empresa.ao');
  const [financeEmail, setFinanceEmail] = useState('financeiro@empresa.ao');
  const [website, setWebsite] = useState('www.empresa.ao');
  const [taxRegime, setTaxRegime] = useState<'GERAL' | 'SIMPLIFICADO' | 'ISENTO'>('GERAL');
  const [fiscalCertNumber, setFiscalCertNumber] = useState(tenant.fiscalCertNumber || 'AGT/CERT/2026/0491');
  const [withholdingDefault, setWithholdingDefault] = useState(true);
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=60');
  const [themeColor, setThemeColor] = useState('#10b981');
  const [slogan, setSlogan] = useState('Excelência e Qualidade no Atendimento Comercial');
  const [operatingHours, setOperatingHours] = useState('Seg - Sáb: 08:00 às 22:00 | Dom: 10:00 às 18:00');
  const [closingDay, setClosingDay] = useState('Nenhum (Aberto Todos os Dias)');
  const [defaultCreditLimit, setDefaultCreditLimit] = useState(500000);
  const [returnPolicyDays, setReturnPolicyDays] = useState(15);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    onSave({
      name,
      tradeName,
      taxId,
      address,
      city,
      country,
      phone,
      email,
      fiscalCertNumber,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 1. Dados da Empresa / NIF */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              1. Dados da Empresa & Identificação Fiscal (NIF)
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
            AGT Conforme
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Razão Social (Nome Oficial) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Nome Comercial / Marca <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              NIF (Identificação Fiscal) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Registo Comercial / Conservatória
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={commercialRegistry}
              onChange={(e) => setCommercialRegistry(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Capital Social
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={shareCapital}
              onChange={(e) => setShareCapital(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              País Fiscal
            </label>
            <select
              disabled={!canEdit}
              value={country}
              onChange={(e) => setCountry(e.target.value as FiscalCountry)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="AO">Angola (AGT - IVA 14% / Retenção 6.5%)</option>
              <option value="PT">Portugal (AT - SAF-T PT / IVA 23%)</option>
              <option value="MZ">Moçambique (AT-MZ - IVA 16%)</option>
              <option value="CV">Cabo Verde (DGI - IVA 15%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Morada & Contactos */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              2. Morada, Sede & Contactos Institucionais
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Endereço Completo (Rua, Número, Edifício) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Bairro / Zona / Comuna
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Cidade / Município <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Província / Região
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Telefone Fixo / Central
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Telemóvel / WhatsApp de Apoio
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Email Geral / Comercial <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              disabled={!canEdit}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Email de Contabilidade / Faturação
            </label>
            <input
              type="email"
              disabled={!canEdit}
              value={financeEmail}
              onChange={(e) => setFinanceEmail(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Website / Portal Online
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 3. Dados Fiscais & Certificação */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              3. Enquadramento Fiscal & Certificação de Software
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">
            AGT / Decreto Presidencial 312/18
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Regime de IVA
            </label>
            <select
              disabled={!canEdit}
              value={taxRegime}
              onChange={(e) => setTaxRegime(e.target.value as any)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-medium"
            >
              <option value="GERAL">Regime Geral (Taxa Padrão de 14%)</option>
              <option value="SIMPLIFICADO">Regime Simplificado (7% Volume Vendas)</option>
              <option value="ISENTO">Regime de Exclusão / Isenção (Art. 12º CIVA)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Certificação AGT Software
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={fiscalCertNumber}
              onChange={(e) => setFiscalCertNumber(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Retenção na Fonte 6.5% Padrão (Serviços)
            </label>
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={withholdingDefault}
                  onChange={(e) => setWithholdingDefault(e.target.checked)}
                  className="rounded border-[#27272a] text-emerald-500 focus:ring-emerald-500"
                />
                <span>Aplicar 6.5% em Serviços por Padrão</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Logótipo & Identidade */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              4. Logótipo & Identidade Visual
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div className="flex items-center gap-3 bg-[#121215] p-3 rounded-lg border border-[#27272a]">
            <img
              src={logoUrl}
              alt="Logo Preview"
              className="w-14 h-14 rounded-lg object-cover border border-slate-700 bg-slate-900"
              onError={(e) => {
                (e.target as any).src = 'https://placehold.co/100x100/18181b/10b981?text=LOGO';
              }}
            />
            <div className="min-w-0 flex-1">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">URL do Logótipo</label>
              <input
                type="text"
                disabled={!canEdit}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-[11px] font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">Slogan / Mensagem Institucional</label>
            <input
              type="text"
              disabled={!canEdit}
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">Cor Primária de Destaque</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={!canEdit}
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border border-[#27272a] bg-transparent"
              />
              <input
                type="text"
                disabled={!canEdit}
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Parâmetros Operacionais */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              5. Parâmetros Operacionais & Prazos
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-[11px] text-slate-400 font-mono block mb-1">Horário de Funcionamento</label>
            <input
              type="text"
              disabled={!canEdit}
              value={operatingHours}
              onChange={(e) => setOperatingHours(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">Dia de Fecho Semanal</label>
            <input
              type="text"
              disabled={!canEdit}
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">Prazo de Devoluções (Dias)</label>
            <input
              type="number"
              min={0}
              max={90}
              disabled={!canEdit}
              value={returnPolicyDays}
              onChange={(e) => setReturnPolicyDays(Number(e.target.value))}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      {canEdit && (
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-xs">
              <CheckCircle2 className="w-4 h-4" /> Dados do estabelecimento atualizados com sucesso.
            </span>
          ) : <div />}

          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Definições do Estabelecimento</span>
          </button>
        </div>
      )}
    </form>
  );
};
