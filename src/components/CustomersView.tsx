import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Receipt,
  UserPlus,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import {
  Customer,
  Document,
  CustomerLedgerMovement,
  TenantProfile,
  User as UserType,
  BankAccount,
  PaymentMethod,
} from '../types/pulse';
import { CustomerDirectoryView } from './customers/CustomerDirectoryView';
import { CustomerPurchasesView } from './customers/CustomerPurchasesView';
import { CustomerLedgerView } from './customers/CustomerLedgerView';
import { CustomerPaymentModal } from './customers/CustomerPaymentModal';

interface CustomersViewProps {
  customers: Customer[];
  documents: Document[];
  movements: CustomerLedgerMovement[];
  bankAccounts?: BankAccount[];
  tenant: TenantProfile;
  currency: string;
  currentUser: UserType;
  onSaveCustomer: (customer: Customer) => void;
  onToggleCustomerStatus: (customerId: string) => void;
  onReceiveCustomerPayment: (params: {
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
  subView?: string;
  onViewDocument?: (doc: Document) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers = [],
  documents = [],
  movements = [],
  bankAccounts = [],
  tenant,
  currency,
  currentUser,
  onSaveCustomer,
  onToggleCustomerStatus,
  onReceiveCustomerPayment,
  subView,
  onViewDocument,
}) => {
  // Navigation tabs: DIRECTORY | PURCHASES | LEDGER
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'PURCHASES' | 'LEDGER'>(() => {
    if (subView === 'PURCHASES') return 'PURCHASES';
    if (subView === 'LEDGER') return 'LEDGER';
    return 'DIRECTORY';
  });

  const [selectedCustomerForSubViews, setSelectedCustomerForSubViews] = useState<Customer | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (subView === 'PURCHASES') setActiveTab('PURCHASES');
    else if (subView === 'LEDGER') setActiveTab('LEDGER');
    else if (subView === 'DIRECTORY') setActiveTab('DIRECTORY');
  }, [subView]);

  const handleSelectForPurchases = (customer: Customer) => {
    setSelectedCustomerForSubViews(customer);
    setActiveTab('PURCHASES');
  };

  const handleSelectForLedger = (customer: Customer) => {
    setSelectedCustomerForSubViews(customer);
    setActiveTab('LEDGER');
  };

  const handleQuickReceive = (customer: Customer) => {
    setPaymentCustomer(customer);
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-12 font-sans">
      {/* Top Header Bar with Module Navigation */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Gestão de Clientes & Contas-Correntes</span>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                SAF-T / AGT Compliant
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Ficheiro fiscal de clientes, histórico integral de compras e gestão de contas-correntes
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#18181b] border border-[#27272a] p-1 rounded-xl overflow-x-auto">
          {[
            { id: 'DIRECTORY', label: '1. Ficheiro de Clientes & NIF', icon: Users },
            { id: 'PURCHASES', label: '2. Histórico de Compras', icon: FileText },
            { id: 'LEDGER', label: '3. Conta-Corrente & Extratos', icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'DIRECTORY') {
                    setSelectedCustomerForSubViews(null);
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Views */}
      {activeTab === 'DIRECTORY' && (
        <CustomerDirectoryView
          customers={customers}
          documents={documents}
          currency={currency}
          currentUser={currentUser}
          onSaveCustomer={onSaveCustomer}
          onToggleCustomerStatus={onToggleCustomerStatus}
          onSelectCustomerForPurchases={handleSelectForPurchases}
          onSelectCustomerForLedger={handleSelectForLedger}
          onQuickReceivePayment={handleQuickReceive}
        />
      )}

      {activeTab === 'PURCHASES' && (
        <CustomerPurchasesView
          documents={documents}
          customers={customers}
          tenant={tenant}
          currency={currency}
          currentUser={currentUser}
          selectedCustomer={selectedCustomerForSubViews}
          onViewDocument={onViewDocument}
        />
      )}

      {activeTab === 'LEDGER' && (
        <CustomerLedgerView
          customers={customers}
          movements={movements}
          documents={documents}
          bankAccounts={bankAccounts}
          currency={currency}
          currentUser={currentUser}
          selectedCustomer={selectedCustomerForSubViews}
          onReceiveCustomerPayment={onReceiveCustomerPayment}
        />
      )}

      {/* Quick Receive Payment Modal */}
      <CustomerPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentCustomer(null);
        }}
        customers={customers}
        selectedCustomer={paymentCustomer}
        documents={documents}
        bankAccounts={bankAccounts}
        currency={currency}
        onConfirmPayment={onReceiveCustomerPayment}
      />
    </div>
  );
};
