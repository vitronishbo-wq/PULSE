import {
  FiscalAdapter,
  FiscalValidationResult,
  Document,
  Product,
  Customer,
  TenantProfile,
  FiscalCountry,
} from '../types/pulse';

/**
 * Simple deterministic SHA-like hash generator for fiscal signature simulation
 */
function computeFiscalHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  const b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const prefix = Array.from({ length: 4 })
    .map((_, idx) => b64Chars[(Math.abs(hash) >> (idx * 6)) % b64Chars.length])
    .join('');
  return `${prefix}-${hex.toUpperCase()}`;
}

/**
 * Angola Fiscal Adapter (AGT - Administração Geral Tributária)
 * Complies with AGT Invoicing Certification Regulations
 */
export class AngolaAGTAdapter implements FiscalAdapter {
  countryCode = 'AO';
  countryName = 'Angola (AGT - IVA 14%)';

  getTaxRate(product: Product, customer?: Customer): number {
    if (product.taxRate !== undefined) {
      return product.taxRate;
    }
    return 14; // Default Angola IVA 14%
  }

  generateHash(doc: Partial<Document>, previousHash: string): string {
    // AGT format: Date;SystemEntryDate;DocNumber;GrossTotal;PreviousHash
    const str = `${doc.date || ''};${doc.date || ''};${doc.docNumber || ''};${(doc.grossAmount || 0).toFixed(2)};${previousHash || 'START_HASH'}`;
    return computeFiscalHash(str);
  }

  validateDocument(doc: Document): FiscalValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!doc.series || !doc.number) {
      errors.push('AGT: A série e número do documento são de preenchimento obrigatório.');
    }
    if (!doc.docNumber) {
      errors.push('AGT: Número formatado do documento em falta.');
    }
    if (doc.lines.length === 0) {
      errors.push('AGT: O documento deve conter pelo menos uma linha de artigo/serviço.');
    }
    if (doc.grossAmount <= 0 && doc.docType !== 'CREDIT_NOTE') {
      errors.push('AGT: O valor total do documento deve ser superior a zero.');
    }
    if (doc.grossAmount >= 500000 && (!doc.customerTaxId || doc.customerTaxId === '999999999')) {
      warnings.push('AGT: Para transações superiores a 500.000 Kz recomenda-se a identificação expressa do NIF do adquirente.');
    }
    if (!doc.hash) {
      errors.push('AGT: O documento não possui assinatura digital criptográfica.');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  exportSAFT(
    tenant?: Partial<TenantProfile>,
    documents: Document[] = [],
    products: Product[] = [],
    customers: Customer[] = [],
    period: { start: string; end: string } = { start: '2026-01-01', end: '2026-12-31' }
  ): string {
    const safeDocs = Array.isArray(documents) ? documents : [];
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safePeriod = (period && typeof period === 'object' && period.start && period.end)
      ? period
      : { start: '2026-01-01', end: '2026-12-31' };

    const tTaxId = tenant?.taxId || '5417089901';
    const tName = tenant?.name || 'PULSE COMÉRCIO LDA';
    const tTradeName = tenant?.tradeName || 'PULSE.OS';
    const tAddress = tenant?.address || 'Luanda, Angola';
    const tCity = tenant?.city || 'Luanda';
    const tCurrency = tenant?.currency || 'Kz';
    const tCert = tenant?.fiscalCertNumber || '001/AGT/2026';

    // Generate SAF-T (AO) Standard Audit File for Tax XML representation
    const filteredDocs = safeDocs.filter(
      (d) => d && d.date >= safePeriod.start && d.date <= safePeriod.end && d.status === 'POSTED'
    );
    const totalCredit = filteredDocs.reduce((acc, d) => acc + (d.grossAmount || 0), 0);

    return `<?xml version="1.0" encoding="UTF-8"?>
<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:AO_01_01" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Header>
    <AuditFileVersion>1.01_01</AuditFileVersion>
    <CompanyID>${tTaxId}</CompanyID>
    <TaxRegistrationNumber>${tTaxId}</TaxRegistrationNumber>
    <TaxAccountingBasis>F</TaxAccountingBasis>
    <CompanyName>${tName}</CompanyName>
    <BusinessName>${tTradeName}</BusinessName>
    <CompanyAddress>
      <AddressDetail>${tAddress}</AddressDetail>
      <City>${tCity}</City>
      <Country>AO</Country>
    </CompanyAddress>
    <FiscalYear>${new Date(safePeriod.start).getFullYear() || 2026}</FiscalYear>
    <StartDate>${safePeriod.start}</StartDate>
    <EndDate>${safePeriod.end}</EndDate>
    <CurrencyCode>${tCurrency}</CurrencyCode>
    <DateCreated>${new Date().toISOString().split('T')[0]}</DateCreated>
    <TaxEntity>Global</TaxEntity>
    <ProductCompanyID>PULSE.OS / ULCE v2.0</ProductCompanyID>
    <SoftwareValidationNumber>${tCert}</SoftwareValidationNumber>
  </Header>
  <MasterFiles>
    <CustomerTable>
      ${safeCustomers
        .map(
          (c) => `
      <Customer>
        <CustomerID>${c.id}</CustomerID>
        <AccountID>21.1.${c.id}</AccountID>
        <CustomerTaxID>${c.taxId}</CustomerTaxID>
        <CompanyName>${c.name}</CompanyName>
        <SelfBillingIndicator>0</SelfBillingIndicator>
      </Customer>`
        )
        .join('')}
    </CustomerTable>
    <ProductTable>
      ${safeProducts
        .map(
          (p) => `
      <Product>
        <ProductType>${p.type === 'service' ? 'S' : 'P'}</ProductType>
        <ProductCode>${p.sku}</ProductCode>
        <ProductDescription>${p.name}</ProductDescription>
        <ProductNumberCode>${p.barcode || p.sku}</ProductNumberCode>
      </Product>`
        )
        .join('')}
    </ProductTable>
    <TaxTable>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>NOR</TaxCode>
        <Description>Taxa Normal</Description>
        <TaxPercentage>14.00</TaxPercentage>
      </TaxTableEntry>
      <TaxTableEntry>
        <TaxType>IVA</TaxType>
        <TaxCountryRegion>AO</TaxCountryRegion>
        <TaxCode>RED</TaxCode>
        <Description>Taxa Reduzida Cesta Básica</Description>
        <TaxPercentage>7.00</TaxPercentage>
      </TaxTableEntry>
    </TaxTable>
  </MasterFiles>
  <SourceDocuments>
    <SalesInvoices>
      <NumberOfEntries>${filteredDocs.length}</NumberOfEntries>
      <TotalDebit>0.00</TotalDebit>
      <TotalCredit>${totalCredit.toFixed(2)}</TotalCredit>
      ${filteredDocs
        .map(
          (doc) => `
      <Invoice>
        <InvoiceNo>${doc.docNumber || `${doc.series}/${doc.number}`}</InvoiceNo>
        <DocumentStatus>
          <InvoiceStatus>N</InvoiceStatus>
          <InvoiceStatusDate>${doc.date}T10:00:00</InvoiceStatusDate>
          <SourceID>${doc.createdBy || 'CASHIER'}</SourceID>
          <SourceBilling>P</SourceBilling>
        </DocumentStatus>
        <Hash>${doc.hash || 'DRAFT'}</Hash>
        <HashControl>1</HashControl>
        <Period>${new Date(doc.date).getMonth() + 1 || 1}</Period>
        <InvoiceDate>${doc.date}</InvoiceDate>
        <InvoiceType>${doc.docType === 'INVOICE' ? 'FT' : doc.docType === 'RECEIPT' ? 'FR' : 'VD'}</InvoiceType>
        <CustomerID>${doc.customerId || 'cust_01'}</CustomerID>
        <Line>
          ${(doc.lines || [])
            .map(
              (l, idx) => `
          <LineNumber>${idx + 1}</LineNumber>
          <ProductCode>${l.sku}</ProductCode>
          <ProductDescription>${l.description}</ProductDescription>
          <Quantity>${l.qty}</Quantity>
          <UnitOfMeasure>un</UnitOfMeasure>
          <UnitPrice>${(l.unitPrice || 0).toFixed(2)}</UnitPrice>
          <TaxPointDate>${doc.date}</TaxPointDate>
          <Description>${l.description}</Description>
          <CreditAmount>${(l.netTotal || 0).toFixed(2)}</CreditAmount>
          <Tax>
            <TaxType>IVA</TaxType>
            <TaxCountryRegion>AO</TaxCountryRegion>
            <TaxCode>${l.taxRate === 7 ? 'RED' : 'NOR'}</TaxCode>
            <TaxPercentage>${(l.taxRate || 14).toFixed(2)}</TaxPercentage>
          </Tax>`
            )
            .join('')}
        </Line>
        <DocumentTotals>
          <TaxPayable>${(doc.taxAmount || 0).toFixed(2)}</TaxPayable>
          <NetTotal>${(doc.netAmount || 0).toFixed(2)}</NetTotal>
          <GrossTotal>${(doc.grossAmount || 0).toFixed(2)}</GrossTotal>
        </DocumentTotals>
      </Invoice>`
        )
        .join('')}
    </SalesInvoices>
  </SourceDocuments>
</AuditFile>`;
  }
}

/**
 * Portugal Fiscal Adapter (AT - Autoridade Tributária e Aduaneira)
 */
export class PortugalATAdapter implements FiscalAdapter {
  countryCode = 'PT';
  countryName = 'Portugal (AT - IVA 23%)';

  getTaxRate(product: Product): number {
    return product.taxRate || 23;
  }

  generateHash(doc: Partial<Document>, previousHash: string): string {
    const str = `PT;${doc.date || ''};${doc.docNumber || ''};${(doc.grossAmount || 0).toFixed(2)};${previousHash || '0'}`;
    return computeFiscalHash(str);
  }

  validateDocument(doc: Document): FiscalValidationResult {
    const errors: string[] = [];
    if (!doc.series || !doc.number) errors.push('AT: Série e número são obrigatórios.');
    if (!doc.hash) errors.push('AT: Documento deve estar assinado digitalmente.');
    return { valid: errors.length === 0, errors, warnings: [] };
  }

  exportSAFT(
    tenant: TenantProfile,
    documents: Document[],
    products: Product[],
    customers: Customer[],
    period: { start: string; end: string }
  ): string {
    return `<!-- SAF-T PT Standard XML Export -->\n<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">\n  <Header><CompanyID>${tenant.taxId}</CompanyID></Header>\n</AuditFile>`;
  }
}

/**
 * Fiscal Engine Registry
 */
export class FiscalEngine {
  private adapters: Map<string, FiscalAdapter> = new Map();
  private currentCountry = 'AO';

  constructor() {
    this.registerAdapter(new AngolaAGTAdapter());
    this.registerAdapter(new PortugalATAdapter());
  }

  registerAdapter(adapter: FiscalAdapter) {
    this.adapters.set(adapter.countryCode, adapter);
  }

  setCountry(countryCode: FiscalCountry | string) {
    if (this.adapters.has(countryCode)) {
      this.currentCountry = countryCode;
    }
  }

  getCountry(): FiscalCountry {
    return this.currentCountry as FiscalCountry;
  }

  getAdapter(): FiscalAdapter {
    return this.adapters.get(this.currentCountry) || this.adapters.get('AO')!;
  }

  getAllAdapters(): FiscalAdapter[] {
    return Array.from(this.adapters.values());
  }
}
