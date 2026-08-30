import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Monitor,
  Phone,
  Mail,
  Sliders,
  Check,
} from 'lucide-react';
import { ExtendedUser } from '../../types/settings';
import { User, UserRole } from '../../types/pulse';
import { UserModal } from './UserModal';

interface UsersPermissionsSectionProps {
  currentUser: User;
  canEdit: boolean;
}

const defaultInitialUsers: ExtendedUser[] = [
  {
    uid: 'usr_owner_01',
    name: 'Alex Silva',
    email: 'alex.silva@pulsecommerce.ao',
    phone: '+244 923 111 222',
    role: 'tenant_owner',
    branchId: 'branch_marginal',
    pin: '9001',
    status: 'ACTIVE',
    allowedTerminals: ['*'],
    permissions: {
      canGiveDiscount: true,
      maxDiscountPercent: 100,
      canCancelLines: true,
      canCancelDocuments: true,
      canOpenDrawerManual: true,
      canViewReports: true,
      canChangePrices: true,
      canManageStockPurchases: true,
      canReprintDocuments: true,
      canManageUsers: true,
    },
    createdAt: '2025-01-15',
    lastLogin: 'Hoje às 16:15',
  },
  {
    uid: 'usr_mgr_01',
    name: 'Sarah Santos',
    email: 'sarah.gerente@pulsecommerce.ao',
    phone: '+244 923 333 444',
    role: 'manager',
    branchId: 'branch_marginal',
    pin: '5678',
    status: 'ACTIVE',
    allowedTerminals: ['*'],
    permissions: {
      canGiveDiscount: true,
      maxDiscountPercent: 25,
      canCancelLines: true,
      canCancelDocuments: true,
      canOpenDrawerManual: true,
      canViewReports: true,
      canChangePrices: true,
      canManageStockPurchases: true,
      canReprintDocuments: true,
      canManageUsers: true,
    },
    createdAt: '2025-02-01',
    lastLogin: 'Hoje às 15:40',
  },
  {
    uid: 'usr_cashier_01',
    name: 'João Manuel',
    email: 'joao.caixa@pulsecommerce.ao',
    phone: '+244 931 555 666',
    role: 'cashier',
    branchId: 'branch_marginal',
    pin: '1234',
    status: 'ACTIVE',
    allowedTerminals: ['POS-01', 'POS-02'],
    permissions: {
      canGiveDiscount: true,
      maxDiscountPercent: 10,
      canCancelLines: true,
      canCancelDocuments: false,
      canOpenDrawerManual: true,
      canViewReports: false,
      canChangePrices: false,
      canManageStockPurchases: false,
      canReprintDocuments: true,
      canManageUsers: false,
    },
    createdAt: '2025-03-10',
    lastLogin: 'Hoje às 16:30 (Sessão Ativa)',
  },
  {
    uid: 'usr_seller_01',
    name: 'Mateus Castro',
    email: 'mateus.vendas@pulsecommerce.ao',
    phone: '+244 944 777 888',
    role: 'seller',
    branchId: 'branch_marginal',
    pin: '4321',
    status: 'ACTIVE',
    allowedTerminals: ['TABLET-01'],
    permissions: {
      canGiveDiscount: false,
      maxDiscountPercent: 0,
      canCancelLines: true,
      canCancelDocuments: false,
      canOpenDrawerManual: false,
      canViewReports: false,
      canChangePrices: false,
      canManageStockPurchases: false,
      canReprintDocuments: true,
      canManageUsers: false,
    },
    createdAt: '2025-04-12',
    lastLogin: 'Ontem às 19:20',
  },
];

export const UsersPermissionsSection: React.FC<UsersPermissionsSectionProps> = ({
  currentUser,
  canEdit,
}) => {
  const [users, setUsers] = useState<ExtendedUser[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pulse_settings_users');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return defaultInitialUsers;
  });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const saveUsers = (updated: ExtendedUser[]) => {
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pulse_settings_users', JSON.stringify(updated));
    }
  };

  const handleCreateOrUpdate = (userData: Partial<ExtendedUser>) => {
    if (editingUser) {
      const updated = users.map((u) =>
        u.uid === editingUser.uid ? ({ ...u, ...userData } as ExtendedUser) : u
      );
      saveUsers(updated);
      showToast('Operador atualizado com sucesso.');
    } else {
      const newUser: ExtendedUser = {
        uid: `usr_${Date.now()}`,
        name: userData.name || 'Novo Utilizador',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'cashier',
        branchId: 'branch_marginal',
        pin: userData.pin || '1234',
        status: userData.status || 'ACTIVE',
        allowedTerminals: userData.allowedTerminals || ['*'],
        permissions: userData.permissions || {
          canGiveDiscount: false,
          maxDiscountPercent: 0,
          canCancelLines: true,
          canCancelDocuments: false,
          canOpenDrawerManual: true,
          canViewReports: false,
          canChangePrices: false,
          canManageStockPurchases: false,
          canReprintDocuments: true,
          canManageUsers: false,
        },
        createdAt: new Date().toISOString().split('T')[0],
      };
      saveUsers([...users, newUser]);
      showToast('Novo operador criado com sucesso.');
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleToggleStatus = (uid: string) => {
    if (!canEdit) return;
    const updated = users.map((u) => {
      if (u.uid === uid) {
        const nextStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return { ...u, status: nextStatus as 'ACTIVE' | 'INACTIVE' };
      }
      return u;
    });
    saveUsers(updated);
    showToast('Estado do utilizador atualizado.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'tenant_owner':
        return <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold">ADMIN / PROPRIETÁRIO</span>;
      case 'manager':
        return <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold">GERENTE DE LOJA</span>;
      case 'cashier':
        return <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold">OPERADOR DE CAIXA</span>;
      case 'seller':
        return <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold">COMERCIAL / VENDAS</span>;
      case 'viewer':
        return <span className="bg-slate-500/10 border border-slate-500/30 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded font-bold">AUDITOR / LEITURA</span>;
      default:
        return <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded font-mono">{role}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <span>Utilizadores, Perfis & Permissões Granulares</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {users.length} Registados
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Gestão de credenciais, PINs de acesso rápido POS e matriz de segurança
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Operador</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121215] border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#121215] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas as Funções</option>
            <option value="tenant_owner">Administrador</option>
            <option value="manager">Gerente de Loja</option>
            <option value="cashier">Operador de Caixa</option>
            <option value="seller">Comercial / Vendedor</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121215] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="INACTIVE">Apenas Inativos</option>
          </select>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Users Directory Table */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#121215] border-b border-[#27272a] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Operador / Identificação</th>
                <th className="p-3">Perfil / Função</th>
                <th className="p-3">Acesso POS (PIN)</th>
                <th className="p-3">Terminais Permitidos</th>
                <th className="p-3">Permissões Chave</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a] text-slate-200">
              {filteredUsers.map((u) => {
                const isCurrent = u.uid === currentUser.uid;
                const isActive = u.status === 'ACTIVE';

                return (
                  <tr key={u.uid} className="hover:bg-[#202025] transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isCurrent && (
                              <span className="text-[9px] bg-emerald-500 text-slate-950 font-extrabold px-1.5 py-0.2 rounded">
                                VOCÊ
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                            <span>{u.email}</span>
                            {u.phone && <span>• {u.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">{getRoleBadge(u.role)}</td>

                    <td className="p-3 font-mono">
                      <span className="bg-[#121215] border border-[#27272a] px-2 py-0.5 rounded text-slate-300 tracking-widest text-[11px]">
                        •••• {u.pin.slice(-2)}
                      </span>
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      {u.allowedTerminals.includes('*') ? (
                        <span className="text-emerald-400">Todos os Terminais</span>
                      ) : (
                        u.allowedTerminals.join(', ')
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 text-[9.5px] font-mono text-slate-400">
                        {u.permissions.canGiveDiscount && (
                          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            Desc. {u.permissions.maxDiscountPercent}%
                          </span>
                        )}
                        {u.permissions.canCancelDocuments && (
                          <span className="bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                            Anular Docs
                          </span>
                        )}
                        {u.permissions.canOpenDrawerManual && (
                          <span className="bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30">
                            Abrir Gaveta
                          </span>
                        )}
                        {u.permissions.canViewReports && (
                          <span className="bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Relatórios
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(u.uid)}
                        disabled={!canEdit || isCurrent}
                        className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ativo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Inativo</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#121215] hover:bg-[#27272a] border border-[#27272a] text-slate-300 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Edit / Create Modal */}
      <UserModal
        user={editingUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleCreateOrUpdate}
      />
    </div>
  );
};
