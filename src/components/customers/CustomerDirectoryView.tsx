import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  Edit2,
  Receipt,
  FileText,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Percent,
  ChevronRight,
  Filter,
  DollarSign,
} from 'lucide-react';
import { Customer, Document, User } from '../../types/pulse';
import { CustomerModal } from './CustomerModal';
import { CustomerPaymentModal } from './CustomerPaymentModal';

interface CustomerDirectoryViewProps {
  customers: Customer[];
  documents?: Document[];
  currency: string;
  currentUser: User;
  onSaveCustomer: (customer: Customer) => void;
  onToggleCustomerStatus: (customerId: string) => void;
  onSelectCustomerForPurchases: (customer: Customer) => void;
  onSelectCustomerForLedger: (customer: Customer) => void;
  onQuickReceivePayment: (customer: Customer) => void;
}

export const CustomerDirectoryView: React.FC<CustomerDirectoryViewProps> = ({
  customers = [],
  documents = [],
  currency,
  currentUser,
  onSaveCustomer,
  onToggleCustomerStatus,
  onSelectCustomerForPurchases,
  onSelectCustomerForLedger,
  onQuickReceivePayment,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [regimeFilter, setRegimeFilter] = useState<string>('ALL');
  const [debtFilter, setDebtFilter] = useState<'ALL' | 'WITH_DEBT' | 'WITHOUT_DEBT'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Filter logic
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(search.toLowerCase())) ||
      c.taxId.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search)) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || (c.status || 'ACTIVE') === statusFilter;

    const matchesRegime =
      regimeFilter === 'ALL' || (c.taxRegime || 'GERAL') === regimeFilter;

    const matchesDebt =
      debtFilter === 'ALL' ||
      (debtFilter === 'WITH_DEBT' ? (c.currentBalance || 0) > 0 : (c.currentBalance || 0) <= 0);

    return matchesSearch && matchesStatus && matchesRegime && matchesDebt;
  });

  // KPIs
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE').length;
  const totalReceivables = customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0);
  const totalCreditGranted = customers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);
  const customersOverLimit = customers.filter(
    (c) => (c.creditLimit || 0) > 0 && (c.currentBalance || 0) > (c.creditLimit || 0)
  ).length;

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total de Clientes</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <p className="text-xl font-bold text-white font-mono">{totalCustomers}</p>
            <span className="text-[10px] text-emerald-400">({activeCustomers} ativos)</span>
          </div>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Saldo em Dívida (AR)</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 font-mono mt-1">
            {totalReceivables.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Plafond Concedido</span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-sky-400 font-mono mt-1">
            {totalCreditGranted.toLocaleString()}{' '}
            <span className="text-xs text-slate-400">{currency}</span>
          </p>
        </div>

        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">Limite Excedido</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <p className={`text-xl font-bold font-mono ${customersOverLimit > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {customersOverLimit}
            </p>
            <span className="text-[10px] text-slate-400">clientes em alerta</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & New Customer Button */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por Nome, NIF, Email, Cidade..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5 text-xs">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'ACTIVE', label: 'Ativos' },
              { id: 'INACTIVE', label: 'Inativos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Debt Filter */}
          <div className="flex items-center bg-[#18181b] border border-[#27272a] rounded-lg p-0.5 text-xs">
            {[
              { id: 'ALL', label: 'Todos Saldos' },
              { id: 'WITH_DEBT', label: 'Com Dívida' },
              { id: 'WITHOUT_DEBT', label: 'Sem Dívida' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDebtFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                  debtFilter === f.id
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tax Regime Filter */}
          <select
            value={regimeFilter}
            onChange={(e) => setRegimeFilter(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">Todos os Regimes IVA</option>
            <option value="GERAL">Regime Geral (14%)</option>
            <option value="SIMPLIFICADO">Regime Simplificado (7%)</option>
            <option value="ISENTO">Regime de Isenção (0%)</option>
          </select>
        </div>

        {/* Action Button: Novo Cliente */}
        <button
          onClick={handleOpenNew}
          className="w-full md:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Customers Directory Table */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#18181b] text-slate-400 border-b border-[#27272a]">
                <th className="py-3 px-4 font-semibold">Cliente & NIF</th>
                <th className="py-3 px-3 font-semibold">Regime Fiscal & País</th>
                <th className="py-3 px-3 font-semibold">Contactos & Morada</th>
                <th className="py-3 px-3 font-semibold">Plafond vs Dívida</th>
                <th className="py-3 px-3 font-semibold">Condições Pagamento</th>
                <th className="py-3 px-3 font-semibold text-center">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
                    <p className="font-medium text-slate-400">Nenhum cliente encontrado</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tente alterar os termos de pesquisa ou adicione um novo cliente.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const hasDebt = (cust.currentBalance || 0) > 0;
                  const isOverLimit =
                    (cust.creditLimit || 0) > 0 &&
                    (cust.currentBalance || 0) > (cust.creditLimit || 0);

                  const creditPercent =
                    cust.creditLimit && cust.creditLimit > 0
                      ? Math.min(100, Math.round(((cust.currentBalance || 0) / cust.creditLimit) * 100))
                      : 0;

                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-[#18181b]/50 transition-colors group"
                    >
                      {/* Cliente & NIF */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0 group-hover:border-emerald-500/40 group-hover:text-emerald-400 transition-colors">
                            {cust.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{cust.name}</span>
                              {isOverLimit && (
                                <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                                  Limite Excedido
                                </span>
                              )}
                            </div>
                            {cust.tradeName && (
                              <p className="text-[10px] text-slate-400">{cust.tradeName}</p>
                            )}
                            <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px] text-emerald-400">
                              <span>NIF:</span>
                              <span className="font-semibold">{cust.taxId}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Regime Fiscal & País */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                              cust.taxRegime === 'ISENTO'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                : cust.taxRegime === 'SIMPLIFICADO'
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {cust.taxRegime || 'GERAL'}
                          </span>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>País: {cust.fiscalCountry || 'AO'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contactos & Morada */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5 text-[11px]">
                          {cust.phone && (
                            <a
                              href={`tel:${cust.phone}`}
                              className="text-slate-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{cust.phone}</span>
                            </a>
                          )}
                          {cust.email && (
                            <a
                              href={`mailto:${cust.email}`}
                              className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors truncate max-w-[180px]"
                            >
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{cust.email}</span>
                            </a>
                          )}
                          {cust.city && (
                            <div className="text-slate-500 flex items-center gap-1 text-[10px]">
                              <MapPin className="w-3 h-3" />
                              <span>{cust.city}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Plafond vs Dívida */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-400">Saldo:</span>
                            <span
                              className={`font-bold ${
                                hasDebt ? 'text-rose-400' : 'text-slate-300'
                              }`}
                            >
                              {(cust.currentBalance || 0).toLocaleString()} {currency}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Limite:</span>
                            <span>{(cust.creditLimit || 0).toLocaleString()} {currency}</span>
                          </div>

                          {cust.creditLimit && cust.creditLimit > 0 ? (
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  creditPercent > 90
                                    ? 'bg-rose-500'
                                    : creditPercent > 70
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${creditPercent}%` }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {/* Condições Pagamento */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="text-slate-200 font-medium block text-[11px]">
                            {cust.paymentTerms || 'Pronto Pagamento'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Tab: {cust.priceTable || 'GERAL'}
                          </span>
                        </div>
                      </td>

                      {/* Estado Toggle */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleCustomerStatus(cust.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            (cust.status || 'ACTIVE') === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Clique para alternar estado"
                        >
                          {(cust.status || 'ACTIVE') === 'ACTIVE' ? (
                            <>
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Ativo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-2.5 h-2.5 text-slate-400" />
                              <span>Inativo</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Botão Liquidar / Receber Rápido */}
                          {hasDebt && (
                            <button
                              onClick={() => onQuickReceivePayment(cust)}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Registar Recebimento / Regularizar Conta"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Botão Histórico de Compras */}
                          <button
                            onClick={() => onSelectCustomerForPurchases(cust)}
                            className="bg-[#18181b] hover:bg-slate-800 text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Ver Histórico de Compras"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão Conta-Corrente */}
                          <button
                            onClick={() => onSelectCustomerForLedger(cust)}
                            className="bg-[#18181b] hover:bg-slate-800 text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Ver Extrato de Conta-Corrente"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão Editar */}
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="bg-[#18181b] hover:bg-slate-800 text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Editar Cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal (Create / Edit) */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveCustomer}
        customer={editingCustomer}
        currency={currency}
      />
    </div>
  );
};
