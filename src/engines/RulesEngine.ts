import { Command, RuleValidationResult, RuleViolation, TenantProfile, User } from '../types/pulse';

export class RulesEngine {
  private static instance: RulesEngine;

  private constructor() {}

  public static getInstance(): RulesEngine {
    if (!RulesEngine.instance) {
      RulesEngine.instance = new RulesEngine();
    }
    return RulesEngine.instance;
  }

  /**
   * Validate a command against multi-tenant isolation, license, RBAC, and domain rules
   */
  public validateCommand(command: Command, tenant: TenantProfile, actor: User): RuleValidationResult {
    const violations: RuleViolation[] = [];

    // 1. Mandatory Tenant ID & Matching Isolation Rule
    if (!command.tenantId || command.tenantId.trim() === '') {
      violations.push({
        code: 'TENANT_ID_REQUIRED',
        field: 'tenantId',
        message: 'O campo tenantId é estritamente obrigatório em todos os comandos do Kernel.',
        severity: 'CRITICAL',
      });
    }

    if (tenant.id !== command.tenantId && actor.role !== 'platform_admin') {
      violations.push({
        code: 'TENANT_ISOLATION_BREACH',
        field: 'tenantId',
        message: `Violação de isolamento multi-tenant: O utilizador pertence ao tenant ${actor.branchId} mas tentou executar no tenant ${command.tenantId}.`,
        severity: 'CRITICAL',
      });
    }

    // 2. Active License & Expiry Rule
    if (!tenant.activeLicense || tenant.licenseStatus === 'SUSPENDED') {
      violations.push({
        code: 'TENANT_LICENSE_SUSPENDED',
        field: 'licenseStatus',
        message: `O Tenant ${tenant.tradeName} encontra-se suspenso ou com licença inativa. Contacte o administrador da plataforma.`,
        severity: 'CRITICAL',
      });
    }

    if (tenant.licenseExpiry) {
      const expiry = new Date(tenant.licenseExpiry).getTime();
      const now = new Date().getTime();
      if (now > expiry && tenant.licenseStatus !== 'TRIAL') {
        violations.push({
          code: 'TENANT_LICENSE_EXPIRED',
          field: 'licenseExpiry',
          message: `A licença do Tenant ${tenant.tradeName} expirou em ${tenant.licenseExpiry}.`,
          severity: 'CRITICAL',
        });
      }
    }

    // 3. RBAC (Role-Based Access Control) Rules
    const allowedRolesForCommand: Record<string, string[]> = {
      ISSUE_SALES_DOCUMENT: ['platform_admin', 'tenant_owner', 'manager', 'cashier', 'seller'],
      REGISTER_PURCHASE: ['platform_admin', 'tenant_owner', 'manager'],
      RECEIVE_PAYMENT: ['platform_admin', 'tenant_owner', 'manager', 'cashier'],
      SEND_PAYMENT: ['platform_admin', 'tenant_owner', 'manager'],
      ADJUST_STOCK: ['platform_admin', 'tenant_owner', 'manager'],
      PRODUCE_RECIPE: ['platform_admin', 'tenant_owner', 'manager', 'cashier'],
      PROCESS_PAYROLL: ['platform_admin', 'tenant_owner', 'manager'],
      SWITCH_TENANT: ['platform_admin', 'tenant_owner', 'manager', 'cashier', 'seller', 'viewer'],
      RENEW_LICENSE: ['platform_admin'],
      EXECUTE_AUTOMATION: ['platform_admin', 'tenant_owner', 'manager'],
    };

    const allowed = allowedRolesForCommand[command.commandType] || ['platform_admin', 'tenant_owner'];
    if (!allowed.includes(actor.role)) {
      violations.push({
        code: 'RBAC_PERMISSION_DENIED',
        field: 'actor.role',
        message: `O cargo '${actor.role}' não tem permissão para executar o comando '${command.commandType}'. Cargos autorizados: ${allowed.join(', ')}.`,
        severity: 'CRITICAL',
      });
    }

    // 4. Feature Flag Enabled Verification Rule
    if (command.commandType === 'ISSUE_SALES_DOCUMENT' && !tenant.featureFlags?.posEnabled) {
      violations.push({
        code: 'FEATURE_FLAG_DISABLED',
        field: 'featureFlags.posEnabled',
        message: 'O módulo de Vendas/POS encontra-se desativado para este tenant.',
        severity: 'CRITICAL',
      });
    }

    if (command.commandType === 'PRODUCE_RECIPE' && !tenant.featureFlags?.recipesBomEnabled) {
      violations.push({
        code: 'FEATURE_FLAG_DISABLED',
        field: 'featureFlags.recipesBomEnabled',
        message: 'O módulo de Receitas / Produção (BOM) encontra-se desativado para este tenant.',
        severity: 'CRITICAL',
      });
    }

    if (command.commandType === 'PROCESS_PAYROLL' && !tenant.featureFlags?.treasuryEnabled) {
      violations.push({
        code: 'FEATURE_FLAG_DISABLED',
        field: 'featureFlags.treasuryEnabled',
        message: 'O módulo de Tesouraria/Processamento salarial encontra-se desativado para este tenant.',
        severity: 'CRITICAL',
      });
    }

    // 5. Domain Payload Constraints
    if (command.commandType === 'ISSUE_SALES_DOCUMENT' || command.commandType === 'REGISTER_PURCHASE') {
      const items = command.payload?.items || command.payload?.lines || [];
      if (!Array.isArray(items) || items.length === 0) {
        violations.push({
          code: 'EMPTY_DOCUMENT_LINES',
          field: 'payload.items',
          message: 'Um documento comercial não pode ser emitido sem linhas de artigos ou serviços.',
          severity: 'CRITICAL',
        });
      }
    }

    return {
      valid: violations.filter((v) => v.severity === 'CRITICAL').length === 0,
      violations,
    };
  }
}
