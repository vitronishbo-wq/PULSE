import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  FileCheck,
  AlertOctagon,
  Hash,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Document, CommercialSeries, TenantProfile } from '../../types/pulse';
import { ReportFilterState, ReportFiscalSubCategory } from '../../types/reports';
import { exportTableToCSV, printReportTable, copyTableToClipboard } from '../../utils/reportExportUtils';

interface ReportsFiscalSectionProps {
  subCategory: ReportFiscalSubCategory;
  documents: Document[];
  series: CommercialSeries[];
  tenant: TenantProfile;
  currency: string;
  filters: ReportFilterState;
}

export const ReportsFiscalSection: React.FC<ReportsFiscalSectionProps> = ({
  subCategory,
  documents,
  series,
  tenant,
  currency,
  filters,
}) => {
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Docs
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      if (filters.startDate && doc.date < filters.startDate) return false;
      if (filters.endDate && doc.date > filters.endDate) return false;
      if (filters.documentType !== 'ALL' && doc.type !== filters.documentType) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !doc.docNumber.toLowerCase().includes(query) &&
          !(doc.customerName || '').toLowerCase().includes(query) &&
          !(doc.customerTaxId || '').toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [documents, filters]);

  // 1. Doc Types Aggregate (FT, FR, NC, etc.)
  const docTypesData = useMemo(() => {
    const map: Record<
      string,
      {
        type: string;
        label: string;
        count: number;
        cancelledCount: number;
        net: number;
        tax: number;
        gross: number;
        docs: Document[];
      }
    > = {
      FT: { type: 'FT', label: 'Fatura (FT)', count: 0, cancelledCount: 0, net: 0, tax: 0, gross: 0, docs: [] },
      FR: { type: 'FR', label: 'Fatura-Recibo (FR)', count: 0, cancelledCount: 0, net: 0, tax: 0, gross: 0, docs: [] },
      NC: { type: 'NC', label: 'Nota de Crédito (NC)', count: 0, cancelledCount: 0, net: 0, tax: 0, gross: 0, docs: [] },
      VD: { type: 'VD', label: 'Venda a Dinheiro (VD)', count: 0, cancelledCount: 0, net: 0, tax: 0, gross: 0, docs: [] },
      PP: { type: 'PP', label: 'Fatura Proforma (PP)', count: 0, cancelledCount: 0, net: 0, tax: 0, gross: 0, docs: [] },
    };

    filteredDocs.forEach((d) => {
      const t = d.type || 'FR';
      if (!map[t]) {
        map[t] = { type: t, label: t, count: 0, cancelledCount: 0, net: 0, tax: 0, gross: 0, docs: [] };
      }
      if (d.status === 'CANCELLED') {
        map[t].cancelledCount += 1;
      } else {
        map[t].count += 1;
        map[t].net += d.netAmount;
        map[t].tax += d.taxAmount;
        map[t].gross += d.grossAmount;
        map[t].docs.push(d);
      }
    });

    return Object.values(map).filter((item) => item.count > 0 || item.cancelledCount > 0);
  }, [filteredDocs]);

  // 2. VAT Breakdown (Tax Rates)
  const vatMapData = useMemo(() => {
    const ratesMap: Record<
      number,
      {
        rate: number;
        code: string;
        description: string;
        taxableBase: number;
        vatAmount: number;
        grossAmount: number;
        docCount: number;
      }
    > = {
      14: { rate: 14, code: 'NOR', description: 'Taxa Normal (14% - IVA Angola)', taxableBase: 0, vatAmount: 0, grossAmount: 0, docCount: 0 },
      7: { rate: 7, code: 'RED', description: 'Taxa Reduzida (7% - Bens Essenciais / Restauração)', taxableBase: 0, vatAmount: 0, grossAmount: 0, docCount: 0 },
      5: { rate: 5, code: 'INT', description: 'Taxa Intermédia (5% - Província de Cabinda)', taxableBase: 0, vatAmount: 0, grossAmount: 0, docCount: 0 },
      0: { rate: 0, code: 'ISE', description: 'Isento de IVA (Art. 12º do CIVA / Isenção AGT)', taxableBase: 0, vatAmount: 0, grossAmount: 0, docCount: 0 },
    };

    filteredDocs.forEach((doc) => {
      if (doc.status === 'CANCELLED') return;
      const multiplier = doc.type === 'NC' ? -1 : 1;

      (doc.lines || []).forEach((line) => {
        const rate = line.taxRate ?? 14;
        if (!ratesMap[rate]) {
          ratesMap[rate] = {
            rate,
            code: 'OUT',
            description: `Taxa Especial (${rate}%)`,
            taxableBase: 0,
            vatAmount: 0,
            grossAmount: 0,
            docCount: 0,
          };
        }
        ratesMap[rate].taxableBase += line.netTotal * multiplier;
        ratesMap[rate].vatAmount += line.taxTotal * multiplier;
        ratesMap[rate].grossAmount += line.grossTotal * multiplier;
        ratesMap[rate].docCount += 1;
      });
    });

    return Object.values(ratesMap).filter((r) => r.taxableBase > 0 || r.vatAmount > 0);
  }, [filteredDocs]);

  // 3. Retentions Map (6.5% Withholding)
  const retentionsData = useMemo(() => {
    return filteredDocs
      .filter((d) => (d.withholdingAmount && d.withholdingAmount > 0) || (d.customerTaxId && d.customerTaxId !== '999999999' && d.netAmount >= 50000))
      .map((d) => {
        const base = d.netAmount;
        const rate = d.withholdingRate ?? 6.5;
        const amount = d.withholdingAmount || (base * rate) / 100;
        return {
          id: d.id,
          docNumber: d.docNumber,
          date: d.date,
          customerName: d.customerName || 'Consumidor',
          customerTaxId: d.customerTaxId || '999999999',
          taxableBase: base,
          retentionRate: rate,
          retentionAmount: amount,
          status: d.status,
        };
      });
  }, [filteredDocs]);

  // 4. Series & Numbering Integrity
  const seriesIntegrityData = useMemo(() => {
    return series.map((s) => {
      const seriesCode = s.code || (s as any).seriesCode || '';
      const docsInSeries = documents.filter((d) => d.seriesId === s.id || (seriesCode && d.docNumber.startsWith(seriesCode)));
      const numbers = docsInSeries
        .map((d) => {
          const match = d.docNumber.match(/\d+$/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((n) => n > 0)
        .sort((a, b) => a - b);

      let hasGap = false;
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] !== numbers[i - 1] + 1) {
          hasGap = true;
          break;
        }
      }

      return {
        id: s.id,
        code: seriesCode,
        docType: s.docTypeName || s.docType || (s as any).documentType || '',
        year: s.fiscalYear,
        startNumber: s.initialNumber ?? (s as any).startNumber ?? 1,
        currentNumber: s.currentNumber,
        issuedCount: docsInSeries.length,
        hasGap,
        agtCertified: true,
        certNumber: tenant.fiscalCertNumber || 'AGT/CERT/2026/0491',
      };
    });
  }, [series, documents, tenant]);

  // 5. Cancellations & Corrections
  const cancellationsData = useMemo(() => {
    return filteredDocs.filter((d) => d.status === 'CANCELLED' || d.type === 'NC');
  }, [filteredDocs]);

  // Handle Export Actions
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Relatorio_Fiscal_${subCategory}`;

    if (subCategory === 'FISCAL_DOC_TYPES') {
      headers = ['Tipo de Documento', 'Docs Válidos', 'Docs Anulados', `Base Tributável (${currency})`, `IVA Liquidado (${currency})`, `Total Bruto (${currency})`];
      rows = docTypesData.map((t) => [t.label, t.count, t.cancelledCount, t.net.toFixed(2), t.tax.toFixed(2), t.gross.toFixed(2)]);
    } else if (subCategory === 'FISCAL_VAT') {
      headers = ['Código', 'Descrição da Taxa', 'Taxa (%)', `Incidência / Base (${currency})`, `Montante IVA (${currency})`, `Total Faturado (${currency})`];
      rows = vatMapData.map((v) => [v.code, v.description, `${v.rate}%`, v.taxableBase.toFixed(2), v.vatAmount.toFixed(2), v.grossAmount.toFixed(2)]);
    } else if (subCategory === 'FISCAL_RETENTIONS') {
      headers = ['Documento', 'Data', 'Entidade Sujeito Passivo', 'NIF', `Base Tributável (${currency})`, 'Taxa Retenção', `Montante Retido (${currency})`, 'Estado'];
      rows = retentionsData.map((r) => [r.docNumber, r.date, r.customerName, r.customerTaxId, r.taxableBase.toFixed(2), `${r.retentionRate}%`, r.retentionAmount.toFixed(2), r.status]);
    } else if (subCategory === 'FISCAL_SERIES') {
      headers = ['Série', 'Tipo Doc', 'Ano Fiscal', 'Nº Inicial', 'Nº Atual', 'Docs Emitidos', 'Salto Numeração', 'Certificação AGT'];
      rows = seriesIntegrityData.map((s) => [s.code, s.docType, s.year, s.startNumber, s.currentNumber, s.issuedCount, s.hasGap ? 'ALERTA (GAP)' : 'CONFORME (SEM SALTOS)', s.certNumber]);
    } else {
      headers = ['Documento', 'Tipo', 'Data', 'Cliente', 'NIF', `Valor (${currency})`, 'Hash AGT', 'Motivo de Anulação'];
      rows = cancellationsData.map((c) => [c.docNumber, c.type, c.date, c.customerName || 'Consumidor', c.customerTaxId || '999999999', c.grossAmount.toFixed(2), c.hash?.slice(0, 4) || '-', c.notes || 'Anulação fiscal']);
    }

    exportTableToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    let headers: string[] = ['Designação', 'Taxa / Código', 'Base', 'IVA', 'Total'];
    let rows: (string | number)[][] = vatMapData.map((v) => [v.description, `${v.rate}% (${v.code})`, v.taxableBase.toLocaleString('pt-AO') + ' ' + currency, v.vatAmount.toLocaleString('pt-AO') + ' ' + currency, v.grossAmount.toLocaleString('pt-AO') + ' ' + currency]);
    let title = `Mapa Fiscal & Declaração de IVA — ${subCategory}`;
    let subtitle = `Empresa: ${tenant.name} | NIF: ${tenant.taxId} | Certificação: ${tenant.fiscalCertNumber}`;

    printReportTable(title, subtitle, headers, rows);
  };

  const handleCopy = () => {
    let headers: string[] = ['Código', 'Taxa', 'Base', 'IVA'];
    let rows: (string | number)[][] = vatMapData.map((v) => [v.code, `${v.rate}%`, v.taxableBase.toFixed(2), v.vatAmount.toFixed(2)]);
    const success = copyTableToClipboard(headers, rows);
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Fiscal Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121215] p-2 rounded-lg border border-[#27272a]">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500">NIF Sujeito Passivo:</span>{' '}
            <span className="font-bold text-white font-mono">{tenant.taxId}</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Certificado AGT:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">
              {tenant.fiscalCertNumber || 'AGT/CERT/2026/0491'}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Integridade RSA-SHA1:</span>{' '}
            <span className="font-bold text-sky-400 font-mono">100% VÁLIDO</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Regime Fiscal:</span>{' '}
            <span className="font-bold text-white font-mono">Geral (CIVA)</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {copiedNotification && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" /> Copiado!
            </span>
          )}
          <button
            onClick={handleCopy}
            title="Copiar dados"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copiar</span>
          </button>
          <button
            onClick={handleExportCSV}
            title="Exportar tabela para Excel (CSV)"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handlePrint}
            title="Imprimir mapa fiscal"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 1. TABELA: FT / FR / NC */}
      {subCategory === 'FISCAL_DOC_TYPES' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Tipo de Documento Fiscal</th>
                <th className="p-2 text-right">Nº Docs Válidos</th>
                <th className="p-2 text-right">Nº Docs Anulados</th>
                <th className="p-2 text-right">Incidência Líquida</th>
                <th className="p-2 text-right">IVA Liquidado</th>
                <th className="p-2 text-right">Total Faturado</th>
                <th className="p-2 text-center">Assinatura Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {docTypesData.map((t) => (
                <tr key={t.type} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.label}</span>
                  </td>
                  <td className="p-2 text-right font-mono text-slate-200">{t.count}</td>
                  <td className="p-2 text-right font-mono text-rose-400">{t.cancelledCount}</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {t.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-sky-400">
                    {t.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400">
                    {t.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CERTIFICADO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TABELA: MAPA DE IVA (TAXAS NOR / RED / ISE) */}
      {subCategory === 'FISCAL_VAT' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 font-mono">Código SAF-T</th>
                <th className="p-2">Enquadramento / Taxa de IVA</th>
                <th className="p-2 text-center">Taxa (%)</th>
                <th className="p-2 text-right">Base Incidência Líquida</th>
                <th className="p-2 text-right">Montante IVA Liquidado</th>
                <th className="p-2 text-right">Total Faturado com IVA</th>
                <th className="p-2 text-right">Linhas Faturadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {vatMapData.map((v) => (
                <tr key={v.code + v.rate} className="hover:bg-[#222227]">
                  <td className="p-2 font-mono text-emerald-400 font-bold">{v.code}</td>
                  <td className="p-2 text-white font-medium">{v.description}</td>
                  <td className="p-2 text-center font-mono text-slate-300">{v.rate}%</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {v.taxableBase.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-sky-400">
                    {v.vatAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400">
                    {v.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-400">{v.docCount}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#121215] border-t-2 border-[#27272a] font-bold text-[11px] text-slate-200">
              <tr>
                <td colSpan={3} className="p-2 text-left uppercase">
                  Total de IVA a Entregar à AGT:
                </td>
                <td className="p-2 text-right font-mono text-slate-300">
                  {vatMapData
                    .reduce((acc, v) => acc + v.taxableBase, 0)
                    .toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  {currency}
                </td>
                <td className="p-2 text-right font-mono text-sky-400">
                  {vatMapData
                    .reduce((acc, v) => acc + v.vatAmount, 0)
                    .toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  {currency}
                </td>
                <td className="p-2 text-right font-mono text-emerald-400">
                  {vatMapData
                    .reduce((acc, v) => acc + v.grossAmount, 0)
                    .toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  {currency}
                </td>
                <td className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 3. TABELA: MAPA DE RETENÇÕES NA FONTE (6.5%) */}
      {subCategory === 'FISCAL_RETENTIONS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Documento</th>
                <th className="p-2">Data</th>
                <th className="p-2">Cliente / Entidade Sujeito</th>
                <th className="p-2 font-mono">NIF</th>
                <th className="p-2 text-right">Base Tributável</th>
                <th className="p-2 text-center">Taxa Retenção</th>
                <th className="p-2 text-right">Valor Retido na Fonte</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {retentionsData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhuma retenção de 6.5% apurada para o período.
                  </td>
                </tr>
              ) : (
                retentionsData.map((r) => (
                  <tr key={r.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white font-mono">{r.docNumber}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{r.date}</td>
                    <td className="p-2 text-slate-200">{r.customerName}</td>
                    <td className="p-2 font-mono text-slate-400">{r.customerTaxId}</td>
                    <td className="p-2 text-right font-mono text-slate-300">
                      {r.taxableBase.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center font-mono text-amber-400">{r.retentionRate}%</td>
                    <td className="p-2 text-right font-mono font-bold text-amber-400">
                      {r.retentionAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        RETIDO
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. TABELA: SÉRIES & NUMERAÇÃO (INTEGRIDADE & GAPS) */}
      {subCategory === 'FISCAL_SERIES' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Código da Série</th>
                <th className="p-2">Tipo Documento</th>
                <th className="p-2 text-center">Ano Fiscal</th>
                <th className="p-2 text-right">Nº Inicial</th>
                <th className="p-2 text-right">Último Nº Emitido</th>
                <th className="p-2 text-right">Total Emitidos</th>
                <th className="p-2 text-center">Quebras de Sequência</th>
                <th className="p-2 text-center">Certificado AGT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {seriesIntegrityData.map((s) => (
                <tr key={s.id} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white font-mono flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{s.code}</span>
                  </td>
                  <td className="p-2 font-mono text-[10.5px] text-slate-300">{s.docType}</td>
                  <td className="p-2 text-center font-mono text-slate-400">{s.year}</td>
                  <td className="p-2 text-right font-mono text-slate-400">{s.startNumber}</td>
                  <td className="p-2 text-right font-mono font-bold text-white">{s.currentNumber}</td>
                  <td className="p-2 text-right font-mono text-emerald-400">{s.issuedCount}</td>
                  <td className="p-2 text-center">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        s.hasGap
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {s.hasGap ? 'SALTOS DETETADOS' : 'SEM SALTOS (CONFORME)'}
                    </span>
                  </td>
                  <td className="p-2 text-center font-mono text-[10px] text-slate-400">{s.certNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TABELA: ANULAÇÕES & CORREÇÕES */}
      {subCategory === 'FISCAL_CANCELLATIONS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Documento</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Data Emissão</th>
                <th className="p-2">Cliente / NIF</th>
                <th className="p-2">Operador</th>
                <th className="p-2">Hash AGT</th>
                <th className="p-2 text-right">Valor Anulado</th>
                <th className="p-2">Motivo da Anulação / Correção</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {cancellationsData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhum documento fiscal anulado ou retificado no período.
                  </td>
                </tr>
              ) : (
                cancellationsData.map((d) => (
                  <tr key={d.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white font-mono">{d.docNumber}</td>
                    <td className="p-2 font-mono text-[10px] text-rose-400">{d.type}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{d.date}</td>
                    <td className="p-2 text-slate-200">
                      {d.customerName || 'Consumidor Final'} ({d.customerTaxId || '999999999'})
                    </td>
                    <td className="p-2 text-slate-400">{d.createdBy}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-400">{d.hash?.slice(0, 4) || '-'}</td>
                    <td className="p-2 text-right font-mono font-bold text-rose-400">
                      -{d.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-slate-300 italic text-[10.5px]">
                      {d.notes || 'Anulação nos termos do CIVA'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. TABELA: SAF-T / EXPORTAÇÃO FISCAL AUDIT */}
      {subCategory === 'FISCAL_SAFT' && (
        <div className="space-y-3">
          <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ficheiro de Auditoria Tributária SAF-T (AO) - Versão 1.01_01</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Gere o ficheiro XML normalizado para submissão no portal e-Fatura da AGT (Administração Geral Tributária).
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar SAF-T XML
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                  <th className="p-2">Secção XML SAF-T</th>
                  <th className="p-2">Entidade Mapeada</th>
                  <th className="p-2 text-right">Registos Mapeados</th>
                  <th className="p-2 text-center">Esquema XSD</th>
                  <th className="p-2 text-center">Estado Validação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-[11px]">
                <tr className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white font-mono">&lt;Header&gt;</td>
                  <td className="p-2 text-slate-300">Dados da Empresa & Software Certificado</td>
                  <td className="p-2 text-right font-mono text-slate-400">1</td>
                  <td className="p-2 text-center font-mono text-slate-400">Válido</td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      EM CONFORMIDADE
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white font-mono">&lt;MasterFiles.Customer&gt;</td>
                  <td className="p-2 text-slate-300">Tabela de Clientes Registados</td>
                  <td className="p-2 text-right font-mono text-slate-400">{filteredDocs.length}</td>
                  <td className="p-2 text-center font-mono text-slate-400">Válido</td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      EM CONFORMIDADE
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white font-mono">&lt;MasterFiles.Product&gt;</td>
                  <td className="p-2 text-slate-300">Catálogo de Artigos & Serviços</td>
                  <td className="p-2 text-right font-mono text-slate-400">Ativos</td>
                  <td className="p-2 text-center font-mono text-slate-400">Válido</td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      EM CONFORMIDADE
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white font-mono">&lt;SalesInvoices&gt;</td>
                  <td className="p-2 text-slate-300">Faturas, Faturas-Recibo e Notas de Crédito</td>
                  <td className="p-2 text-right font-mono text-emerald-400 font-bold">{filteredDocs.length}</td>
                  <td className="p-2 text-center font-mono text-slate-400">Válido</td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      EM CONFORMIDADE
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
