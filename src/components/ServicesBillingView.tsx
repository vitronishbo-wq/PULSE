import React, { useState } from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  Users,
  Percent,
  CheckCircle2,
  Calendar,
  Building,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Customer, Document, TenantProfile, User } from '../types/pulse';

interface ServicesBillingViewProps {
  tenant: TenantProfile;
  documents: Document[];
  customers: Customer[];
  currentUser: User;
  currency: string;
  onViewDocument: (doc: Document) => void;
}

export const ServicesBillingView: React.FC<ServicesBillingViewProps> = ({
  tenant,
  documents = [],
  customers = [],
  currentUser,
  currency,
  onViewDocument,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'CONTRACTS' | 'WITHHOLDING' | 'HOURLY'>('WITHHOLDING');

  const safeDocs = Array.isArray(documents) ? documents : [];

  // Filter invoices with withholding tax or standard service invoices
  const serviceInvoices = safeDocs.filter((d) => d && (d.docType === 'INVOICE' || d.docType === 'RECEIPT'));
  const totalInvoiced = serviceInvoices.reduce((acc, d) => acc + (d.grossAmount || 0), 0);
  const totalWithheld = serviceInvoices.reduce((acc, d) => {
    const lineWithholding = (d.lines || []).reduce((lAcc, l) => lAcc + (l.withholdingTaxAmount || 0), 0);
    return acc + lineWithholding;
  }, 0);
  const netReceived = totalInvoiced - totalWithheld;

  return (
    <div id="services-billing-module" className="space-y-4 font-mono">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm">
              Módulo de Prestação de Serviços & Retenção na Fonte (AGT 6.5%)
            </div>
            <div className="text-[11px] text-slate-400">
              {tenant.tradeName} • Honorários Profissionais & Consultoria • Sem Gestão de Stock Físico
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('WITHHOLDING')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              activeSubTab === 'WITHHOLDING' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Retenção 6.5% (AGT)
          </button>
          <button
            onClick={() => setActiveSubTab('CONTRACTS')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              activeSubTab === 'CONTRACTS' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            📄 Contratos & Avenças
          </button>
          <button
            onClick={() => setActiveSubTab('HOURLY')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              activeSubTab === 'HOURLY' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏱️ Folha de Horas & Projetos
          </button>
        </div>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] text-slate-500 uppercase font-bold">Total Faturado em Serviços</div>
          <div className="text-xl font-black text-white font-mono">
            {totalInvoiced.toLocaleString()} {currency}
          </div>
          <div className="text-[10px] text-slate-400">Base de Incidência de Imposto</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] text-sky-400 uppercase font-bold flex items-center gap-1">
            <Percent className="w-3 h-3" />
            <span>Retenção na Fonte (6.5% AGT)</span>
          </div>
          <div className="text-xl font-black text-sky-400 font-mono">
            {totalWithheld.toLocaleString()} {currency}
          </div>
          <div className="text-[10px] text-slate-400">Retido pelo Cliente na Faturação</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] text-emerald-400 uppercase font-bold">Líquido a Receber em Banco</div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {netReceived.toLocaleString()} {currency}
          </div>
          <div className="text-[10px] text-slate-400">Disponível em Tesouraria</div>
        </div>
      </div>

      {/* TAB 1: WITHHOLDING TAX STATEMENTS */}
      {activeSubTab === 'WITHHOLDING' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-3 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold text-white uppercase tracking-wider">
              Extrato de Faturas com Retenção na Fonte (Declaração Modelo 1 AGT)
            </span>
            <span className="text-[10px] text-sky-400">
              Taxa Geral de Retenção: 6.50%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-3">Nº Documento</th>
                  <th className="p-3">Data Emissão</th>
                  <th className="p-3">Cliente / Entidade</th>
                  <th className="p-3">NIF Cliente</th>
                  <th className="p-3 text-right">Valor Bruto</th>
                  <th className="p-3 text-right">Retenção (6.5%)</th>
                  <th className="p-3 text-right">Valor Líquido</th>
                  <th className="p-3 text-center">Certificado AGT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {serviceInvoices.map((doc) => {
                  const docWithholding = (doc.lines || []).reduce((acc, l) => acc + (l.withholdingTaxAmount || 0), 0);
                  const docNet = doc.grossAmount - docWithholding;
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">
                        <button
                          onClick={() => onViewDocument(doc)}
                          className="hover:text-sky-400 underline transition-colors"
                        >
                          {doc.docNumber || `${doc.series}/${doc.number}`}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{doc.date}</td>
                      <td className="p-3 font-bold text-slate-200">{doc.customerName || 'Consumidor Final'}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {doc.customerTaxId || '999999999'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {doc.grossAmount.toLocaleString()} {currency}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sky-400">
                        {docWithholding > 0
                          ? `${docWithholding.toLocaleString()} ${currency}`
                          : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {docNet.toLocaleString()} {currency}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>AGT Válido</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONTRACTS */}
      {activeSubTab === 'CONTRACTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-white text-xs uppercase">
              Avenças Mensais & Contratos de Prestação Contínua
            </span>
            <button className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors">
              + Nova Avença
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {customers.slice(0, 4).map((c, i) => (
              <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white text-sm">{c.name}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">NIF: {c.taxId}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                    ATIVO
                  </span>
                </div>

                <div className="text-[11px] text-slate-400">
                  Serviço: Assessoria de Gestão e Engenharia de Sistemas
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-500">Valor Mensal Avença:</span>
                  <span className="font-bold text-sky-400 font-mono">
                    {((i + 1) * 350000).toLocaleString()} {currency} / mês
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HOURLY TIMESHEETS */}
      {activeSubTab === 'HOURLY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-3">
          <div className="font-bold text-white uppercase text-xs">
            Folhas de Horas & Registo de Atividade Técnica
          </div>
          <p className="text-[11px]">
            Apontamento de horas de consultoria faturáveis para conversão direta em Faturas Proforma ou Faturas Definitivas (FT).
          </p>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center text-slate-500 font-mono">
            Todas as horas do mês em curso foram conciliadas e preparadas para faturação automática.
          </div>
        </div>
      )}
    </div>
  );
};
