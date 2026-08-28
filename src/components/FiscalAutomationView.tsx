import React, { useState } from 'react';
import {
  FileCode,
  Globe,
  Sliders,
  Zap,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FiscalCountry, AutomationRule, Document, TenantProfile, Product, Customer } from '../types/pulse';
import { FiscalEngine } from '../engines/FiscalEngine';

interface FiscalAutomationViewProps {
  currentCountry: FiscalCountry;
  onCountryChange: (country: FiscalCountry) => void;
  fiscalEngine: FiscalEngine;
  rules: AutomationRule[];
  onToggleRule: (id: string, enabled: boolean) => void;
  documents?: Document[];
  currency?: string;
  tenant?: TenantProfile;
  products?: Product[];
  customers?: Customer[];
}

export const FiscalAutomationView: React.FC<FiscalAutomationViewProps> = ({
  currentCountry,
  onCountryChange,
  fiscalEngine,
  rules,
  onToggleRule,
  documents = [],
  currency = 'Kz',
  tenant,
  products = [],
  customers = [],
}) => {
  const [copied, setCopied] = useState(false);
  const adapter = fiscalEngine.getAdapter();

  const safeDocs = Array.isArray(documents) ? documents : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const generatedSaftXml = adapter.exportSAFT(
    tenant,
    safeDocs,
    safeProducts,
    safeCustomers,
    { start: '2026-01-01', end: '2026-12-31' }
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSaftXml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSaftXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAFT_${currentCountry}_${new Date().toISOString().split('T')[0]}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="pulse-fiscal-automation-view" className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            ADAPTADORES FISCAIS & MOTOR DE REGRAS AUTOMÁTICAS
          </h2>
          <p className="text-xs text-slate-400">
            Desacoplamento Fiscal (AGT/AT) e Regras de Negócio Orientadas a Eventos
          </p>
        </div>

        {/* Fiscal Adapter Selector */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-400">Jurisdição Fiscal:</span>
          <select
            value={currentCountry}
            onChange={(e) => onCountryChange(e.target.value as FiscalCountry)}
            className="bg-slate-900 text-white border border-slate-700 rounded px-2 py-1 outline-none font-bold"
          >
            <option value="AO">🇦🇴 Angola (AGT - IVA 14%/7%/5%/0%)</option>
            <option value="PT">🇵🇹 Portugal (AT - IVA 23%/13%/6%)</option>
            <option value="MZ">🇲🇿 Moçambique (AT - IVA 16%)</option>
            <option value="CV">🇨🇻 Cabo Verde (DGI - IVA 15%)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Automation Rules Engine */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Regras de Automação Configuráveis (Rules Engine)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Code knows infra; Rules know business
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Estas regras escutam eventos do EventBus e executam ações automáticas sem intervenção humana.
          </p>

          <div className="space-y-2.5">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{rule.name}</h4>
                    <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800">
                      Gatilho: {rule.triggerEvent}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Ação: <strong className="text-emerald-400">{rule.actionType}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Disparado: {rule.triggerCount} vezes • Último: {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleTimeString() : 'Nunca'}
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => onToggleRule(rule.id, !rule.enabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    rule.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      rule.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: SAF-T XML Preview & Fiscal Compliance */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              Ficheiro de Auditoria Tributária (SAF-T AO/PT)
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-md text-xs flex items-center gap-1 cursor-pointer"
                title="Copiar XML"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[10px]">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-md text-xs flex items-center gap-1 cursor-pointer font-bold"
                title="Baixar SAF-T XML"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[10px]">Baixar XML</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Certificação Fiscal: AGT / Decreto 292/18</span>
            <span className="font-mono text-emerald-400">{documents.length} Documentos Faturados</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
            <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-[320px] scrollbar-thin">
              {generatedSaftXml}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
