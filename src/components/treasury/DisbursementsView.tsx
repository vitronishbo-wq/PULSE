import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Building,
  Upload,
  AlertTriangle,
  X,
  Eye,
  Check,
  Ban,
  UserCheck,
} from 'lucide-react';
import {
  PaymentDisbursement,
  Supplier,
  BankAccount,
  PaymentMethod,
  DisbursementStatus,
  ApprovalStatus,
  BeneficiaryType,
  User,
  PurchaseEntry,
} from '../../types/pulse';

interface DisbursementsViewProps {
  disbursements: PaymentDisbursement[];
  suppliers: Supplier[];
  bankAccounts: BankAccount[];
  purchases?: PurchaseEntry[];
  currency: string;
  currentUser: User;
  onRegisterDisbursement: (
    disbursement: Omit<PaymentDisbursement, 'id' | 'disbursementNumber' | 'createdAt'>
  ) => void;
  onApproveDisbursement: (id: string, notes?: string) => void;
  onRejectDisbursement: (id: string, reason: string) => void;
  onCancelDisbursement: (id: string, reason: string) => void;
}

export const DisbursementsView: React.FC<DisbursementsViewProps> = ({
  disbursements = [],
  suppliers = [],
  bankAccounts = [],
  purchases = [],
  currency = 'Kz',
  currentUser,
  onRegisterDisbursement,
  onApproveDisbursement,
  onRejectDisbursement,
  onCancelDisbursement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDisbursementForPrint, setSelectedDisbursementForPrint] =
    useState<PaymentDisbursement | null>(null);

  // Modals for Actions
  const [approveModalItem, setApproveModalItem] = useState<PaymentDisbursement | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectModalItem, setRejectModalItem] = useState<PaymentDisbursement | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelModalItem, setCancelModalItem] = useState<PaymentDisbursement | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form State for New Payment
  const [beneficiaryType, setBeneficiaryType] = useState<BeneficiaryType>('SUPPLIER');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [customBeneficiaryName, setCustomBeneficiaryName] = useState<string>('');
  const [customBeneficiaryTaxId, setCustomBeneficiaryTaxId] = useState<string>('');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
  const [customDocNumber, setCustomDocNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    bankAccounts[0]?.id || ''
  );
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [category, setCategory] = useState<string>('Mercadorias & Alimentos');
  const [notes, setNotes] = useState<string>('');
  const [autoReconcile, setAutoReconcile] = useState<boolean>(true);

  // Check if current user has approval privileges
  const canApprove =
    currentUser.role === 'platform_admin' ||
    currentUser.role === 'tenant_owner' ||
    currentUser.role === 'manager';

  // Selected Supplier
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  // Supplier purchases
  const pendingSupplierPurchases = useMemo(() => {
    if (!selectedSupplierId) return [];
    return purchases.filter(
      (p) => p.supplierId === selectedSupplierId && p.status !== 'CANCELLED'
    );
  }, [purchases, selectedSupplierId]);

  // When supplier changes
  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    setSelectedPurchaseId('');
    const sup = suppliers.find((s) => s.id === supId);
    if (sup && sup.currentBalance > 0) {
      setAmount(sup.currentBalance);
    } else {
      setAmount(0);
    }
  };

  // When purchase changes
  const handlePurchaseChange = (purchId: string) => {
    setSelectedPurchaseId(purchId);
    if (!purchId) {
      if (selectedSupplier) setAmount(selectedSupplier.currentBalance);
      return;
    }
    const purch = purchases.find((p) => p.id === purchId);
    if (purch) {
      setAmount(purch.grossTotal);
      if (!reference) {
        setReference(`PAG-${purch.docNumber}`);
      }
    }
  };

  // Submit New Disbursement
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (beneficiaryType === 'SUPPLIER' && !selectedSupplierId) {
      alert('Por favor selecione o fornecedor.');
      return;
    }
    if (beneficiaryType !== 'SUPPLIER' && !customBeneficiaryName.trim()) {
      alert('Por favor introduza o nome do beneficiário.');
      return;
    }
    if (amount <= 0) {
      alert('O montante a pagar deve ser superior a zero.');
      return;
    }

    const beneficiaryName =
      beneficiaryType === 'SUPPLIER' ? selectedSupplier?.name || 'Fornecedor' : customBeneficiaryName;
    const beneficiaryTaxId =
      beneficiaryType === 'SUPPLIER' ? selectedSupplier?.taxId : customBeneficiaryTaxId;

    const purch = purchases.find((p) => p.id === selectedPurchaseId);
    const docNumber = purch ? purch.docNumber : customDocNumber;
    const bankAccount = bankAccounts.find((b) => b.id === selectedBankAccountId);

    // Approval logic: If cashier or amount > 200.000 Kz and user not manager/owner, requires approval
    const requiresApproval = !canApprove || amount > 500000;
    const approvalStatus: ApprovalStatus = requiresApproval
      ? 'PENDING_APPROVAL'
      : 'APPROVED';
    const status: DisbursementStatus =
      approvalStatus === 'APPROVED' ? 'PAID' : 'PENDING';

    onRegisterDisbursement({
      beneficiaryType,
      supplierId: beneficiaryType === 'SUPPLIER' ? selectedSupplierId : undefined,
      beneficiaryName,
      beneficiaryTaxId: beneficiaryTaxId || undefined,
      docId: selectedPurchaseId || undefined,
      docNumber: docNumber || undefined,
      docTotal: purch?.grossTotal,
      paymentMethod,
      amount,
      bankAccountId: paymentMethod !== 'CASH' ? selectedBankAccountId : undefined,
      bankAccountName: paymentMethod !== 'CASH' ? bankAccount?.bankName : 'Caixa Balcão (Dinheiro)',
      reference: reference || `OP-${Date.now().toString().slice(-6)}`,
      proofFileName: proofFileName || undefined,
      status,
      approvalStatus,
      approvedBy: approvalStatus === 'APPROVED' ? `${currentUser.name} (${currentUser.role})` : undefined,
      approvedAt: approvalStatus === 'APPROVED' ? new Date().toISOString() : undefined,
      reconciliationStatus: status === 'PAID' && autoReconcile ? 'RECONCILED' : 'UNRECONCILED',
      date: paymentDate,
      dueDate: dueDate || undefined,
      category,
      notes: notes || `Ordem de pagamento emitida a favor de ${beneficiaryName}`,
      registeredBy: `${currentUser.name} (${currentUser.role})`,
    });

    setShowNewModal(false);
    setSelectedSupplierId('');
    setSelectedPurchaseId('');
    setCustomBeneficiaryName('');
    setCustomBeneficiaryTaxId('');
    setCustomDocNumber('');
    setAmount(0);
    setReference('');
    setProofFileName('');
    setNotes('');
  };

  // Filter Disbursements
  const filteredDisbursements = useMemo(() => {
    return disbursements.filter((d) => {
      const matchSearch =
        d.disbursementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.docNumber && d.docNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.reference && d.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
      const matchApproval = approvalFilter === 'ALL' || d.approvalStatus === approvalFilter;
      const matchMethod = methodFilter === 'ALL' || d.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchApproval && matchMethod;
    });
  }, [disbursements, searchTerm, statusFilter, approvalFilter, methodFilter]);

  // Metric Totals
  const totalPaid = disbursements
    .filter((d) => d.status === 'PAID')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPendingApproval = disbursements
    .filter((d) => d.approvalStatus === 'PENDING_APPROVAL' && d.status !== 'CANCELLED')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPayables = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pago & Liquidado</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalPaid.toLocaleString()}{' '}
            <span className="text-xs font-normal text-emerald-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {disbursements.filter((d) => d.status === 'PAID').length} ordens de pagamento liquidadas
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Aguardando Aprovação</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {totalPendingApproval.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {disbursements.filter((d) => d.approvalStatus === 'PENDING_APPROVAL').length} pagamentos requerem validação
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Dívida a Fornecedores (AP)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-rose-300">
            {totalPayables.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {suppliers.filter((s) => s.currentBalance > 0).length} fornecedores com faturas a prazo
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ação Rápida</span>
            <Wallet className="w-4 h-4 text-blue-400" />
          </div>
          <button
            onClick={() => {
              setShowNewModal(true);
              if (suppliers.find((s) => s.currentBalance > 0)) {
                const firstDebtor = suppliers.find((s) => s.currentBalance > 0);
                if (firstDebtor) handleSupplierChange(firstDebtor.id);
              }
            }}
            className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-950/40"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Novo Pagamento</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nº OP, fornecedor/beneficiário, doc, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos os Estados</option>
              <option value="PAID">Pago / Liquidado</option>
              <option value="PENDING">Pendente</option>
              <option value="CANCELLED">Anulado</option>
            </select>

            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas as Aprovações</option>
              <option value="PENDING_APPROVAL">Aguardando Aprovação</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Rejeitado</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos os Meios</option>
              <option value="BANK_TRANSFER">Transferência Bancária</option>
              <option value="CASH">Dinheiro (Caixa)</option>
              <option value="CARD">Cartão / TPA</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Disbursements Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Nº OP / Data</th>
                <th className="p-3">Beneficiário / Tipo</th>
                <th className="p-3">Documento & Categoria</th>
                <th className="p-3">Meio & Origem</th>
                <th className="p-3">Referência</th>
                <th className="p-3 text-right">Valor Pago</th>
                <th className="p-3 text-center">Aprovação</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">Nenhum registo de pagamento encontrado para os critérios selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredDisbursements.map((disb) => {
                  return (
                    <tr
                      key={disb.id}
                      className="hover:bg-slate-850/50 transition-colors group"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-blue-400" />
                          <span>{disb.disbursementNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{disb.date}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-100">{disb.beneficiaryName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {disb.beneficiaryType === 'SUPPLIER' && 'Fornecedor Credenciado'}
                          {disb.beneficiaryType === 'TAX_AUTHORITY' && 'Autoridade Tributária (AGT)'}
                          {disb.beneficiaryType === 'EMPLOYEE' && 'Colaborador / Vencimento'}
                          {disb.beneficiaryType === 'GENERAL_EXPENSE' && 'Despesa Geral / Serviços'}
                          {disb.beneficiaryType === 'OTHER' && 'Outro Beneficiário'}
                          {disb.beneficiaryTaxId ? ` • NIF: ${disb.beneficiaryTaxId}` : ''}
                        </div>
                      </td>

                      <td className="p-3">
                        {disb.docNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300">
                            <FileText className="w-3 h-3 text-amber-400" />
                            {disb.docNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Despesa Direta</span>
                        )}
                        {disb.category && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{disb.category}</div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {disb.paymentMethod === 'BANK_TRANSFER' && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              TRANSFERÊNCIA
                            </span>
                          )}
                          {disb.paymentMethod === 'CASH' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              DINHEIRO
                            </span>
                          )}
                          {disb.paymentMethod === 'CARD' && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                              CARTÃO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {disb.bankAccountName || 'Caixa Balcão'}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-[11px] text-slate-300">
                          {disb.reference || '—'}
                        </div>
                        {disb.proofFileName && (
                          <div className="text-[10px] text-blue-400/90 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Comprovativo Anexo</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-white text-sm">
                        {disb.amount.toLocaleString()}{' '}
                        <span className="text-[11px] text-blue-400 font-normal">{currency}</span>
                      </td>

                      {/* Approval Status */}
                      <td className="p-3 text-center">
                        {disb.approvalStatus === 'APPROVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <ShieldCheck className="w-3 h-3" />
                            APROVADO
                          </span>
                        )}
                        {disb.approvalStatus === 'PENDING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock className="w-3 h-3" />
                            AGUARDA APROVAÇÃO
                          </span>
                        )}
                        {disb.approvalStatus === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <Ban className="w-3 h-3" />
                            REJEITADO
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {disb.status === 'PAID' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            PAGO
                          </span>
                        )}
                        {disb.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock className="w-3 h-3" />
                            PENDENTE
                          </span>
                        )}
                        {disb.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="w-3 h-3" />
                            ANULADO
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approval Actions if user is manager and item pending */}
                          {canApprove && disb.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => {
                                  setApproveModalItem(disb);
                                  setApprovalNotes('');
                                }}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
                                title="Aprovar Pagamento"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalItem(disb);
                                  setRejectReason('');
                                }}
                                className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
                                title="Rejeitar Pagamento"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedDisbursementForPrint(disb)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Ver / Imprimir Comprovativo"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </button>

                          {disb.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                setCancelModalItem(disb);
                                setCancelReason('');
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Anular Pagamento"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ======================================================== */}
      {/* MODAL: NOVO PAGAMENTO */}
      {/* ======================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
                  <Wallet className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Emitir Ordem de Pagamento
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Liquidação de Fornecedor, Impostos AGT, Salários ou Despesas Gerais
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
              {/* Beneficiary Type Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tipo de Beneficiário:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setBeneficiaryType('SUPPLIER')}
                    className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      beneficiaryType === 'SUPPLIER'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Fornecedor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBeneficiaryType('TAX_AUTHORITY');
                      setCustomBeneficiaryName('AGT - Administração Geral Tributária');
                      setCustomBeneficiaryTaxId('5000000000');
                      setCategory('Impostos AGT (IVA / IRT / Selo)');
                    }}
                    className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      beneficiaryType === 'TAX_AUTHORITY'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    AGT / Impostos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBeneficiaryType('EMPLOYEE');
                      setCategory('Vencimentos & Salários');
                    }}
                    className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      beneficiaryType === 'EMPLOYEE'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Colaborador
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBeneficiaryType('GENERAL_EXPENSE');
                      setCategory('Despesas Gerais / Instalações');
                    }}
                    className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      beneficiaryType === 'GENERAL_EXPENSE'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Despesa Geral
                  </button>
                </div>
              </div>

              {/* Supplier Selection or Custom Beneficiary */}
              {beneficiaryType === 'SUPPLIER' ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Selecionar Fornecedor <span className="text-rose-400">*</span>
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Selecione o Fornecedor --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (NIF: {s.taxId}) — Saldo a Pagar:{' '}
                        {s.currentBalance.toLocaleString()} {currency}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nome do Beneficiário <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ENDE-EP, Colaborador Manuel Silva..."
                      value={customBeneficiaryName}
                      onChange={(e) => setCustomBeneficiaryName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      NIF / Doc. Identificação:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5401928341"
                      value={customBeneficiaryTaxId}
                      onChange={(e) => setCustomBeneficiaryTaxId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Supplier Debt Snapshot */}
              {selectedSupplier && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dívida em Aberto:</span>
                    <span className="text-sm font-bold text-rose-400">
                      {selectedSupplier.currentBalance.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">IBAN / Conta:</span>
                    <span className="text-xs text-slate-300">
                      {selectedSupplier.iban || 'Não registado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condições:</span>
                    <span className="text-xs text-sky-400 font-bold">
                      {selectedSupplier.paymentTerms || 'Pronto Pagamento'}
                    </span>
                  </div>
                </div>
              )}

              {/* Documento Associado */}
              {beneficiaryType === 'SUPPLIER' ? (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Fatura de Compra Associada (Opcional):
                  </label>
                  <select
                    value={selectedPurchaseId}
                    onChange={(e) => handlePurchaseChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Pagamento por Conta / Sem fatura associada --</option>
                    {pendingSupplierPurchases.map((purch) => (
                      <option key={purch.id} value={purch.id}>
                        {purch.docNumber} ({purch.date}) — Total: {purch.grossTotal.toLocaleString()}{' '}
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Nº Documento / Guia RUPE / Recibo:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: DAR-IVA-2026/08, FAT-ENDE-441"
                      value={customDocNumber}
                      onChange={(e) => setCustomDocNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Categoria de Custo:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="Mercadorias & Alimentos">Mercadorias & Alimentos</option>
                      <option value="Bebidas & Stock">Bebidas & Stock</option>
                      <option value="Impostos AGT (IVA / IRT / Selo)">Impostos AGT (IVA / IRT / Selo)</option>
                      <option value="Vencimentos & Salários">Vencimentos & Salários</option>
                      <option value="Energia & Água (ENDE / EPAL)">Energia & Água (ENDE / EPAL)</option>
                      <option value="Rendas & Instalações">Rendas & Instalações</option>
                      <option value="Manutenção & Equipamentos">Manutenção & Equipamentos</option>
                      <option value="Outros Custos Operacionais">Outros Custos Operacionais</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 2-Columns: Meio de Pagamento & Conta Origem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Meio de Pagamento <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="BANK_TRANSFER">Transferência Bancária</option>
                    <option value="CASH">Dinheiro (Caixa Balcão)</option>
                    <option value="CARD">Cartão da Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Conta de Origem (Saída de Fundos):
                  </label>
                  {paymentMethod === 'CASH' ? (
                    <input
                      type="text"
                      disabled
                      value="Caixa Principal Balcão (Conta 43)"
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-slate-400 text-xs"
                    />
                  ) : (
                    <select
                      value={selectedBankAccountId}
                      onChange={(e) => setSelectedBankAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} (Saldo Disp: {b.balance.toLocaleString()} {currency})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 2-Columns: Valor & Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Valor a Pagar ({currency}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Data do Pagamento:
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Referência e Comprovativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Referência / Nº Transferência:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: TRF-BAI-44012, RUPE-990184"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Comprovativo / Ficheiro Anexo:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: recibo_pagamento.pdf"
                      value={proofFileName}
                      onChange={(e) => setProofFileName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                    />
                    <label className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition-colors" title="Simular Anexo">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setProofFileName(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Workflow Info Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Fluxo de Aprovação e Validação
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Operador: {currentUser.name} ({currentUser.role})
                  </span>
                </div>
                <p className="text-slate-400">
                  {canApprove
                    ? 'O seu perfil tem autorização de gerência para aprovar imediatamente este pagamento.'
                    : 'Esta ordem entrará como PENDENTE DE APROVAÇÃO pela Gerência ou Administração.'}
                </p>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas / Observações:</label>
                <input
                  type="text"
                  placeholder="Ex: Amortização parcial acordada com o fornecedor..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-950/50"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Submeter Ordem de Pagamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: APROVAR PAGAMENTO */}
      {/* ======================================================== */}
      {approveModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase">
                Aprovar Pagamento {approveModalItem.disbursementNumber}
              </h3>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Beneficiário:</span>
                <span className="font-bold text-white">{approveModalItem.beneficiaryName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Montante:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {approveModalItem.amount.toLocaleString()} {currency}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Meio:</span>
                <span>{approveModalItem.paymentMethod}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Notas / Despacho de Aprovação (Opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Despesa conferida e autorizada para desembolso imediato..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setApproveModalItem(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onApproveDisbursement(approveModalItem.id, approvalNotes);
                  setApproveModalItem(null);
                }}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar Aprovação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REJEITAR PAGAMENTO */}
      {/* ======================================================== */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <Ban className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase">
                Rejeitar Pagamento {rejectModalItem.disbursementNumber}
              </h3>
            </div>

            <p className="text-slate-300">
              Indique o motivo pelo qual esta ordem de pagamento não foi aprovada:
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Justificação da Rejeição <span className="text-rose-400">*</span>:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Documento de suporte em falta, valor incorreto..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                disabled={!rejectReason.trim()}
                onClick={() => {
                  onRejectDisbursement(rejectModalItem.id, rejectReason);
                  setRejectModalItem(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirmar Rejeição</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VISUALIZAR & IMPRIMIR ORDEM DE PAGAMENTO */}
      {/* ======================================================== */}
      {selectedDisbursementForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-400" />
                Ordem de Pagamento / Comprovativo
              </h3>
              <button
                onClick={() => setSelectedDisbursementForPrint(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voucher Body */}
            <div className="p-5 space-y-4 font-mono bg-white text-slate-900 m-3 rounded-xl border border-slate-200">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider">ORDEM DE PAGAMENTO</h4>
                <div className="text-xs font-bold text-blue-800 mt-0.5">
                  {selectedDisbursementForPrint.disbursementNumber}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Data: {selectedDisbursementForPrint.date} • {new Date().toLocaleTimeString('pt-AO')}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Beneficiário:</span>
                  <span className="font-bold">{selectedDisbursementForPrint.beneficiaryName}</span>
                </div>
                {selectedDisbursementForPrint.beneficiaryTaxId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIF Beneficiário:</span>
                    <span className="font-mono">{selectedDisbursementForPrint.beneficiaryTaxId}</span>
                  </div>
                )}
                {selectedDisbursementForPrint.docNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doc. Suporte:</span>
                    <span className="font-bold text-amber-700">
                      {selectedDisbursementForPrint.docNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Meio de Pagamento:</span>
                  <span className="font-bold">{selectedDisbursementForPrint.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conta Origem:</span>
                  <span>{selectedDisbursementForPrint.bankAccountName || 'Caixa'}</span>
                </div>
                {selectedDisbursementForPrint.reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref. Operação:</span>
                    <span>{selectedDisbursementForPrint.reference}</span>
                  </div>
                )}
                {selectedDisbursementForPrint.approvedBy && (
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>Aprovado por:</span>
                    <span>{selectedDisbursementForPrint.approvedBy}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm font-bold py-1 bg-slate-100 p-2 rounded">
                <span>TOTAL PAGO:</span>
                <span className="text-blue-700">
                  {selectedDisbursementForPrint.amount.toLocaleString()} {currency}
                </span>
              </div>

              <div className="text-[9px] text-slate-500 text-center space-y-1 pt-1">
                <p>Processado por sistema ERP/POS PULSE.OS</p>
                <p>Emitido por: {selectedDisbursementForPrint.registeredBy}</p>
                <p className="font-bold">COMPROVATIVO DE SAÍDA DE TESOURARIA</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDisbursementForPrint(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Ordem</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ANULAR PAGAMENTO */}
      {/* ======================================================== */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase">
                Anular Pagamento {cancelModalItem.disbursementNumber}
              </h3>
            </div>

            <p className="text-slate-300">
              A anulação deste pagamento irá reverter o débito e restaurar o saldo pendente de{' '}
              <strong className="text-white">{cancelModalItem.beneficiaryName}</strong> no valor de{' '}
              <strong className="text-rose-400">
                {cancelModalItem.amount.toLocaleString()} {currency}
              </strong>
              .
            </p>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Motivo da Anulação <span className="text-rose-400">*</span>:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Indique a justificação legal para anulação do desembolso..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setCancelModalItem(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={() => {
                  onCancelDisbursement(cancelModalItem.id, cancelReason);
                  setCancelModalItem(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Confirmar Anulação</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
