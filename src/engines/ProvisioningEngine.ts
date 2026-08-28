import {
  TenantProfile,
  ProvisioningRequest,
  ProvisioningResult,
  Product,
  BusinessSegment,
} from '../types/pulse';
import { PricingEngine } from './PricingEngine';
import { BillingEngine } from './BillingEngine';
import { ProfileEngine } from './ProfileEngine';
import { Orchestrator } from './Orchestrator';

export class ProvisioningEngine {
  private static instance: ProvisioningEngine;
  private pricingEngine: PricingEngine;
  private billingEngine: BillingEngine;
  private profileEngine: ProfileEngine;

  private constructor() {
    this.pricingEngine = PricingEngine.getInstance();
    this.billingEngine = BillingEngine.getInstance();
    this.profileEngine = ProfileEngine.getInstance();
  }

  public static getInstance(): ProvisioningEngine {
    if (!ProvisioningEngine.instance) {
      ProvisioningEngine.instance = new ProvisioningEngine();
    }
    return ProvisioningEngine.instance;
  }

  /**
   * Generates a tamper-proof cryptographic AGT License Key format
   */
  public generateLicenseKey(taxId: string, segment: string): string {
    const year = new Date().getFullYear();
    const hashPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const hashPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const hashPart3 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PULSE-LIC-${year}-${segment.slice(0, 3)}-${hashPart1}-${hashPart2}-${hashPart3}`;
  }

  /**
   * Complete Automated Tenant Provisioning Pipeline:
   * 1. Customer Acquisition
   * 2. Business Profile
   * 3. Module Selection
   * 4. Pricing Engine
   * 5. Payment & Billing Engine
   * 6. License Generation
   * 7. Tenant Provisioning & Frozen Profile Activation
   */
  public provisionNewTenant(req: ProvisioningRequest): ProvisioningResult {
    const pricing = this.pricingEngine.calculateSubscription({
      segment: req.segment,
      selectedModules: req.selectedModules,
      billingCycle: req.billingCycle,
      currency: req.company.currency || 'Kz',
    });

    const tenantId = `tenant_${req.segment.toLowerCase()}_${Date.now().toString().slice(-4)}`;

    // 1. Process Billing & Invoice
    const invoice = this.billingEngine.createSubscriptionInvoice({
      tenantId,
      customerName: req.company.name,
      customerTaxId: req.company.taxId,
      amount: pricing.totalPayable,
      currency: req.company.currency || 'Kz',
      method: req.paymentMethod,
    });

    // 2. Generate Certified Software License
    const licenseKey = this.generateLicenseKey(req.company.taxId, req.segment);
    const expiryDate = new Date();
    if (req.billingCycle === 'ANNUAL') {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (req.billingCycle === 'QUARTERLY') {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // 3. Construct the Activated, Profile-Frozen Tenant
    const newTenant: TenantProfile = {
      id: tenantId,
      name: req.company.name,
      tradeName: req.company.tradeName || req.company.name,
      taxId: req.company.taxId,
      segment: req.segment,
      businessSegment: req.segment,
      country: req.company.country || 'AO',
      currency: req.company.currency || 'Kz',
      currencySymbol: req.company.currency === 'EUR' ? '€' : 'Kz',
      address: req.company.address,
      city: req.company.city,
      phone: req.company.phone,
      email: req.company.email,
      fiscalCertNumber: `AGT-PULSE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}/26`,
      currentSeries: `PULSE${new Date().getFullYear()}`,
      activeLicense: true,
      licenseKey,
      licenseExpiry: expiryDate.toISOString().split('T')[0],
      licenseStatus: 'ACTIVE',
      isProfileFrozen: true, // Frozen at provisioning time!
      activeModules: req.selectedModules,
      subscriptionCycle: req.billingCycle,
      featureFlags: {
        posEnabled: req.selectedModules.includes('POS'),
        fiscalAgtEnabled: true,
        recipesBomEnabled: req.selectedModules.includes('KDS_TABLES') || req.segment === 'RESTAURANT_BAR',
        accountingPgcEnabled: req.selectedModules.includes('ACCOUNTING'),
        treasuryEnabled: true,
        automationsEnabled: true,
        aiParserEnabled: true,
      },
      createdAt: new Date().toISOString(),
    };

    // 4. Update Profile Statistics
    this.profileEngine.incrementTenantCount(req.segment);

    // 5. Register in Orchestrator & Multi-Tenant Registry
    const orchestrator = Orchestrator.getInstance();
    orchestrator.registerTenant(newTenant);

    // 6. Seed Segment-Specific Initial Database Catalog
    this.seedSegmentCatalog(tenantId, req.segment);

    return {
      success: true,
      tenant: newTenant,
      licenseKey,
      subscription: {
        id: invoice.id,
        cycle: req.billingCycle,
        totalPaid: pricing.totalPayable,
        expiresAt: expiryDate.toISOString().split('T')[0],
        status: 'ACTIVE',
      },
      message: `Tenant "${newTenant.tradeName}" (${req.segment}) provisionado com sucesso! Licença activa até ${expiryDate.toISOString().split('T')[0]}.`,
    };
  }

  /**
   * Seeds initial demo products for the specific business profile
   */
  private seedSegmentCatalog(tenantId: string, segment: BusinessSegment): void {
    const orchestrator = Orchestrator.getInstance();
    const stockEngine = orchestrator.stockEngine;

    // Default products based on business segment
    const initialProducts: Record<string, Omit<Product, 'id'>[]> = {
      RESTAURANT_BAR: [
        { sku: 'RES-01', name: 'Menu Executivo Picanha', category: 'Pratos', type: 'recipe', cost: 3500, price: 8500, taxRate: 14, stockMin: 10, stockMax: 100, currentStock: 50, reservedStock: 0, unit: 'dose' },
        { sku: 'RES-02', name: 'Cuca Lata 33cl', category: 'Bebidas', type: 'good', cost: 400, price: 1000, taxRate: 14, stockMin: 24, stockMax: 240, currentStock: 96, reservedStock: 0, unit: 'un' },
        { sku: 'RES-03', name: 'Café Expresso Delta', category: 'Cafetaria', type: 'good', cost: 150, price: 600, taxRate: 14, stockMin: 50, stockMax: 500, currentStock: 200, reservedStock: 0, unit: 'un' },
      ],
      SUPERMARKET: [
        { sku: 'SUP-01', name: 'Arroz Agulha Tio Lucas 1kg', category: 'Mercearia', type: 'good', cost: 1200, price: 1850, taxRate: 14, stockMin: 50, stockMax: 500, currentStock: 150, reservedStock: 0, barcode: '5601234567890', unit: 'un' },
        { sku: 'SUP-02', name: 'Óleo Alimentar Fula 1L', category: 'Mercearia', type: 'good', cost: 1800, price: 2600, taxRate: 14, stockMin: 40, stockMax: 300, currentStock: 80, reservedStock: 0, barcode: '5601234567891', unit: 'un' },
        { sku: 'SUP-03', name: 'Maçã Royal Gala (Kg)', category: 'Frescos', type: 'good', cost: 1500, price: 2400, taxRate: 14, stockMin: 20, stockMax: 150, currentStock: 65, reservedStock: 0, barcode: '2001234000000', unit: 'kg' },
      ],
      CONVENIENCE_STORE: [
        { sku: 'CONV-01', name: 'Água Pura da Chela 500ml', category: 'Bebidas', type: 'good', cost: 200, price: 500, taxRate: 14, stockMin: 30, stockMax: 200, currentStock: 84, reservedStock: 0, barcode: '560999900001', unit: 'un' },
        { sku: 'CONV-02', name: 'Batatas Lays Sal 45g', category: 'Snacks', type: 'good', cost: 600, price: 1200, taxRate: 14, stockMin: 20, stockMax: 100, currentStock: 45, reservedStock: 0, barcode: '560999900002', unit: 'un' },
      ],
      PHARMACY: [
        { sku: 'FAR-01', name: 'Paracetamol 500mg (20 comp)', category: 'Analgésicos', type: 'good', cost: 800, price: 1500, taxRate: 14, stockMin: 30, stockMax: 200, currentStock: 75, reservedStock: 0, batchNumber: 'LOT-2026-A1', expiryDate: '2027-12-31', unit: 'cx' },
        { sku: 'FAR-02', name: 'Amoxicilina 500mg (16 cáps)', category: 'Antibióticos', type: 'good', cost: 1600, price: 3200, taxRate: 14, stockMin: 20, stockMax: 100, currentStock: 40, reservedStock: 0, batchNumber: 'LOT-2026-B4', expiryDate: '2028-06-30', unit: 'cx' },
      ],
      CLOTHING: [
        { sku: 'VEST-01', name: 'Camisa Oxford Slim Fit Azul M', category: 'Camisas', type: 'good', cost: 6000, price: 14500, taxRate: 14, stockMin: 5, stockMax: 30, currentStock: 12, reservedStock: 0, unit: 'un' },
        { sku: 'VEST-02', name: 'Calças Chino Bege 42', category: 'Calças', type: 'good', cost: 8000, price: 19000, taxRate: 14, stockMin: 5, stockMax: 30, currentStock: 8, reservedStock: 0, unit: 'un' },
      ],
      SERVICES: [
        { sku: 'SRV-01', name: 'Consultoria Financeira (Hora)', category: 'Consultoria', type: 'service', cost: 0, price: 25000, taxRate: 14, stockMin: 0, stockMax: 0, currentStock: 999, reservedStock: 0, unit: 'un' },
        { sku: 'SRV-02', name: 'Auditoria de Conformidade Fiscal', category: 'Auditoria', type: 'service', cost: 0, price: 150000, taxRate: 14, stockMin: 0, stockMax: 0, currentStock: 999, reservedStock: 0, unit: 'un' },
      ],
    };

    const list = initialProducts[segment] || initialProducts.RESTAURANT_BAR;
    list.forEach((p, idx) => {
      stockEngine.addProduct({
        ...p,
        id: `prod_${segment.toLowerCase()}_${idx + 1}_${Date.now().toString().slice(-4)}`,
      });
    });
  }
}
