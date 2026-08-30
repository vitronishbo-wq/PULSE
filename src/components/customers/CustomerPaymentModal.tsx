import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  CheckCircle2,
  DollarSign,
  FileText,
  Wallet,
  Receipt,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Customer, Document, PaymentMethod, BankAccount } from '../../types/pulse';

interface CustomerPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomer?: Customer | null;
  documents?: Document[];
  bankAccounts?: BankAccount[];
  currency: string;
  onConfirmPayment: (params: {
    customerId: string;
    customerName: string;
    customerTaxId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    bankAccountId?: string;
    bankAccountName?: string;
    docId?: string;
    docNumber?: string;
    reference: string;
    notes?: string;
  }) => void;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  selectedCustomer,
  documents = [],
  bankAccounts = [],
  currency,
  onConfirmPayment,
}) => {
  const [customerId, setCustomerId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerId(selectedCustomer.id);
      setAmount(selectedCustomer.currentBalance > 0 ? selectedCustomer.currentBalance : 0);
    } else if (customers.length > 0) {
      const firstWithDebt = customers.find((c) => (c.currentBalance || 0) > 0) || customers[0];
      setCustomerId(firstWithDebt.id);
      setAmount(firstWithDebt.currentBalance > 0 ? firstWithDebt.currentBalance : 0);
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    setReceiptNumber(`RC ${year}/${rand}`);
    setReference(`REF-REC-${Date.now().toString().slice(-6)}`);
    setSelectedDocId('');
    setError(null);
    setNotes('Recebimento e liquidação de conta-corrente de cliente');
  }, [selectedCustomer, isOpen, customers]);

  if (!isOpen) return null;

  const currentCust = customers.find((c) => c.id === customerId);

  // Open invoices for this customer
  const openCustomerDocs = documents.filter(
    (d) =>
      d.customerId === customerId &&
      d.status !== 'CANCELLED' &&
      d.docType !== 'CREDIT_NOTE' &&
      d.paymentMethod === 'CREDIT'
  );

  const handleDocSelect = (docId: string) => {
    setSelectedDocId(docId);
    if (docId) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) {
        setAmount(doc.grossAmount);
        setNotes(`Liquidação da Fatura ${doc.docNumber}`);
      }
    } else if (currentCust) {
      setAmount(currentCust.currentBalance > 0 ? currentCust.currentBalance : 0);
      setNotes('Amortização geral de conta-corrente');
    }
  };

  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    setSelectedDocId('');
    const found = customers.find((c) => c.id === newCustId);
    if (found) {
      setAmount(found.currentBalance > 0 ? found.currentBalance : 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Por favor selecione um cliente');
      return;
    }
    if (amount <= 0) {
      setError('O valor do recebimento deve ser superior a zero');
      return;
    }

    const doc = selectedDocId ? documents.find((d) => d.id === selectedDocId) : undefined;
    const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);

    onConfirmPayment({
      customerId: currentCust?.id || customerId,
      customerName: currentCust?.name || 'Cliente',
      customerTaxId: currentCust?.taxId || '999999999',
      amount,
      paymentMethod,
      bankAccountId: bankAccountId || undefined,
      bankAccountName: selectedBank ? `${selectedBank.bankName} (${selectedBank.accountNumber})` : undefined,
      docId: selectedDocId || undefined,
      docNumber: doc?.docNumber || undefined,
      reference: reference || `REF-${Date.now().toString().slice(-6)}`,
      notes: notes || 'Recebimento de Conta-Corrente',
    });

    onClose();
  };

  const remainingBalanceAfter = Math.max(0, (currentCust?.currentBalance || 0) - amount);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a] bg-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Novo Recebimento / Regularização de Conta-Corrente
              </h3>
              <p className="text-xs text-slate-400">
                Emissão de Recibo (RC), amortização de dívida e reconciliação financeira
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 p-3 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selector & Current Position */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium">
              Selecionar Cliente <span className="text-rose-400">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — NIF: {c.taxId} ({currency}{' '}
                  {(c.currentBalance || 0).toLocaleString()}{' '}
                  {(c.currentBalance || 0) > 0 ? 'em dívida' : 'sem dívida'})
                </option>
              ))}
            </select>
          </div>

          {/* Client Financial Position Card */}
          {currentCust && (
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3.5 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">Limite de Crédito</span>
                <span className="font-mono font-bold text-slate-200 text-xs">
                  {(currentCust.creditLimit || 0).toLocaleString()} {currency}
                </span>
              </div>
              <div className="border-x border-[#27272a]">
                <span className="text-[11px] text-slate-400 block">Saldo em Dívida (AR)</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {(currentCust.currentBalance || 0).toLocaleString()} {currency}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Saldo Após Recebimento</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {remainingBalanceAfter.toLocaleString()} {currency}
                </span>
              </div>
            </div>
          )}

          {/* Document Association (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium flex items-center justify-between">
              <span>Fatura / Documento Associado</span>
              <span className="text-[10px] text-slate-500 font-normal">Opcional para liquidação direta</span>
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => handleDocSelect(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">-- Amortização Geral da Conta-Corrente --</option>
              {openCustomerDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.docNumber} ({doc.date}) — Total: {doc.grossAmount.toLocaleString()} {currency} (A Crédito)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">
                Valor Recebido ({currency}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">
                Meio de Pagamento <span className="text-rose-400">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="BANK_TRANSFER">Transferência Bancária (BFA, BAI, etc.)</option>
                <option value="CARD">TPA / Multicaixa</option>
                <option value="CASH">Dinheiro / Numerário (Caixa Balcão)</option>
                <option value="CHECK">Cheque Bancário</option>
              </select>
            </div>

            {/* Bank Account */}
            {(paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'CARD') && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-slate-300 font-medium">Conta Bancária de Destino</label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">-- Conta Bancária Padrão do Estabelecimento --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountName} ({b.accountNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">
                Referência / Nº Comprovativo
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: TRF-BFA-991823 ou TPA-TAL-042"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white font-mono outline-none focus:border-emerald-500"
              />
            </div>

            {/* Receipt Auto-Generated Number */}
            <div className="space-y-1.5">
              <label className="block text-slate-300 font-medium">Nº do Recibo (RC)</label>
              <input
                type="text"
                readOnly
                value={receiptNumber}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono font-bold outline-none"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-slate-300 font-medium">Notas / Observações</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Liquidação parcial acordada via transferência bancária"
                className="w-full bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2 text-[11px] text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Ao confirmar este recebimento, o saldo do cliente será amortizado imediatamente, o recibo será registado na Tesouraria e integrado no Razão da Contabilidade.
            </span>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Receipt className="w-4 h-4" />
              <span>Emitir Recibo & Liquidar ({currency} {amount.toLocaleString()})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
