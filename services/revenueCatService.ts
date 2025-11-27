import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage
} from '@revenuecat/purchases-capacitor';
import { supabase } from './supabase';

/**
 * RevenueCat In-App Purchase Service
 * 
 * Features:
 * - Premium subscription management
 * - iOS & Android support
 * - Purchase restoration
 * - Subscription status sync with Supabase
 */

export const revenueCatService = {
  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId: string): Promise<void> {
    try {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

      await Purchases.configure({
        apiKey: (import.meta as any).env?.VITE_REVENUECAT_API_KEY || '',
        appUserID: userId,
      });

      console.log('RevenueCat initialized for user:', userId);
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
      throw error;
    }
  },

  /**
   * Get available subscription offerings
   */
  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();

      if (offerings && offerings.current) {
        return offerings.current;
      }

      console.warn('No current offering available');
      return null;
    } catch (error) {
      console.error('Error getting offerings:', error);
      return null;
    }
  },

  /**
   * Purchase premium subscription
   */
  async purchasePremium(packageToPurchase: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const purchase = await Purchases.purchasePackage({ aPackage: packageToPurchase });

      // Sync with Supabase
      if (purchase && purchase.customerInfo) {
        await this.syncSubscriptionStatus(purchase.customerInfo);
        return purchase.customerInfo;
      }

      throw new Error('Purchase failed');
    } catch (error: any) {
      // User cancelled purchase
      if (error.code === '1' || error.message?.includes('cancel')) {
        console.log('User cancelled purchase');
        throw new Error('PURCHASE_CANCELLED');
      }

      console.error('Purchase error:', error);
      throw error;
    }
  },

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const restore = await Purchases.restorePurchases();

      // Sync with Supabase
      if (restore && restore.customerInfo) {
        await this.syncSubscriptionStatus(restore.customerInfo);
        return restore.customerInfo;
      }

      throw new Error('Restore failed');
    } catch (error) {
      console.error('Restore purchases error:', error);
      throw error;
    }
  },

  /**
   * Check if user has active premium subscription
   */
  async isPremium(): Promise<boolean> {
    try {
      const info = await Purchases.getCustomerInfo();
      return info && info.customerInfo ? this.hasPremiumEntitlement(info.customerInfo) : false;
    } catch (error) {
      console.error('Error checking premium status:', error);
      return false;
    }
  },

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      const info = await Purchases.getCustomerInfo();
      return info && info.customerInfo ? info.customerInfo : null;
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  },

  /**
   * Sync subscription status with Supabase
   */
  async syncSubscriptionStatus(customerInfo: CustomerInfo): Promise<void> {
    try {
      const isPremium = this.hasPremiumEntitlement(customerInfo);
      const expirationDate = this.getExpirationDate(customerInfo);

      await supabase
        .from('users')
        .update({
          is_premium: isPremium,
          premium_expires_at: expirationDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerInfo.originalAppUserId);

      console.log('Subscription status synced:', { isPremium, expirationDate });
    } catch (error) {
      console.error('Error syncing subscription status:', error);
    }
  },

  /**
   * Check if customer has premium entitlement
   */
  hasPremiumEntitlement(customerInfo: CustomerInfo): boolean {
    return customerInfo.entitlements.active['premium'] !== undefined;
  },

  /**
   * Get premium subscription expiration date
   */
  getExpirationDate(customerInfo: CustomerInfo): string | null {
    const premiumEntitlement = customerInfo.entitlements.active['premium'];

    if (premiumEntitlement && premiumEntitlement.expirationDate) {
      return premiumEntitlement.expirationDate;
    }

    return null;
  },

  /**
   * Get subscription info for display
   */
  async getSubscriptionInfo(): Promise<{
    isPremium: boolean;
    expiresAt: string | null;
    productId: string | null;
    willRenew: boolean;
  }> {
    const customerInfo = await this.getCustomerInfo();

    if (!customerInfo) {
      return {
        isPremium: false,
        expiresAt: null,
        productId: null,
        willRenew: false
      };
    }

    const premiumEntitlement = customerInfo.entitlements.active['premium'];

    return {
      isPremium: !!premiumEntitlement,
      expiresAt: premiumEntitlement?.expirationDate || null,
      productId: premiumEntitlement?.productIdentifier || null,
      willRenew: premiumEntitlement?.willRenew || false
    };
  }
};
