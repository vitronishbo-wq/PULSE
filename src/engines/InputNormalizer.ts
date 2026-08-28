import {
  RawInputEvent,
  NormalizedCommand,
  InputSourceType,
  DeviceInputCategory,
  InputContextField,
  UniversalIntentType,
  Product,
} from '../types/pulse';

type NormalizedListener = (cmd: NormalizedCommand) => void;
type RawInputListener = (raw: RawInputEvent) => void;

export class InputNormalizer {
  private static instance: InputNormalizer;
  private normalizedListeners: Set<NormalizedListener> = new Set();
  private rawListeners: Set<RawInputListener> = new Set();
  private inputHistory: NormalizedCommand[] = [];
  private lastKeypressTime = 0;
  private barcodeBuffer = '';
  private barcodeTimer: any = null;

  private constructor() {
    this.detectDeviceCategory();
  }

  public static getInstance(): InputNormalizer {
    if (!InputNormalizer.instance) {
      InputNormalizer.instance = new InputNormalizer();
    }
    return InputNormalizer.instance;
  }

  /**
   * Identifies current environment device category
   */
  public detectDeviceCategory(): DeviceInputCategory {
    if (typeof window === 'undefined') return 'DESKTROP';
    const width = window.innerWidth;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (width < 640 && hasTouch) return 'MOBILE';
    if (width < 1024 && hasTouch) return 'TABLET';
    if (hasTouch && width >= 1024) return 'LAPTOP';
    return 'DESKTROP';
  }

  /**
   * Core Universal Pipeline Entry Point:
   * QUALQUER INPUT -> INPUT NORMALIZER -> COMMAND PARSER -> INTENT -> VALIDATION -> COMMAND -> CORE
   */
  public ingestRawInput(
    rawPayload: string,
    sourceType: InputSourceType,
    contextField: InputContextField = 'GENERIC',
    meta?: RawInputEvent['meta']
  ): NormalizedCommand {
    const deviceCategory = this.detectDeviceCategory();
    const rawEvent: RawInputEvent = {
      id: `raw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceType,
      deviceCategory,
      rawPayload,
      contextField,
      meta,
      timestamp: new Date().toISOString(),
    };

    // Notify raw listeners
    this.rawListeners.forEach((l) => l(rawEvent));

    // Stage 1: Normalize text / symbols / codes
    const normalizedText = this.cleanAndNormalize(rawPayload);

    // Stage 2: Command Parser & Intent Classification
    const { intent, targetEntity, parameters, confidence } = this.parseIntent(
      normalizedText,
      sourceType,
      contextField,
      rawPayload
    );

    // Stage 3: Validation
    const validation = this.validateCommand(intent, parameters, normalizedText);

    // Stage 4: Create Normalized Command
    const normalizedCommand: NormalizedCommand = {
      id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceType,
      deviceCategory,
      rawInput: rawPayload,
      normalizedText,
      intent,
      targetEntity,
      parameters,
      validation,
      confidence,
      timestamp: new Date().toISOString(),
    };

    // Store in history buffer (max 50)
    this.inputHistory.unshift(normalizedCommand);
    if (this.inputHistory.length > 50) this.inputHistory.pop();

    // Broadcast to listeners
    this.normalizedListeners.forEach((l) => l(normalizedCommand));

    return normalizedCommand;
  }

  /**
   * Stage 1: Normalizer - sanitizes symbols (* # + - / = . , : ; @), removes noise
   */
  private cleanAndNormalize(input: string): string {
    if (!input) return '';
    let cleaned = input.trim();

    // Normalizing Portuguese voice filler phrases
    cleaned = cleaned
      .replace(/^(por favor\s+|pf\s+|quero\s+|gostaria de\s+|faz\s+|fazer\s+)/i, '')
      .replace(/\s+/g, ' ');

    return cleaned;
  }

  /**
   * Stage 2: Command Parser & Intent Extractor
   */
  private parseIntent(
    text: string,
    sourceType: InputSourceType,
    contextField: InputContextField,
    rawText: string
  ): {
    intent: UniversalIntentType;
    targetEntity?: string;
    parameters: Record<string, any>;
    confidence: number;
  } {
    const lower = text.toLowerCase();

    // 1. Secret Platform Control invocation code
    if (rawText.trim() === '*#7668#' || text.includes('*#7668#') || lower === 'admin' || lower === 'platform') {
      return {
        intent: 'INVOKE_PLATFORM_CONTROL',
        parameters: { code: '*#7668#' },
        confidence: 1.0,
      };
    }

    // 2. Barcode scanner direct input
    if (sourceType === 'BARCODE_SCANNER' || (/^\d{8,14}$/.test(text) && contextField !== 'QUANTITY' && contextField !== 'AMOUNT')) {
      return {
        intent: 'LOOKUP_PRODUCT_BARCODE',
        targetEntity: text,
        parameters: { barcode: text },
        confidence: 0.99,
      };
    }

    // 3. Global Shortcuts
    if (text === '/' || lower === 'k' || lower === 'ctrl+k' || lower === 'cmd+k') {
      return {
        intent: 'OPEN_COMMAND_CENTER',
        parameters: {},
        confidence: 1.0,
      };
    }

    if (lower === 'f1' || lower === 'ajuda' || lower === 'help') {
      return {
        intent: 'OPEN_HELP',
        parameters: {},
        confidence: 1.0,
      };
    }

    if (lower === 'ctrl+s' || lower === 'guardar' || lower === 'salvar') {
      return {
        intent: 'SAVE_RECORD',
        parameters: {},
        confidence: 0.95,
      };
    }

    if (lower === 'ctrl+p' || lower === 'imprimir' || lower === 'print') {
      return {
        intent: 'PRINT_DOCUMENT',
        parameters: {},
        confidence: 0.95,
      };
    }

    if (lower === 'escape' || lower === 'esc' || lower === 'cancelar') {
      return {
        intent: 'CLOSE_MODAL',
        parameters: {},
        confidence: 1.0,
      };
    }

    if (lower === 'enter' || lower === 'confirmar' || lower === 'ok') {
      return {
        intent: 'CONFIRM_ACTION',
        parameters: {},
        confidence: 1.0,
      };
    }

    // 4. Navigation Intents
    if (lower.startsWith('/pos') || lower === 'pos' || lower === 'terminal' || lower === 'caixa') {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'POS', parameters: { tab: 'POS' }, confidence: 0.98 };
    }
    if (lower.startsWith('/kds') || lower.startsWith('/mesas') || lower.includes('cozinha') || lower.includes('mesas')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'KDS_TABLES', parameters: { tab: 'KDS_TABLES' }, confidence: 0.98 };
    }
    if (lower.startsWith('/lotes') || lower.startsWith('/validade') || lower.includes('farmacia') || lower.includes('medicamento')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'BATCHES', parameters: { tab: 'BATCHES' }, confidence: 0.98 };
    }
    if (lower.startsWith('/docs') || lower.startsWith('/facturas') || lower.includes('documentos') || lower.includes('faturas')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'DOCS', parameters: { tab: 'DOCS' }, confidence: 0.98 };
    }
    if (lower.startsWith('/stock') || lower.startsWith('/artigos') || lower.includes('armazem') || lower.includes('estoque')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'STOCK', parameters: { tab: 'STOCK' }, confidence: 0.98 };
    }
    if (lower.startsWith('/tesouraria') || lower.startsWith('/caixa') || lower.includes('banco') || lower.includes('diario')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'TREASURY', parameters: { tab: 'TREASURY' }, confidence: 0.98 };
    }
    if (lower.startsWith('/rh') || lower.startsWith('/salarios') || lower.includes('equipa') || lower.includes('funcionarios')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'HR', parameters: { tab: 'HR' }, confidence: 0.98 };
    }
    if (lower.startsWith('/fiscal') || lower.startsWith('/saft') || lower.includes('agt') || lower.includes('impostos')) {
      return { intent: 'NAVIGATE_VIEW', targetEntity: 'FISCAL', parameters: { tab: 'FISCAL' }, confidence: 0.98 };
    }

    // 5. Operational Quick Intents (F2-F6)
    if (lower === 'f2' || lower.startsWith('venda') || lower.startsWith('facturar') || lower.startsWith('faturar') || lower.startsWith('vender')) {
      return { intent: 'CREATE_SALE', parameters: { text }, confidence: 0.92 };
    }
    if (lower === 'f3' || lower.startsWith('compra') || lower.startsWith('comprar') || lower.startsWith('entrada')) {
      return { intent: 'CREATE_PURCHASE', parameters: { text }, confidence: 0.92 };
    }
    if (lower === 'f4' || lower.startsWith('recibo') || lower.startsWith('cobrar') || lower.startsWith('liquidar')) {
      return { intent: 'CREATE_RECEIPT', parameters: { text }, confidence: 0.92 };
    }
    if (lower === 'f5' || lower.startsWith('pagar') || lower.startsWith('pagamento') || lower.startsWith('despesa')) {
      return { intent: 'CREATE_PAYMENT', parameters: { text }, confidence: 0.92 };
    }
    if (lower === 'f6' || lower.startsWith('cotacao') || lower.startsWith('cotação') || lower.startsWith('proforma')) {
      return { intent: 'CREATE_QUOTATION', parameters: { text }, confidence: 0.92 };
    }

    // 6. Direct Context Numeric Inputs
    if (contextField === 'QUANTITY' && !isNaN(Number(text.replace(',', '.')))) {
      return {
        intent: 'QUANTITY_DIRECT_INPUT',
        parameters: { qty: Number(text.replace(',', '.')) },
        confidence: 1.0,
      };
    }

    if (contextField === 'AMOUNT' && !isNaN(Number(text.replace(',', '.')))) {
      return {
        intent: 'AMOUNT_DIRECT_INPUT',
        parameters: { amount: Number(text.replace(',', '.')) },
        confidence: 1.0,
      };
    }

    // 7. Natural Language AI fallback
    return {
      intent: 'EXECUTE_NATURAL_AI',
      parameters: { prompt: text },
      confidence: 0.85,
    };
  }

  /**
   * Stage 3: Validation
   */
  private validateCommand(
    intent: UniversalIntentType,
    parameters: Record<string, any>,
    normalizedText: string
  ): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (intent === 'QUANTITY_DIRECT_INPUT' && parameters.qty <= 0) {
      errors.push('Quantidade deve ser estritamente superior a zero.');
    }
    if (intent === 'AMOUNT_DIRECT_INPUT' && parameters.amount < 0) {
      errors.push('Montante monetário não pode ser negativo.');
    }
    if (intent === 'LOOKUP_PRODUCT_BARCODE' && (!parameters.barcode || parameters.barcode.length < 3)) {
      errors.push('Código de barras inválido ou demasiado curto.');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * High-speed hardware barcode scanner listener
   */
  public handleHardwareScannerKeypress(char: string): void {
    const now = Date.now();
    const interval = now - this.lastKeypressTime;
    this.lastKeypressTime = now;

    if (interval > 80) {
      // Manual slow typing: reset buffer
      this.barcodeBuffer = char;
    } else {
      // Rapid sequential keys (< 80ms) characteristic of hardware scanners
      this.barcodeBuffer += char;
    }

    clearTimeout(this.barcodeTimer);
    this.barcodeTimer = setTimeout(() => {
      if (this.barcodeBuffer.length >= 6) {
        this.ingestRawInput(this.barcodeBuffer, 'BARCODE_SCANNER', 'SEARCH', {
          barcodeLength: this.barcodeBuffer.length,
          confidence: 0.99,
        });
        this.barcodeBuffer = '';
      }
    }, 120);
  }

  /**
   * Subscription APIs
   */
  public onCommand(listener: NormalizedListener): () => void {
    this.normalizedListeners.add(listener);
    return () => this.normalizedListeners.delete(listener);
  }

  public onRawInput(listener: RawInputListener): () => void {
    this.rawListeners.add(listener);
    return () => this.rawListeners.delete(listener);
  }

  public getHistory(): NormalizedCommand[] {
    return [...this.inputHistory];
  }
}
