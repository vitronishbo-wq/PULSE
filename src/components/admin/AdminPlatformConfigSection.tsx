import React, { useState } from 'react';
import {
  Globe,
  Coins,
  ShieldCheck,
  Percent,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import {
  PlatformCountryConfig,
  PlatformPaymentProvider,
} from '../../types/platform';
import {
  initialPlatformCountries,
  initialPaymentProviders,
} from '../../data/platformSeedData';

interface AdminPlatformConfigSectionProps {
  leafId: string;
}

export const AdminPlatformConfigSection: React.FC<AdminPlatformConfigSectionProps> = ({ leafId }) => {
  const [countries] = useState<PlatformCountryConfig[]>(initialPlatformCountries);
  const [providers] = useState<PlatformPaymentProvider[]>(initialPaymentProviders);

  const documentTypes = [
    { code: 'FT', name: 'Fatura', desc: 'Fatura a crédito/prazo com emissão de recibo subsequente', requiresSign: true },
    { code: 'FR', name: 'Fatura-Recibo', desc: 'Venda a pronto pagamento com quitação simultânea', requiresSign: true },
    { code: 'NC', name: 'Nota de Crédito', desc: 'Retificação de valor a favor do cliente / devolução', requiresSign: true },
    { code: 'ND', name: 'Nota de Débito', desc: 'Acréscimo de encargos ou juros de mora', requiresSign: true },
    { code: 'PP', name: 'Fatura Proforma', desc: 'Orçamento prévio sem valor fiscal ou efeito de quitação', requiresSign: false },
    { code: 'RC', name: 'Recibo de Quitação', desc: 'Comprovativo de liquidação de Faturas emitidas', requiresSign: true },
    { code: 'GR', name: 'Guia de Remessa', desc: 'Documento de transporte de mercadorias', requiresSign: true },
    { code: 'GT', name: 'Guia de Transporte', desc: 'Circulação rodoviária fiscalmente comunicada', requiresSign: true },
  ];

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: COUNTRIES & FISCAL PROFILES */}
      {(leafId === 'countries' || leafId === 'fiscal_profiles') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                Jurisdições Nacionais & Autoridades Fiscais Homologadas
              </h3>
              <p className="text-[11px] text-slate-400">Parâmetros fiscais, taxas padrão e especificação SAF-T</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {countries.map((c) => (
              <div
                key={c.code}
                className={`bg-[#252526] border rounded-lg p-3.5 space-y-2.5 ${
                  c.active ? 'border-[#3c3c3c]' : 'border-[#2d2d2d] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{c.name}</span>
                    <span className="text-[10px] text-sky-400 font-mono">({c.code})</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      c.active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.active ? 'HOMOLOGADO' : 'EM ADAPTAÇÃO'}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-300 pt-1">
                  <div>Autoridade Fiscal: <strong className="text-white">{c.fiscalAuthority}</strong></div>
                  <div>Moeda Padrão: <strong className="text-amber-400">{c.defaultCurrency}</strong></div>
                  <div>IVA Normal: <strong className="text-white">{c.standardVatRate}%</strong> • Reduzidas: {c.reducedVatRates.join('%, ')}%</div>
                  <div>Retenção Serviços: <strong className="text-white">{c.retentionRate}%</strong></div>
                  <div>Versão SAF-T: <strong className="text-sky-400 font-mono">{c.saftVersion}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LEAF: CURRENCIES */}
      {leafId === 'currencies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Matriz de Câmbios & Moedas Estrangeiras (BNA Sync)
              </h3>
              <p className="text-[11px] text-slate-400">Conversão em tempo real e formato decimal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Kwanza Angolano (Base)</div>
              <div className="text-lg font-bold text-amber-400 font-mono">1.0000 Kz (AOA)</div>
              <div className="text-[10px] text-slate-400">Moeda soberana de curso legal</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Dólar Norte-Americano</div>
              <div className="text-lg font-bold text-white font-mono">928.50 Kz (USD)</div>
              <div className="text-[10px] text-emerald-400">Taxa indicativa BNA</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3 rounded space-y-1">
              <div className="text-[10px] text-slate-400 uppercase">Euro da União Europeia</div>
              <div className="text-lg font-bold text-white font-mono">1,012.30 Kz (EUR)</div>
              <div className="text-[10px] text-emerald-400">Taxa indicativa BNA</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAF: TAX RULES */}
      {leafId === 'tax_rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Percent className="w-4 h-4 text-rose-400" />
                Tabela de Códigos & Motivos de Isenção de IVA (AGT Angola)
              </h3>
              <p className="text-[11px] text-slate-400">Regras fiscais nos termos do Código do IVA (CIVA)</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { code: 'NOR', name: 'Taxa Normal 14%', desc: 'Aplicável a mercadorias e serviços em geral' },
              { code: 'RED_7', name: 'Taxa Reduzida 7%', desc: 'Cesta básica e produtos de grande consumo' },
              { code: 'RED_5', name: 'Taxa Especial 5% (Cabinda)', desc: 'Regime aduaneiro e tributário da província de Cabinda' },
              { code: 'M02', name: 'Isenção Artigo 12.º do CIVA', desc: 'Transmissão de bens e serviços isentos na ordem jurídica' },
              { code: 'M04', name: 'Isenção Artigo 15.º do CIVA', desc: 'Operações de exportação e operações assimiladas' },
              { code: 'RET_6_5', name: 'Retenção na Fonte 6.5%', desc: 'Serviços prestados por sujeitos passivos residentes' },
            ].map((tax) => (
              <div
                key={tax.code}
                className="bg-[#252526] border border-[#3c3c3c] p-2.5 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-[#1e1e1e] border border-[#333333] font-mono text-amber-400 font-bold text-[10px]">
                    {tax.code}
                  </span>
                  <span className="font-bold text-white text-xs">{tax.name}</span>
                </div>
                <span className="text-[11px] text-slate-400">{tax.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. LEAF: PAYMENT PROVIDERS */}
      {leafId === 'payment_providers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Configuração de Provedores & Gateways de Pagamento
              </h3>
              <p className="text-[11px] text-slate-400">Credenciais EMIS, webhooks e liquidação de fundos</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {providers.map((prv) => (
              <div
                key={prv.id}
                className="bg-[#252526] border border-[#3c3c3c] p-3 rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    {prv.name}
                    <span className="text-[9px] font-mono text-sky-400">({prv.type})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ciclo: {prv.settlementCadence} • Moedas: {prv.supportedCurrencies.join(', ')}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {prv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. LEAF: DOCUMENT TYPES */}
      {leafId === 'document_types' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                Tipos de Documentos Comerciais & Fiscais Suportados
              </h3>
              <p className="text-[11px] text-slate-400">Requisitos legais e obrigatoriedade de assinatura RSA AGT</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Designação Oficial</th>
                  <th className="py-2.5 px-3">Finalidade Legal</th>
                  <th className="py-2.5 px-3 text-right">Assinatura Digital RSA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {documentTypes.map((doc) => (
                  <tr key={doc.code} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{doc.code}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{doc.name}</td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{doc.desc}</td>
                    <td className="py-2.5 px-3 text-right">
                      {doc.requiresSign ? (
                        <span className="text-emerald-400 font-bold text-[10px]">OBRIGATÓRIA (AGT)</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Não Requerida</span>
                      )}
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
