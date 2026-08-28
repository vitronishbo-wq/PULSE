import { BusinessSegment, ModuleId, TenantProfile, User, UserRole } from '../types/pulse';
import { BusinessProfileEngine } from '../engines/BusinessProfileEngine';

export interface NavLeafItem {
  id: string;
  label: string;
  targetTab:
    | 'POS'
    | 'KDS_TABLES'
    | 'BATCHES'
    | 'SERVICES_BILLING'
    | 'DOCS'
    | 'STOCK'
    | 'SUPPLIERS'
    | 'TREASURY'
    | 'HR'
    | 'EVENTBUS'
    | 'FISCAL'
    | 'SETTINGS';
  subView?: string;
  badge?: string;
  action?: () => void;
  requiredModule?: ModuleId;
  requiredRoles?: UserRole[];
  segmentSpecific?: BusinessSegment[];
}

export interface NavSubmodule {
  id: string;
  label: string;
  items: NavLeafItem[];
  requiredModule?: ModuleId;
  requiredRoles?: UserRole[];
  segmentSpecific?: BusinessSegment[];
}

export interface NavRootModule {
  id: string;
  label: string;
  iconName: string;
  submodules: NavSubmodule[];
  requiredModule?: ModuleId;
  requiredRoles?: UserRole[];
  segmentSpecific?: BusinessSegment[];
}

/**
 * Validates if a user role has permission to access a feature
 */
export function hasRolePermission(userRole: UserRole, requiredRoles?: UserRole[]): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  if (userRole === 'platform_admin' || userRole === 'tenant_owner') return true;
  return requiredRoles.includes(userRole);
}

/**
 * Resolves available tree navigation strictly based on:
 * 1. Business Profile / Segment
 * 2. Active Contracted Modules
 * 3. User Role & Permissions
 * 
 * Non-contracted, non-applicable or unauthorized items are completely omitted.
 */
export function resolveNavigationTree(
  tenant: TenantProfile,
  currentUser: User,
  onOpenQuickOp?: (type: any) => void
): NavRootModule[] {
  const profileEngine = BusinessProfileEngine.getInstance();
  const segment = tenant.segment || tenant.businessSegment || 'OTHER';
  const effectiveModules = profileEngine.getEffectiveModules(segment, tenant.activeModules);

  const isModuleActive = (modId?: ModuleId) => {
    if (!modId) return true;
    return effectiveModules.includes(modId);
  };

  const isSegmentAllowed = (allowedSegments?: BusinessSegment[]) => {
    if (!allowedSegments || allowedSegments.length === 0) return true;
    return allowedSegments.includes(segment);
  };

  const isPermitted = (roles?: UserRole[]) => {
    return hasRolePermission(currentUser.role, roles);
  };

  // 1. OPERAÇÕES
  const operacoesItems: NavLeafItem[] = [];
  if (isModuleActive('POS') && isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier', 'seller'])) {
    const posLabel =
      segment === 'RESTAURANT_BAR'
        ? 'POS Terminal Restaurante'
        : segment === 'PHARMACY'
        ? 'Balcão POS Farmacêutico'
        : segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING'
        ? 'POS Boutique & Caixa'
        : 'POS Terminal & Scanner';

    operacoesItems.push({
      id: 'leaf_pos',
      label: posLabel,
      targetTab: 'POS',
    });

    operacoesItems.push({
      id: 'leaf_pos_returns',
      label: 'Devoluções / Trocas',
      targetTab: 'POS',
      subView: 'RETURNS',
    });

    operacoesItems.push({
      id: 'leaf_pos_held_carts',
      label: 'Suspender / Retomar Venda',
      targetTab: 'POS',
      subView: 'HELD_CARTS',
    });

    operacoesItems.push({
      id: 'leaf_pos_shift_close',
      label: 'Fecho de Turno',
      targetTab: 'POS',
      subView: 'SHIFT_CLOSE',
    });
  }

  if (
    (segment === 'RESTAURANT_BAR' || isModuleActive('KDS_TABLES')) &&
    isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier'])
  ) {
    operacoesItems.push({
      id: 'leaf_kds',
      label: 'Mesas & Cozinha (KDS)',
      targetTab: 'KDS_TABLES',
      badge: 'Live',
    });
  }

  if (
    (segment === 'PHARMACY' || isModuleActive('BATCHES_RX')) &&
    isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier'])
  ) {
    operacoesItems.push({
      id: 'leaf_batches',
      label: 'Lotes, Validades & Rx',
      targetTab: 'BATCHES',
      badge: 'FEFO',
    });
  }

  if (
    (segment === 'SERVICES' || isModuleActive('RETENTION_6_5')) &&
    isPermitted(['platform_admin', 'tenant_owner', 'manager', 'seller'])
  ) {
    operacoesItems.push({
      id: 'leaf_services_billing',
      label: 'Faturação com Retenção 6.5%',
      targetTab: 'SERVICES_BILLING',
      badge: 'AGT',
    });
  }

  // 2. COMERCIAL
  const comercialItems: NavLeafItem[] = [
    {
      id: 'leaf_docs_all',
      label: 'Documentos Emitidos (FT, FR, NC)',
      targetTab: 'DOCS',
      subView: 'ALL',
    },
    {
      id: 'leaf_docs_quotations',
      label: 'Propostas & Orçamentos (PP)',
      targetTab: 'DOCS',
      subView: 'QUOTATIONS',
    },
    {
      id: 'leaf_docs_series',
      label: 'Séries & Numeração de Documentos',
      targetTab: 'DOCS',
      subView: 'SERIES',
    },
  ];

  // 3. PRODUTOS & STOCK
  const stockItems: NavLeafItem[] = [];
  if (isModuleActive('PRODUCTS') && isPermitted(['platform_admin', 'tenant_owner', 'manager', 'seller', 'viewer'])) {
    stockItems.push({
      id: 'leaf_stock_products',
      label: 'Produtos & Serviços',
      targetTab: 'STOCK',
      subView: 'PRODUCTS',
    });
    stockItems.push({
      id: 'leaf_stock_categories',
      label: 'Categorias',
      targetTab: 'STOCK',
      subView: 'CATEGORIES',
    });
    stockItems.push({
      id: 'leaf_stock_current',
      label: 'Stock Atual',
      targetTab: 'STOCK',
      subView: 'STOCK_CURRENT',
    });
  }

  if (isModuleActive('STOCK') && isPermitted(['platform_admin', 'tenant_owner', 'manager'])) {
    stockItems.push({
      id: 'leaf_stock_adjustments',
      label: 'Movimentos / Ajustes',
      targetTab: 'STOCK',
      subView: 'ADJUSTMENTS',
    });
    stockItems.push({
      id: 'leaf_stock_inventory',
      label: 'Inventário',
      targetTab: 'STOCK',
      subView: 'INVENTORY',
    });
  }

  // 4. FORNECEDORES
  const fornecedoresItems: NavLeafItem[] = [];
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier'])) {
    fornecedoresItems.push({
      id: 'leaf_suppliers_list',
      label: 'Ficheiro de Fornecedores',
      targetTab: 'SUPPLIERS',
      subView: 'DIRECTORY',
    });
    fornecedoresItems.push({
      id: 'leaf_suppliers_purchases',
      label: 'Compras / Entradas',
      targetTab: 'SUPPLIERS',
      subView: 'PURCHASES',
    });
    fornecedoresItems.push({
      id: 'leaf_suppliers_ledger',
      label: 'Histórico / Conta-Corrente',
      targetTab: 'SUPPLIERS',
      subView: 'LEDGER',
    });
  }

  // 5. FINANÇAS
  const financasItems: NavLeafItem[] = [];
  if (isModuleActive('TREASURY') && isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier'])) {
    financasItems.push({
      id: 'leaf_treasury_receivables',
      label: 'Recebimentos',
      targetTab: 'TREASURY',
      subView: 'RECEIVABLES',
    });
    financasItems.push({
      id: 'leaf_treasury_payables',
      label: 'Pagamentos',
      targetTab: 'TREASURY',
      subView: 'PAYABLES',
    });
    financasItems.push({
      id: 'leaf_treasury_cash_movements',
      label: 'Movimentos de Caixa',
      targetTab: 'TREASURY',
      subView: 'CASH',
    });
    if (isPermitted(['platform_admin', 'tenant_owner', 'manager'])) {
      financasItems.push({
        id: 'leaf_treasury_bank',
        label: 'Contas Bancárias & TPA',
        targetTab: 'TREASURY',
        subView: 'BANKS',
      });
    }
  }

  // 6. CLIENTES
  const clientesItems: NavLeafItem[] = [];
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier', 'seller'])) {
    clientesItems.push({
      id: 'leaf_customers_list',
      label: 'Ficheiro de Clientes & NIF',
      targetTab: 'DOCS',
      subView: 'CUSTOMERS',
    });
    clientesItems.push({
      id: 'leaf_customers_history',
      label: 'Histórico de Compras',
      targetTab: 'DOCS',
      subView: 'CUSTOMER_PURCHASES',
    });
    if (isPermitted(['platform_admin', 'tenant_owner', 'manager'])) {
      clientesItems.push({
        id: 'leaf_customers_debts',
        label: 'Conta-Corrente / Dívidas',
        targetTab: 'TREASURY',
        subView: 'RECEIVABLES',
      });
    }
  }

  // 7. RECURSOS HUMANOS (RH)
  const rhItems: NavLeafItem[] = [];
  if (isModuleActive('RH') && isPermitted(['platform_admin', 'tenant_owner', 'manager'])) {
    rhItems.push({
      id: 'leaf_hr_payroll',
      label: 'Equipa & Processamento Salarial',
      targetTab: 'HR',
      subView: 'PAYROLL',
    });
    rhItems.push({
      id: 'leaf_hr_irt_inss',
      label: 'Mapas IRT & Segurança Social',
      targetTab: 'HR',
      subView: 'TAX_MAPS',
    });
  }

  // 8. RELATÓRIOS (Vendas, Financeiro, Stock, Fiscal)
  const relatoriosItems: NavLeafItem[] = [];
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager', 'seller', 'cashier'])) {
    relatoriosItems.push({
      id: 'leaf_reports_sales',
      label: 'Vendas',
      targetTab: 'DOCS',
      subView: 'ALL',
    });
  }
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier'])) {
    relatoriosItems.push({
      id: 'leaf_reports_financial',
      label: 'Financeiro',
      targetTab: 'TREASURY',
      subView: 'BALANCES',
    });
  }
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager', 'seller'])) {
    relatoriosItems.push({
      id: 'leaf_reports_stock',
      label: 'Stock',
      targetTab: 'STOCK',
      subView: 'STOCK_REPORT',
    });
  }
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager'])) {
    relatoriosItems.push({
      id: 'leaf_reports_fiscal',
      label: 'Fiscal',
      targetTab: 'FISCAL',
      badge: 'AGT',
    });
  }

  // 9. CONFIGURAÇÕES (Apenas opções permitidas ao operador/tenant)
  const configuracoesItems: NavLeafItem[] = [];
  if (isPermitted(['platform_admin', 'tenant_owner', 'manager', 'cashier', 'seller'])) {
    configuracoesItems.push({
      id: 'leaf_settings_company',
      label: 'Definições do Estabelecimento',
      targetTab: 'SETTINGS',
      subView: 'GENERAL',
    });
    if (isPermitted(['platform_admin', 'tenant_owner', 'manager'])) {
      configuracoesItems.push({
        id: 'leaf_settings_users',
        label: 'Utilizadores & Permissões',
        targetTab: 'SETTINGS',
        subView: 'USERS',
      });
    }
    configuracoesItems.push({
      id: 'leaf_settings_devices',
      label: 'Séries / Terminal / Dispositivos',
      targetTab: 'SETTINGS',
      subView: 'DEVICES',
    });
  }

  // Assemble full tree, filtering out empty submodules and root modules
  const rawRoots: NavRootModule[] = [
    {
      id: 'root_operacoes',
      label: 'OPERAÇÕES',
      iconName: 'Zap',
      submodules: [
        {
          id: 'sub_operacoes_main',
          label: 'Frente de Caixa & Terminal',
          items: operacoesItems,
        },
      ],
    },
    {
      id: 'root_comercial',
      label: 'COMERCIAL',
      iconName: 'FileText',
      submodules: [
        {
          id: 'sub_comercial_docs',
          label: 'Faturação & Vendas',
          items: comercialItems,
        },
      ],
    },
    {
      id: 'root_stock',
      label: 'PRODUTOS & STOCK',
      iconName: 'Package',
      submodules: [
        {
          id: 'sub_stock_main',
          label: 'Artigos & Armazém',
          items: stockItems,
        },
      ],
    },
    {
      id: 'root_fornecedores',
      label: 'FORNECEDORES',
      iconName: 'Truck',
      submodules: [
        {
          id: 'sub_fornecedores_main',
          label: 'Gestão de Fornecedores',
          items: fornecedoresItems,
        },
      ],
    },
    {
      id: 'root_financas',
      label: 'FINANÇAS',
      iconName: 'Wallet',
      submodules: [
        {
          id: 'sub_financas_treasury',
          label: 'Tesouraria & Diário',
          items: financasItems,
        },
      ],
    },
    {
      id: 'root_clientes',
      label: 'CLIENTES',
      iconName: 'Users',
      submodules: [
        {
          id: 'sub_clientes_main',
          label: 'Gestão de Clientes',
          items: clientesItems,
        },
      ],
    },
    {
      id: 'root_rh',
      label: 'RH',
      iconName: 'Briefcase',
      submodules: [
        {
          id: 'sub_rh_main',
          label: 'Salários & Colaboradores',
          items: rhItems,
        },
      ],
    },
    {
      id: 'root_relatorios',
      label: 'RELATÓRIOS',
      iconName: 'BarChart3',
      submodules: [
        {
          id: 'sub_relatorios_main',
          label: 'Vendas, Financeiro & Fiscal',
          items: relatoriosItems,
        },
      ],
    },
    {
      id: 'root_configuracoes',
      label: 'CONFIGURAÇÕES',
      iconName: 'Settings',
      submodules: [
        {
          id: 'sub_configuracoes_main',
          label: 'Opções do Estabelecimento',
          items: configuracoesItems,
        },
      ],
    },
  ];

  // Filter out empty roots and empty submodules
  return rawRoots
    .map((root) => {
      const activeSubs = root.submodules
        .map((sub) => ({
          ...sub,
          items: sub.items,
        }))
        .filter((sub) => sub.items.length > 0);

      return {
        ...root,
        submodules: activeSubs,
      };
    })
    .filter((root) => root.submodules.length > 0);
}
