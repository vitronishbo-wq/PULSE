import React from 'react';
import { FormattedReceiptPayload } from '../../types/pulse';

interface Thermal80Props {
  payload: FormattedReceiptPayload;
}

export const Thermal80Template: React.FC<Thermal80Props> = ({ payload }) => {
  const { tenant, customer, totals, lines, fiscal, taxes } = payload;
  const currency = tenant.currency;

  return (
    <div
      id="receipt-thermal-80"
      className="w-[290px] max-w-[290px] bg-white text-black font-mono text-[11px] leading-tight p-3 select-text mx-auto border border-dashed border-slate-300 print:border-none print:p-0 print:m-0 print:w-[80mm] print:max-w-[80mm]"
      style={{ fontFamily: '"Courier New", Courier, monospace' }}
    >
      {/* 1. HEADER: ESTABLISHMENT IDENTIFICATION */}
      <div className="text-center pb-2 mb-2 border-b border-black border-dashed">
        <div className="font-bold text-xs uppercase tracking-tight">
          {tenant.tradeName}
        </div>
        <div className="text-[10px] text-gray-800">{tenant.name}</div>
        <div className="text-[10px] font-semibold">NIF: {tenant.taxId}</div>
        {tenant.address && (
          <div className="text-[9px] text-gray-700">{tenant.address} - {tenant.city}</div>
        )}
        {tenant.phone && (
          <div className="text-[9px] text-gray-700">Tel: {tenant.phone}</div>
        )}
      </div>

      {/* 2. DOCUMENT CLASSIFICATION & METADATA */}
      <div className="text-[10px] pb-2 mb-2 border-b border-black border-dashed space-y-0.5">
        <div className="font-bold text-center text-xs uppercase tracking-wider">
          {payload.docType === 'RECEIPT'
            ? 'FATURA-RECIBO'
            : payload.docType === 'INVOICE'
            ? 'FATURA'
            : 'VENDA A DINHEIRO'}
        </div>
        <div className="flex justify-between">
          <span className="font-semibold">Nº Documento:</span>
          <span className="font-bold">{payload.docNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Data de Emissão:</span>
          <span>
            {payload.date} às {payload.time}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Cliente:</span>
          <span className="font-bold truncate max-w-[190px]">{customer.name}</span>
        </div>
        <div className="flex justify-between">
          <span>NIF Contribuinte:</span>
          <span>{customer.taxId}</span>
        </div>
      </div>

      {/* 3. ITEMS TABLE */}
      <div className="pb-2 mb-2 border-b border-black border-dashed">
        <div className="grid grid-cols-12 font-bold text-[10px] pb-1 border-b border-black">
          <span className="col-span-6">Artigo</span>
          <span className="col-span-2 text-center">Qtd</span>
          <span className="col-span-2 text-right">P.Unit</span>
          <span className="col-span-2 text-right">Total</span>
        </div>

        <div className="space-y-1 pt-1.5">
          {lines.map((l) => (
            <div key={l.idx} className="text-[10px]">
              <div className="truncate font-semibold">{l.description}</div>
              <div className="grid grid-cols-12 text-[9px] text-gray-800">
                <span className="col-span-6 text-gray-600 pl-1">
                  Taxa IVA: {l.taxRate}% {l.discountPercent > 0 && `(Desc -${l.discountPercent}%)`}
                </span>
                <span className="col-span-2 text-center">{l.qty}</span>
                <span className="col-span-2 text-right">{l.unitPrice.toLocaleString()}</span>
                <span className="col-span-2 text-right font-bold text-black text-[10px]">
                  {l.grossTotal.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TOTALS BREAKDOWN */}
      <div className="space-y-1 pb-2 mb-2 border-b border-black border-dashed text-[10px]">
        <div className="flex justify-between text-gray-800">
          <span>Incidência / Subtotal Líquido:</span>
          <span>{totals.subtotalNet.toLocaleString()} {currency}</span>
        </div>
        <div className="flex justify-between text-gray-800">
          <span>Total de Imposto (IVA):</span>
          <span>{totals.totalTax.toLocaleString()} {currency}</span>
        </div>
        {totals.withholdingTax > 0 && (
          <div className="flex justify-between font-bold text-gray-800">
            <span>Retenção na Fonte (-6.5%):</span>
            <span>-{totals.withholdingTax.toLocaleString()} {currency}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
          <span>TOTAL A PAGAR:</span>
          <span>{totals.finalPayable.toLocaleString()} {currency}</span>
        </div>
      </div>

      {/* 5. PAYMENT & SETTLEMENT */}
      <div className="text-[10px] pb-2 mb-2 border-b border-black border-dashed space-y-0.5">
        <div className="flex justify-between">
          <span className="font-semibold">Modo de Liquidação:</span>
          <span className="font-bold">{totals.paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Valor Entregue:</span>
          <span>{totals.paidAmount.toLocaleString()} {currency}</span>
        </div>
        {totals.changeAmount > 0 && (
          <div className="flex justify-between font-bold">
            <span>Troco:</span>
            <span>{totals.changeAmount.toLocaleString()} {currency}</span>
          </div>
        )}
      </div>

      {/* 6. TAX RESUME TABLE (AGT STANDARD) */}
      {taxes.length > 0 && (
        <div className="pb-2 mb-2 border-b border-black border-dashed text-[9px]">
          <div className="font-bold pb-0.5">Quadro Resumo de Impostos:</div>
          <div className="grid grid-cols-3 text-gray-700 border-b border-gray-300 pb-0.5">
            <span>Taxa</span>
            <span className="text-right">Incidência</span>
            <span className="text-right">Total IVA</span>
          </div>
          {taxes.map((t, idx) => (
            <div key={idx} className="grid grid-cols-3 pt-0.5 text-gray-800">
              <span>IVA {t.taxRate}%</span>
              <span className="text-right">{t.baseAmount.toLocaleString()} {currency}</span>
              <span className="text-right font-semibold">{t.taxAmount.toLocaleString()} {currency}</span>
            </div>
          ))}
        </div>
      )}

      {/* 7. FISCAL SIGNATURE & AGT CERTIFICATION */}
      <div className="text-[9px] text-center space-y-1 text-gray-800">
        <div className="font-bold text-[10px]">{fiscal.legalNotice}</div>
        <div className="text-[8px] text-gray-600 font-mono">
          Hash: {fiscal.fullHash}
        </div>
        <div className="text-[8px] text-gray-500 font-mono">
          Operador: {payload.operator} • Terminal: {payload.terminal}
        </div>
        <div className="text-[9px] pt-1 font-bold tracking-wider">
          OBRIGADO PELA PREFERÊNCIA
        </div>
      </div>
    </div>
  );
};
