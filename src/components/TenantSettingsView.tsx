import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Printer,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sliders,
  Lock,
  UserCheck,
  Coins,
  Receipt,
  FileCheck,
} from 'lucide-react';
import { TenantProfile, User, ReceiptFormat } from '../types/pulse';

interface TenantSettingsViewProps {
  tenant: TenantProfile;
  currentUser: User;
  onUpdateTenant?: (updated: Partial<TenantProfile>) => void;
  subView?: string;
}

export const TenantSettingsView: React.FC<TenantSettingsViewProps> = ({
  tenant,
  currentUser,
  onUpdateTenant,
  subView = 'GENERAL',
}) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PRINTERS' | 'USERS' | 'DEVICES'>(() => {
    if (subView === 'PRINTERS') return 'PRINTERS';
    if (subView === 'USERS') return 'USERS';
    if (subView === 'DEVICES') return 'DEVICES';
    return 'GENERAL';
  });

  React.useEffect(() => {
    if (subView === 'PRINTERS') setActiveTab('PRINTERS');
    else if (subView === 'USERS') setActiveTab('USERS');
    else if (subView === 'DEVICES') setActiveTab('DEVICES');
    else if (subView === 'GENERAL') setActiveTab('GENERAL');
  }, [subView]);

  const [tradeName, setTradeName] = useState(tenant.tradeName || tenant.name);
  const [taxId, setTaxId] = useState(tenant.taxId || '');
  const [address, setAddress] = useState(tenant.address || '');
  const [city, setCity] = useState(tenant.city || 'Luanda');
  const [phone, setPhone] = useState(tenant.phone || '+244 923 000 000');
  const [email, setEmail] = useState(tenant.email || 'geral@empresa.ao');
  const [currency, setCurrency] = useState(tenant.currency || 'Kz');
  const [receiptFormat, setReceiptFormat] = useState<ReceiptFormat>(
    tenant.receiptFormat || 'THERMAL_80'
  );
  const [fiscalCertNumber, setFiscalCertNumber] = useState(tenant.fiscalCertNumber || 'AGT/CERT/2026/0491');
  const [terminalId, setTerminalId] = useState('POS-TERM-01');
  const [drawerPulse, setDrawerPulse] = useState(true);
  const [barcodeScannerMode, setBarcodeScannerMode] = useState('HID_USB');
  const [scalePort, setScalePort] = useState('COM3_9600_8N1');
  const [isSaved, setIsSaved] = useState(false);

  const canEditCompany = ['platform_admin', 'tenant_owner', 'manager'].includes(currentUser.role);
  const canEditUsers = ['platform_admin', 'tenant_owner', 'manager'].includes(currentUser.role);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateTenant) {
      onUpdateTenant({
        tradeName,
        taxId,
        address,
        city,
        phone,
        email,
        currency,
        receiptFormat,
        fiscalCertNumber,
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div id="pulse-tenant-settings-view" className="space-y-3 font-sans text-xs">
      {/* Header Compacto */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span>CONFIGURAÇÕES DO ESTABELECIMENTO</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded">
                {tenant.segment || tenant.businessSegment || 'CORE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Operador: {currentUser.name} [{currentUser.role.replace('_', ' ').toUpperCase()}]
            </div>
          </div>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex items-center gap-1 bg-[#121215] p-0.5 rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Empresa & Terminal
          </button>
          <button
            onClick={() => setActiveTab('PRINTERS')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'PRINTERS'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Impressoras & Recibos
          </button>
          <button
            onClick={() => setActiveTab('DEVICES')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'DEVICES'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Séries / Terminal / Dispositivos
          </button>
          {canEditUsers && (
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'USERS'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Operadores & Acessos
            </button>
          )}
        </div>
      </div>

      {/* Tab Content: Empresa & Terminal */}
      {activeTab === 'GENERAL' && (
        <form onSubmit={handleSave} className="bg-[#18181b] border border-[#27272a] rounded-lg p-3.5 space-y-3">
          <div className="text-xs font-bold text-slate-200 uppercase font-mono pb-1 border-b border-[#27272a] flex items-center justify-between">
            <span>Dados Fiscais & Comerciais</span>
            {!canEditCompany && (
              <span className="text-[10px] text-amber-400 font-normal flex items-center gap-1">
                <Lock className="w-3 h-3" /> Apenas Leitura (Requer Permissão de Gestão)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Nome Comercial / Empresa</label>
              <input
                type="text"
                disabled={!canEditCompany}
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">NIF (Identificação Fiscal)</label>
              <input
                type="text"
                disabled={!canEditCompany}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Certificação de Software AGT</label>
              <input
                type="text"
                disabled={!canEditCompany}
                value={fiscalCertNumber}
                onChange={(e) => setFiscalCertNumber(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Endereço / Sede</label>
              <input
                type="text"
                disabled={!canEditCompany}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Cidade / Província</label>
              <input
                type="text"
                disabled={!canEditCompany}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Moeda Padrão</label>
              <select
                disabled={!canEditCompany}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="Kz">Kwanza (Kz - AOA)</option>
                <option value="€">Euro (€ - EUR)</option>
                <option value="$">Dólar ($ - USD)</option>
              </select>
            </div>
          </div>

          {canEditCompany && (
            <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
              {isSaved ? (
                <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Definições guardadas com sucesso
                </span>
              ) : <div />}
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Alterações</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab Content: Impressoras & Recibos */}
      {activeTab === 'PRINTERS' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3.5 space-y-3">
          <div className="text-xs font-bold text-slate-200 uppercase font-mono pb-1 border-b border-[#27272a]">
            Configuração de Saída & Formato de Impressão
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              onClick={() => setReceiptFormat('THERMAL_80')}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                receiptFormat === 'THERMAL_80'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                  : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Térmica 80mm</span>
                <Receipt className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Padrão para talões de venda rápida, restauração e faturas-recibo compactas.
              </p>
            </div>

            <div
              onClick={() => setReceiptFormat('THERMAL_58')}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                receiptFormat === 'THERMAL_58'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                  : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Térmica 58mm</span>
                <Printer className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Impressoras portáteis Bluetooth, terminais POS móveis e mini-recibos.
              </p>
            </div>

            <div
              onClick={() => setReceiptFormat('A4')}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                receiptFormat === 'A4'
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                  : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span>Folha A4 / PDF</span>
                <FileCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Faturas comerciais completas, propostas orçamentais e guias de transporte.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Séries / Terminal / Dispositivos */}
      {activeTab === 'DEVICES' && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3.5 space-y-4">
          <div className="text-xs font-bold text-slate-200 uppercase font-mono pb-1 border-b border-[#27272a] flex items-center justify-between">
            <span>Configuração de Séries de Documentos, Terminal & Periféricos POS</span>
            <span className="text-emerald-400 font-mono text-[11px]">Hardware Ready</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-[#121215] border border-[#27272a] rounded-lg p-3">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Identificador do Terminal (POS ID)</label>
              <input
                type="text"
                value={terminalId}
                onChange={(e) => setTerminalId(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Identificador gravado em cada documento emitido para rastreabilidade fiscal.</p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-lg p-3">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Modo do Leitor de Código de Barras</label>
              <select
                value={barcodeScannerMode}
                onChange={(e) => setBarcodeScannerMode(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="HID_USB">Emulação de Teclado (HID USB / Bluetooth)</option>
                <option value="SERIAL_COM">Porta Série Virtual (RS-232 / VCP)</option>
                <option value="CAMERA_SCAN">Câmara / Scanner Integrado</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Deteta EAN-13, QR Code e Code128 instantaneamente no POS.</p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-lg p-3">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">Balança de Pesagem (Check-out)</label>
              <select
                value={scalePort}
                onChange={(e) => setScalePort(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
              >
                <option value="COM3_9600_8N1">Porta COM / USB (Protocolo Toledo/Dibal 9600 8N1)</option>
                <option value="IP_SOCKET">Balança de Rede (TCP/IP Socket 192.168.1.150)</option>
                <option value="MANUAL">Entrada Manual de Peso (Sem Balança)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">Transmissão contínua de tara e peso líquido para o cálculo de PVP.</p>
            </div>
          </div>

          <div className="bg-[#121215] border border-[#27272a] rounded-lg p-3">
            <div className="font-bold text-xs text-white mb-2 font-mono uppercase">Séries Comerciais & Fiscais Ativas (2026)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#27272a] text-slate-400 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="p-2">Série</th>
                    <th className="p-2">Tipo de Documento</th>
                    <th className="p-2">Último Nº Emitido</th>
                    <th className="p-2">Início de Validade</th>
                    <th className="p-2">Estado AGT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272a] text-slate-200">
                  <tr>
                    <td className="p-2 font-bold text-emerald-400 font-mono">FT 2026/A</td>
                    <td className="p-2">Fatura Comercial</td>
                    <td className="p-2 font-mono">FT 2026/A/42</td>
                    <td className="p-2 font-mono text-slate-400">01/01/2026</td>
                    <td className="p-2"><span className="text-emerald-400 font-mono text-[11px]">● Comunicada AGT</span></td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-emerald-400 font-mono">FR 2026/A</td>
                    <td className="p-2">Fatura-Recibo POS</td>
                    <td className="p-2 font-mono">FR 2026/A/108</td>
                    <td className="p-2 font-mono text-slate-400">01/01/2026</td>
                    <td className="p-2"><span className="text-emerald-400 font-mono text-[11px]">● Comunicada AGT</span></td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-emerald-400 font-mono">NC 2026/A</td>
                    <td className="p-2">Nota de Crédito / Devolução</td>
                    <td className="p-2 font-mono">NC 2026/A/3</td>
                    <td className="p-2 font-mono text-slate-400">01/01/2026</td>
                    <td className="p-2"><span className="text-emerald-400 font-mono text-[11px]">● Comunicada AGT</span></td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-emerald-400 font-mono">PP 2026/A</td>
                    <td className="p-2">Fatura Pró-Forma</td>
                    <td className="p-2 font-mono">PP 2026/A/15</td>
                    <td className="p-2 font-mono text-slate-400">01/01/2026</td>
                    <td className="p-2"><span className="text-emerald-400 font-mono text-[11px]">● Comunicada AGT</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Operadores & Acessos */}
      {activeTab === 'USERS' && canEditUsers && (
        <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3.5 space-y-3">
          <div className="text-xs font-bold text-slate-200 uppercase font-mono pb-1 border-b border-[#27272a]">
            Operadores com Acesso a este Terminal
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121215] border-b border-[#27272a] text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-2.5">Operador</th>
                  <th className="p-2.5">Perfil de Acesso</th>
                  <th className="p-2.5">Email / Login</th>
                  <th className="p-2.5">Estado</th>
                  <th className="p-2.5 text-right">Permissões</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-slate-200 font-sans">
                <tr>
                  <td className="p-2.5 font-bold text-white">Administrador do Estabelecimento</td>
                  <td className="p-2.5 font-mono text-emerald-400 text-[11px]">TENANT OWNER</td>
                  <td className="p-2.5 font-mono text-slate-400 text-[11px]">admin@empresa.ao</td>
                  <td className="p-2.5"><span className="text-emerald-400 font-mono">● Ativo</span></td>
                  <td className="p-2.5 text-right text-slate-400 text-[11px]">Acesso Total ao Estabelecimento</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-white">Operador de Caixa / Balcão</td>
                  <td className="p-2.5 font-mono text-sky-400 text-[11px]">CASHIER</td>
                  <td className="p-2.5 font-mono text-slate-400 text-[11px]">caixa01@empresa.ao</td>
                  <td className="p-2.5"><span className="text-emerald-400 font-mono">● Ativo</span></td>
                  <td className="p-2.5 text-right text-slate-400 text-[11px]">POS + Fecho de Turno</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
