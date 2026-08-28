import { AutomationRule, SystemEvent } from '../types/pulse';
import { initialAutomationRules } from '../data/seedData';

export interface AutomatedActionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  actionType: string;
  details: string;
  timestamp: string;
  status: 'EXECUTED' | 'PENDING_APPROVAL';
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private executionLogs: AutomatedActionLog[] = [];
  private onTriggerCallback?: (log: AutomatedActionLog) => void;

  constructor() {
    initialAutomationRules.forEach((r) => this.rules.set(r.id, { ...r }));
  }

  public setOnTrigger(callback: (log: AutomatedActionLog) => void) {
    this.onTriggerCallback = callback;
  }

  public getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  public getExecutionLogs(): AutomatedActionLog[] {
    return [...this.executionLogs];
  }

  public toggleRule(id: string, enabled: boolean): void {
    const rule = this.rules.get(id);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  public process(event: SystemEvent): void {
    this.rules.forEach((rule) => {
      if (!rule.enabled || rule.triggerEvent !== event.eventType) return;

      let conditionMet = false;
      let actionDetails = '';

      if (rule.triggerEvent === 'STOCK_LOW') {
        conditionMet = true;
        const prod = event.payload?.product || event.payload;
        actionDetails = `Sugestão de Compra Automática gerada para "${prod?.name || 'Artigo'}": Recomenda-se encomenda de reposição de 50 un.`;
      } else if (rule.triggerEvent === 'SALE_CREATED') {
        const gross = event.payload?.grossAmount || 0;
        if (gross >= 500000) {
          conditionMet = true;
          actionDetails = `Notificação Prioritária de Alto Valor: Venda ${event.payload?.docNumber || ''} no montante de ${gross.toLocaleString()} Kz enviada ao Gerente.`;
        }
      } else if (rule.triggerEvent === 'DOCUMENT_ISSUED') {
        conditionMet = true;
        actionDetails = `Assinatura Digital Fiscal Gerada com Sucesso [${event.payload?.hash || ''}].`;
      }

      if (conditionMet) {
        rule.triggerCount += 1;
        rule.lastTriggered = new Date().toISOString();

        const log: AutomatedActionLog = {
          id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          actionType: rule.actionType,
          details: actionDetails,
          timestamp: new Date().toISOString(),
          status: 'EXECUTED',
        };

        this.executionLogs.unshift(log);
        if (this.onTriggerCallback) {
          this.onTriggerCallback(log);
        }
      }
    });
  }
}
