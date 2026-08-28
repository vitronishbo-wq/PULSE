import {
  BusinessSegment,
  BusinessProfileDefinition,
  ModuleDefinition,
  ModuleId,
  TenantProfile,
  InterfaceFeatureSet,
} from '../types/pulse';

/**
 * BusinessProfileEngine manages business segments (RESTAURANT_BAR, SUPERMARKET, CONVENIENCE_STORE,
 * PHARMACY, CLOTHING, SERVICES, OTHER) and governs module availability, pricing defaults,
 * and interface capabilities across the entire PULSE.OS workspace.
 */
export class BusinessProfileEngine {
  private static instance: BusinessProfileEngine;

  private modules: Map<ModuleId, ModuleDefinition> = new Map([
    [
      'POS',
      {
        id: 'POS',
        name: 'POS Terminal de Venda',
        category: 'CORE',
        price: 0,
        description: 'Ponto de Venda ultra-rápido com atalhos F2-F4 e suporte a talão térmico 58/80mm',
      },
    ],
    [
      'PRODUCTS',
      {
        id: 'PRODUCTS',
        name: 'Catálogo & Artigos',
        category: 'CORE',
        price: 0,
        description: 'Gestão unificada de produtos, serviços, preços com IVA e fichas técnicas',
      },
    ],
    [
      'STOCK',
      {
        id: 'STOCK',
        name: 'Gestão de Stock & Armazéns',
        category: 'OPERATIONS',
        price: 0,
        description: 'Controlo de entradas, saídas, quebras, reservas e alertas de stock mínimo',
      },
    ],
    [
      'BARCODE',
      {
        id: 'BARCODE',
        name: 'Leitor Laser & Código de Barras',
        category: 'HARDWARE',
        price: 0,
        description: 'Suporte a scanner USB/Bluetooth e geração de etiquetas de código de barras',
      },
    ],
    [
      'TREASURY',
      {
        id: 'TREASURY',
        name: 'Tesouraria & Diário de Caixa',
        category: 'FINANCE',
        price: 0,
        description: 'Abertura/fecho de turno, movimentos de caixa e reconciliação bancária',
      },
    ],
    [
      'FISCAL_AGT',
      {
        id: 'FISCAL_AGT',
        name: 'Fiscalidade AGT & SAF-T',
        category: 'COMPLIANCE',
        price: 0,
        description: 'Assinatura digital RSA, ficheiro SAF-T AO auditável e regras fiscais 2026',
      },
    ],
    [
      'RH',
      {
        id: 'RH',
        name: 'Recursos Humanos & Salários',
        category: 'FINANCE',
        price: 15000,
        description: 'Processamento de salários, IRT, Segurança Social e recibos de vencimento',
      },
    ],
    [
      'KDS_TABLES',
      {
        id: 'KDS_TABLES',
        name: 'Mesas, Comandas & Cozinha (KDS)',
        category: 'OPERATIONS',
        price: 25000,
        description: 'Display de Cozinha em tempo real, gestão de salas, mesas e pedidos de bar',
      },
    ],
    [
      'BATCHES_RX',
      {
        id: 'BATCHES_RX',
        name: 'Lotes, Validades & Receitas (Rx)',
        category: 'OPERATIONS',
        price: 20000,
        description: 'Rastreabilidade de lotes farmacêuticos, regra FEFO e dispensa de receituário',
      },
    ],

    [
      'SCALE',
      {
        id: 'SCALE',
        name: 'Balança de Checkout & Frescos',
        category: 'HARDWARE',
        price: 12000,
        description: 'Integração direta com balanças de pesagem e leitura de etiquetas de peso',
      },
    ],
    [
      'RETENTION_6_5',
      {
        id: 'RETENTION_6_5',
        name: 'Retenção na Fonte 6.5% (AGT)',
        category: 'COMPLIANCE',
        price: 0,
        description: 'Cálculo automático e dedução de Retenção na Fonte para Prestação de Serviços',
      },
    ],
  ]);

  private profiles: Map<BusinessSegment, BusinessProfileDefinition> = new Map([
    [
      'RESTAURANT_BAR',
      {
        code: 'RESTAURANT_BAR',
        name: 'Restauração & Bares',
        description: 'Restaurantes, Cafés, Bares, Pastelarias, Fast Food e Lounges',
        basePrice: 45000,
        tenantsCount: 1,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'TREASURY', 'FISCAL_AGT', 'KDS_TABLES'],
        optionalModules: ['RH', 'BARCODE'],
      },
    ],
    [
      'CONVENIENCE_STORE',
      {
        code: 'CONVENIENCE_STORE',
        name: 'Loja de Conveniência',
        description: 'Lojas de bombas de combustível, mini-mercados 24h e quiosques',
        basePrice: 35000,
        tenantsCount: 1,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'SCALE'],
      },
    ],
    [
      'SUPERMARKET',
      {
        code: 'SUPERMARKET',
        name: 'Supermercado & Frescos',
        description: 'Supermercados, Mercearias, Talhos, Peixarias e Frutarias',
        basePrice: 50000,
        tenantsCount: 1,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'SCALE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'KDS_TABLES'],
      },
    ],
    [
      'PHARMACY',
      {
        code: 'PHARMACY',
        name: 'Farmácia & Saúde',
        description: 'Farmácias comunitárias, postos de medicamentos e parafarmácias',
        basePrice: 60000,
        tenantsCount: 1,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'BATCHES_RX', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH'],
      },
    ],
    [
      'CLOTHING',
      {
        code: 'CLOTHING',
        name: 'Vestuário & Moda',
        description: 'Lojas de roupa, calçado, alfaiatarias e acessórios de moda',
        basePrice: 40000,
        tenantsCount: 1,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH'],
      },
    ],
    [
      'SERVICES',
      {
        code: 'SERVICES',
        name: 'Prestação de Serviços',
        description: 'Consultorias, escritórios de advocacia, TI, saúde privada e oficinas',
        basePrice: 35000,
        tenantsCount: 1,
        defaultModules: ['POS', 'PRODUCTS', 'TREASURY', 'RETENTION_6_5', 'FISCAL_AGT'],
        optionalModules: ['STOCK', 'RH'],
      },
    ],
    [
      'OTHER',
      {
        code: 'OTHER',
        name: 'Comércio Geral & Outros',
        description: 'Ferragens, papelarias, armazéns de materiais e negócios múltiplos',
        basePrice: 35000,
        tenantsCount: 0,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'SCALE', 'RETENTION_6_5'],
      },
    ],
  ]);

  private constructor() {}

  public static getInstance(): BusinessProfileEngine {
    if (!BusinessProfileEngine.instance) {
      BusinessProfileEngine.instance = new BusinessProfileEngine();
    }
    return BusinessProfileEngine.instance;
  }

  public getAllProfiles(): BusinessProfileDefinition[] {
    return Array.from(this.profiles.values());
  }

  public getProfile(code: BusinessSegment): BusinessProfileDefinition {
    const p = this.profiles.get(code);
    if (p) return { ...p };
    // fallback for alias segments
    if (code === 'RETAIL_CLOTHING') {
      const c = this.profiles.get('CLOTHING')!;
      return { ...c, code: 'RETAIL_CLOTHING' as BusinessSegment };
    }
    if (code === 'GENERAL_RETAIL') {
      const o = this.profiles.get('OTHER')!;
      return { ...o, code: 'GENERAL_RETAIL' as BusinessSegment };
    }
    return { ...this.profiles.get('OTHER')! };
  }

  public getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  public getModule(id: ModuleId): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  public incrementTenantCount(code: BusinessSegment): void {
    const prof = this.profiles.get(code);
    if (prof) {
      prof.tenantsCount += 1;
    }
  }

  /**
   * Returns all compatible modules categorized for the selected segment
   */
  public getModuleAvailability(code: BusinessSegment): {
    defaultModules: ModuleDefinition[];
    optionalModules: ModuleDefinition[];
    allAvailable: ModuleDefinition[];
  } {
    const profile = this.getProfile(code);
    const defaultDefs = profile.defaultModules
      .map((id) => this.getModule(id))
      .filter((m): m is ModuleDefinition => !!m);
    const optionalDefs = profile.optionalModules
      .map((id) => this.getModule(id))
      .filter((m): m is ModuleDefinition => !!m);

    return {
      defaultModules: defaultDefs,
      optionalModules: optionalDefs,
      allAvailable: [...defaultDefs, ...optionalDefs],
    };
  }

  /**
   * Merges requested modules with segment mandatory defaults
   */
  public getEffectiveModules(segment: BusinessSegment, selectedModules?: ModuleId[]): ModuleId[] {
    const profile = this.getProfile(segment);
    const set = new Set<ModuleId>(profile.defaultModules);
    if (selectedModules) {
      selectedModules.forEach((m) => {
        if (this.modules.has(m)) {
          set.add(m);
        }
      });
    }
    return Array.from(set);
  }

  /**
   * Computes dynamic interface features & visual capabilities based on the chosen segment and active modules
   */
  public getInterfaceFeatures(segment: BusinessSegment, activeModules?: ModuleId[]): InterfaceFeatureSet {
    const modules = this.getEffectiveModules(segment, activeModules);
    const hasModule = (m: ModuleId) => modules.includes(m);

    // POS Interface Features
    const hasTableManagement = hasModule('KDS_TABLES') || segment === 'RESTAURANT_BAR';
    const hasKitchenKDS = hasModule('KDS_TABLES') || segment === 'RESTAURANT_BAR';
    const hasBatchSelector = hasModule('BATCHES_RX') || segment === 'PHARMACY';
    const hasScaleIntegration = hasModule('SCALE') || segment === 'SUPERMARKET';
    const hasBarcodeQuickScanner =
      hasModule('BARCODE') ||
      segment === 'CONVENIENCE_STORE' ||
      segment === 'SUPERMARKET' ||
      segment === 'CLOTHING' ||
      segment === 'RETAIL_CLOTHING' ||
      segment === 'OTHER' ||
      segment === 'GENERAL_RETAIL';
    const hasSizeColorGrid = segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING';
    const hasWithholding6_5 = hasModule('RETENTION_6_5') || segment === 'SERVICES';
    const hasPrescriptionFilter = hasModule('BATCHES_RX') || segment === 'PHARMACY';
    const hasModifiers = segment === 'RESTAURANT_BAR' || segment === 'CONVENIENCE_STORE';
    const defaultInteractionMode: 'TOUCH' | 'CLICK' = segment === 'RESTAURANT_BAR' ? 'TOUCH' : 'CLICK';

    // Segment Title & Subtitle for POS
    const segmentTitles: Record<string, { title: string; subtitle: string }> = {
      RESTAURANT_BAR: {
        title: 'Terminal de Venda & Mesas',
        subtitle: 'Restaurante / Bar • Comandas, Mesas & Cozinha KDS',
      },
      SUPERMARKET: {
        title: 'Caixa de Checkout & Balança',
        subtitle: 'Supermercado • Laser EAN-13, Pesagem & Alto Fluxo',
      },
      CONVENIENCE_STORE: {
        title: 'Ponto de Venda Rápido',
        subtitle: 'Loja de Conveniência • Leitor Laser & Rotação Rápida',
      },
      PHARMACY: {
        title: 'Balcão Farmacêutico & Prescrições',
        subtitle: 'Farmácia • Gestão FEFO de Lotes, Validades e Receitas Rx',
      },
      CLOTHING: {
        title: 'Caixa Boutique & Moda',
        subtitle: 'Vestuário • Grelha de Tamanhos, Cores e Coleções',
      },
      RETAIL_CLOTHING: {
        title: 'Caixa Boutique & Moda',
        subtitle: 'Vestuário • Grelha de Tamanhos, Cores e Coleções',
      },
      SERVICES: {
        title: 'Faturação de Serviços Profissionais',
        subtitle: 'Serviços & Consultoria • Retenção na Fonte 6.5% e Honorários',
      },
      OTHER: {
        title: 'Ponto de Venda Universal',
        subtitle: 'Comércio Geral • Gestão Integrada de Vendas e Stock',
      },
      GENERAL_RETAIL: {
        title: 'Ponto de Venda Universal',
        subtitle: 'Comércio Geral • Gestão Integrada de Vendas e Stock',
      },
    };

    const titles = segmentTitles[segment] || segmentTitles.OTHER;

    // Stock Features
    const stockFeatures = {
      hasBOMIngredients: hasModule('KDS_TABLES') || segment === 'RESTAURANT_BAR',
      hasBatchesExpiry: hasModule('BATCHES_RX') || segment === 'PHARMACY',
      hasSizeColorVariants: segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING',
      hasScaleWeighing: hasModule('SCALE') || segment === 'SUPERMARKET',
      hasBarcodeManagement: hasBarcodeQuickScanner,
    };

    // Navigation Tabs determination
    const navTabs: {
      id: 'POS' | 'KDS_TABLES' | 'BATCHES' | 'SERVICES_BILLING' | 'DOCS' | 'STOCK' | 'TREASURY' | 'HR' | 'EVENTBUS' | 'FISCAL';
      label: string;
      iconName: string;
    }[] = [];

    if (segment === 'SERVICES') {
      navTabs.push({ id: 'SERVICES_BILLING', label: 'Faturação & Retenção 6.5%', iconName: 'Briefcase' });
    } else {
      const posLabel =
        segment === 'RESTAURANT_BAR'
          ? 'POS Restaurante'
          : segment === 'PHARMACY'
          ? 'Balcão Farmácia'
          : segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING'
          ? 'POS Vestuário'
          : 'POS Scanner';
      navTabs.push({ id: 'POS', label: posLabel, iconName: 'ShoppingCart' });
    }

    if (hasTableManagement) {
      navTabs.push({ id: 'KDS_TABLES', label: 'Mesas & Cozinha (KDS)', iconName: 'UtensilsCrossed' });
    }

    if (hasBatchSelector) {
      navTabs.push({ id: 'BATCHES', label: 'Lotes, Validades & Rx', iconName: 'Pill' });
    }

    navTabs.push({
      id: 'DOCS',
      label: segment === 'SERVICES' ? 'Documentos & Propostas' : 'Documentos & Vendas',
      iconName: 'FileText',
    });

    if (hasModule('STOCK')) {
      const stockLabel =
        segment === 'RESTAURANT_BAR'
          ? 'Stock & Fichas (BOM)'
          : segment === 'PHARMACY'
          ? 'Medicamentos & Lotes'
          : segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING'
          ? 'Stock & Tamanhos'
          : 'Stock & Armazém';
      navTabs.push({ id: 'STOCK', label: stockLabel, iconName: 'Package' });
    }

    if (hasModule('TREASURY')) {
      navTabs.push({ id: 'TREASURY', label: 'Caixa & Tesouraria', iconName: 'Wallet' });
    }

    if (hasModule('RH')) {
      navTabs.push({ id: 'HR', label: 'RH & Salários', iconName: 'Users' });
    }

    navTabs.push({ id: 'EVENTBUS', label: 'Event Bus & Auditoria', iconName: 'Zap' });
    navTabs.push({ id: 'FISCAL', label: segment === 'SERVICES' ? 'Fiscal Modelo 1 AGT' : 'Fiscal & AGT', iconName: 'Globe' });

    return {
      segment,
      navTabs,
      pos: {
        hasTableManagement,
        hasKitchenKDS,
        hasBatchSelector,
        hasScaleIntegration,
        hasBarcodeQuickScanner,
        hasSizeColorGrid,
        hasWithholding6_5,
        hasPrescriptionFilter,
        hasModifiers,
        defaultInteractionMode,
        segmentTitle: titles.title,
        segmentSubtitle: titles.subtitle,
      },
      stock: stockFeatures,
      activeModules: modules,
    };
  }

  /**
   * Checks if a tenant has a specific module activated
   */
  public isModuleEnabled(tenant: TenantProfile, moduleId: ModuleId): boolean {
    const effective = this.getEffectiveModules(
      tenant.segment || tenant.businessSegment || 'OTHER',
      tenant.activeModules
    );
    return effective.includes(moduleId);
  }
}
