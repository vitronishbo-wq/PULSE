import {
  Document,
  DocumentType,
  DocumentStatus,
  DocumentLine,
  PaymentMethod,
  SystemEvent,
} from '../types/pulse';
import { FiscalEngine } from './FiscalEngine';
import { EventBus } from './EventBus';

export class CommerceEngine {
  private documents: Map<string, Document> = new Map();
  private seriesCounters: Record<string, number> = {
    'FT 2026': 1,
    'FR 2026': 1,
    'OR 2026': 1,
    'QT 2026': 1,
    'NC 2026': 0,
    'PP 2026': 1,
    'VD 2026': 1,
  };
  private lastDocHash = 'PULSE_GENESIS_HASH_2026';
  private fiscalEngine: FiscalEngine;
  private eventBus: EventBus;

  constructor(fiscalEngine: FiscalEngine, eventBus: EventBus) {
    this.fiscalEngine = fiscalEngine;
    this.eventBus = eventBus;

    // Seed initial posted document
    const initLines: DocumentLine[] = [
      {
        id: 'line_init_1',
        productId: 'prod_water_pack',
        sku: 'WATER_24',
        description: 'Água Pura da Chela 1.5L (Cx 24un)',
        qty: 6,
        unitPrice: 7500,
        discount: 0,
        taxRate: 14,
        netTotal: 39473.68,
        taxTotal: 5526.32,
        grossTotal: 45000,
      },
    ];

    const hash = this.fiscalEngine.getAdapter().generateHash(
      { date: '2026-08-21', docNumber: 'FR 2026/001', grossAmount: 45000 },
      this.lastDocHash
    );
    this.lastDocHash = hash;

    const doc: Document = {
      id: 'doc_init_01',
      docType: 'RECEIPT',
      series: 'FR 2026',
      number: 1,
      docNumber: 'FR 2026/001',
      status: 'POSTED',
      customerId: 'cust_01',
      customerName: 'Consumidor Final',
      customerTaxId: '999999999',
      date: '2026-08-21',
      lines: initLines,
      netAmount: 39473.68,
      taxAmount: 5526.32,
      grossAmount: 45000,
      paymentMethod: 'CASH',
      paidAmount: 45000,
      hash,
      previousDocHash: 'PULSE_GENESIS_HASH_2026',
      branchId: 'branch_marginal',
      createdBy: 'João Manuel',
      notes: 'Venda de Balcão a Dinheiro',
    };

    this.documents.set(doc.id, doc);
  }

  public getDocuments(): Document[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  private getSeriesPrefix(type: DocumentType): string {
    switch (type) {
      case 'INVOICE':
        return 'FT 2026';
      case 'RECEIPT':
        return 'FR 2026';
      case 'ORDER':
        return 'OR 2026';
      case 'QUOTATION':
        return 'QT 2026';
      case 'PROFORMA':
        return 'PP 2026';
      case 'CREDIT_NOTE':
        return 'NC 2026';
      default:
        return 'VD 2026';
    }
  }

  public createDocument(params: {
    docType: DocumentType;
    customerId?: string;
    customerName?: string;
    customerTaxId?: string;
    supplierId?: string;
    supplierName?: string;
    lines: DocumentLine[];
    paymentMethod: PaymentMethod;
    paidAmount?: number;
    notes?: string;
    branchId?: string;
    actor: { uid: string; name: string };
    status?: DocumentStatus;
    derivedFrom?: string;
  }): Document {
    const series = this.getSeriesPrefix(params.docType);
    this.seriesCounters[series] = (this.seriesCounters[series] || 0) + 1;
    const num = this.seriesCounters[series];
    const docNumber = `${series}/${num.toString().padStart(3, '0')}`;

    const netAmount = params.lines.reduce((acc, l) => acc + l.netTotal, 0);
    const taxAmount = params.lines.reduce((acc, l) => acc + l.taxTotal, 0);
    const grossAmount = params.lines.reduce((acc, l) => acc + l.grossTotal, 0);

    const date = new Date().toISOString().split('T')[0];
    const previousHash = this.lastDocHash;

    const hash = this.fiscalEngine.getAdapter().generateHash(
      { date, docNumber, grossAmount },
      previousHash
    );
    this.lastDocHash = hash;

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const status: DocumentStatus = params.status || 'POSTED';

    const document: Document = {
      id: docId,
      docType: params.docType,
      series,
      number: num,
      docNumber,
      status,
      customerId: params.customerId,
      customerName: params.customerName || 'Consumidor Final',
      customerTaxId: params.customerTaxId || '999999999',
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      date,
      lines: params.lines,
      netAmount,
      taxAmount,
      grossAmount,
      paymentMethod: params.paymentMethod,
      paidAmount: params.paidAmount ?? (params.paymentMethod === 'CREDIT' ? 0 : grossAmount),
      hash,
      previousDocHash: previousHash,
      derivedFrom: params.derivedFrom,
      notes: params.notes,
      branchId: params.branchId || 'branch_marginal',
      createdBy: params.actor.name,
    };

    // Store in collection
    this.documents.set(document.id, document);

    // Event side-effects calculation
    const sideEffects: string[] = [
      `1. Documento ${docNumber} emitido com Assinatura AGT [${hash.slice(0, 10)}...]`,
      `2. Movimentação de Stock Registada (Saída de ${params.lines.reduce((a, b) => a + b.qty, 0)} unidades / desdobramento de receitas BOM)`,
      `3. Lançamento Automático em Partidas Dobradas gerado no Diário de Contabilidade`,
      params.paymentMethod === 'CREDIT'
        ? `4. Conta Corrente a Receber do Cliente ${params.customerName} debitada em ${grossAmount.toLocaleString()} Kz`
        : `4. Tesouraria / Caixa atualizado no montante de ${grossAmount.toLocaleString()} Kz (${params.paymentMethod})`,
      `5. Registo Imutável no AUDIT_LEDGER gravado com sucesso`,
    ];

    // Publish standardized event to the Event Bus
    this.eventBus.publish({
      eventType: params.docType === 'QUOTATION' ? 'DOCUMENT_ISSUED' : 'SALE_CREATED',
      tenantId: 'tenant_luanda_01',
      userId: params.actor.uid,
      userName: params.actor.name,
      source: 'POS',
      entityType: 'documents',
      entityId: document.id,
      payload: document,
      sideEffects,
    });

    return document;
  }

  /**
   * Derive an existing document (e.g. ORDER or QUOTATION -> INVOICE)
   */
  public deriveDocument(
    parentDocId: string,
    targetType: DocumentType,
    paymentMethod: PaymentMethod,
    actor: { uid: string; name: string }
  ): Document | null {
    const parent = this.documents.get(parentDocId);
    if (!parent) return null;

    return this.createDocument({
      docType: targetType,
      customerId: parent.customerId,
      customerName: parent.customerName,
      customerTaxId: parent.customerTaxId,
      lines: [...parent.lines],
      paymentMethod,
      notes: `Derivado do documento original ${parent.docNumber}`,
      actor,
      derivedFrom: parent.id,
      status: 'POSTED',
    });
  }

  public updateStatus(docId: string, newStatus: DocumentStatus, actor: { uid: string; name: string }): Document | null {
    const doc = this.documents.get(docId);
    if (!doc) return null;

    const previousState = { ...doc };
    doc.status = newStatus;

    this.eventBus.publish({
      eventType: newStatus === 'CANCELLED' ? 'DOCUMENT_CANCELLED' : 'DOCUMENT_ISSUED',
      tenantId: 'tenant_luanda_01',
      userId: actor.uid,
      userName: actor.name,
      source: 'ORCHESTRATOR',
      entityType: 'documents',
      entityId: doc.id,
      previousState,
      payload: doc,
      sideEffects: [`Estado do documento alterado para ${newStatus}`],
    });

    return doc;
  }

  public process(event: SystemEvent): void {
    // React to external events if needed
  }
}
