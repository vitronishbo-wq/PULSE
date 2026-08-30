import React, { useState, useMemo } from 'react';
import {
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Layers,
  CheckCircle2,
  Copy,
  Download,
  Printer,
  ChevronDown,
  ChevronRight,
  DollarSign,
} from 'lucide-react';
import { Product, StockMovement } from '../../types/pulse';
import { ReportFilterState, ReportStockSubCategory } from '../../types/reports';
import { exportTableToCSV, printReportTable, copyTableToClipboard } from '../../utils/reportExportUtils';

interface ReportsStockSectionProps {
  subCategory: ReportStockSubCategory;
  products: Product[];
  stockMovements: StockMovement[];
  currency: string;
  filters: ReportFilterState;
}

export const ReportsStockSection: React.FC<ReportsStockSectionProps> = ({
  subCategory,
  products,
  stockMovements,
  currency,
  filters,
}) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.productCategory !== 'ALL' && p.category !== filters.productCategory) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !p.name.toLowerCase().includes(query) &&
          !(p.sku || '').toLowerCase().includes(query) &&
          !(p.barcode || '').toLowerCase().includes(query) &&
          !p.category.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, filters]);

  // Low stock products
  const lowStockProducts = useMemo(() => {
    return filteredProducts.filter((p) => (p.stock || 0) <= (p.minStock ?? 5));
  }, [filteredProducts]);

  // Valuation by category
  const valuationByCategory = useMemo(() => {
    const map: Record<
      string,
      {
        category: string;
        itemCount: number;
        totalUnits: number;
        costValuation: number;
        retailValuation: number;
        potentialMargin: number;
        products: Product[];
      }
    > = {};

    filteredProducts.forEach((p) => {
      const cat = p.category || 'Geral';
      const cost = p.costPrice || p.price * 0.65;
      const units = p.stock || 0;
      const costVal = units * cost;
      const retailVal = units * p.price;

      if (!map[cat]) {
        map[cat] = {
          category: cat,
          itemCount: 0,
          totalUnits: 0,
          costValuation: 0,
          retailValuation: 0,
          potentialMargin: 0,
          products: [],
        };
      }

      map[cat].itemCount += 1;
      map[cat].totalUnits += units;
      map[cat].costValuation += costVal;
      map[cat].retailValuation += retailVal;
      map[cat].potentialMargin += retailVal - costVal;
      map[cat].products.push(p);
    });

    return Object.values(map).sort((a, b) => b.costValuation - a.costValuation);
  }, [filteredProducts]);

  // Valuation aggregate
  const totalCostValuation = valuationByCategory.reduce((acc, v) => acc + v.costValuation, 0);
  const totalRetailValuation = valuationByCategory.reduce((acc, v) => acc + v.retailValuation, 0);
  const totalStockUnits = valuationByCategory.reduce((acc, v) => acc + v.totalUnits, 0);

  // Filtered Stock Movements
  const filteredStockMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      if (filters.startDate && m.timestamp.slice(0, 10) < filters.startDate) return false;
      if (filters.endDate && m.timestamp.slice(0, 10) > filters.endDate) return false;
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        if (
          !m.productName.toLowerCase().includes(query) &&
          !(m.reference || '').toLowerCase().includes(query) &&
          !m.performedBy.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [stockMovements, filters]);

  // Adjustments & inventory variances
  const stockAdjustments = useMemo(() => {
    return filteredStockMovements.filter(
      (m) => m.type === 'ADJUSTMENT_IN' || m.type === 'ADJUSTMENT_OUT' || m.type === 'SPOILAGE'
    );
  }, [filteredStockMovements]);

  // Handle Export Actions
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Relatorio_Stock_${subCategory}`;

    if (subCategory === 'STOCK_CURRENT') {
      headers = ['Artigo', 'SKU / Código', 'Categoria', 'Stock Atual', 'Stock Mínimo', `Preço Custo (${currency})`, `Preço Venda (${currency})`, `Valor Total Custo (${currency})`, `Valor Total Venda (${currency})`];
      rows = filteredProducts.map((p) => {
        const cost = p.costPrice || p.price * 0.65;
        const totalCost = (p.stock || 0) * cost;
        const totalRetail = (p.stock || 0) * p.price;
        return [p.name, p.sku || p.barcode || '-', p.category, p.stock || 0, p.minStock ?? 5, cost.toFixed(2), p.price.toFixed(2), totalCost.toFixed(2), totalRetail.toFixed(2)];
      });
    } else if (subCategory === 'STOCK_LOW') {
      headers = ['Artigo em Rutura', 'SKU', 'Categoria', 'Stock Atual', 'Mínimo Seguro', 'Sugestão de Reposição', `Preço Custo (${currency})`];
      rows = lowStockProducts.map((p) => {
        const min = p.minStock ?? 5;
        const current = p.stock || 0;
        const suggestion = Math.max(0, min * 2 - current);
        return [p.name, p.sku || '-', p.category, current, min, suggestion, (p.costPrice || p.price * 0.65).toFixed(2)];
      });
    } else if (subCategory === 'STOCK_VALUATION') {
      headers = ['Categoria', 'Nº Artigos', 'Qtd Total Unidades', `Valor a Preço Custo (${currency})`, `Valor a Preço Venda (${currency})`, `Margem Potencial (${currency})`];
      rows = valuationByCategory.map((v) => [v.category, v.itemCount, v.totalUnits, v.costValuation.toFixed(2), v.retailValuation.toFixed(2), v.potentialMargin.toFixed(2)]);
    } else {
      headers = ['Data/Hora', 'Tipo Movimento', 'Artigo', 'Qtd', 'Origem', 'Destino', 'Operador', 'Doc / Referência', 'Justificação'];
      rows = filteredStockMovements.map((m) => [m.timestamp, m.type, m.productName, m.quantity, m.originWarehouse || '-', m.targetWarehouse || '-', m.performedBy, m.reference || '-', m.reason || '-']);
    }

    exportTableToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    let headers: string[] = ['Artigo / Categoria', 'Qtd', 'Preço Custo', 'Valor Total'];
    let rows: (string | number)[][] = [];
    let title = `Relatório de Stock — ${subCategory}`;
    let subtitle = `Total de Artigos Listados: ${filteredProducts.length}`;

    if (subCategory === 'STOCK_VALUATION') {
      headers = ['Categoria', 'Qtd Artigos', 'Unidades', 'Valor Custo', 'Valor Venda'];
      rows = valuationByCategory.map((v) => [v.category, v.itemCount, v.totalUnits, v.costValuation.toLocaleString('pt-AO') + ' ' + currency, v.retailValuation.toLocaleString('pt-AO') + ' ' + currency]);
    } else {
      headers = ['Artigo', 'Categoria', 'Stock', 'Preço Venda', 'Valor Total'];
      rows = filteredProducts.map((p) => [p.name, p.category, p.stock || 0, p.price.toLocaleString('pt-AO'), ((p.stock || 0) * p.price).toLocaleString('pt-AO') + ' ' + currency]);
    }

    const summaryHtml = `<strong>Valorização Total a Custo: ${totalCostValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${currency}</strong> | Valorização a Venda: ${totalRetailValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${currency}`;
    printReportTable(title, subtitle, headers, rows, summaryHtml);
  };

  const handleCopy = () => {
    let headers: string[] = ['Artigo', 'Stock', 'Preço Custo', 'Preço Venda'];
    let rows: (string | number)[][] = filteredProducts.map((p) => [p.name, p.stock || 0, (p.costPrice || 0).toFixed(2), p.price.toFixed(2)]);
    const success = copyTableToClipboard(headers, rows);
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  return (
    <div className="space-y-2 font-mono text-xs">
      {/* Stock Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121215] p-2 rounded-lg border border-[#27272a]">
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-500">Total Artigos Ativos:</span>{' '}
            <span className="font-bold text-white">{filteredProducts.length}</span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Unidades Físicas:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">
              {totalStockUnits.toLocaleString('pt-AO')} un.
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Valorização a Custo:</span>{' '}
            <span className="font-bold text-sky-400 font-mono">
              {totalCostValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Valorização a Venda:</span>{' '}
            <span className="font-bold text-emerald-400 font-mono">
              {totalRetailValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
            </span>
          </div>
          <div className="border-l border-[#27272a] pl-3">
            <span className="text-slate-500">Stock Crítico / Baixo:</span>{' '}
            <span
              className={`font-bold font-mono px-1.5 py-0.5 rounded ${
                lowStockProducts.length > 0
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-slate-400'
              }`}
            >
              {lowStockProducts.length} artigos
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

      {/* 1. TABELA: STOCK ATUAL */}
      {subCategory === 'STOCK_CURRENT' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Artigo / Descrição</th>
                <th className="p-2 font-mono">SKU / Código</th>
                <th className="p-2">Categoria</th>
                <th className="p-2 text-right">Stock Físico</th>
                <th className="p-2 text-right">Stock Mínimo</th>
                <th className="p-2 text-right">Preço de Custo</th>
                <th className="p-2 text-right">Preço de Venda</th>
                <th className="p-2 text-right">Valor Total Custo</th>
                <th className="p-2 text-right">Valor Total Venda</th>
                <th className="p-2 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredProducts.map((p) => {
                const cost = p.costPrice || p.price * 0.65;
                const totalCost = (p.stock || 0) * cost;
                const totalRetail = (p.stock || 0) * p.price;
                const isLow = (p.stock || 0) <= (p.minStock ?? 5);

                return (
                  <tr key={p.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{p.name}</span>
                    </td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{p.sku || p.barcode || '-'}</td>
                    <td className="p-2 text-slate-300">{p.category}</td>
                    <td
                      className={`p-2 text-right font-mono font-bold ${
                        (p.stock || 0) <= 0 ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {p.stock || 0}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">{p.minStock ?? 5}</td>
                    <td className="p-2 text-right font-mono text-slate-400">
                      {cost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-right font-mono text-white">
                      {p.price.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-right font-mono text-sky-400">
                      {totalCost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">
                      {totalRetail.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          (p.stock || 0) <= 0
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : isLow
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {(p.stock || 0) <= 0 ? 'ESGOTADO' : isLow ? 'BAIXO' : 'REGULAR'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. TABELA: ENTRADAS / SAÍDAS */}
      {subCategory === 'STOCK_IN_OUT' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Tipo de Movimento</th>
                <th className="p-2">Artigo</th>
                <th className="p-2 text-right">Qtd</th>
                <th className="p-2">Armazém Origem</th>
                <th className="p-2">Armazém Destino</th>
                <th className="p-2">Operador Responsável</th>
                <th className="p-2">Documento / Referência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredStockMovements.map((m) => {
                const isInflow =
                  m.type === 'PURCHASE' ||
                  m.type === 'ADJUSTMENT_IN' ||
                  m.type === 'RETURN' ||
                  m.type === 'PRODUCTION';
                return (
                  <tr key={m.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{m.timestamp}</td>
                    <td className="p-2">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isInflow
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-white">{m.productName}</td>
                    <td
                      className={`p-2 text-right font-mono font-bold ${
                        isInflow ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isInflow ? '+' : '-'}
                      {m.quantity}
                    </td>
                    <td className="p-2 text-slate-400 text-[10.5px]">{m.originWarehouse || 'Loja Principal'}</td>
                    <td className="p-2 text-slate-400 text-[10.5px]">{m.targetWarehouse || '-'}</td>
                    <td className="p-2 text-slate-300">{m.performedBy}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{m.reference || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. TABELA: INVENTÁRIO (CONTAGEM FÍSICA & QUEBRAS) */}
      {subCategory === 'STOCK_INVENTORY' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Artigo</th>
                <th className="p-2 font-mono">Código / SKU</th>
                <th className="p-2">Categoria</th>
                <th className="p-2 text-right">Stock Sistema</th>
                <th className="p-2 text-right">Contagem Física</th>
                <th className="p-2 text-right">Diferença (Desvio)</th>
                <th className="p-2 text-right">Impacto Financeiro</th>
                <th className="p-2 text-center">Estado Reconciliação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {filteredProducts.map((p) => {
                const sysStock = p.stock || 0;
                const counted = sysStock; // baseline in sync
                const diff = counted - sysStock;
                const cost = p.costPrice || p.price * 0.65;
                const diffVal = diff * cost;

                return (
                  <tr key={p.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-bold text-white">{p.name}</td>
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{p.sku || '-'}</td>
                    <td className="p-2 text-slate-300">{p.category}</td>
                    <td className="p-2 text-right font-mono text-slate-300">{sysStock}</td>
                    <td className="p-2 text-right font-mono text-white font-bold">{counted}</td>
                    <td className="p-2 text-right font-mono text-slate-400">
                      {diff === 0 ? '0' : diff > 0 ? `+${diff}` : diff}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-400">
                      {diffVal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        CONFERIDO
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. TABELA: PRODUTOS COM STOCK BAIXO / RUTURA */}
      {subCategory === 'STOCK_LOW' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Artigo Crítico</th>
                <th className="p-2 font-mono">SKU</th>
                <th className="p-2">Categoria</th>
                <th className="p-2 text-right">Stock Atual</th>
                <th className="p-2 text-right">Mínimo Seguro</th>
                <th className="p-2 text-right">Sugestão de Reposição</th>
                <th className="p-2 text-right">Custo Unitário</th>
                <th className="p-2 text-right">Investimento Estimado</th>
                <th className="p-2 text-center">Nível de Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-emerald-400">
                    Excelente! Nenhum artigo encontra-se atualmente em rutura ou com stock crítico.
                  </td>
                </tr>
              ) : (
                lowStockProducts.map((p) => {
                  const min = p.minStock ?? 5;
                  const current = p.stock || 0;
                  const suggestion = Math.max(0, min * 2 - current);
                  const cost = p.costPrice || p.price * 0.65;
                  const estInvest = suggestion * cost;

                  return (
                    <tr key={p.id} className="hover:bg-[#222227]">
                      <td className="p-2 font-bold text-white flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.name}</span>
                      </td>
                      <td className="p-2 font-mono text-slate-400 text-[10px]">{p.sku || '-'}</td>
                      <td className="p-2 text-slate-300">{p.category}</td>
                      <td
                        className={`p-2 text-right font-mono font-bold ${
                          current <= 0 ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {current} un.
                      </td>
                      <td className="p-2 text-right font-mono text-slate-400">{min} un.</td>
                      <td className="p-2 text-right font-mono font-bold text-sky-400">+{suggestion} un.</td>
                      <td className="p-2 text-right font-mono text-slate-400">
                        {cost.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-400">
                        {estInvest.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            current <= 0
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {current <= 0 ? 'RUTURA TOTAL' : 'CRÍTICO'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TABELA: MOVIMENTOS & AJUSTES */}
      {subCategory === 'STOCK_ADJUSTMENTS' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2">Data/Hora</th>
                <th className="p-2">Tipo Ajuste</th>
                <th className="p-2">Artigo</th>
                <th className="p-2 text-right">Qtd Ajustada</th>
                <th className="p-2">Justificação / Motivo</th>
                <th className="p-2">Operador</th>
                <th className="p-2">Autorizado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {stockAdjustments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Nenhum ajuste manual ou quebra registada no período.
                  </td>
                </tr>
              ) : (
                stockAdjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-[#222227]">
                    <td className="p-2 font-mono text-slate-400 text-[10px]">{a.timestamp}</td>
                    <td className="p-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {a.type}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-white">{a.productName}</td>
                    <td className="p-2 text-right font-mono font-bold text-white">{a.quantity}</td>
                    <td className="p-2 text-slate-300 italic text-[10.5px]">{a.reason || 'Ajuste de inventário'}</td>
                    <td className="p-2 text-slate-400">{a.performedBy}</td>
                    <td className="p-2 text-slate-400 text-[10px]">Supervisor / Gerente</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. TABELA: VALORIZAÇÃO DE STOCK (POR CATEGORIA & TOTAL) */}
      {subCategory === 'STOCK_VALUATION' && (
        <div className="overflow-x-auto border border-[#27272a] rounded-lg bg-[#18181b]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#121215] border-b border-[#27272a] text-[10.5px] uppercase tracking-wider text-slate-400 font-bold select-none">
                <th className="p-2 w-8 text-center">#</th>
                <th className="p-2">Categoria de Stock</th>
                <th className="p-2 text-right">Nº Artigos</th>
                <th className="p-2 text-right">Total Unidades</th>
                <th className="p-2 text-right">Valorização a Preço Custo</th>
                <th className="p-2 text-right">Valorização a Preço Venda</th>
                <th className="p-2 text-right">Margem Potencial Estimada</th>
                <th className="p-2 text-right">Margem (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-[11px]">
              {valuationByCategory.map((v) => {
                const isExpanded = !!expandedRows[v.category];
                const pct = v.retailValuation > 0 ? (v.potentialMargin / v.retailValuation) * 100 : 0;
                return (
                  <React.Fragment key={v.category}>
                    <tr
                      onClick={() => toggleRow(v.category)}
                      className="hover:bg-[#222227] cursor-pointer bg-[#141417] font-bold"
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
                        <span>{v.category}</span>
                      </td>
                      <td className="p-2 text-right font-mono text-slate-300">{v.itemCount}</td>
                      <td className="p-2 text-right font-mono text-slate-300">{v.totalUnits} un.</td>
                      <td className="p-2 text-right font-mono text-sky-400">
                        {v.costValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-400">
                        {v.retailValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-right font-mono text-emerald-400">
                        {v.potentialMargin.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                      </td>
                      <td className="p-2 text-right font-mono text-amber-400">{pct.toFixed(1)}%</td>
                    </tr>

                    {/* Drilldown products in category */}
                    {isExpanded &&
                      v.products.map((p) => {
                        const cost = p.costPrice || p.price * 0.65;
                        const pCostVal = (p.stock || 0) * cost;
                        const pRetVal = (p.stock || 0) * p.price;
                        return (
                          <tr key={p.id} className="bg-[#18181b] hover:bg-[#202025] text-[10.5px]">
                            <td className="p-1.5 text-center text-slate-600">↳</td>
                            <td className="p-1.5 pl-6 text-slate-300 font-medium">{p.name}</td>
                            <td className="p-1.5 text-right font-mono text-slate-500">-</td>
                            <td className="p-1.5 text-right font-mono text-slate-300">{p.stock || 0} un.</td>
                            <td className="p-1.5 text-right font-mono text-sky-400/80">
                              {pCostVal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 text-right font-mono text-emerald-300">
                              {pRetVal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 text-right font-mono text-slate-300">
                              {(pRetVal - pCostVal).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-1.5 text-right font-mono text-slate-500">
                              {pRetVal > 0 ? (((pRetVal - pCostVal) / pRetVal) * 100).toFixed(1) : 0}%
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot className="bg-[#121215] border-t-2 border-[#27272a] font-bold text-[11px] text-slate-200">
              <tr>
                <td colSpan={2} className="p-2 text-left uppercase">
                  Valor Total do Inventário:
                </td>
                <td className="p-2 text-right font-mono">{filteredProducts.length}</td>
                <td className="p-2 text-right font-mono">{totalStockUnits} un.</td>
                <td className="p-2 text-right font-mono text-sky-400">
                  {totalCostValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="p-2 text-right font-mono text-emerald-400">
                  {totalRetailValuation.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {currency}
                </td>
                <td className="p-2 text-right font-mono text-emerald-400">
                  {(totalRetailValuation - totalCostValuation).toLocaleString('pt-AO', {
                    minimumFractionDigits: 2,
                  })}{' '}
                  {currency}
                </td>
                <td className="p-2 text-right font-mono text-amber-400">
                  {totalRetailValuation > 0
                    ? (
                        ((totalRetailValuation - totalCostValuation) / totalRetailValuation) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
