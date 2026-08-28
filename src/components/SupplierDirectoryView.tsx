import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Edit2,
  Eye,
  Package,
  History,
  Receipt,
  UserCheck,
  AlertCircle,
  Globe,
  Truck,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';
import {
  Supplier,
  Product,
  PurchaseEntry,
  SupplierLedgerMovement,
  FiscalCountry,
  PaymentMethod,
  User,
} from '../types/pulse';

interface SupplierDirectoryViewProps {
  suppliers: Supplier[];
  products: Product[];
  purchases: PurchaseEntry[];
  movements: SupplierLedgerMovement[];
  currency: string;
  currentUser: User;
  onSaveSupplier: (supplier: Supplier) => void;
  onToggleSupplierStatus: (supplierId: string) => void;
  onSelectForPurchase?: (supplier: Supplier) => void;
  onViewLedger?: (supplierId: string) => void;
}

export const SupplierDirectoryView: React.FC<SupplierDirectoryViewProps> = ({
  suppliers = [],
  products = [],
  purchases = [],
  movements = [],
  currency,
  currentUser,
  onSaveSupplier,
  onToggleSupplierStatus,
  onSelectForPurchase,
  onViewLedger,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [balanceFilter, setBalanceFilter] = useState<'ALL' | 'WITH_DEBT' | 'SETTLED'>('ALL');
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<Supplier | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // Form State for Create/Edit Modal
  const [formData, setFormData] = useState<{
    id?: string;
    name: string;
    tradeName: string;
    taxId: string;
    fiscalCountry: FiscalCountry;
    taxRegime: 'GERAL' | 'SIMPLIFICADO' | 'ISENTO';
    email: string;
    phone: string;
    mobile: string;
    website: string;
    contactPerson: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    paymentTerms: string;
    paymentMethodDefault: PaymentMethod;
    bankName: string;
    iban: string;
    swift: string;
    creditLimit: number;
    currentBalance: number;
    status: 'ACTIVE' | 'INACTIVE';
    notes: string;
    suppliedProductIds: string[];
  }>({
    name: '',
    tradeName: '',
    taxId: '',
    fiscalCountry: 'AO',
    taxRegime: 'GERAL',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    contactPerson: '',
    address: '',
    city: 'Luanda',
    province: 'Luanda',
    postalCode: '1000',
    paymentTerms: '30 Dias Líquido',
    paymentMethodDefault: 'BANK_TRANSFER',
    bankName: '',
    iban: '',
    swift: '',
    creditLimit: 1000000,
    currentBalance: 0,
    status: 'ACTIVE',
    notes: '',
    suppliedProductIds: [],
  });

  const openCreateModal = () => {
    setSupplierToEdit(null);
    setFormData({
      name: '',
      tradeName: '',
      taxId: '',
      fiscalCountry: 'AO',
      taxRegime: 'GERAL',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      contactPerson: '',
      address: '',
      city: 'Luanda',
      province: 'Luanda',
      postalCode: '1000',
      paymentTerms: '30 Dias Líquido',
      paymentMethodDefault: 'BANK_TRANSFER',
      bankName: '',
      iban: '',
      swift: '',
      creditLimit: 1000000,
      currentBalance: 0,
      status: 'ACTIVE',
      notes: '',
      suppliedProductIds: [],
    });
    setShowEditModal(true);
  };

  const openEditModal = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setFormData({
      id: sup.id,
      name: sup.name || '',
      tradeName: sup.tradeName || '',
      taxId: sup.taxId || '',
      fiscalCountry: sup.fiscalCountry || 'AO',
      taxRegime: sup.taxRegime || 'GERAL',
      email: sup.email || '',
      phone: sup.phone || '',
      mobile: sup.mobile || '',
      website: sup.website || '',
      contactPerson: sup.contactPerson || '',
      address: sup.address || '',
      city: sup.city || 'Luanda',
      province: sup.province || 'Luanda',
      postalCode: sup.postalCode || '1000',
      paymentTerms: sup.paymentTerms || '30 Dias Líquido',
      paymentMethodDefault: sup.paymentMethodDefault || 'BANK_TRANSFER',
      bankName: sup.bankAccount?.bankName || '',
      iban: sup.bankAccount?.iban || '',
      swift: sup.bankAccount?.swift || '',
      creditLimit: sup.creditLimit ?? 1000000,
      currentBalance: sup.currentBalance || 0,
      status: sup.status || 'ACTIVE',
      notes: sup.notes || '',
      suppliedProductIds: sup.suppliedProductIds || [],
    });
    setShowEditModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.taxId.trim()) return;

    const supplier: Supplier = {
      id: formData.id || `sup_${Date.now()}`,
      name: formData.name.trim(),
      tradeName: formData.tradeName.trim() || undefined,
      taxId: formData.taxId.trim(),
      fiscalCountry: formData.fiscalCountry,
      taxRegime: formData.taxRegime,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      mobile: formData.mobile.trim() || undefined,
      website: formData.website.trim() || undefined,
      contactPerson: formData.contactPerson.trim() || undefined,
      address: formData.address.trim() || undefined,
      city: formData.city.trim() || undefined,
      province: formData.province.trim() || undefined,
      postalCode: formData.postalCode.trim() || undefined,
      paymentTerms: formData.paymentTerms,
      paymentMethodDefault: formData.paymentMethodDefault,
      bankAccount: formData.bankName || formData.iban
        ? {
            bankName: formData.bankName,
            iban: formData.iban,
            swift: formData.swift || undefined,
          }
        : undefined,
      creditLimit: Number(formData.creditLimit) || 0,
      currentBalance: Number(formData.currentBalance) || 0,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      suppliedProductIds: formData.suppliedProductIds,
      createdAt: supplierToEdit?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSaveSupplier(supplier);
    setShowEditModal(false);
  };

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const matchesSearch =
        sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sup.tradeName && sup.tradeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sup.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sup.email && sup.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (sup.phone && sup.phone.includes(searchTerm)) ||
        (sup.city && sup.city.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && sup.status !== 'INACTIVE') ||
        (statusFilter === 'INACTIVE' && sup.status === 'INACTIVE');

      const matchesBalance =
        balanceFilter === 'ALL' ||
        (balanceFilter === 'WITH_DEBT' && (sup.currentBalance || 0) > 0) ||
        (balanceFilter === 'SETTLED' && (sup.currentBalance || 0) <= 0);

      return matchesSearch && matchesStatus && matchesBalance;
    });
  }, [suppliers, searchTerm, statusFilter, balanceFilter]);

  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter((s) => s.status !== 'INACTIVE').length;
  const suppliersWithDebtCount = suppliers.filter((s) => (s.currentBalance || 0) > 0).length;
  const totalPayablesAmount = suppliers.reduce((acc, s) => acc + (s.currentBalance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filters */}
      <div className="bg-[#18181b] p-4 rounded-xl border border-[#27272a] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por Nome, NIF, Email, Telefone, Cidade..."
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
              Todos ({totalSuppliersCount})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ativos ({activeSuppliersCount})
            </button>
            <button
              onClick={() => setStatusFilter('INACTIVE')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                statusFilter === 'INACTIVE'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inativos ({totalSuppliersCount - activeSuppliersCount})
            </button>
          </div>

          {/* Balance Filter */}
          <div className="hidden lg:flex items-center bg-[#121215] border border-[#27272a] rounded-lg p-1 text-xs">
            <button
              onClick={() => setBalanceFilter('ALL')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                balanceFilter === 'ALL'
                  ? 'bg-zinc-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Qualquer Saldo
            </button>
            <button
              onClick={() => setBalanceFilter('WITH_DEBT')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                balanceFilter === 'WITH_DEBT'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Com Dívida ({suppliersWithDebtCount})
            </button>
            <button
              onClick={() => setBalanceFilter('SETTLED')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                balanceFilter === 'SETTLED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Regularizados
            </button>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Suppliers Table / List */}
      <div className="bg-[#18181b] rounded-xl border border-[#27272a] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-base">Ficheiro de Fornecedores Cadastrados</h3>
            <span className="text-xs text-slate-400 ml-2">
              ({filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'registado' : 'registados'})
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Total a Pagar Acumulado: <strong className="text-amber-300 font-mono">{totalPayablesAmount.toLocaleString('pt-AO')} {currency}</strong>
          </div>
        </div>

        {filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Building className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="font-medium text-slate-300">Nenhum fornecedor encontrado</p>
            <p className="text-xs text-slate-500 mt-1">
              Tente ajustar os termos de pesquisa ou adicione um novo fornecedor ao sistema.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Fornecedor</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#121215] text-slate-400 font-mono text-xs uppercase border-b border-[#27272a]">
                <tr>
                  <th className="px-4 py-3">Fornecedor / Razão Social</th>
                  <th className="px-4 py-3">NIF / Fiscal</th>
                  <th className="px-4 py-3">Contactos</th>
                  <th className="px-4 py-3">Condição Pagamento</th>
                  <th className="px-4 py-3 text-right">Saldo em Aberto (AP)</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-slate-200">
                {filteredSuppliers.map((sup) => {
                  const hasDebt = (sup.currentBalance || 0) > 0;
                  const suppliedCount = (sup.suppliedProductIds || []).length;

                  return (
                    <tr
                      key={sup.id}
                      className="hover:bg-[#202024] transition-colors cursor-pointer group"
                      onClick={() => setSelectedSupplierForDetail(sup)}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-300 font-bold text-xs uppercase flex-shrink-0">
                            {sup.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-100 flex items-center gap-2">
                              <span className="truncate">{sup.name}</span>
                              {suppliedCount > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 text-slate-400 rounded border border-zinc-700">
                                  {suppliedCount} {suppliedCount === 1 ? 'artigo' : 'artigos'}
                                </span>
                              )}
                            </div>
                            {sup.tradeName && (
                              <div className="text-xs text-slate-400 truncate">{sup.tradeName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs">
                        <div className="text-slate-200 font-semibold">{sup.taxId}</div>
                        <div className="text-[11px] text-slate-400">
                          {sup.taxRegime || 'GERAL'} • {sup.fiscalCountry || 'AO'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <div className="flex flex-col gap-0.5">
                          {sup.phone && (
                            <span className="text-slate-300 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" /> {sup.phone}
                            </span>
                          )}
                          {sup.email && (
                            <span className="text-slate-400 flex items-center gap-1 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-slate-500" /> {sup.email}
                            </span>
                          )}
                          {sup.city && (
                            <span className="text-slate-500 text-[11px] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-600" /> {sup.city}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800 text-slate-300 border border-zinc-700 font-medium">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          {sup.paymentTerms || 'Pronto Pagamento'}
                        </span>
                        {sup.bankAccount?.bankName && (
                          <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[140px]">
                            {sup.bankAccount.bankName}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right font-mono">
                        <div
                          className={`font-semibold text-sm ${
                            hasDebt ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {(sup.currentBalance || 0).toLocaleString('pt-AO')} {currency}
                        </div>
                        {hasDebt && (
                          <div className="text-[10px] text-amber-500/80 font-normal">A Pagar</div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            sup.status !== 'INACTIVE'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-zinc-800 text-slate-400 border border-zinc-700'
                          }`}
                        >
                          {sup.status !== 'INACTIVE' ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSupplierForDetail(sup)}
                            title="Ver Ficha Completa"
                            className="p-1.5 hover:bg-zinc-800 text-slate-400 hover:text-white rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(sup)}
                            title="Editar Fornecedor"
                            className="p-1.5 hover:bg-zinc-800 text-slate-400 hover:text-amber-400 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {onSelectForPurchase && (
                            <button
                              onClick={() => onSelectForPurchase(sup)}
                              title="Nova Compra deste Fornecedor"
                              className="p-1.5 hover:bg-amber-950/40 text-amber-400 hover:text-amber-300 rounded transition-colors"
                            >
                              <Truck className="w-4 h-4" />
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

      {/* MODAL: Ficha Detalhada do Fornecedor */}
      {selectedSupplierForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-800/40 flex items-center justify-center text-amber-300 font-bold text-sm">
                  {selectedSupplierForDetail.name.slice(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-100 flex items-center gap-2">
                    {selectedSupplierForDetail.name}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-normal ${
                        selectedSupplierForDetail.status !== 'INACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-zinc-800 text-slate-400'
                      }`}
                    >
                      {selectedSupplierForDetail.status !== 'INACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>NIF: <strong className="font-mono text-slate-200">{selectedSupplierForDetail.taxId}</strong></span>
                    <span>•</span>
                    <span>{selectedSupplierForDetail.tradeName || 'Fornecedor Certificado'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    openEditModal(selectedSupplierForDetail);
                    setSelectedSupplierForDetail(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setSelectedSupplierForDetail(null)}
                  className="p-1.5 hover:bg-zinc-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Tabbed Detail */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Top Financial Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Saldo Atual em Aberto (AP)</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      (selectedSupplierForDetail.currentBalance || 0) > 0
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(selectedSupplierForDetail.currentBalance || 0).toLocaleString('pt-AO')} {currency}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Limite Concedido: {(selectedSupplierForDetail.creditLimit || 0).toLocaleString('pt-AO')} {currency}
                  </div>
                </div>

                <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Condições Comerciais</div>
                  <div className="text-base font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    {selectedSupplierForDetail.paymentTerms || 'Pronto Pagamento'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Método Padrão: {selectedSupplierForDetail.paymentMethodDefault || 'Transferência Bancária'}
                  </div>
                </div>

                <div className="bg-[#121215] border border-[#27272a] p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Dados Fiscais & Regime</div>
                  <div className="text-base font-semibold text-slate-200 mt-1">
                    {selectedSupplierForDetail.taxRegime || 'Regime Geral'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    País Fiscal: {selectedSupplierForDetail.fiscalCountry || 'Angola (AO)'}
                  </div>
                </div>
              </div>

              {/* Informações de Contacto e Morada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#121215] p-4 rounded-xl border border-[#27272a]">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Contactos & Responsável
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pessoa de Contacto:</span>
                      <span className="text-slate-200 font-medium">{selectedSupplierForDetail.contactPerson || 'Não especificado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Telefone:</span>
                      <span className="text-slate-200 font-mono">{selectedSupplierForDetail.phone || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Telemóvel / WhatsApp:</span>
                      <span className="text-slate-200 font-mono">{selectedSupplierForDetail.mobile || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-slate-200 font-mono">{selectedSupplierForDetail.email || '—'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" /> Localização & Banco
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Endereço:</span>
                      <span className="text-slate-200 text-right">{selectedSupplierForDetail.address || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cidade / Província:</span>
                      <span className="text-slate-200">{selectedSupplierForDetail.city || 'Luanda'}, {selectedSupplierForDetail.province || 'Luanda'}</span>
                    </div>
                    {selectedSupplierForDetail.bankAccount?.bankName && (
                      <>
                        <div className="flex justify-between border-t border-[#27272a] pt-1.5 mt-1.5">
                          <span className="text-slate-400">Banco:</span>
                          <span className="text-amber-300 font-medium">{selectedSupplierForDetail.bankAccount.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">IBAN:</span>
                          <span className="text-slate-200 font-mono text-[11px]">{selectedSupplierForDetail.bankAccount.iban}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Artigos Habitualmente Fornecidos */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-400" /> Produtos & Artigos Associados ({products.filter((p) => (selectedSupplierForDetail.suppliedProductIds || []).includes(p.id)).length})
                </h4>
                {products.filter((p) => (selectedSupplierForDetail.suppliedProductIds || []).includes(p.id)).length === 0 ? (
                  <div className="p-4 bg-[#121215] border border-[#27272a] rounded-xl text-center text-xs text-slate-500">
                    Nenhum artigo diretamente vinculado a este fornecedor. Ao registar compras, os produtos serão associados automaticamente.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {products
                      .filter((p) => (selectedSupplierForDetail.suppliedProductIds || []).includes(p.id))
                      .map((prod) => (
                        <div
                          key={prod.id}
                          className="flex items-center justify-between p-3 bg-[#121215] border border-[#27272a] rounded-lg text-xs"
                        >
                          <div>
                            <div className="font-medium text-slate-200">{prod.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{prod.sku} • Stock: {prod.currentStock} {prod.unit}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-amber-400 font-mono font-semibold">{prod.cost.toLocaleString('pt-AO')} {currency}</div>
                            <div className="text-[10px] text-slate-500">Custo Atual</div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Observações */}
              {selectedSupplierForDetail.notes && (
                <div className="p-3 bg-[#121215] border border-[#27272a] rounded-xl text-xs text-slate-300">
                  <strong className="text-slate-400 block mb-1">Notas / Observações:</strong>
                  {selectedSupplierForDetail.notes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#27272a] bg-[#121215] flex items-center justify-between">
              {onViewLedger && (
                <button
                  onClick={() => {
                    const supId = selectedSupplierForDetail.id;
                    setSelectedSupplierForDetail(null);
                    onViewLedger(supId);
                  }}
                  className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Ver Extrato de Conta-Corrente</span>
                </button>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setSelectedSupplierForDetail(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Fechar
                </button>
                {onSelectForPurchase && (
                  <button
                    onClick={() => {
                      const sup = selectedSupplierForDetail;
                      setSelectedSupplierForDetail(null);
                      onSelectForPurchase(sup);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Nova Compra</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Criar / Editar Fornecedor */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#27272a] bg-[#121215] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-slate-100 text-base">
                  {supplierToEdit ? 'Editar Dados do Fornecedor' : 'Cadastrar Novo Fornecedor'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome / Razão Social <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AngoAlimentos Distribuição, S.A."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Comercial / Nome Fantasia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: AngoAlimentos Logística"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    NIF / Contribuinte <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 5401029384"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 font-mono px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Regime Fiscal
                  </label>
                  <select
                    value={formData.taxRegime}
                    onChange={(e) => setFormData({ ...formData, taxRegime: e.target.value as any })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="GERAL">Regime Geral (IVA 14%)</option>
                    <option value="SIMPLIFICADO">Regime Simplificado (7%)</option>
                    <option value="ISENTO">Regime de Exclusão / Isento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    País Fiscal
                  </label>
                  <select
                    value={formData.fiscalCountry}
                    onChange={(e) => setFormData({ ...formData, fiscalCountry: e.target.value as any })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="AO">Angola (AO)</option>
                    <option value="PT">Portugal (PT)</option>
                    <option value="MZ">Moçambique (MZ)</option>
                    <option value="CV">Cabo Verde (CV)</option>
                  </select>
                </div>
              </div>

              {/* Contactos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email de Encomendas
                  </label>
                  <input
                    type="email"
                    placeholder="comercial@fornecedor.ao"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telefone Fixo / Escritório
                  </label>
                  <input
                    type="text"
                    placeholder="+244 222 100 200"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telemóvel / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="+244 923 111 222"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Pessoa de Contacto e Morada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Pessoa de Contacto / Gestor de Conta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Manuel António (Comercial)"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cidade / Província
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Luanda"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Estrada de Viana, Km 14, Parque Industrial"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Condições de Pagamento e Dados Bancários */}
              <div className="p-3 bg-[#121215] rounded-xl border border-[#27272a] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Condições de Pagamento & Dados Bancários
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Prazo de Pagamento Padrão
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    >
                      <option value="Pronto Pagamento">Pronto Pagamento</option>
                      <option value="15 Dias Líquido">15 Dias Líquido</option>
                      <option value="30 Dias Líquido">30 Dias Líquido</option>
                      <option value="45 Dias Líquido">45 Dias Líquido</option>
                      <option value="60 Dias Líquido">60 Dias Líquido</option>
                      <option value="90 Dias Líquido">90 Dias Líquido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nome do Banco
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Banco BAI S.A."
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    IBAN para Transferências
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: AO06.0040.0000.1234.5678.9012.3"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] text-slate-100 font-mono px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-3 bg-[#121215] rounded-xl border border-[#27272a]">
                <div>
                  <div className="text-xs font-medium text-slate-200">Estado do Fornecedor</div>
                  <div className="text-[11px] text-slate-400">Fornecedores inativos não aparecem na emissão rápida de compras.</div>
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="bg-[#18181b] border border-[#27272a] text-slate-100 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Notas Internas / Observações
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, horários de receção, contactos de emergência..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#121215] border border-[#27272a] text-slate-100 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm"
                >
                  {supplierToEdit ? 'Guardar Alterações' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
