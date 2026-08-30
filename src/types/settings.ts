import { FiscalCountry, ReceiptFormat, UserRole } from './pulse';

export interface ExtendedUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  pin: string;
  status: 'ACTIVE' | 'INACTIVE';
  phone?: string;
  avatar?: string;
  allowedTerminals: string[]; // ['*'] for all or array of terminal IDs
  permissions: {
    canGiveDiscount: boolean;
    maxDiscountPercent: number;
    canCancelLines: boolean;
    canCancelDocuments: boolean;
    canOpenDrawerManual: boolean;
    canViewReports: boolean;
    canChangePrices: boolean;
    canManageStockPurchases: boolean;
    canReprintDocuments: boolean;
    canManageUsers: boolean;
  };
  createdAt: string;
  lastLogin?: string;
}

export interface POSTerminalDevice {
  id: string;
  name: string;
  code: string;
  location: string;
  ipAddress: string;
  macAddress: string;
  status: 'ONLINE' | 'OFFLINE';
  assignedPrinter: string;
  hasCashDrawer: boolean;
  scannerType: string;
  lastPing: string;
}

export interface PaymentMethodConfigItem {
  id: string;
  type: 'CASH' | 'TPA_CARD' | 'BANK_TRANSFER' | 'MULTICAIXA_EXPRESS' | 'VOUCHER' | 'CUSTOMER_CREDIT';
  name: string;
  enabled: boolean;
  allowChange: boolean;
  requiresReference: boolean;
  requiresReceiptProof?: boolean;
  feePercent: number;
  accounts?: string[];
  openDrawer?: boolean;
}

export interface OperationalPreferencesData {
  currency: string;
  currencySymbol: string;
  decimalPlaces: number;
  decimalSeparator?: string;
  thousandsSeparator?: string;
  roundingMethod: 'NONE' | 'HALF_UP' | 'NEAREST_5' | 'NEAREST_10' | 'CEIL' | 'FLOOR';
  language: 'pt-AO' | 'pt-PT' | 'en-US';
  timezone: string;
  dateFormat: string;
  timeFormat: '24H' | '12H';
  salesMode: 'RESTAURANT_BAR' | 'RETAIL_SUPERMARKET' | 'SERVICES_APPOINTMENTS';
  allowNegativeStock: boolean;
  warnLowStock: boolean;
  blockExpiredSales: boolean;
  requireShiftOpeningFloat: boolean;
  blindShiftClosing: boolean;
  autoLockScreenMinutes: number;
  posBehavior: {
    autoFocusBarcode: boolean;
    playScannerBeep: boolean;
    confirmLineRemoval: boolean;
    enableQuickCashButtons: boolean;
    showStockBadgesInGrid: boolean;
    autoCloseCashDrawerReminder: boolean;
    directSaleWithoutCustomer: boolean;
  };
}

export interface PrinterConfigData {
  primaryFormat: ReceiptFormat;
  connectionType: 'ESC_POS_USB' | 'NETWORK_TCP' | 'BLUETOOTH' | 'SYSTEM_DRIVER';
  ipAddress: string;
  port: number;
  autoCut: boolean;
  printDensity: 'NORMAL' | 'HIGH' | 'LOW';
  autoPrintOnSale: boolean;
  autoPrintShiftClose: boolean;
  printTableConference: boolean;
  showQrCode: boolean;
  showAgtHash: boolean;
  showBankIbans: boolean;
  showOperatorName: boolean;
  customHeaderNote: string;
  customFooterNote: string;
  terminalPrinters: {
    terminalId: string;
    terminalName: string;
    counterPrinter: string;
    kitchenPrinter?: string;
    barPrinter?: string;
    officeA4Printer?: string;
  }[];
}
