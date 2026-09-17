import {
  Product,
  StockMovement,
  SystemEvent,
  StockMovementType,
} from '../types/pulse';
import { EventBus } from './EventBus';

export class StockEngine {
  private products: Map<string, Product> = new Map();
  private movements: StockMovement[] = [];
  private eventBus: EventBus;

  constructor(initialProducts: Product[], eventBus: EventBus) {
    this.eventBus = eventBus;
    initialProducts.forEach((p) => this.products.set(p.id, { ...p }));
  }

  public getProducts(): Product[] {
    return Array.from(this.products.values());
  }

  public getProduct(id: string): Product | undefined {
    return this.products.get(id);
  }

  public getProductBySku(sku: string): Product | undefined {
    return Array.from(this.products.values()).find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase()
    );
  }

  public getMovements(): StockMovement[] {
    return [...this.movements];
  }

  public getAvailableStock(productId: string): number {
    const product = this.products.get(productId);
    if (!product) return 0;
    return product.currentStock - product.reservedStock;
  }

  public addProduct(product: Product): void {
    this.products.set(product.id, { ...product });
  }

  public process(event: SystemEvent): void {
    const { eventType, payload } = event;

    if (eventType === 'SALE_CREATED' || (eventType === 'DOCUMENT_ISSUED' && (payload.docType === 'INVOICE' || payload.docType === 'RECEIPT'))) {
      this.handleSaleReduction(payload);
    } else if (eventType === 'PURCHASE_CREATED') {
      this.handlePurchaseAddition(payload);
    } else if (eventType === 'STOCK_ADJUSTED') {
      this.handleStockAdjustment(payload);
    }
  }

  private handleSaleReduction(doc: any): void {
    if (!doc.lines || !Array.isArray(doc.lines)) return;

    doc.lines.forEach((line: any) => {
      const product = this.products.get(line.productId) || this.getProductBySku(line.sku);
      if (!product) return;

      // Handle Recipe / BOM explosion
      if (product.type === 'recipe' && product.recipe && product.recipe.length > 0) {
        product.recipe.forEach((ingredient) => {
          const rawProd = this.products.get(ingredient.productId);
          const deductQty = ingredient.qty * line.qty;

          if (rawProd) {
            rawProd.currentStock -= deductQty;
            const movement: StockMovement = {
              id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              productId: rawProd.id,
              productName: rawProd.name,
              sku: rawProd.sku,
              warehouseId: 'wh_main',
              branchId: doc.branchId || 'branch_marginal',
              qty: -deductQty,
              unitCost: ingredient.cost || rawProd.cost,
              totalCost: (ingredient.cost || rawProd.cost) * deductQty,
              type: 'SALE_OUT',
              docId: doc.id,
              docNumber: doc.docNumber,
              reason: `BOM: Consumo Receita [${product.name}] - Linha Qtd ${line.qty}`,
              timestamp: new Date().toISOString(),
            };
            this.movements.unshift(movement);

            // Check low stock trigger
            if (rawProd.currentStock <= rawProd.stockMin) {
              this.eventBus.publish({
                eventType: 'STOCK_LOW',
                tenantId: doc.tenantId || 'tenant_luanda_01',
                userId: doc.createdBy || 'system',
                userName: 'Stock Engine Monitor',
                source: 'ORCHESTRATOR',
                entityType: 'products',
                entityId: rawProd.id,
                payload: { product: rawProd, currentStock: rawProd.currentStock, stockMin: rawProd.stockMin },
                sideEffects: [`Alerta de Stock Crítico emitido para ${rawProd.name} (${rawProd.currentStock} ${rawProd.unit})`],
              });
            }
          }
        });
      } else if (product.type === 'good') {
        // Direct good stock reduction
        product.currentStock -= line.qty;
        const movement: StockMovement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          warehouseId: 'wh_main',
          branchId: doc.branchId || 'branch_marginal',
          qty: -line.qty,
          unitCost: product.cost,
          totalCost: product.cost * line.qty,
          type: 'SALE_OUT',
          docId: doc.id,
          docNumber: doc.docNumber,
          reason: `Venda Direta ${doc.docNumber || doc.id}`,
          timestamp: new Date().toISOString(),
        };
        this.movements.unshift(movement);

        // Check low stock trigger
        if (product.currentStock <= product.stockMin) {
          this.eventBus.publish({
            eventType: 'STOCK_LOW',
            tenantId: doc.tenantId || 'tenant_luanda_01',
            userId: doc.createdBy || 'system',
            userName: 'Stock Engine Monitor',
            source: 'ORCHESTRATOR',
            entityType: 'products',
            entityId: product.id,
            payload: { product, currentStock: product.currentStock, stockMin: product.stockMin },
            sideEffects: [`Gatilho de Reposição Acionado: ${product.name} abaixo do stock mínimo`],
          });
        }
      }
    });
  }

  private handlePurchaseAddition(purchase: any): void {
    const rawItems = purchase.lines || purchase.items;
    if (!rawItems || !Array.isArray(rawItems)) return;

    rawItems.forEach((item: any) => {
      const product = this.products.get(item.productId) || this.getProductBySku(item.sku);
      if (!product) return;

      const qty = item.qty || 1;
      const unitCost = item.allocatedCost || item.unitCost || product.cost;

      // Recalculate Weighted Average Cost (PMP)
      const currentTotalCost = product.currentStock * product.cost;
      const newTotalCost = currentTotalCost + (qty * unitCost);
      const newStock = product.currentStock + qty;
      product.cost = newStock > 0 ? Math.round(newTotalCost / newStock) : unitCost;
      product.currentStock = newStock;

      if (item.batchNumber) {
        product.batchNumber = item.batchNumber;
      }
      if (item.expiryDate) {
        product.expiryDate = item.expiryDate;
      }

      const movement: StockMovement = {
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        warehouseId: 'wh_main',
        branchId: 'branch_marginal',
        qty: qty,
        unitCost: unitCost,
        totalCost: unitCost * qty,
        type: 'PURCHASE_IN',
        docId: purchase.id,
        docNumber: purchase.internalRef || purchase.originDocNumber || purchase.docNumber,
        reason: `Entrada por Compra: Fornecedor ${purchase.supplierName || ''}`,
        timestamp: new Date().toISOString(),
      };
      this.movements.unshift(movement);
    });
  }

  private handleStockAdjustment(payload: { productId: string; qtyChange: number; reason: string; actor: string }): void {
    const product = this.products.get(payload.productId);
    if (!product) return;

    product.currentStock += payload.qtyChange;
    const movement: StockMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      warehouseId: 'wh_main',
      branchId: 'branch_marginal',
      qty: payload.qtyChange,
      unitCost: product.cost,
      totalCost: Math.abs(product.cost * payload.qtyChange),
      type: payload.qtyChange > 0 ? 'ADJUSTMENT' : 'LOSS',
      reason: payload.reason || 'Ajuste Manual de Inventário',
      timestamp: new Date().toISOString(),
    };
    this.movements.unshift(movement);
  }

  public adjustStock(productId: string, qtyChange: number, reason: string, actor: string): void {
    const product = this.products.get(productId);
    if (!product) return;

    this.eventBus.publish({
      eventType: 'STOCK_ADJUSTED',
      tenantId: 'tenant_luanda_01',
      userId: actor,
      userName: actor,
      source: 'POS',
      entityType: 'products',
      entityId: productId,
      payload: { productId, qtyChange, reason, actor },
      sideEffects: [`Ajuste físico de ${qtyChange > 0 ? '+' + qtyChange : qtyChange} ${product.unit} em ${product.name}`],
    });
  }

  public upsertProduct(product: Product): void {
    const existing = this.products.get(product.id);
    const active = product.active !== undefined ? product.active : (existing?.active ?? true);
    this.products.set(product.id, { ...existing, ...product, active });
  }

  /**
   * Safe deactivation instead of physical deletion
   * If a product has movements, it cannot be physically removed to preserve SAF-T / audit integrity.
   */
  public deactivateProduct(productId: string, actor: string = 'system'): { success: boolean; message: string } {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, message: 'Artigo não encontrado no catálogo.' };
    }

    product.active = false;
    this.products.set(productId, { ...product });

    this.eventBus.publish({
      eventType: 'PRODUCT_UPDATED',
      tenantId: 'tenant_luanda_01',
      userId: actor,
      userName: actor,
      source: 'ORCHESTRATOR',
      entityType: 'products',
      entityId: productId,
      payload: { action: 'DEACTIVATED', productId, productName: product.name },
      sideEffects: [`Artigo [${product.sku}] ${product.name} desativado no Catálogo Mestre (não visível para novas vendas)`],
    });

    return { success: true, message: `Artigo ${product.name} desativado com sucesso.` };
  }

  /**
   * Reactivates a deactivated product
   */
  public activateProduct(productId: string, actor: string = 'system'): { success: boolean; message: string } {
    const product = this.products.get(productId);
    if (!product) {
      return { success: false, message: 'Artigo não encontrado no catálogo.' };
    }

    product.active = true;
    this.products.set(productId, { ...product });

    this.eventBus.publish({
      eventType: 'PRODUCT_UPDATED',
      tenantId: 'tenant_luanda_01',
      userId: actor,
      userName: actor,
      source: 'ORCHESTRATOR',
      entityType: 'products',
      entityId: productId,
      payload: { action: 'ACTIVATED', productId, productName: product.name },
      sideEffects: [`Artigo [${product.sku}] ${product.name} reativado no Catálogo Mestre`],
    });

    return { success: true, message: `Artigo ${product.name} reativado com sucesso.` };
  }
}
