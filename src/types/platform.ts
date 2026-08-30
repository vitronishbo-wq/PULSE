import { BusinessSegment, ModuleId, TenantProfile } from './pulse';

export type TenantLifecycleStatus =
  | 'PENDING'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'EXPIRED'
  | 'ARCHIVED';

export interface TenantImpersonationLog {
  id: string;
  adminUser: string;
  targetTenantId: string;
  targetTenantName: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
  active: boolean;
}

export interface ProfileChangeRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  currentSegment: BusinessSegment;
  requestedSegment: BusinessSegment;
  requestedModules: ModuleId[];
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ProvisioningPipelineStep {
  id: string;
  name: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'FAILED';
  details: string;
}

export interface PlatformPlan {
  id: string;
  name: string;
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE' | 'CUSTOM';
  basePrice: number;
  maxUsers: number;
  maxTerminals: number;
  maxTransactions: number;
  includesSupport: boolean;
  active: boolean;
  description: string;
}

export interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planName: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIAL';
  startDate: string;
  nextBillingDate: string;
  renewalAuto: boolean;
  amountMonthly: number;
  rsaKeyFingerprint: string;
  hardwareFingerprint: string;
}

export interface PlatformModuleCatalogItem {
  id: ModuleId;
  name: string;
  category: 'CORE' | 'OPERATIONS' | 'FINANCE' | 'HARDWARE' | 'COMPLIANCE';
  price: number;
  requiredDependencies: ModuleId[];
  conflictsWith?: ModuleId[];
  isCore: boolean;
  description: string;
  enabledByDefaultIn: BusinessSegment[];
}

export interface PricingMatrixRule {
  segment: BusinessSegment;
  segmentName: string;
  baseMonthly: number;
  quarterlyDiscountPct: number;
  annualDiscountPct: number;
  taxRatePct: number;
}

export interface PlatformInvoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenantName: string;
  tenantTaxId: string;
  segment: BusinessSegment;
  modules: string[];
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: 'MULTICAIXA_REF' | 'MCX_EXPRESS' | 'BANK_TRANSFER' | 'CASH';
  paymentRef?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
}

export interface PaymentTransaction {
  id: string;
  txRef: string;
  emisEntity: string;
  emisReference: string;
  tenantId: string;
  tenantName: string;
  grossAmount: number;
  platformFeeAmount: number;
  platformFeePercent: number;
  netSettlementAmount: number;
  currency: string;
  paymentMethod: 'MULTICAIXA_REF' | 'MCX_EXPRESS' | 'BANK_TRANSFER' | 'CARD_POS';
  status: 'PAID' | 'PENDING' | 'RECONCILED' | 'SETTLED';
  createdAt: string;
  settledAt?: string;
}

export interface TenantSettlement {
  id: string;
  settlementBatchRef: string;
  tenantId: string;
  tenantName: string;
  iban: string;
  bankName: string;
  totalGross: number;
  totalPlatformFees: number;
  netPayoutAmount: number;
  txCount: number;
  status: 'PENDING_APPROVAL' | 'PROCESSING' | 'SETTLED' | 'FAILED';
  payoutDate: string;
  proofDocRef?: string;
}

export interface ReconciliationEntry {
  id: string;
  statementDate: string;
  bankReference: string;
  emisReference: string;
  systemAmount: number;
  statementAmount: number;
  discrepancy: number;
  status: 'MATCHED' | 'UNMATCHED' | 'RESOLVED';
  notes?: string;
}

export interface TenantUsageRecord {
  tenantId: string;
  tenantName: string;
  segment: BusinessSegment;
  totalSalesCount: number;
  totalVolumeKz: number;
  activeUsers: number;
  storageUsedMb: number;
  apiCallsCount: number;
  lastActive: string;
}

export interface ModuleUsageTelemetry {
  moduleId: ModuleId;
  name: string;
  activeTenantsCount: number;
  totalInvocations: number;
  avgLatencyMs: number;
  failureRate: number;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  source: 'AUTH' | 'RBAC' | 'IMPERSONATION' | 'ENCRYPTION' | 'CONFIG';
  description: string;
  actor: string;
  ipAddress: string;
  payload?: any;
}

export interface ConfigurationChange {
  id: string;
  timestamp: string;
  entity: string;
  entityId: string;
  changedBy: string;
  previousValue: string;
  newValue: string;
  changeReason: string;
}

export interface KernelFailedJob {
  id: string;
  queueName: string;
  jobName: string;
  tenantId?: string;
  errorStack: string;
  attempts: number;
  failedAt: string;
  status: 'FAILED' | 'RETRYING' | 'RESOLVED';
}

export interface SystemHealthCheck {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  message: string;
}

export interface UniversalCommandDef {
  code: string;
  shortcut: string;
  voicePhrases: string[];
  scope: 'GLOBAL' | 'POS' | 'STOCK' | 'TREASURY' | 'DOCS';
  description: string;
}

export interface PlatformCountryConfig {
  code: string;
  name: string;
  defaultCurrency: string;
  fiscalAuthority: string;
  standardVatRate: number;
  reducedVatRates: number[];
  retentionRate: number;
  saftVersion: string;
  active: boolean;
}

export interface PlatformPaymentProvider {
  id: string;
  name: string;
  type: 'GATEWAY' | 'CARD_ACQUIRER' | 'REFERENCE_AGGREGATOR';
  status: 'ACTIVE' | 'SANDBOX' | 'INACTIVE';
  supportedCurrencies: string[];
  settlementCadence: string;
  entityCode?: string;
}

export interface PlatformAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'COMPLIANCE_OFFICER' | 'BILLING_ADMIN' | 'SUPPORT_ENGINEER';
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin: string;
  status: 'ACTIVE' | 'LOCKED';
}

export interface AdminSession {
  id: string;
  adminEmail: string;
  adminName: string;
  role: string;
  ipAddress: string;
  location: string;
  userAgent: string;
  loggedInAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface PlatformSecurityPolicy {
  id: string;
  category: 'AUTH' | 'DATA' | 'AUDIT' | 'FISCAL';
  ruleName: string;
  value: string | number | boolean;
  description: string;
}
