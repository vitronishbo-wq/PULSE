import React, { useState } from 'react';
import {
  CreditCard,
  Banknote,
  Building,
  QrCode,
  Gift,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Layers,
  AlertCircle,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { PaymentMethodConfigItem } from '../../types/settings';

interface PaymentMethodsSectionProps {
  canEdit: boolean;
}

const defaultPaymentMethods: PaymentMethodConfigItem[] = [
  {
    id: 'pay_cash',
    type: 'CASH',
    name: 'Numerário / Dinheiro em Espécie',
    enabled: true,
    allowChange: true,
    requiresReference: false,
    feePercent: 0,
    accounts: [],
  },
  {
    id: 'pay_tpa',
    type: 'TPA_CARD',
    name: 'TPA / Cartão Multicaixa & Visa / Mastercard',
    enabled: true,
    allowChange: false,
    requiresReference: true,
    feePercent: 1.2,
    accounts: ['Conta BAI - TPA Balcão Principal', 'Conta BFA - TPA Móvel'],
  },
  {
    id: 'pay_transfer',
    type: 'BANK_TRANSFER',
    name: 'Transferência Bancária Imediata / CIP',
    enabled: true,
    allowChange: false,
    requiresReference: true,
    requiresReceiptProof: true,
    feePercent: 0,
    accounts: [
      'BAI: AO06.0040.0000.1234.5678.9012.3',
      'BFA: AO06.0006.0000.9876.5432.1098.7',
      'Millennium Atlântico: AO06.0055.0000.5555.4444.3333.2',
    ],
  },
  {
    id: 'pay_mcx_ref',
    type: 'MULTICAIXA_EXPRESS',
    name: 'Multicaixa Express / Referência GPO',
    enabled: true,
    allowChange: false,
    requiresReference: true,
    feePercent: 0.8,
    accounts: ['Entidade: 11029 (EMIS GPO)'],
  },
  {
    id: 'pay_voucher',
    type: 'VOUCHER',
    name: 'Vales de Refeição / Ticket Restaurante',
    enabled: true,
    allowChange: false,
    requiresReference: true,
    feePercent: 2.5,
    accounts: ['Sodexo Pass', 'Ticket Refeição'],
  },
  {
    id: 'pay_credit',
    type: 'CUSTOMER_CREDIT',
    name: 'Crédito em Conta-Corrente de Cliente (A Prazo)',
    enabled: true,
    allowChange: false,
    requiresReference: true,
    feePercent: 0,
    accounts: [],
  },
];

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  canEdit,
}) => {
  const [methods, setMethods] = useState<PaymentMethodConfigItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse_settings_payment_methods');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return defaultPaymentMethods;
  });

  const [selectedMethodId, setSelectedMethodId] = useState<string>('pay_tpa');
  const [newIbanInput, setNewIbanInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const selectedMethod = methods.find((m) => m.id === selectedMethodId) || methods[0];

  const handleToggleEnable = (id: string) => {
    if (!canEdit) return;
    setMethods(
      methods.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleUpdateCurrent = (updates: Partial<PaymentMethodConfigItem>) => {
    if (!canEdit) return;
    setMethods(
      methods.map((m) => (m.id === selectedMethod.id ? { ...m, ...updates } : m))
    );
  };

  const handleAddAccount = () => {
    if (!newIbanInput.trim() || !canEdit) return;
    const currentAccounts = selectedMethod.accounts || [];
    handleUpdateCurrent({ accounts: [...currentAccounts, newIbanInput.trim()] });
    setNewIbanInput('');
  };

  const handleRemoveAccount = (acc: string) => {
    if (!canEdit) return;
    const currentAccounts = selectedMethod.accounts || [];
    handleUpdateCurrent({ accounts: currentAccounts.filter((a) => a !== acc) });
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse_settings_payment_methods', JSON.stringify(methods));
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getIconForType = (type: PaymentMethodConfigItem['type']) => {
    switch (type) {
      case 'CASH':
        return <Banknote className="w-4 h-4 text-emerald-400" />;
      case 'TPA_CARD':
        return <CreditCard className="w-4 h-4 text-sky-400" />;
      case 'BANK_TRANSFER':
        return <Building className="w-4 h-4 text-purple-400" />;
      case 'MULTICAIXA_EXPRESS':
        return <QrCode className="w-4 h-4 text-amber-400" />;
      case 'VOUCHER':
        return <Gift className="w-4 h-4 text-pink-400" />;
      case 'CUSTOMER_CREDIT':
        return <Layers className="w-4 h-4 text-indigo-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-4">
      {/* Header */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Meios de Pagamento & Liquidação Financeira</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {methods.filter((m) => m.enabled).length} Ativos no POS
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Numerário, TPAs, Contas Bancárias/IBANs, Multicaixa Express e Crédito em Conta-Corrente
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Meios de Pagamento</span>
          </button>
        )}
      </div>

      {isSaved && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configurações dos meios de pagamento guardadas com sucesso.</span>
        </div>
      )}

      {/* Main Grid: Left List + Right Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left: Payment Methods List */}
        <div className="md:col-span-5 space-y-2">
          <div className="text-[11px] font-bold uppercase font-mono text-slate-400 px-1">
            Meios Disponíveis no Sistema
          </div>

          <div className="space-y-2">
            {methods.map((method) => {
              const isSelected = method.id === selectedMethodId;

              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/60 text-white shadow-sm'
                      : 'bg-[#18181b] border-[#27272a] text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-emerald-500/20' : 'bg-[#121215]'
                      }`}
                    >
                      {getIconForType(method.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{method.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                        <span>{method.type}</span>
                        {method.feePercent > 0 && <span>• Taxa: {method.feePercent}%</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={() => handleToggleEnable(method.id)}
                        disabled={!canEdit}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Method Configuration Form */}
        <div className="md:col-span-7 bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <div className="flex items-center gap-2">
              {getIconForType(selectedMethod.type)}
              <h3 className="font-bold text-xs uppercase font-mono text-white">
                Definições de {selectedMethod.name}
              </h3>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                selectedMethod.enabled
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {selectedMethod.enabled ? 'ATIVO NO POS' : 'DESATIVADO'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="md:col-span-2">
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Nome de Exibição no Ecrã do POS & Documento
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={selectedMethod.name}
                onChange={(e) => handleUpdateCurrent({ name: e.target.value })}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Taxa de Comissão / Serviço (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  disabled={!canEdit}
                  value={selectedMethod.feePercent}
                  onChange={(e) => handleUpdateCurrent({ feePercent: Number(e.target.value) })}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg pl-3 pr-8 py-2 text-white font-mono outline-none focus:border-emerald-500 font-bold"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Regras de Troco
              </label>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={selectedMethod.allowChange}
                    onChange={(e) => handleUpdateCurrent({ allowChange: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Permitir Devolução de Troco</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 space-y-2 pt-2 border-t border-[#27272a]">
              <div className="font-bold text-xs text-white font-mono">Requisitos Operacionais:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={selectedMethod.requiresReference}
                    onChange={(e) => handleUpdateCurrent({ requiresReference: e.target.checked })}
                    className="rounded text-emerald-500"
                  />
                  <span>Exigir Número de Talão / Ref. Operação</span>
                </label>

                {selectedMethod.type === 'BANK_TRANSFER' && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={selectedMethod.requiresReceiptProof}
                      onChange={(e) => handleUpdateCurrent({ requiresReceiptProof: e.target.checked })}
                      className="rounded text-emerald-500"
                    />
                    <span>Exigir Anexo de Comprovativo Bancário</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Accounts / IBANs List (for Transfer or TPA) */}
          {(selectedMethod.type === 'BANK_TRANSFER' ||
            selectedMethod.type === 'TPA_CARD' ||
            selectedMethod.type === 'MULTICAIXA_EXPRESS') && (
            <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-white font-mono flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  <span>Contas Bancárias / IBANs & Entidades Vinculadas</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Impressos nos talões e faturas
                </span>
              </div>

              <div className="space-y-1.5">
                {(selectedMethod.accounts || []).map((acc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg text-xs font-mono text-slate-200"
                  >
                    <span className="truncate pr-2">{acc}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(acc)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Ex: BAI: AO06.0040.0000.1234.5678.9012.3"
                    value={newIbanInput}
                    onChange={(e) => setNewIbanInput(e.target.value)}
                    className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
