import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ReceiptEntry,
  PaymentDisbursement,
  CashMovementEntry,
  BankAccount,
  Customer,
  Supplier,
  PurchaseEntry,
  Document,
} from '../../types/pulse';
import { ReportFilterState, ReportFinancialSubCategory } from '../../types/reports';
import { exportTableToCSV, printReportTable, copyTableToClipboard } from '../../utils/reportExportUtils';

interface ReportsFinancialSectionProps {
  subCategory: ReportFinancialSubCategory;
  receipts: ReceiptEntry[];
  disbursements: PaymentDisbursement[];
  cashMovements: CashMovementEntry[];
  bankAccounts: BankAccount[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: PurchaseEntry[];
  documents: Document[];
  currency: string;
  filters: ReportFilterState;
}

export const ReportsFinancialSection: React.FC<ReportsFinancialSectionProps> = ({
  subCategory,
  receipts,
  disbursements,
  cashMovements,
  bankAccounts,
  customers,
  suppliers,
  purchases,
  documents,
  currency,
  filters,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Cash Movements
  const filteredMovements = useMemo(() => {
    return cashMovements.filter((m) => {
      if (filters.startDate && m.date < filters.startDate) return false;
      if (filters.endDate && m.date > filters.endDate) return false;
      if (filters.operatorId !== 'ALL' && m.operatorId !== filters.operatorId) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !m.description.toLowerCase().includes(query) &&
          !(m.docRef || '').toLowerCase().includes(query) &&
          !m.operatorName.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [cashMovements, filters]);

  // Aggregate Cashflow
  const cashflowData = useMemo(() => {
    const dayMap: Record<
      string,
      {
        date: string;
        inflows: number;
        outflows: number;
        net: number;
        movements: CashMovementEntry[];
      }
    > = {};

    filteredMovements.forEach((m) => {
      const key = m.date || '2026-08-29';
      if (!dayMap[key]) {
        dayMap[key] = { date: key, inflows: 0, outflows: 0, net: 0, movements: [] };
      }
      if (m.type === 'INFLOW' || m.type === 'OPENING_FLOAT') {
        dayMap[key].inflows += m.amount;
        dayMap[key].net += m.amount;
      } else if (m.type === 'OUTFLOW') {
        dayMap[key].outflows += m.amount;
        dayMap[key].net -= m.amount;
      }
      dayMap[key].movements.push(m);
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredMovements]);

  // Accounts Receivable (Aging analysis)
  const receivablesData = useMemo(() => {
    return customers
      .filter((c) => c.currentBalance > 0)
      .map((c) => {
        // Customer pending invoices
        const customerDocs = documents.filter(
          (d) => (d.customerId === c.id || d.customerTaxId === c.taxId) && d.type === 'FT' && d.status === 'ISSUED'
        );

        return {
          id: c.id,
          name: c.name,
          taxId: c.taxId,
          phone: c.phone || '-',
          creditLimit: c.creditLimit,
          totalDebt: c.currentBalance,
          pendingDocsCount: customerDocs.length,
          lastPurchase: customerDocs.length > 0 ? customerDocs[0].date : '-',
        };
      })
      .sort((a, b) => b.totalDebt - a.totalDebt);
  }, [customers, documents]);

  // Accounts Payable (Aging analysis)
  const payablesData = useMemo(() => {
    return suppliers
      .filter((s) => s.currentBalance > 0)
      .map((s) => {
        const pendingPurchases = purchases.filter((p) => p.supplierId === s.id && p.status === 'CONFIRMED');
        return {
          id: s.id,
          name: s.name,
          taxId: s.taxId,
          phone: s.phone || '-',
          totalPayable: s.currentBalance,
          pendingCount: pendingPurchases.length,
          lastPurchaseDate: pendingPurchases.length > 0 ? pendingPurchases[0].date : '-',
        };
      })
      .sort((a, b) => b.totalPayable - a.totalPayable);
  }, [suppliers, purchases]);

  // Margin & Results (DRE Simplificada)
  const resultsData = useMemo(() => {
    let grossSales = 0;
    let netSales = 0;
    let estimatedCost = 0;

    documents.forEach((d) => {
      if (d.status === 'CANCELLED') return;
      const mult = d.type === 'NC' ? -1 : 1;
      grossSales += d.grossAmount * mult;
      netSales += d.netAmount * mult;
      estimatedCost += d.netAmount * 0.65 * mult; // estimate
    });

    const grossProfit = netSales - estimatedCost;
    const grossMarginPct = netSales > 0 ? (grossProfit / netSales) * 100 : 0;

    // Total Operating Expenses (Disbursements with status PAID)
    const operatingExpenses = disbursements
      .filter((d) => d.status === 'PAID')
      .reduce((acc, d) => acc + d.amount, 0);

    const netOperatingResult = grossProfit - operatingExpenses;

    return {
      grossSales,
      netSales,
      estimatedCost,
      grossProfit,
      grossMarginPct,
      operatingExpenses,
      netOperatingResult,
    };
  }, [documents, disbursements]);

  // Total summary of financial indicators
  const totalInflows = filteredMovements
    .filter((m) => m.type === 'INFLOW')
    .reduce((acc, m) => acc + m.amount, 0);
  const totalOutflows = filteredMovements
    .filter((m) => m.type === 'OUTFLOW')
    .reduce((acc, m) => acc + m.amount, 0);
  const totalReceivables = receivablesData.reduce((acc, r) => acc + r.totalDebt, 0);
  const totalPayables = payablesData.reduce((acc, p) => acc + p.totalPayable, 0);

  // Handle Export Actions
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Relatorio_Financeiro_${subCategory}`;

    if (subCategory === 'FINANCIAL_RECEIPTS') {
      headers = ['Nº Recibo', 'Data', 'Cliente', 'Doc Origem', 'Método', 'Conta/Banco', 'Referência', `Valor (${currency})`, 'Estado'];
      rows = receipts.map((r) => [r.receiptNumber, r.date, r.customerName, r.originDocNumber || '-', r.paymentMethod, r.bankAccountName || 'Caixa', r.reference || '-', r.amount.toFixed(2), r.status]);
    } else if (subCategory === 'FINANCIAL_PAYMENTS') {
      headers = ['Nº Ordem Pagamento', 'Data', 'Beneficiário / Fornecedor', 'Tipo', 'Doc Referência', `Valor (${currency})`, 'Estado Aprovação', 'Estado'];
      rows = disbursements.map((d) => [d.disbursementNumber, d.date, d.beneficiaryName, d.beneficiaryType, d.originDocNumber || '-', d.amount.toFixed(2), d.approvalStatus, d.status]);
    } else if (subCategory === 'FINANCIAL_CASHFLOW') {
      headers = ['Data', `Entradas (${currency})`, `Saídas (${currency})`, `Fluxo Líquido (${currency})`];
      rows = cashflowData.map((c) => [c.date, c.inflows.toFixed(2), c.outflows.toFixed(2), c.net.toFixed(2)]);
    } else if (subCategory === 'FINANCIAL_RECEIVABLES') {
      headers = ['Cliente', 'NIF', 'Telefone', `Limite de Crédito (${currency})`, 'Faturas Pendentes', `Saldo Devedor (${currency})`];
      rows = receivablesData.map((r) => [r.name, r.taxId, r.phone, r.creditLimit.toFixed(2), r.pendingDocsCount, r.totalDebt.toFixed(2)]);
    } else if (subCategory === 'FINANCIAL_PAYABLES') {
      headers = ['Fornecedor', 'NIF', 'Telefone', 'Compras Pendentes', `Saldo a Pagar (${currency})`];
      rows = payablesData.map((p) => [p.name, p.taxId, p.phone, p.pendingCount, p.totalPayable.toFixed(2)]);
    } else {
      headers = ['Data/Hora', 'Tipo', 'Categoria', 'Descrição', 'Operador', `Valor (${currency})`, `Saldo Após (${currency})`];
      rows = filteredMovements.map((m) => [m.timestamp, m.type, m.category, m.description, m.operatorName, m.amount.toFixed(2), m.balanceAfter.toFixed(2)]);
    }

    exportTableToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    let headers: string[] = ['Item / Descrição', 'Data', 'Entidade', 'Valor'];
    let rows: (string | number)[][] = [];
    let title = `Relatório Financeiro — ${subCategory}`;
    let subtitle = `Período: ${filters.startDate || 'Início'} até ${filters.endDate || 'Hoje'}`;

    if (subCategory === 'FINANCIAL_BALANCES') {
      headers = ['Conta / Banco', 'IBAN / Nº Conta', 'Tipo', `Saldo Atual (${currency})`];
      rows = bankAccounts.map((b) => [b.bankName, b.iban, b.accountType, b.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })]);
    } else if (subCategory === 'FINANCIAL_RECEIVABLES') {
      headers = ['Cliente', 'NIF', 'Docs Pendentes', `Valor a Receber (${currency})`];
      rows = receivablesData.map((r) => [r.name, r.taxId, r.pendingDocsCount, r.totalDebt.toLocaleString('pt-AO', { minimumFractionDigits: 2 })]);
    } else {
      headers = ['Movimento / Doc', 'Data', 'Tipo / Categoria', `Valor (${currency})`];
      rows = filteredMovements.map((m) => [m.description, m.date, m.category, m.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })]);
    }

    printReportTable(title, subtitle, headers, rows);
  };

  const handleCopy = () => {
    let headers: string[] = ['Conta / Movimento', 'Data', 'Valor'];
    let rows: (string | number)[][] = filteredMovements.map((m) => [m.description, m.date, m.amount.toFixed(2)]);
    const success = copyTableToClipboard(headers, rows);
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Financial Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121215] p-2 rounded-lg border border-[#27272a]">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500">Total Entradas:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">
              +{totalInflows.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Total Saídas:</span>{' '}
            <span className="font-bold text-rose-400 font-mono">
              -{totalOutflows.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Contas a Receber:</span>{' '}
            <span className="font-bold text-amber-400 font-mono">
              {totalReceivables.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Contas a Pagar:</span>{' '}
            <span className="font-bold text-red-400 font-mono">
              {totalPayables.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
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
            title="Imprimir mapa"
            className="p-1.5 bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white rounded border border-[#27272a] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 1. TABELA: RECEBIMENTOS */}
      {subCategory === 'FINANCIAL_RECEIPTS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Nº Recibo</th>
                <th className="p-2">Data</th>
                <th className="p-2">Cliente / Entidade</th>
                <th className="p-2">Fatura / Origem</th>
                <th className="p-2">Método</th>
                <th className="p-2">Conta Destino</th>
                <th className="p-2">Referência / Comprovativo</th>
                <th className="p-2 text-right">Valor Recebido</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    Nenhum recibo de cliente registado.
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white font-mono">{r.receiptNumber}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{r.date}</td>
                    <td className="p-2 text-slate-200">{r.customerName}</td>
                    <td className="p-2 font-mono text-[10.5px] text-slate-400">
                      {r.originDocNumber || '-'}
                    </td>
                    <td className="p-2 font-mono text-[10px] text-slate-300">{r.paymentMethod}</td>
                    <td className="p-2 text-slate-300">{r.bankAccountName || 'Caixa Principal'}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-400">{r.reference || '-'}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">
                      +{r.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          r.status === 'RECEIVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TABELA: PAGAMENTOS (ORDENS DE PAGAMENTO / DESPESAS) */}
      {subCategory === 'FINANCIAL_PAYMENTS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Nº Ordem</th>
                <th className="p-2">Data</th>
                <th className="p-2">Beneficiário / Fornecedor</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Doc Origem</th>
                <th className="p-2">Método</th>
                <th className="p-2 text-right">Valor Pago</th>
                <th className="p-2 text-center">Aprovação</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {disbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-500">
                    Nenhum pagamento ou despesa registada.
                  </td>
                </tr>
              ) : (
                disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white font-mono">{d.disbursementNumber}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{d.date}</td>
                    <td className="p-2 text-slate-200">{d.beneficiaryName}</td>
                    <td className="p-2 text-[10px] text-slate-400">{d.expenseCategory || d.beneficiaryType}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-400">{d.originDocNumber || '-'}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-300">{d.paymentMethod}</td>
                    <td className="p-2 text-right font-mono font-bold text-rose-400">
                      -{d.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
                        {d.approvalStatus}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          d.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
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

      {/* 3. TABELA: FLUXO DE CAIXA DIÁRIO */}
      {subCategory === 'FINANCIAL_CASHFLOW' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Data</th>
                <th className="p-2 text-right">Total de Entradas (+)</th>
                <th className="p-2 text-right">Total de Saídas (-)</th>
                <th className="p-2 text-right">Saldo Líquido Gerado</th>
                <th className="p-2 text-right">Nº Movimentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {cashflowData.map((c) => {
                const isExpanded = !!expandedRows[c.date];
                return (
                  <React.Fragment key={c.date}>
                    <tr
                      onClick={() => toggleRow(c.date)}
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
                        <span>{c.date}</span>
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-400">
                        +{c.inflows.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-right font-mono text-rose-400">
                        -{c.outflows.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td
                        className={`p-2 text-right font-mono font-bold ${
                          c.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {c.net >= 0 ? '+' : ''}
                        {c.net.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-right font-mono text-slate-400">{c.movements.length}</td>
                    </tr>

                    {/* Drilldown of daily movements */}
                    {isExpanded && (
                      <tr className="bg-[#121215]">
                        <td colSpan={6} className="p-3 pl-8">
                          <div className="border border-[#27272a] rounded bg-[#18181b] p-2 space-y-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                              Movimentos detalhados em {c.date}:
                            </div>
                            <table className="w-full text-[10.5px]">
                              <thead>
                                <tr className="text-slate-500 border-b border-[#27272a]">
                                  <th className="p-1">Hora</th>
                                  <th className="p-1">Categoria</th>
                                  <th className="p-1">Descrição</th>
                                  <th className="p-1">Operador</th>
                                  <th className="p-1 text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#27272a]/50">
                                {c.movements.map((m) => (
                                  <tr key={m.id}>
                                    <td className="p-1 font-mono text-slate-400">{m.time || '10:00'}</td>
                                    <td className="p-1 text-slate-400">{m.category}</td>
                                    <td className="p-1 text-slate-200">{m.description}</td>
                                    <td className="p-1 text-slate-400">{m.operatorName}</td>
                                    <td
                                      className={`p-1 text-right font-mono font-bold ${
                                        m.type === 'INFLOW' ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {m.type === 'INFLOW' ? '+' : '-'}
                                      {m.amount.toLocaleString('pt-AO')} {currency}
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

      {/* 4. TABELA: SALDOS (CAIXA E BANCOS) */}
      {subCategory === 'FINANCIAL_BALANCES' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Conta / Instituição Bancária</th>
                <th className="p-2 font-mono">IBAN / Nº de Conta</th>
                <th className="p-2">Tipo de Conta</th>
                <th className="p-2 text-center">Moeda</th>
                <th className="p-2 text-right">Saldo Disponível</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {bankAccounts.map((b) => (
                <tr key={b.id} className="hover:bg-[#222227]">
                  <td className="p-2 font-bold text-white flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{b.bankName}</span>
                  </td>
                  <td className="p-2 font-mono text-slate-300">{b.iban || b.accountNumber}</td>
                  <td className="p-2 text-[10px] text-slate-400">
                    <span className="bg-[#121215] px-1.5 py-0.5 rounded border border-[#27272a]">
                      {b.accountType}
                    </span>
                  </td>
                  <td className="p-2 text-center font-mono text-slate-300">{b.currency}</td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-400">
                    {b.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {b.currency}
                  </td>
                  <td className="p-2 text-center">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ATIVO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#121215] border-t-2 border-[#27272a] font-bold text-[11px] text-slate-200">
              <tr>
                <td colSpan={4} className="p-2 text-left uppercase">
                  Saldo Total Consolidado em Caixa & Bancos:
                </td>
                <td className="p-2 text-right font-mono text-emerald-400">
                  {bankAccounts
                    .reduce((acc, b) => acc + b.balance, 0)
                    .toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  {currency}
                </td>
                <td className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* 5. TABELA: CONTAS A RECEBER (CLIENTES) */}
      {subCategory === 'FINANCIAL_RECEIVABLES' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Cliente / Entidade</th>
                <th className="p-2 font-mono">NIF</th>
                <th className="p-2">Contacto</th>
                <th className="p-2 text-right">Limite de Crédito</th>
                <th className="p-2 text-right">Faturas Pendentes</th>
                <th className="p-2">Última Compra</th>
                <th className="p-2 text-right">Saldo Devedor a Cobrar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {receivablesData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhuma conta a receber pendente.
                  </td>
                </tr>
              ) : (
                receivablesData.map((r) => (
                  <tr key={r.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white">{r.name}</td>
                    <td className="p-2 font-mono text-slate-400">{r.taxId}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-400">{r.phone}</td>
                    <td className="p-2 text-right font-mono text-slate-400">
                      {r.creditLimit.toLocaleString('pt-AO')} {currency}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-300">{r.pendingDocsCount}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{r.lastPurchase}</td>
                    <td className="p-2 text-right font-mono font-bold text-amber-400">
                      {r.totalDebt.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {receivablesData.length > 0 && (
              <tfoot className="bg-[#121215] border-t-2 border-[#27272a] font-bold text-[11px] text-slate-200">
                <tr>
                  <td colSpan={6} className="p-2 text-left uppercase">
                    Total Global a Receber:
                  </td>
                  <td className="p-2 text-right font-mono text-amber-400">
                    {totalReceivables.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* 6. TABELA: CONTAS A PAGAR (FORNECEDORES) */}
      {subCategory === 'FINANCIAL_PAYABLES' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Fornecedor / Credor</th>
                <th className="p-2 font-mono">NIF</th>
                <th className="p-2">Contacto</th>
                <th className="p-2 text-right">Faturas Pendentes</th>
                <th className="p-2">Última Entrada</th>
                <th className="p-2 text-right">Saldo a Pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {payablesData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhuma conta a pagar pendente a fornecedores.
                  </td>
                </tr>
              ) : (
                payablesData.map((p) => (
                  <tr key={p.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white">{p.name}</td>
                    <td className="p-2 font-mono text-slate-400">{p.taxId}</td>
                    <td className="p-2 font-mono text-[10px] text-slate-400">{p.phone}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{p.pendingCount}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{p.lastPurchaseDate}</td>
                    <td className="p-2 text-right font-mono font-bold text-rose-400">
                      {p.totalPayable.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {payablesData.length > 0 && (
              <tfoot className="bg-[#121215] border-t-2 border-[#27272a] font-bold text-[11px] text-slate-200">
                <tr>
                  <td colSpan={5} className="p-2 text-left uppercase">
                    Total Global a Pagar a Fornecedores:
                  </td>
                  <td className="p-2 text-right font-mono text-rose-400">
                    {totalPayables.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* 7. TABELA: MARGEM / RESULTADOS (DRE RESUMIDA) */}
      {subCategory === 'FINANCIAL_MARGINS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Linha da Demonstração de Resultados (DRE)</th>
                <th className="p-2 text-right">Valor Consolidado</th>
                <th className="p-2 text-right">% da Faturação Líquida</th>
                <th className="p-2">Natureza Contabilística</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              <tr className="hover:bg-[#222227]">
                <td className="p-2 font-bold text-white">(+) Faturação Bruta das Vendas</td>
                <td className="p-2 text-right font-mono font-bold text-white">
                  {resultsData.grossSales.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="p-2 text-right font-mono text-slate-400">-</td>
                <td className="p-2 text-[10px] text-slate-400">Receita Total Bruta</td>
              </tr>
              <tr className="hover:bg-[#222227]">
                <td className="p-2 font-bold text-emerald-400">(=) Faturação Líquida (Base de Incidência)</td>
                <td className="p-2 text-right font-mono font-bold text-emerald-400">
                  {resultsData.netSales.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="p-2 text-right font-mono text-emerald-400">100.0%</td>
                <td className="p-2 text-[10px] text-slate-400">Volume de Negócios Líquido</td>
              </tr>
              <tr className="hover:bg-[#222227]">
                <td className="p-2 text-rose-300">(-) Custo das Mercadorias Vendidas (CMV)</td>
                <td className="p-2 text-right font-mono text-rose-400">
                  -{resultsData.estimatedCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="p-2 text-right font-mono text-rose-400">
                  {resultsData.netSales > 0
                    ? ((resultsData.estimatedCost / resultsData.netSales) * 100).toFixed(1)
                    : 0}
                  %
                </td>
                <td className="p-2 text-[10px] text-slate-400">Custo Direto de Stock</td>
              </tr>
              <tr className="bg-[#141417] font-bold border-t border-b border-[#27272a]">
                <td className="p-2 text-emerald-400">(=) Lucro Bruto / Margem Bruta Comercial</td>
                <td className="p-2 text-right font-mono text-emerald-400">
                  {resultsData.grossProfit.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="p-2 text-right font-mono text-emerald-400">
                  {resultsData.grossMarginPct.toFixed(1)}%
                </td>
                <td className="p-2 text-[10px] text-emerald-400 font-normal">Margem de Contribuição</td>
              </tr>
              <tr className="hover:bg-[#222227]">
                <td className="p-2 text-rose-300">(-) Gastos Operacionais / Despesas de Tesouraria</td>
                <td className="p-2 text-right font-mono text-rose-400">
                  -{resultsData.operatingExpenses.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  {currency}
                </td>
                <td className="p-2 text-right font-mono text-rose-400">
                  {resultsData.netSales > 0
                    ? ((resultsData.operatingExpenses / resultsData.netSales) * 100).toFixed(1)
                    : 0}
                  %
                </td>
                <td className="p-2 text-[10px] text-slate-400">Despesas Administrativas & Fornecedores</td>
              </tr>
              <tr className="bg-[#121215] font-bold text-[12px] border-t-2 border-[#27272a]">
                <td className="p-2 text-white">(=) Resultado Operacional Estimado</td>
                <td
                  className={`p-2 text-right font-mono ${
                    resultsData.netOperatingResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {resultsData.netOperatingResult >= 0 ? '+' : ''}
                  {resultsData.netOperatingResult.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}{' '}
                  {currency}
                </td>
                <td
                  className={`p-2 text-right font-mono ${
                    resultsData.netOperatingResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {resultsData.netSales > 0
                    ? ((resultsData.netOperatingResult / resultsData.netSales) * 100).toFixed(1)
                    : 0}
                  %
                </td>
                <td className="p-2 text-[10px] text-slate-400 font-normal">EBITDA Estimado</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 8. TABELA: MOVIMENTOS POR PERÍODO / DIÁRIO FINANCEIRO */}
      {(subCategory === 'FINANCIAL_MOVEMENTS' || subCategory === 'FINANCIAL_EXPORT') && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Tipo</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Descrição / Justificação</th>
                <th className="p-2">Operador</th>
                <th className="p-2">Doc Ref</th>
                <th className="p-2 text-right">Valor Movimentado</th>
                <th className="p-2 text-right">Saldo Após</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredMovements.map((m) => (
                <tr key={m.id} className="hover:bg-[#222227]">
                  <td className="p-2 font-mono text-slate-400 text-[10px]">{m.timestamp}</td>
                  <td className="p-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        m.type === 'INFLOW'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : m.type === 'OUTFLOW'
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-sky-500/10 text-sky-400'
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td className="p-2 text-[10px] text-slate-400 font-mono">{m.category}</td>
                  <td className="p-2 text-slate-200">{m.description}</td>
                  <td className="p-2 text-slate-400 text-[10px]">{m.operatorName}</td>
                  <td className="p-2 font-mono text-[10px] text-slate-400">{m.docRef || '-'}</td>
                  <td
                    className={`p-2 text-right font-mono font-bold ${
                      m.type === 'INFLOW' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {m.type === 'INFLOW' ? '+' : '-'}
                    {m.amount.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-300">
                    {m.balanceAfter.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
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
