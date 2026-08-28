import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Printer,
  Download,
  Calendar,
  Building,
  CreditCard,
  Banknote,
  DollarSign,
  AlertTriangle,
  X,
  Upload,
  RefreshCw,
  Eye,
  UserCheck,
} from 'lucide-react';
import {
  ReceiptEntry,
  Customer,
  BankAccount,
  PaymentMethod,
  ReceiptStatus,
  User,
  Document,
} from '../../types/pulse';

interface ReceiptsViewProps {
  receipts: ReceiptEntry[];
  customers: Customer[];
  bankAccounts: BankAccount[];
  documents?: Document[];
  currency: string;
  currentUser: User;
  onRegisterReceipt: (receipt: Omit<ReceiptEntry, 'id' | 'receiptNumber' | 'createdAt'>) => void;
  onCancelReceipt: (receiptId: string, reason: string) => void;
}

export const ReceiptsView: React.FC<ReceiptsViewProps> = ({
  receipts = [],
  customers = [],
  bankAccounts = [],
  documents = [],
  currency = 'Kz',
  currentUser,
  onRegisterReceipt,
  onCancelReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<ReceiptEntry | null>(null);
  const [cancelModalReceipt, setCancelModalReceipt] = useState<ReceiptEntry | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Form State for New Receipt
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>(
    bankAccounts[0]?.id || ''
  );
  const [amount, setAmount] = useState<number>(0);
  const [reference, setReference] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [receiptStatus, setReceiptStatus] = useState<ReceiptStatus>('RECEIVED');
  const [notes, setNotes] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [autoReconcile, setAutoReconcile] = useState<boolean>(true);

  // Selected Customer details
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  // Available documents for selected customer (credit invoices)
  const pendingCustomerDocs = useMemo(() => {
    if (!selectedCustomerId) return [];
    return documents.filter(
      (d) =>
        d.customerId === selectedCustomerId &&
        (d.paymentMethod === 'CREDIT' || d.docType === 'INVOICE') &&
        d.status !== 'CANCELLED'
    );
  }, [documents, selectedCustomerId]);

  // When customer changes, auto set debt amount
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedDocId('');
    const cust = customers.find((c) => c.id === customerId);
    if (cust && cust.currentBalance > 0) {
      setAmount(cust.currentBalance);
    } else {
      setAmount(0);
    }
  };

  // When doc changes, set doc total
  const handleDocChange = (docId: string) => {
    setSelectedDocId(docId);
    if (!docId) {
      if (selectedCustomer) setAmount(selectedCustomer.currentBalance);
      return;
    }
    const doc = documents.find((d) => d.id === docId);
    if (doc) {
      setAmount(doc.grossAmount);
      if (!reference) {
        setReference(`LIQ-${doc.docNumber}`);
      }
    }
  };

  // Handle Form Submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId && !selectedCustomer) {
      alert('Por favor selecione o cliente.');
      return;
    }
    if (amount <= 0) {
      alert('O montante do recebimento deve ser superior a zero.');
      return;
    }

    const customerName = selectedCustomer ? selectedCustomer.name : 'Consumidor Final';
    const customerTaxId = selectedCustomer?.taxId;
    const doc = documents.find((d) => d.id === selectedDocId);
    const bankAccount = bankAccounts.find((b) => b.id === selectedBankAccountId);

    onRegisterReceipt({
      customerId: selectedCustomerId || undefined,
      customerName,
      customerTaxId,
      originDocId: selectedDocId || undefined,
      originDocNumber: doc?.docNumber || undefined,
      originDocTotal: doc?.grossAmount,
      paymentMethod,
      amount,
      bankAccountId: paymentMethod !== 'CASH' ? selectedBankAccountId : undefined,
      bankAccountName: paymentMethod !== 'CASH' ? bankAccount?.bankName : 'Caixa Geral (Dinheiro)',
      reference: reference || `REC-${Date.now().toString().slice(-6)}`,
      proofFileName: proofFileName || undefined,
      status: receiptStatus,
      reconciliationStatus: autoReconcile ? 'RECONCILED' : 'UNRECONCILED',
      date: receiptDate,
      notes: notes || `Recebimento de conta corrente - ${customerName}`,
      registeredBy: `${currentUser.name} (${currentUser.role})`,
    });

    // Reset & Close
    setShowNewModal(false);
    setSelectedCustomerId('');
    setSelectedDocId('');
    setAmount(0);
    setReference('');
    setProofFileName('');
    setNotes('');
  };

  // Filter receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch =
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.originDocNumber && r.originDocNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.reference && r.reference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchMethod = methodFilter === 'ALL' || r.paymentMethod === methodFilter;

      return matchSearch && matchStatus && matchMethod;
    });
  }, [receipts, searchTerm, statusFilter, methodFilter]);

  // Statistics
  const totalReceived = receipts
    .filter((r) => r.status === 'RECEIVED')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalPending = receipts
    .filter((r) => r.status === 'PENDING')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalCancelled = receipts
    .filter((r) => r.status === 'CANCELLED')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Recebido</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalReceived.toLocaleString()}{' '}
            <span className="text-xs font-normal text-emerald-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {receipts.filter((r) => r.status === 'RECEIVED').length} recebimentos liquidados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Pendente Reconciliação</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {totalPending.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {receipts.filter((r) => r.status === 'PENDING').length} em validação bancária
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Correntes (AR)</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-sky-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-sky-300">
            {customers.reduce((acc, c) => acc + (c.currentBalance || 0), 0).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {customers.filter((c) => c.currentBalance > 0).length} clientes com saldo em dívida
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ação Rápida</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <button
            onClick={() => {
              setShowNewModal(true);
              if (customers.find((c) => c.currentBalance > 0)) {
                const firstDebtor = customers.find((c) => c.currentBalance > 0);
                if (firstDebtor) handleCustomerChange(firstDebtor.id);
              }
            }}
            className="w-full mt-2 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Novo Recebimento</span>
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
              placeholder="Pesquisar por nº recibo, cliente, fatura, ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos os Estados</option>
              <option value="RECEIVED">Recebido / Liquidado</option>
              <option value="PENDING">Pendente</option>
              <option value="CANCELLED">Anulado</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos os Meios</option>
              <option value="CASH">Dinheiro (Caixa)</option>
              <option value="CARD">TPA / Multicaixa</option>
              <option value="BANK_TRANSFER">Transferência Bancária</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              window.print();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Imprimir Histórico"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Nº Recibo / Data</th>
                <th className="p-3">Cliente / Origem</th>
                <th className="p-3">Documento Associado</th>
                <th className="p-3">Meio & Conta</th>
                <th className="p-3">Referência / Ref.</th>
                <th className="p-3 text-right">Valor Recebido</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-center">Reconciliação</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">Nenhum registo de recebimento encontrado para os critérios selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => {
                  return (
                    <tr
                      key={receipt.id}
                      className="hover:bg-slate-850/50 transition-colors group"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{receipt.receiptNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{receipt.date}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-100">{receipt.customerName}</div>
                        {receipt.customerTaxId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIF: {receipt.customerTaxId}
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        {receipt.originDocNumber ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300">
                            <FileText className="w-3 h-3 text-sky-400" />
                            {receipt.originDocNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Recebimento por Conta</span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {receipt.paymentMethod === 'CASH' && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              DINHEIRO
                            </span>
                          )}
                          {receipt.paymentMethod === 'CARD' && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                              MULTICAIXA
                            </span>
                          )}
                          {receipt.paymentMethod === 'BANK_TRANSFER' && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              TRANSFERÊNCIA
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {receipt.bankAccountName || 'Caixa Geral'}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-[11px] text-slate-300">
                          {receipt.reference || '—'}
                        </div>
                        {receipt.proofFileName && (
                          <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Comprovativo Anexo</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-white text-sm">
                        {receipt.amount.toLocaleString()}{' '}
                        <span className="text-[11px] text-emerald-400 font-normal">{currency}</span>
                      </td>

                      <td className="p-3 text-center">
                        {receipt.status === 'RECEIVED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            RECEBIDO
                          </span>
                        )}
                        {receipt.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Clock className="w-3 h-3" />
                            PENDENTE
                          </span>
                        )}
                        {receipt.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle className="w-3 h-3" />
                            ANULADO
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {receipt.reconciliationStatus === 'RECONCILED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            Conciliado
                          </span>
                        )}
                        {receipt.reconciliationStatus === 'UNRECONCILED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                            <Clock className="w-3 h-3" />
                            Por Conciliar
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReceiptForPrint(receipt)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Ver / Imprimir Recibo"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          </button>

                          {receipt.status !== 'CANCELLED' && (
                            <button
                              onClick={() => {
                                setCancelModalReceipt(receipt);
                                setCancelReason('');
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Anular Recibo"
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
      {/* MODAL: NOVO RECEBIMENTO */}
      {/* ======================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Registar Novo Recebimento
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Liquidação de Fatura ou Amortização de Conta Corrente de Cliente
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
              {/* Cliente Selector */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Selecionar Cliente / Origem <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Selecione o Cliente --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.taxId ? `(NIF: ${c.taxId})` : ''} — Dívida:{' '}
                      {c.currentBalance.toLocaleString()} {currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* Debt Snapshot Banner */}
              {selectedCustomer && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Saldo Devedor Atual:</span>
                    <span
                      className={`text-sm font-bold ${
                        selectedCustomer.currentBalance > 0 ? 'text-amber-300' : 'text-emerald-400'
                      }`}
                    >
                      {selectedCustomer.currentBalance.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Plafond Limite:</span>
                    <span className="text-xs text-slate-300">
                      {selectedCustomer.creditLimit?.toLocaleString()} {currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Termos:</span>
                    <span className="text-xs text-sky-400 font-bold">
                      {selectedCustomer.paymentTermsDays || 30} dias
                    </span>
                  </div>
                </div>
              )}

              {/* Documento Associado (Fatura) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fatura / Documento Associado (Opcional):
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => handleDocChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="">
                    -- Recebimento por Conta (Sem documento específico) --
                  </option>
                  {pendingCustomerDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.docNumber} ({doc.date}) — Total: {doc.grossAmount.toLocaleString()}{' '}
                      {currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2-Columns: Meio de Pagamento & Conta Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Meio de Pagamento <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="BANK_TRANSFER">Transferência Bancária</option>
                    <option value="CARD">TPA / Multicaixa</option>
                    <option value="CASH">Dinheiro (Caixa Balcão)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Conta de Destino (Depósito/Entrada):
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
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {bankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} (Saldo: {b.balance.toLocaleString()} {currency})
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
                    Valor Recebido ({currency}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Data do Recebimento:
                  </label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Referência e Comprovativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Referência / Nº Comprovativo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: TRF-BAI-90184, Talão TPA 4401"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Comprovativo / Ficheiro Anexo:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Ex: comprovativo_bancario.pdf"
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

              {/* Estado & Reconciliação Automática */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoReconcile"
                      checked={autoReconcile}
                      onChange={(e) => setAutoReconcile(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="autoReconcile" className="text-slate-300 font-bold cursor-pointer">
                      Reconciliação Automática Imediata
                    </label>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    (Deduz saldo + Atualiza Diário PGC)
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="receiptStatus"
                      checked={receiptStatus === 'RECEIVED'}
                      onChange={() => setReceiptStatus('RECEIVED')}
                      className="text-emerald-500"
                    />
                    <span>Estado: Recebido (Concluído)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="receiptStatus"
                      checked={receiptStatus === 'PENDING'}
                      onChange={() => setReceiptStatus('PENDING')}
                      className="text-amber-500"
                    />
                    <span>Estado: Pendente (Aguardar confirmação)</span>
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas / Observações:</label>
                <input
                  type="text"
                  placeholder="Ex: Liquidação acordada referente ao fornecimento quinzenal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-emerald-500"
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/50"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Emitir & Registar Recibo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VISUALIZAR & IMPRIMIR RECIBO */}
      {/* ======================================================== */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                Recibo Oficial de Pagamento
              </h3>
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="p-5 space-y-4 font-mono bg-white text-slate-900 m-3 rounded-xl border border-slate-200">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider">RECIBO DE COBRANÇA</h4>
                <div className="text-xs font-bold text-emerald-800 mt-0.5">
                  {selectedReceiptForPrint.receiptNumber}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Data: {selectedReceiptForPrint.date} • {new Date().toLocaleTimeString('pt-AO')}
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold">{selectedReceiptForPrint.customerName}</span>
                </div>
                {selectedReceiptForPrint.customerTaxId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIF Cliente:</span>
                    <span className="font-mono">{selectedReceiptForPrint.customerTaxId}</span>
                  </div>
                )}
                {selectedReceiptForPrint.originDocNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Doc. Liquidado:</span>
                    <span className="font-bold text-blue-700">
                      {selectedReceiptForPrint.originDocNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Meio de Pagamento:</span>
                  <span className="font-bold">{selectedReceiptForPrint.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conta Destino:</span>
                  <span>{selectedReceiptForPrint.bankAccountName || 'Caixa'}</span>
                </div>
                {selectedReceiptForPrint.reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ref. Operação:</span>
                    <span>{selectedReceiptForPrint.reference}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-sm font-bold py-1 bg-slate-100 p-2 rounded">
                <span>TOTAL LIQUIDADO:</span>
                <span className="text-emerald-700">
                  {selectedReceiptForPrint.amount.toLocaleString()} {currency}
                </span>
              </div>

              <div className="text-[9px] text-slate-500 text-center space-y-1 pt-1">
                <p>Processado por programa certificado PULSE.OS</p>
                <p>Emitido por: {selectedReceiptForPrint.registeredBy}</p>
                <p className="font-bold">OBRIGADO PELA SUA PREFERÊNCIA!</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                Fechar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ANULAR RECEBIMENTO */}
      {/* ======================================================== */}
      {cancelModalReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-rose-400 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white uppercase">
                Anular Recibo {cancelModalReceipt.receiptNumber}
              </h3>
            </div>

            <p className="text-slate-300">
              A anulação deste recibo irá reverter a amortização no saldo do cliente{' '}
              <strong className="text-white">{cancelModalReceipt.customerName}</strong> e restaurar o
              lançamento de débito no montante de{' '}
              <strong className="text-rose-400">
                {cancelModalReceipt.amount.toLocaleString()} {currency}
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
                placeholder="Indique a justificação legal para anulação do documento..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setCancelModalReceipt(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                Cancelar
              </button>
              <button
                disabled={!cancelReason.trim()}
                onClick={() => {
                  onCancelReceipt(cancelModalReceipt.id, cancelReason);
                  setCancelModalReceipt(null);
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
