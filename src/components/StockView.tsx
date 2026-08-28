import React, { useState } from 'react';
import {
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Search,
  Plus,
  Sliders,
  History,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BusinessSegment, Product, StockMovement, TenantProfile, User } from '../types/pulse';

interface StockViewProps {
  products: Product[];
  movements: StockMovement[];
  currency: string;
  currentUser: User;
  tenant?: TenantProfile;
  onAdjustStock: (params: { productId: string; qtyChange: number; reason: string; actor: string }) => void;
  onTriggerPurchaseSuggestion: (product: Product) => void;
  subView?: string;
}

export const StockView: React.FC<StockViewProps> = ({
  products = [],
  movements = [],
  currency,
  currentUser,
  tenant,
  onAdjustStock,
  onTriggerPurchaseSuggestion,
  subView,
}) => {
  const segment: BusinessSegment = tenant?.segment || tenant?.businessSegment || 'GENERAL_RETAIL';

  const [activeTab, setActiveTab] = useState<'LEDGER' | 'CATEGORIES' | 'RECIPES' | 'MOVEMENTS'>(() => {
    if (subView === 'CATEGORIES') return 'CATEGORIES';
    if (subView === 'MOVEMENTS' || subView === 'INVENTORY' || subView === 'ADJUSTMENTS') return 'MOVEMENTS';
    return 'LEDGER';
  });

  // Keep activeTab in sync with subView changes
  React.useEffect(() => {
    if (subView === 'CATEGORIES') setActiveTab('CATEGORIES');
    else if (subView === 'MOVEMENTS' || subView === 'INVENTORY' || subView === 'ADJUSTMENTS') {
      setActiveTab('MOVEMENTS');
      if (subView === 'ADJUSTMENTS') setShowAdjustModal(true);
    }
    else if (subView === 'PRODUCTS' || subView === 'STOCK_CURRENT' || subView === 'STOCK_REPORT') setActiveTab('LEDGER');
  }, [subView]);

  const [search, setSearch] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Contagem Periódica de Inventário');

  // Filter products strictly matching tenant business segment
  const safeProducts = React.useMemo(() => {
    const rawList = Array.isArray(products) ? products : [];
    return rawList.filter((p) => {
      if (!p) return false;
      if (p.segment) {
        if (segment === 'PHARMACY') return p.segment === 'PHARMACY';
        if (segment === 'RESTAURANT_BAR') return p.segment === 'RESTAURANT_BAR';
        if (segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING') return p.segment === 'CLOTHING' || p.segment === 'RETAIL_CLOTHING';
        if (segment === 'SERVICES') return p.segment === 'SERVICES';
        if (segment === 'SUPERMARKET' || segment === 'CONVENIENCE_STORE' || segment === 'GENERAL_RETAIL') {
          return p.segment === 'SUPERMARKET' || p.segment === 'GENERAL_RETAIL' || p.segment === 'CONVENIENCE_STORE';
        }
      }
      if (segment === 'PHARMACY') {
        return ['Medicamentos', 'Antibióticos', 'Dermocosmética', 'Primeiros Socorros'].includes(p.category);
      }
      if (segment === 'RESTAURANT_BAR') {
        return ['Bebidas', 'Cafetaria', 'Restauração', 'Matéria-Prima'].includes(p.category);
      }
      if (segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING') {
        return ['Vestuário Masculino', 'Vestuário Feminino', 'Calçado', 'Acessórios'].includes(p.category);
      }
      if (segment === 'SERVICES') {
        return ['Serviços', 'Consultoria', 'Auditoria'].includes(p.category);
      }
      return !['Medicamentos', 'Antibióticos', 'Vestuário Masculino', 'Vestuário Feminino'].includes(p.category);
    });
  }, [products, segment]);
  const safeMovements = Array.isArray(movements) ? movements : [];

  const filteredProducts = safeProducts.filter((p) => {
    if (!p) return false;
    return (
      !search ||
      (p.name && p.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const recipeProducts = safeProducts.filter((p) => p && p.type === 'recipe');

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || adjustQty === 0) return;

    onAdjustStock({
      productId: selectedProductId,
      qtyChange: adjustQty,
      reason: adjustReason,
      actor: currentUser.name,
    });
    setShowAdjustModal(false);
    setAdjustQty(0);
  };

  return (
    <div id="pulse-stock-view" className="space-y-4">
      {/* View Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            MOTOR DE INVENTÁRIO & RECEITAS (BOM)
          </h2>
          <p className="text-xs text-slate-400">
            Stock Físico, Reservas, Explosão Automática de Matérias-Primas e Ledger de Movimentações
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-stock-adjustment"
            onClick={() => setShowAdjustModal(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Ajuste Manual de Stock</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'LEDGER'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'CATEGORIES'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorias</span>
          </button>
          <button
            onClick={() => setActiveTab('RECIPES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'RECIPES'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fichas Técnicas (BOM)</span>
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'MOVEMENTS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Inventário / Movimentos ({movements.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar artigos, SKU..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Tab 1: Product & Stock Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nome do Artigo</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Custo Médio</th>
                  <th className="p-3">PVP Venda</th>
                  <th className="p-3">Stock Físico</th>
                  <th className="p-3">Disponível</th>
                  <th className="p-3">Nível Mínimo</th>
                  <th className="p-3 text-right">Estado / Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredProducts.map((p) => {
                  const isLow = p.type !== 'service' && p.currentStock <= p.stockMin;
                  const available = p.currentStock - p.reservedStock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-white">{p.sku}</td>
                      <td className="p-3 font-medium text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.type === 'recipe' && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono">
                              BOM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400">{p.category}</td>
                      <td className="p-3">
                        <span className="capitalize text-slate-400">{p.type}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {p.cost.toLocaleString()} {currency}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400">
                        {p.price.toLocaleString()} {currency}
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        {p.type === 'service' ? '-' : `${p.currentStock} ${p.unit}`}
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {p.type === 'service' ? '-' : `${available} ${p.unit}`}
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {p.type === 'service' ? '-' : `${p.stockMin} ${p.unit}`}
                      </td>
                      <td className="p-3 text-right">
                        {isLow ? (
                          <button
                            onClick={() => onTriggerPurchaseSuggestion(p)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Repor Stock</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 text-[11px] font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Categories Breakdown */}
      {activeTab === 'CATEGORIES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Famílias & Categorias de Artigos</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Total: {Array.from(new Set(safeProducts.map((p) => p.category || 'Geral'))).length} Categorias
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Nº de Artigos</th>
                  <th className="p-3">Stock Físico Total</th>
                  <th className="p-3">Valor Total em Armazém</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {Array.from(new Set(safeProducts.map((p) => p.category || 'Geral'))).map((catName) => {
                  const catProducts = safeProducts.filter((p) => (p.category || 'Geral') === catName);
                  const totalStock = catProducts.reduce((acc, p) => acc + (p.currentStock || 0), 0);
                  const totalValue = catProducts.reduce((acc, p) => acc + (p.currentStock * p.price || 0), 0);

                  return (
                    <tr key={catName} className="hover:bg-slate-850/60 transition-colors">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{catName}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">{catProducts.length} artigos</td>
                      <td className="p-3 font-mono font-bold text-slate-200">{totalStock} unidades</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">{totalValue.toLocaleString()} {currency}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSearch(catName);
                            setActiveTab('LEDGER');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Ver Artigos
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Recipe / BOM Breakdown Inspector */}
      {activeTab === 'RECIPES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipeProducts.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3"
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{recipe.name}</h3>
                    <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                      BOM RECIPE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ao vender 1 {recipe.unit}, o Stock Engine desconta automaticamente:
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-emerald-400">
                    PVP: {recipe.price.toLocaleString()} {currency}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Custo BOM: {recipe.cost.toLocaleString()} {currency}
                  </div>
                </div>
              </div>

              {/* Recipe items */}
              <div className="space-y-2">
                {recipe.recipe?.map((item, idx) => {
                  const raw = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{item.productName}</div>
                        <div className="text-[10px] text-slate-400">
                          Stock Atual: {raw?.currentStock ?? 0} {item.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-amber-400">
                          {item.qty} {item.unit} / dose
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Custo: {item.cost.toLocaleString()} {currency}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Margem Bruta Teórica:</span>
                <span className="font-bold font-mono text-emerald-400">
                  {Math.round(((recipe.price - recipe.cost) / recipe.price) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Movements Ledger */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Artigo</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Qtd Movimentada</th>
                  <th className="p-3">Custo Unitário</th>
                  <th className="p-3">Doc Ref</th>
                  <th className="p-3">Motivo / Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Nenhuma movimentação de stock registada ainda.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isOut = m.qty < 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {new Date(m.timestamp).toLocaleTimeString()} {m.timestamp.split('T')[0]}
                        </td>
                        <td className="p-3 font-medium text-white">{m.productName}</td>
                        <td className="p-3 font-mono text-slate-400 text-[11px]">{m.sku}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold">
                          <span className={isOut ? 'text-rose-400' : 'text-emerald-400'}>
                            {m.qty > 0 ? `+${m.qty}` : m.qty}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-400">
                          {m.unitCost.toLocaleString()} {currency}
                        </td>
                        <td className="p-3 font-mono text-slate-300 text-[11px]">
                          {m.docNumber || '-'}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] truncate max-w-[200px]">
                          {m.reason}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Ajuste Manual de Inventário
            </h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Selecionar Artigo:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                >
                  {products
                    .filter((p) => p.type !== 'service')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock Atual: {p.currentStock} {p.unit})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Variação de Quantidade (+ para entrada, - para quebra/perda):
                </label>
                <input
                  type="number"
                  value={adjustQty || ''}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value, 10) || 0)}
                  placeholder="Ex: +10 ou -5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Motivo do Ajuste (Obrigatório para Auditoria):</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adjustQty === 0}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg disabled:opacity-40"
                >
                  Registar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
