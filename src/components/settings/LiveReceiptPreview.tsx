import React, { useState } from 'react';
import {
  Printer,
  Receipt,
  QrCode,
  ShieldCheck,
  Building2,
  CheckCircle2,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { TenantProfile, ReceiptFormat } from '../../types/pulse';
import { PrinterConfigData } from '../../types/settings';

interface LiveReceiptPreviewProps {
  tenant: TenantProfile;
  printerConfig: PrinterConfigData;
  currency?: string;
  onTriggerTestPrint?: () => void;
}

export const LiveReceiptPreview: React.FC<LiveReceiptPreviewProps> = ({
  tenant,
  printerConfig,
  currency = 'Kz',
  onTriggerTestPrint,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const format = printerConfig.primaryFormat;
  const isA4 = format === 'A4';
  const is58 = format === 'THERMAL_58';

  const handleTestPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      setPrintSuccess(true);
      if (onTriggerTestPrint) onTriggerTestPrint();
      setTimeout(() => setPrintSuccess(false), 3500);
    }, 1200);
  };

  const sampleHash = 'g4K9';
  const sampleCertNumber = tenant.fiscalCertNumber || 'AGT/CERT/2026/0491';

  return (
    <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase font-mono">
              Pré-visualização do Talão Fiscal
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              Formato: {format === 'THERMAL_80' ? 'Térmica 80mm' : is58 ? 'Térmica 58mm' : 'Folha A4 / PDF'} •{' '}
              {printerConfig.connectionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handleTestPrint}
          disabled={isPrinting}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            isPrinting
              ? 'bg-amber-500 text-slate-950 animate-pulse'
              : printSuccess
              ? 'bg-emerald-500 text-slate-950'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{isPrinting ? 'A imprimir teste...' : printSuccess ? '✓ Impresso!' : 'Testar Impressão'}</span>
        </button>
      </div>

      {/* Preview Paper Simulation */}
      <div className="flex-1 overflow-y-auto py-4 flex justify-center items-start bg-[#0a0a0c] rounded-lg mt-3 p-3 border border-[#1f1f23] max-h-[560px]">
        <div
          className={`bg-white text-slate-950 shadow-2xl rounded-sm p-4 font-mono transition-all duration-300 ${
            isA4
              ? 'w-full max-w-[420px] text-[11px] leading-relaxed border border-slate-300'
              : is58
              ? 'w-[260px] text-[9.5px] leading-tight border-t-4 border-emerald-500'
              : 'w-[320px] text-[10px] leading-tight border-t-4 border-emerald-500'
          }`}
        >
          {/* Header */}
          <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-0.5">
            <div className="font-extrabold text-[12px] uppercase tracking-tight text-slate-950">
              {tenant.tradeName || tenant.name}
            </div>
            <div className="text-[10px] text-slate-700 font-semibold">{tenant.name}</div>
            <div className="text-[9.5px] text-slate-600">NIF: {tenant.taxId}</div>
            <div className="text-[9px] text-slate-600 truncate">{tenant.address || 'Avenida 4 de Fevereiro, Marginal'}</div>
            <div className="text-[9px] text-slate-600">{tenant.city} • Tel: {tenant.phone || '+244 923 000 000'}</div>
            {printerConfig.customHeaderNote && (
              <div className="text-[9px] text-emerald-800 italic pt-0.5">{printerConfig.customHeaderNote}</div>
            )}
          </div>

          {/* Document metadata */}
          <div className="py-2 border-b border-dashed border-slate-400 text-[9.5px] space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>FATURA-RECIBO</span>
              <span>FR 2026/A/108</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[9px]">
              <span>Data: 2026-08-29 16:30</span>
              <span>Moeda: {currency}</span>
            </div>
            {printerConfig.showOperatorName && (
              <div className="flex justify-between text-slate-600 text-[9px]">
                <span>Operador: João Manuel (POS 01)</span>
                <span>Mesa: 04</span>
              </div>
            )}
            <div className="pt-1 border-t border-slate-200 mt-1">
              <div className="font-semibold text-slate-800">CLIENTE: Consumidor Final</div>
              <div className="text-[9px] text-slate-600">NIF: 999999999</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2 border-b border-dashed border-slate-400">
            <div className="flex justify-between text-[9px] font-bold pb-1 text-slate-700 border-b border-slate-200">
              <span>ARTIGO / QTD x PREÇO</span>
              <span>TOTAL</span>
            </div>

            <div className="space-y-1.5 pt-1.5">
              <div>
                <div className="font-semibold text-slate-900">Bife de Lombo na Grelha</div>
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>2 x 12.500,00 (IVA 14%)</span>
                  <span className="font-bold text-slate-950">25.000,00</span>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-900">Água Mineral Natural 1.5L</div>
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>3 x 650,00 (IVA 14%)</span>
                  <span className="font-bold text-slate-950">1.950,00</span>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-900">Sobremesa Petit Gâteau</div>
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>1 x 3.500,00 (IVA 14%)</span>
                  <span className="font-bold text-slate-950">3.500,00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Taxes Table */}
          <div className="py-1.5 border-b border-dashed border-slate-400 text-[8.5px] space-y-0.5">
            <div className="flex justify-between font-bold text-slate-700">
              <span>TAXA</span>
              <span>INCIDÊNCIA</span>
              <span>VALOR IVA</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>IVA Normal (14%)</span>
              <span>26.710,53</span>
              <span>3.739,47</span>
            </div>
          </div>

          {/* Totals */}
          <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5">
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>Total Ilíquido:</span>
              <span>26.710,53 {currency}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-600">
              <span>Total IVA:</span>
              <span>3.739,47 {currency}</span>
            </div>
            <div className="flex justify-between text-[11px] font-extrabold text-slate-950 pt-1 border-t border-slate-300">
              <span>TOTAL A PAGAR:</span>
              <span>30.450,00 {currency}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-700 pt-1 font-semibold">
              <span>MULTICAIXA / TPA:</span>
              <span>30.450,00 {currency}</span>
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>Troco Entregue:</span>
              <span>0,00 {currency}</span>
            </div>
          </div>

          {/* Fiscal Hash & Certification */}
          <div className="py-2 text-center space-y-1">
            {printerConfig.showAgtHash && (
              <div className="text-[8.5px] font-mono text-slate-700 border border-slate-300 p-1 rounded bg-slate-50">
                <span className="font-bold">{sampleHash}</span> - Processado por programa validado nº{' '}
                <span className="font-bold">{sampleCertNumber}</span> / AGT
              </div>
            )}

            {printerConfig.showQrCode && (
              <div className="py-1 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-slate-900 text-white rounded flex items-center justify-center p-1.5">
                  <QrCode className="w-12 h-12 text-white" />
                </div>
                <span className="text-[7.5px] text-slate-500 mt-0.5">Assinatura Digital AGT 2026</span>
              </div>
            )}

            {printerConfig.showBankIbans && (
              <div className="text-[8px] text-slate-600 border-t border-slate-200 pt-1 text-left space-y-0.5">
                <div className="font-bold">Dados Bancários / Transferência:</div>
                <div>BAI: AO06 0040.0000.1234.5678.9012.3</div>
                <div>BFA: AO06 0006.0000.9876.5432.1098.7</div>
              </div>
            )}

            {printerConfig.customFooterNote && (
              <div className="text-[8.5px] text-slate-700 italic pt-1">
                {printerConfig.customFooterNote}
              </div>
            )}

            <div className="text-[8px] text-slate-500 font-sans pt-1">
              Obrigado pela sua preferência! • Volte sempre
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
