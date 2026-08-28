import React from 'react';
import { FormattedReceiptPayload } from '../../types/pulse';

interface Thermal58Props {
  payload: FormattedReceiptPayload;
}

export const Thermal58Template: React.FC<Thermal58Props> = ({ payload }) => {
  const { tenant, customer, totals, lines, fiscal, taxes } = payload;
  const currency = tenant.currency;

  return (
    <div
      id="receipt-thermal-58"
      className="w-[220px] max-w-[220px] bg-white text-black font-mono text-[10px] leading-tight p-2 select-text mx-auto border border-dashed border-slate-300 print:border-none print:p-0 print:m-0 print:w-[58mm] print:max-w-[58mm]"
      style={{ fontFamily: '"Courier New", Courier, monospace' }}
    >
      {/* HEADER: ESTABLISHMENT */}
      <div className="text-center pb-1 mb-1 border-b border-black border-dashed">
        <div className="font-bold text-[11px] uppercase tracking-tighter truncate">
          {tenant.tradeName}
        </div>
        <div className="text-[9px] truncate">{tenant.name}</div>
        <div className="text-[9px]">NIF: {tenant.taxId}</div>
        {tenant.address && (
          <div className="text-[8px] text-gray-700 truncate">{tenant.address}</div>
        )}
      </div>

      {/* DOCUMENT METADATA */}
      <div className="text-[9px] pb-1 mb-1 border-b border-black border-dashed space-y-0.5">
        <div className="font-bold text-center text-[10px] uppercase">
          {payload.docType === 'RECEIPT'
            ? 'FATURA-RECIBO'
            : payload.docType === 'INVOICE'
            ? 'FATURA'
            : 'VENDA A DINHEIRO'}
        </div>
        <div className="flex justify-between">
          <span>Doc:</span>
          <span className="font-bold">{payload.docNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Data:</span>
          <span>
            {payload.date} {payload.time}
          </span>
        </div>
        <div className="flex justify-between truncate">
          <span>Cli:</span>
          <span className="truncate max-w-[150px] font-bold">{customer.name}</span>
        </div>
        <div className="flex justify-between">
          <span>NIF:</span>
          <span>{customer.taxId}</span>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div className="pb-1 mb-1 border-b border-black border-dashed">
        <div className="grid grid-cols-12 font-bold text-[9px] pb-0.5 border-b border-gray-300">
          <span className="col-span-6">Desc</span>
          <span className="col-span-2 text-center">Qtd</span>
          <span className="col-span-4 text-right">Total</span>
        </div>
        <div className="space-y-1 pt-1">
          {lines.map((l) => (
            <div key={l.idx} className="text-[9px]">
              <div className="truncate font-semibold">{l.description}</div>
              <div className="flex justify-between text-[8px] text-gray-700 pl-1">
                <span>
                  {l.qty} x {l.unitPrice.toLocaleString()} {currency}
                  {l.discountPercent > 0 && ` (-${l.discountPercent}%)`}
                </span>
                <span className="font-bold text-black text-[9px]">
                  {l.grossTotal.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TOTALS */}
      <div className="space-y-0.5 pb-1 mb-1 border-b border-black border-dashed text-[9px]">
        <div className="flex justify-between text-gray-800">
          <span>Subtotal:</span>
          <span>{totals.subtotalNet.toLocaleString()} {currency}</span>
        </div>
        <div className="flex justify-between text-gray-800">
          <span>Total IVA:</span>
          <span>{totals.totalTax.toLocaleString()} {currency}</span>
        </div>
        {totals.withholdingTax > 0 && (
          <div className="flex justify-between text-gray-800">
            <span>Retenção (-6.5%):</span>
            <span>-{totals.withholdingTax.toLocaleString()} {currency}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-[11px] pt-0.5 border-t border-black">
          <span>TOTAL:</span>
          <span>{totals.finalPayable.toLocaleString()} {currency}</span>
        </div>
      </div>

      {/* PAYMENT & CHANGE */}
      <div className="text-[9px] pb-1 mb-1 border-b border-black border-dashed space-y-0.5">
        <div className="flex justify-between">
          <span>Meio:</span>
          <span className="font-bold">{totals.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Entregue:</span>
          <span>{totals.paidAmount.toLocaleString()} {currency}</span>
        </div>
        {totals.changeAmount > 0 && (
          <div className="flex justify-between font-bold">
            <span>Troco:</span>
            <span>{totals.changeAmount.toLocaleString()} {currency}</span>
          </div>
        )}
      </div>

      {/* FISCAL HASH & AGT NOTICE */}
      <div className="text-[8px] text-center space-y-0.5 text-gray-800">
        <div className="font-bold">{fiscal.legalNotice}</div>
        <div className="text-[7px] text-gray-500 font-mono">
          Operador: {payload.operator} • Term: {payload.terminal}
        </div>
        <div className="text-[8px] pt-1 font-bold">*** Obrigado pela preferência ***</div>
      </div>
    </div>
  );
};
