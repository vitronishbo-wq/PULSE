import React, { useState } from 'react';
import {
  Printer,
  Receipt,
  FileCheck,
  Zap,
  Sliders,
  CheckCircle2,
  Save,
  QrCode,
  ShieldCheck,
  Building2,
  HelpCircle,
  Network,
  Usb,
  Bluetooth,
  Monitor,
  Layers,
} from 'lucide-react';
import { TenantProfile, ReceiptFormat } from '../../types/pulse';
import { PrinterConfigData } from '../../types/settings';
import { LiveReceiptPreview } from './LiveReceiptPreview';

interface PrintersReceiptsSectionProps {
  tenant: TenantProfile;
  canEdit: boolean;
  onSaveTenant?: (updated: Partial<TenantProfile>) => void;
}

export const PrintersReceiptsSection: React.FC<PrintersReceiptsSectionProps> = ({
  tenant,
  canEdit,
  onSaveTenant,
}) => {
  const [config, setConfig] = useState<PrinterConfigData>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`pulse_printers_${tenant.id}`) : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      primaryFormat: tenant.receiptFormat || 'THERMAL_80',
      connectionType: 'ESC_POS_USB',
      ipAddress: '192.168.1.200',
      port: 9100,
      autoCut: true,
      printDensity: 'NORMAL',
      autoPrintOnSale: true,
      autoPrintShiftClose: true,
      printTableConference: true,
      showQrCode: true,
      showAgtHash: true,
      showBankIbans: true,
      showOperatorName: true,
      customHeaderNote: '✦ SERVIÇO DE RESTAURAÇÃO & TAKE-AWAY ✦',
      customFooterNote: 'Consulte os termos fiscais no portal www.agt.minfin.gov.ao',
      terminalPrinters: [
        {
          terminalId: 'POS-01',
          terminalName: 'POS 01 - Balcão Principal',
          counterPrinter: 'EPSON TM-T20III (USB / 80mm)',
          kitchenPrinter: 'STAR Micronics SP700 (LAN Cozinha / 80mm)',
          barPrinter: 'BIXOLON SRP-330 (LAN Bar / 80mm)',
          officeA4Printer: 'HP LaserJet Pro M404 (Escritório A4)',
        },
        {
          terminalId: 'POS-02',
          terminalName: 'POS 02 - Take Away / Esplanada',
          counterPrinter: 'BIXOLON SRP-275 (USB / 80mm)',
          kitchenPrinter: 'STAR Micronics SP700 (LAN Cozinha / 80mm)',
          barPrinter: 'BIXOLON SRP-330 (LAN Bar / 80mm)',
          officeA4Printer: 'HP LaserJet Pro M404 (Escritório A4)',
        },
        {
          terminalId: 'TABLET-01',
          terminalName: 'Tablet Móvel 01 - Sala & Mesas',
          counterPrinter: 'ZEBRA ZQ320 (Bluetooth Móvel / 58mm)',
          kitchenPrinter: 'STAR Micronics SP700 (LAN Cozinha / 80mm)',
          barPrinter: 'BIXOLON SRP-330 (LAN Bar / 80mm)',
          officeA4Printer: 'HP LaserJet Pro M404 (Escritório A4)',
        },
      ],
    };
  });

  const [isSaved, setIsSaved] = useState(false);
  const [testPrintLog, setTestPrintLog] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem(`pulse_printers_${tenant.id}`, JSON.stringify(config));
    }

    if (onSaveTenant) {
      onSaveTenant({
        receiptFormat: config.primaryFormat,
      });
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTriggerTest = () => {
    setTestPrintLog(
      `[${new Date().toLocaleTimeString()}] Comando ESC/POS enviado para ${config.connectionType} (${
        config.primaryFormat === 'THERMAL_80' ? '80mm' : config.primaryFormat === 'THERMAL_58' ? '58mm' : 'A4'
      }) - Status: OK 200 (Corte de papel efetuado).`
    );
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Formato do Rolo & Conexão */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase font-mono text-white">
                  1. Formato de Papel & Interface de Comunicação
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-mono block">
                Formato Principal do Talão / Documento
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, primaryFormat: 'THERMAL_80' })}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    config.primaryFormat === 'THERMAL_80'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                      : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Térmica 80mm</span>
                    <Receipt className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Padrão POS Balcão & Fatura-Recibo</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, primaryFormat: 'THERMAL_58' })}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    config.primaryFormat === 'THERMAL_58'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                      : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Térmica 58mm</span>
                    <Printer className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Impressoras Portáteis & Bluetooth</div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig({ ...config, primaryFormat: 'A4' })}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    config.primaryFormat === 'A4'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                      : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">Folha A4 / PDF</span>
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Fatura A4 Comercial & Propostas</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Interface de Conexão
                </label>
                <select
                  disabled={!canEdit}
                  value={config.connectionType}
                  onChange={(e) => setConfig({ ...config, connectionType: e.target.value as any })}
                  className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="ESC_POS_USB">USB Direto (ESC/POS Raw Driver)</option>
                  <option value="NETWORK_TCP">Rede Ethernet / Wi-Fi (TCP/IP Raw Socket)</option>
                  <option value="BLUETOOTH">Bluetooth SPP / BLE Portátil</option>
                  <option value="SYSTEM_DRIVER">Driver do Sistema Operativo (Windows/macOS/Linux)</option>
                </select>
              </div>

              {config.connectionType === 'NETWORK_TCP' && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">Endereço IP</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={config.ipAddress}
                      onChange={(e) => setConfig({ ...config, ipAddress: e.target.value })}
                      className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">Porta</label>
                    <input
                      type="number"
                      disabled={!canEdit}
                      value={config.port}
                      onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                      className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {config.connectionType !== 'NETWORK_TCP' && (
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">
                    Densidade de Impressão
                  </label>
                  <select
                    disabled={!canEdit}
                    value={config.printDensity}
                    onChange={(e) => setConfig({ ...config, printDensity: e.target.value as any })}
                    className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="NORMAL">Normal (100% Contraste)</option>
                    <option value="HIGH">Alta Densidade / Escuro (Papéis Térmicos antigos)</option>
                    <option value="LOW">Económico (Poupança da Cabeça Térmica)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* 2. Automação de Impressão & Elementos do Talão */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase font-mono text-white">
                  2. Automação de Impressão & Regras Operacionais
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 p-2.5 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={config.autoPrintOnSale}
                  onChange={(e) => setConfig({ ...config, autoPrintOnSale: e.target.checked })}
                  className="mt-0.5 rounded border-[#27272a] text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Impressão Automática ao Concluir Venda</div>
                  <div className="text-[10px] text-slate-400">Imprime o talão fiscal imediatamente sem abrir diálogo de impressão</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={config.autoPrintShiftClose}
                  onChange={(e) => setConfig({ ...config, autoPrintShiftClose: e.target.checked })}
                  className="mt-0.5 rounded border-[#27272a] text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Imprimir Relatório de Fecho de Turno (X/Z)</div>
                  <div className="text-[10px] text-slate-400">Gera talão de conferência física e totais ao encerrar o operador</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={config.autoCut}
                  onChange={(e) => setConfig({ ...config, autoCut: e.target.checked })}
                  className="mt-0.5 rounded border-[#27272a] text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Acionar Guilhotina / Corte Automático</div>
                  <div className="text-[10px] text-slate-400">Envia pulso ESC/POS para cortar o papel no final do talão</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={config.printTableConference}
                  onChange={(e) => setConfig({ ...config, printTableConference: e.target.checked })}
                  className="mt-0.5 rounded border-[#27272a] text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-xs text-white">Talão de Pré-Conta / Mesa</div>
                  <div className="text-[10px] text-slate-400">Permite imprimir conferência de mesa antes de emitir a fatura fiscal</div>
                </div>
              </label>
            </div>

            <div className="pt-2 border-t border-[#27272a] space-y-2">
              <div className="text-[11px] font-bold text-slate-300 font-mono">Elementos no Talão Fiscal:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.showAgtHash}
                    onChange={(e) => setConfig({ ...config, showAgtHash: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Hash 4 Caracteres AGT</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.showQrCode}
                    onChange={(e) => setConfig({ ...config, showQrCode: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>QR Code Fiscal</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.showBankIbans}
                    onChange={(e) => setConfig({ ...config, showBankIbans: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>IBANs de Pagamento</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.showOperatorName}
                    onChange={(e) => setConfig({ ...config, showOperatorName: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Nome do Operador</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Mensagem de Cabeçalho Personalizada
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={config.customHeaderNote}
                  onChange={(e) => setConfig({ ...config, customHeaderNote: e.target.value })}
                  className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Mensagem de Rodapé Personalizada
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={config.customFooterNote}
                  onChange={(e) => setConfig({ ...config, customFooterNote: e.target.value })}
                  className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Impressoras por Terminal & Setor */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-xs uppercase font-mono text-white">
                  3. Impressora por Terminal & Setores (Balcão, Cozinha, Bar)
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {config.terminalPrinters.map((tp, idx) => (
                <div key={tp.terminalId} className="bg-[#121215] border border-[#27272a] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between font-bold text-xs text-white">
                    <span className="flex items-center gap-2">
                      <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                      {tp.terminalName}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      ID: {tp.terminalId}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Balcão / Talão:</span>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={tp.counterPrinter}
                        onChange={(e) => {
                          const updated = [...config.terminalPrinters];
                          updated[idx].counterPrinter = e.target.value;
                          setConfig({ ...config, terminalPrinters: updated });
                        }}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Cozinha / KDS:</span>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={tp.kitchenPrinter || ''}
                        onChange={(e) => {
                          const updated = [...config.terminalPrinters];
                          updated[idx].kitchenPrinter = e.target.value;
                          setConfig({ ...config, terminalPrinters: updated });
                        }}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Bar / Copa:</span>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={tp.barPrinter || ''}
                        onChange={(e) => {
                          const updated = [...config.terminalPrinters];
                          updated[idx].barPrinter = e.target.value;
                          setConfig({ ...config, terminalPrinters: updated });
                        }}
                        className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Log */}
          {testPrintLog && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-xs font-mono text-emerald-300 flex items-center justify-between">
              <span>{testPrintLog}</span>
              <button
                type="button"
                onClick={() => setTestPrintLog(null)}
                className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Limpar
              </button>
            </div>
          )}

          {canEdit && (
            <div className="flex items-center justify-between pt-2">
              {isSaved ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Configurações de impressão guardadas com sucesso.
                </span>
              ) : <div />}

              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Definições de Impressão</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Receipt Preview */}
        <div className="lg:col-span-5 sticky top-4">
          <LiveReceiptPreview
            tenant={tenant}
            printerConfig={config}
            currency={tenant.currency}
            onTriggerTestPrint={handleTriggerTest}
          />
        </div>
      </div>
    </form>
  );
};
