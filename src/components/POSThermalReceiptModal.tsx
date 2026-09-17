import React, { useState } from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Copy,
  FileText,
  Clock,
  ShieldCheck,
  User,
  Building,
  Smartphone,
  Check,
} from 'lucide-react';
import { Document, TenantProfile, User as SystemUser, ReceiptFormat } from '../types/pulse';
import { PrintService } from '../output/PrintService';

interface POSThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  tenant?: TenantProfile;
  currentUser: SystemUser;
  currency: string;
}

export const POSThermalReceiptModal: React.FC<POSThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  tenant,
  currentUser,
  currency,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReceiptFormat>('THERMAL_80');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen || !doc) return null;

  const printService = PrintService.getInstance();
  const grossTotal = doc.grossAmount ?? (doc as any).total ?? 0;
  const netTotal = doc.netAmount ?? grossTotal;
  const taxTotal = doc.taxAmount ?? (grossTotal - netTotal);

  const handlePrint = async (format: ReceiptFormat = selectedFormat) => {
    if (!tenant) return;
    setIsPrinting(true);
    setFeedback(`A enviar para impressão (${format === 'THERMAL_80' ? '80mm' : format === 'THERMAL_58' ? '58mm' : 'A4'})...`);
    try {
      const res = await printService.print(doc, tenant, {
        format,
        operator: currentUser.name,
      });
      if (res.success) {
        setFeedback(`Talão emitido via ${res.method}!`);
      } else {
        setFeedback(res.message);
      }
    } catch (err: any) {
      setFeedback('Erro ao disparar impressão.');
    } finally {
      setIsPrinting(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleShare = async () => {
    if (!tenant) return;
    const res = await printService.share(doc, tenant, currentUser.name);
    setFeedback(res.message);
    if (res.method === 'CLIPBOARD') {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-[#14141a] border border-slate-700 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 text-xs flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <span>Talão Térmico Certificado</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  {doc.docType}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {doc.docNumber} • Emitido com Sucesso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="flex items-center justify-between bg-[#1b1b22] border border-slate-800 rounded-xl p-2 flex-shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-bold px-1">
            Largura / Formato:
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'THERMAL_80', label: 'Térmico 80mm' },
              { id: 'THERMAL_58', label: 'Térmico 58mm' },
              { id: 'A4', label: 'Folha A4' },
            ].map((fmt) => (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as ReceiptFormat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  selectedFormat === fmt.id
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Paper Receipt Simulation Preview */}
        <div className="flex-1 overflow-y-auto pr-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex justify-center">
          <div
            className={`bg-white text-slate-900 font-mono rounded shadow-xl p-4 transition-all ${
              selectedFormat === 'THERMAL_58'
                ? 'w-[280px] text-[10px]'
                : selectedFormat === 'A4'
                ? 'w-[420px] text-xs'
                : 'w-[320px] text-[11px]'
            }`}
          >
            {/* Header / Company */}
            <div className="text-center space-y-0.5 border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
              <div className="font-black text-sm uppercase tracking-wide">
                {tenant?.commercialName || tenant?.legalName || 'PULSE EMPRESA'}
              </div>
              <div className="text-[10px] text-slate-600">
                NIF: {tenant?.taxId || '5417000000'}
              </div>
              <div className="text-[10px] text-slate-600">
                {tenant?.address || 'Luanda, Angola'}
              </div>
              {tenant?.phone && (
                <div className="text-[10px] text-slate-600">Tel: {tenant.phone}</div>
              )}
            </div>

            {/* Document Info */}
            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>{doc.docType === 'RECEIPT' ? 'FATURA / RECIBO' : 'FATURA'}</span>
                <span>{doc.docNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Data: {doc.date || new Date().toISOString().split('T')[0]}</span>
                <span>Operador: {currentUser.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cliente: {doc.customerName || 'Consumidor Final'}</span>
                <span>NIF: {doc.customerTaxId || '999999999'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
              <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1 text-[10px]">
                <span>Artigo</span>
                <div className="flex gap-2">
                  <span>Qtd</span>
                  <span>Total</span>
                </div>
              </div>
              <div className="space-y-1">
                {doc.lines && doc.lines.length > 0 ? (
                  doc.lines.map((line, idx) => (
                    <div key={line.id || idx} className="flex justify-between items-start">
                      <div className="flex-1 pr-2 truncate">
                        <div className="font-semibold truncate">{line.description}</div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {line.qty} x {line.unitPrice.toLocaleString()} {currency}
                          {line.discount > 0 ? ` (-${line.discount}%)` : ''}
                        </div>
                      </div>
                      <span className="font-bold whitespace-nowrap">
                        {line.grossTotal.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic">Sem artigos discriminados</div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-right text-[11px] border-b border-dashed border-slate-400 pb-2 mb-2">
              <div className="flex justify-between text-slate-600">
                <span>Total Ilíquido:</span>
                <span>{netTotal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (AGT 14%):</span>
                <span>{taxTotal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-950 border-t border-slate-300 pt-1">
                <span>TOTAL:</span>
                <span>{grossTotal.toLocaleString()} {currency}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                <span>Forma de Pagamento:</span>
                <span className="font-bold">{doc.paymentMethod || 'NUMERÁRIO'}</span>
              </div>
            </div>

            {/* Fiscal Footer */}
            <div className="text-center text-[9px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-700">
                {doc.hash ? `${doc.hash.slice(0, 4)}-Processado por programa certificado nº 42/AGT/2026` : 'Processado por programa certificado nº 42/AGT/2026'}
              </div>
              <div>Software de Gestão PULSE ERP</div>
              <div className="text-[8px] text-slate-400">Obrigado pela sua preferência!</div>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 p-2 rounded-xl text-xs flex items-center justify-between animate-fadeIn flex-shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedback}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1 flex-shrink-0">
          <button
            onClick={() => handlePrint(selectedFormat)}
            disabled={isPrinting}
            className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Talão</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Partilhar Digital'}</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
