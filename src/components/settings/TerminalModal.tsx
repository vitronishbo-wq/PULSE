import React, { useState } from 'react';
import {
  X,
  Monitor,
  CheckCircle2,
  Printer,
  Barcode,
  Wifi,
  HardDrive,
} from 'lucide-react';
import { POSTerminalDevice } from '../../types/settings';

interface TerminalModalProps {
  terminal?: POSTerminalDevice | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (terminalData: Partial<POSTerminalDevice>) => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({
  terminal,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(terminal?.name || '');
  const [code, setCode] = useState(terminal?.code || 'POS-03');
  const [location, setLocation] = useState(terminal?.location || 'Balcão / Caixa');
  const [ipAddress, setIpAddress] = useState(terminal?.ipAddress || '192.168.1.103');
  const [macAddress, setMacAddress] = useState(terminal?.macAddress || '00:1B:44:11:3A:B7');
  const [assignedPrinter, setAssignedPrinter] = useState(
    terminal?.assignedPrinter || 'EPSON TM-T20III (USB 80mm)'
  );
  const [hasCashDrawer, setHasCashDrawer] = useState(terminal?.hasCashDrawer ?? true);
  const [scannerType, setScannerType] = useState(terminal?.scannerType || 'HID_USB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      code,
      location,
      ipAddress,
      macAddress,
      assignedPrinter,
      hasCashDrawer,
      scannerType,
      status: 'ONLINE',
      lastPing: 'Agora mesmo',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#121215]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {terminal ? 'Configurar Terminal POS' : 'Adicionar Novo Terminal POS'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Associação de hardware, rede e periféricos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#27272a] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Nome do Terminal <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: POS 03 - Bar Esplanada"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Código / Identificador POS <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="POS-03"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Localização / Setor
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Esplanada / Piso 2"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Endereço IP Local
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.1.103"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Endereço MAC
              </label>
              <input
                type="text"
                value={macAddress}
                onChange={(e) => setMacAddress(e.target.value)}
                placeholder="00:1B:44:11:3A:B7"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Impressora Térmica Vinculada
              </label>
              <input
                type="text"
                value={assignedPrinter}
                onChange={(e) => setAssignedPrinter(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Leitor de Código de Barras
              </label>
              <select
                value={scannerType}
                onChange={(e) => setScannerType(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              >
                <option value="HID_USB">USB HID (Teclado)</option>
                <option value="SERIAL_COM">Porta COM / RS232</option>
                <option value="BLUETOOTH">Bluetooth Sem Fio</option>
                <option value="CAMERA">Câmara Integrada</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Gaveta de Dinheiro RJ11
              </label>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCashDrawer}
                    onChange={(e) => setHasCashDrawer(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Gaveta Conectada</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#121215] border border-[#27272a] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{terminal ? 'Atualizar Terminal' : 'Gravar Terminal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
