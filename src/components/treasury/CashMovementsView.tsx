import React, { useState, useMemo } from 'react';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Search,
  Filter,
  Printer,
  X,
  FileSpreadsheet,
  Building,
  Wallet,
  DollarSign,
  User,
  History,
  FileText,
} from 'lucide-react';
import {
  CashMovementEntry,
  CashShiftRecord,
  BankAccount,
  PaymentMethod,
  User as PulseUser,
  CashMovementType,
  CashMovementCategory,
} from '../../types/pulse';

interface CashMovementsViewProps {
  movements: CashMovementEntry[];
  shifts: CashShiftRecord[];
  bankAccounts: BankAccount[];
  cashBalance: number;
  bankBalance: number;
  currency: string;
  currentUser: PulseUser;
  onCreateMovement: (
    mov: Omit<CashMovementEntry, 'id' | 'timestamp' | 'date' | 'time' | 'balanceAfter'>
  ) => void;
  onCloseShift: (params: {
    shiftId: string;
    physicalCountedCash: number;
    difference: number;
    justification?: string;
    authorizedBy?: string;
    notes?: string;
  }) => void;
  onOpenShift: (params: {
    openingFloat: number;
    operatorName: string;
    notes?: string;
  }) => void;
  onTransferFunds: (params: {
    sourceType: 'CASH' | 'BANK';
    targetType: 'CASH' | 'BANK';
    sourceBankId?: string;
    targetBankId?: string;
    amount: number;
    justification: string;
  }) => void;
}

export const CashMovementsView: React.FC<CashMovementsViewProps> = ({
  movements = [],
  shifts = [],
  bankAccounts = [],
  cashBalance = 0,
  bankBalance = 0,
  currency = 'Kz',
  currentUser,
  onCreateMovement,
  onCloseShift,
  onOpenShift,
  onTransferFunds,
}) => {
  // Active shift
  const activeShift = useMemo(
    () => shifts.find((s) => s.status === 'OPEN'),
    [shifts]
  );

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [operatorFilter, setOperatorFilter] = useState<string>('ALL');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Modals
  const [showSuprimentoModal, setShowSuprimentoModal] = useState(false);
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showDirectExpenseModal, setShowDirectExpenseModal] = useState(false);

  // Suprimento (Cash Inflow) Form
  const [suprimentoAmount, setSuprimentoAmount] = useState<number>(0);
  const [suprimentoSource, setSuprimentoSource] = useState<string>('Cofre Retaguarda');
  const [suprimentoJustification, setSuprimentoJustification] = useState<string>('');
  const [suprimentoDocRef, setSuprimentoDocRef] = useState<string>('');

  // Sangria (Cash Outflow) Form
  const [sangriaAmount, setSangriaAmount] = useState<number>(0);
  const [sangriaTarget, setSangriaTarget] = useState<string>('Cofre Forte Principal');
  const [sangriaJustification, setSangriaJustification] = useState<string>('');
  const [sangriaDocRef, setSangriaDocRef] = useState<string>('');

  // Direct Expense Form
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [expenseDocRef, setExpenseDocRef] = useState<string>('');
  const [expenseJustification, setExpenseJustification] = useState<string>('');

  // Transfer Form (Caixa <-> Banco)
  const [transferDirection, setTransferDirection] = useState<'CASH_TO_BANK' | 'BANK_TO_CASH'>(
    'CASH_TO_BANK'
  );
  const [transferBankId, setTransferBankId] = useState<string>(bankAccounts[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferJustification, setTransferJustification] = useState<string>('');

  // Shift Close Form (Caixa Z)
  const [countedCash, setCountedCash] = useState<number>(
    cashBalance + (activeShift?.openingFloat || 20000)
  );
  const [shiftCloseJustification, setShiftCloseJustification] = useState<string>('');
  const [shiftCloseNotes, setShiftCloseNotes] = useState<string>('');
  const [managerAuthPin, setManagerAuthPin] = useState<string>('');
  const [shiftClosedSuccess, setShiftClosedSuccess] = useState<boolean>(false);

  // Shift Open Form
  const [newOpeningFloat, setNewOpeningFloat] = useState<number>(20000);
  const [openShiftNotes, setOpenShiftNotes] = useState<string>('');

  // Distinct Operators
  const distinctOperators = useMemo(() => {
    const set = new Set<string>();
    movements.forEach((m) => {
      if (m.operatorName) set.add(m.operatorName);
    });
    return Array.from(set);
  }, [movements]);

  // Handle Suprimento Submit
  const handleSuprimentoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suprimentoAmount <= 0) {
      alert('O valor do suprimento deve ser positivo.');
      return;
    }

    onCreateMovement({
      type: 'INFLOW',
      category: 'SUPRIMENTO',
      operatorId: currentUser.id,
      operatorName: `${currentUser.name} (${currentUser.role})`,
      shiftId: activeShift?.id,
      shiftNumber: activeShift?.shiftNumber,
      amount: suprimentoAmount,
      paymentMethod: 'CASH',
      sourceAccount: suprimentoSource,
      targetAccount: 'Gaveta Caixa Balcão',
      docRef: suprimentoDocRef || `SUPR-${Date.now().toString().slice(-4)}`,
      description: `Suprimento de Caixa: Reforço de Trocos / Fundo`,
      justification: suprimentoJustification || 'Reforço de trocos para operação',
      authorizedBy: `${currentUser.name} (${currentUser.role})`,
      authorizedAt: new Date().toISOString(),
    });

    setShowSuprimentoModal(false);
    setSuprimentoAmount(0);
    setSuprimentoJustification('');
    setSuprimentoDocRef('');
  };

  // Handle Sangria Submit
  const handleSangriaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sangriaAmount <= 0) {
      alert('O valor da sangria deve ser positivo.');
      return;
    }
    if (sangriaAmount > cashBalance) {
      alert('Saldo em caixa insuficiente para realizar esta sangria.');
      return;
    }

    onCreateMovement({
      type: 'OUTFLOW',
      category: 'SANGRIA',
      operatorId: currentUser.id,
      operatorName: `${currentUser.name} (${currentUser.role})`,
      shiftId: activeShift?.id,
      shiftNumber: activeShift?.shiftNumber,
      amount: sangriaAmount,
      paymentMethod: 'CASH',
      sourceAccount: 'Gaveta Caixa Balcão',
      targetAccount: sangriaTarget,
      docRef: sangriaDocRef || `SANG-${Date.now().toString().slice(-4)}`,
      description: `Sangria de Caixa: Retirada de Segurança para Cofre`,
      justification: sangriaJustification || 'Retirada de excesso de numerário',
      authorizedBy: `${currentUser.name} (${currentUser.role})`,
      authorizedAt: new Date().toISOString(),
    });

    setShowSangriaModal(false);
    setSangriaAmount(0);
    setSangriaJustification('');
    setSangriaDocRef('');
  };

  // Handle Direct Expense Submit
  const handleDirectExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      alert('O valor da despesa deve ser positivo.');
      return;
    }
    if (expenseAmount > cashBalance) {
      alert('Saldo em caixa insuficiente.');
      return;
    }

    onCreateMovement({
      type: 'OUTFLOW',
      category: 'DIRECT_EXPENSE',
      operatorId: currentUser.id,
      operatorName: `${currentUser.name} (${currentUser.role})`,
      shiftId: activeShift?.id,
      shiftNumber: activeShift?.shiftNumber,
      amount: expenseAmount,
      paymentMethod: 'CASH',
      sourceAccount: 'Gaveta Caixa Balcão',
      docRef: expenseDocRef || `DESP-${Date.now().toString().slice(-4)}`,
      description: `Despesa Direta Caixa Miúdo: ${expenseDescription}`,
      justification: expenseJustification || 'Despesa urgente liquidada a pronto',
      authorizedBy: `${currentUser.name} (${currentUser.role})`,
      authorizedAt: new Date().toISOString(),
    });

    setShowDirectExpenseModal(false);
    setExpenseAmount(0);
    setExpenseDescription('');
    setExpenseDocRef('');
    setExpenseJustification('');
  };

  // Handle Transfer Submit (Caixa <-> Banco)
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferAmount <= 0) {
      alert('O montante deve ser superior a zero.');
      return;
    }

    const bank = bankAccounts.find((b) => b.id === transferBankId);
    const bankName = bank ? bank.bankName : 'Conta Bancária';

    if (transferDirection === 'CASH_TO_BANK') {
      if (transferAmount > cashBalance) {
        alert('Saldo de caixa insuficiente para depósito.');
        return;
      }
      onTransferFunds({
        sourceType: 'CASH',
        targetType: 'BANK',
        targetBankId: transferBankId,
        amount: transferAmount,
        justification: transferJustification || `Depósito de numerário de caixa no ${bankName}`,
      });
    } else {
      if (bank && transferAmount > bank.balance) {
        alert('Saldo bancário insuficiente para levantamento.');
        return;
      }
      onTransferFunds({
        sourceType: 'BANK',
        targetType: 'CASH',
        sourceBankId: transferBankId,
        amount: transferAmount,
        justification: transferJustification || `Levantamento de ${bankName} para fundo de caixa`,
      });
    }

    setShowTransferModal(false);
    setTransferAmount(0);
    setTransferJustification('');
  };

  // Handle Shift Close Submit
  const handleShiftCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const expected = (activeShift.openingFloat || 0) + cashBalance;
    const diff = countedCash - expected;

    // If difference and non-manager, requires PIN or justification
    if (Math.abs(diff) > 0 && !shiftCloseJustification.trim()) {
      alert('Por favor introduza a justificação para a discrepância de caixa detetada.');
      return;
    }

    onCloseShift({
      shiftId: activeShift.id,
      physicalCountedCash: countedCash,
      difference: diff,
      justification: shiftCloseJustification || undefined,
      authorizedBy: `${currentUser.name} (${currentUser.role})`,
      notes: shiftCloseNotes || undefined,
    });

    setShiftClosedSuccess(true);
  };

  // Handle Shift Open Submit
  const handleShiftOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift({
      openingFloat: newOpeningFloat,
      operatorName: `${currentUser.name} (${currentUser.role})`,
      notes: openShiftNotes || 'Abertura de turno normal',
    });
    setShowOpenShiftModal(false);
  };

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.docRef && m.docRef.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.justification && m.justification.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || m.type === typeFilter || m.category === typeFilter;
      const matchOperator = operatorFilter === 'ALL' || m.operatorName === operatorFilter;
      const matchShift =
        shiftFilter === 'ALL' ||
        (shiftFilter === 'CURRENT' && m.shiftId === activeShift?.id) ||
        m.shiftId === shiftFilter;
      const matchMethod = methodFilter === 'ALL' || m.paymentMethod === methodFilter;

      return matchSearch && matchType && matchOperator && matchShift && matchMethod;
    });
  }, [movements, searchTerm, typeFilter, operatorFilter, shiftFilter, methodFilter, activeShift]);

  // Statistics for current view
  const totalInflows = movements
    .filter((m) => m.type === 'INFLOW' || m.type === 'OPENING_FLOAT')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalOutflows = movements
    .filter((m) => m.type === 'OUTFLOW')
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Metric Cards: Real-time Balances & Shift Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Physical Cash Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Físico em Caixa</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {cashBalance.toLocaleString()}{' '}
            <span className="text-xs font-normal text-emerald-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Gaveta de atendimento (Conta 43)
          </p>
        </div>

        {/* Card 2: Bank Balances */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Bancárias & TPA</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Building className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {bankBalance.toLocaleString()}{' '}
            <span className="text-xs font-normal text-blue-400">{currency}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {bankAccounts.length} contas ativas ({bankAccounts.map((b) => b.bankName.split(' ')[1] || b.bankName).join(', ')})
          </p>
        </div>

        {/* Card 3: Shift Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider">Turno / Operador</span>
            {activeShift ? (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Unlock className="w-4 h-4 text-emerald-400" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                <Lock className="w-4 h-4 text-slate-400" />
              </div>
            )}
          </div>
          <div className="text-base font-bold font-mono text-white truncate">
            {activeShift ? `Turno #${activeShift.shiftNumber} (ABERTO)` : 'Turno Encerrado'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {activeShift
              ? `Fundo Maneio: ${activeShift.openingFloat.toLocaleString()} ${currency}`
              : 'Nenhum turno em curso'}
          </p>
        </div>

        {/* Card 4: Quick Register Operations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gestão de Turno</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            {activeShift ? (
              <button
                onClick={() => {
                  setCountedCash(cashBalance + (activeShift.openingFloat || 20000));
                  setShiftClosedSuccess(false);
                  setShowShiftModal(true);
                }}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Fecho Z</span>
              </button>
            ) : (
              <button
                onClick={() => setShowOpenShiftModal(true)}
                className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Abrir Turno</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Toolbar for Inflows / Outflows / Transfers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Operações de Caixa:
          </span>

          <button
            onClick={() => setShowSuprimentoModal(true)}
            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Entrada / Suprimento</span>
          </button>

          <button
            onClick={() => setShowSangriaModal(true)}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            <span>- Saída / Sangria</span>
          </button>

          <button
            onClick={() => setShowDirectExpenseModal(true)}
            className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Despesa Direta (Miúdo)</span>
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Transferência Caixa ↔ Banco</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Fita de Caixa</span>
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
              placeholder="Pesquisar movimento, ref, justificação, operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            
            {/* Type / Category Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todas as Categorias</option>
              <option value="SUPRIMENTO">Suprimentos (Entradas)</option>
              <option value="SANGRIA">Sangrias (Saídas)</option>
              <option value="SALES_CASH">Vendas a Dinheiro</option>
              <option value="RECEIPT_CASH">Recebimentos de Clientes</option>
              <option value="DIRECT_EXPENSE">Despesas Diretas</option>
              <option value="BANK_TRANSFER">Transferências Bancárias</option>
              <option value="OPENING_FLOAT">Fundo de Abertura</option>
              <option value="DISCREPANCY_ADJUSTMENT">Ajustes Autorizados</option>
            </select>

            {/* Operator Filter */}
            <select
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos os Operadores</option>
              {distinctOperators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            {/* Shift Filter */}
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos os Turnos</option>
              <option value="CURRENT">Turno Atual Ativo</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  Turno #{s.shiftNumber} ({s.status === 'OPEN' ? 'ABERTO' : 'FECHADO'})
                </option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos os Meios</option>
              <option value="CASH">Dinheiro</option>
              <option value="CARD">TPA / Multicaixa</option>
              <option value="BANK_TRANSFER">Transferência Bancária</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cash Movements Ledger Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Data / Hora / Turno</th>
                <th className="p-3">Tipo & Categoria</th>
                <th className="p-3">Operador / Autorizado Por</th>
                <th className="p-3">Descrição & Doc. Suporte</th>
                <th className="p-3">Origem ➔ Destino</th>
                <th className="p-3 text-right">Montante ({currency})</th>
                <th className="p-3 text-right">Saldo Após Movimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Coins className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">Nenhum movimento de caixa registado com os filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isInflow =
                    mov.type === 'INFLOW' ||
                    mov.type === 'OPENING_FLOAT' ||
                    (mov.type === 'ADJUSTMENT' && mov.amount > 0);
                  const isOutflow = mov.type === 'OUTFLOW' || (mov.type === 'ADJUSTMENT' && mov.amount < 0);

                  return (
                    <tr
                      key={mov.id}
                      className="hover:bg-slate-850/50 transition-colors group"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-white flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{mov.time || '12:00'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {mov.date} {mov.shiftNumber ? `• Turno #${mov.shiftNumber}` : ''}
                        </div>
                      </td>

                      <td className="p-3">
                        {mov.category === 'SUPRIMENTO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <ArrowDownLeft className="w-3 h-3" />
                            SUPRIMENTO
                          </span>
                        )}
                        {mov.category === 'SANGRIA' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            <ArrowUpRight className="w-3 h-3" />
                            SANGRIA
                          </span>
                        )}
                        {mov.category === 'SALES_CASH' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                            <DollarSign className="w-3 h-3" />
                            VENDA A PRONTO
                          </span>
                        )}
                        {mov.category === 'RECEIPT_CASH' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                            RECEBIMENTO
                          </span>
                        )}
                        {mov.category === 'DIRECT_EXPENSE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            DESPESA MIÚDA
                          </span>
                        )}
                        {mov.category === 'BANK_TRANSFER' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                            <ArrowRightLeft className="w-3 h-3" />
                            TRANSF. BANCO
                          </span>
                        )}
                        {mov.category === 'OPENING_FLOAT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[10px] font-bold">
                            FUNDO ABERTURA
                          </span>
                        )}
                        {mov.category === 'DISCREPANCY_ADJUSTMENT' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            AJUSTE AUTORIZADO
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-200">{mov.operatorName}</div>
                        {mov.authorizedBy && (
                          <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                            Auth: {mov.authorizedBy}
                          </div>
                        )}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-medium text-slate-100">{mov.description}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {mov.docRef && (
                            <span className="font-mono text-[10px] text-sky-300 bg-slate-950 px-1 rounded border border-slate-800">
                              {mov.docRef}
                            </span>
                          )}
                          {mov.justification && (
                            <span className="text-[10px] text-slate-400 italic truncate">
                              "{mov.justification}"
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="text-[11px] text-slate-300">
                          {mov.sourceAccount || 'Gaveta Caixa'}
                          {mov.targetAccount ? (
                            <>
                              <span className="text-slate-500 mx-1">➔</span>
                              <span className="text-emerald-400 font-medium">{mov.targetAccount}</span>
                            </>
                          ) : (
                            ''
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            isInflow
                              ? 'text-emerald-400'
                              : isOutflow
                              ? 'text-rose-400'
                              : 'text-sky-400'
                          }
                        >
                          {isInflow ? '+' : isOutflow ? '-' : ''}
                          {mov.amount.toLocaleString()}
                        </span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-white text-xs">
                        {mov.balanceAfter !== undefined
                          ? mov.balanceAfter.toLocaleString()
                          : '—'}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{currency}</span>
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
      {/* MODAL: SUPRIMENTO DE CAIXA */}
      {/* ======================================================== */}
      {showSuprimentoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-xs">
            <div className="bg-slate-950 p-3 -m-5 mb-0 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Suprimento de Caixa (Entrada)
              </h3>
              <button onClick={() => setShowSuprimentoModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSuprimentoSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Montante a Injetar ({currency}) <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={suprimentoAmount || ''}
                  onChange={(e) => setSuprimentoAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Origem dos Fundos:</label>
                <select
                  value={suprimentoSource}
                  onChange={(e) => setSuprimentoSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Cofre Forte Retaguarda">Cofre Forte Retaguarda</option>
                  <option value="Aporte de Capital do Sócio / Dono">Aporte de Capital do Sócio / Dono</option>
                  <option value="Trocos Banco BAI">Trocos Levantados no Banco BAI</option>
                  <option value="Trocos Banco BFA">Trocos Levantados no Banco BFA</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nº Documento / Ref. Interna:
                </label>
                <input
                  type="text"
                  placeholder="Ex: SUPR-2026/044"
                  value={suprimentoDocRef}
                  onChange={(e) => setSuprimentoDocRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Justificação Operacional <span className="text-rose-400">*</span>:
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Reforço de trocos de 500 Kz e 1.000 Kz para horário de pico..."
                  value={suprimentoJustification}
                  onChange={(e) => setSuprimentoJustification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSuprimentoModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmar Suprimento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SANGRIA DE CAIXA */}
      {/* ======================================================== */}
      {showSangriaModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-xs">
            <div className="bg-slate-950 p-3 -m-5 mb-0 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-400" />
                Sangria de Caixa (Retirada de Segurança)
              </h3>
              <button onClick={() => setShowSangriaModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSangriaSubmit} className="space-y-3 pt-2">
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-slate-400">
                <span>Saldo Atual na Gaveta: </span>
                <strong className="text-white font-mono">{cashBalance.toLocaleString()} {currency}</strong>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Montante da Sangria ({currency}) <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={cashBalance}
                  value={sangriaAmount || ''}
                  onChange={(e) => setSangriaAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Destino dos Fundos:</label>
                <select
                  value={sangriaTarget}
                  onChange={(e) => setSangriaTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Cofre Forte Principal">Cofre Forte Principal</option>
                  <option value="Depósito Imediato no Banco BAI">Depósito Imediato no Banco BAI</option>
                  <option value="Depósito Imediato no Banco BFA">Depósito Imediato no Banco BFA</option>
                  <option value="Entrega a Carro-Forte de Transporte de Valores">
                    Entrega a Carro-Forte de Transporte de Valores
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nº Guia de Sangria:
                </label>
                <input
                  type="text"
                  placeholder="Ex: SANG-2026/012"
                  value={sangriaDocRef}
                  onChange={(e) => setSangriaDocRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Justificação da Retirada <span className="text-rose-400">*</span>:
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Excesso de notas de 5000 Kz na gaveta de atendimento..."
                  value={sangriaJustification}
                  onChange={(e) => setSangriaJustification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSangriaModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Confirmar Sangria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DESPESA DIRETA (CAIXA MIÚDO) */}
      {/* ======================================================== */}
      {showDirectExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-xs">
            <div className="bg-slate-950 p-3 -m-5 mb-0 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Despesa Direta (Caixa Miúdo)
              </h3>
              <button onClick={() => setShowDirectExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDirectExpenseSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Descrição da Despesa <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de gelo urgente para o bar, recarga de gás..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Montante Pago ({currency}) <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={cashBalance}
                  value={expenseAmount || ''}
                  onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nº Recibo / Talão de Suporte:
                </label>
                <input
                  type="text"
                  placeholder="Ex: REC-GELO-8812"
                  value={expenseDocRef}
                  onChange={(e) => setExpenseDocRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Justificação da Necessidade:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Rutura de gelo no bar durante o horário de almoço..."
                  value={expenseJustification}
                  onChange={(e) => setExpenseJustification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDirectExpenseModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Registar Saída</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TRANSFERÊNCIA CAIXA <-> BANCO */}
      {/* ======================================================== */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-xs">
            <div className="bg-slate-950 p-3 -m-5 mb-0 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                Transferência de Fundos (Caixa ↔ Banco)
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sentido da Transferência:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferDirection('CASH_TO_BANK')}
                    className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      transferDirection === 'CASH_TO_BANK'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Caixa ➔ Banco (Depósito)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferDirection('BANK_TO_CASH')}
                    className={`p-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                      transferDirection === 'BANK_TO_CASH'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Banco ➔ Caixa (Levantamento)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Conta Bancária Parceira:</label>
                <select
                  value={transferBankId}
                  onChange={(e) => setTransferBankId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} (Saldo: {b.balance.toLocaleString()} {currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Montante a Transferir ({currency}) <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={transferAmount || ''}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Justificação / Ref. Depósito:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Depósito diário de tesouraria..."
                  value={transferJustification}
                  onChange={(e) => setTransferJustification(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Executar Transferência</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: FECHO DE TURNO & DIFERENÇAS DE CAIXA (CAIXA Z) */}
      {/* ======================================================== */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-5 space-y-4 text-xs font-mono">
            <div className="bg-slate-950 p-3 -m-5 mb-0 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Fecho de Turno & Reconciliação (Caixa Z)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans">
                    Contagem Física de Numerário e Apuramento de Quebras / Sobras
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowShiftModal(false);
                  setShiftClosedSuccess(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {shiftClosedSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-5 text-center space-y-3 font-sans">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Turno Encerrado com Sucesso!</h4>
                <p className="text-xs text-slate-300">
                  Os valores foram apurados e lançados no diário de tesouraria.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Imprimir Talão Z</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowShiftModal(false);
                      setShiftClosedSuccess(false);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleShiftCloseSubmit} className="space-y-3 pt-2">
                {/* Operator Info */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Operador em Turno:</span>
                    <span className="text-white font-bold">{currentUser.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Turno:</span>
                    <span className="text-emerald-400 font-bold">
                      #{activeShift?.shiftNumber || 1} ({activeShift?.openedAt?.slice(0, 10) || 'Hoje'})
                    </span>
                  </div>
                </div>

                {/* System Expected Breakdown */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block border-b border-slate-800 pb-1">
                    Valores Apurados pelo Sistema
                  </span>
                  <div className="flex justify-between text-slate-300">
                    <span>Fundo de Maneio Inicial (Abertura):</span>
                    <span className="font-bold">
                      {(activeShift?.openingFloat || 20000).toLocaleString()} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Movimentos Líquidos em Dinheiro:</span>
                    <span className="font-bold">+{cashBalance.toLocaleString()} {currency}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-1.5 border-t border-slate-800">
                    <span>Total Numerário Esperado na Gaveta:</span>
                    <span className="text-amber-300 text-sm">
                      {((activeShift?.openingFloat || 20000) + cashBalance).toLocaleString()} {currency}
                    </span>
                  </div>
                </div>

                {/* Physical Count Input */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
                  <label className="block text-slate-200 font-bold">
                    Contagem Física de Numerário (Notas + Moedas):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      value={countedCash}
                      onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
                    />
                    <span className="font-bold text-slate-400">{currency}</span>
                  </div>

                  {/* Difference badge */}
                  {(() => {
                    const expected = (activeShift?.openingFloat || 20000) + cashBalance;
                    const diff = countedCash - expected;
                    if (Math.abs(diff) < 0.01) {
                      return (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs pt-1 font-sans">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Caixa Certificado (Diferença: 0.00 {currency})</span>
                        </div>
                      );
                    }
                    if (diff < 0) {
                      return (
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs pt-1 font-sans">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Quebra de Caixa (Défice): {diff.toLocaleString()} {currency}</span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs pt-1 font-sans">
                        <Coins className="w-4 h-4" />
                        <span>Sobra de Caixa (Superavit): +{diff.toLocaleString()} {currency}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Justification & Adjustment */}
                {Math.abs(countedCash - ((activeShift?.openingFloat || 20000) + cashBalance)) > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2">
                    <label className="block text-amber-300 font-bold font-sans">
                      Justificação Obrigatória para Ajuste de Caixa:
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Indique a causa da diferença de caixa..."
                      value={shiftCloseJustification}
                      onChange={(e) => setShiftCloseJustification(e.target.value)}
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-lg p-2 text-white font-sans text-xs focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 mb-1 font-sans">Observações do Turno:</label>
                  <input
                    type="text"
                    placeholder="Ex: Turno decorrido normalmente..."
                    value={shiftCloseNotes}
                    onChange={(e) => setShiftCloseNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 font-sans">
                  <button
                    type="button"
                    onClick={() => setShowShiftModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confirmar Fecho de Turno</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ABERTURA DE TURNO */}
      {/* ======================================================== */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-5 space-y-4 text-xs font-sans">
            <div className="bg-slate-950 p-3 -m-5 mb-0 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white uppercase flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-400" />
                Abertura de Novo Turno de Caixa
              </h3>
              <button onClick={() => setShowOpenShiftModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShiftOpenSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Fundo de Maneio / Troco Inicial ({currency}) <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newOpeningFloat}
                  onChange={(e) => setNewOpeningFloat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operador Responsável:</label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (${currentUser.role})`}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-slate-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notas de Abertura:</label>
                <input
                  type="text"
                  placeholder="Ex: Turno da manhã, terminal POS 01..."
                  value={openShiftNotes}
                  onChange={(e) => setOpenShiftNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Abrir Turno</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
