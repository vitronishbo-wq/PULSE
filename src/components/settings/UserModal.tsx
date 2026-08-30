import React, { useState } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  KeyRound,
  Mail,
  Phone,
  Monitor,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ExtendedUser } from '../../types/settings';
import { UserRole } from '../../types/pulse';

interface UserModalProps {
  user?: ExtendedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: Partial<ExtendedUser>) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+244 923 000 000');
  const [role, setRole] = useState<UserRole>(user?.role || 'cashier');
  const [pin, setPin] = useState(user?.pin || '1234');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>(user?.status || 'ACTIVE');
  const [allowedTerminals, setAllowedTerminals] = useState<string[]>(
    user?.allowedTerminals || ['*']
  );

  // Granular Permissions
  const [canGiveDiscount, setCanGiveDiscount] = useState(
    user?.permissions?.canGiveDiscount ?? (role === 'manager' || role === 'tenant_owner')
  );
  const [maxDiscountPercent, setMaxDiscountPercent] = useState(
    user?.permissions?.maxDiscountPercent ?? 10
  );
  const [canCancelLines, setCanCancelLines] = useState(
    user?.permissions?.canCancelLines ?? (role !== 'viewer')
  );
  const [canCancelDocuments, setCanCancelDocuments] = useState(
    user?.permissions?.canCancelDocuments ?? (role === 'manager' || role === 'tenant_owner')
  );
  const [canOpenDrawerManual, setCanOpenDrawerManual] = useState(
    user?.permissions?.canOpenDrawerManual ?? (role !== 'seller')
  );
  const [canViewReports, setCanViewReports] = useState(
    user?.permissions?.canViewReports ?? (role === 'manager' || role === 'tenant_owner')
  );
  const [canChangePrices, setCanChangePrices] = useState(
    user?.permissions?.canChangePrices ?? (role === 'manager' || role === 'tenant_owner')
  );
  const [canManageStockPurchases, setCanManageStockPurchases] = useState(
    user?.permissions?.canManageStockPurchases ?? (role === 'manager' || role === 'tenant_owner')
  );
  const [canReprintDocuments, setCanReprintDocuments] = useState(
    user?.permissions?.canReprintDocuments ?? true
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      email,
      phone,
      role,
      pin,
      status,
      allowedTerminals,
      permissions: {
        canGiveDiscount,
        maxDiscountPercent,
        canCancelLines,
        canCancelDocuments,
        canOpenDrawerManual,
        canViewReports,
        canChangePrices,
        canManageStockPurchases,
        canReprintDocuments,
        canManageUsers: role === 'tenant_owner' || role === 'manager',
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#27272a] flex items-center justify-between bg-[#121215]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {user ? 'Editar Operador / Utilizador' : 'Criar Novo Operador / Utilizador'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Definição de perfil, credenciais de acesso e matriz de permissões
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Identificação */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Nome Completo do Operador <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Manuel Silva"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Email de Acesso / Login <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: manuel@empresa.ao"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Função / Perfil de Acesso <span className="text-rose-400">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
              >
                <option value="cashier">Operador de Caixa (Frente de Loja / POS)</option>
                <option value="seller">Comercial / Vendedor (Orçamentos & Balcão)</option>
                <option value="manager">Gerente de Loja (Aprovações & Fecho)</option>
                <option value="tenant_owner">Administrador do Estabelecimento (Acesso Total)</option>
                <option value="viewer">Auditor / Consultor (Apenas Leitura)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                PIN de Acesso Rápido POS (4 a 6 Dígitos) <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Telefone / Telemóvel
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Estado da Conta
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500 font-medium"
              >
                <option value="ACTIVE">● Ativo (Acesso Autorizado)</option>
                <option value="INACTIVE">○ Inativo (Acesso Bloqueado)</option>
              </select>
            </div>
          </div>

          {/* Acessos por Terminal */}
          <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 space-y-2">
            <div className="font-bold text-xs text-white font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-sky-400" />
                Acesso por Terminais POS
              </span>
              <span className="text-[10px] text-slate-400">Restrições de Hardware</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label className="flex items-center gap-2 p-2 bg-[#18181b] border border-[#27272a] rounded cursor-pointer hover:border-slate-600">
                <input
                  type="checkbox"
                  checked={allowedTerminals.includes('*')}
                  onChange={(e) => {
                    if (e.target.checked) setAllowedTerminals(['*']);
                    else setAllowedTerminals(['POS-01']);
                  }}
                  className="rounded text-emerald-500"
                />
                <span className="text-white font-semibold">Todos os Terminais</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-[#18181b] border border-[#27272a] rounded cursor-pointer hover:border-slate-600">
                <input
                  type="checkbox"
                  disabled={allowedTerminals.includes('*')}
                  checked={allowedTerminals.includes('*') || allowedTerminals.includes('POS-01')}
                  onChange={(e) => {
                    const current = allowedTerminals.filter((t) => t !== '*');
                    if (e.target.checked) setAllowedTerminals([...current, 'POS-01']);
                    else setAllowedTerminals(current.filter((t) => t !== 'POS-01'));
                  }}
                  className="rounded text-emerald-500"
                />
                <span>POS 01 - Balcão</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-[#18181b] border border-[#27272a] rounded cursor-pointer hover:border-slate-600">
                <input
                  type="checkbox"
                  disabled={allowedTerminals.includes('*')}
                  checked={allowedTerminals.includes('*') || allowedTerminals.includes('POS-02')}
                  onChange={(e) => {
                    const current = allowedTerminals.filter((t) => t !== '*');
                    if (e.target.checked) setAllowedTerminals([...current, 'POS-02']);
                    else setAllowedTerminals(current.filter((t) => t !== 'POS-02'));
                  }}
                  className="rounded text-emerald-500"
                />
                <span>POS 02 - Take Away</span>
              </label>

              <label className="flex items-center gap-2 p-2 bg-[#18181b] border border-[#27272a] rounded cursor-pointer hover:border-slate-600">
                <input
                  type="checkbox"
                  disabled={allowedTerminals.includes('*')}
                  checked={allowedTerminals.includes('*') || allowedTerminals.includes('TABLET-01')}
                  onChange={(e) => {
                    const current = allowedTerminals.filter((t) => t !== '*');
                    if (e.target.checked) setAllowedTerminals([...current, 'TABLET-01']);
                    else setAllowedTerminals(current.filter((t) => t !== 'TABLET-01'));
                  }}
                  className="rounded text-emerald-500"
                />
                <span>Tablet Móvel 01</span>
              </label>
            </div>
          </div>

          {/* Matriz Granular de Permissões */}
          <div className="bg-[#121215] border border-[#27272a] rounded-xl p-3 space-y-2.5">
            <div className="font-bold text-xs text-white font-mono flex items-center justify-between pb-1 border-b border-[#27272a]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Matriz Granular de Permissões Operacionais
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Controlo de Segurança</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Aplicar Descontos no POS</span>
                  <span className="text-[10px] text-slate-400">Atribuir desconto em linha ou global</span>
                </div>
                <div className="flex items-center gap-2">
                  {canGiveDiscount && (
                    <div className="flex items-center gap-1 bg-[#121215] px-1.5 py-0.5 rounded border border-[#27272a]">
                      <span className="text-[10px] text-slate-400 font-mono">Máx:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={maxDiscountPercent}
                        onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                        className="w-10 bg-transparent text-emerald-400 font-mono font-bold text-center outline-none"
                      />
                      <span className="text-[10px] text-slate-400">%</span>
                    </div>
                  )}
                  <input
                    type="checkbox"
                    checked={canGiveDiscount}
                    onChange={(e) => setCanGiveDiscount(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                </div>
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Anular Linhas no Carrinho</span>
                  <span className="text-[10px] text-slate-400">Remover artigos antes de fechar a conta</span>
                </div>
                <input
                  type="checkbox"
                  checked={canCancelLines}
                  onChange={(e) => setCanCancelLines(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Anular Documentos Fiscais Emitidos</span>
                  <span className="text-[10px] text-slate-400">Emissão de Nota de Crédito / Cancelamento</span>
                </div>
                <input
                  type="checkbox"
                  checked={canCancelDocuments}
                  onChange={(e) => setCanCancelDocuments(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Abertura Manual de Gaveta de Dinheiro</span>
                  <span className="text-[10px] text-slate-400">Pulso RJ11 sem registo de venda</span>
                </div>
                <input
                  type="checkbox"
                  checked={canOpenDrawerManual}
                  onChange={(e) => setCanOpenDrawerManual(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Acesso a Relatórios & Fecho de Turno X/Z</span>
                  <span className="text-[10px] text-slate-400">Consultar vendas acumuladas e sangrias</span>
                </div>
                <input
                  type="checkbox"
                  checked={canViewReports}
                  onChange={(e) => setCanViewReports(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Alterar Preços de Venda no POS</span>
                  <span className="text-[10px] text-slate-400">Modificar PVP na linha do documento</span>
                </div>
                <input
                  type="checkbox"
                  checked={canChangePrices}
                  onChange={(e) => setCanChangePrices(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Registar Compras & Entradas de Stock</span>
                  <span className="text-[10px] text-slate-400">Receção de mercadorias de fornecedores</span>
                </div>
                <input
                  type="checkbox"
                  checked={canManageStockPurchases}
                  onChange={(e) => setCanManageStockPurchases(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-2 bg-[#18181b] border border-[#27272a] rounded-lg">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Reimpressão de Documentos Fiscais</span>
                  <span className="text-[10px] text-slate-400">Imprimir segundas vias certificadas</span>
                </div>
                <input
                  type="checkbox"
                  checked={canReprintDocuments}
                  onChange={(e) => setCanReprintDocuments(e.target.checked)}
                  className="rounded text-emerald-500"
                />
              </label>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[#27272a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-[#121215] border border-[#27272a] hover:bg-[#27272a] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{user ? 'Atualizar Operador' : 'Gravar Operador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
