import {
  Document,
  TenantProfile,
  ReceiptFormat,
  FormattedReceiptPayload,
  FormattedReceiptTaxLine,
  User,
} from '../types/pulse';

export class OutputEngine {
  private static instance: OutputEngine;

  private constructor() {}

  public static getInstance(): OutputEngine {
    if (!OutputEngine.instance) {
      OutputEngine.instance = new OutputEngine();
    }
    return OutputEngine.instance;
  }

  /**
   * Transforms an official immutable POSTED Document and Tenant Profile
   * into a standardized receipt payload ready for rendering across any format (58mm, 80mm, A4, Digital).
   */
  public prepareReceiptPayload(
    document: Document,
    tenant: TenantProfile,
    operator?: string
  ): FormattedReceiptPayload {
    const lines = document.lines || [];

    // Tax aggregation by tax rate
    const taxMap = new Map<number, { base: number; tax: number; exemption?: string }>();

    const formattedLines = lines.map((l, idx) => {
      const unitPrice = l.unitPrice || 0;
      const qty = l.qty || 1;
      const discount = l.discount || 0;
      const lineGross = unitPrice * qty * (1 - discount / 100);
      const taxRate = l.taxRate ?? 14;
      const lineNet = l.netTotal ?? (taxRate > 0 ? lineGross / (1 + taxRate / 100) : lineGross);
      const lineTax = l.taxTotal ?? (lineGross - lineNet);

      if (!taxMap.has(taxRate)) {
        taxMap.set(taxRate, {
          base: 0,
          tax: 0,
          exemption: l.taxExemptionReason,
        });
      }
      const entry = taxMap.get(taxRate)!;
      entry.base += lineNet;
      entry.tax += lineTax;

      return {
        idx: idx + 1,
        description: l.description || 'Artigo sem descrição',
        qty,
        unitPrice,
        discountPercent: discount,
        taxRate,
        netTotal: lineNet,
        grossTotal: lineGross,
      };
    });

    const taxes: FormattedReceiptTaxLine[] = Array.from(taxMap.entries()).map(
      ([rate, val]) => ({
        taxRate: rate,
        baseAmount: val.base,
        taxAmount: val.tax,
        exemptionReason: val.exemption,
      })
    );

    // Withholding tax calculation for services
    const withholdingTax = lines.reduce(
      (acc, l) => acc + (l.withholdingTaxAmount || 0),
      0
    );

    const grossTotal = document.grossAmount || 0;
    const finalPayable = grossTotal - withholdingTax;
    const paidAmount = document.paidAmount || (document.paymentMethod === 'CREDIT' ? 0 : finalPayable);
    const changeAmount = Math.max(0, paidAmount - finalPayable);

    // Extract first 4 chars of fiscal hash
    const hash = document.hash || 'TEST-9999';
    const hash4 = hash.length >= 4 ? hash.substring(0, 4) : hash;

    const certNumber = tenant.fiscalCertNumber || '001/AGT/2026';
    const legalNotice = `${hash4} - Processado por programa validado nº ${certNumber}/AGT`;

    // QR Code content representation for AGT standard
    const qrCodeContent = `NIF:${tenant.taxId}|DOC:${document.docNumber}|DT:${document.date}|TOTAL:${grossTotal.toFixed(2)}|HASH:${hash4}`;

    return {
      documentId: document.id,
      docNumber: document.docNumber || `${document.series}/${document.number}`,
      docType: document.docType,
      date: document.date,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      tenant: {
        name: tenant.name || 'PULSE COMÉRCIO LDA',
        tradeName: tenant.tradeName || 'PULSE STORE',
        taxId: tenant.taxId || '999999999',
        address: tenant.address || 'Luanda, Angola',
        city: tenant.city || 'Luanda',
        phone: tenant.phone,
        email: tenant.email,
        fiscalCertNumber: certNumber,
        currency: tenant.currency || 'Kz',
      },
      customer: {
        name: document.customerName || 'Consumidor Final',
        taxId: document.customerTaxId || '999999999',
        address: 'Angola',
      },
      lines: formattedLines,
      totals: {
        subtotalNet: document.netAmount || (grossTotal - (document.taxAmount || 0)),
        totalTax: document.taxAmount || 0,
        grossTotal,
        withholdingTax,
        finalPayable,
        paymentMethod: document.paymentMethod,
        paidAmount,
        changeAmount,
      },
      taxes,
      fiscal: {
        hash4,
        fullHash: hash,
        previousHash: document.previousDocHash || '0',
        legalNotice,
        qrCodeContent,
      },
      operator: operator || document.createdBy || 'CASHIER',
      terminal: 'POS-01',
    };
  }

  /**
   * Generates a clean text string for digital sharing via WhatsApp, SMS, or Clipboard.
   */
  public generateDigitalShareText(payload: FormattedReceiptPayload): string {
    const divider = '--------------------------------';
    const linesText = payload.lines
      .map(
        (l) =>
          `${l.qty}x ${l.description}\n   ${l.grossTotal.toLocaleString()} ${payload.tenant.currency}`
      )
      .join('\n');

    return `*${payload.tenant.tradeName}*\n` +
      `NIF: ${payload.tenant.taxId}\n` +
      `${payload.docNumber} • ${payload.date} ${payload.time}\n` +
      `Cliente: ${payload.customer.name} (${payload.customer.taxId})\n` +
      `${divider}\n` +
      `${linesText}\n` +
      `${divider}\n` +
      `*TOTAL: ${payload.totals.finalPayable.toLocaleString()} ${payload.tenant.currency}*\n` +
      `Pagamento: ${payload.totals.paymentMethod} (${payload.totals.paidAmount.toLocaleString()} ${payload.tenant.currency})\n` +
      (payload.totals.changeAmount > 0 ? `Troco: ${payload.totals.changeAmount.toLocaleString()} ${payload.tenant.currency}\n` : '') +
      `${divider}\n` +
      `${payload.fiscal.legalNotice}\n` +
      `Obrigado pela preferência!`;
  }
}
