import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Truck,
  Building,
  Package,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Trash2,
  Percent,
  Layers,
  AlertTriangle,
  Printer,
  Sparkles,
  X,
  CreditCard,
  RefreshCw,
  Hash,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Supplier,
  Product,
  PurchaseEntry,
  PurchaseLine,
  AdditionalCost,
  PurchaseStatus,
  PurchaseOriginDocType,
  PaymentMethod,
  User,
} from '../types/pulse';

interface SupplierPurchasesViewProps {
  purchases: PurchaseEntry[];
  suppliers: Supplier[];
  products: Product[];
  currency: string;
  currentUser: User;
  onRegisterPurchase: (purchase: PurchaseEntry) => void;
  onCancelPurchase: (purchaseId: string, reason?: string) => void;
  onConfirmDraftPurchase: (purchaseId: string) => void;
  onSettlePurchasePayment?: (purchase: PurchaseEntry) => void;
  preSelectedSupplier?: Supplier | null;
}

export const SupplierPurchasesView: React.FC<SupplierPurchasesViewProps> = ({
  purchases = [],
  suppliers = [],
  products = [],
  currency,
  currentUser,
  onRegisterPurchase,
  onCancelPurchase,
  onConfirmDraftPurchase,
  onSettlePurchasePayment,
  preSelectedSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'DRAFT' | 'CANCELLED'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [selectedPurchaseForModal, setSelectedPurchaseForModal] = useState<PurchaseEntry | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State for Inbound Purchase Modal
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(preSelectedSupplier?.id || '');
  const [originDocType, setOriginDocType] = useState<PurchaseOriginDocType>('INVOICE');
  const [originDocNumber, setOriginDocNumber] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState<string>('30 Dias Líquido');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [isPaidNow, setIsPaidNow] = useState<boolean>(false);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');

  // Item Lines
  const [lines, setLines] = useState<PurchaseLine[]>([
    {
      id: `pline_${Date.now()}_1`,
      productId: '',
      sku: '',
      description: '',
      qty: 10,
      unit: 'un',
      unitCost: 0,
      discountPercent: 0,
      taxRate: 14,
      netTotal: 0,
      taxTotal: 0,
      grossTotal: 0,
      batchNumber: '',
      expiryDate: '',
    },
  ]);

  // Additional Costs (Frete, Alfândega, Seguros)
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [newCostDesc, setNewCostDesc] = useState<string>('Transporte / Frete');
  const [newCostAmount, setNewCostAmount] = useState<number>(0);

  // Helper when supplier is selected
  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find((s) => s.id === supId);
    if (sup) {
      if (sup.paymentTerms) {
        setPaymentTerms(sup.paymentTerms);
        const days = sup.paymentTerms.includes('15')
          ? 15
          : sup.paymentTerms.includes('30')
          ? 30
          : sup.paymentTerms.includes('60')
          ? 60
          : sup.paymentTerms.includes('90')
          ? 90
          : 0;
        const d = new Date();
        d.setDate(d.getDate() + days);
        setDueDate(d.toISOString().split('T')[0]);
      }
      if (sup.paymentMethodDefault) {
        setPaymentMethod(sup.paymentMethodDefault);
      }
    }
  };

  const openNewPurchaseModal = (sup?: Supplier) => {
    const targetSup = sup || (suppliers.length > 0 ? suppliers[0] : null);
    if (targetSup) {
      handleSupplierChange(targetSup.id);
    }
    setOriginDocType('INVOICE');
    setOriginDocNumber(`FT ${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
    setIssueDate(new Date().toISOString().split('T')[0]);
    setIsPaidNow(false);
    setPurchaseNotes('');
    setAdditionalCosts([]);

    // Initialize with first available product
    const defaultProduct = products[0];
    if (defaultProduct) {
      setLines([
        {
          id: `pline_${Date.now()}_1`,
          productId: defaultProduct.id,
          sku: defaultProduct.sku,
          description: defaultProduct.name,
          qty: 20,
          unit: defaultProduct.unit || 'un',
          unitCost: defaultProduct.cost,
          discountPercent: 0,
          taxRate: defaultProduct.taxRate ?? 14,
          netTotal: 20 * defaultProduct.cost,
          taxTotal: Math.round((20 * defaultProduct.cost * (defaultProduct.taxRate ?? 14)) / 100),
          grossTotal:
            20 * defaultProduct.cost +
            Math.round((20 * defaultProduct.cost * (defaultProduct.taxRate ?? 14)) / 100),
          batchNumber: `LT-${Date.now().toString().slice(-6)}`,
          expiryDate: '',
        },
      ]);
    } else {
      setLines([]);
    }

    setShowCreateModal(true);
  };

  // Line item change handlers
  const handleProductSelect = (lineIndex: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;

    setLines((prev) => {
      const updated = [...prev];
      const cur = updated[lineIndex];
      const net = cur.qty * prod.cost;
      const tax = Math.round((net * (prod.taxRate ?? 14)) / 100);

      updated[lineIndex] = {
        ...cur,
        productId: prod.id,
        sku: prod.sku,
        description: prod.name,
        unit: prod.unit || 'un',
        unitCost: prod.cost,
        taxRate: prod.taxRate ?? 14,
        netTotal: net,
        taxTotal: tax,
        grossTotal: net + tax,
      };
      return updated;
    });
  };

  const handleLineQtyChange = (lineIndex: number, qty: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const cur = updated[lineIndex];
      const validQty = Math.max(0.01, qty);
      const discount = cur.discountPercent || 0;
      const net = validQty * cur.unitCost * (1 - discount / 100);
      const tax = Math.round((net * cur.taxRate) / 100);

      updated[lineIndex] = {
        ...cur,
        qty: validQty,
        netTotal: Math.round(net),
        taxTotal: tax,
        grossTotal: Math.round(net + tax),
      };
      return updated;
    });
  };

  const handleLineCostChange = (lineIndex: number, unitCost: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const cur = updated[lineIndex];
      const validCost = Math.max(0, unitCost);
      const discount = cur.discountPercent || 0;
      const net = cur.qty * validCost * (1 - discount / 100);
      const tax = Math.round((net * cur.taxRate) / 100);

      updated[lineIndex] = {
        ...cur,
        unitCost: validCost,
        netTotal: Math.round(net),
        taxTotal: tax,
        grossTotal: Math.round(net + tax),
      };
      return updated;
    });
  };

  const handleLineDiscountChange = (lineIndex: number, discountPercent: number) => {
    setLines((prev) => {
      const updated = [...prev];
      const cur = updated[lineIndex];
      const validDisc = Math.min(100, Math.max(0, discountPercent));
      const net = cur.qty * cur.unitCost * (1 - validDisc / 100);
      const tax = Math.round((net * cur.taxRate) / 100);

      updated[lineIndex] = {
        ...cur,
        discountPercent: validDisc,
        netTotal: Math.round(net),
        taxTotal: tax,
        grossTotal: Math.round(net + tax),
      };
      return updated;
    });
  };

  const handleLineBatchChange = (lineIndex: number, batchNumber: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[lineIndex] = { ...updated[lineIndex], batchNumber };
      return updated;
    });
  };

  const handleLineExpiryChange = (lineIndex: number, expiryDate: string) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[lineIndex] = { ...updated[lineIndex], expiryDate };
      return updated;
    });
  };

  const addLine = () => {
    const defaultProduct = products[0];
    const newId = `pline_${Date.now()}_${lines.length + 1}`;

    if (defaultProduct) {
      const net = 10 * defaultProduct.cost;
      const tax = Math.round((net * (defaultProduct.taxRate ?? 14)) / 100);
      setLines((prev) => [
        ...prev,
        {
          id: newId,
          productId: defaultProduct.id,
          sku: defaultProduct.sku,
          description: defaultProduct.name,
          qty: 10,
          unit: defaultProduct.unit || 'un',
          unitCost: defaultProduct.cost,
          discountPercent: 0,
          taxRate: defaultProduct.taxRate ?? 14,
          netTotal: net,
          taxTotal: tax,
          grossTotal: net + tax,
          batchNumber: '',
          expiryDate: '',
        },
      ]);
    } else {
      setLines((prev) => [
        ...prev,
        {
          id: newId,
          productId: '',
          sku: '',
          description: 'Novo Artigo',
          qty: 1,
          unit: 'un',
          unitCost: 0,
          discountPercent: 0,
          taxRate: 14,
          netTotal: 0,
          taxTotal: 0,
          grossTotal: 0,
        },
      ]);
    }
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Additional costs handling
  const handleAddCost = () => {
    if (!newCostDesc || newCostAmount <= 0) return;
    setAdditionalCosts((prev) => [
      ...prev,
      {
        id: `cost_${Date.now()}`,
        description: newCostDesc,
        amount: newCostAmount,
        allocationMethod: 'BY_VALUE',
      },
    ]);
    setNewCostDesc('Transporte / Frete');
    setNewCostAmount(0);
  };

  const handleRemoveCost = (costId: string) => {
    setAdditionalCosts((prev) => prev.filter((c) => c.id !== costId));
  };

  // Totals calculations
  const subtotalNet = lines.reduce((acc, l) => acc + l.netTotal, 0);
  const taxAmount = lines.reduce((acc, l) => acc + l.taxTotal, 0);
  const additionalCostsTotal = additionalCosts.reduce((acc, c) => acc + c.amount, 0);
  const grossTotal = subtotalNet + taxAmount + additionalCostsTotal;

  // Rateio de custos adicionais nos artigos
  const allocatedLines = useMemo(() => {
    if (subtotalNet <= 0 || additionalCostsTotal <= 0) {
      return lines.map((l) => ({ ...l, allocatedCost: l.unitCost }));
    }
    return lines.map((l) => {
      const lineProportion = l.netTotal / subtotalNet;
      const extraCostPerLine = additionalCostsTotal * lineProportion;
      const extraCostPerUnit = l.qty > 0 ? extraCostPerLine / l.qty : 0;
      return {
        ...l,
        allocatedCost: Math.round(l.unitCost + extraCostPerUnit),
      };
    });
  }, [lines, subtotalNet, additionalCostsTotal]);

  const handleSubmitPurchase = (status: PurchaseStatus) => {
    const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!selectedSupplier) return;
    if (lines.length === 0 || subtotalNet <= 0) return;

    const nextInternalRef = `EC 2026/${(purchases.length + 1).toString().padStart(3, '0')}`;

    const purchaseEntry: PurchaseEntry = {
      id: `purch_${Date.now()}`,
      internalRef: nextInternalRef,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierTaxId: selectedSupplier.taxId,
      originDocType,
      originDocNumber: originDocNumber.trim() || `S/N-${Date.now().toString().slice(-4)}`,
      issueDate,
      dueDate,
      receivedDate: new Date().toISOString().split('T')[0],
      lines: allocatedLines,
      additionalCosts,
      subtotalNet,
      taxAmount,
      additionalCostsTotal,
      grossTotal,
      paymentMethod,
      paymentTerms,
      isPaid: isPaidNow,
      status,
      notes: purchaseNotes.trim() || undefined,
      receivedBy: currentUser.name,
      createdAt: new Date().toISOString(),
      confirmedAt: status === 'CONFIRMED' ? new Date().toISOString() : undefined,
    };

    onRegisterPurchase(purchaseEntry);
    setShowCreateModal(false);
  };

  // Filtered Purchases List
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchesSearch =
        p.internalRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.originDocNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierTaxId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || p.status === statusFilter;

      const matchesSupplier =
        supplierFilter === 'ALL' || p.supplierId === supplierFilter;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [purchases, searchTerm, statusFilter, supplierFilter]);

  const totalPurchasesVolume = purchases
    .filter((p) => p.status === 'CONFIRMED')
    .reduce((acc, p) => acc + p.grossTotal, 0);

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filters */}
      <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por Ref. Interna, Fornecedor, Nº Fatura Origem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] text-slate-200 text-sm pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#121215] border border-[#27272a] rounded-lg p-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('CONFIRMED')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                statusFilter === 'CONFIRMED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Confirmadas
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                statusFilter === 'DRAFT'
                  ? 'bg-zinc-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rascunhos
            </button>
          </div>

          {/* Supplier Selector Filter */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="bg-[#121215] border border-[#27272a] text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todos os Fornecedores</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => openNewPurchaseModal()}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Compra / Entrada</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-[#18181b] rounded-xl border border-[#27272a] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-base">Registo de Compras & Entradas de Stock</h3>
            <span className="text-xs text-slate-400 ml-2">({filteredPurchases.length} registos)</span>
          </div>
          <div className="text-xs text-slate-400">
            Total Compras Confirmadas: <strong className="text-amber-300 font-mono">{totalPurchasesVolume.toLocaleString('pt-AO')} {currency}</strong>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">Nenhuma compra ou entrada registada</p>
            <p className="text-xs text-slate-500 mt-1">
              Registe faturas de fornecedor para atualizar automaticamente o inventário e a conta-corrente.
            </p>
            <button
              onClick={() => openNewPurchaseModal()}
              className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registar Nova Entrada</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121215] text-slate-400 font-mono text-xs uppercase border-b border-[#27272a]">
                <tr>
                  <th className="px-4 py-3">Ref. Interna</th>
                  <th className="px-4 py-3">Fornecedor / NIF</th>
                  <th className="px-4 py-3">Doc. Origem</th>
                  <th className="px-4 py-3">Datas (Emissão / Venc.)</th>
                  <th className="px-4 py-3 text-center">Artigos</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-slate-200">
                {filteredPurchases.map((purch) => {
                  const itemCount = purch.lines.reduce((acc, l) => acc + l.qty, 0);

                  return (
                    <tr
                      key={purch.id}
                      className="hover:bg-[#202024] transition-colors cursor-pointer"
                      onClick={() => setSelectedPurchaseForModal(purch)}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-amber-400">
                        {purch.internalRef}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-100">{purch.supplierName}</div>
                        <div className="text-xs text-slate-400 font-mono">NIF: {purch.supplierTaxId}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-zinc-800 text-slate-300 rounded border border-zinc-700">
                          {purch.originDocType} {purch.originDocNumber}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-xs font-mono">
                        <div className="text-slate-300">Emissão: {purch.issueDate}</div>
                        <div className="text-slate-500 text-[11px]">Venc.: {purch.dueDate}</div>
                      </td>

                      <td className="px-4 py-3.5 text-center text-xs">
                        <span className="font-semibold text-slate-200">{purch.lines.length}</span> tipos
                        <div className="text-[10px] text-slate-400">({itemCount} un/kg)</div>
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-amber-400">
                        {purch.grossTotal.toLocaleString('pt-AO')} {currency}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            purch.status === 'CONFIRMED'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : purch.status === 'DRAFT'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                          }`}
                        >
                          {purch.status === 'CONFIRMED'
                            ? 'Confirmada'
                            : purch.status === 'DRAFT'
                            ? 'Rascunho'
                            : 'Cancelada'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedPurchaseForModal(purch)}
                            title="Ver Detalhes da Compra"
                            className="p-1.5 hover:bg-zinc-800 text-slate-400 hover:text-white rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {purch.status === 'DRAFT' && (
                            <button
                              onClick={() => onConfirmDraftPurchase(purch.id)}
                              title="Confirmar Entrada de Stock"
                              className="p-1.5 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 rounded transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {purch.status === 'CONFIRMED' && onCancelPurchase && (
                            <button
                              onClick={() => {
                                if (confirm(`Deseja anular a entrada de mercadorias ${purch.internalRef}? O stock será revertido.`)) {
                                  onCancelPurchase(purch.id, 'Anulação solicitada pelo utilizador');
                                }
                              }}
                              title="Anular Entrada"
                              className="p-1.5 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Registar Nova Compra / Entrada */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-slate-100 text-base">Registo de Compra / Entrada de Mercadoria</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Header Info: Fornecedor, Doc Origem, Datas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#121215] p-4 rounded-xl border border-[#27272a]">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Fornecedor <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (NIF: {s.taxId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tipo Doc. Origem
                  </label>
                  <select
                    value={originDocType}
                    onChange={(e) => setOriginDocType(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="INVOICE">Fatura Fornecedor (FT)</option>
                    <option value="RECEIPT">Fatura-Recibo (FR)</option>
                    <option value="DELIVERY_NOTE">Guia de Remessa (GR)</option>
                    <option value="ORDER">Nota de Encomenda (NE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nº do Documento Origem <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: FT 2026/9042"
                    value={originDocNumber}
                    onChange={(e) => setOriginDocNumber(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 font-mono px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data de Emissão
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Condição de Pagamento
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pronto Pagamento">Pronto Pagamento</option>
                    <option value="15 Dias Líquido">15 Dias Líquido</option>
                    <option value="30 Dias Líquido">30 Dias Líquido</option>
                    <option value="45 Dias Líquido">45 Dias Líquido</option>
                    <option value="60 Dias Líquido">60 Dias Líquido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="BANK_TRANSFER">Transferência Bancária</option>
                    <option value="CASH">Dinheiro / Caixa</option>
                    <option value="CARD">TPA / Multicaixa</option>
                    <option value="CREDIT">Conta-Corrente (A Prazo)</option>
                  </select>
                </div>
              </div>

              {/* Linhas de Artigos com Lote & Validade */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-400" /> Artigos, Quantidades, Preço de Custo & Lotes
                  </h4>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#27272a] rounded-xl bg-[#121215]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181b] text-slate-400 uppercase font-mono border-b border-[#27272a]">
                      <tr>
                        <th className="p-2.5">Artigo / SKU</th>
                        <th className="p-2.5 w-24">Qtd / Un</th>
                        <th className="p-2.5 w-28">Custo Unit. ({currency})</th>
                        <th className="p-2.5 w-20">Desc %</th>
                        <th className="p-2.5 w-20">IVA %</th>
                        <th className="p-2.5 w-28">Nº Lote</th>
                        <th className="p-2.5 w-32">Validade</th>
                        <th className="p-2.5 w-28 text-right">Total Linha</th>
                        <th className="p-2.5 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {lines.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-[#18181b]/50">
                          <td className="p-2">
                            <select
                              value={line.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="w-full bg-[#18181b] border border-[#27272a] text-slate-200 px-2 py-1.5 rounded focus:outline-none focus:border-amber-500"
                            >
                              <option value="">Selecione o artigo...</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} [{p.sku}]
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={line.qty}
                                onChange={(e) => handleLineQtyChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-[#18181b] border border-[#27272a] text-slate-100 font-mono px-2 py-1.5 rounded text-right focus:outline-none focus:border-amber-500"
                              />
                              <span className="text-[10px] text-slate-500">{line.unit}</span>
                            </div>
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={line.unitCost}
                              onChange={(e) => handleLineCostChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 font-mono px-2 py-1.5 rounded text-right focus:outline-none focus:border-amber-500"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={line.discountPercent || 0}
                              onChange={(e) => handleLineDiscountChange(idx, parseFloat(e.target.value) || 0)}
                              className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 font-mono px-2 py-1.5 rounded text-right focus:outline-none focus:border-amber-500"
                            />
                          </td>

                          <td className="p-2 font-mono text-center">
                            <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-slate-300">
                              {line.taxRate}%
                            </span>
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="LT-..."
                              value={line.batchNumber || ''}
                              onChange={(e) => handleLineBatchChange(idx, e.target.value)}
                              className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 font-mono text-[11px] px-2 py-1.5 rounded focus:outline-none focus:border-amber-500"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="date"
                              value={line.expiryDate || ''}
                              onChange={(e) => handleLineExpiryChange(idx, e.target.value)}
                              className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 text-[11px] px-2 py-1.5 rounded focus:outline-none focus:border-amber-500"
                            />
                          </td>

                          <td className="p-2 text-right font-mono font-semibold text-amber-400">
                            {line.grossTotal.toLocaleString('pt-AO')}
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              disabled={lines.length <= 1}
                              className="p-1 hover:bg-zinc-800 text-slate-500 hover:text-rose-400 rounded disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Custos Adicionais (Frete, Alfândega, Seguros) & Rateio */}
              <div className="bg-[#121215] p-4 rounded-xl border border-[#27272a] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Custos Adicionais & Despesas Acessórias (Rateio no Custo)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Os custos de frete e alfândega serão incorporados proporcionalmente no Preço de Custo Médio Ponderado (PCMP) dos artigos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    placeholder="Descrição da Despesa (Ex: Frete Frigorífico, Seguro)"
                    value={newCostDesc}
                    onChange={(e) => setNewCostDesc(e.target.value)}
                    className="flex-1 min-w-[200px] bg-[#18181b] border border-[#27272a] text-slate-100 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="0"
                      placeholder="Valor"
                      value={newCostAmount || ''}
                      onChange={(e) => setNewCostAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 text-right pr-8"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                      {currency}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCost}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs rounded-lg font-medium transition-colors"
                  >
                    + Adicionar Custo
                  </button>
                </div>

                {additionalCosts.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-[#27272a]">
                    {additionalCosts.map((cost) => (
                      <div
                        key={cost.id}
                        className="flex items-center justify-between text-xs p-2 bg-[#18181b] rounded-lg"
                      >
                        <span className="text-slate-300">{cost.description}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-amber-400">
                            +{cost.amount.toLocaleString('pt-AO')} {currency}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCost(cost.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totais & Resumo Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#121215] p-4 rounded-xl border border-[#27272a]">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Notas Internas / Observações da Entrada
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Registo de estado da mercadoria na descarga, conferência de temperatura, etc."
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 text-xs p-2.5 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Líquido de Artigos:</span>
                    <span className="font-mono text-slate-200">{subtotalNet.toLocaleString('pt-AO')} {currency}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total IVA Dedutível:</span>
                    <span className="font-mono text-slate-200">{taxAmount.toLocaleString('pt-AO')} {currency}</span>
                  </div>
                  {additionalCostsTotal > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>Custos Adicionais Rateados:</span>
                      <span className="font-mono text-amber-400">+{additionalCostsTotal.toLocaleString('pt-AO')} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-[#27272a] pt-2">
                    <span className="text-slate-100">Total a Pagar / Registar:</span>
                    <span className="font-mono text-amber-400 text-base">{grossTotal.toLocaleString('pt-AO')} {currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#27272a] bg-[#121215] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmitPurchase('DRAFT')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Guardar como Rascunho
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmitPurchase('CONFIRMED')}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar Entrada & Atualizar Stock</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Visualização de Detalhe da Compra */}
      {selectedPurchaseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-slate-100 text-base">
                  Guia de Entrada de Mercadorias [{selectedPurchaseForModal.internalRef}]
                </h3>
              </div>
              <button
                onClick={() => setSelectedPurchaseForModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#121215] p-4 rounded-xl border border-[#27272a] text-xs">
                <div>
                  <span className="text-slate-400 block">Fornecedor:</span>
                  <strong className="text-slate-200 text-sm">{selectedPurchaseForModal.supplierName}</strong>
                  <div className="text-[11px] text-slate-500 font-mono">NIF: {selectedPurchaseForModal.supplierTaxId}</div>
                </div>

                <div>
                  <span className="text-slate-400 block">Documento Origem:</span>
                  <strong className="text-slate-200">{selectedPurchaseForModal.originDocType} {selectedPurchaseForModal.originDocNumber}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Data de Receção:</span>
                  <span className="text-slate-200 font-mono">{selectedPurchaseForModal.receivedDate}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Estado da Entrada:</span>
                  <span className="text-emerald-400 font-semibold">{selectedPurchaseForModal.status}</span>
                </div>
              </div>

              {/* Tabela de Artigos */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Artigos Recebidos & Lotes
                </h4>
                <div className="border border-[#27272a] rounded-xl overflow-hidden bg-[#121215]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18181b] text-slate-400 font-mono border-b border-[#27272a]">
                      <tr>
                        <th className="p-2.5">Descrição</th>
                        <th className="p-2.5 text-center">Qtd</th>
                        <th className="p-2.5 text-right">Custo Unit.</th>
                        <th className="p-2.5">Lote / Validade</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {selectedPurchaseForModal.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="p-2.5">
                            <div className="font-medium text-slate-200">{l.description}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{l.sku}</div>
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold">
                            {l.qty} {l.unit}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-300">
                            {l.unitCost.toLocaleString('pt-AO')} {currency}
                          </td>
                          <td className="p-2.5 text-xs font-mono">
                            {l.batchNumber ? (
                              <span className="px-1.5 py-0.5 bg-amber-950/60 text-amber-300 rounded border border-amber-800/40 text-[10px]">
                                {l.batchNumber} {l.expiryDate ? `• Val: ${l.expiryDate}` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-amber-400">
                            {l.grossTotal.toLocaleString('pt-AO')} {currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totalizador */}
              <div className="bg-[#121215] p-4 rounded-xl border border-[#27272a] flex justify-between items-center text-xs">
                <div className="text-slate-400">
                  Operador responsável: <strong className="text-slate-200">{selectedPurchaseForModal.receivedBy}</strong>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs">Total Geral da Compra</div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {selectedPurchaseForModal.grossTotal.toLocaleString('pt-AO')} {currency}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#27272a] bg-[#121215] flex items-center justify-between">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Imprimir Guia de Entrada</span>
              </button>

              <button
                onClick={() => setSelectedPurchaseForModal(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
