import {
  Customer,
  Supplier,
  Payment,
  SystemEvent,
} from '../types/pulse';

export class MoneyEngine {
  private cashBalance = 640000;
  private bankBalance = 890000;
  private customers: Map<string, Customer> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private payments: Payment[] = [];

  constructor(initialCustomers: Customer[], initialSuppliers: Supplier[]) {
    initialCustomers.forEach((c) => this.customers.set(c.id, { ...c }));
    initialSuppliers.forEach((s) => this.suppliers.set(s.id, { ...s }));

    // Seed some initial payments
    this.payments.push({
      id: 'pay_init_01',
      docNumber: 'FR 2026/001',
      customerName: 'Consumidor Final',
      amount: 45000,
      method: 'CASH',
      reference: 'CAIXA_BALCAO',
      status: 'RECONCILED',
      date: new Date().toISOString().split('T')[0],
      notes: 'Recebimento Venda Balcão',
    });
  }

  public getCashBalance(): number {
    return this.cashBalance;
  }

  public getBankBalance(): number {
    return this.bankBalance;
  }

  public receiveCustomerPayment(
    params: { customerId: string; amount: number; method: any; notes?: string },
    actor: { uid: string; name: string }
  ): void {
    this.handlePaymentReceived(params);
  }

  public paySupplier(
    params: { supplierId: string; amount: number; method: any; notes?: string },
    actor: { uid: string; name: string }
  ): void {
    this.handlePaymentSent(params);
  }

  public getBalances() {
    let totalReceivables = 0;
    this.customers.forEach((c) => {
      if (c.currentBalance > 0) totalReceivables += c.currentBalance;
    });

    let totalPayables = 0;
    this.suppliers.forEach((s) => {
      if (s.currentBalance > 0) totalPayables += s.currentBalance;
    });

    return {
      cashBalance: this.cashBalance,
      bankBalance: this.bankBalance,
      totalCashFlow: this.cashBalance + this.bankBalance,
      totalReceivables,
      totalPayables,
      netWorkingCapital: this.cashBalance + this.bankBalance + totalReceivables - totalPayables,
    };
  }

  public getCustomers(): Customer[] {
    return Array.from(this.customers.values());
  }

  public getCustomer(id: string): Customer | undefined {
    return this.customers.get(id);
  }

  public getSuppliers(): Supplier[] {
    return Array.from(this.suppliers.values());
  }

  public getSupplier(id: string): Supplier | undefined {
    return this.suppliers.get(id);
  }

  public getPayments(): Payment[] {
    return [...this.payments];
  }

  public process(event: SystemEvent): void {
    const { eventType, payload } = event;

    if (eventType === 'SALE_CREATED' || (eventType === 'DOCUMENT_ISSUED' && (payload.docType === 'INVOICE' || payload.docType === 'RECEIPT'))) {
      this.handleSalePayment(payload);
    } else if (eventType === 'PAYMENT_RECEIVED') {
      this.handlePaymentReceived(payload);
    } else if (eventType === 'PURCHASE_CREATED') {
      this.handlePurchasePayment(payload);
    } else if (eventType === 'PAYMENT_SENT') {
      this.handlePaymentSent(payload);
    }
  }

  private handleSalePayment(doc: any): void {
    const gross = doc.grossAmount || 0;
    const method = doc.paymentMethod || 'CASH';
    const customer = doc.customerId ? this.customers.get(doc.customerId) : undefined;

    if (method === 'CREDIT') {
      // Sale on Credit -> Increases Account Receivable
      if (customer) {
        customer.currentBalance += gross;
      }
    } else if (method === 'CASH') {
      this.cashBalance += gross;
      this.payments.unshift({
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        docId: doc.id,
        docNumber: doc.docNumber,
        customerId: doc.customerId,
        customerName: doc.customerName || 'Consumidor Final',
        amount: gross,
        method: 'CASH',
        reference: `POS-RECEIPT-${doc.docNumber || doc.id}`,
        status: 'RECONCILED',
        date: doc.date || new Date().toISOString().split('T')[0],
        notes: `Liquidado a Pronto (Dinheiro) no ato da emissão`,
      });
    } else if (method === 'CARD' || method === 'BANK_TRANSFER') {
      this.bankBalance += gross;
      this.payments.unshift({
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        docId: doc.id,
        docNumber: doc.docNumber,
        customerId: doc.customerId,
        customerName: doc.customerName || 'Consumidor Final',
        amount: gross,
        method,
        reference: `TPA-REF-${Date.now().toString().slice(-6)}`,
        status: 'RECONCILED',
        date: doc.date || new Date().toISOString().split('T')[0],
        notes: `Liquidado via ${method === 'CARD' ? 'TPA / Multicaixa' : 'Transferência Bancária'}`,
      });
    }
  }

  private handlePaymentReceived(payload: { customerId: string; amount: number; method: any; reference?: string; notes?: string }): void {
    const customer = this.customers.get(payload.customerId);
    if (customer) {
      customer.currentBalance = Math.max(0, customer.currentBalance - payload.amount);
    }

    if (payload.method === 'CASH') {
      this.cashBalance += payload.amount;
    } else {
      this.bankBalance += payload.amount;
    }

    this.payments.unshift({
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerId: payload.customerId,
      customerName: customer?.name || 'Cliente',
      amount: payload.amount,
      method: payload.method || 'CASH',
      reference: payload.reference || `RECIBO-${Date.now().toString().slice(-6)}`,
      status: 'RECONCILED',
      date: new Date().toISOString().split('T')[0],
      notes: payload.notes || 'Amortização de Conta Corrente / Recebimento de Crédito',
    });
  }

  private handlePurchasePayment(purchase: any): void {
    const total = purchase.grossTotal || purchase.totalAmount || 0;
    const isCredit = purchase.paymentTerms?.toLowerCase().includes('dias') || purchase.paymentMethod === 'CREDIT';

    if (isCredit && purchase.supplierId) {
      const supplier = this.suppliers.get(purchase.supplierId);
      if (supplier) {
        supplier.currentBalance += total;
      }
    } else {
      if (purchase.paymentMethod === 'CASH') {
        this.cashBalance -= total;
      } else {
        this.bankBalance -= total;
      }
    }
  }

  private handlePaymentSent(payload: { supplierId: string; amount: number; method: any; reference?: string }): void {
    const supplier = this.suppliers.get(payload.supplierId);
    if (supplier) {
      supplier.currentBalance = Math.max(0, supplier.currentBalance - payload.amount);
    }
    if (payload.method === 'CASH') {
      this.cashBalance -= payload.amount;
    } else {
      this.bankBalance -= payload.amount;
    }
  }

  public adjustCashBalance(amount: number): void {
    this.cashBalance += amount;
  }

  public adjustBankBalance(amount: number): void {
    this.bankBalance += amount;
  }

  public transferFunds(from: 'CASH' | 'BANK', to: 'CASH' | 'BANK', amount: number): void {
    if (from === 'CASH') {
      this.cashBalance -= amount;
    } else {
      this.bankBalance -= amount;
    }

    if (to === 'CASH') {
      this.cashBalance += amount;
    } else {
      this.bankBalance += amount;
    }
  }

  public upsertCustomer(customer: Customer): void {
    this.customers.set(customer.id, { ...customer });
  }

  public upsertSupplier(supplier: Supplier): void {
    this.suppliers.set(supplier.id, { ...supplier });
  }
}
