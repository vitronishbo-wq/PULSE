import { ParsedAICommand, PaymentMethod, Product } from '../types/pulse';

export class AIEngine {
  private static instance: AIEngine;

  private constructor() {}

  public static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  /**
   * Deterministic Natural Language Command Parser
   * Parses natural text input into structured command intents
   */
  public parseNaturalCommand(text: string, availableProducts: Product[]): ParsedAICommand | null {
    if (!text || text.trim().length === 0) return null;
    const lower = text.toLowerCase().trim();

    // 1. Detect Intent
    let intent: ParsedAICommand['intent'] = 'CREATE_SALE';
    if (lower.startsWith('compra') || lower.includes('comprar') || lower.includes('entrada de') || lower.includes('fornecedor')) {
      intent = 'CREATE_PURCHASE';
    } else if (lower.startsWith('cotacao') || lower.startsWith('cotação') || lower.includes('orçamento') || lower.includes('proforma')) {
      intent = 'CREATE_QUOTATION';
    } else if (lower.startsWith('recibo') || lower.includes('liquidar') || lower.includes('recebimento')) {
      intent = 'CREATE_RECEIPT';
    } else if (lower.startsWith('pagar') || lower.includes('despesa') || lower.includes('salario') || lower.includes('salário')) {
      intent = 'CREATE_PAYMENT';
    } else if (lower.startsWith('devolucao') || lower.startsWith('devolução') || lower.includes('nota de credito')) {
      intent = 'CREATE_RETURN';
    }

    // 2. Detect Payment Method
    let paymentMethod: PaymentMethod = 'CASH';
    if (lower.includes('tpa') || lower.includes('cartao') || lower.includes('cartão') || lower.includes('pos')) {
      paymentMethod = 'CARD';
    } else if (lower.includes('transf') || lower.includes('banco') || lower.includes('ibam') || lower.includes('iban')) {
      paymentMethod = 'BANK_TRANSFER';
    } else if (lower.includes('prazo') || lower.includes('credito') || lower.includes('crédito') || lower.includes('conta')) {
      paymentMethod = 'CREDIT';
    }

    // 3. Extract Customer / Target if specified
    let targetName: string | undefined = undefined;
    const paraMatch = text.match(/(?:para|ao cliente|cliente|fornecedor)\s+([A-Za-zÀ-ÿ0-9\s.]+?)(?:,|com|pagando|em|\.|$)/i);
    if (paraMatch && paraMatch[1]) {
      targetName = paraMatch[1].trim();
    }

    // 4. Extract Items & Quantities
    const items: ParsedAICommand['items'] = [];
    
    // Check against known product catalog
    for (const prod of availableProducts) {
      const prodNameLower = prod.name.toLowerCase();
      const skuLower = prod.sku.toLowerCase();

      // Check if product is mentioned in query
      if (lower.includes(prodNameLower) || lower.includes(skuLower)) {
        // Look for number preceding or following the product name
        // e.g. "5 caixas de Coca-Cola" or "Coca-Cola 3 un"
        const regex1 = new RegExp(`(\\d+)\\s*(?:un|cx|kg|lt|garrafas|latas|unidades)?\\s*(?:de)?\\s*${prodNameLower}`, 'i');
        const regex2 = new RegExp(`${prodNameLower}\\s*(\\d+)`, 'i');

        const m1 = text.match(regex1);
        const m2 = text.match(regex2);

        const qty = m1 ? parseInt(m1[1], 10) : m2 ? parseInt(m2[1], 10) : 1;

        items.push({
          skuOrName: prod.name,
          matchedProductId: prod.id,
          qty: isNaN(qty) || qty <= 0 ? 1 : qty,
          price: prod.price,
        });
      }
    }

    // Fallback if no specific products matched by catalog name
    if (items.length === 0) {
      const numberMatch = text.match(/(\d+)\s+([a-zA-ZÀ-ÿ\s]+)/);
      if (numberMatch && numberMatch[1] && numberMatch[2]) {
        const qty = parseInt(numberMatch[1], 10);
        const itemName = numberMatch[2].trim().replace(/(para|com|em|dinheiro|tpa).*$/i, '').trim();
        items.push({
          skuOrName: itemName || 'Artigo Comercial',
          qty: isNaN(qty) ? 1 : qty,
        });
      } else {
        items.push({
          skuOrName: 'Item de Venda',
          qty: 1,
        });
      }
    }

    return {
      intent,
      targetName,
      paymentMethod,
      items,
      notes: `Comando interpretado via Natural AI Parser: "${text}"`,
      confidence: 0.94,
    };
  }
}
