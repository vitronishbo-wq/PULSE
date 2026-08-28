import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    engine: 'PULSE.OS — ULCE v2.0',
    timestamp: new Date().toISOString(),
  });
});

// AI Command Intent Parser Endpoint
app.post('/api/v1/ai/parse', async (req: Request, res: Response) => {
  const { prompt, context } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Field "prompt" is required' });
  }

  const ai = getGeminiClient();

  // If Gemini API is configured, use Gemini 3.7 Flash structured outputs
  if (ai) {
    try {
      const systemInstruction = `You are the PULSE.OS ULCE (Universal Lightweight Commerce Engine) Natural Language Intent Parser.
Your job is to translate free-form operator text (in Portuguese or English) into a strict structured Command JSON.

Supported intents:
- CREATE_SALE: sale to customer (e.g. "3 cxs de água para o João a 250k", "Venda de 2 cafés e 1 bolo", "Sell 5 beers")
- CREATE_PURCHASE: stock purchase from supplier (e.g. "Compra 10 sacos arroz a 12000 do Fornecedor AngoAlimentos")
- CREATE_QUOTATION: quotation/orçamento for customer
- CREATE_RECEIPT: direct receipt / payment received from customer
- CREATE_PAYMENT: payment made to supplier or expense
- CREATE_RETURN: return of items

Available Products context: ${JSON.stringify(context?.products || [])}
Available Customers context: ${JSON.stringify(context?.customers || [])}
Available Suppliers context: ${JSON.stringify(context?.suppliers || [])}

Parse quantities (e.g., '3 cxs' -> qty 3, '50kg' -> qty 50), prices (e.g., '250k' -> 250000, '15.000 Kz' -> 15000), customer/supplier names, payment method ('CASH', 'CARD', 'BANK_TRANSFER', 'CREDIT').
If a product or customer loosely matches an existing one in the context, use its exact name/id/sku.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Operator command: "${prompt}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intent: {
                type: Type.STRING,
                description: 'The classified intent: CREATE_SALE, CREATE_PURCHASE, CREATE_QUOTATION, CREATE_RECEIPT, CREATE_PAYMENT, CREATE_RETURN',
              },
              targetName: {
                type: Type.STRING,
                description: 'Customer or Supplier name parsed from text',
              },
              targetId: {
                type: Type.STRING,
                description: 'Matched entity ID if found in context, else empty',
              },
              paymentMethod: {
                type: Type.STRING,
                description: 'CASH, CARD, BANK_TRANSFER, or CREDIT',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    skuOrName: { type: Type.STRING, description: 'Product name or SKU' },
                    matchedProductId: { type: Type.STRING, description: 'Matched product ID from context' },
                    qty: { type: Type.NUMBER, description: 'Quantity (default 1)' },
                    price: { type: Type.NUMBER, description: 'Unit price or total parsed (null if using catalog price)' },
                    notes: { type: Type.STRING },
                  },
                  required: ['skuOrName', 'qty'],
                },
              },
              notes: { type: Type.STRING, description: 'Additional observations' },
              confidence: { type: Type.NUMBER, description: 'Confidence score 0 to 1' },
            },
            required: ['intent', 'items'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, command: parsed, source: 'gemini-3.7-flash' });
    } catch (err: any) {
      console.warn('Gemini parser error, falling back to heuristic parser:', err?.message);
    }
  }

  // Robust Heuristic / Rule-based Fallback Parser
  const fallback = heuristicParse(prompt, context);
  return res.json({ success: true, command: fallback, source: 'pulse-heuristic' });
});

// Helper for heuristic parser
function heuristicParse(text: string, context: any) {
  const lower = text.toLowerCase();
  let intent = 'CREATE_SALE';
  if (lower.includes('compra') || lower.includes('purchase') || lower.includes('fornecedor')) {
    intent = 'CREATE_PURCHASE';
  } else if (lower.includes('orçamento') || lower.includes('cotacao') || lower.includes('quotation')) {
    intent = 'CREATE_QUOTATION';
  } else if (lower.includes('recibo') || lower.includes('recebimento') || lower.includes('liquid')) {
    intent = 'CREATE_RECEIPT';
  } else if (lower.includes('pagamento') || lower.includes('paga ')) {
    intent = 'CREATE_PAYMENT';
  } else if (lower.includes('devolucao') || lower.includes('retorno') || lower.includes('return')) {
    intent = 'CREATE_RETURN';
  }

  // Parse price (e.g. 250k, 250000, 15000 kz)
  let parsedPrice: number | undefined = undefined;
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (kMatch) {
    parsedPrice = parseFloat(kMatch[1].replace(',', '.')) * 1000;
  } else {
    const numMatch = text.match(/(\d+(?:[.,]\d{3})*(?:[.,]\d+)?)\s*(?:kz|usd|€|\$|kwanzas)?/i);
    if (numMatch && parseFloat(numMatch[1]) > 50) {
      parsedPrice = parseFloat(numMatch[1].replace(/\./g, '').replace(',', '.'));
    }
  }

  // Parse items
  const items: any[] = [];
  const qtyMatch = text.match(/^(\d+)\s*(?:cx|cxs|un|unid|garrafas|latas|kg|sacos)?\s*(?:de|da|do)?\s+([a-zA-ZÀ-ÿ0-9\s]+?)(?:\s+(?:ao|para|p\/|pelo|a|ao cliente|do fornecedor|at)\s+|$)/i);
  
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[1], 10) || 1;
    const rawProd = qtyMatch[2].trim();
    items.push({
      skuOrName: rawProd,
      qty: qty,
      price: parsedPrice,
    });
  } else {
    items.push({
      skuOrName: text.split(' ')[0] || 'Artigo Geral',
      qty: 1,
      price: parsedPrice,
    });
  }

  // Customer or Supplier matching
  let targetName = 'Consumidor Final';
  const targetMatch = text.match(/(?:para|ao|ao cliente|de|do fornecedor|to|client|cliente)\s+([A-ZÀ-ÿa-z0-9\s]+?)(?:\s+(?:a|at|por|valor|total|com|$))/i);
  if (targetMatch && targetMatch[1]) {
    targetName = targetMatch[1].trim();
  }

  let paymentMethod = 'CASH';
  if (lower.includes('tpa') || lower.includes('cartao') || lower.includes('card') || lower.includes('multicaixa')) {
    paymentMethod = 'CARD';
  } else if (lower.includes('transferencia') || lower.includes('banco') || lower.includes('bank') || lower.includes('iban')) {
    paymentMethod = 'BANK_TRANSFER';
  } else if (lower.includes('credito') || lower.includes('a prazo') || lower.includes('credit') || lower.includes('30 dias')) {
    paymentMethod = 'CREDIT';
  }

  return {
    intent,
    targetName,
    paymentMethod,
    items,
    notes: `Comando interpretado: "${text}"`,
    confidence: 0.88,
  };
}

async function startServer() {
  // Vite middleware for dev or static file serving for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PULSE.OS] ULCE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
