import React, { useState } from 'react';
import {
  Landmark,
  CreditCard,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCw,
  Search,
  Check,
  X,
  Send,
  Building2,
  DollarSign,
} from 'lucide-react';
import { TenantProfile, User } from '../../types/pulse';
import {
  PaymentTransaction,
  TenantSettlement,
  ReconciliationEntry,
} from '../../types/platform';
import {
  initialPaymentTransactions,
  initialTenantSettlements,
  initialReconciliationEntries,
} from '../../data/platformSeedData';

interface AdminSettlementsSectionProps {
  leafId: string;
  tenants: TenantProfile[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminSettlementsSection: React.FC<AdminSettlementsSectionProps> = ({
  leafId,
  tenants,
  currentUser,
  onRefresh,
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(initialPaymentTransactions);
  const [settlements, setSettlements] = useState<TenantSettlement[]>(initialTenantSettlements);
  const [reconciliations, setReconciliations] = useState<ReconciliationEntry[]>(initialReconciliationEntries);
  const [reconcileFeedback, setReconcileFeedback] = useState('');

  const handleApprovePayout = (stlId: string) => {
    setSettlements((prev) =>
      prev.map((stl) =>
        stl.id === stlId
          ? {
              ...stl,
              status: 'SETTLED',
              proofDocRef: `TRF-BAI-${Math.floor(10000000 + Math.random() * 90000000)}`,
            }
          : stl
      )
    );
  };

  const handleRunAutoReconciliation = () => {
    setReconciliations((prev) =>
      prev.map((rec) => ({
        ...rec,
        status: 'MATCHED',
        discrepancy: 0,
        statementAmount: rec.systemAmount,
        notes: 'Reconciliação automática concluída com correspondência exata.',
      }))
    );
    setReconcileFeedback('Reconciliação de lote bancário EMIS concluída com 100% de matching.');
    setTimeout(() => setReconcileFeedback(''), 4000);
  };

  const totalGrossRevenue = transactions.reduce((acc, t) => acc + t.grossAmount, 0);
  const totalPlatformFees = transactions.reduce((acc, t) => acc + t.platformFeeAmount, 0);
  const totalNetSettled = transactions.reduce((acc, t) => acc + t.netSettlementAmount, 0);

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: PAYMENT METHODS */}
      {leafId === 'payment_methods' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Meios de Pagamento Suportados & Tarifário da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Gateways integrados para cobrança de subscrições e liquidação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-xs">EMIS Multicaixa Ref</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">ATIVO</span>
              </div>
              <div className="text-amber-400 font-bold text-sm">2.0% por transação</div>
              <div className="text-[10px] text-slate-400">Entidade 00145. Liquidação D+1 automática às 09:00.</div>
            </div>

            <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-xs">Multicaixa Express</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">ATIVO</span>
              </div>
              <div className="text-amber-400 font-bold text-sm">2.2% por transação</div>
              <div className="text-[10px] text-slate-400">Notificação Push no telemóvel do cliente em tempo real.</div>
            </div>

            <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-xs">Transferência Bancária</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">ATIVO</span>
              </div>
              <div className="text-emerald-400 font-bold text-sm">0.0% (Grátis)</div>
              <div className="text-[10px] text-slate-400">Validação manual via upload de comprovativo bancário.</div>
            </div>

            <div className="bg-[#252526] border border-[#3c3c3c] rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white text-xs">TPA Físico / Cartão</span>
                <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">INTEGRADO</span>
              </div>
              <div className="text-amber-400 font-bold text-sm">1.5% taxa interbancária</div>
              <div className="text-[10px] text-slate-400">Terminal de Pagamento Automático conectado via USB/BT.</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. LEAF: PAYMENT TRANSACTIONS */}
      {leafId === 'payment_transactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Ledger de Transações de Pagamento da Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Transações EMIS de subscrições e serviços dos tenants</p>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              Volume Total: {totalGrossRevenue.toLocaleString()} Kz
            </span>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">ID Transação</th>
                  <th className="py-2.5 px-3">Organização</th>
                  <th className="py-2.5 px-3">Entidade & Referência</th>
                  <th className="py-2.5 px-3">Valor Bruto</th>
                  <th className="py-2.5 px-3">Comissão Plataforma</th>
                  <th className="py-2.5 px-3">Valor Líquido</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{tx.id}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{tx.tenantName}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                      Ent: <span className="text-amber-400 font-bold">{tx.emisEntity}</span> • Ref: {tx.emisReference}
                    </td>
                    <td className="py-2.5 px-3 text-white font-mono font-bold">{tx.grossAmount.toLocaleString()} Kz</td>
                    <td className="py-2.5 px-3 text-rose-400 font-mono">
                      -{tx.platformFeeAmount.toLocaleString()} Kz ({tx.platformFeePercent}%)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono font-bold">
                      {tx.netSettlementAmount.toLocaleString()} Kz
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : tx.status === 'RECONCILED'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : tx.status === 'PAID'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. LEAF: SETTLEMENTS & PAYOUTS */}
      {(leafId === 'settlements' || leafId === 'tenant_payouts') && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Landmark className="w-4 h-4 text-emerald-400" />
                Liquidação & Payouts Bancários para os Tenants
              </h3>
              <p className="text-[11px] text-slate-400">Transferências interbancárias para contas IBAN verificadas</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Lote de Payout</th>
                  <th className="py-2.5 px-3">Organização & Banco</th>
                  <th className="py-2.5 px-3">Conta IBAN</th>
                  <th className="py-2.5 px-3">Bruto / Comissões</th>
                  <th className="py-2.5 px-3">Líquido a Transferir</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {settlements.map((stl) => (
                  <tr key={stl.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{stl.settlementBatchRef}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{stl.tenantName}</div>
                      <div className="text-[10px] text-slate-400">{stl.bankName}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{stl.iban}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                      <div>{stl.totalGross.toLocaleString()} Kz</div>
                      <div className="text-[10px] text-rose-400">-{stl.totalPlatformFees.toLocaleString()} Kz fee</div>
                    </td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono font-bold text-xs">
                      {stl.netPayoutAmount.toLocaleString()} Kz
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stl.status === 'SETTLED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : stl.status === 'PROCESSING'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {stl.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {stl.status !== 'SETTLED' ? (
                        <button
                          onClick={() => handleApprovePayout(stl.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Aprovar Payout
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">{stl.proofDocRef}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LEAF: PLATFORM FEES */}
      {leafId === 'platform_fees' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Percent className="w-4 h-4 text-amber-400" />
                Receita de Comissões & Taxas da Plataforma (Platform Revenue)
              </h3>
              <p className="text-[11px] text-slate-400">Margem líquida da operadora sobre transações processadas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Volume Total Processado</div>
              <div className="text-xl font-bold text-white font-mono">{totalGrossRevenue.toLocaleString()} Kz</div>
              <div className="text-[10px] text-slate-400">{transactions.length} transações</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Comissões Plataforma (Fees)</div>
              <div className="text-xl font-bold text-amber-300 font-mono">{totalPlatformFees.toLocaleString()} Kz</div>
              <div className="text-[10px] text-slate-400">Média ponderada: 2.01%</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Líquido Pago aos Tenants</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{totalNetSettled.toLocaleString()} Kz</div>
              <div className="text-[10px] text-slate-400">97.99% do volume bruto</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEAF: RECONCILIATION */}
      {leafId === 'reconciliation' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                Motor de Reconciliação Bancária & Matching EMIS
              </h3>
              <p className="text-[11px] text-slate-400">Cruzamento de extrato bancário com ledger de pagamentos</p>
            </div>
            <button
              onClick={handleRunAutoReconciliation}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Executar Auto-Reconciliação
            </button>
          </div>

          {reconcileFeedback && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{reconcileFeedback}</span>
            </div>
          )}

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Data Extrato</th>
                  <th className="py-2.5 px-3">Ref. Bancária / EMIS</th>
                  <th className="py-2.5 px-3">Valor Sistema</th>
                  <th className="py-2.5 px-3">Valor Extrato</th>
                  <th className="py-2.5 px-3">Discrepância</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Notas de Matching</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {reconciliations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{rec.statementDate}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-white font-bold">{rec.bankReference}</div>
                      <div className="text-[10px] text-slate-400 font-mono">EMIS: {rec.emisReference}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{rec.systemAmount.toLocaleString()} Kz</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{rec.statementAmount.toLocaleString()} Kz</td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      {rec.discrepancy === 0 ? (
                        <span className="text-emerald-400">0 Kz</span>
                      ) : (
                        <span className="text-rose-400">-{rec.discrepancy.toLocaleString()} Kz</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === 'MATCHED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[10px]">{rec.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
