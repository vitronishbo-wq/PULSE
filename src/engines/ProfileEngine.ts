import { BusinessSegment, BusinessProfileDefinition, ModuleDefinition, ModuleId } from '../types/pulse';

export class ProfileEngine {
  private static instance: ProfileEngine;

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
        category: 'OPERATIONS',
        price: 5000,
        description: 'Processamento de salários, mapas INSS, IRT e gestão de colaboradores',
      },
    ],
    [
      'ACCOUNTING',
      {
        id: 'ACCOUNTING',
        name: 'Contabilidade Geral (PGC)',
        category: 'FINANCE',
        price: 8000,
        description: 'Diários de lançamentos, balancetes automáticos PGC e mapa de IVA modelo 1',
      },
    ],
    [
      'REFERENCES',
      {
        id: 'REFERENCES',
        name: 'Pagamento por Referência Multicaixa',
        category: 'FINANCE',
        price: 4000,
        description: 'Geração automática de entidades/referências EMIS e reconciliação instantânea',
      },
    ],
    [
      'SCALE',
      {
        id: 'SCALE',
        name: 'Integração de Balança & Pesagem',
        category: 'HARDWARE',
        price: 3000,
        description: 'Leitura direta de peso via porta serial/balança de balcão e códigos EAN-13 variáveis',
      },
    ],
    [
      'KDS_TABLES',
      {
        id: 'KDS_TABLES',
        name: 'Mesas, Comandas & Cozinha (KDS)',
        category: 'OPERATIONS',
        price: 4000,
        description: 'Mapa de salas/mesas em tempo real, impressora de pedidos e ecrã de cozinha',
      },
    ],
    [
      'BATCHES_RX',
      {
        id: 'BATCHES_RX',
        name: 'Lotes, Validades & Receitas Médicas',
        category: 'COMPLIANCE',
        price: 4000,
        description: 'Rastreabilidade FEFO de lotes com data de caducidade e arquivo de prescrições',
      },
    ],
    [
      'RETENTION_6_5',
      {
        id: 'RETENTION_6_5',
        name: 'Retenção na Fonte 6.5% de Serviços',
        category: 'COMPLIANCE',
        price: 0,
        description: 'Cálculo e desconto automático de retenção de serviços no ato de liquidação',
      },
    ],
  ]);

  private profiles: Map<BusinessSegment, BusinessProfileDefinition> = new Map([
    [
      'RESTAURANT_BAR',
      {
        code: 'RESTAURANT_BAR',
        name: 'Restaurante / Bar',
        description: 'Especializado para restauração, esplanadas, discotecas, cafetarias e fast-food',
        basePrice: 10000,
        tenantsCount: 124,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'KDS_TABLES', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'SCALE', 'REFERENCES'],
      },
    ],
    [
      'CONVENIENCE_STORE',
      {
        code: 'CONVENIENCE_STORE',
        name: 'Loja de Conveniência',
        description: 'Ideal para quiosques, bombas de combustível e pequenas lojas de proximidade',
        basePrice: 8000,
        tenantsCount: 89,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'SCALE', 'REFERENCES'],
      },
    ],
    [
      'SUPERMARKET',
      {
        code: 'SUPERMARKET',
        name: 'Supermercado',
        description: 'Estruturado para retalho alimentar de alto volume, frescos e caixas com balança',
        basePrice: 15000,
        tenantsCount: 42,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'SCALE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'REFERENCES'],
      },
    ],
    [
      'PHARMACY',
      {
        code: 'PHARMACY',
        name: 'Farmácia',
        description: 'Concebido para farmácias e postos de medicamentos com controlo de lotes e receitas',
        basePrice: 18000,
        tenantsCount: 31,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'BATCHES_RX', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'SCALE', 'REFERENCES'],
      },
    ],
    [
      'CLOTHING',
      {
        code: 'CLOTHING',
        name: 'Vestuário',
        description: 'Perfeito para boutiques, sapatarias e lojas de moda com grelha de tamanhos e cores',
        basePrice: 8000,
        tenantsCount: 67,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'REFERENCES'],
      },
    ],
    [
      'SERVICES',
      {
        code: 'SERVICES',
        name: 'Serviços',
        description: 'Vocacionado para consultoras, oficinas, prestadores de serviços e profissões liberais',
        basePrice: 6000,
        tenantsCount: 105,
        defaultModules: ['POS', 'PRODUCTS', 'RETENTION_6_5', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'STOCK', 'REFERENCES'],
      },
    ],
    [
      'OTHER',
      {
        code: 'OTHER',
        name: 'Outro',
        description: 'Configuração flexível para comércio geral, armazéns e distribuidoras',
        basePrice: 7000,
        tenantsCount: 45,
        defaultModules: ['POS', 'PRODUCTS', 'STOCK', 'BARCODE', 'TREASURY', 'FISCAL_AGT'],
        optionalModules: ['RH', 'ACCOUNTING', 'SCALE', 'REFERENCES', 'KDS_TABLES', 'BATCHES_RX'],
      },
    ],
  ]);

  private constructor() {}

  public static getInstance(): ProfileEngine {
    if (!ProfileEngine.instance) {
      ProfileEngine.instance = new ProfileEngine();
    }
    return ProfileEngine.instance;
  }

  public getAllProfiles(): BusinessProfileDefinition[] {
    return Array.from(this.profiles.values());
  }

  public getProfile(code: BusinessSegment): BusinessProfileDefinition {
    const p = this.profiles.get(code);
    if (p) return p;
    if (code === 'RETAIL_CLOTHING') return this.profiles.get('CLOTHING')!;
    if (code === 'GENERAL_RETAIL') return this.profiles.get('OTHER')!;
    return this.profiles.get('OTHER')!;
  }

  public getAllModules(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  public getModule(id: ModuleId): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  public incrementTenantCount(code: BusinessSegment): void {
    const prof = this.getProfile(code);
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
  public getInterfaceFeatures(segment: BusinessSegment, activeModules?: ModuleId[]) {
    const modules = this.getEffectiveModules(segment, activeModules);
    const hasModule = (m: ModuleId) => modules.includes(m);

    // POS Interface Features
    const hasTableManagement = hasModule('KDS_TABLES') || segment === 'RESTAURANT_BAR';
    const hasKitchenKDS = hasModule('KDS_TABLES') || segment === 'RESTAURANT_BAR';
    const hasBatchSelector = hasModule('BATCHES_RX') || segment === 'PHARMACY';
    const hasScaleIntegration = hasModule('SCALE') || segment === 'SUPERMARKET';
    const hasBarcodeQuickScanner = hasModule('BARCODE') || segment === 'CONVENIENCE_STORE' || segment === 'SUPERMARKET' || segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING' || segment === 'OTHER' || segment === 'GENERAL_RETAIL';
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
    const navTabs: { id: 'POS' | 'KDS_TABLES' | 'BATCHES' | 'SERVICES_BILLING' | 'DOCS' | 'STOCK' | 'TREASURY' | 'HR' | 'EVENTBUS' | 'FISCAL'; label: string; iconName: string }[] = [];

    if (segment === 'SERVICES') {
      navTabs.push({ id: 'SERVICES_BILLING', label: 'Faturação & Retenção 6.5%', iconName: 'Briefcase' });
    } else {
      const posLabel = segment === 'RESTAURANT_BAR' ? 'POS Restaurante' : segment === 'PHARMACY' ? 'Balcão Farmácia' : segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING' ? 'POS Vestuário' : 'POS Scanner';
      navTabs.push({ id: 'POS', label: posLabel, iconName: 'ShoppingCart' });
    }

    if (hasTableManagement) {
      navTabs.push({ id: 'KDS_TABLES', label: 'Mesas & Cozinha (KDS)', iconName: 'UtensilsCrossed' });
    }

    if (hasBatchSelector) {
      navTabs.push({ id: 'BATCHES', label: 'Lotes, Validades & Rx', iconName: 'Pill' });
    }

    navTabs.push({ id: 'DOCS', label: segment === 'SERVICES' ? 'Documentos & Propostas' : 'Documentos & Vendas', iconName: 'FileText' });

    if (hasModule('STOCK')) {
      const stockLabel = segment === 'RESTAURANT_BAR' ? 'Stock & Fichas (BOM)' : segment === 'PHARMACY' ? 'Medicamentos & Lotes' : segment === 'CLOTHING' || segment === 'RETAIL_CLOTHING' ? 'Stock & Tamanhos' : 'Stock & Armazém';
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
  public isModuleEnabled(tenant: { segment?: BusinessSegment; businessSegment?: BusinessSegment; activeModules?: ModuleId[] }, moduleId: ModuleId): boolean {
    const effective = this.getEffectiveModules(
      tenant.segment || tenant.businessSegment || 'OTHER',
      tenant.activeModules
    );
    return effective.includes(moduleId);
  }
}

export { BusinessProfileEngine } from './BusinessProfileEngine';

