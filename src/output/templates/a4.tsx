import React from 'react';
import { FormattedReceiptPayload } from '../../types/pulse';

interface A4TemplateProps {
  payload: FormattedReceiptPayload;
}

export const A4Template: React.FC<A4TemplateProps> = ({ payload }) => {
  const { tenant, customer, totals, lines, fiscal, taxes } = payload;
  const currency = tenant.currency;

  return (
    <div
      id="receipt-a4"
      className="w-full max-w-[700px] bg-white text-slate-900 font-sans text-xs p-8 mx-auto border border-slate-300 shadow-sm print:border-none print:shadow-none print:p-6 print:max-w-none print:w-full"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
            {tenant.tradeName}
          </h1>
          <p className="text-sm font-semibold text-slate-700">{tenant.name}</p>
          <p className="text-xs text-slate-600">NIF: <span className="font-mono font-bold text-slate-800">{tenant.taxId}</span></p>
          {tenant.address && <p className="text-xs text-slate-600">{tenant.address}</p>}
          {tenant.phone && <p className="text-xs text-slate-600">Tel: {tenant.phone}</p>}
          {tenant.email && <p className="text-xs text-slate-600">Email: {tenant.email}</p>}
        </div>

        <div className="text-right">
          <div className="inline-block bg-slate-100 border border-slate-300 rounded px-3 py-1 mb-2">
            <span className="text-xs font-bold font-mono uppercase text-slate-900">
              {payload.docType === 'RECEIPT'
                ? 'FATURA-RECIBO'
                : payload.docType === 'INVOICE'
                ? 'FATURA'
                : 'VENDA A DINHEIRO'}
            </span>
          </div>
          <div className="font-mono text-base font-bold text-slate-950">
            {payload.docNumber}
          </div>
          <div className="text-xs text-slate-600 font-mono">
            Data: {payload.date} {payload.time}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Original • Via Cliente
          </div>
        </div>
      </div>

      {/* CUSTOMER INFO BOX */}
      <div className="bg-slate-50 border border-slate-200 rounded p-4 mb-6">
        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">
          Exmo.(s) Sr.(s) / Dados do Cliente
        </div>
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-slate-900">{customer.name}</div>
            <div className="text-xs text-slate-600 font-mono">NIF: {customer.taxId}</div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Forma de Liquidação: <strong className="text-slate-900 font-mono">{totals.paymentMethod}</strong></div>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="mb-6">
        <table className="w-full text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-semibold">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2">Descrição dos Artigos / Serviços</th>
              <th className="py-2 px-2 text-center w-16">Qtd</th>
              <th className="py-2 px-2 text-right w-24">P. Unitário</th>
              <th className="py-2 px-2 text-center w-16">IVA %</th>
              <th className="py-2 px-2 text-right w-28">Total Líquido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-xs">
            {lines.map((l) => (
              <tr key={l.idx}>
                <td className="py-2 px-2 text-center text-slate-500 text-[11px]">{l.idx}</td>
                <td className="py-2 px-2 font-sans font-medium text-slate-900">
                  {l.description}
                  {l.discountPercent > 0 && (
                    <span className="text-[11px] text-amber-700 block font-mono">
                      Desconto Comercial: -{l.discountPercent}%
                    </span>
                  )}
                </td>
                <td className="py-2 px-2 text-center">{l.qty}</td>
                <td className="py-2 px-2 text-right">{l.unitPrice.toLocaleString()}</td>
                <td className="py-2 px-2 text-center">{l.taxRate}%</td>
                <td className="py-2 px-2 text-right font-bold text-slate-950">
                  {l.grossTotal.toLocaleString()} {currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS & TAX BREAKDOWN */}
      <div className="grid grid-cols-12 gap-6 border-t border-slate-300 pt-4 mb-6">
        {/* Left: Tax resume */}
        <div className="col-span-7 space-y-2">
          <div className="text-[11px] font-bold text-slate-700 uppercase">
            Quadro Resumo de Impostos
          </div>
          <table className="w-full text-xs font-mono border border-slate-200">
            <thead className="bg-slate-100 text-[10px] text-slate-600">
              <tr>
                <th className="p-1 text-left">Taxa</th>
                <th className="p-1 text-right">Incidência</th>
                <th className="p-1 text-right">Valor Imposto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[11px]">
              {taxes.map((t, idx) => (
                <tr key={idx}>
                  <td className="p-1 font-bold">IVA {t.taxRate}%</td>
                  <td className="p-1 text-right">{t.baseAmount.toLocaleString()} {currency}</td>
                  <td className="p-1 text-right font-bold">{t.taxAmount.toLocaleString()} {currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right: Totals calculation */}
        <div className="col-span-5 space-y-1.5 font-mono text-xs text-right">
          <div className="flex justify-between text-slate-600">
            <span>Total Líquido:</span>
            <span>{totals.subtotalNet.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Total Imposto (IVA):</span>
            <span>{totals.totalTax.toLocaleString()} {currency}</span>
          </div>
          {totals.withholdingTax > 0 && (
            <div className="flex justify-between text-purple-700 font-bold">
              <span>Retenção na Fonte (-6.5%):</span>
              <span>-{totals.withholdingTax.toLocaleString()} {currency}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-950 border-t border-slate-400 pt-1">
            <span>TOTAL FINAL:</span>
            <span className="text-emerald-700">{totals.finalPayable.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 pt-1">
            <span>Valor Pago ({totals.paymentMethod}):</span>
            <span>{totals.paidAmount.toLocaleString()} {currency}</span>
          </div>
          {totals.changeAmount > 0 && (
            <div className="flex justify-between text-[11px] text-slate-700 font-bold">
              <span>Troco:</span>
              <span>{totals.changeAmount.toLocaleString()} {currency}</span>
            </div>
          )}
        </div>
      </div>

      {/* FISCAL FOOTER */}
      <div className="border-t border-slate-300 pt-4 text-center font-mono text-[10px] text-slate-600 space-y-1">
        <div className="font-bold text-slate-900">{fiscal.legalNotice}</div>
        <div className="text-[9px] text-slate-500">
          Assinatura Digital (Hash): {fiscal.fullHash}
        </div>
        <div className="text-[9px] text-slate-400">
          Documento emitido por PULSE.OS Engine • Operador: {payload.operator} • Terminal: {payload.terminal}
        </div>
      </div>
    </div>
  );
};
