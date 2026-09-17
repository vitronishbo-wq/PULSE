import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  ShieldCheck,
  FileText,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { BusinessSegment, Product, ProductType, TenantProfile } from '../types/pulse';

interface ProductMasterModalProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  tenant?: TenantProfile;
  currency: string;
  existingCategories: string[];
}

export const ProductMasterModal: React.FC<ProductMasterModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  tenant,
  currency,
  existingCategories,
}) => {
  const segment: BusinessSegment = tenant?.segment || tenant?.businessSegment || 'GENERAL_RETAIL';
  const isEditing = !!product?.id;

  // Form State
  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || existingCategories[0] || 'Geral');
  const [type, setType] = useState<ProductType>(product?.type || 'good');
  const [unit, setUnit] = useState(product?.unit || 'un');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [price, setPrice] = useState<number>(product?.price || 0);
  const [cost, setCost] = useState<number>(product?.cost || 0);
  const [taxRate, setTaxRate] = useState<number>(product?.taxRate ?? 14);
  const [taxExemptionReason, setTaxExemptionReason] = useState<string>(product?.taxExemptionReason || '');
  const [stockMin, setStockMin] = useState<number>(product?.stockMin ?? 5);
  const [stockMax, setStockMax] = useState<number>(product?.stockMax ?? 100);
  const [active, setActive] = useState<boolean>(product?.active !== false);

  // Segment Attributes
  const [activeSubstance, setActiveSubstance] = useState(
    product?.segmentAttributes?.pharmacy?.activeSubstance || product?.activeSubstance || ''
  );
  const [prescriptionRequired, setPrescriptionRequired] = useState(
    product?.segmentAttributes?.pharmacy?.prescriptionRequired ?? product?.prescriptionRequired ?? false
  );
  const [dosage, setDosage] = useState(product?.segmentAttributes?.pharmacy?.dosage || '');

  const [preparationArea, setPreparationArea] = useState<'BAR' | 'KITCHEN' | 'GRILL' | 'PASTRY'>(
    product?.segmentAttributes?.restaurant?.preparationArea || product?.preparationArea || 'KITCHEN'
  );
  const [allergens, setAllergens] = useState(
    (product?.segmentAttributes?.restaurant?.allergens || product?.allergens || []).join(', ')
  );

  const [sizes, setSizes] = useState(
    (product?.segmentAttributes?.clothing?.sizes || product?.sizes || []).join(', ')
  );
  const [colors, setColors] = useState(
    (product?.segmentAttributes?.clothing?.colors || product?.colors || []).join(', ')
  );

  const [serviceDurationMins, setServiceDurationMins] = useState<number>(
    product?.segmentAttributes?.services?.serviceDurationMins ?? product?.serviceDurationMins ?? 60
  );
  const [withholdingTaxPercent, setWithholdingTaxPercent] = useState<number>(
    product?.segmentAttributes?.services?.withholdingTaxPercent ?? product?.withholdingTaxPercent ?? 6.5
  );

  // Sync state when product changes
  useEffect(() => {
    if (product) {
      setSku(product.sku || '');
      setName(product.name || '');
      setCategory(product.category || existingCategories[0] || 'Geral');
      setType(product.type || 'good');
      setUnit(product.unit || 'un');
      setBarcode(product.barcode || '');
      setPrice(product.price || 0);
      setCost(product.cost || 0);
      setTaxRate(product.taxRate ?? 14);
      setTaxExemptionReason(product.taxExemptionReason || '');
      setStockMin(product.stockMin ?? 5);
      setStockMax(product.stockMax ?? 100);
      setActive(product.active !== false);

      setActiveSubstance(product.segmentAttributes?.pharmacy?.activeSubstance || product.activeSubstance || '');
      setPrescriptionRequired(product.segmentAttributes?.pharmacy?.prescriptionRequired ?? product.prescriptionRequired ?? false);
      setDosage(product.segmentAttributes?.pharmacy?.dosage || '');

      setPreparationArea(product.segmentAttributes?.restaurant?.preparationArea || product.preparationArea || 'KITCHEN');
      setAllergens((product.segmentAttributes?.restaurant?.allergens || product.allergens || []).join(', '));

      setSizes((product.segmentAttributes?.clothing?.sizes || product.sizes || []).join(', '));
      setColors((product.segmentAttributes?.clothing?.colors || product.colors || []).join(', '));

      setServiceDurationMins(product.segmentAttributes?.services?.serviceDurationMins ?? product.serviceDurationMins ?? 60);
      setWithholdingTaxPercent(product.segmentAttributes?.services?.withholdingTaxPercent ?? product.withholdingTaxPercent ?? 6.5);
    } else {
      // Auto-generate fresh SKU
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      setSku(`ART-${randomDigits}`);
      setName('');
      setCategory(existingCategories[0] || 'Geral');
      setType('good');
      setUnit('un');
      setBarcode('');
      setPrice(0);
      setCost(0);
      setTaxRate(14);
      setTaxExemptionReason('');
      setStockMin(5);
      setStockMax(100);
      setActive(true);
      setActiveSubstance('');
      setPrescriptionRequired(false);
      setDosage('');
      setPreparationArea('KITCHEN');
      setAllergens('');
      setSizes('');
      setColors('');
      setServiceDurationMins(60);
      setWithholdingTaxPercent(6.5);
    }
  }, [product, isOpen, existingCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    // Assemble segment attributes cleanly
    const segmentAttributes = {
      ...(segment === 'PHARMACY' && {
        pharmacy: {
          activeSubstance: activeSubstance.trim() || undefined,
          prescriptionRequired,
          dosage: dosage.trim() || undefined,
          requiresBatchTracking: true,
        },
      }),
      ...(segment === 'RESTAURANT_BAR' && {
        restaurant: {
          preparationArea,
          allergens: allergens ? allergens.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        },
      }),
      ...((segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING') && {
        clothing: {
          sizes: sizes ? sizes.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          colors: colors ? colors.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        },
      }),
      ...(segment === 'SERVICES' && {
        services: {
          serviceDurationMins,
          withholdingTaxPercent,
        },
      }),
    };

    const updatedProduct: Product = {
      id: product?.id || `prod_${Date.now()}`,
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      segment,
      tenantId: tenant?.id || 'tenant_luanda_01',
      type,
      cost: Number(cost) || 0,
      price: Number(price) || 0,
      taxRate: Number(taxRate) || 0,
      taxExemptionReason: taxRate === 0 ? taxExemptionReason : undefined,
      stockMin: Number(stockMin) || 0,
      stockMax: Number(stockMax) || 0,
      currentStock: product?.currentStock ?? 0,
      reservedStock: product?.reservedStock ?? 0,
      unit,
      barcode: barcode.trim() || undefined,
      active,
      segmentAttributes,
      recipe: product?.recipe,
      // Backward compatibility fields
      activeSubstance: activeSubstance.trim() || undefined,
      prescriptionRequired,
      preparationArea,
      allergens: allergens ? allergens.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      sizes: sizes ? sizes.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      colors: colors ? colors.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      serviceDurationMins,
      withholdingTaxPercent,
    };

    onSave(updatedProduct);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {isEditing ? 'Ficha do Artigo (Catálogo Mestre)' : 'Novo Artigo no Catálogo Mestre'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {segment}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Cadastro central de identidade, preços e parâmetros fiscais de referência
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Identidade Central */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Identidade & Classificação do Artigo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Código / SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ex: BEER_CUCA"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono uppercase outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1">Nome / Descrição Mestre *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Cerveja Cuca 33cl (Grade 24un)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Categoria / Família</label>
                <input
                  type="text"
                  list="categories-datalist"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500"
                />
                <datalist id="categories-datalist">
                  {existingCategories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipo de Artigo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="good">Mercadoria / Produto Físico</option>
                  <option value="service">Serviço / Mão de Obra</option>
                  <option value="recipe">Ficha Técnica (BOM / Receita)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Unidade de Medida</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="un">un (Unidade)</option>
                  <option value="cx">cx (Caixa / Fardo)</option>
                  <option value="kg">kg (Quilograma)</option>
                  <option value="lt">lt (Litro)</option>
                  <option value="dose">dose (Dose / Porção)</option>
                  <option value="par">par (Par)</option>
                  <option value="hr">hr (Hora de Serviço)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Código de Barras (EAN-13)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Ex: 560123456701"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Preços & Fiscalidade */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Preçário & Fiscalidade de Referência</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">PVP Venda ({currency}) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={price || ''}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Custo Médio PMP ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cost || ''}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Taxa IVA Referência</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value={14}>14% (Taxa Geral CIVA)</option>
                  <option value={7}>7% (Taxa Reduzida Cesta Básica)</option>
                  <option value={5}>5% (Produtos Específicos)</option>
                  <option value={0}>0% (Isento de IVA)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Motivo Isenção (se 0%)</label>
                <select
                  disabled={taxRate !== 0}
                  value={taxExemptionReason}
                  onChange={(e) => setTaxExemptionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-emerald-500 disabled:opacity-40 cursor-pointer text-[11px]"
                >
                  <option value="">Selecione se aplicável...</option>
                  <option value="M00">M00 - Isento Artigo 12.º do CIVA</option>
                  <option value="M02">M02 - Isenção Exportações</option>
                  <option value="M04">M04 - Isenção Serviços Médicos/Farmácia</option>
                  <option value="M99">M99 - Outras Isenções AGT</option>
                </select>
              </div>
            </div>

            {/* Parâmetros de Stock */}
            {type !== 'service' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-400 mb-1">Nível de Stock Mínimo (Alerta de Reposição)</label>
                  <input
                    type="number"
                    min="0"
                    value={stockMin}
                    onChange={(e) => setStockMin(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Capacidade de Stock Máximo</label>
                  <input
                    type="number"
                    min="0"
                    value={stockMax}
                    onChange={(e) => setStockMax(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Propriedades Dinâmicas do Segmento (Não duplicam a entidade) */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>3. Propriedades Específicas do Perfil: [{segment}]</span>
            </div>

            {segment === 'PHARMACY' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Princípio Ativo (DCI)</label>
                  <input
                    type="text"
                    value={activeSubstance}
                    onChange={(e) => setActiveSubstance(e.target.value)}
                    placeholder="Ex: Paracetamol / Amoxicilina"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dosagem / Apresentação</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Ex: 500mg, Caixa 20 comp"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-presc"
                    checked={prescriptionRequired}
                    onChange={(e) => setPrescriptionRequired(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-900"
                  />
                  <label htmlFor="chk-presc" className="text-slate-300 font-medium cursor-pointer">
                    Exige Receita Médica Obrigatória
                  </label>
                </div>
              </div>
            )}

            {segment === 'RESTAURANT_BAR' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Destino KDS / Zona de Preparação</label>
                  <select
                    value={preparationArea}
                    onChange={(e) => setPreparationArea(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none cursor-pointer"
                  >
                    <option value="BAR">BAR / Bebidas</option>
                    <option value="KITCHEN">COZINHA / Pratos Quentes</option>
                    <option value="GRILL">GRELHA / Carnes & Peixes</option>
                    <option value="PASTRY">SOBREMESAS / Cafetaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Alergénios (separados por vírgula)</label>
                  <input
                    type="text"
                    value={allergens}
                    onChange={(e) => setAllergens(e.target.value)}
                    placeholder="Glúten, Crustáceos, Lactose..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>
            )}

            {(segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Grade de Tamanhos (ex: S, M, L, XL ou 38, 40, 42)</label>
                  <input
                    type="text"
                    value={sizes}
                    onChange={(e) => setSizes(e.target.value)}
                    placeholder="S, M, L, XL"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Variantes de Cor (ex: Azul, Branco, Preto)</label>
                  <input
                    type="text"
                    value={colors}
                    onChange={(e) => setColors(e.target.value)}
                    placeholder="Azul Escuro, Preto, Branco"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none"
                  />
                </div>
              </div>
            )}

            {segment === 'SERVICES' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Duração Estimada (minutos)</label>
                  <input
                    type="number"
                    value={serviceDurationMins}
                    onChange={(e) => setServiceDurationMins(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Retenção na Fonte IRT/II (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={withholdingTaxPercent}
                    onChange={(e) => setWithholdingTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Estado no Catálogo Mestre */}
          <div className="pt-2 flex items-center justify-between p-3 bg-slate-950/40 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs font-medium text-white">Estado no Catálogo de Vendas</p>
                <p className="text-[11px] text-slate-400">
                  Artigos inativos deixam de aparecer no POS e faturas, mas mantêm o histórico fiscal intacto.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                active
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {active ? 'ATIVO NO CATÁLOGO' : 'DESATIVADO'}
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Alterações' : 'Criar Artigo no Catálogo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
