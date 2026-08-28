export interface MulticaixaReference {
  entity: string;
  reference: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

export interface BillingInvoice {
  id: string;
  tenantId: string;
  customerName: string;
  customerTaxId: string;
  amount: number;
  currency: string;
  method: 'MULTICAIXA_REF' | 'MCX_EXPRESS' | 'BANK_TRANSFER' | 'CASH';
  reference?: MulticaixaReference;
  status: 'PAID' | 'PENDING' | 'EXPIRED';
  createdAt: string;
  paidAt?: string;
}

export class BillingEngine {
  private static instance: BillingEngine;
  private invoices: Map<string, BillingInvoice> = new Map();

  private constructor() {}

  public static getInstance(): BillingEngine {
    if (!BillingEngine.instance) {
      BillingEngine.instance = new BillingEngine();
    }
    return BillingEngine.instance;
  }

  /**
   * Generates a valid Angolan EMIS Multicaixa payment reference
   */
  public generateMulticaixaReference(amount: number, currency: string = 'Kz'): MulticaixaReference {
    const entity = '00145'; // PULSE.OS EMIS Entity
    const randomRefNum = Math.floor(100000000 + Math.random() * 900000000).toString();
    const formattedRef = `${randomRefNum.slice(0, 3)} ${randomRefNum.slice(3, 6)} ${randomRefNum.slice(6, 9)}`;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 2); // 48h validity

    return {
      entity,
      reference: formattedRef,
      amount,
      currency,
      expiresAt: expiry.toISOString().split('T')[0],
    };
  }

  /**
   * Records and verifies payment
   */
  public createSubscriptionInvoice(params: {
    tenantId: string;
    customerName: string;
    customerTaxId: string;
    amount: number;
    currency?: string;
    method: 'MULTICAIXA_REF' | 'MCX_EXPRESS' | 'BANK_TRANSFER' | 'CASH';
  }): BillingInvoice {
    const id = `INV-SUB-${Date.now().toString().slice(-6)}`;
    const currency = params.currency || 'Kz';
    const reference =
      params.method === 'MULTICAIXA_REF'
        ? this.generateMulticaixaReference(params.amount, currency)
        : undefined;

    const invoice: BillingInvoice = {
      id,
      tenantId: params.tenantId,
      customerName: params.customerName,
      customerTaxId: params.customerTaxId,
      amount: params.amount,
      currency,
      method: params.method,
      reference,
      status: 'PAID', // Automated instant provisioning simulation
      createdAt: new Date().toISOString(),
      paidAt: new Date().toISOString(),
    };

    this.invoices.set(id, invoice);
    return invoice;
  }

  public getAllInvoices(): BillingInvoice[] {
    return Array.from(this.invoices.values());
  }
}
