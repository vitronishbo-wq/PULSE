import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
  Printer,
  Copy,
} from 'lucide-react';
import {
  Document,
  Product,
  Customer,
  CashShiftRecord,
  User as PulseUser,
} from '../../types/pulse';
import { ReportFilterState, ReportSalesSubCategory } from '../../types/reports';
import { exportTableToCSV, printReportTable, copyTableToClipboard } from '../../utils/reportExportUtils';

interface ReportsSalesSectionProps {
  subCategory: ReportSalesSubCategory;
  documents: Document[];
  products: Product[];
  customers: Customer[];
  cashShifts: CashShiftRecord[];
  users: PulseUser[];
  currency: string;
  filters: ReportFilterState;
}

export const ReportsSalesSection: React.FC<ReportsSalesSectionProps> = ({
  subCategory,
  documents,
  products,
  customers,
  cashShifts,
  users,
  currency,
  filters,
}) => {
  // Collapsible row trackers for groupings
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<string>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter documents by date, operator, customer, status, search
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Date filter
      if (filters.startDate && doc.date < filters.startDate) return false;
      if (filters.endDate && doc.date > filters.endDate) return false;

      // Operator filter
      if (filters.operatorId !== 'ALL' && doc.createdBy !== filters.operatorId) return false;

      // Customer filter
      if (filters.customerId !== 'ALL' && doc.customerId !== filters.customerId) return false;

      // Document Type
      if (filters.documentType !== 'ALL' && doc.type !== filters.documentType) return false;

      // Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesDoc = doc.docNumber.toLowerCase().includes(query);
        const matchesCust = (doc.customerName || '').toLowerCase().includes(query);
        const matchesTaxId = (doc.customerTaxId || '').toLowerCase().includes(query);
        const matchesItem = doc.lines?.some((l) => l.description.toLowerCase().includes(query));
        if (!matchesDoc && !matchesCust && !matchesTaxId && !matchesItem) return false;
      }

      return true;
    });
  }, [documents, filters]);

  // Aggregate totals
  const totals = useMemo(() => {
    let net = 0;
    let tax = 0;
    let gross = 0;
    let cancelledCount = 0;
    let validCount = 0;

    filteredDocs.forEach((d) => {
      if (d.status === 'CANCELLED') {
        cancelledCount++;
      } else if (d.type === 'NC') {
        // Credit note decreases revenue
        net -= d.netAmount;
        tax -= d.taxAmount;
        gross -= d.grossAmount;
        validCount++;
      } else {
        net += d.netAmount;
        tax += d.taxAmount;
        gross += d.grossAmount;
        validCount++;
      }
    });

    const avgTicket = validCount > 0 ? gross / validCount : 0;
    return { net, tax, gross, validCount, cancelledCount, avgTicket };
  }, [filteredDocs]);

  // --- Sub-report: 1. VENDAS POR PERÍODO ---
  const periodData = useMemo(() => {
    const map: Record<
      string,
      { date: string; docCount: number; net: number; tax: number; gross: number; itemsCount: number; docs: Document[] }
    > = {};

    filteredDocs.forEach((doc) => {
      if (doc.status === 'CANCELLED') return;
      const key = doc.date.slice(0, 10);
      if (!map[key]) {
        map[key] = { date: key, docCount: 0, net: 0, tax: 0, gross: 0, itemsCount: 0, docs: [] };
      }
      const multiplier = doc.type === 'NC' ? -1 : 1;
      map[key].docCount += 1;
      map[key].net += doc.netAmount * multiplier;
      map[key].tax += doc.taxAmount * multiplier;
      map[key].gross += doc.grossAmount * multiplier;
      map[key].itemsCount += (doc.lines || []).reduce((acc, l) => acc + l.qty, 0) * multiplier;
      map[key].docs.push(doc);
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredDocs]);

  // --- Sub-report: 2. VENDAS POR PRODUTO / CATEGORIA ---
  const productCategoryData = useMemo(() => {
    const catMap: Record<
      string,
      {
        category: string;
        qty: number;
        netRevenue: number;
        tax: number;
        grossRevenue: number;
        cost: number;
        products: Record<string, { id: string; name: string; sku: string; qty: number; net: number; gross: number; cost: number }>;
      }
    > = {};

    filteredDocs.forEach((doc) => {
      if (doc.status === 'CANCELLED') return;
      const multiplier = doc.type === 'NC' ? -1 : 1;

      (doc.lines || []).forEach((line) => {
        const prod = products.find((p) => p.id === line.productId);
        const cat = prod?.category || 'Geral / Outros';
        const unitCost = prod?.costPrice || line.unitPrice * 0.65; // fallback cost estimate

        if (!catMap[cat]) {
          catMap[cat] = {
            category: cat,
            qty: 0,
            netRevenue: 0,
            tax: 0,
            grossRevenue: 0,
            cost: 0,
            products: {},
          };
        }

        const lineNet = line.netTotal * multiplier;
        const lineTax = line.taxTotal * multiplier;
        const lineGross = line.grossTotal * multiplier;
        const lineCost = unitCost * line.qty * multiplier;

        catMap[cat].qty += line.qty * multiplier;
        catMap[cat].netRevenue += lineNet;
        catMap[cat].tax += lineTax;
        catMap[cat].grossRevenue += lineGross;
        catMap[cat].cost += lineCost;

        if (!catMap[cat].products[line.productId]) {
          catMap[cat].products[line.productId] = {
            id: line.productId,
            name: line.description,
            sku: prod?.sku || line.productId.slice(0, 6),
            qty: 0,
            net: 0,
            gross: 0,
            cost: 0,
          };
        }

        catMap[cat].products[line.productId].qty += line.qty * multiplier;
        catMap[cat].products[line.productId].net += lineNet;
        catMap[cat].products[line.productId].gross += lineGross;
        catMap[cat].products[line.productId].cost += lineCost;
      });
    });

    return Object.values(catMap).sort((a, b) => b.grossRevenue - a.grossRevenue);
  }, [filteredDocs, products]);

  // --- Sub-report: 3. VENDAS POR OPERADOR ---
  const operatorData = useMemo(() => {
    const opMap: Record<
      string,
      {
        operatorId: string;
        operatorName: string;
        docCount: number;
        net: number;
        tax: number;
        gross: number;
        discountsGiven: number;
        cancels: number;
        cash: number;
        card: number;
        transfer: number;
        docs: Document[];
      }
    > = {};

    filteredDocs.forEach((doc) => {
      const opId = doc.createdBy || 'unknown';
      const user = users.find((u) => u.uid === opId);
      const opName = user?.name || (opId === 'usr_admin_01' ? 'Administrador Geral' : opId);

      if (!opMap[opId]) {
        opMap[opId] = {
          operatorId: opId,
          operatorName: opName,
          docCount: 0,
          net: 0,
          tax: 0,
          gross: 0,
          discountsGiven: 0,
          cancels: 0,
          cash: 0,
          card: 0,
          transfer: 0,
          docs: [],
        };
      }

      if (doc.status === 'CANCELLED') {
        opMap[opId].cancels += 1;
        return;
      }

      const multiplier = doc.type === 'NC' ? -1 : 1;
      opMap[opId].docCount += 1;
      opMap[opId].net += doc.netAmount * multiplier;
      opMap[opId].tax += doc.taxAmount * multiplier;
      opMap[opId].gross += doc.grossAmount * multiplier;
      opMap[opId].docs.push(doc);

      // Discount sum
      const totalDisc = (doc.lines || []).reduce((acc, l) => acc + (l.discountAmount || 0), 0);
      opMap[opId].discountsGiven += totalDisc;

      if (doc.paymentMethod === 'CASH') opMap[opId].cash += doc.grossAmount * multiplier;
      else if (doc.paymentMethod === 'TPA' || doc.paymentMethod === 'MULTICAIXA') opMap[opId].card += doc.grossAmount * multiplier;
      else opMap[opId].transfer += doc.grossAmount * multiplier;
    });

    return Object.values(opMap).sort((a, b) => b.gross - a.gross);
  }, [filteredDocs, users]);

  // --- Sub-report: 4. VENDAS POR TERMINAL / TURNO ---
  const terminalShiftData = useMemo(() => {
    return cashShifts.map((shift) => {
      const shiftDocs = filteredDocs.filter((d) => d.date >= shift.openedAt.slice(0, 10));
      return {
        id: shift.id,
        shiftNumber: shift.shiftNumber,
        terminalId: shift.terminalId,
        operatorName: shift.operatorName,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt || 'Em Aberto',
        openingFloat: shift.openingFloat,
        totalSalesCash: shift.totalSalesCash,
        totalCard: shift.totalCard,
        totalTransfers: shift.totalTransfers,
        totalInflows: shift.totalInflows,
        totalOutflows: shift.totalOutflows,
        systemExpectedCash: shift.systemExpectedCash,
        physicalCountedCash: shift.physicalCountedCash ?? shift.systemExpectedCash,
        difference: shift.difference ?? 0,
        status: shift.status,
        docCount: shiftDocs.length,
      };
    });
  }, [cashShifts, filteredDocs]);

  // --- Sub-report: 5. VENDAS POR CLIENTE ---
  const customerSalesData = useMemo(() => {
    const custMap: Record<
      string,
      {
        customerId: string;
        customerName: string;
        customerTaxId: string;
        docCount: number;
        net: number;
        tax: number;
        gross: number;
        lastPurchase: string;
        currentDebt: number;
      }
    > = {};

    filteredDocs.forEach((doc) => {
      if (doc.status === 'CANCELLED') return;
      const custId = doc.customerId || 'CONSUMIDOR_FINAL';
      const custObj = customers.find((c) => c.id === custId);
      const name = doc.customerName || custObj?.name || 'Consumidor Final';
      const taxId = doc.customerTaxId || custObj?.taxId || '999999999';

      if (!custMap[custId]) {
        custMap[custId] = {
          customerId: custId,
          customerName: name,
          customerTaxId: taxId,
          docCount: 0,
          net: 0,
          tax: 0,
          gross: 0,
          lastPurchase: doc.date,
          currentDebt: custObj?.currentBalance || 0,
        };
      }

      const multiplier = doc.type === 'NC' ? -1 : 1;
      custMap[custId].docCount += 1;
      custMap[custId].net += doc.netAmount * multiplier;
      custMap[custId].tax += doc.taxAmount * multiplier;
      custMap[custId].gross += doc.grossAmount * multiplier;
      if (doc.date > custMap[custId].lastPurchase) {
        custMap[custId].lastPurchase = doc.date;
      }
    });

    return Object.values(custMap).sort((a, b) => b.gross - a.gross);
  }, [filteredDocs, customers]);

  // --- Sub-report: 7. DEVOLUÇÕES & CANCELAMENTOS ---
  const returnsData = useMemo(() => {
    return filteredDocs.filter((d) => d.type === 'NC' || d.status === 'CANCELLED');
  }, [filteredDocs]);

  // --- Sub-report: 8. MEIOS DE PAGAMENTO ---
  const paymentMethodsData = useMemo(() => {
    const methodMap: Record<string, { method: string; label: string; count: number; total: number }> = {
      CASH: { method: 'CASH', label: 'Numerário / Dinheiro Físico', count: 0, total: 0 },
      TPA: { method: 'TPA', label: 'TPA / Cartão Multicaixa', count: 0, total: 0 },
      MULTICAIXA: { method: 'MULTICAIXA', label: 'Multicaixa Express / GPO', count: 0, total: 0 },
      TRANSFER: { method: 'TRANSFER', label: 'Transferência Bancária (IBAN)', count: 0, total: 0 },
      CREDIT: { method: 'CREDIT', label: 'Venda a Prazo (Conta-Corrente)', count: 0, total: 0 },
      VOUCHER: { method: 'VOUCHER', label: 'Vales / Vouchers de Consumo', count: 0, total: 0 },
    };

    let grandTotal = 0;
    filteredDocs.forEach((doc) => {
      if (doc.status === 'CANCELLED') return;
      const multiplier = doc.type === 'NC' ? -1 : 1;
      const methodKey = doc.paymentMethod || 'CASH';
      if (!methodMap[methodKey]) {
        methodMap[methodKey] = { method: methodKey, label: methodKey, count: 0, total: 0 };
      }
      methodMap[methodKey].count += 1;
      methodMap[methodKey].total += doc.grossAmount * multiplier;
      grandTotal += doc.grossAmount * multiplier;
    });

    return Object.values(methodMap)
      .map((item) => ({
        ...item,
        percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
      }))
      .filter((item) => item.count > 0 || item.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredDocs]);

  // Handle Export Actions
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Relatorio_Vendas_${subCategory}`;

    if (subCategory === 'SALES_PERIOD') {
      headers = ['Data / Período', 'Nº Documentos', 'Qtd Artigos', `Total Líquido (${currency})`, `IVA (${currency})`, `Total Bruto (${currency})`];
      rows = periodData.map((r) => [r.date, r.docCount, r.itemsCount, r.net.toFixed(2), r.tax.toFixed(2), r.gross.toFixed(2)]);
    } else if (subCategory === 'SALES_PRODUCT') {
      headers = ['Categoria / Artigo', 'Qtd Vendida', `Faturação Líquida (${currency})`, `IVA (${currency})`, `Faturação Bruta (${currency})`, `Custo Est. (${currency})`, 'Margem Bruta (Kz)', 'Margem (%)'];
      rows = productCategoryData.map((c) => {
        const marginVal = c.netRevenue - c.cost;
        const marginPct = c.netRevenue > 0 ? (marginVal / c.netRevenue) * 100 : 0;
        return [c.category, c.qty, c.netRevenue.toFixed(2), c.tax.toFixed(2), c.grossRevenue.toFixed(2), c.cost.toFixed(2), marginVal.toFixed(2), `${marginPct.toFixed(1)}%`];
      });
    } else if (subCategory === 'SALES_OPERATOR') {
      headers = ['Operador', 'Nº Vendas', `Total Líquido (${currency})`, `Total Bruto (${currency})`, `Descontos (${currency})`, 'Anulações', `Numerário (${currency})`, `TPA/Cartão (${currency})`];
      rows = operatorData.map((o) => [o.operatorName, o.docCount, o.net.toFixed(2), o.gross.toFixed(2), o.discountsGiven.toFixed(2), o.cancels, o.cash.toFixed(2), o.card.toFixed(2)]);
    } else if (subCategory === 'SALES_CUSTOMER') {
      headers = ['Cliente', 'NIF', 'Nº Compras', `Total Líquido (${currency})`, `Total Faturado (${currency})`, 'Última Compra', `Saldo Devedor (${currency})`];
      rows = customerSalesData.map((c) => [c.customerName, c.customerTaxId, c.docCount, c.net.toFixed(2), c.gross.toFixed(2), c.lastPurchase, c.currentDebt.toFixed(2)]);
    } else if (subCategory === 'SALES_DOCS') {
      headers = ['Nº Documento', 'Tipo', 'Data/Hora', 'Cliente', 'NIF', 'Operador', 'Método Pagamento', `Total Líquido (${currency})`, `IVA (${currency})`, `Total Bruto (${currency})`, 'Estado', 'Hash AGT'];
      rows = filteredDocs.map((d) => [d.docNumber, d.type, d.date, d.customerName || 'Consumidor Final', d.customerTaxId || '999999999', d.createdBy, d.paymentMethod, d.netAmount.toFixed(2), d.taxAmount.toFixed(2), d.grossAmount.toFixed(2), d.status, d.hash?.slice(0, 4) || '-']);
    } else if (subCategory === 'SALES_PAYMENTS') {
      headers = ['Meio de Pagamento', 'Nº Transações', `Total Arrecadado (${currency})`, '% do Faturamento'];
      rows = paymentMethodsData.map((m) => [m.label, m.count, m.total.toFixed(2), `${m.percentage.toFixed(1)}%`]);
    } else {
      headers = ['Nº Documento', 'Tipo', 'Data', 'Cliente', 'Motivo / Observações', `Valor (${currency})`, 'Estado'];
      rows = returnsData.map((r) => [r.docNumber, r.type, r.date, r.customerName || 'Consumidor Final', r.notes || 'Anulação/Devolução', r.grossAmount.toFixed(2), r.status]);
    }

    exportTableToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let title = `Relatório de Vendas — ${subCategory}`;
    let subtitle = `Intervalo: ${filters.startDate || 'Início'} a ${filters.endDate || 'Atual'} | Total Documentos: ${filteredDocs.length}`;

    if (subCategory === 'SALES_PERIOD') {
      headers = ['Data', 'Nº Docs', 'Qtd Artigos', 'Líquido', 'IVA', 'Total Bruto'];
      rows = periodData.map((r) => [r.date, r.docCount, r.itemsCount, r.net.toLocaleString('pt-AO') + ' ' + currency, r.tax.toLocaleString('pt-AO') + ' ' + currency, r.gross.toLocaleString('pt-AO') + ' ' + currency]);
    } else if (subCategory === 'SALES_DOCS') {
      headers = ['Nº Doc', 'Tipo', 'Data', 'Cliente', 'NIF', 'Método', 'Líquido', 'Total Bruto', 'Estado'];
      rows = filteredDocs.map((d) => [d.docNumber, d.type, d.date, d.customerName || 'Consumidor Final', d.customerTaxId || '999999999', d.paymentMethod, d.netAmount.toLocaleString('pt-AO'), d.grossAmount.toLocaleString('pt-AO'), d.status]);
    } else {
      headers = ['Item', 'Qtd / Transações', 'Líquido', 'Total'];
      rows = paymentMethodsData.map((m) => [m.label, m.count, '-', m.total.toLocaleString('pt-AO') + ' ' + currency]);
    }

    const summaryHtml = `<strong>Total Geral Bruto: ${totals.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${currency}</strong> | Total Líquido: ${totals.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${currency} | IVA Total: ${totals.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${currency}`;
    printReportTable(title, subtitle, headers, rows, summaryHtml);
  };

  const handleCopy = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (subCategory === 'SALES_PERIOD') {
      headers = ['Data', 'Nº Docs', 'Qtd Artigos', 'Líquido', 'IVA', 'Total Bruto'];
      rows = periodData.map((r) => [r.date, r.docCount, r.itemsCount, r.net.toFixed(2), r.tax.toFixed(2), r.gross.toFixed(2)]);
    } else {
      headers = ['Nº Documento', 'Tipo', 'Data', 'Cliente', 'Líquido', 'IVA', 'Bruto', 'Estado'];
      rows = filteredDocs.map((d) => [d.docNumber, d.type, d.date, d.customerName || 'Consumidor Final', d.netAmount.toFixed(2), d.taxAmount.toFixed(2), d.grossAmount.toFixed(2), d.status]);
    }

    const success = copyTableToClipboard(headers, rows);
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Action Bar & Quick Aggregates */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121215] p-2 rounded-lg border border-[#27272a]">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500">Documentos Válidos:</span>{' '}
            <span className="font-bold text-white">{totals.validCount}</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Total Líquido:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">
              {totals.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">IVA Total:</span>{' '}
            <span className="font-bold text-sky-400 font-mono">
              {totals.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Faturação Bruta:</span>{' '}
            <span className="font-bold text-white font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              {totals.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3 hidden lg:block">
            <span className="text-slate-500">Ticket Médio:</span>{' '}
            <span className="font-bold text-amber-400 font-mono">
              {totals.avgTicket.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {copiedNotification && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
              <CheckCircle2 className="w-3 h-3" /> Copiado!
            </span>
          )}
          <button
            onClick={handleCopy}
            title="Copiar dados para área de transferência"
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
            title="Imprimir mapa ou guardar como PDF"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 1. TABELA: VENDAS POR PERÍODO */}
      {subCategory === 'SALES_PERIOD' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Data / Período</th>
                <th className="p-2 text-right">Nº Documentos</th>
                <th className="p-2 text-right">Qtd Artigos</th>
                <th className="p-2 text-right">Total Líquido</th>
                <th className="p-2 text-right">IVA Liquidado</th>
                <th className="p-2 text-right">Total Bruto</th>
                <th className="p-2 text-right">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {periodData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhum registo de venda encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                periodData.map((row, idx) => {
                  const isExpanded = !!expandedRows[row.date];
                  const avg = row.docCount > 0 ? row.gross / row.docCount : 0;
                  return (
                    <React.Fragment key={row.date}>
                      <tr
                        onClick={() => toggleRow(row.date)}
                        className="hover:bg-[#222227] cursor-pointer transition-colors"
                      >
                        <td className="p-2 text-center text-slate-500">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-400 inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 inline" />
                          )}
                        </td>
                        <td className="p-2 font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          <span>{row.date}</span>
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">{row.docCount}</td>
                        <td className="p-2 text-right font-mono text-slate-400">{row.itemsCount}</td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {row.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                        </td>
                        <td className="p-2 text-right font-mono text-sky-400">
                          {row.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-emerald-400">
                          {row.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                        </td>
                        <td className="p-2 text-right font-mono text-amber-400">
                          {avg.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                        </td>
                      </tr>

                      {/* Drilldown details on expand */}
                      {isExpanded && (
                        <tr className="bg-[#121215]">
                          <td colSpan={8} className="p-3 pl-8">
                            <div className="border border-[#27272a] rounded p-2 bg-[#18181b] space-y-1">
                              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                                Documentos emitidos no dia {row.date} ({row.docs.length}):
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {row.docs.map((d) => (
                                  <div
                                    key={d.id}
                                    className="p-1.5 bg-[#121215] border border-[#27272a] rounded flex items-center justify-between text-[10.5px]"
                                  >
                                    <div>
                                      <span className="font-bold text-white">{d.docNumber}</span>{' '}
                                      <span className="text-[9px] text-slate-400">({d.type})</span>
                                      <div className="text-[9px] text-slate-500 truncate max-w-[140px]">
                                        {d.customerName || 'Consumidor Final'}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-emerald-400">
                                        {d.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                                        {currency}
                                      </div>
                                      <div className="text-[9px] text-slate-400">{d.paymentMethod}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {periodData.length > 0 && (
              <tfoot className="bg-[#121215] border-t-2 border-[#27272a] font-bold text-[11px] text-slate-200">
                <tr>
                  <td colSpan={2} className="p-2 text-left uppercase">
                    Total Geral:
                  </td>
                  <td className="p-2 text-right font-mono">{totals.validCount}</td>
                  <td className="p-2 text-right font-mono text-slate-400">-</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {totals.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-sky-400">
                    {totals.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-emerald-400">
                    {totals.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-amber-400">
                    {totals.avgTicket.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* 2. TABELA: VENDAS POR PRODUTO / CATEGORIA */}
      {subCategory === 'SALES_PRODUCT' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Categoria / Artigo</th>
                <th className="p-2 text-right">Qtd Vendida</th>
                <th className="p-2 text-right">Faturação Líquida</th>
                <th className="p-2 text-right">IVA</th>
                <th className="p-2 text-right">Faturação Bruta</th>
                <th className="p-2 text-right">Custo Estimado</th>
                <th className="p-2 text-right">Margem Bruta (Kz)</th>
                <th className="p-2 text-right">Margem (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {productCategoryData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    Nenhuma venda de artigos encontrada.
                  </td>
                </tr>
              ) : (
                productCategoryData.map((catGroup) => {
                  const isExpanded = !!expandedRows[catGroup.category];
                  const marginKz = catGroup.netRevenue - catGroup.cost;
                  const marginPct = catGroup.netRevenue > 0 ? (marginKz / catGroup.netRevenue) * 100 : 0;
                  const prodList = (
                    Object.values(catGroup.products) as {
                      id: string;
                      name: string;
                      sku: string;
                      qty: number;
                      net: number;
                      gross: number;
                      cost: number;
                    }[]
                  ).sort((a, b) => b.gross - a.gross);

                  return (
                    <React.Fragment key={catGroup.category}>
                      <tr
                        onClick={() => toggleRow(catGroup.category)}
                        className="hover:bg-[#222227] cursor-pointer font-bold bg-[#141417]"
                      >
                        <td className="p-2 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-emerald-400 inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500 inline" />
                          )}
                        </td>
                        <td className="p-2 text-white flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{catGroup.category}</span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            ({prodList.length} artigos)
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono text-slate-300">{catGroup.qty}</td>
                        <td className="p-2 text-right font-mono text-slate-300">
                          {catGroup.netRevenue.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                          {currency}
                        </td>
                        <td className="p-2 text-right font-mono text-sky-400">
                          {catGroup.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                          {currency}
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-400">
                          {catGroup.grossRevenue.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                          {currency}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-400">
                          {catGroup.cost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                          {currency}
                        </td>
                        <td className="p-2 text-right font-mono text-emerald-400">
                          {marginKz.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                          {currency}
                        </td>
                        <td
                          className={`p-2 text-right font-mono ${
                            marginPct >= 30 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {marginPct.toFixed(1)}%
                        </td>
                      </tr>

                      {/* Expanded Products inside Category */}
                      {isExpanded &&
                        prodList.map((p) => {
                          const pMargin = p.net - p.cost;
                          const pPct = p.net > 0 ? (pMargin / p.net) * 100 : 0;
                          return (
                            <tr key={p.id} className="bg-[#18181b] hover:bg-[#202025] text-[10.5px]">
                              <td className="p-1.5 text-center text-slate-600">↳</td>
                              <td className="p-1.5 pl-6 text-slate-300">
                                <span className="font-medium text-white">{p.name}</span>
                                <span className="text-[9px] text-slate-500 font-mono ml-2">[{p.sku}]</span>
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-300">{p.qty}</td>
                              <td className="p-1.5 text-right font-mono text-slate-400">
                                {p.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-sky-400/80">
                                {(p.gross - p.net).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-emerald-300">
                                {p.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-500">
                                {p.cost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-300">
                                {pMargin.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-1.5 text-right font-mono text-slate-400">{pPct.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. TABELA: VENDAS POR OPERADOR */}
      {subCategory === 'SALES_OPERATOR' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Operador / Utilizador</th>
                <th className="p-2 text-right">Nº Vendas</th>
                <th className="p-2 text-right">Total Líquido</th>
                <th className="p-2 text-right">IVA</th>
                <th className="p-2 text-right">Total Bruto</th>
                <th className="p-2 text-right">Descontos Concedidos</th>
                <th className="p-2 text-right">Anulações</th>
                <th className="p-2 text-right">Numerário</th>
                <th className="p-2 text-right">TPA / Cartão</th>
                <th className="p-2 text-right">Transferência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {operatorData.map((op) => (
                <tr key={op.operatorId} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{op.operatorName}</span>
                    <span className="text-[9px] text-slate-500 font-normal">[{op.operatorId}]</span>
                  </td>
                  <td className="p-2 text-right font-mono text-slate-300">{op.docCount}</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {op.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-sky-400">
                    {op.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400">
                    {op.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-amber-400">
                    {op.discountsGiven.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-red-400">{op.cancels}</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {op.cash.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {op.card.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {op.transfer.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. TABELA: VENDAS POR TERMINAL / TURNO */}
      {subCategory === 'SALES_TERMINAL' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Turno / Terminal</th>
                <th className="p-2">Operador</th>
                <th className="p-2">Abertura</th>
                <th className="p-2">Fecho</th>
                <th className="p-2 text-right">Fundo Maneio</th>
                <th className="p-2 text-right">Vendas Numerário</th>
                <th className="p-2 text-right">TPA / Cartão</th>
                <th className="p-2 text-right">Transferências</th>
                <th className="p-2 text-right">Saldo Sistema</th>
                <th className="p-2 text-right">Contagem Física</th>
                <th className="p-2 text-right">Diferença (Quebra/Sobra)</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {terminalShiftData.map((shift) => (
                <tr key={shift.id} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white">
                    Turno #{shift.shiftNumber} ({shift.terminalId})
                  </td>
                  <td className="p-2 text-slate-300">{shift.operatorName}</td>
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{shift.openedAt}</td>
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{shift.closedAt}</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {shift.openingFloat.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-emerald-400">
                    {shift.totalSalesCash.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-sky-400">
                    {shift.totalCard.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-purple-400">
                    {shift.totalTransfers.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-200 font-bold">
                    {shift.systemExpectedCash.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {shift.physicalCountedCash.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td
                    className={`p-2 text-right font-mono font-bold ${
                      shift.difference === 0
                        ? 'text-slate-400'
                        : shift.difference > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {shift.difference > 0 ? '+' : ''}
                    {shift.difference.toLocaleString('pt-AO')} {currency}
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        shift.status === 'OPEN'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {shift.status === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TABELA: VENDAS POR CLIENTE */}
      {subCategory === 'SALES_CUSTOMER' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Cliente / Entidade</th>
                <th className="p-2 font-mono">NIF</th>
                <th className="p-2 text-right">Nº Compras</th>
                <th className="p-2 text-right">Total Líquido</th>
                <th className="p-2 text-right">IVA</th>
                <th className="p-2 text-right">Total Faturado</th>
                <th className="p-2">Última Compra</th>
                <th className="p-2 text-right">Saldo Devedor Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {customerSalesData.map((c) => (
                <tr key={c.customerId} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white">{c.customerName}</td>
                  <td className="p-2 font-mono text-slate-400">{c.customerTaxId}</td>
                  <td className="p-2 text-right font-mono text-slate-300">{c.docCount}</td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {c.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-sky-400">
                    {c.tax.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400">
                    {c.gross.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{c.lastPurchase}</td>
                  <td
                    className={`p-2 text-right font-mono font-bold ${
                      c.currentDebt > 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}
                  >
                    {c.currentDebt.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. TABELA: DOCUMENTOS EMITIDOS */}
      {subCategory === 'SALES_DOCS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Documento</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Cliente / NIF</th>
                <th className="p-2">Operador</th>
                <th className="p-2">Método</th>
                <th className="p-2 text-right">Líquido</th>
                <th className="p-2 text-right">IVA</th>
                <th className="p-2 text-right">Total Bruto</th>
                <th className="p-2 text-center">Hash AGT</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredDocs.map((doc) => {
                const isExpanded = !!expandedRows[doc.id];
                return (
                  <React.Fragment key={doc.id}>
                    <tr
                      onClick={() => toggleRow(doc.id)}
                      className="hover:bg-[#222227] cursor-pointer transition-colors"
                    >
                      <td className="p-2 text-center text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-emerald-400 inline" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 inline" />
                        )}
                      </td>
                      <td className="p-2 font-bold text-white font-mono">{doc.docNumber}</td>
                      <td className="p-2 font-mono text-[10px]">
                        <span className="bg-[#121215] px-1.5 py-0.5 rounded border border-[#27272a] text-slate-300">
                          {doc.type}
                        </span>
                      </td>
                      <td className="p-2 font-mono text-slate-400 text-[10px]">{doc.date}</td>
                      <td className="p-2">
                        <div className="text-white font-medium truncate max-w-[180px]">
                          {doc.customerName || 'Consumidor Final'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {doc.customerTaxId || '999999999'}
                        </div>
                      </td>
                      <td className="p-2 text-slate-400 text-[10.5px]">{doc.createdBy}</td>
                      <td className="p-2 font-mono text-[10px] text-slate-300">{doc.paymentMethod}</td>
                      <td className="p-2 text-right font-mono text-slate-300">
                        {doc.netAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono text-sky-400">
                        {doc.taxAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">
                        {doc.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center font-mono text-[10px] text-slate-400">
                        {doc.hash ? doc.hash.slice(0, 4) : '-'}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            doc.status === 'ISSUED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {doc.status === 'ISSUED' ? 'EMITIDO' : 'ANULADO'}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable line items */}
                    {isExpanded && (
                      <tr className="bg-[#121215]">
                        <td colSpan={12} className="p-3 pl-8">
                          <div className="border border-[#27272a] rounded bg-[#18181b] p-2 space-y-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              Artigos Faturados no documento {doc.docNumber}:
                            </div>
                            <table className="w-full text-left text-[10.5px]">
                              <thead>
                                <tr className="text-slate-500 border-b border-[#27272a]">
                                  <th className="p-1">Descrição</th>
                                  <th className="p-1 text-right">Qtd</th>
                                  <th className="p-1 text-right">Preço Unit.</th>
                                  <th className="p-1 text-right">Taxa IVA</th>
                                  <th className="p-1 text-right">Total Linha</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#27272a]/50">
                                {doc.lines?.map((l, i) => (
                                  <tr key={i}>
                                    <td className="p-1 text-slate-300">{l.description}</td>
                                    <td className="p-1 text-right font-mono">{l.qty}</td>
                                    <td className="p-1 text-right font-mono">
                                      {l.unitPrice.toLocaleString('pt-AO')} {currency}
                                    </td>
                                    <td className="p-1 text-right font-mono text-sky-400">{l.taxRate}%</td>
                                    <td className="p-1 text-right font-mono font-bold text-emerald-400">
                                      {l.grossTotal.toLocaleString('pt-AO')} {currency}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. TABELA: DEVOLUÇÕES / CANCELAMENTOS */}
      {subCategory === 'SALES_RETURNS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Documento / Nota Crédito</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Data</th>
                <th className="p-2">Cliente</th>
                <th className="p-2">Operador</th>
                <th className="p-2">Motivo / Justificação</th>
                <th className="p-2 text-right">Valor Estornado</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {returnsData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    Nenhuma devolução ou documento cancelado no período selecionado.
                  </td>
                </tr>
              ) : (
                returnsData.map((d) => (
                  <tr key={d.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white font-mono flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>{d.docNumber}</span>
                    </td>
                    <td className="p-2 font-mono text-[10px]">
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">
                        {d.type}
                      </span>
                    </td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{d.date}</td>
                    <td className="p-2 text-white">{d.customerName || 'Consumidor Final'}</td>
                    <td className="p-2 text-slate-400">{d.createdBy}</td>
                    <td className="p-2 text-slate-300 italic text-[10.5px]">
                      {d.notes || 'Devolução/Anulação de venda'}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-rose-400">
                      -{d.grossAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 8. TABELA: MEIOS DE PAGAMENTO */}
      {subCategory === 'SALES_PAYMENTS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Meio de Pagamento</th>
                <th className="p-2 text-right">Nº de Transações</th>
                <th className="p-2 text-right">Total Arrecadado</th>
                <th className="p-2 text-right">% do Faturamento Global</th>
                <th className="p-2">Distribuição Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {paymentMethodsData.map((m) => (
                <tr key={m.method} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{m.label}</span>
                  </td>
                  <td className="p-2 text-right font-mono text-slate-300">{m.count}</td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400">
                    {m.total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-white">
                    {m.percentage.toFixed(1)}%
                  </td>
                  <td className="p-2 w-48">
                    <div className="w-full bg-[#121215] h-2.5 rounded-full overflow-hidden border border-[#27272a]">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(0, m.percentage))}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
