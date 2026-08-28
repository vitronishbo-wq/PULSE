import { AccountingEntry, SystemEvent } from '../types/pulse';

export class AccountingEngine {
  private entries: AccountingEntry[] = [];

  constructor() {
    // Seed initial journal entry
    this.entries.push({
      id: 'acc_init_01',
      docNumber: 'FR 2026/001',
      date: new Date().toISOString().split('T')[0],
      description: 'Venda de Mercadorias a Pronto Pagamento',
      debitAccount: '43.1',
      debitAccountName: 'Caixa Geral (Disponibilidades)',
      creditAccount: '71.1',
      creditAccountName: 'Vendas de Mercadorias (Proveitos)',
      amount: 39473.68,
      currency: 'Kz',
    });
    this.entries.push({
      id: 'acc_init_02',
      docNumber: 'FR 2026/001',
      date: new Date().toISOString().split('T')[0],
      description: 'IVA Liquidado 14% - FR 2026/001',
      debitAccount: '43.1',
      debitAccountName: 'Caixa Geral',
      creditAccount: '24.1.3',
      creditAccountName: 'Estado - IVA Liquidado (Passivo)',
      amount: 5526.32,
      currency: 'Kz',
    });
  }

  public getEntries(): AccountingEntry[] {
    return [...this.entries];
  }

  public getAccountBalances() {
    const map: Record<string, { code: string; name: string; debit: number; credit: number; balance: number; type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' }> = {
      '21': { code: '21', name: 'Clientes (Contas a Receber)', debit: 0, credit: 0, balance: 0, type: 'ASSET' },
      '22': { code: '22', name: 'Fornecedores (Contas a Pagar)', debit: 0, credit: 0, balance: 0, type: 'LIABILITY' },
      '24': { code: '24', name: 'Estado e Entes Públicos (IVA)', debit: 0, credit: 0, balance: 0, type: 'LIABILITY' },
      '32': { code: '32', name: 'Mercadorias / Existências', debit: 1250000, credit: 0, balance: 1250000, type: 'ASSET' },
      '43': { code: '43', name: 'Caixa (Numerário em Mão)', debit: 640000, credit: 0, balance: 640000, type: 'ASSET' },
      '45': { code: '45', name: 'Bancos e TPA (Depósitos à Ordem)', debit: 890000, credit: 0, balance: 890000, type: 'ASSET' },
      '61': { code: '61', name: 'Custo das Mercadorias Vendidas (CMVMC)', debit: 0, credit: 0, balance: 0, type: 'EXPENSE' },
      '71': { code: '71', name: 'Vendas e Prestação de Serviços (Proveitos)', debit: 0, credit: 0, balance: 0, type: 'REVENUE' },
    };

    this.entries.forEach((e) => {
      const dPrefix = e.debitAccount.split('.')[0];
      const cPrefix = e.creditAccount.split('.')[0];

      if (map[dPrefix]) {
        map[dPrefix].debit += e.amount;
      }
      if (map[cPrefix]) {
        map[cPrefix].credit += e.amount;
      }
    });

    Object.values(map).forEach((acc) => {
      if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
        acc.balance = acc.debit - acc.credit;
      } else {
        acc.balance = acc.credit - acc.debit;
      }
    });

    return Object.values(map);
  }

  public process(event: SystemEvent): void {
    const { eventType, payload } = event;

    if (eventType === 'SALE_CREATED' || (eventType === 'DOCUMENT_ISSUED' && (payload.docType === 'INVOICE' || payload.docType === 'RECEIPT'))) {
      this.handleSaleAccounting(payload);
    } else if (eventType === 'PAYMENT_RECEIVED') {
      this.handlePaymentReceivedAccounting(payload);
    } else if (eventType === 'PURCHASE_CREATED') {
      this.handlePurchaseAccounting(payload);
    }
  }

  private handleSaleAccounting(doc: any): void {
    const date = doc.date || new Date().toISOString().split('T')[0];
    const docNumber = doc.docNumber || doc.id;
    const net = doc.netAmount || 0;
    const tax = doc.taxAmount || 0;
    const gross = doc.grossAmount || (net + tax);
    const method = doc.paymentMethod || 'CASH';

    let debitAcc = '43.1';
    let debitAccName = 'Caixa Geral (Disponibilidades)';
    if (method === 'CREDIT') {
      debitAcc = '21.1';
      debitAccName = `Clientes Conta Corrente [${doc.customerName || 'Cliente'}]`;
    } else if (method === 'CARD' || method === 'BANK_TRANSFER') {
      debitAcc = '45.1';
      debitAccName = 'Bancos / Depósitos à Ordem';
    }

    // Double-Entry 1: Debit Cash/Customer, Credit Revenue 71 (Net)
    if (net > 0) {
      this.entries.unshift({
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        docId: doc.id,
        docNumber,
        date,
        description: `Registo de Venda - ${docNumber} (${doc.customerName || 'Consumidor Final'})`,
        debitAccount: debitAcc,
        debitAccountName: debitAccName,
        creditAccount: '71.1',
        creditAccountName: 'Vendas de Mercadorias (Proveitos)',
        amount: Math.round(net * 100) / 100,
        currency: 'Kz',
      });
    }

    // Double-Entry 2: Debit Cash/Customer, Credit VAT Payable 24 (Tax)
    if (tax > 0) {
      this.entries.unshift({
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        docId: doc.id,
        docNumber,
        date,
        description: `IVA Liquidado (Regime Geral AGT) - ${docNumber}`,
        debitAccount: debitAcc,
        debitAccountName: debitAccName,
        creditAccount: '24.1.3',
        creditAccountName: 'Estado - IVA Liquidado a Pagar',
        amount: Math.round(tax * 100) / 100,
        currency: 'Kz',
      });
    }

    // Double-Entry 3: Estimate Cost of Goods Sold (CMVMC 61 / Inventory 32)
    const estimatedCost = (doc.lines || []).reduce((acc: number, l: any) => acc + ((l.unitCost || l.unitPrice * 0.6) * l.qty), 0);
    if (estimatedCost > 0) {
      this.entries.unshift({
        id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        docId: doc.id,
        docNumber,
        date,
        description: `Custo das Existências Vendidas (CMVMC) - ${docNumber}`,
        debitAccount: '61.1',
        debitAccountName: 'Custo das Mercadorias Vendidas e Matérias Consumidas',
        creditAccount: '32.1',
        creditAccountName: 'Existências / Mercadorias em Armazém',
        amount: Math.round(estimatedCost * 100) / 100,
        currency: 'Kz',
      });
    }
  }

  private handlePaymentReceivedAccounting(payload: any): void {
    const amount = payload.amount || 0;
    const date = new Date().toISOString().split('T')[0];
    const isCash = payload.method === 'CASH';

    this.entries.unshift({
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      description: `Liquidação / Recebimento de Cliente (${payload.reference || 'Recibo'})`,
      debitAccount: isCash ? '43.1' : '45.1',
      debitAccountName: isCash ? 'Caixa Geral' : 'Bancos / Depósitos',
      creditAccount: '21.1',
      creditAccountName: 'Clientes Conta Corrente',
      amount,
      currency: 'Kz',
    });
  }

  private handlePurchaseAccounting(purchase: any): void {
    const total = purchase.totalAmount || 0;
    const date = purchase.date || new Date().toISOString().split('T')[0];
    const isCredit = purchase.paymentTerms?.toLowerCase().includes('dias') || purchase.paymentMethod === 'CREDIT';

    this.entries.unshift({
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      docId: purchase.id,
      docNumber: purchase.docNumber,
      date,
      description: `Compra de Mercadorias ao Fornecedor ${purchase.supplierName || ''}`,
      debitAccount: '32.1',
      debitAccountName: 'Existências / Inventário',
      creditAccount: isCredit ? '22.1' : '43.1',
      creditAccountName: isCredit ? `Fornecedores c/c [${purchase.supplierName || 'Fornecedor'}]` : 'Caixa Geral',
      amount: total,
      currency: 'Kz',
    });
  }

  public recordEntry(entry: AccountingEntry): void {
    this.entries.unshift(entry);
  }
}
