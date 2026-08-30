export type ReportMainCategory =
  | 'SALES'
  | 'FINANCIAL'
  | 'STOCK'
  | 'FISCAL'
  | 'AUDIT';

export type ReportSalesSubCategory =
  | 'SALES_PERIOD'
  | 'SALES_PRODUCT'
  | 'SALES_OPERATOR'
  | 'SALES_TERMINAL'
  | 'SALES_CUSTOMER'
  | 'SALES_DOCS'
  | 'SALES_RETURNS'
  | 'SALES_PAYMENTS';

export type ReportFinancialSubCategory =
  | 'FINANCIAL_RECEIPTS'
  | 'FINANCIAL_PAYMENTS'
  | 'FINANCIAL_CASHFLOW'
  | 'FINANCIAL_BALANCES'
  | 'FINANCIAL_RECEIVABLES'
  | 'FINANCIAL_PAYABLES'
  | 'FINANCIAL_MARGINS'
  | 'FINANCIAL_MOVEMENTS'
  | 'FINANCIAL_EXPORT';

export type ReportStockSubCategory =
  | 'STOCK_CURRENT'
  | 'STOCK_IN_OUT'
  | 'STOCK_INVENTORY'
  | 'STOCK_LOW'
  | 'STOCK_ADJUSTMENTS'
  | 'STOCK_VALUATION';

export type ReportFiscalSubCategory =
  | 'FISCAL_DOC_TYPES'
  | 'FISCAL_VAT'
  | 'FISCAL_RETENTIONS'
  | 'FISCAL_SERIES'
  | 'FISCAL_CANCELLATIONS'
  | 'FISCAL_SAFT';

export type ReportAuditSubCategory =
  | 'AUDIT_USER_OPS'
  | 'AUDIT_CHANGES_CANCELS'
  | 'AUDIT_SYSTEM_EVENTS'
  | 'AUDIT_OPERATOR_LOGS'
  | 'AUDIT_HISTORY';

export type ReportSubCategory =
  | ReportSalesSubCategory
  | ReportFinancialSubCategory
  | ReportStockSubCategory
  | ReportFiscalSubCategory
  | ReportAuditSubCategory;

export type DateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'LAST_7_DAYS'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface ReportFilterState {
  mainCategory: ReportMainCategory;
  subCategory: ReportSubCategory;
  datePreset: DateRangePreset;
  startDate: string;
  endDate: string;
  operatorId: string; // 'ALL' or specific user ID
  terminalId: string; // 'ALL' or specific terminal
  customerId: string; // 'ALL' or customer ID
  supplierId: string; // 'ALL' or supplier ID
  productCategory: string; // 'ALL' or category
  documentType: string; // 'ALL' or 'FT' | 'FR' | 'NC' | 'VD' | 'PP'
  paymentMethod: string; // 'ALL' or method
  searchQuery: string;
}
