import React, { useState } from 'react';
import { Printer, X, ShieldCheck, Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { Document, TenantProfile, ReceiptFormat } from '../types/pulse';
import { OutputEngine } from '../engines/OutputEngine';
import { PrintService } from '../output/PrintService';
import { ReceiptRenderer } from '../output/ReceiptRenderer';

interface DocumentModalProps {
  document: Document | null;
  tenant: TenantProfile;
  currency: string;
  onClose: () => void;
  defaultFormat?: ReceiptFormat;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  document,
  tenant,
  currency,
  onClose,
  defaultFormat = 'THERMAL_80',
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ReceiptFormat>(defaultFormat);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  if (!document) return null;

  const outputEngine = OutputEngine.getInstance();
  const printService = PrintService.getInstance();
  const payload = outputEngine.prepareReceiptPayload(document, tenant);

  const handlePrint = () => {
    printService.print(document, tenant, selectedFormat);
  };

  const handleOpenNewTab = () => {
    printService.openInNewTab(document, tenant, selectedFormat);
  };

  const handleShare = async () => {
    const res = await printService.share(document, tenant);
    setShareStatus(res.message);
    setTimeout(() => setShareStatus(null), 3000);
  };

  return (
    <div
      id="modal-document-viewer"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 my-auto flex flex-col max-h-[90vh]">
        {/* Controls Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {payload.docNumber} ({document.docType})
            </span>
          </div>

          {/* Format Selector: 80mm, 58mm, A4 */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setSelectedFormat('THERMAL_80')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedFormat === 'THERMAL_80'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              80mm Térmico
            </button>
            <button
              onClick={() => setSelectedFormat('THERMAL_58')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedFormat === 'THERMAL_58'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              58mm Compacto
            </button>
            <button
              onClick={() => setSelectedFormat('A4')}
              className={`px-2.5 py-1 rounded font-bold transition-colors ${
                selectedFormat === 'A4'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A4 Fatura
            </button>
          </div>

          {/* Actions: Print, Share, Open in New Tab, Close */}
          <div className="flex items-center gap-2">
            {shareStatus && (
              <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                {shareStatus}
              </span>
            )}
            <button
              onClick={handleShare}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-colors"
              title="Partilhar ou copiar resumo do talão"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Partilhar</span>
            </button>
            <button
              onClick={handleOpenNewTab}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-colors"
              title="Abrir talão em nova aba para impressão externa"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Nova Aba</span>
            </button>
            <button
              onClick={handlePrint}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Render View Container */}
        <div className="p-4 bg-slate-950/50 flex-1 overflow-y-auto flex items-center justify-center">
          <div className="shadow-2xl">
            <ReceiptRenderer payload={payload} format={selectedFormat} />
          </div>
        </div>
      </div>
    </div>
  );
};
