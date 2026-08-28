import { AuditRecord, SystemEvent } from '../types/pulse';

export class AuditLedger {
  private records: AuditRecord[] = [];

  constructor() {
    this.records.push({
      id: 'aud_init_01',
      eventId: 'evt_genesis_00',
      actor: 'system',
      action: 'SYSTEM_BOOT',
      entityType: 'platform',
      entityId: 'tenant_luanda_01',
      before: null,
      after: { status: 'INITIALIZED', kernelVersion: '2.0-ULCE' },
      timestamp: new Date().toISOString(),
    });
  }

  public process(event: SystemEvent): void {
    const record: AuditRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: event.eventId,
      actor: `${event.userName} (${event.userId})`,
      action: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      before: event.previousState || null,
      after: event.payload,
      timestamp: event.timestamp,
    };

    this.records.unshift(record);
  }

  public record(entry: AuditRecord): void {
    this.records.unshift(entry);
  }

  public getRecords(): AuditRecord[] {
    return [...this.records];
  }

  public getRecordsByEntity(entityType: string, entityId: string): AuditRecord[] {
    return this.records.filter(
      (r) => r.entityType === entityType && r.entityId === entityId
    );
  }
}
