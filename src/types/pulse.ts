/**
 * PULSE.OS — ULCE (Universal Lightweight Commerce Engine)
 * Domain Models & Engine Types
 */

export type UserRole =
  | 'platform_admin'
  | 'tenant_owner'
  | 'manager'
  | 'cashier'
  | 'seller'
  | 'viewer';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  pin: string; // hashed or 4-digit PIN for quick cashier auth
}

export type FiscalCountry = 'AO' | 'PT' | 'MZ' | 'CV';

export type BusinessSegment =
  | 'RESTAURANT_BAR'
  | 'CONVENIENCE_STORE'
  | 'SUPERMARKET'
  | 'PHARMACY'
  | 'CLOTHING'
  | 'RETAIL_CLOTHING'
  | 'SERVICES'
  | 'OTHER'
  | 'GENERAL_RETAIL';

export type ModuleId =
  | 'POS'
  | 'PRODUCTS'
  | 'STOCK'
  | 'BARCODE'
  | 'RH'
  | 'ACCOUNTING'
  | 'TREASURY'
  | 'REFERENCES'
  | 'SCALE'
  | 'KDS_TABLES'
  | 'BATCHES_RX'
  | 'RETENTION_6_5'
  | 'FISCAL_AGT';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  category: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'HARDWARE' | 'COMPLIANCE';
  price: number;
  description: string;
}

export interface BusinessProfileDefinition {
  code: BusinessSegment;
  name: string;
  description: string;
  basePrice: number;
  tenantsCount: number;
  defaultModules: ModuleId[];
  optionalModules: ModuleId[];
}

export interface ProfileNavTabItem {
  id: 'POS' | 'KDS_TABLES' | 'BATCHES' | 'SERVICES_BILLING' | 'DOCS' | 'STOCK' | 'SUPPLIERS' | 'TREASURY' | 'HR' | 'EVENTBUS' | 'FISCAL';
  label: string;
  iconName: string;
  description?: string;
}

export interface POSInterfaceFeatures {
  hasTableManagement: boolean;
  hasKitchenKDS: boolean;
  hasBatchSelector: boolean;
  hasScaleIntegration: boolean;
  hasBarcodeQuickScanner: boolean;
  hasSizeColorGrid: boolean;
  hasWithholding6_5: boolean;
  hasPrescriptionFilter: boolean;
  hasModifiers: boolean;
  defaultInteractionMode: 'TOUCH' | 'CLICK';
  segmentTitle: string;
  segmentSubtitle: string;
}

export interface StockInterfaceFeatures {
  hasBOMIngredients: boolean;
  hasBatchesExpiry: boolean;
  hasSizeColorVariants: boolean;
  hasScaleWeighing: boolean;
  hasBarcodeManagement: boolean;
}

export interface InterfaceFeatureSet {
  segment: BusinessSegment;
  navTabs: ProfileNavTabItem[];
  pos: POSInterfaceFeatures;
  stock: StockInterfaceFeatures;
  activeModules: ModuleId[];
}

export interface SubscriptionPricingBreakdown {
  segment: BusinessSegment;
  basePrice: number;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  addonModules: { id: ModuleId; name: string; price: number }[];
  addonPriceTotal: number;
  subtotal: number;
  cycleDiscountPercent: number;
  cycleDiscountAmount: number;
  taxRatePercent: number;
  taxAmount: number;
  totalPayable: number;
  currency: string;
}

export interface ProvisioningRequest {
  customer: {
    fullName: string;
    email: string;
    phone: string;
    password?: string;
  };
  company: {
    name: string;
    tradeName: string;
    taxId: string;
    address: string;
    city: string;
    country: FiscalCountry;
    currency: string;
    phone: string;
    email: string;
  };
  segment: BusinessSegment;
  selectedModules: ModuleId[];
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  paymentMethod: 'MULTICAIXA_REF' | 'MCX_EXPRESS' | 'BANK_TRANSFER' | 'CASH';
  paymentReference?: {
    entity: string;
    reference: string;
    amount: number;
  };
}

export interface ProvisioningResult {
  success: boolean;
  tenant: TenantProfile;
  licenseKey: string;
  subscription: {
    id: string;
    cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    totalPaid: number;
    expiresAt: string;
    status: 'ACTIVE' | 'TRIAL';
  };
  message: string;
}

export interface TenantFeatureFlags {
  posEnabled: boolean;
  fiscalAgtEnabled: boolean;
  recipesBomEnabled: boolean;
  accountingPgcEnabled: boolean;
  treasuryEnabled: boolean;
  automationsEnabled: boolean;
  aiParserEnabled: boolean;
}

export interface TenantProfile {
  id: string;
  name: string;
  tradeName: string;
  taxId: string; // NIF
  segment: BusinessSegment; // Dynamic Business Profile
  businessSegment?: BusinessSegment; // Alias for backwards compatibility
  country: FiscalCountry;
  currency: string; // 'Kz' | 'EUR' | 'MZN' | 'CVE' | 'USD'
  currencySymbol: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  fiscalCertNumber: string;
  currentSeries: string;
  activeLicense: boolean;
  licenseKey?: string;
  licenseExpiry?: string;
  licenseStatus?: 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'SUSPENDED';
  isProfileFrozen?: boolean;
  activeModules?: ModuleId[];
  subscriptionCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  featureFlags: TenantFeatureFlags;
  createdAt: string;
}

export interface ImpersonationSession {
  active: boolean;
  adminUid: string;
  adminEmail: string;
  targetTenantId: string;
  targetTenantName: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
}

export interface Customer {
  id: string;
  name: string;
  tradeName?: string;
  taxId: string; // NIF / Contribuinte
  fiscalCountry?: FiscalCountry;
  taxRegime?: 'GERAL' | 'SIMPLIFICADO' | 'ISENTO';
  taxExemptionReason?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  creditLimit: number;
  currentBalance: number; // Positive = owes money (AR)
  paymentTerms?: string; // 'Pronto Pagamento' | '15 Dias' | '30 Dias Líquido' | '60 Dias Líquido' | '90 Dias'
  priceTable?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CustomerMovementType =
  | 'SALES_INVOICE'
  | 'RECEIPT'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'OPENING_BALANCE'
  | 'ADJUSTMENT';

export interface CustomerLedgerMovement {
  id: string;
  customerId: string;
  customerName: string;
  customerTaxId: string;
  date: string;
  dueDate?: string;
  type: CustomerMovementType;
  docNumber: string; // Ex: 'FT 2026/001', 'RC 2026/001', 'NC 2026/001'
  docId?: string;
  description: string;
  debit: number; // Faturas / Aumenta valor a receber
  credit: number; // Recibos / Notas de Crédito (amortização / redução)
  runningBalance: number; // Saldo progressivo acumulado
  paymentMethod?: PaymentMethod;
  bankAccountRef?: string;
  receiptNumber?: string;
  status: 'PENDING' | 'SETTLED' | 'CANCELLED';
  matchedDocId?: string;
  notes?: string;
  registeredBy: string;
  createdAt: string;
}

export interface SupplierProductItem {
  productId: string;
  sku: string;
  name: string;
  supplierProductCode?: string;
  lastCostPrice: number;
  taxRate: number;
  leadTimeDays?: number;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  taxId: string; // NIF / Contribuinte
  fiscalCountry?: FiscalCountry;
  taxRegime?: 'GERAL' | 'SIMPLIFICADO' | 'ISENTO';
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  paymentTerms: string; // 'Pronto Pagamento' | '15 Dias' | '30 Dias Líquido' | '60 Dias Líquido' | '90 Dias'
  paymentMethodDefault?: PaymentMethod;
  bankAccount?: {
    bankName: string;
    iban: string;
    swift?: string;
  };
  creditLimit?: number;
  currentBalance: number; // Positive = we owe money (AP)
  suppliedProductIds?: string[];
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type PurchaseOriginDocType = 'INVOICE' | 'RECEIPT' | 'DELIVERY_NOTE' | 'ORDER';

export interface PurchaseLine {
  id: string;
  productId: string;
  sku: string;
  description: string;
  qty: number;
  unit: string;
  unitCost: number;
  discountPercent?: number;
  taxRate: number; // IVA %
  netTotal: number;
  taxTotal: number;
  grossTotal: number;
  // Batch & Expiry tracking
  batchNumber?: string;
  expiryDate?: string;
  allocatedCost?: number; // Custo com despesas acessórias rateadas
}

export interface AdditionalCost {
  id: string;
  description: string; // 'Frete / Transporte', 'Despacho Alfandegário', 'Seguro', 'Manuseamento'
  amount: number;
  allocationMethod: 'BY_VALUE' | 'BY_QTY' | 'MANUAL';
}

export interface PurchaseEntry {
  id: string;
  internalRef: string; // Ex: 'EC 2026/001'
  supplierId: string;
  supplierName: string;
  supplierTaxId: string;
  originDocType: PurchaseOriginDocType;
  originDocNumber: string; // Ex: 'FT 2026/9021', 'GR 44102'
  issueDate: string;
  dueDate: string;
  receivedDate: string;
  lines: PurchaseLine[];
  additionalCosts: AdditionalCost[];
  subtotalNet: number;
  taxAmount: number;
  additionalCostsTotal: number;
  grossTotal: number;
  paymentMethod: PaymentMethod;
  paymentTerms: string;
  isPaid: boolean;
  status: PurchaseStatus;
  notes?: string;
  receivedBy: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export type SupplierMovementType =
  | 'PURCHASE_INVOICE'
  | 'PAYMENT'
  | 'CREDIT_NOTE'
  | 'OPENING_BALANCE'
  | 'REFUND';

export interface SupplierLedgerMovement {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate?: string;
  type: SupplierMovementType;
  docNumber: string; // Ex: 'FT 2026/9021', 'REC-PAG-004', 'NC 2026/012'
  description: string;
  debit: number; // Pagamentos / Notas de Crédito (amortização de dívida)
  credit: number; // Faturas de Fornecedor (aumento de dívida a pagar)
  runningBalance: number; // Saldo progressivo
  paymentMethod?: PaymentMethod;
  bankAccountRef?: string;
  receiptNumber?: string;
  status: 'PENDING' | 'SETTLED' | 'CANCELLED';
  matchedPurchaseId?: string;
  notes?: string;
  registeredBy: string;
  createdAt: string;
}

export type ProductType = 'good' | 'service' | 'recipe';

export interface RecipeItem {
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  cost: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  segment?: BusinessSegment;
  tenantId?: string;
  type: ProductType;
  cost: number;
  price: number;
  taxRate: number; // percentage (e.g. 14 for Angola IVA standard)
  stockMin: number;
  stockMax: number;
  currentStock: number;
  reservedStock: number;
  unit: string; // 'un', 'cx', 'kg', 'lt', 'dose'
  barcode?: string;
  recipe?: RecipeItem[]; // If type === 'recipe', BOM raw material explosion
  // Pharmacy segment attributes
  batchNumber?: string;
  expiryDate?: string;
  activeSubstance?: string;
  prescriptionRequired?: boolean;
  // Clothing & Footwear segment attributes
  sizes?: string[];
  colors?: string[];
  selectedSize?: string;
  selectedColor?: string;
  season?: string;
  // Services segment attributes
  serviceHourlyRate?: number;
  withholdingTaxPercent?: number; // e.g. 6.5% for Angola
  serviceDurationMins?: number;
  // Restaurant segment attributes
  preparationArea?: 'BAR' | 'KITCHEN' | 'GRILL' | 'PASTRY';
  allergens?: string[];
}

export type DocumentType =
  | 'QUOTATION'
  | 'ORDER'
  | 'PROFORMA'
  | 'INVOICE'
  | 'RECEIPT'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE'
  | 'DELIVERY_NOTE'
  | 'TRANSPORT_NOTE';

export type DocumentStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'ISSUED'
  | 'FISCALIZED'
  | 'POSTED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT' | 'SPLIT';

export interface DocumentLine {
  id: string;
  productId: string;
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  taxRate: number;
  netTotal: number;
  taxTotal: number;
  grossTotal: number;
  // Segment details on invoice lines
  batchNumber?: string;
  expiryDate?: string;
  selectedSize?: string;
  selectedColor?: string;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  kitchenNotes?: string;
  tableNumber?: string;
  taxExemptionReason?: string;
}

export interface Document {
  id: string;
  docType: DocumentType;
  series: string; // e.g. 'FT 2026'
  number: number;
  docNumber: string; // e.g. 'FT 2026/001'
  status: DocumentStatus;
  customerId?: string;
  customerName?: string;
  customerTaxId?: string;
  supplierId?: string;
  supplierName?: string;
  date: string;
  dueDate?: string;
  lines: DocumentLine[];
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  total?: number; // Alias for grossAmount
  paymentMethod: PaymentMethod;
  paidAmount: number;
  hash: string; // AGT/AT Fiscal Digital Signature 4-char prefix & full signature
  previousDocHash: string;
  derivedFrom?: string; // ID of parent Order/Quotation
  notes?: string;
  branchId: string;
  createdBy: string;
}

export type StockMovementType =
  | 'PURCHASE_IN'
  | 'SALE_OUT'
  | 'RETURN_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT'
  | 'LOSS'
  | 'PRODUCTION_IN';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  branchId: string;
  qty: number; // negative for reductions, positive for additions
  unitCost: number;
  totalCost: number;
  type: StockMovementType;
  docId?: string;
  docNumber?: string;
  reason?: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  docId?: string;
  docNumber?: string;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: 'PENDING' | 'CLEARED' | 'RECONCILED';
  date: string;
  notes?: string;
}

// --- FINANÇAS & TESOURARIA EXTENDED MODULE TYPES ---

export type ReceiptStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';
export type ReconciliationStatus = 'RECONCILED' | 'UNRECONCILED' | 'PARTIALLY_RECONCILED';

export interface ReceiptEntry {
  id: string;
  receiptNumber: string; // Ex: 'RC 2026/001'
  customerId?: string;
  customerName: string;
  customerTaxId?: string;
  originDocId?: string;
  originDocNumber?: string; // Fatura / Documento associado (ex: 'FT 2026/001')
  originDocTotal?: number;
  paymentMethod: PaymentMethod;
  amount: number;
  bankAccountId?: string;
  bankAccountName?: string;
  reference?: string; // Nº Talão TPA / Comprovativo Bancário / Ref
  proofFileName?: string;
  status: ReceiptStatus;
  reconciliationStatus: ReconciliationStatus;
  date: string;
  notes?: string;
  registeredBy: string;
  createdAt: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export type DisbursementStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type ApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
export type BeneficiaryType = 'SUPPLIER' | 'EMPLOYEE' | 'TAX_AUTHORITY' | 'GENERAL_EXPENSE' | 'OTHER';

export interface PaymentDisbursement {
  id: string;
  disbursementNumber: string; // Ex: 'OP 2026/001' (Ordem de Pagamento)
  beneficiaryType: BeneficiaryType;
  supplierId?: string;
  beneficiaryName: string;
  beneficiaryTaxId?: string;
  docId?: string;
  docNumber?: string; // Fatura / Documento associado (ex: 'FT 2026/9042')
  docTotal?: number;
  paymentMethod: PaymentMethod;
  amount: number;
  bankAccountId?: string;
  bankAccountName?: string;
  reference?: string; // Ref Bancária / Cheque / Comprovativo
  proofFileName?: string;
  status: DisbursementStatus;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  reconciliationStatus: ReconciliationStatus;
  date: string;
  dueDate?: string;
  category?: string; // Ex: 'Mercadorias', 'Salários', 'Impostos AGT', 'Rendas', 'Energia'
  notes?: string;
  registeredBy: string;
  createdAt: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export type CashMovementType = 'INFLOW' | 'OUTFLOW' | 'TRANSFER' | 'OPENING_FLOAT' | 'ADJUSTMENT';

export type CashMovementCategory =
  | 'SALES_CASH'
  | 'RECEIPT_CASH'
  | 'SUPPLIER_PAYMENT'
  | 'DIRECT_EXPENSE'
  | 'SUPRIMENTO'
  | 'SANGRIA'
  | 'BANK_TRANSFER'
  | 'OPENING_FLOAT'
  | 'DISCREPANCY_ADJUSTMENT';

export interface CashMovementEntry {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  type: CashMovementType;
  category: CashMovementCategory;
  operatorId: string;
  operatorName: string;
  shiftId?: string;
  shiftNumber?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  balanceAfter: number;
  sourceAccount?: string; // Ex: 'Caixa Principal'
  targetAccount?: string; // Ex: 'Banco BAI'
  docRef?: string; // Ex: 'FR 2026/001', 'OP 2026/004', 'SANGRIA-01'
  description: string;
  justification?: string;
  authorizedBy?: string;
  authorizedAt?: string;
  differenceAmount?: number;
  proofReference?: string;
}

export interface CashShiftRecord {
  id: string;
  shiftNumber: number;
  terminalId: string;
  operatorId: string;
  operatorName: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  totalInflows: number;
  totalOutflows: number;
  totalSalesCash: number;
  totalCard: number;
  totalTransfers: number;
  systemExpectedCash: number;
  physicalCountedCash?: number;
  difference?: number;
  differenceJustification?: string;
  authorizedBy?: string;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swift?: string;
  currency: string;
  balance: number;
  accountType: 'CURRENT' | 'SAVINGS' | 'TPA_TRANSIT';
  active: boolean;
  tpaTerminalIds?: string[];
}

export interface AccountingEntry {
  id: string;
  docId?: string;
  docNumber?: string;
  date: string;
  description: string;
  debitAccount: string;
  debitAccountName: string;
  creditAccount: string;
  creditAccountName: string;
  amount: number;
  currency: string;
}

export type EventType =
  | 'SALE_CREATED'
  | 'PURCHASE_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_SENT'
  | 'STOCK_LOW'
  | 'DOCUMENT_ISSUED'
  | 'DOCUMENT_CANCELLED'
  | 'STOCK_ADJUSTED'
  | 'RECIPE_PRODUCED'
  | 'CUSTOMER_CREATED'
  | 'PRODUCT_UPDATED';

export interface SystemEvent {
  eventId: string;
  eventType: EventType;
  tenantId: string;
  userId: string;
  userName: string;
  source: 'POS' | 'API' | 'AI' | 'ORCHESTRATOR' | 'OFFLINE_SYNC';
  entityType: 'documents' | 'products' | 'stock_movements' | 'payments' | 'customers' | 'accounting';
  entityId: string;
  payload: any;
  previousState?: any;
  timestamp: string;
  version: number;
  sideEffects: string[];
}

export interface AuditRecord {
  id: string;
  eventId: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  before: any;
  after: any;
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: EventType;
  conditionQuery: string;
  actionType: 'PURCHASE_SUGGESTION' | 'NOTIFY_MANAGER' | 'AUTO_PRINT' | 'HOLD_FOR_APPROVAL' | 'APPLY_DISCOUNT';
  description: string;
  enabled: boolean;
  triggerCount: number;
  lastTriggered?: string;
}

export interface FiscalValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FiscalAdapter {
  countryCode: string;
  countryName: string;
  getTaxRate(product: Product, customer?: Customer): number;
  generateHash(doc: Partial<Document>, previousHash: string): string;
  validateDocument(doc: Document): FiscalValidationResult;
  exportSAFT(tenant: TenantProfile, documents: Document[], products: Product[], customers: Customer[], period: { start: string; end: string }): string;
}

export interface OfflineSyncItem {
  id: string;
  entityType: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  version: number;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';
  clientTimestamp: string;
  serverTimestamp?: string;
  conflictDetails?: string;
}

export interface ParsedAICommand {
  intent: 'CREATE_SALE' | 'CREATE_PURCHASE' | 'CREATE_QUOTATION' | 'CREATE_RECEIPT' | 'CREATE_PAYMENT' | 'CREATE_RETURN';
  targetName?: string;
  targetId?: string;
  paymentMethod?: PaymentMethod;
  items: {
    skuOrName: string;
    matchedProductId?: string;
    qty: number;
    price?: number;
    notes?: string;
  }[];
  notes?: string;
  confidence?: number;
}

// --- KERNEL COMMAND PIPELINE TYPES ---

export type CommandType =
  | 'ISSUE_SALES_DOCUMENT'
  | 'REGISTER_PURCHASE'
  | 'RECEIVE_PAYMENT'
  | 'SEND_PAYMENT'
  | 'ADJUST_STOCK'
  | 'PRODUCE_RECIPE'
  | 'PROCESS_PAYROLL'
  | 'SWITCH_TENANT'
  | 'RENEW_LICENSE'
  | 'EXECUTE_AUTOMATION';

export interface Command<T = any> {
  commandId: string;
  commandType: CommandType;
  tenantId: string;
  actor: User;
  payload: T;
  timestamp: string;
  idempotencyKey?: string;
}

export interface CommandResult<T = any> {
  success: boolean;
  commandId: string;
  tenantId: string;
  message: string;
  data?: T;
  eventsPublished: SystemEvent[];
  sideEffects: string[];
  executionTimeMs: number;
  errors?: string[];
}

export interface RuleViolation {
  code: string;
  field?: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface RuleValidationResult {
  valid: boolean;
  violations: RuleViolation[];
}

// --- HR & PAYROLL TYPES ---

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  taxId: string; // NIF
  socialSecurityNumber: string; // INSS / Seg. Social
  role: string;
  department: string;
  baseSalary: number;
  foodAllowance: number;
  transportAllowance: number;
  contractType: 'PERMANENT' | 'FIXED_TERM' | 'INTERNSHIP';
  startDate: string;
  active: boolean;
}

export interface Payslip {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  period: string; // e.g. '2026-08'
  baseSalary: number;
  allowances: number;
  grossTotal: number;
  irtDeduction: number; // Income tax deduction
  socialSecurityEmployee: number; // 3%
  socialSecurityCompany: number; // 8%
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  processedAt: string;
  paymentMethod: PaymentMethod;
}

// --- UNIVERSAL INPUT LAYER TYPES ---

export type InputSourceType =
  | 'PHYSICAL_KEYBOARD'
  | 'PHYSICAL_NUMPAD'
  | 'TOUCH_VIRTUAL_KEYBOARD'
  | 'TOUCH_GESTURE'
  | 'VOICE_RECOGNITION'
  | 'BARCODE_SCANNER'
  | 'SERVICE_DIALER'
  | 'SHORTCUT_TRIGGER'
  | 'API_BRIDGE';

export type DeviceInputCategory = 'MOBILE' | 'TABLET' | 'LAPTOP' | 'DESKTROP';

export type InputContextField = 'QUANTITY' | 'AMOUNT' | 'CUSTOMER' | 'SEARCH' | 'COMMAND' | 'GENERIC';

export type UniversalIntentType =
  | 'OPEN_COMMAND_CENTER'
  | 'CLOSE_MODAL'
  | 'CONFIRM_ACTION'
  | 'SAVE_RECORD'
  | 'PRINT_DOCUMENT'
  | 'OPEN_HELP'
  | 'INVOKE_PLATFORM_CONTROL'
  | 'NAVIGATE_VIEW'
  | 'CREATE_SALE'
  | 'CREATE_PURCHASE'
  | 'CREATE_RECEIPT'
  | 'CREATE_PAYMENT'
  | 'CREATE_QUOTATION'
  | 'CREATE_RETURN'
  | 'LOOKUP_PRODUCT_BARCODE'
  | 'LOOKUP_CUSTOMER'
  | 'FILTER_CATALOG'
  | 'QUANTITY_DIRECT_INPUT'
  | 'AMOUNT_DIRECT_INPUT'
  | 'EXECUTE_NATURAL_AI';

export interface RawInputEvent {
  id: string;
  sourceType: InputSourceType;
  deviceCategory: DeviceInputCategory;
  rawPayload: string;
  contextField?: InputContextField;
  meta?: {
    isEnterTriggered?: boolean;
    durationMs?: number;
    confidence?: number;
    keyCombo?: string;
    barcodeLength?: number;
  };
  timestamp: string;
}

export interface NormalizedCommand {
  id: string;
  sourceType: InputSourceType;
  deviceCategory: DeviceInputCategory;
  rawInput: string;
  normalizedText: string;
  intent: UniversalIntentType;
  targetEntity?: string;
  parameters: Record<string, any>;
  validation: {
    valid: boolean;
    errors?: string[];
  };
  confidence: number;
  timestamp: string;
}

// --- PLATFORM DIAGNOSTICS & USAGE METRICS ---

export interface PlatformUsageMetrics {
  totalTenants: number;
  activeTenants: number;
  totalDocumentsIssued: number;
  totalVolumeTransacted: Record<string, number>; // by currency (Kz, EUR, MZN, CVE)
  totalEventsProcessed: number;
  offlineQueueDepth: number;
  apiCallsLastHour: number;
  storageUsageMb: number;
}

export interface SystemDiagnosticError {
  id: string;
  timestamp: string;
  tenantId: string;
  severity: 'ERROR' | 'CRITICAL' | 'WARNING';
  source: string;
  message: string;
  stack?: string;
  resolved: boolean;
}

// --- VERIFICATION & AUTOMATED TEST SUITE TYPES ---

export interface TestExecutionResult {
  id: string;
  suite: 'EVENT_SIDE_EFFECTS' | 'TENANT_ISOLATION' | 'RBAC' | 'FISCAL_CHAIN' | 'OFFLINE_SYNC' | 'AUDIT_LEDGER';
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  details: string;
  evidence?: any;
}

export interface TestSuiteReport {
  executedAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestExecutionResult[];
}

// --- OUTPUT & PRINT ENGINE TYPES ---

export type ReceiptFormat = 'THERMAL_58' | 'THERMAL_80' | 'A4' | 'DIGITAL_SHARE';

export interface FormattedReceiptTaxLine {
  taxRate: number;
  baseAmount: number;
  taxAmount: number;
  exemptionReason?: string;
}

// --- COMMERCIAL MODULE EXTENDED TYPES ---

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface CommercialQuotation {
  id: string;
  docNumber: string; // e.g. 'PP 2026/001'
  date: string;
  validUntil: string;
  validityDays: number;
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  lines: DocumentLine[];
  subtotalNet: number;
  taxAmount: number;
  withholdingTaxRate?: number;
  withholdingTaxAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  grossTotal: number;
  status: QuotationStatus;
  notes?: string;
  paymentTerms?: string;
  convertedToDocId?: string;
  convertedToDocNumber?: string;
  convertedAt?: string;
  createdBy: string;
  createdAt: string;
}

export type SeriesStatus = 'ACTIVE' | 'CLOSED';

export interface SeriesHistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface CommercialSeries {
  id: string;
  code: string; // e.g. 'FT 2026/A'
  docType: DocumentType;
  docTypeName: string;
  fiscalYear: number;
  terminal: string;
  initialNumber: number;
  currentNumber: number;
  lastIssuedDocNumber: string;
  startDate: string;
  endDate?: string;
  status: SeriesStatus;
  isAgtCommunicated: boolean;
  agtCommunicationCode?: string;
  notes?: string;
  createdBy: string;
  closedBy?: string;
  closedAt?: string;
  history: SeriesHistoryEntry[];
}


export interface FormattedReceiptPayload {
  documentId: string;
  docNumber: string;
  docType: DocumentType;
  date: string;
  time: string;
  tenant: {
    name: string;
    tradeName: string;
    taxId: string;
    address: string;
    city: string;
    phone?: string;
    email?: string;
    fiscalCertNumber: string;
    currency: string;
  };
  customer: {
    name: string;
    taxId: string;
    address?: string;
  };
  lines: {
    idx: number;
    description: string;
    qty: number;
    unitPrice: number;
    discountPercent: number;
    taxRate: number;
    netTotal: number;
    grossTotal: number;
  }[];
  totals: {
    subtotalNet: number;
    totalTax: number;
    grossTotal: number;
    withholdingTax: number;
    finalPayable: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    changeAmount: number;
  };
  taxes: FormattedReceiptTaxLine[];
  fiscal: {
    hash4: string;
    fullHash: string;
    previousHash: string;
    legalNotice: string;
    qrCodeContent: string;
  };
  operator: string;
  terminal: string;
}


