import { Document, TenantProfile, ReceiptFormat, FormattedReceiptPayload } from '../types/pulse';
import { OutputEngine } from './OutputEngine';

export interface PrintTaskOptions {
  format?: ReceiptFormat;
  operator?: string;
  autoPrint?: boolean;
  copies?: number;
}

export interface PrintResult {
  success: boolean;
  format: ReceiptFormat;
  method: 'BROWSER_PRINT' | 'NEW_WINDOW_PRINT' | 'DIGITAL_SHARE' | 'CLIPBOARD';
  message: string;
}

export class PrintService {
  private static instance: PrintService;
  private outputEngine: OutputEngine;

  private constructor() {
    this.outputEngine = OutputEngine.getInstance();
  }

  public static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  /**
   * Primary bridge to window.print() and print spoolers.
   * Handles device-specific print tasks (Thermal 58mm, Thermal 80mm, A4 PDF, Digital)
   * based on document requirements and target format.
   */
  public async print(
    document: Document,
    tenant: TenantProfile,
    options?: PrintTaskOptions | ReceiptFormat
  ): Promise<PrintResult> {
    const opts: PrintTaskOptions =
      typeof options === 'string'
        ? { format: options }
        : options || { format: 'THERMAL_80' };

    const format: ReceiptFormat = opts.format || 'THERMAL_80';
    const payload = this.outputEngine.prepareReceiptPayload(document, tenant, opts.operator);

    // If digital share was requested as format
    if (format === 'DIGITAL_SHARE') {
      const shareResult = await this.share(document, tenant, opts.operator);
      return {
        success: shareResult.success,
        format: 'DIGITAL_SHARE',
        method: shareResult.method === 'NATIVE_SHARE' ? 'DIGITAL_SHARE' : 'CLIPBOARD',
        message: shareResult.message,
      };
    }

    return new Promise((resolve) => {
      const portalId = 'pulse-print-portal';
      let portal = documentOriginal.getElementById(portalId) as HTMLDivElement | null;

      if (!portal) {
        portal = documentOriginal.createElement('div');
        portal.id = portalId;
        documentOriginal.body.appendChild(portal);
      }

      // Generate HTML payload specifically formatted for the chosen width (58mm, 80mm, A4)
      const htmlContent = this.generatePrintHtml(payload, format);
      portal.innerHTML = htmlContent;

      let resolved = false;
      const cleanup = () => {
        if (portal) {
          portal.innerHTML = '';
        }
        window.removeEventListener('afterprint', cleanup);
      };

      window.addEventListener('afterprint', cleanup);

      // Trigger browser print dialog with slight delay for layout rendering
      setTimeout(() => {
        try {
          window.print();
          if (!resolved) {
            resolved = true;
            setTimeout(cleanup, 1500);
            resolve({
              success: true,
              format,
              method: 'BROWSER_PRINT',
              message: `Documento ${payload.docNumber} enviado para impressão (${format}).`,
            });
          }
        } catch (e) {
          console.warn('Native window.print() failed, falling back to new window:', e);
          cleanup();
          this.openInNewTab(document, tenant, format, opts.operator);
          if (!resolved) {
            resolved = true;
            resolve({
              success: true,
              format,
              method: 'NEW_WINDOW_PRINT',
              message: `Documento aberto em nova janela para impressão.`,
            });
          }
        }
      }, 50);
    });
  }

  /**
   * Opens the formatted receipt in a dedicated new browser window for external print handling.
   */
  public openInNewTab(
    document: Document,
    tenant: TenantProfile,
    format: ReceiptFormat = 'THERMAL_80',
    operator?: string
  ): void {
    const payload = this.outputEngine.prepareReceiptPayload(document, tenant, operator);
    const htmlContent = this.generatePrintHtml(payload, format);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  }

  /**
   * Shares document summary digitally via Web Share API or Clipboard.
   */
  public async share(
    document: Document,
    tenant: TenantProfile,
    operator?: string
  ): Promise<{ success: boolean; method: 'NATIVE_SHARE' | 'CLIPBOARD' | 'ERROR'; message: string }> {
    const payload = this.outputEngine.prepareReceiptPayload(document, tenant, operator);
    const shareText = this.outputEngine.generateDigitalShareText(payload);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${payload.tenant.tradeName} - ${payload.docNumber}`,
          text: shareText,
        });
        return { success: true, method: 'NATIVE_SHARE', message: 'Partilhado com sucesso via Web Share!' };
      } catch (err) {
        // Fallback to clipboard if user dismissed or cancelled share dialog
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      return { success: true, method: 'CLIPBOARD', message: 'Resumo copiado para a área de transferência!' };
    } catch (err) {
      return { success: false, method: 'ERROR', message: 'Não foi possível partilhar ou copiar.' };
    }
  }

  /**
   * Generates standalone HTML document for print frame with precise CSS @page dimensions
   */
  public generatePrintHtml(payload: FormattedReceiptPayload, format: ReceiptFormat): string {
    const is58 = format === 'THERMAL_58';
    const isA4 = format === 'A4';
    const widthCss = is58 ? '58mm' : isA4 ? '210mm' : '80mm';

    const linesHtml = payload.lines
      .map(
        (l) => `
        <div style="margin-bottom: 3px;">
          <div style="font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.description}</div>
          <div style="display: flex; justify-content: space-between; font-size: ${is58 ? '8.5px' : '9.5px'}; color: #333;">
            <span>${l.qty} x ${l.unitPrice.toLocaleString()} ${payload.tenant.currency} ${l.discountPercent > 0 ? `(-${l.discountPercent}%)` : ''}</span>
            <span style="font-weight: bold; color: #000;">${l.grossTotal.toLocaleString()}</span>
          </div>
        </div>`
      )
      .join('');

    const taxesHtml = payload.taxes
      .map(
        (t) => `
        <div style="display: flex; justify-content: space-between; font-size: ${is58 ? '8px' : '9px'}; color: #333;">
          <span>IVA ${t.taxRate}%</span>
          <span>Inc: ${t.baseAmount.toLocaleString()}</span>
          <span style="font-weight: bold;">${t.taxAmount.toLocaleString()} ${payload.tenant.currency}</span>
        </div>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${payload.docNumber}</title>
  <style>
    @page {
      margin: 0;
      size: ${widthCss} auto;
    }
    body {
      margin: 0;
      padding: ${isA4 ? '20mm' : is58 ? '2mm' : '4mm'};
      font-family: 'Courier New', Courier, monospace;
      font-size: ${is58 ? '10px' : isA4 ? '12px' : '11px'};
      line-height: 1.2;
      color: #000;
      background: #fff;
      width: ${widthCss};
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .border-b { border-bottom: 1px dashed #000; }
    .border-t { border-top: 1px solid #000; }
    .flex-between { display: flex; justify-content: space-between; }
    .py-1 { padding-top: 3px; padding-bottom: 3px; }
    .mb-1 { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="text-center border-b py-1 mb-1">
    <div class="font-bold uppercase" style="font-size: ${is58 ? '11px' : '13px'};">${payload.tenant.tradeName}</div>
    <div style="font-size: 10px;">${payload.tenant.name}</div>
    <div style="font-weight: 600;">NIF: ${payload.tenant.taxId}</div>
    ${payload.tenant.address ? `<div style="font-size: 9px; color: #444;">${payload.tenant.address}</div>` : ''}
    ${payload.tenant.phone ? `<div style="font-size: 9px; color: #444;">Tel: ${payload.tenant.phone}</div>` : ''}
  </div>

  <div class="border-b py-1 mb-1" style="font-size: 10px;">
    <div class="font-bold text-center uppercase">${payload.docType === 'RECEIPT' ? 'FATURA-RECIBO' : payload.docType === 'INVOICE' ? 'FATURA' : 'VENDA A DINHEIRO'}</div>
    <div class="flex-between"><span class="font-bold">Nº Doc:</span> <span class="font-bold">${payload.docNumber}</span></div>
    <div class="flex-between"><span>Data:</span> <span>${payload.date} ${payload.time}</span></div>
    <div class="flex-between"><span>Cliente:</span> <span class="font-bold">${payload.customer.name}</span></div>
    <div class="flex-between"><span>NIF:</span> <span>${payload.customer.taxId}</span></div>
  </div>

  <div class="border-b py-1 mb-1">
    <div class="font-bold" style="font-size: 9px; border-bottom: 1px solid #ddd; padding-bottom: 2px; margin-bottom: 3px;">ARTIGOS / SERVIÇOS</div>
    ${linesHtml}
  </div>

  <div class="border-b py-1 mb-1" style="font-size: 10px;">
    <div class="flex-between"><span>Subtotal Líquido:</span> <span>${payload.totals.subtotalNet.toLocaleString()} ${payload.tenant.currency}</span></div>
    <div class="flex-between"><span>Total IVA:</span> <span>${payload.totals.totalTax.toLocaleString()} ${payload.tenant.currency}</span></div>
    ${payload.totals.withholdingTax > 0 ? `<div class="flex-between font-bold"><span>Retenção (-6.5%):</span> <span>-${payload.totals.withholdingTax.toLocaleString()} ${payload.tenant.currency}</span></div>` : ''}
    <div class="flex-between font-bold border-t py-1" style="font-size: ${is58 ? '12px' : '14px'}; margin-top: 3px;">
      <span>TOTAL A PAGAR:</span>
      <span>${payload.totals.finalPayable.toLocaleString()} ${payload.tenant.currency}</span>
    </div>
  </div>

  <div class="border-b py-1 mb-1" style="font-size: 10px;">
    <div class="flex-between"><span>Modo Pagamento:</span> <span class="font-bold">${payload.totals.paymentMethod}</span></div>
    <div class="flex-between"><span>Valor Entregue:</span> <span>${payload.totals.paidAmount.toLocaleString()} ${payload.tenant.currency}</span></div>
    ${payload.totals.changeAmount > 0 ? `<div class="flex-between font-bold"><span>Troco:</span> <span>${payload.totals.changeAmount.toLocaleString()} ${payload.tenant.currency}</span></div>` : ''}
  </div>

  ${payload.taxes.length > 0 ? `
  <div class="border-b py-1 mb-1">
    <div class="font-bold" style="font-size: 9px; margin-bottom: 2px;">Resumo de Impostos:</div>
    ${taxesHtml}
  </div>` : ''}

  <div class="text-center py-1" style="font-size: 8px; color: #333;">
    <div class="font-bold" style="font-size: 9px;">${payload.fiscal.legalNotice}</div>
    <div>Hash: ${payload.fiscal.hash4}</div>
    <div>Operador: ${payload.operator} • Terminal: ${payload.terminal}</div>
    <div style="margin-top: 4px; font-weight: bold;">OBRIGADO PELA PREFERÊNCIA</div>
  </div>
</body>
</html>`;
  }
}

// Global document alias for clean DOM handling
const documentOriginal = typeof document !== 'undefined' ? document : ({} as any);
