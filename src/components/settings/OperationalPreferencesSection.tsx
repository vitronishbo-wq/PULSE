import React, { useState } from 'react';
import {
  Sliders,
  Coins,
  Globe,
  Clock,
  ShoppingBag,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Save,
  Monitor,
  Volume2,
  Scan,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { TenantProfile } from '../../types/pulse';
import { OperationalPreferencesData } from '../../types/settings';

interface OperationalPreferencesSectionProps {
  tenant: TenantProfile;
  canEdit: boolean;
  onSaveTenant?: (updated: Partial<TenantProfile>) => void;
}

const defaultPreferences: OperationalPreferencesData = {
  currency: 'AOA',
  currencySymbol: 'Kz',
  decimalPlaces: 2,
  decimalSeparator: ',',
  thousandsSeparator: '.',
  roundingMethod: 'HALF_UP',
  language: 'pt-AO',
  timezone: 'Africa/Luanda (GMT+1)',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24H',
  salesMode: 'RESTAURANT_BAR',
  allowNegativeStock: false,
  warnLowStock: true,
  blockExpiredSales: true,
  requireShiftOpeningFloat: true,
  blindShiftClosing: true,
  autoLockScreenMinutes: 15,
  posBehavior: {
    autoFocusBarcode: true,
    playScannerBeep: true,
    confirmLineRemoval: false,
    enableQuickCashButtons: true,
    showStockBadgesInGrid: true,
    autoCloseCashDrawerReminder: true,
    directSaleWithoutCustomer: true,
  },
};

export const OperationalPreferencesSection: React.FC<OperationalPreferencesSectionProps> = ({
  tenant,
  canEdit,
  onSaveTenant,
}) => {
  const [prefs, setPrefs] = useState<OperationalPreferencesData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`pulse_settings_preferences_${tenant.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...defaultPreferences,
            ...parsed,
            posBehavior: {
              ...defaultPreferences.posBehavior,
              ...(parsed.posBehavior || {}),
            },
          };
        } catch (e) {}
      }
    }
    return {
      ...defaultPreferences,
      currency: tenant.currency || 'AOA',
    };
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `pulse_settings_preferences_${tenant.id}`,
        JSON.stringify(prefs)
      );
    }

    if (onSaveTenant) {
      onSaveTenant({
        currency: prefs.currency,
      });
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>PREFERÊNCIAS OPERACIONAIS & COMPORTAMENTO DO POS</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {prefs.currency} ({prefs.currencySymbol})
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Moeda, idioma, casas decimais, arredondamentos, formato de data/hora e comportamento da frente de caixa
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Preferências</span>
          </button>
        )}
      </div>

      {isSaved && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4" />
          <span>Preferências operacionais guardadas com sucesso.</span>
        </div>
      )}

      {/* 1. Moeda, Idioma, Casas Decimais & Arredondamentos */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              1. Moeda, Idioma, Casas Decimais & Arredondamentos
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Moeda */}
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Moeda Principal do Estabelecimento
            </label>
            <select
              disabled={!canEdit}
              value={prefs.currency}
              onChange={(e) => {
                const cur = e.target.value;
                let sym = 'Kz';
                if (cur === 'EUR') sym = '€';
                else if (cur === 'USD') sym = '$';
                else if (cur === 'BRL') sym = 'R$';
                setPrefs({ ...prefs, currency: cur, currencySymbol: sym });
              }}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
            >
              <option value="AOA">Kwanza Angolano (AOA - Kz)</option>
              <option value="EUR">Euro (€ - União Europeia / Portugal)</option>
              <option value="USD">Dólar Americano ($ - USD)</option>
              <option value="BRL">Real Brasileiro (R$ - BRL)</option>
            </select>
          </div>

          {/* Idioma */}
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Idioma da Interface
            </label>
            <select
              disabled={!canEdit}
              value={prefs.language}
              onChange={(e) => setPrefs({ ...prefs, language: e.target.value as any })}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
            >
              <option value="pt-AO">Português (Angola / África)</option>
              <option value="pt-PT">Português (Portugal)</option>
              <option value="en-US">English (International)</option>
            </select>
          </div>

          {/* Casas Decimais */}
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Casas Decimais de Preço
            </label>
            <select
              disabled={!canEdit}
              value={prefs.decimalPlaces}
              onChange={(e) => setPrefs({ ...prefs, decimalPlaces: Number(e.target.value) })}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
            >
              <option value={0}>0 Casas (Ex: 1 500 Kz)</option>
              <option value={2}>2 Casas Decimais (Ex: 1 500,00 Kz - Padrão)</option>
              <option value={3}>3 Casas Decimais (Ex: 1 500,000 Kz - Combustíveis)</option>
            </select>
          </div>

          {/* Regra de Arredondamento */}
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Regra de Arredondamento Comercial
            </label>
            <select
              disabled={!canEdit}
              value={prefs.roundingMethod}
              onChange={(e) => setPrefs({ ...prefs, roundingMethod: e.target.value as any })}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
            >
              <option value="HALF_UP">Arredondamento Matemático Padrão (Half Up)</option>
              <option value="NEAREST_5">Múltiplo de 5 mais próximo (Ex: 5, 10 Kz)</option>
              <option value="NEAREST_10">Múltiplo de 10 mais próximo (Ex: 10, 20 Kz)</option>
              <option value="CEIL">Arredondar sempre para cima (Teto)</option>
              <option value="FLOOR">Arredondar sempre para baixo (Piso)</option>
              <option value="NONE">Sem Arredondamento (Exato)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Formato de Data & Hora */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              2. Formato de Data & Hora e Regionalização
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Fuso Horário Operacional
            </label>
            <select
              disabled={!canEdit}
              value={prefs.timezone}
              onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
            >
              <option value="Africa/Luanda (GMT+1)">África / Luanda (WAT / GMT+1)</option>
              <option value="Europe/Lisbon (GMT+0)">Europa / Lisboa (WET / GMT+0)</option>
              <option value="Africa/Maputo (GMT+2)">África / Maputo (CAT / GMT+2)</option>
              <option value="America/Sao_Paulo (GMT-3)">América / São Paulo (GMT-3)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Formato de Exibição de Data
            </label>
            <select
              disabled={!canEdit}
              value={prefs.dateFormat}
              onChange={(e) => setPrefs({ ...prefs, dateFormat: e.target.value })}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
            >
              <option value="DD/MM/YYYY">DD/MM/AAAA (Ex: 29/08/2026 - Padrão)</option>
              <option value="YYYY-MM-DD">AAAA-MM-DD (Ex: 2026-08-29 - ISO)</option>
              <option value="MM/DD/YYYY">MM/DD/AAAA (Ex: 08/29/2026 - US)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">
              Formato de Hora
            </label>
            <select
              disabled={!canEdit}
              value={prefs.timeFormat}
              onChange={(e) => setPrefs({ ...prefs, timeFormat: e.target.value as any })}
              className="w-full bg-[#121215] border border-[#27272a] disabled:opacity-60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
            >
              <option value="24H">24 Horas (Ex: 14:30 - Padrão Comercial)</option>
              <option value="12H">12 Horas AM/PM (Ex: 02:30 PM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Comportamento do POS & Frente de Caixa */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              3. Comportamento da Frente de Caixa (POS)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Ergonomia & Velocidade de Atendimento</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* Auto-foco scanner */}
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.posBehavior.autoFocusBarcode}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  posBehavior: { ...prefs.posBehavior, autoFocusBarcode: e.target.checked },
                })
              }
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-foco no Leitor de Código</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Mantém o cursor ativo no campo de leitura rápida para scanning contínuo de artigos
              </div>
            </div>
          </label>

          {/* Som de bip */}
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.posBehavior.playScannerBeep}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  posBehavior: { ...prefs.posBehavior, playScannerBeep: e.target.checked },
                })
              }
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Feedback Sonoro (Beep de Leitura)</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Emite sinal sonoro suave a cada artigo lido com sucesso e alerta sonoro em erros
              </div>
            </div>
          </label>

          {/* Confirmação de anulação de linha */}
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.posBehavior.confirmLineRemoval}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  posBehavior: { ...prefs.posBehavior, confirmLineRemoval: e.target.checked },
                })
              }
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Pedir Confirmação ao Anular Linha</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Evita toques acidentais solicitando confirmação prévia antes de remover um item do carrinho
              </div>
            </div>
          </label>

          {/* Botões de notas rápidas */}
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.posBehavior.enableQuickCashButtons}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  posBehavior: { ...prefs.posBehavior, enableQuickCashButtons: e.target.checked },
                })
              }
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Atalhos de Notas Rápidas</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Exibe botões rápidos com notas correntes (1 000, 2 000, 5 000 Kz) para cálculo veloz de troco
              </div>
            </div>
          </label>

          {/* Badges de stock na grelha */}
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.posBehavior.showStockBadgesInGrid}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  posBehavior: { ...prefs.posBehavior, showStockBadgesInGrid: e.target.checked },
                })
              }
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Exibir Quantidade em Stock nos Artigos</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Mostra badge com unidades físicas disponíveis diretamente no catálogo tátil
              </div>
            </div>
          </label>

          {/* Venda direta sem cliente */}
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600 transition-colors">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.posBehavior.directSaleWithoutCustomer}
              onChange={(e) =>
                setPrefs({
                  ...prefs,
                  posBehavior: { ...prefs.posBehavior, directSaleWithoutCustomer: e.target.checked },
                })
              }
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Venda Direta a Consumidor Final</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Permite faturar imediatamente a &quot;Consumidor Final (999999999)&quot; sem obrigar seleção prévia
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 4. Modo de Operação & Segmento de Ponto de Venda */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              4. Modo de Operação do Ponto de Venda
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPrefs({ ...prefs, salesMode: 'RESTAURANT_BAR' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              prefs.salesMode === 'RESTAURANT_BAR'
                ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="text-xs font-bold">Restauração & Bar (Mesas)</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Planta de mesas, pedidos à cozinha/bar, divisão de contas e cartões de consumo
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPrefs({ ...prefs, salesMode: 'RETAIL_SUPERMARKET' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              prefs.salesMode === 'RETAIL_SUPERMARKET'
                ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="text-xs font-bold">Retalho & Supermercado</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Foco em velocidade de leitura de código de barras, balança de check-out e filas rápidas
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPrefs({ ...prefs, salesMode: 'SERVICES_APPOINTMENTS' })}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              prefs.salesMode === 'SERVICES_APPOINTMENTS'
                ? 'bg-emerald-500/15 border-emerald-500 text-white font-bold'
                : 'bg-[#121215] border-[#27272a] text-slate-300 hover:border-slate-600'
            }`}
          >
            <div className="text-xs font-bold">Prestação de Serviços & Marcações</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Marcação por profissional, comissões por colaborador e faturação com retenção na fonte 6.5%
            </div>
          </button>
        </div>
      </div>

      {/* 5. Regras de Stock & Faturação */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              5. Políticas de Gestão de Stock & Vendas
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.allowNegativeStock}
              onChange={(e) => setPrefs({ ...prefs, allowNegativeStock: e.target.checked })}
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Permitir Venda com Stock Negativo</div>
              <div className="text-[10px] text-slate-400">
                Permite continuar a vender mesmo quando a contagem de stock atinge zero (com aviso)
              </div>
            </div>
          </label>

          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.warnLowStock}
              onChange={(e) => setPrefs({ ...prefs, warnLowStock: e.target.checked })}
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Alerta Visual de Stock Mínimo</div>
              <div className="text-[10px] text-slate-400">
                Exibe badge âmbar no ecrã de vendas quando o artigo está próximo do ponto de encomenda
              </div>
            </div>
          </label>

          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.blockExpiredSales}
              onChange={(e) => setPrefs({ ...prefs, blockExpiredSales: e.target.checked })}
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Bloquear Venda de Lotes Expirados</div>
              <div className="text-[10px] text-slate-400">
                Impede o registo de artigos com data de validade ultrapassada (segurança alimentar)
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 6. Segurança, Turnos & Auditoria de Caixa */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-xs uppercase font-mono text-white">
              6. Segurança de Turnos & Auditoria de Caixa
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.requireShiftOpeningFloat}
              onChange={(e) => setPrefs({ ...prefs, requireShiftOpeningFloat: e.target.checked })}
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Exigir Fundo de Maneio na Abertura</div>
              <div className="text-[10px] text-slate-400">
                O operador deve declarar o valor em dinheiro inicial antes de iniciar as vendas
              </div>
            </div>
          </label>

          <label className="p-3 bg-[#121215] border border-[#27272a] rounded-lg cursor-pointer flex items-start gap-2.5 hover:border-slate-600">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={prefs.blindShiftClosing}
              onChange={(e) => setPrefs({ ...prefs, blindShiftClosing: e.target.checked })}
              className="mt-0.5 rounded text-emerald-500"
            />
            <div>
              <div className="font-bold text-white">Fecho Cego de Caixa (Blind Close)</div>
              <div className="text-[10px] text-slate-400">
                O operador introduz a contagem física sem ver o total do sistema, prevenindo fraudes
              </div>
            </div>
          </label>

          <div className="p-3 bg-[#121215] border border-[#27272a] rounded-lg space-y-1.5">
            <div className="font-bold text-white">Bloqueio Automático por Inatividade</div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min={1}
                max={120}
                disabled={!canEdit}
                value={prefs.autoLockScreenMinutes}
                onChange={(e) => setPrefs({ ...prefs, autoLockScreenMinutes: Number(e.target.value) })}
                className="w-16 bg-[#18181b] border border-[#27272a] rounded px-2 py-1 text-white font-mono text-center outline-none focus:border-emerald-500"
              />
              <span className="text-[11px] text-slate-400">minutos até bloquear</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
