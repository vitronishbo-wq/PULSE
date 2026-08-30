import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Printer,
  ShieldCheck,
  Users,
  Monitor,
  CreditCard,
  Sliders,
  Lock,
} from 'lucide-react';
import { TenantProfile, User } from '../types/pulse';
import { CompanySettingsSection } from './settings/CompanySettingsSection';
import { PrintersReceiptsSection } from './settings/PrintersReceiptsSection';
import { UsersPermissionsSection } from './settings/UsersPermissionsSection';
import { TerminalsDevicesSection } from './settings/TerminalsDevicesSection';
import { PaymentMethodsSection } from './settings/PaymentMethodsSection';
import { OperationalPreferencesSection } from './settings/OperationalPreferencesSection';

interface TenantSettingsViewProps {
  tenant: TenantProfile;
  currentUser: User;
  onUpdateTenant?: (updated: Partial<TenantProfile>) => void;
  subView?: string;
}

export type SettingsTabType =
  | 'GENERAL'
  | 'PRINTERS'
  | 'USERS'
  | 'DEVICES'
  | 'PAYMENTS'
  | 'PREFERENCES';

export const TenantSettingsView: React.FC<TenantSettingsViewProps> = ({
  tenant,
  currentUser,
  onUpdateTenant,
  subView = 'GENERAL',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(() => {
    if (subView === 'PRINTERS') return 'PRINTERS';
    if (subView === 'USERS') return 'USERS';
    if (subView === 'DEVICES') return 'DEVICES';
    if (subView === 'PAYMENTS') return 'PAYMENTS';
    if (subView === 'PREFERENCES') return 'PREFERENCES';
    return 'GENERAL';
  });

  useEffect(() => {
    if (subView === 'PRINTERS') setActiveTab('PRINTERS');
    else if (subView === 'USERS') setActiveTab('USERS');
    else if (subView === 'DEVICES') setActiveTab('DEVICES');
    else if (subView === 'PAYMENTS') setActiveTab('PAYMENTS');
    else if (subView === 'PREFERENCES') setActiveTab('PREFERENCES');
    else if (subView === 'GENERAL') setActiveTab('GENERAL');
  }, [subView]);

  const canEdit = ['platform_admin', 'tenant_owner', 'manager'].includes(currentUser.role);
  const canViewUsers = ['platform_admin', 'tenant_owner', 'manager', 'cashier'].includes(currentUser.role);

  const handleSaveTenantUpdates = (updated: Partial<TenantProfile>) => {
    if (onUpdateTenant) {
      onUpdateTenant(updated);
    }
  };

  return (
    <div id="pulse-tenant-settings-view" className="space-y-3 font-sans text-xs">
      {/* Header Compacto com Navegação das 6 Categorias */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span>CONFIGURAÇÕES DO ESTABELECIMENTO</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {tenant.tradeName || tenant.name}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Operador Ativo: {currentUser.name} ({currentUser.role.toUpperCase()})
            </div>
          </div>
        </div>

        {/* 6 Tabs de Configuração */}
        <div className="flex items-center gap-1 bg-[#121215] p-1 rounded-xl border border-[#27272a] overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'GENERAL'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Estabelecimento</span>
          </button>

          <button
            onClick={() => setActiveTab('PRINTERS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PRINTERS'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Impressoras & Recibos</span>
          </button>

          {canViewUsers && (
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'USERS'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#18181b]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Utilizadores & Permissões</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('DEVICES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'DEVICES'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Terminais & Dispositivos</span>
          </button>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PAYMENTS'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Meios de Pagamento</span>
          </button>

          <button
            onClick={() => setActiveTab('PREFERENCES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'PREFERENCES'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-[#18181b]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferências</span>
          </button>
        </div>
      </div>

      {/* Main Tab Renderings */}
      {activeTab === 'GENERAL' && (
        <CompanySettingsSection
          tenant={tenant}
          canEdit={canEdit}
          onSave={handleSaveTenantUpdates}
        />
      )}

      {activeTab === 'PRINTERS' && (
        <PrintersReceiptsSection
          tenant={tenant}
          canEdit={canEdit}
          onSaveTenant={handleSaveTenantUpdates}
        />
      )}

      {activeTab === 'USERS' && canViewUsers && (
        <UsersPermissionsSection
          currentUser={currentUser}
          canEdit={canEdit}
        />
      )}

      {activeTab === 'DEVICES' && (
        <TerminalsDevicesSection
          canEdit={canEdit}
        />
      )}

      {activeTab === 'PAYMENTS' && (
        <PaymentMethodsSection
          canEdit={canEdit}
        />
      )}

      {activeTab === 'PREFERENCES' && (
        <OperationalPreferencesSection
          tenant={tenant}
          canEdit={canEdit}
          onSaveTenant={handleSaveTenantUpdates}
        />
      )}
    </div>
  );
};
