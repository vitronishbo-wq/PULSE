import {
  BusinessSegment,
  ModuleId,
  SubscriptionPricingBreakdown,
} from '../types/pulse';
import { ProfileEngine } from './ProfileEngine';

export interface PriceCalculationInput {
  segment: BusinessSegment;
  selectedModules: ModuleId[];
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  currency?: string;
}

export class PricingEngine {
  private static instance: PricingEngine;
  private profileEngine: ProfileEngine;

  private constructor() {
    this.profileEngine = ProfileEngine.getInstance();
  }

  public static getInstance(): PricingEngine {
    if (!PricingEngine.instance) {
      PricingEngine.instance = new PricingEngine();
    }
    return PricingEngine.instance;
  }

  /**
   * Calculates the exact subscription pricing structure
   */
  public calculateSubscription(input: PriceCalculationInput): SubscriptionPricingBreakdown {
    const profile = this.profileEngine.getProfile(input.segment);
    const baseMonthlyPrice = profile.basePrice;

    // Identify which selected modules are addons with price > 0
    const addonModules: { id: ModuleId; name: string; price: number }[] = [];
    let addonMonthlyTotal = 0;

    input.selectedModules.forEach((modId) => {
      const def = this.profileEngine.getModule(modId);
      if (def && def.price > 0) {
        // If not in profile defaults or has a dedicated price
        const isDefault = profile.defaultModules.includes(modId);
        if (!isDefault || def.price > 0) {
          addonModules.push({ id: modId, name: def.name, price: def.price });
          addonMonthlyTotal += def.price;
        }
      }
    });

    const monthlySubtotal = baseMonthlyPrice + addonMonthlyTotal;

    // Multiplier by billing cycle
    let cycleMonths = 1;
    let discountPercent = 0;

    if (input.billingCycle === 'QUARTERLY') {
      cycleMonths = 3;
      discountPercent = 5; // 5% discount for 3 months
    } else if (input.billingCycle === 'ANNUAL') {
      cycleMonths = 12;
      discountPercent = 15; // 15% discount for 1 year
    }

    const grossCycleTotal = monthlySubtotal * cycleMonths;
    const discountAmount = Math.round(grossCycleTotal * (discountPercent / 100));
    const netTotal = grossCycleTotal - discountAmount;

    // Standard Angola IVA (14%)
    const taxRatePercent = 14;
    const taxAmount = Math.round(netTotal * (taxRatePercent / 100));
    const totalPayable = netTotal + taxAmount;

    return {
      segment: input.segment,
      basePrice: baseMonthlyPrice,
      billingCycle: input.billingCycle,
      addonModules,
      addonPriceTotal: addonMonthlyTotal,
      subtotal: grossCycleTotal,
      cycleDiscountPercent: discountPercent,
      cycleDiscountAmount: discountAmount,
      taxRatePercent,
      taxAmount,
      totalPayable,
      currency: input.currency || 'Kz',
    };
  }
}
