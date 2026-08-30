import React, { useState } from 'react';
import {
  Monitor,
  Plus,
  Edit2,
  Trash2,
  Barcode,
  Printer,
  Scale,
  Tv,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Activity,
  Zap,
  Save,
  Radio,
  Play,
  RotateCw,
} from 'lucide-react';
import { POSTerminalDevice } from '../../types/settings';
import { TerminalModal } from './TerminalModal';

interface TerminalsDevicesSectionProps {
  canEdit: boolean;
}

const defaultTerminals: POSTerminalDevice[] = [
  {
    id: 'term_01',
    name: 'POS 01 - Balcão Principal',
    code: 'POS-01',
    location: 'Frente de Loja / Caixa Principal',
    ipAddress: '192.168.1.101',
    macAddress: 'B8:27:EB:4A:89:12',
    status: 'ONLINE',
    assignedPrinter: 'EPSON TM-T20III (USB / 80mm)',
    hasCashDrawer: true,
    scannerType: 'HID_USB',
    lastPing: '3s atrás (Latência: 12ms)',
  },
  {
    id: 'term_02',
    name: 'POS 02 - Take Away & Balcão 2',
    code: 'POS-02',
    location: 'Setor de Encomendas & Take Away',
    ipAddress: '192.168.1.102',
    macAddress: 'D8:3A:DD:12:FE:55',
    status: 'ONLINE',
    assignedPrinter: 'BIXOLON SRP-275 (USB / 80mm)',
    hasCashDrawer: true,
    scannerType: 'HID_USB',
    lastPing: '8s atrás (Latência: 15ms)',
  },
  {
    id: 'term_03',
    name: 'Tablet Móvel 01 - Atendimento de Mesa',
    code: 'TABLET-01',
    location: 'Sala & Esplanada',
    ipAddress: '192.168.1.155',
    macAddress: 'AC:BC:32:89:01:DF',
    status: 'ONLINE',
    assignedPrinter: 'ZEBRA ZQ320 (Bluetooth / 58mm)',
    hasCashDrawer: false,
    scannerType: 'CAMERA',
    lastPing: '1m atrás (Wi-Fi 5GHz)',
  },
];

export const TerminalsDevicesSection: React.FC<TerminalsDevicesSectionProps> = ({
  canEdit,
}) => {
  const [terminals, setTerminals] = useState<POSTerminalDevice[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse_settings_terminals');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return defaultTerminals;
  });

  const [editingTerminal, setEditingTerminal] = useState<POSTerminalDevice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'TERMINALS' | 'SCANNER' | 'DRAWER' | 'SCALE' | 'VFD'>('TERMINALS');

  // Scanner State
  const [scannerMode, setScannerMode] = useState('HID_USB');
  const [scannerTestInput, setScannerTestInput] = useState('');
  const [scannerTestResult, setScannerTestResult] = useState<string | null>(null);

  // Cash Drawer State
  const [drawerPulseCommand, setDrawerPulseCommand] = useState('ESC_P_0_25_250');
  const [drawerAutoOpenCash, setDrawerAutoOpenCash] = useState(true);
  const [drawerTestFeedback, setDrawerTestFeedback] = useState<string | null>(null);

  // Electronic Scale State
  const [scaleProtocol, setScaleProtocol] = useState('TOLEDO_PRIX');
  const [scalePort, setScalePort] = useState('COM3');
  const [scaleBaudRate, setScaleBaudRate] = useState('9600');
  const [scaleReadingWeight, setScaleReadingWeight] = useState<number>(1.450);
  const [scaleTare, setScaleTare] = useState<number>(0.000);
  const [scaleIsSimulating, setScaleIsSimulating] = useState(false);

  // VFD / Customer Display State
  const [vfdEnabled, setVfdEnabled] = useState(true);
  const [vfdLine1, setVfdLine1] = useState('BEM-VINDO AO PULSE');
  const [vfdLine2, setVfdLine2] = useState('SISTEMA CERTIFICADO');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const saveTerminals = (updated: POSTerminalDevice[]) => {
    setTerminals(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse_settings_terminals', JSON.stringify(updated));
    }
  };

  const handleSaveTerminal = (termData: Partial<POSTerminalDevice>) => {
    if (editingTerminal) {
      const updated = terminals.map((t) =>
        t.id === editingTerminal.id ? ({ ...t, ...termData } as POSTerminalDevice) : t
      );
      saveTerminals(updated);
      showToast('Terminal POS atualizado com sucesso.');
    } else {
      const newTerm: POSTerminalDevice = {
        id: `term_${Date.now()}`,
        name: termData.name || 'Novo Terminal POS',
        code: termData.code || 'POS-04',
        location: termData.location || 'Geral',
        ipAddress: termData.ipAddress || '192.168.1.104',
        macAddress: termData.macAddress || '00:1B:44:11:00:99',
        status: 'ONLINE',
        assignedPrinter: termData.assignedPrinter || 'EPSON TM-T20III',
        hasCashDrawer: termData.hasCashDrawer ?? true,
        scannerType: termData.scannerType || 'HID_USB',
        lastPing: 'Agora mesmo',
      };
      saveTerminals([...terminals, newTerm]);
      showToast('Novo terminal POS registado.');
    }
  };

  const handleDeleteTerminal = (id: string) => {
    if (!canEdit) return;
    const updated = terminals.filter((t) => t.id !== id);
    saveTerminals(updated);
    showToast('Terminal removido com sucesso.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTestDrawerPulse = () => {
    setDrawerTestFeedback('A enviar pulso RJ11 Pin 2 [ESC p 0 25 250]...');
    setTimeout(() => {
      setDrawerTestFeedback('✓ Pulso enviado com sucesso: Gaveta de Dinheiro Aberta.');
      setTimeout(() => setDrawerTestFeedback(null), 4000);
    }, 800);
  };

  const handleSimulateScaleRead = () => {
    setScaleIsSimulating(true);
    const weights = [0.850, 1.250, 2.400, 0.450, 3.120, 1.450];
    const randomWeight = weights[Math.floor(Math.random() * weights.length)];
    setTimeout(() => {
      setScaleReadingWeight(randomWeight);
      setScaleIsSimulating(false);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Header & Sub-navigation */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Terminais, Periféricos & Hardware Conectado</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {terminals.length} Terminais Ativos
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Configuração de leitores, gaveta de dinheiro RJ11, balança de check-out e display VFD
            </p>
          </div>
        </div>

        {/* Sub-tabs selector */}
        <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-lg border border-[#27272a] text-xs">
          <button
            onClick={() => setActiveTab('TERMINALS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TERMINALS'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Terminais POS</span>
          </button>

          <button
            onClick={() => setActiveTab('SCANNER')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SCANNER'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Scanners</span>
          </button>

          <button
            onClick={() => setActiveTab('DRAWER')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DRAWER'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Gaveta RJ11</span>
          </button>

          <button
            onClick={() => setActiveTab('SCALE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SCALE'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Balança</span>
          </button>

          <button
            onClick={() => setActiveTab('VFD')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'VFD'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Visor VFD</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Subview: Terminais POS */}
      {activeTab === 'TERMINALS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono">
              Terminais POS Registados no Estabelecimento
            </span>
            {canEdit && (
              <button
                onClick={() => {
                  setEditingTerminal(null);
                  setIsModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Terminal</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {terminals.map((t) => (
              <div
                key={t.id}
                className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                    <span className="font-mono text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {t.code}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>

                  <div className="pt-2">
                    <h4 className="font-bold text-sm text-white">{t.name}</h4>
                    <p className="text-[11px] text-slate-400">{t.location}</p>
                  </div>

                  <div className="mt-3 space-y-1 text-[11px] font-mono text-slate-400 bg-[#121215] p-2.5 rounded-lg border border-[#27272a]">
                    <div className="flex justify-between">
                      <span>IP Local:</span>
                      <span className="text-white">{t.ipAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MAC Address:</span>
                      <span className="text-slate-300">{t.macAddress}</span>
                    </div>
                    <div className="flex justify-between truncate">
                      <span>Impressora:</span>
                      <span className="text-emerald-400 truncate max-w-[130px]">{t.assignedPrinter}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gaveta RJ11:</span>
                      <span className={t.hasCashDrawer ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {t.hasCashDrawer ? '✓ Conectada' : '✗ Não'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Leitor:</span>
                      <span className="text-sky-400">{t.scannerType}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#27272a] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Ping: {t.lastPing}</span>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingTerminal(t);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded hover:bg-[#27272a] text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTerminal(t.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Subview: Scanners */}
      {activeTab === 'SCANNER' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Barcode className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Configuração de Leitores de Código de Barras (EAN-13, QR Code, Code128)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Hardware Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Modo de Operação do Leitor
                </label>
                <select
                  value={scannerMode}
                  onChange={(e) => setScannerMode(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="HID_USB">Emulação de Teclado USB (HID - Mais Rápido e Universal)</option>
                  <option value="SERIAL_COM">Porta COM Virtual (RS-232 / VCP - Modo Fixo)</option>
                  <option value="BLUETOOTH">Bluetooth SPP / BLE (Leitores Portáteis de Inventário)</option>
                  <option value="CAMERA_SCAN">Câmara Integrada (Webcam / Tablet Scanner)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  No modo HID, o leitor envia a sequência de números seguida da tecla [ENTER] automaticamente.
                </p>
              </div>

              <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg space-y-2">
                <div className="font-bold text-xs text-white font-mono">Opções Avançadas de Leitura:</div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                  <span>Emitir Bip sonoro após leitura com sucesso</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                  <span>Adicionar artigo imediatamente ao carrinho (Quantidade = 1)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                  <span>Suporte a códigos com preço/peso embutido (Prefixo 20 a 29)</span>
                </label>
              </div>
            </div>

            {/* Test Area */}
            <div className="bg-[#121215] border border-[#27272a] rounded-lg p-3.5 space-y-3">
              <div className="font-bold text-xs text-emerald-400 font-mono flex items-center justify-between">
                <span>Área de Teste de Leitor</span>
                <span className="text-[10px] text-slate-400 font-sans">Faça a leitura de um código real</span>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Aponte o leitor aqui ou digite o código EAN-13..."
                  value={scannerTestInput}
                  onChange={(e) => setScannerTestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && scannerTestInput) {
                      setScannerTestResult(`Código Lido com Sucesso: [${scannerTestInput}] - Formato EAN/Barcode Válido`);
                    }
                  }}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>

              {scannerTestResult ? (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs font-mono text-emerald-300">
                  {scannerTestResult}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic text-center py-3">
                  Aguardando leitura do leitor laser/óptico...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Subview: Gaveta de Dinheiro RJ11 */}
      {activeTab === 'DRAWER' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Gaveta de Dinheiro (Conexão RJ11 via Impressora Térmica)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Disparo Eletrónico</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Comando de Pulso Elétrico (ESC/POS)
                </label>
                <select
                  value={drawerPulseCommand}
                  onChange={(e) => setDrawerPulseCommand(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                >
                  <option value="ESC_P_0_25_250">Padrão EPSON / Star (Pin 2: ESC p 0 25 250 - 24V)</option>
                  <option value="ESC_P_1_25_250">Padrão Secundário (Pin 5: ESC p 1 25 250 - 24V)</option>
                  <option value="DLE_DC4">Padrão Bixolon / Custom (DLE DC4 1 1 1)</option>
                </select>
              </div>

              <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg space-y-2">
                <div className="font-bold text-xs text-white font-mono">Comportamento Automático:</div>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drawerAutoOpenCash}
                    onChange={(e) => setDrawerAutoOpenCash(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Abrir gaveta automaticamente ao finalizar pagamento em NUMERÁRIO</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                  <span>Permitir abertura manual via atalho no POS (F10 / Botão Abrir Gaveta)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
                  <span>Registar log de auditoria a cada abertura manual sem venda</span>
                </label>
              </div>
            </div>

            {/* Test Action */}
            <div className="bg-[#121215] border border-[#27272a] rounded-lg p-4 flex flex-col justify-between items-center text-center space-y-3">
              <div>
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-2">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-white">Disparo Imediato de Pulso RJ11</h4>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Envia o sinal elétrico através do cabo RJ11 da impressora para abrir o solenoide da gaveta.
                </p>
              </div>

              {drawerTestFeedback && (
                <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-md">
                  {drawerTestFeedback}
                </div>
              )}

              <button
                type="button"
                onClick={handleTestDrawerPulse}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Zap className="w-4 h-4" />
                <span>Testar Pulso de Abertura RJ11</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Subview: Balança Eletrónica */}
      {activeTab === 'SCALE' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Balança de Pesagem Eletrónica (Check-out / Talho / Frutaria)
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">RS-232 / USB</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">Protocolo da Balança</label>
                <select
                  value={scaleProtocol}
                  onChange={(e) => setScaleProtocol(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="TOLEDO_PRIX">Toledo Prix 3 / Prix 4 (Padrão 9600 8N1)</option>
                  <option value="DIBAL">Dibal / Epelsa (Transmissão Contínua)</option>
                  <option value="FILIZOLA">Filizola Platina (Protocolo Estável)</option>
                  <option value="METTLER">Mettler Toledo Viva (USB POS)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Porta COM</label>
                  <input
                    type="text"
                    value={scalePort}
                    onChange={(e) => setScalePort(e.target.value)}
                    className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Baud Rate</label>
                  <select
                    value={scaleBaudRate}
                    onChange={(e) => setScaleBaudRate(e.target.value)}
                    className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500"
                  >
                    <option value="9600">9600 bps</option>
                    <option value="4800">4800 bps</option>
                    <option value="19200">19200 bps</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Live Scale Display */}
            <div className="bg-[#121215] border border-[#27272a] rounded-lg p-4 flex flex-col justify-between items-center text-center space-y-3">
              <div className="w-full">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-2 border-b border-[#27272a]">
                  <span>Leitura em Tempo Real:</span>
                  <span className="text-emerald-400 font-bold">ESTÁVEL ●</span>
                </div>

                <div className="my-4">
                  <div className="text-4xl font-extrabold font-mono text-emerald-400 tracking-tight">
                    {scaleReadingWeight.toFixed(3)}{' '}
                    <span className="text-lg text-slate-400 font-normal">kg</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    Tara: {scaleTare.toFixed(3)} kg • Peso Líquido: {(scaleReadingWeight - scaleTare).toFixed(3)} kg
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateScaleRead}
                  disabled={scaleIsSimulating}
                  className="px-4 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${scaleIsSimulating ? 'animate-spin' : ''}`} />
                  <span>Simular Pesagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScaleTare(scaleReadingWeight)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono cursor-pointer"
                >
                  Tarar (0.000)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Subview: Visor de Cliente VFD */}
      {activeTab === 'VFD' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Visor de Cliente / Customer Display (VFD 2x20 Caracteres)
              </h3>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={vfdEnabled}
                onChange={(e) => setVfdEnabled(e.target.checked)}
                className="rounded text-emerald-500"
              />
              <span>Ativar Visor</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Texto Linha 1 (Mensagem de Boas-Vindas) - Máx 20 Caracteres
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={vfdLine1}
                  onChange={(e) => setVfdLine1(e.target.value.toUpperCase())}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">
                  Texto Linha 2 (Subtítulo ou Estado) - Máx 20 Caracteres
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={vfdLine2}
                  onChange={(e) => setVfdLine2(e.target.value.toUpperCase())}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>

            {/* VFD Mockup Screen */}
            <div className="bg-[#0c140e] border-2 border-emerald-900/60 rounded-xl p-5 shadow-2xl flex flex-col justify-center items-center">
              <div className="text-[10px] text-emerald-600 font-mono uppercase tracking-widest mb-2">
                SIMULAÇÃO DE DISPLAY VFD 2x20 (VERDE FLUORESCENTE)
              </div>
              <div className="bg-[#050a06] border border-emerald-500/40 rounded-lg p-3 w-full font-mono text-center space-y-1 shadow-inner">
                <div className="text-emerald-400 text-sm font-bold tracking-widest uppercase">
                  {vfdLine1.padEnd(20, ' ')}
                </div>
                <div className="text-emerald-400 text-sm font-bold tracking-widest uppercase">
                  {vfdLine2.padEnd(20, ' ')}
                </div>
              </div>
              <div className="text-[9px] text-slate-500 mt-2 font-mono">
                Em venda ativa, a linha 1 mostra o artigo e a linha 2 mostra o total a pagar.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Modal */}
      <TerminalModal
        terminal={editingTerminal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTerminal(null);
        }}
        onSave={handleSaveTerminal}
      />
    </div>
  );
};
