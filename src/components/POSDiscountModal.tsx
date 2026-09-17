import React, { useState } from 'react';
import { X, Percent, ShieldCheck, AlertCircle, CheckCircle2, Lock, Trash2 } from 'lucide-react';
import { User } from '../types/pulse';

interface POSDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currency: string;
  currentUser: User;
  onApplyDiscount: (discountPercent: number, authorizedBy: string) => void;
}

export const POSDiscountModal: React.FC<POSDiscountModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  currency,
  currentUser,
  onApplyDiscount,
}) => {
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<number>(5);
  const [managerPin, setManagerPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickPercentages = [3, 5, 10, 15, 20, 25];

  // Calculate actual percentage
  const effectivePercent =
    discountType === 'PERCENT'
      ? discountValue
      : subtotal > 0
      ? (discountValue / subtotal) * 100
      : 0;

  const requiresManagerAuth = effectivePercent > 10 && currentUser.role === 'cashier';

  const handleApply = () => {
    setPinError(null);

    if (effectivePercent < 0 || effectivePercent > 100) {
      setPinError('O desconto deve estar entre 0% e 100%.');
      return;
    }

    if (requiresManagerAuth) {
      if (managerPin !== '1234' && managerPin !== currentUser.pin) {
        setPinError('PIN de Gestor/Supervisor inválido. Digite 1234 para autorizar.');
        return;
      }
    }

    const authorizedBy = requiresManagerAuth ? 'Gerente / Supervisor (Autorizado)' : currentUser.name;
    onApplyDiscount(effectivePercent, authorizedBy);
    onClose();
  };

  const discountAmountKz = (subtotal * effectivePercent) / 100;
  const newSubtotal = Math.max(0, subtotal - discountAmountKz);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-[#14141a] border border-slate-700 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Desconto Comercial Autorizado
              </h3>
              <p className="text-[10px] text-slate-400">
                Aplicação de abatimento fiscal e comercial
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

        {/* Discount Type Toggle */}
        <div className="grid grid-cols-2 gap-2 bg-[#1b1b22] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setDiscountType('PERCENT');
              setDiscountValue(5);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
              discountType === 'PERCENT'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Percentual (%)
          </button>
          <button
            onClick={() => {
              setDiscountType('FIXED');
              setDiscountValue(subtotal > 0 ? Math.round(subtotal * 0.05) : 1000);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
              discountType === 'FIXED'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Valor Fixo ({currency})
          </button>
        </div>

        {/* Quick percentage buttons */}
        {discountType === 'PERCENT' && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              Atalhos Rápidos de Desconto:
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {quickPercentages.map((pct) => (
                <button
                  key={pct}
                  onClick={() => setDiscountValue(pct)}
                  className={`py-2 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                    discountValue === pct
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-[#1b1b22] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Direct Input */}
        <div className="space-y-1.5">
          <label className="block text-[11px] text-slate-300 font-bold">
            {discountType === 'PERCENT' ? 'Percentagem de Desconto (%):' : `Valor de Desconto (${currency}):`}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={discountType === 'PERCENT' ? 100 : subtotal}
              value={discountValue}
              onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-400"
            />
            <span className="font-bold text-slate-400 text-sm">
              {discountType === 'PERCENT' ? '%' : currency}
            </span>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="bg-[#18181f] border border-slate-800 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal Bruto:</span>
            <span className="font-bold text-slate-200">{subtotal.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between text-rose-400">
            <span>Abatimento Concedido ({effectivePercent.toFixed(1)}%):</span>
            <span className="font-bold">-{discountAmountKz.toLocaleString()} {currency}</span>
          </div>
          <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1.5 text-sm">
            <span>Novo Total a Pagar:</span>
            <span className="font-mono">{newSubtotal.toLocaleString()} {currency}</span>
          </div>
        </div>

        {/* Manager PIN authorization if exceeding 10% */}
        {requiresManagerAuth && (
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Lock className="w-4 h-4" />
              <span>Autorização de Gestor Exigida (Desconto &gt; 10%)</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Operadores de caixa requerem validação por PIN de supervisor para descontos superiores a 10%.
            </p>
            <input
              type="password"
              placeholder="PIN do Gestor (ex: 1234)..."
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/30 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        )}

        {pinError && (
          <div className="flex items-center gap-1.5 text-rose-400 text-xs bg-rose-950/30 p-2 rounded-lg border border-rose-500/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onApplyDiscount(0, currentUser.name);
              onClose();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg font-semibold text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remover</span>
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aplicar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
