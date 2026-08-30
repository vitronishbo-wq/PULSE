import React, { useState } from 'react';
import {
  CreditCard,
  Calculator,
  FileText,
  DollarSign,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Download,
  Plus,
} from 'lucide-react';
import { BusinessSegment, TenantProfile, User, ModuleId } from '../../types/pulse';
import { PlatformInvoice, PricingMatrixRule } from '../../types/platform';
import { initialPlatformInvoices, initialPricingMatrix } from '../../data/platformSeedData';
import { PricingEngine } from '../../engines/PricingEngine';

interface AdminBillingSectionProps {
  leafId: string;
  tenants: TenantProfile[];
  currentUser: User;
  onRefresh: () => void;
}

export const AdminBillingSection: React.FC<AdminBillingSectionProps> = ({
  leafId,
  tenants,
  currentUser,
  onRefresh,
}) => {
  const pricingEngine = PricingEngine.getInstance();

  const [invoices, setInvoices] = useState<PlatformInvoice[]>(initialPlatformInvoices);
  const [pricingRules, setPricingRules] = useState<PricingMatrixRule[]>(initialPricingMatrix);

  // Subscription calculator state
  const [simSegment, setSimSegment] = useState<BusinessSegment>('RESTAURANT_BAR');
  const [simCycle, setSimCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL'>('ANNUAL');
  const [simModules, setSimModules] = useState<ModuleId[]>(['POS', 'STOCK', 'KDS_TABLES', 'REFERENCES']);
  const [selectedInvoice, setSelectedInvoice] = useState<PlatformInvoice | null>(null);

  const calculatedQuote = pricingEngine.calculateSubscription({
    segment: simSegment,
    selectedModules: simModules,
    billingCycle: simCycle,
  });

  const toggleSimModule = (mod: ModuleId) => {
    setSimModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleMarkAsPaid = (invId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invId
          ? {
              ...inv,
              status: 'PAID',
              paidAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
            }
          : inv
      )
    );
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: PRICING MATRIX */}
      {leafId === 'pricing_matrix' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Matriz de Preços da Plataforma por Segmento
              </h3>
              <p className="text-[11px] text-slate-400">Mensalidades base, descontos por período e taxa de IVA 14%</p>
            </div>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Segmento de Negócio</th>
                  <th className="py-2.5 px-3">Base Mensal</th>
                  <th className="py-2.5 px-3">Desconto Trimestral</th>
                  <th className="py-2.5 px-3">Desconto Anual</th>
                  <th className="py-2.5 px-3">IVA Aplicável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {pricingRules.map((rule) => (
                  <tr key={rule.segment} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-bold text-white">{rule.segmentName}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">{rule.baseMonthly.toLocaleString()} Kz/mês</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-semibold">-{rule.quarterlyDiscountPct}%</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">-{rule.annualDiscountPct}%</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{rule.taxRatePct}% (AGT Padrão)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LEAF: SUBSCRIPTION BILLING (CALCULATOR) */}
      {leafId === 'subscription_billing' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Motor de Cobrança & Simulador de Subscrição em Tempo Real
              </h3>
              <p className="text-[11px] text-slate-400">Simulação instantânea com cálculo de descontos e impostos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#252526] border border-[#3c3c3c] rounded-lg p-4 space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                  1. Segmento de Atividade
                </label>
                <select
                  value={simSegment}
                  onChange={(e) => setSimSegment(e.target.value as BusinessSegment)}
                  className="w-full bg-[#1e1e1e] border border-[#333333] rounded px-3 py-1.5 text-white text-xs"
                >
                  <option value="RESTAURANT_BAR">Restaurante, Bar & Cafetaria</option>
                  <option value="PHARMACY">Farmácia & Saúde</option>
                  <option value="RETAIL_CLOTHING">Vestuário & Moda</option>
                  <option value="SERVICES">Prestação de Serviços & Consultoria</option>
                  <option value="GENERAL_RETAIL">Retalho Geral & Supermercado</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                  2. Ciclo de Cobrança
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { c: 'MONTHLY' as const, label: 'Mensal' },
                    { c: 'QUARTERLY' as const, label: 'Trimestral (-5%)' },
                    { c: 'ANNUAL' as const, label: 'Anual (-15%)' },
                  ].map((item) => (
                    <button
                      key={item.c}
                      onClick={() => setSimCycle(item.c)}
                      className={`py-1.5 rounded text-[11px] font-bold border transition-colors ${
                        simCycle === item.c
                          ? 'bg-[#007acc] text-white border-[#007acc]'
                          : 'bg-[#1e1e1e] text-slate-300 border-[#333333]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                  3. Módulos & Add-ons Selecionados
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['POS', 'STOCK', 'KDS_TABLES', 'BATCHES_RX', 'BARCODE', 'SCALE', 'RH', 'ACCOUNTING', 'REFERENCES'] as ModuleId[]).map(
                    (mod) => {
                      const isSel = simModules.includes(mod);
                      return (
                        <button
                          key={mod}
                          onClick={() => toggleSimModule(mod)}
                          className={`p-1.5 rounded text-[10px] text-left border transition-colors flex items-center justify-between ${
                            isSel
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-[#1e1e1e] border-[#333333] text-slate-400'
                          }`}
                        >
                          <span>{mod}</span>
                          <span>{isSel ? '✓' : '+'}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Quote Summary Output */}
            <div className="bg-[#1c1c1c] border border-[#2d2d2d] rounded-lg p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold border-b border-[#2d2d2d] pb-1">
                  Resumo da Proposta de Cobrança (Orçamento)
                </div>

                <div className="space-y-2 mt-3 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal Bruto ({simCycle}):</span>
                    <span className="font-mono">{calculatedQuote.subtotal.toLocaleString()} Kz</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto Comercial ({calculatedQuote.cycleDiscountPercent}%):</span>
                    <span className="font-mono">-{calculatedQuote.cycleDiscountAmount.toLocaleString()} Kz</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Imposto de Valor Acrescentado (IVA {calculatedQuote.taxRatePercent}%):</span>
                    <span className="font-mono">{calculatedQuote.taxAmount.toLocaleString()} Kz</span>
                  </div>
                  <div className="border-t border-[#333333] pt-2 flex justify-between items-center">
                    <span className="font-bold text-white text-sm">TOTAL LIQUIDAÇÃO:</span>
                    <span className="font-bold text-amber-400 text-base font-mono">
                      {calculatedQuote.totalPayable.toLocaleString()} Kz
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-[#252526] border border-[#3c3c3c] rounded text-[10px] text-slate-400 space-y-1">
                <div className="text-white font-bold">Instruções de Pagamento EMIS:</div>
                <div>Entidade: <strong className="text-amber-300">00145</strong> (PULSE OS PLATFORM)</div>
                <div>Referência Simulada: <strong className="text-sky-300">928 301 442</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. LEAF: INVOICES */}
      {leafId === 'invoices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Faturas Emitidas aos Tenants
              </h3>
              <p className="text-[11px] text-slate-400">Documentos de faturação de subscrição com referências EMIS</p>
            </div>
            <span className="text-xs text-slate-300 font-mono bg-[#252526] px-2 py-0.5 rounded border border-[#3c3c3c]">
              {invoices.length} faturas
            </span>
          </div>

          <div className="border border-[#2d2d2d] rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2d2d2d] bg-[#252526] text-slate-400 text-[10px] uppercase font-semibold">
                  <th className="py-2.5 px-3">Nº Fatura</th>
                  <th className="py-2.5 px-3">Organização & NIF</th>
                  <th className="py-2.5 px-3">Ciclo</th>
                  <th className="py-2.5 px-3">Total (Kz)</th>
                  <th className="py-2.5 px-3">Meio / Referência</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d2d]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#252526]">
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-400">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white">{inv.tenantName}</div>
                      <div className="text-[10px] text-slate-400">NIF: {inv.tenantTaxId}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">{inv.billingCycle}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold font-mono">
                      {inv.total.toLocaleString()} {inv.currency}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                      <div>{inv.paymentMethod}</div>
                      {inv.paymentRef && (
                        <div className="text-[10px] text-sky-400 font-mono">{inv.paymentRef}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {inv.status === 'PENDING' && (
                        <button
                          onClick={() => handleMarkAsPaid(inv.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Liquidar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. LEAF: PAYMENT STATUS */}
      {leafId === 'payment_status' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Monitor de Cobrança & Alertas de Vencimento
              </h3>
              <p className="text-[11px] text-slate-400">Controlo automático de faturas pendentes e notificações</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Liquidadas Este Mês</div>
              <div className="text-xl font-bold text-white">3 Faturas</div>
              <div className="text-[11px] text-slate-400">372.780 Kz arrecadados</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Pendentes de Pagamento</div>
              <div className="text-xl font-bold text-amber-300">1 Fatura</div>
              <div className="text-[11px] text-slate-400">29.241 Kz a vencer em 31/08</div>
            </div>
            <div className="bg-[#252526] border border-[#3c3c3c] p-3.5 rounded space-y-1">
              <div className="text-[10px] text-rose-400 font-bold uppercase">Em Atraso (Vencidas)</div>
              <div className="text-xl font-bold text-white">0 Faturas</div>
              <div className="text-[11px] text-slate-400">Taxa de inadimplência: 0.0%</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. LEAF: BILLING HISTORY */}
      {leafId === 'billing_history' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Histórico & Auditoria de Faturação
              </h3>
              <p className="text-[11px] text-slate-400">Rastreabilidade completa de todas as cobranças emitidas</p>
            </div>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-lg p-3 space-y-2">
            <div className="text-[11px] text-slate-300 font-bold">Últimos Eventos de Faturação:</div>
            <div className="space-y-1.5">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-2 bg-[#252526] border border-[#333333] rounded flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-white">{inv.invoiceNumber}</span>
                    <span className="text-slate-400">• {inv.tenantName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-mono font-bold">{inv.total.toLocaleString()} Kz</span>
                    <span className="text-[10px] text-slate-400">{inv.issuedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
