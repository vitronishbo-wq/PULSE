import React, { useState } from 'react';
import { X, Printer, Search, FileText, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import { Document, TenantProfile, User } from '../types/pulse';
import { PrintService } from '../output/PrintService';

interface POSReprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  tenant: TenantProfile;
  currentUser: User;
  currency: string;
}

export const POSReprintModal: React.FC<POSReprintModalProps> = ({
  isOpen,
  onClose,
  documents = [],
  tenant,
  currentUser,
  currency,
}) => {
  const [search, setSearch] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const printService = PrintService.getInstance();

  const recentDocs = documents
    .filter((d) => {
      if (!search) return true;
      return (
        d.docNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (d.customerTaxId && d.customerTaxId.includes(search))
      );
    })
    .slice(0, 10);

  const handleReprint = async (doc: Document, format: 'THERMAL_80' | 'THERMAL_58' | 'A4') => {
    setFeedback(`A reimprimir 2ª Via de ${doc.docNumber}...`);
    await printService.print(doc, tenant, {
      format,
      operator: currentUser.name,
      copies: 1,
    });
    setFeedback(`2ª Via de ${doc.docNumber} enviada para impressão.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-[#14141a] border border-slate-700 rounded-2xl w-full max-w-2xl p-5 shadow-2xl space-y-4 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Reimpressão de Talões (2ª Via)
              </h3>
              <p className="text-[10px] text-slate-400">
                Histórico de faturas e recibos recentes emitidos no terminal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por Nº de Documento (ex: FT 2026/001), Nome do Cliente ou NIF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
          />
        </div>

        {feedback && (
          <div className="bg-sky-950/40 border border-sky-500/50 text-sky-300 p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* List of Recent Docs */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {recentDocs.length === 0 ? (
            <div className="p-8 text-center bg-[#1b1b22] border border-slate-800 rounded-xl text-slate-500">
              Nenhum documento recente encontrado.
            </div>
          ) : (
            recentDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#18181f] border border-slate-800 hover:border-sky-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{doc.docNumber}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                      {doc.date}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                      {doc.docType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    Cliente: <span className="text-slate-200 font-semibold">{doc.customerName}</span> • NIF: {doc.customerTaxId || 'Consumidor Final'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-xs block">
                      {(doc.grossAmount ?? (doc as any).total ?? 0).toLocaleString()} {currency}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(doc.lines?.length ?? 0)} artigo(s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleReprint(doc, 'THERMAL_80')}
                      className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reimprimir em Talão Térmico 80mm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>80mm</span>
                    </button>
                    <button
                      onClick={() => handleReprint(doc, 'A4')}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Reimprimir em Fatura A4"
                    >
                      <span>A4</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <span className="text-[10px] text-slate-500">
            Todas as reimpressões incluem a menção obrigatória "2ª VIA".
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
